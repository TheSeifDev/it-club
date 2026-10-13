import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

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
  source: "redis" | "memory" | "database" | "fail_open";
}

// In-memory sliding-window bucket store for instance-local resilience
interface MemoryBucket {
  count: number;
  expiresAt: number;
}
const memoryBuckets = new Map<string, MemoryBucket>();

// Serverless singleton Upstash Redis client and Ratelimit instances
let cachedRedis: Redis | null = null;
let mockRedis: { limit: (key: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }> } | null = null;
const ratelimiterCache = new Map<string, Ratelimit>();

/**
 * Configure or reset mock Upstash Redis client for automated testing.
 */
export function setMockRedisClient(mock: typeof mockRedis): void {
  mockRedis = mock;
}

/**
 * Validates IPv4 or IPv6 format.
 */
function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== "string") return false;
  // IPv4 pattern
  const ipv4 = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  // IPv6 pattern
  const ipv6 = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$|^::1$|^[a-fA-F0-9:]+$/;
  return ipv4.test(ip) || ipv6.test(ip);
}

/**
 * Sanitizes IP string by removing port numbers or brackets.
 */
function sanitizeIp(raw: string): string {
  const trimmed = raw.trim();
  // Strip IPv4 port: 192.168.1.1:8080 -> 192.168.1.1
  const portMatch = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?$/);
  if (portMatch) return portMatch[1];
  // Strip IPv6 brackets: [2001:db8::1] -> 2001:db8::1
  return trimmed.replace(/^\[|\]$/g, "");
}

/**
 * Derives a sanitized client IP identifier from trusted reverse-proxy headers.
 * Does not trust arbitrary spoofable client headers.
 * Handles Cloudflare, Nginx, Vercel, and standard proxies safely.
 */
export function extractClientIp(request: Request): string {
  // 1. Cloudflare connecting IP (set by Cloudflare Edge)
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    const clean = sanitizeIp(cfConnectingIp);
    if (isValidIp(clean)) return clean;
  }

  // 2. Direct reverse proxy real-ip header
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    const clean = sanitizeIp(realIp);
    if (isValidIp(clean)) return clean;
  }

  // 3. Standard x-forwarded-for header (first entry is the client)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",").map((s) => s.trim());
    if (parts[0]) {
      const clean = sanitizeIp(parts[0]);
      if (isValidIp(clean)) return clean;
    }
  }

  return "127.0.0.1";
}

/**
 * Produces a one-way hashed key combining identifier, prefix, and salt.
 * Ensures that raw student IP addresses or personal identifiers are never stored or logged in plain text.
 */
