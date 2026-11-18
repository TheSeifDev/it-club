import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const WINDOW_MS = 10 * 60 * 1_000;
const MAX_REQUESTS = 5;
const localBuckets = new Map<string, { count: number; resetAt: number }>();
let remoteLimiter: Ratelimit | null | undefined;

function getRemoteLimiter(): Ratelimit | null {
  if (remoteLimiter !== undefined) return remoteLimiter;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  remoteLimiter = url && token
    ? new Ratelimit({ redis: new Redis({ url, token }), limiter: Ratelimit.slidingWindow(MAX_REQUESTS, "10 m"), prefix: "site-contact" })
    : null;
  return remoteLimiter;
}

export async function checkContactRateLimit(key: string, now: number = Date.now()): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const remote = getRemoteLimiter();
  if (remote) {
    try {
      const result = await remote.limit(key);
      return { allowed: result.success, retryAfterSeconds: Math.max(1, Math.ceil((result.reset - now) / 1_000)) };
    } catch {
      // Keep a local safety limiter if the optional distributed backend is unavailable.
    }
  }

  for (const [bucketKey, bucket] of localBuckets) {
    if (bucket.resetAt <= now) localBuckets.delete(bucketKey);
  }
  const bucket = localBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    localBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (localBuckets.size > 10_000) {
      const firstKey = localBuckets.keys().next().value;
      if (firstKey) localBuckets.delete(firstKey);
    }
    return { allowed: true, retryAfterSeconds: Math.ceil(WINDOW_MS / 1_000) };
  }
  bucket.count += 1;
  return {
    allowed: bucket.count <= MAX_REQUESTS,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1_000)),
  };
}
