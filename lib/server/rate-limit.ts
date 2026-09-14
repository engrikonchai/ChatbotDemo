import "server-only";

/**
 * A small in-memory, fixed-window rate limiter for the public widget
 * API routes.
 *
 * Known limitation: this state lives in the Node process's memory. On
 * a serverless/multi-instance deployment (e.g. Vercel) each instance
 * has its own counters, so the effective limit is "N requests per
 * window, per instance" rather than a hard global cap. That's still
 * useful for absorbing a single misbehaving browser tab or a basic
 * script, which is what's practical without adding an external store
 * (e.g. Redis/Upstash) in Phase 2. See README's "remaining limitations".
 */

interface Bucket {
  count: number;
  windowStartedAt: number;
}

const buckets = new Map<string, Bucket>();

// Bound memory use: buckets are cheap, but without a cap a sustained
// attack from many distinct keys could grow this map indefinitely.
const MAX_TRACKED_KEYS = 20_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export interface RateLimitOptions {
  /** Maximum requests allowed per window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

/** Checks and increments the counter for `key`. Cheap, synchronous, in-memory. */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStartedAt >= options.windowMs) {
    if (buckets.size >= MAX_TRACKED_KEYS) {
      pruneOldestBuckets();
    }
    buckets.set(key, { count: 1, windowStartedAt: now });
    return { allowed: true, remaining: options.limit - 1, retryAfterMs: 0 };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: options.windowMs - (now - existing.windowStartedAt),
    };
  }

  existing.count += 1;
  return { allowed: true, remaining: options.limit - existing.count, retryAfterMs: 0 };
}

function pruneOldestBuckets(): void {
  // Simple, cheap eviction: drop the oldest quarter of tracked windows.
  const entries = [...buckets.entries()].sort((a, b) => a[1].windowStartedAt - b[1].windowStartedAt);
  const toRemove = Math.floor(entries.length / 4) || 1;
  for (let i = 0; i < toRemove; i += 1) {
    buckets.delete(entries[i][0]);
  }
}

/** Only exported for tests — resets all counters. */
export function __resetRateLimitsForTests(): void {
  buckets.clear();
}

/** Best-effort client IP extraction behind common proxies (Vercel, etc.). */
export function getRequestIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
