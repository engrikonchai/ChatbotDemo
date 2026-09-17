import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Static checks that the public site never gets swept up by the
 * dashboard's auth guard. `proxy.ts` runs on the Edge before any route
 * handler, so a wrong `matcher` there would redirect the homepage,
 * `/api/widget/*`, or the auth pages themselves to `/login` — the exact
 * class of bug this fix addresses ("whether middleware accidentally
 * redirects /api/widget/* to /login").
 */

const proxySource = readFileSync(path.resolve(import.meta.dirname, "../proxy.ts"), "utf8");
const pageSource = readFileSync(path.resolve(import.meta.dirname, "../app/page.tsx"), "utf8");
const dashboardLayoutSource = readFileSync(path.resolve(import.meta.dirname, "../app/dashboard/layout.tsx"), "utf8");

describe("proxy.ts matcher", () => {
  it("only ever targets /dashboard routes", () => {
    const matcherMatch = proxySource.match(/matcher:\s*\[([^\]]*)\]/);
    expect(matcherMatch).not.toBeNull();
    // Pull out every quoted string literal inside the matcher array.
    const entries = [...matcherMatch![1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
    expect(entries.length).toBeGreaterThan(0);

    for (const entry of entries) {
      expect(entry.startsWith("/dashboard")).toBe(true);
    }
  });

  it("does not mention /api, /login, /signup or the homepage anywhere in its matcher", () => {
    const matcherMatch = proxySource.match(/matcher:\s*(\[[^\]]*\])/)![1];
    expect(matcherMatch).not.toMatch(/\/api/);
    expect(matcherMatch).not.toMatch(/\/login/);
    expect(matcherMatch).not.toMatch(/\/signup/);
  });

  it("only redirects to /login for paths under /dashboard", () => {
    // The condition guarding the /login redirect must itself check
    // pathname.startsWith("/dashboard") — i.e. the redirect can't fire
    // for any other path.
    const conditionLine = proxySource.split("\n").find((line) => line.includes("if (!user"));
    expect(conditionLine).toBeDefined();
    expect(conditionLine).toMatch(/pathname\.startsWith\("\/dashboard"\)/);
  });
});

describe("app/page.tsx — the public homepage", () => {
  it("never calls redirect() or requires a signed-in user", () => {
    expect(pageSource).not.toMatch(/redirect\(/);
    expect(pageSource).not.toMatch(/auth\.getUser\(\)/);
    expect(pageSource).not.toMatch(/auth\.getSession\(\)/);
  });

  it("never depends on a per-owner cookie session client for its own rendering", () => {
    // The homepage no longer resolves anything via Supabase itself (the
    // old in-house widget's server-side lookup was disabled in favor of
    // the ai-receptionist-platform script — see components/chat/ChatWidget.tsx
    // and tests/widget-migration.test.ts). If that ever comes back, it
    // must keep using the service-role admin client, never a per-owner
    // session client whose behavior would depend on who's logged in.
    expect(pageSource).not.toMatch(/createSupabaseServerClient/);
  });
});

describe("app/dashboard/layout.tsx — the real authorization boundary", () => {
  it("checks for a signed-in user and redirects when there isn't one", () => {
    expect(dashboardLayoutSource).toMatch(/auth\.getUser\(\)/);
    expect(dashboardLayoutSource).toMatch(/if\s*\(!user\)/);
    expect(dashboardLayoutSource).toMatch(/redirect\(["']\/login/);
  });
});
