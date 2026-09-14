import { beforeEach, describe, expect, it } from "vitest";
import { __resetRateLimitsForTests, checkRateLimit, getRequestIp } from "@/lib/server/rate-limit";

beforeEach(() => {
  __resetRateLimitsForTests();
});

describe("checkRateLimit", () => {
  it("allows requests up to the limit", () => {
    const key = "test:key:a";
    for (let i = 0; i < 5; i += 1) {
      expect(checkRateLimit(key, { limit: 5, windowMs: 60_000 }).allowed).toBe(true);
    }
  });

  it("blocks requests once the limit is exceeded within the window", () => {
    const key = "test:key:b";
    for (let i = 0; i < 3; i += 1) {
      checkRateLimit(key, { limit: 3, windowMs: 60_000 });
    }
    const result = checkRateLimit(key, { limit: 3, windowMs: 60_000 });
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks separate keys independently", () => {
    checkRateLimit("a", { limit: 1, windowMs: 60_000 });
    const blockedA = checkRateLimit("a", { limit: 1, windowMs: 60_000 });
    const allowedB = checkRateLimit("b", { limit: 1, windowMs: 60_000 });
    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);
  });

  it("resets the counter once the window has elapsed", () => {
    const key = "test:key:c";
    checkRateLimit(key, { limit: 1, windowMs: 1 });
    // Force the stored window to look like it started well in the past.
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const result = checkRateLimit(key, { limit: 1, windowMs: 1 });
        expect(result.allowed).toBe(true);
        resolve();
      }, 5);
    });
  });
});

describe("getRequestIp", () => {
  it("reads the first address from x-forwarded-for", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.5, 70.41.3.18" },
    });
    expect(getRequestIp(request)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip", () => {
    const request = new Request("https://example.com", { headers: { "x-real-ip": "198.51.100.7" } });
    expect(getRequestIp(request)).toBe("198.51.100.7");
  });

  it("falls back to 'unknown' when no IP header is present", () => {
    const request = new Request("https://example.com");
    expect(getRequestIp(request)).toBe("unknown");
  });
});