export function hashRateLimitKey(prefix: string, identifier: string): string {
  const salt = process.env.RATE_LIMIT_SALT || "it-club-recruitment-security-salt";
  return createHash("sha256")
    .update(`${prefix}:${identifier}:${salt}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Returns a reusable Upstash Redis client if credentials are configured in the environment.
 */
export function getUpstashRedisClient(): Redis | null {
  if (cachedRedis) return cachedRedis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  cachedRedis = new Redis({
    url,
    token,
  });

  return cachedRedis;
}

/**
 * In-memory fallback rate limiter.
 * 
 * IMPORTANT ARCHITECTURAL NOTE:
 * In-memory rate limiting operates per-serverless-process. It provides high-speed, zero-latency
 * rate limiting within a warm container, but does NOT provide globally synchronized rate limiting
 * across multiple independent serverless instances.
 * Global synchronization requires Upstash Redis.
 * The public.applications table UNIQUE constraints (National ID, Academic ID, University Email)
 * serve as the authoritative database-level duplicate prevention mechanism.
 */
export function checkMemoryRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
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
      source: "memory",
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
      source: "memory",
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
    source: "memory",
  };
}

/**
 * Fallback to Supabase public.rate_limits table (only if explicitly enabled via RATE_LIMIT_FALLBACK_MODE=db).
 */
async function checkDatabaseRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return checkMemoryRateLimit(key, config);
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.windowSeconds * 1000);

    const { data: existing, error: selectError } = await supabase
      .from("rate_limits")
      .select("count, reset_at")
      .eq("key", key)
      .maybeSingle();

    if (selectError) {
      return checkMemoryRateLimit(key, config);
    }

    if (!existing || new Date(existing.reset_at).getTime() <= now.getTime()) {
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
        source: "database",
      };
    }

    const resetTime = new Date(existing.reset_at).getTime();
    const resetInSeconds = Math.max(1, Math.ceil((resetTime - now.getTime()) / 1000));

    if (existing.count >= config.maxRequests) {
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetInSeconds,
        retryAfter: resetInSeconds,
        source: "database",
      };
    }

    const nextCount = existing.count + 1;
    await supabase.from("rate_limits").update({ count: nextCount }).eq("key", key);

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - nextCount),
      resetInSeconds,
      retryAfter: 0,
      source: "database",
    };
  } catch {
    return checkMemoryRateLimit(key, config);
  }
}

/**
 * Checks rate limit for a request using Upstash Redis sliding window algorithm,
 * with bounded timeout and documented fallback behavior.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig = { maxRequests: 5, windowSeconds: 900, prefix: "reg" }
): Promise<RateLimitResult> {
  // 1. Mock Redis hook for unit and integration testing
  if (mockRedis) {
    try {
      const res = await mockRedis.limit(key);
      const retryAfter = res.success ? 0 : Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
      return {
        allowed: res.success,
        limit: res.limit,
        remaining: res.remaining,
        resetInSeconds: Math.max(1, Math.ceil((res.reset - Date.now()) / 1000)),
        retryAfter,
        source: "redis",
      };
    } catch {
      return handleFallback(key, config);
    }
  }

  // 2. Real Upstash Redis check if configured
  const redis = getUpstashRedisClient();
  if (redis) {
    try {
      const prefix = config.prefix || "itc_rl";
      const cacheKey = `${prefix}:${config.maxRequests}:${config.windowSeconds}`;

      let ratelimiter = ratelimiterCache.get(cacheKey);
      if (!ratelimiter) {
        ratelimiter = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowSeconds} s`),
          prefix: `rl_${prefix}`,
          ephemeralCache: new Map(),
        });
        ratelimiterCache.set(cacheKey, ratelimiter);
      }

      // Enforce bounded timeout (default 1000ms) to prevent slow Redis from delaying user
      const timeoutMs = Number(process.env.RATE_LIMIT_TIMEOUT_MS) || 1000;
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Upstash Redis timeout")), timeoutMs)
      );

      const result = await Promise.race([ratelimiter.limit(key), timeoutPromise]);

      const resetInSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
      const retryAfter = result.success ? 0 : resetInSeconds;

      return {
        allowed: result.success,
        limit: result.limit,
        remaining: result.remaining,
        resetInSeconds,
        retryAfter,
        source: "redis",
      };
    } catch (err) {
      console.warn(
        "[rate-limiter] Upstash Redis request failed or timed out, executing fallback policy:",
        err instanceof Error ? err.message : "Unknown error"
      );
      return handleFallback(key, config);
    }
  }

  // 3. Redis not configured: invoke fallback policy
  return handleFallback(key, config);
}

/**
 * Executes the configured fallback policy when Upstash Redis is absent or unreachable.
 * Configured via RATE_LIMIT_FALLBACK_MODE ('memory' | 'fail_open' | 'db'). Defaults to 'memory'.
 */
async function handleFallback(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const fallbackMode = (process.env.RATE_LIMIT_FALLBACK_MODE || "memory").toLowerCase();

  if (fallbackMode === "fail_open") {
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetInSeconds: config.windowSeconds,
      retryAfter: 0,
      source: "fail_open",
    };
  }

  if (fallbackMode === "db") {
    return checkDatabaseRateLimit(key, config);
  }

  // Default fallback: memory
  return checkMemoryRateLimit(key, config);
}

/**
 * Resets in-memory rate limits and caches (used in test fixtures).
 */
export function resetMemoryRateLimits(): void {
  memoryBuckets.clear();
  ratelimiterCache.clear();
  cachedRedis = null;
  mockRedis = null;
}
