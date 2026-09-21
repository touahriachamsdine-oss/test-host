const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const CLEANUP_EVERY = 1_000;

let requestCount = 0;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec?: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number = WINDOW_MS
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    requestCount++;
    if (requestCount % CLEANUP_EVERY === 0) {
      for (const [k, b] of buckets) {
        if (b.resetAt <= now) buckets.delete(k);
      }
    }
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }

  bucket.count += 1;
  return { allowed: true };
}