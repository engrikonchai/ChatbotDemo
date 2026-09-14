import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Regression guard for "Do not revert to LocalStorage as the primary
 * database" / "No LocalStorage lead fallback is used after a database
 * error": the Phase-1 LocalStorage-as-source-of-truth modules must stay
 * deleted, and nothing in app/ or components/ may import from them —
 * including as an error-path fallback.
 */

const root = path.resolve(import.meta.dirname, "..");
const removedModules = [
  "lib/storage/leads.ts",
  "lib/storage/conversations.ts",
  "lib/storage/settings.ts",
  "lib/storage/demo.ts",
  "lib/storage/types.ts",
  "lib/storage/keys.ts",
];

function listSourceFiles(dir: string): string[] {
  let results: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry.startsWith(".")) continue;
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      results = results.concat(listSourceFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      results.push(fullPath);
    }
  }
  return results;
}

describe("no LocalStorage lead/conversation fallback", () => {
  it("the Phase-1 LocalStorage-as-database modules no longer exist", () => {
    for (const relativePath of removedModules) {
      expect(existsSync(path.join(root, relativePath))).toBe(false);
    }
  });

  it("nothing in app/ or components/ imports a removed LocalStorage-as-database module", () => {
    const files = [...listSourceFiles(path.join(root, "app")), ...listSourceFiles(path.join(root, "components"))];
    const offenders: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      for (const relativePath of removedModules) {
        const specifier = "@/" + relativePath.replace(/\.ts$/, "");
        if (content.includes(specifier)) offenders.push(`${path.relative(root, file)} imports ${specifier}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("the only LocalStorage module left (lib/storage/storage.ts) is a generic helper with no lead/conversation/business concepts", () => {
    const content = readFileSync(path.join(root, "lib/storage/storage.ts"), "utf8");
    expect(content).not.toMatch(/lead/i);
    expect(content).not.toMatch(/conversation/i);
    expect(content).not.toMatch(/business/i);
  });
});
