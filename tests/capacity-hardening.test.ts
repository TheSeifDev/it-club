import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  checkRateLimit,
  hashRateLimitKey,
  extractClientIp,
  setMockRedisClient,
  resetMemoryRateLimits,
} from "../lib/security/rate-limiter.ts";
import {
  sendRegistrationReceipt,
  processPendingNotifications,
} from "../lib/email/notification-service.ts";
import { setMockTransporter, resetMailerTransporter } from "../lib/email/mailer.ts";

describe("Burst Readiness & Capacity Hardening", () => {
  beforeEach(() => {
    resetMemoryRateLimits();
    setMockRedisClient(null);
    resetMailerTransporter();
  });

  afterEach(() => {
    resetMemoryRateLimits();
    setMockRedisClient(null);
    resetMailerTransporter();
  });

  // 1. Upstash Redis & Distributed Rate Limiting
  describe("1. Upstash Redis Distributed Rate Limiter", () => {
    it("permits requests within quota and tracks remaining when Redis succeeds", async () => {
      let count = 0;
      setMockRedisClient({
        limit: async () => {
          count++;
          return {
            success: count <= 5,
            limit: 5,
            remaining: Math.max(0, 5 - count),
            reset: Date.now() + 60000,
          };
        },
      });

      const key = hashRateLimitKey("test", "user-1");
      const res = await checkRateLimit(key, { maxRequests: 5, windowSeconds: 60 });

      assert.equal(res.allowed, true);
      assert.equal(res.limit, 5);
      assert.equal(res.remaining, 4);
      assert.equal(res.source, "redis");
      assert.equal(res.retryAfter, 0);
    });

    it("rejects requests exceeding quota with 429 and Retry-After", async () => {
      setMockRedisClient({
        limit: async () => ({
          success: false,
          limit: 3,
          remaining: 0,
          reset: Date.now() + 45000,
        }),
      });

      const key = hashRateLimitKey("test", "user-blocked");
      const res = await checkRateLimit(key, { maxRequests: 3, windowSeconds: 60 });

      assert.equal(res.allowed, false);
      assert.equal(res.remaining, 0);
      assert.ok(res.retryAfter > 0);
      assert.equal(res.source, "redis");
    });

    it("falls back gracefully to memory rate limiter when Redis throws an error", async () => {
      setMockRedisClient({
        limit: async () => {
          throw new Error("Upstash connection timeout 504 Gateway Timeout");
        },
      });

      const key = hashRateLimitKey("test", "user-fallback");
      const res = await checkRateLimit(key, { maxRequests: 2, windowSeconds: 60 });

      // Should not throw: falls back to in-memory limiting
      assert.equal(res.allowed, true);
      assert.equal(res.source, "memory");
      assert.equal(res.remaining, 1);

      // Second request in memory
      const res2 = await checkRateLimit(key, { maxRequests: 2, windowSeconds: 60 });
      assert.equal(res2.allowed, true);
      assert.equal(res2.remaining, 0);

      // Third request in memory: blocked
      const res3 = await checkRateLimit(key, { maxRequests: 2, windowSeconds: 60 });
      assert.equal(res3.allowed, false);
      assert.equal(res3.remaining, 0);
      assert.ok(res3.retryAfter > 0);
    });

    it("supports fail_open policy when RATE_LIMIT_FALLBACK_MODE is set to fail_open", async () => {
      const originalMode = process.env.RATE_LIMIT_FALLBACK_MODE;
      process.env.RATE_LIMIT_FALLBACK_MODE = "fail_open";

      setMockRedisClient({
        limit: async () => {
          throw new Error("Redis cluster down");
        },
      });

      try {
        const key = hashRateLimitKey("test", "user-fail-open");
        const res = await checkRateLimit(key, { maxRequests: 5, windowSeconds: 60 });

        assert.equal(res.allowed, true);
        assert.equal(res.source, "fail_open");
        assert.equal(res.retryAfter, 0);
      } finally {
        process.env.RATE_LIMIT_FALLBACK_MODE = originalMode;
      }
    });
  });

  // 2. Client IP Extraction & Campus Wi-Fi Handling
  describe("2. Trusted Client IP Extraction", () => {
    it("extracts and prioritizes cf-connecting-ip from Cloudflare Edge", () => {
      const req = new Request("https://itclub.org/api/register", {
        headers: {
          "cf-connecting-ip": "198.51.100.25",
          "x-forwarded-for": "10.0.0.1, 10.0.0.2",
        },
      });

      assert.equal(extractClientIp(req), "198.51.100.25");
    });

    it("extracts and prioritizes x-real-ip when cf-connecting-ip is absent", () => {
      const req = new Request("https://itclub.org/api/register", {
        headers: {
          "x-real-ip": "203.0.113.88",
          "x-forwarded-for": "10.0.0.1",
        },
      });

      assert.equal(extractClientIp(req), "203.0.113.88");
    });

    it("takes the leftmost valid client IP from x-forwarded-for", () => {
      const req = new Request("https://itclub.org/api/register", {
        headers: {
          "x-forwarded-for": "192.0.2.14, 198.51.100.5, 203.0.113.1",
        },
      });

      assert.equal(extractClientIp(req), "192.0.2.14");
    });

    it("strips port numbers attached to IPv4 addresses", () => {
      const req = new Request("https://itclub.org/api/register", {
        headers: {
          "x-forwarded-for": "198.51.100.99:54321, 10.0.0.1",
        },
      });

      assert.equal(extractClientIp(req), "198.51.100.99");
    });

    it("falls back safely to 127.0.0.1 when no valid headers are present", () => {
      const req = new Request("https://itclub.org/api/register");
      assert.equal(extractClientIp(req), "127.0.0.1");
    });
  });

  // 3. Email Outbox Queueing & Non-Blocking Delivery
  describe("3. Email Outbox & Non-Blocking Delivery", () => {
    it("immediately queues confirmation receipt when dispatchMode is queue without invoking SMTP", async () => {
      let smtpCalled = false;
      setMockTransporter({
        sendMail: async () => {
          smtpCalled = true;
          return { messageId: "mock-smtp-id" };
        },
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const syntheticAppId = "00000000-0000-4000-8000-000000000001";
      const result = await sendRegistrationReceipt(
        {
          applicationId: syntheticAppId,
          applicationReference: "ITC-TEST001",
          recipientEmail: "20249999@batechu.com",
          fullName: "Outbox Student",
          academicId: "BATU-9999",
          academicYear: "first",
          department: "IT",
          primaryTrack: "it",
        },
        { dispatchMode: "queue" }
      );

      // In queue mode, SMTP should NOT be called synchronously
      assert.equal(smtpCalled, false);
      assert.equal(result.success, true);
      assert.equal(result.status, "pending");
      assert.equal(result.safeReason, "QUEUED_FOR_OUTBOX_DELIVERY");
    });

    it("times out gracefully and leaves notification in PENDING state when SMTP is slow", async () => {
      // Simulate an SMTP connection that takes 10 seconds (hanging socket)
      setMockTransporter({
        sendMail: async () => {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          return { messageId: "delayed-id" };
        },
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const syntheticAppId = "00000000-0000-4000-8000-000000000002";
      const result = await sendRegistrationReceipt(
        {
          applicationId: syntheticAppId,
          applicationReference: "ITC-TEST002",
          recipientEmail: "20249998@batechu.com",
          fullName: "Slow SMTP Student",
          academicId: "BATU-9998",
          academicYear: "first",
          department: "IT",
          primaryTrack: "it",
        },
        { dispatchMode: "sync", timeoutMs: 50 } // Bounded 50ms timeout for testing
      );

      // Must not hang: times out and leaves in pending outbox state
      assert.equal(result.success, true);
      assert.equal(result.status, "pending");
      assert.equal(result.safeReason, "DISPATCH_TIMED_OUT_QUEUED");
    });

    it("handles batch processing via processPendingNotifications safely", async () => {
      // Empty pending notifications case
      const res = await processPendingNotifications({ batchSize: 5 });
      assert.equal(typeof res.processed, "number");
      assert.equal(typeof res.sent, "number");
      assert.equal(typeof res.failed, "number");
      assert.ok(Array.isArray(res.errors));
    });
  });
});
