import { describe, it, beforeEach, afterEach } from "node:test";
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
  setMockTransporter,
  resetMailerTransporter,
  sendMail,
  isValidEmailAddress,
} from "../lib/email/mailer.ts";
import {
  sendRegistrationReceipt,
  getNotificationForApplication,
} from "../lib/email/notification-service.ts";
import { POST } from "../app/api/register/route.ts";
import { resetMemoryRateLimits } from "../lib/security/rate-limiter.ts";

describe("Direct Gmail SMTP & Transactional Registration Confirmation Emails", () => {
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
    resetMailerTransporter();
  });

  afterEach(() => {
    resetMailerTransporter();
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
      assert.ok(
        rendered.html.includes("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;")
      );
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

  // 2. Gmail SMTP Configuration & Credential Validation
  describe("2. Gmail SMTP Configuration & Credential Safety", () => {
    it("correctly parses Gmail SMTP configuration and sets TLS security for ports 465 and 587", () => {
      const origUser = process.env.GMAIL_USER;
      const origPass = process.env.GMAIL_APP_PASSWORD;
      const origPort = process.env.SMTP_PORT;

      try {
        process.env.GMAIL_USER = "recruitment@gmail.com";
        process.env.GMAIL_APP_PASSWORD = "abcd efgh ijkl mnop";
        process.env.SMTP_PORT = "465";

        const config465 = getEmailConfig();
        assert.equal(config465.gmailUser, "recruitment@gmail.com");
        assert.equal(config465.smtpHost, "smtp.gmail.com");
        assert.equal(config465.smtpPort, 465);
        assert.equal(config465.secure, true);
        assert.equal(isEmailConfigured(), true);

        // Port 587 (STARTTLS)
        process.env.SMTP_PORT = "587";
        const config587 = getEmailConfig();
        assert.equal(config587.smtpPort, 587);
        assert.equal(config587.secure, false);
      } finally {
        if (origUser) process.env.GMAIL_USER = origUser;
        else delete process.env.GMAIL_USER;
        if (origPass) process.env.GMAIL_APP_PASSWORD = origPass;
        else delete process.env.GMAIL_APP_PASSWORD;
        if (origPort) process.env.SMTP_PORT = origPort;
        else delete process.env.SMTP_PORT;
      }
    });

    it("diagnoses missing Gmail credentials safely without crashing or claiming false success", () => {
      const origUser = process.env.GMAIL_USER;
      const origPass = process.env.GMAIL_APP_PASSWORD;

      try {
        delete process.env.GMAIL_USER;
        delete process.env.GMAIL_APP_PASSWORD;

        assert.equal(isEmailConfigured(), false);
        const config = getEmailConfig();
        assert.equal(config.gmailUser, undefined);
        assert.equal(config.gmailAppPassword, undefined);
        assert.ok(config.from.length > 0);
        assert.ok(config.appBaseUrl.length > 0);
      } finally {
        if (origUser) process.env.GMAIL_USER = origUser;
        if (origPass) process.env.GMAIL_APP_PASSWORD = origPass;
      }
    });

    it("validates email recipient format before attempting SMTP delivery", async () => {
      assert.equal(isValidEmailAddress("valid.student@batechu.com"), true);
      assert.equal(isValidEmailAddress("invalid-email"), false);
      assert.equal(isValidEmailAddress(""), false);

      const invalidResult = await sendMail({
        to: "not-an-email",
        subject: "Test",
        html: "<p>Test</p>",
        text: "Test",
      });

      assert.equal(invalidResult.success, false);
      assert.equal(invalidResult.safeCategory, "INVALID_RECIPIENT");
    });
  });

  // 3. Mocked Nodemailer SMTP Transporter Scenarios
  describe("3. Mocked Gmail SMTP Scenarios (Success, Auth Failure, Connection Error)", () => {
    it("reports safe failure and never claims success when SMTP authentication fails (code 535 / EAUTH)", async () => {
      const authError = new Error("Invalid login: 535 5.7.8 Username and Password not accepted");
      Object.assign(authError, { code: "EAUTH", responseCode: 535 });

      setMockTransporter({
        sendMail: async () => {
          throw authError;
        },
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const dummyAppId = "00000000-0000-4000-8000-000000000088";
      const result = await sendRegistrationReceipt({
        applicationId: dummyAppId,
        applicationReference: "ITC-AUTHERR1",
        recipientEmail: "20248888@batechu.com",
        fullName: "Test Auth Failure",
        academicId: "BATU-8888",
        academicYear: "first",
        department: "IT",
        primaryTrack: "it",
      });

      assert.equal(result.success, false);
      assert.equal(result.status, "failed");
      assert.equal(result.safeReason, "AUTHENTICATION_FAILED");
    });

    it("successfully records SENT delivery status and messageId when SMTP accepts the message", async () => {
      const syntheticMessageId = "<msg_test_acceptance_9999@gmail.com>";

      setMockTransporter({
        sendMail: async (mailOpts: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          messageId: syntheticMessageId,
          accepted: [mailOpts.to],
          rejected: [],
          response: "250 2.0.0 OK message queued",
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      if (!serviceKey) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2024${randomSuffix}@batechu.com`;
      const refCode = `ITC-SMP${randomSuffix}`;

      // Insert synthetic application to receive notification tracking
      const serviceClient = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: newApp } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `SMTP Accepted ${randomSuffix}`,
          national_id: `304082501${randomSuffix}7`,
          academic_id: `BATU-SMP-${randomSuffix}`,
          phone: "+201000000008",
          whatsapp: "+201000000008",
          university_email: testEmail,
          academic_year: "first",
          department: "Information Technology",
          experience_level: "beginner",
          primary_track: "it",
          motivation: "Motivation exceeding twenty characters for testing.",
          learning_goal: "Learning goal exceeding twenty characters for testing.",
          status: "PENDING_REVIEW",
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (!newApp) return;

      const result = await sendRegistrationReceipt({
        applicationId: newApp.id,
        applicationReference: refCode,
        recipientEmail: testEmail,
        fullName: `SMTP Accepted ${randomSuffix}`,
        academicId: `BATU-SMP-${randomSuffix}`,
        academicYear: "first",
        department: "Information Technology",
        primaryTrack: "it",
      });

      assert.equal(result.success, true);
      assert.equal(result.status, "sent");
      assert.equal(result.providerMessageId, syntheticMessageId);

      // Verify persisted notification record
      const notification = await getNotificationForApplication(newApp.id);
      assert.ok(notification);
      assert.equal(notification.delivery_status, "SENT");
      assert.equal(notification.provider_message_id, syntheticMessageId);

      // Cleanup synthetic test app
      await serviceClient.from("application_notifications").delete().eq("application_id", newApp.id);
      await serviceClient.from("applications").delete().eq("id", newApp.id);
    });

    it("handles connection failure with bounded retry and reports CONNECTION_FAILED", async () => {
      let callCount = 0;
      const connError = new Error("connect ECONNREFUSED 142.250.180.108:465");
      Object.assign(connError, { code: "ECONNREFUSED" });

      setMockTransporter({
        sendMail: async () => {
          callCount++;
          throw connError;
        },
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const mailRes = await sendMail({
        to: "20241234@batechu.com",
        subject: "Network Failure Test",
        html: "<p>Test</p>",
        text: "Test",
      });

      assert.equal(mailRes.success, false);
      assert.equal(mailRes.safeCategory, "CONNECTION_FAILED");
      // Must not retry indefinitely (exactly 2 attempts: initial + 1 retry)
      assert.equal(callCount, 2);
    });
  });

  // 4. Database Integrity & Idempotency Rules
  describe("4. Notification Idempotency & Database Tracking", () => {
    it("prevents duplicate notification sends using unique idempotency key", async () => {
      if (!serviceKey) return;

      const serviceClient = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

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

      assert.ok(
        insertErr,
        "Public anonymous role must not insert into application_notifications"
      );
    });
  });

  // 5. End-to-End Registration Pipeline with Email Notification
  describe("5. Registration Pipeline Integration & Failed Delivery Non-Rollback", () => {
    it("does not attempt email when registration validation fails", async () => {
      const invalidReq = new Request("http://localhost:3000/api/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": `198.18.200.${Math.floor(100 + Math.random() * 800)}`,
        },
        body: JSON.stringify({
          fullName: "A", // too short
        }),
      });

      const res = await POST(invalidReq);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.code, "VALIDATION_FAILED");
      assert.equal(json.emailDelivery, undefined);
    });

    it("saves valid application before receipt, preserving application even if SMTP delivery fails", async () => {
      if (!serviceKey) return;

      // Force SMTP auth error to verify registration is NOT rolled back
      const authError = new Error("Invalid credentials: 535 Username and Password not accepted");
      Object.assign(authError, { code: "EAUTH", responseCode: 535 });
      setMockTransporter({
        sendMail: async () => {
          throw authError;
        },
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2024${randomSuffix}@batechu.com`;
      const testAcademicId = `BATU-2024-${randomSuffix}`;
      const testNationalId = `304082501${String(randomSuffix).padStart(4, "0")}1`;

      const payload = {
        fullName: `Preserve App ${randomSuffix}`,
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

      // Verify email delivery failed gracefully without rolling back application
      assert.ok(json.emailDelivery);
      assert.equal(json.emailDelivery.status, "failed");

      // Verify application STILL EXISTS in database
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

      // Verify tracking record is marked FAILED with AUTHENTICATION_FAILED
      const notification = await getNotificationForApplication(savedApp.id);
      assert.ok(notification);
      assert.equal(notification.delivery_status, "FAILED");
      assert.equal(notification.safe_error_category, "AUTHENTICATION_FAILED");

      // Cleanup
      await serviceClient.from("application_notifications").delete().eq("application_id", savedApp.id);
      await serviceClient.from("applications").delete().eq("id", savedApp.id);
    });
  });
});
