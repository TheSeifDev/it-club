import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import {
  renderRegistrationReceiptEmail,
} from "../lib/email/templates/registration-receipt.ts";
import {
  getEmailConfig,
  isEmailConfigured,
} from "../lib/email/config.ts";
import {
  sendRegistrationReceipt,
  getNotificationForApplication,
} from "../lib/email/notification-service.ts";
import { POST } from "../app/api/register/route.ts";
import { resetMemoryRateLimits } from "../lib/security/rate-limiter.ts";

describe("Phase 3A: Transactional Registration Confirmation Emails", () => {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://wzendwuoankwiahbrwqt.supabase.co";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_SIK6ewo2TUtgD8Qizcl12Q__U0Irdns";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    resetMemoryRateLimits();
  });

  // 1. Template Safety & HTML Escaping (XSS Defense)
  describe("1. Template Rendering & XSS Protection", () => {
    it("escapes malicious HTML, scripts, and event handlers in user-submitted fields", () => {
      const maliciousData = {
        fullName: "Ahmed <script>alert('xss')</script>",
        referenceCode: "ITC-ATTACK1",
        primaryTrack: "it",
        secondaryTrack: "<img src=x onerror=alert(1)>",
        academicYear: "first",
        department: "Computer Science <iframe src='evil.com'></iframe>",
        appBaseUrl: "https://recruitment.itclub.org",
      };

      const rendered = renderRegistrationReceiptEmail(maliciousData);

      // Verify dangerous tags are escaped
      assert.ok(!rendered.html.includes("<script>"));
      assert.ok(rendered.html.includes("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;"));
      assert.ok(!rendered.html.includes("<img src=x"));
      assert.ok(!rendered.html.includes("<iframe"));
      assert.ok(rendered.html.includes("&lt;iframe"));
    });

    it("includes all required confirmation fields in HTML and plain text", () => {
      const sampleData = {
        fullName: "Omar Tarek",
        referenceCode: "ITC-99887766",
        primaryTrack: "it",
        secondaryTrack: "rnd",
        academicYear: "second",
        department: "Networks & Cyber Security",
        appBaseUrl: "https://recruitment.itclub.org",
      };

      const { subject, html, text } = renderRegistrationReceiptEmail(sampleData);

      // Subject
      assert.match(subject, /ITC-99887766/);
      assert.match(subject, /Application Received/);

      // HTML assertions
      assert.ok(html.includes("IT CLUB RECRUITMENT 2026"));
      assert.ok(html.includes("ITC-99887766"));
      assert.ok(html.includes("Omar Tarek"));
      assert.ok(html.includes("Pending Review"));
      assert.ok(html.includes("Information Technology"));
      assert.ok(html.includes("Research &amp; Development"));
      assert.ok(html.includes("Networks &amp; Cyber Security"));
      assert.ok(html.includes("Submission does not imply acceptance"));
      assert.ok(html.includes("October 17, 2026"));
      assert.ok(html.includes("https://recruitment.itclub.org"));

      // Text assertions
      assert.ok(text.includes("ITC-99887766"));
      assert.ok(text.includes("Omar Tarek"));
      assert.ok(text.includes("Pending Review (قيد المراجعة)"));
      assert.ok(text.includes("Submission does NOT imply acceptance"));
    });

    it("strictly excludes sensitive student data from email content", () => {
      const sampleData = {
        fullName: "Ziad Mostafa",
        referenceCode: "ITC-SECURE01",
        primaryTrack: "oc",
        secondaryTrack: "sm",
        academicYear: "third",
        department: "Mechatronics",
        appBaseUrl: "https://recruitment.itclub.org",
      };

      const rawNationalId = "30408250101242";
      const internalNotes = "CONFIDENTIAL_REVIEWER_NOTE_DO_NOT_LEAK";

      const { html, text } = renderRegistrationReceiptEmail(sampleData);

      // Assert that sensitive fields are never in email bodies
      assert.ok(!html.includes(rawNationalId));
      assert.ok(!text.includes(rawNationalId));
      assert.ok(!html.includes(internalNotes));
      assert.ok(!text.includes(internalNotes));
      assert.ok(!html.includes("password"));
      assert.ok(!html.includes("token"));
    });
  });

  // 2. Configuration & Missing Provider Behavior
  describe("2. Provider Configuration & Failure Fallback", () => {
    it("diagnoses missing email provider without crashing or claiming false success", () => {
      // With empty or absent key
      const originalKey = process.env.RESEND_API_KEY;
      try {
        delete process.env.RESEND_API_KEY;
        assert.equal(isEmailConfigured(), false);
        const config = getEmailConfig();
        assert.equal(config.apiKey, undefined);
        assert.ok(config.from.length > 0);
        assert.ok(config.appBaseUrl.length > 0);
      } finally {
        if (originalKey) process.env.RESEND_API_KEY = originalKey;
      }
    });

    it("returns unconfigured status when attempting dispatch without RESEND_API_KEY", async () => {
      if (!serviceKey) return;

      const originalKey = process.env.RESEND_API_KEY;
      try {
        delete process.env.RESEND_API_KEY;

        const dummyAppId = "00000000-0000-4000-8000-000000000099";
        const result = await sendRegistrationReceipt({
          applicationId: dummyAppId,
          applicationReference: "ITC-TESTUNCONFIG",
          recipientEmail: "unconfigured.test@batechu.com",
          fullName: "Test Unconfigured",
          academicId: "BATU-9999",
          academicYear: "first",
          department: "IT",
          primaryTrack: "it",
        });

        // Must not claim email was sent
        assert.equal(result.success, false);
        assert.equal(result.status, "unconfigured");
        assert.equal(result.safeReason, "PROVIDER_NOT_CONFIGURED");
      } finally {
        if (originalKey) process.env.RESEND_API_KEY = originalKey;
      }
    });
  });

  // 3. Database Integrity & Idempotency Rules
  describe("3. Notification Idempotency & Database Tracking", () => {
    it("prevents duplicate notification sends using unique idempotency key", async () => {
      if (!serviceKey) return;

      const serviceClient = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      // Find an existing application to test notification idempotency
      const { data: app } = await serviceClient
        .from("applications")
        .select("id, application_reference, full_name, university_email, academic_id, academic_year, department, primary_track")
        .limit(1)
        .maybeSingle();

      if (!app) return;

      const idempotencyKey = `reg_receipt_${app.id}`;

      // Insert or simulate a SENT notification row
      const { error: upsertErr } = await serviceClient
        .from("application_notifications")
        .upsert(
          {
            application_id: app.id,
            notification_type: "REGISTRATION_RECEIPT",
            idempotency_key: idempotencyKey,
            recipient_email: app.university_email,
            delivery_status: "SENT",
            attempt_count: 1,
            provider_message_id: "msg_test_idempotency_123",
            completed_at: new Date().toISOString(),
          },
          { onConflict: "idempotency_key" }
        );

      assert.equal(upsertErr, null);

      // Attempt second dispatch for same application
      const secondAttempt = await sendRegistrationReceipt({
        applicationId: app.id,
        applicationReference: app.application_reference,
        recipientEmail: app.university_email,
        fullName: app.full_name,
        academicId: app.academic_id,
        academicYear: app.academic_year,
        department: app.department,
        primaryTrack: app.primary_track,
      });

      // Must be intercepted by idempotency check
      assert.equal(secondAttempt.success, true);
      assert.equal(secondAttempt.status, "already_sent");
      assert.equal(secondAttempt.providerMessageId, "msg_test_idempotency_123");

      // Verify that the notification record was retrieved
      const fetched = await getNotificationForApplication(app.id);
      assert.ok(fetched);
      assert.equal(fetched.delivery_status, "SENT");
      assert.equal(fetched.provider_message_id, "msg_test_idempotency_123");
    });

    it("verifies RLS blocks anonymous access to application_notifications", async () => {
      const publicClient = createClient(supabaseUrl, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      // Anon SELECT should be blocked
      const { data, error: selectErr } = await publicClient
        .from("application_notifications")
        .select("*")
        .limit(5);

      assert.ok(selectErr || (data && data.length === 0));

      // Anon INSERT should be blocked
      const { error: insertErr } = await publicClient
        .from("application_notifications")
        .insert({
          application_id: "00000000-0000-0000-0000-000000000001",
          notification_type: "REGISTRATION_RECEIPT",
          idempotency_key: "anon_tamper_attempt",
          recipient_email: "attacker@batechu.com",
        });

      assert.ok(insertErr, "Public anonymous role must not insert into application_notifications");
    });
  });

  // 4. End-to-End Registration Pipeline with Email Notification
  describe("4. Registration Pipeline Integration", () => {
    it("does not attempt email when registration validation fails", async () => {
      const invalidReq = new Request("http://localhost:3000/api/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "198.18.200.1",
        },
        body: JSON.stringify({
          fullName: "A", // too short
        }),
      });

      const res = await POST(invalidReq);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.code, "VALIDATION_FAILED");
      // No emailDelivery field on failure
      assert.equal(json.emailDelivery, undefined);
    });

    it("saves valid application before receipt, returning 201 with delivery metadata", async () => {
      if (!serviceKey) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2024${randomSuffix}@batechu.com`;
      const testAcademicId = `BATU-2024-${randomSuffix}`;
      const testNationalId = `304082501${String(randomSuffix).padStart(4, "0")}1`; // Synthetic 14 digits (Cairo 01)

      const payload = {
        fullName: `Test Student ${randomSuffix}`,
        nationalId: testNationalId,
        academicId: testAcademicId,
        phone: "+201012345678",
        whatsapp: "+201012345678",
        universityEmail: testEmail,
        year: "first",
        department: "Information Technology",
        experienceLevel: "beginner",
        skills: "Basic HTML and Python fundamentals",
        primaryTrack: "it",
        secondaryTrack: "rnd",
        motivation: "A valid test application motivation exceeding twenty characters.",
        learningGoal: "Valid learning goals for the technical recruitment interview.",
        consent: true,
      };

      const req = new Request("http://localhost:3000/api/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": `198.18.200.${randomSuffix % 250}`,
        },
        body: JSON.stringify(payload),
      });

      const res = await POST(req);
      assert.equal(res.status, 201);
      const json = await res.json();

      assert.equal(json.ok, true);
      assert.ok(json.reference);
      assert.match(json.reference, /^ITC-[A-Z0-9]{8}$/);
      assert.equal(json.status, "PENDING_REVIEW");

      // Verify emailDelivery metadata is returned cleanly without leaking secrets
      assert.ok(json.emailDelivery);
      assert.ok(typeof json.emailDelivery.status === "string");
      assert.ok(typeof json.emailDelivery.message === "string");
      assert.ok(
        ["sent", "unconfigured", "failed", "pending"].includes(json.emailDelivery.status)
      );

      // Verify database persistence in applications table
      const serviceClient = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: savedApp } = await serviceClient
        .from("applications")
        .select("id, application_reference, status")
        .eq("application_reference", json.reference)
        .single();

      assert.ok(savedApp);
      assert.equal(savedApp.status, "PENDING_REVIEW");

      // Verify tracking record in application_notifications
      const notification = await getNotificationForApplication(savedApp.id);
      assert.ok(notification);
      assert.equal(notification.application_id, savedApp.id);
      assert.equal(notification.recipient_email, testEmail);
      assert.ok(["PENDING", "SENT", "FAILED"].includes(notification.delivery_status));
    });
  });
});
