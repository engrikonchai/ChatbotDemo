import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * These tests can't spin up a real Postgres instance with RLS in this
 * environment, so they check the actual migration SQL as a static
 * contract instead: every table has RLS enabled, every policy is scoped
 * through `owner_id = auth.uid()` (directly or via a join), and nothing
 * grants the kind of unconditional access ("Public user cannot read
 * conversations", "Owner A cannot access Owner B's data") the brief
 * explicitly forbids. This is a safety net for accidental regressions —
 * it is not a substitute for actually exercising RLS against a live
 * project. See README.md → "Verifying RLS manually" for that.
 */

const migrationsDir = path.resolve(import.meta.dirname, "../supabase/migrations");
const rlsSql = readFileSync(path.join(migrationsDir, "20260201000200_row_level_security.sql"), "utf8");
const coreSql = readFileSync(path.join(migrationsDir, "20260201000000_core_tables.sql"), "utf8");
const conversationSql = readFileSync(path.join(migrationsDir, "20260201000100_conversation_tables.sql"), "utf8");

const ALL_TABLES = [
  "profiles",
  "businesses",
  "knowledge_items",
  "conversations",
  "messages",
  "leads",
  "handoffs",
  "widget_settings",
];

describe("Row Level Security migration — static contract", () => {
  it("enables RLS on every table", () => {
    for (const table of ALL_TABLES) {
      expect(rlsSql).toMatch(new RegExp(`alter table public\\.${table} enable row level security;`));
    }
  });

  it("never grants blanket access with `using (true)`", () => {
    expect(rlsSql).not.toMatch(/using\s*\(\s*true\s*\)/i);
  });

  it("never grants the anon/public role explicit access", () => {
    expect(rlsSql).not.toMatch(/to\s+anon/i);
    expect(rlsSql).not.toMatch(/to\s+public/i);
  });

  it("scopes every business-owned table's policies through auth.uid()", () => {
    // Every policy body in this file should reference auth.uid() —
    // if a policy exists that doesn't, it isn't actually tenant-scoped.
    const policyBlocks = rlsSql.split(/create policy/i).slice(1);
    expect(policyBlocks.length).toBeGreaterThan(0);
    for (const block of policyBlocks) {
      // Take just this policy's statement (up to the closing semicolon).
      const statement = block.split(";")[0];
      expect(statement).toMatch(/auth\.uid\(\)/);
    }
  });

  it("conversations and messages have no insert/update policy for the owner role (only the service-role widget routes write them)", () => {
    const conversationsPolicies = rlsSql.match(/create policy "conversations_[a-z_]+"/g) ?? [];
    const messagesPolicies = rlsSql.match(/create policy "messages_[a-z_]+"/g) ?? [];
    expect(conversationsPolicies.some((p) => p.includes("insert"))).toBe(false);
    expect(messagesPolicies.some((p) => p.includes("insert"))).toBe(false);
    expect(messagesPolicies.some((p) => p.includes("update"))).toBe(false);
  });
});

describe("Table definitions — constraints exist for every documented rule", () => {
  it("messages.role is constrained to user/assistant/system", () => {
    expect(conversationSql).toMatch(/role in \('user', 'assistant', 'system'\)/);
  });

  it("conversations.channel is constrained to website/instagram/whatsapp", () => {
    expect(conversationSql).toMatch(/channel in \('website', 'instagram', 'whatsapp'\)/);
  });

  it("conversations.status is constrained to open/closed/handed_off", () => {
    expect(conversationSql).toMatch(/status in \('open', 'closed', 'handed_off'\)/);
  });

  it("leads.status is constrained to new/contacted/confirmed/lost", () => {
    expect(conversationSql).toMatch(/status in \('new', 'contacted', 'confirmed', 'lost'\)/);
  });

  it("handoffs.status is constrained to new/contacted/resolved", () => {
    expect(conversationSql).toMatch(/status in \('new', 'contacted', 'resolved'\)/);
  });

  it("leads.guest_count is constrained to 1-4 when supplied", () => {
    expect(conversationSql).toMatch(/guest_count is null or guest_count between 1 and 4/);
  });

  it("leads enforces check_out after check_in", () => {
    expect(conversationSql).toMatch(/check_out is null or check_out > check_in/);
  });

  it("businesses.supported_languages must not be empty", () => {
    expect(coreSql).toMatch(/cardinality\(supported_languages\) > 0/);
  });
});
