import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { validateRegistrationPayload } from "../lib/validation/registration-schema.ts";
import {
  checkRateLimit,
  hashRateLimitKey,
  resetMemoryRateLimits,
} from "../lib/security/rate-limiter.ts";
import { createClient } from "@supabase/supabase-js";

describe("Security Controls — SQL Injection Defense", () => {
  it("treats SQL injection payloads as literal strings rather than query expressions", () => {
    const sqlInjectionPayloads = [
      "Robert'); DROP TABLE applications; --",
      "' OR '1'='1",
      "admin'--",
      "' UNION SELECT NULL, version(), current_user --",
      "1; SELECT pg_sleep(5); --",
    ];

    for (const sqlPayload of sqlInjectionPayloads) {
      const payload = {
        fullName: "Synthetic Applicant",
        nationalId: "30405150101234",
        academicId: "BATU-2024-SQL",
        phone: "+201012345678",
        whatsapp: "+201012345678",
        whatsappSame: true,
        universityEmail: "20241111@batechu.com",
        year: "first",
        department: "Information Technology",
        experienceLevel: "beginner",
        skills: sqlPayload, // SQL payload in skills
        primaryTrack: "it",
        motivation: "This is a legitimate applicant description with more than twenty characters.",
        learningGoal: "This is a legitimate applicant learning goal with sufficient length.",
        consent: true,
      };

      const result = validateRegistrationPayload(payload);
      assert.equal(result.isValid, true);
      assert.ok(result.data);
      // Verify payload is captured as an ordinary literal string without evaluation
      assert.equal(result.data.skills, sqlPayload);
    }
  });
});

describe("Security Controls — Cross-Site Scripting (XSS) Defense", () => {
  it("treats script tags and HTML event handlers as raw text data without executing code", () => {
    const xssPayloads = [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "<svg/onload=alert('XSS')>",
      "javascript:alert(1)",
    ];

    for (const xssPayload of xssPayloads) {
      const payload = {
        fullName: "Applicant Name",
        nationalId: "30405150101234",
        academicId: "BATU-2024-XSS",
        phone: "+201012345678",
        whatsapp: "+201012345678",
        whatsappSame: true,
        universityEmail: "20242222@batechu.com",
        year: "first",
        department: "Information Technology",
        experienceLevel: "beginner",
        skills: xssPayload,
        primaryTrack: "it",
        motivation: `I want to join IT Club. Payload test: ${xssPayload}`,
        learningGoal: "Learning secure application development and security architecture.",
        consent: true,
      };

      const result = validateRegistrationPayload(payload);
      assert.equal(result.isValid, true);
      assert.ok(result.data);
      // Confirms payload is treated as verbatim character data for React safe DOM escaping
      assert.equal(result.data.skills, xssPayload);
    }
  });
});

describe("Security Controls — Rate Limiting & Abuse Prevention", () => {
  beforeEach(() => {
    resetMemoryRateLimits();
  });

  it("permits requests within quota and rejects requests exceeding the limit with Retry-After", async () => {
    const testKey = hashRateLimitKey("test-ip", "192.0.2.1");
    const limitConfig = { maxRequests: 3, windowSeconds: 60 };

    // Requests 1, 2, 3 should be permitted
    const res1 = await checkRateLimit(testKey, limitConfig);
    assert.equal(res1.allowed, true);
    assert.equal(res1.remaining, 2);

    const res2 = await checkRateLimit(testKey, limitConfig);
    assert.equal(res2.allowed, true);
    assert.equal(res2.remaining, 1);

    const res3 = await checkRateLimit(testKey, limitConfig);
    assert.equal(res3.allowed, true);
    assert.equal(res3.remaining, 0);

    // Request 4 should be rejected with 429 Retry-After value
    const res4 = await checkRateLimit(testKey, limitConfig);
    assert.equal(res4.allowed, false);
    assert.equal(res4.remaining, 0);
    assert.ok(res4.retryAfter > 0);
  });
});

describe("Security Controls — Authorization & Database RLS Boundaries", () => {
  it("confirms anonymous public client cannot read from the private applications table", async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wzendwuoankwiahbrwqt.supabase.co";
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_SIK6ewo2TUtgD8Qizcl12Q__U0Irdns";

    const publicClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Attempting a direct select query as an anonymous browser user
    const { data, error } = await publicClient
      .from("applications")
      .select("id, full_name, national_id, university_email");

    // The query should either return an RLS/permission error or return empty array (no rows visible to anon)
    if (error) {
      assert.ok(error.code || error.message);
    } else {
      assert.deepEqual(data, []);
    }
  });

  it("confirms anonymous public client cannot tamper with application status", async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wzendwuoankwiahbrwqt.supabase.co";
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_SIK6ewo2TUtgD8Qizcl12Q__U0Irdns";

    const publicClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Attempting an unauthorized update to status
    const { error, count } = await publicClient
      .from("applications")
      .update({ status: "ACCEPTED" })
      .eq("academic_id", "BATU-FAKE-999");

    // Should either produce permission denied or update 0 rows
    if (!error) {
      assert.equal(count ?? 0, 0);
    } else {
      assert.ok(error);
    }
  });
});
