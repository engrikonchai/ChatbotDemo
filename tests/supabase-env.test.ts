import { afterEach, beforeEach, describe, expect, it } from "vitest";

const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_WIDGET_ID"] as const;
let originalEnv: Record<string, string | undefined>;

beforeEach(() => {
  originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  ENV_KEYS.forEach((key) => delete process.env[key]);
});

afterEach(() => {
  ENV_KEYS.forEach((key) => {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  });
});

describe("Supabase env helpers with missing environment variables", () => {
  it("getPublicSupabaseEnv returns null when nothing is set", async () => {
    const { getPublicSupabaseEnv } = await import("@/lib/supabase/env");
    expect(getPublicSupabaseEnv()).toBeNull();
  });

  it("isSupabaseConfigured is false when either variable is missing", async () => {
    const { isSupabaseConfigured } = await import("@/lib/supabase/env");
    expect(isSupabaseConfigured()).toBe(false);

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    expect(isSupabaseConfigured()).toBe(false); // anon key still missing

    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    expect(isSupabaseConfigured()).toBe(true);
  });

  it("getPublicWidgetId is null when NEXT_PUBLIC_WIDGET_ID is unset", async () => {
    const { getPublicWidgetId } = await import("@/lib/supabase/env");
    expect(getPublicWidgetId()).toBeNull();
  });

  it("isWidgetConfigured requires both Supabase config and a widget id", async () => {
    const { isWidgetConfigured } = await import("@/lib/supabase/env");
    expect(isWidgetConfigured()).toBe(false);

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    expect(isWidgetConfigured()).toBe(false); // no widget id yet

    process.env.NEXT_PUBLIC_WIDGET_ID = "11111111-1111-4111-8111-111111111111";
    expect(isWidgetConfigured()).toBe(true);
  });
});

describe("Supabase admin client with a missing service-role key", () => {
  it("createSupabaseAdminClient returns null rather than throwing", async () => {
    const originalServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";

    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    expect(createSupabaseAdminClient()).toBeNull();

    if (originalServiceRole === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRole;
  });
});
