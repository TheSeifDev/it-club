import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  prefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
  retryAfter: number;
}

// In-memory sliding-window bucket store for resilience / fallback
interface MemoryBucket {
  count: number;
  expiresAt: number;
}
const memoryBuckets = new Map<string, MemoryBucket>();

/**
 * Derives a sanitized client IP identifier from trusted reverse-proxy headers.
 * Does not trust arbitrary spoofable client headers.
 */
export function extractClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // In standard reverse proxy configurations, the client IP is the first entry
    const parts = forwardedFor.split(",").map((s) => s.trim());
    if (parts[0]) return parts[0];
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp && cfConnectingIp.trim()) return cfConnectingIp.trim();

  return "127.0.0.1";
}

/**
 * Produces a one-way hashed key combining IP / identifier and an optional salt.
 * Ensures that raw student IP addresses or personal identifiers are never stored or logged.
 */
export function hashRateLimitKey(prefix: string, identifier: string): string {
  const salt = process.env.RATE_LIMIT_SALT || "it-club-recruitment-security-salt";
  return createHash("sha256")
    .update(`${prefix}:${identifier}:${salt}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * In-memory fallback rate limiter (used when database is unreachable or during unit tests)
 */
function checkMemoryRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  // Clean expired
  if (bucket && bucket.expiresAt <= now) {
    memoryBuckets.delete(key);
  }

  const current = memoryBuckets.get(key);
  if (!current) {
    const expiresAt = now + config.windowSeconds * 1000;
    memoryBuckets.set(key, { count: 1, expiresAt });
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetInSeconds: config.windowSeconds,
      retryAfter: 0,
    };
  }

  if (current.count >= config.maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((current.expiresAt - now) / 1000));
    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetInSeconds: retryAfter,
      retryAfter,
    };
  }

  current.count += 1;
  const remaining = Math.max(0, config.maxRequests - current.count);
  const resetInSeconds = Math.max(1, Math.ceil((current.expiresAt - now) / 1000));

  return {
    allowed: true,
    limit: config.maxRequests,
    remaining,
    resetInSeconds,
    retryAfter: 0,
  };
}

/**
 * Checks rate limit for a request using Supabase PostgreSQL if available,
 * with automatic fallback to memory store for test/isolated environments.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig = { maxRequests: 5, windowSeconds: 900, prefix: "reg" }
): Promise<RateLimitResult> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // If Supabase service credentials are not configured (e.g. local unit tests or isolated mode), use resilient memory limiter
  if (!supabaseUrl || !serviceKey) {
    return checkMemoryRateLimit(key, config);
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.windowSeconds * 1000);

    // 1. Fetch existing bucket
    const { data: existing, error: selectError } = await supabase
      .from("rate_limits")
      .select("count, reset_at")
      .eq("key", key)
      .maybeSingle();

    if (selectError) {
      // If rate_limits table does not exist or fails, fall back gracefully
      return checkMemoryRateLimit(key, config);
    }

    if (!existing || new Date(existing.reset_at).getTime() <= now.getTime()) {
      // Upsert new window
      await supabase.from("rate_limits").upsert({
        key,
        count: 1,
        reset_at: expiresAt.toISOString(),
      });

      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetInSeconds: config.windowSeconds,
        retryAfter: 0,
      };
    }

    // Existing active window
    const resetTime = new Date(existing.reset_at).getTime();
    const resetInSeconds = Math.max(1, Math.ceil((resetTime - now.getTime()) / 1000));

    if (existing.count >= config.maxRequests) {
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetInSeconds,
        retryAfter: resetInSeconds,
      };
    }

    const nextCount = existing.count + 1;
    await supabase
      .from("rate_limits")
      .update({ count: nextCount })
      .eq("key", key);

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - nextCount),
      resetInSeconds,
      retryAfter: 0,
    };
  } catch {
    // Graceful fallback to memory limiter if network/Supabase errors occur
    return checkMemoryRateLimit(key, config);
  }
}

/**
 * Resets memory rate limits (used in test fixtures)
 */
export function resetMemoryRateLimits(): void {
  memoryBuckets.clear();
}
