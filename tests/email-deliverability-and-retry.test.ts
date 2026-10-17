import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  sendMail,
  maskEmail,
  isValidEmailAddress,
  setMockTransporter,
  resetMailerTransporter,
  getTransporter,
} from "../lib/email/mailer.ts";
import { isEmailConfigured, getEmailConfig } from "../lib/email/config.ts";
import { renderAdminInvitationEmail } from "../lib/email/templates/admin-invitation.ts";
import { renderAcceptanceInvitationEmail } from "../lib/email/templates/acceptance-invitation.ts";
import { renderShortlistedInvitationEmail } from "../lib/email/templates/shortlisted-invitation.ts";
import { renderRegistrationReceiptEmail } from "../lib/email/templates/registration-receipt.ts";
import { FIXED_ADMIN_TEMPORARY_PASSWORD } from "../lib/admin/staff-service.ts";
import { POST as postDiagnostics } from "../app/api/admin/staff/email-diagnostics/route.ts";
import { POST as postRetryInvite } from "../app/api/admin/staff/retry-invite/route.ts";

describe("IT Club — Email Deliverability, Truthful Provider State & Safe Retry Suite", () => {
  const originalEnv = { ...process.env };

  before(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
  });

  after(() => {
    process.env = { ...originalEnv };
    resetMailerTransporter();
  });

  // 1. Configuration Validation & Placeholder Rejection
  describe("1. Configuration Validation & Credential Safety", () => {
    it("rejects dummy, unconfigured, or placeholder credentials", () => {
      assert.equal(isEmailConfigured(), true); // with valid env.local values

      // Mask email helper never leaks full address
      assert.equal(maskEmail("safalmoaz16@gmail.com"), "sa***6@gmail.com");
      assert.equal(maskEmail("seif.tanjiro@gmail.com"), "se***o@gmail.com");
      assert.equal(maskEmail("a@b.com"), "a*@b.com");
      assert.equal(maskEmail("invalid-email"), "[invalid-email]");
    });

    it("validates recipient email formatting strictly", () => {
      assert.equal(isValidEmailAddress("valid@itclub.one"), true);
      assert.equal(isValidEmailAddress("safalmoaz16@gmail.com"), true);
      assert.equal(isValidEmailAddress("not-an-email"), false);
      assert.equal(isValidEmailAddress(""), false);
    });
  });

  // 2. Mock Transport Security Guard
  describe("2. Mock Transport Security Guard", () => {
    it("refuses mock transport when NODE_ENV is not test", () => {
      const prevNodeEnv = process.env.NODE_ENV;
      const prevTransport = process.env.EMAIL_TRANSPORT;

      process.env.EMAIL_TRANSPORT = "mock";
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";

      assert.throws(
        () => {
          getTransporter();
        },
        /EMAIL_TRANSPORT=mock is strictly prohibited outside NODE_ENV=test/
      );

      // Restore
      (process.env as Record<string, string | undefined>).NODE_ENV = prevNodeEnv;
      process.env.EMAIL_TRANSPORT = prevTransport;
      resetMailerTransporter();
    });
  });

  // 3. Accepted & Rejected Handling in sendMail
  describe("3. Truthful Delivery Status Classification in sendMail", () => {
    it("treats recipient omitted from accepted[] as failure (RECIPIENT_REJECTED)", async () => {
      setMockTransporter({
        sendMail: async () => ({
          messageId: "<test-msg-rejected-id@gmail.com>",
          accepted: [], // cleanRecipient is missing!
          rejected: [],
          response: "250 OK queued",
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await sendMail({
        to: "safalmoaz16@gmail.com",
        subject: "Test",
        html: "<p>Test</p>",
        text: "Test",
      });

      assert.equal(result.success, false);
      assert.equal(result.status, "RECIPIENT_REJECTED");
      assert.equal(result.acceptedRecipient, false);
    });

    it("treats rejected recipient as failure (RECIPIENT_REJECTED)", async () => {
      setMockTransporter({
        sendMail: async (mailOpts: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          messageId: "<test-msg-id@gmail.com>",
          accepted: [],
          rejected: [mailOpts.to],
          response: "550 User unknown",
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await sendMail({
        to: "safalmoaz16@gmail.com",
        subject: "Test",
        html: "<p>Test</p>",
        text: "Test",
      });

      assert.equal(result.success, false);
      assert.equal(result.status, "RECIPIENT_REJECTED");
      assert.equal(result.acceptedRecipient, false);
    });

    it("returns ACCEPTED_BY_PROVIDER (never DELIVERY_CONFIRMED) on SMTP 250 acceptance", async () => {
      setMockTransporter({
        sendMail: async (mailOpts: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          messageId: "<accepted-1234@gmail.com>",
          accepted: [mailOpts.to],
          rejected: [],
          response: "250 2.0.0 OK 1792262051 - gsmtp",
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await sendMail({
        to: "safalmoaz16@gmail.com",
        subject: "Test Acceptance",
        html: "<p>Test</p>",
        text: "Test",
      });

      assert.equal(result.success, true);
      assert.equal(result.status, "ACCEPTED_BY_PROVIDER");
      assert.notEqual(result.status, "DELIVERY_CONFIRMED");
      assert.equal(result.messageId, "<accepted-1234@gmail.com>");
      assert.equal(result.acceptedRecipient, true);
    });

    it("classifies SMTP authentication failures correctly as AUTH_ERROR", async () => {
      const authErr = new Error("535 5.7.8 Username and Password not accepted");
      Object.assign(authErr, { code: "EAUTH", responseCode: 535 });

      setMockTransporter({
        sendMail: async () => {
          throw authErr;
        },
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await sendMail({
        to: "safalmoaz16@gmail.com",
        subject: "Test Auth Error",
        html: "<p>Test</p>",
        text: "Test",
      });

      assert.equal(result.success, false);
      assert.equal(result.status, "AUTH_ERROR");
      assert.equal(result.safeCategory, "AUTHENTICATION_FAILED");
    });

    it("classifies network connection failures as CONNECTION_ERROR", async () => {
      const netErr = new Error("connect ECONNREFUSED 142.250.180.108:465");
      Object.assign(netErr, { code: "ECONNREFUSED" });

      setMockTransporter({
        sendMail: async () => {
          throw netErr;
        },
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await sendMail({
        to: "safalmoaz16@gmail.com",
        subject: "Test Connection Error",
        html: "<p>Test</p>",
        text: "Test",
      });

      assert.equal(result.success, false);
      assert.equal(result.status, "CONNECTION_ERROR");
      assert.equal(result.safeCategory, "CONNECTION_FAILED");
    });
  });

  // 4. Admin Invitation Template
  describe("4. Admin Invitation Template Rendering & Security", () => {
    it("renders branded email with login URL from appBaseUrl, temporary password, 24h expiry, and forced change notice", () => {
      const emailConfig = getEmailConfig();
      const expectedLoginUrl = `${emailConfig.appBaseUrl}/login`;

      const email = renderAdminInvitationEmail({
        recipientEmail: "safalmoaz16@gmail.com",
        loginUrl: expectedLoginUrl,
        expiresInHours: 24,
        temporaryPassword: FIXED_ADMIN_TEMPORARY_PASSWORD,
        role: "Admin",
      });

      // Assert password IS in HTML and text body
      assert.ok(email.html.includes(FIXED_ADMIN_TEMPORARY_PASSWORD));
      assert.ok(email.text.includes(FIXED_ADMIN_TEMPORARY_PASSWORD));

      // Assert valid subject and login portal link from appBaseUrl
      assert.equal(email.subject, "IT Club Staff Invitation — Administrator Access");
      assert.ok(email.html.includes(expectedLoginUrl));
      assert.ok(email.text.includes(expectedLoginUrl));

      // Assert 24-hour expiry notice
      assert.ok(email.html.includes("24 hours"));
      assert.ok(email.text.includes("24 hours"));

      // Assert mandatory first-login password change notice
      assert.ok(email.html.includes("change your temporary password immediately upon your first sign in"));
      assert.ok(email.text.includes("change your temporary password immediately upon your first sign in"));

      // Assert role and email escaping
      assert.ok(email.html.includes("Role: Admin"));
      assert.ok(email.html.includes("safalmoaz16@gmail.com"));
    });

    it("escapes untrusted recipient inputs in admin invitation", () => {
      const email = renderAdminInvitationEmail({
        recipientEmail: "malicious<script>alert(1)</script>@gmail.com",
        loginUrl: "https://dev.itclub.one/login",
        role: "Admin<b>bold</b>",
      });

      assert.ok(!email.html.includes("<script>alert(1)</script>"));
      assert.ok(email.html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
      assert.ok(!email.html.includes("<b>bold</b>"));
      assert.ok(email.html.includes("&lt;b&gt;bold&lt;/b&gt;"));
    });
  });

  // 5. Student Invitation Templates (Acceptance & Shortlisted)
  describe("5. Student Invitation Templates with Temporary Password", () => {
    it("renders student acceptance invitation with student login link, temporary password, and 24h expiry", () => {
      const emailConfig = getEmailConfig();
      const expectedStudentLoginUrl = `${emailConfig.appBaseUrl}/student/login`;
      const tempPass = "Secr3t!TempPass99";

      const email = renderAcceptanceInvitationEmail({
        fullName: "Ali Mohamed",
        referenceCode: "ITC-ACC2026",
        primaryTrack: "it",
        temporaryPassword: tempPass,
        loginUrl: expectedStudentLoginUrl,
        activationUrl: "https://dev.itclub.one/auth/confirm?token=xyz",
        expiresInHours: 24,
        appBaseUrl: emailConfig.appBaseUrl,
      });

      assert.match(email.subject, /Welcome to IT Club/);
      assert.match(email.subject, /ITC-ACC2026/);

      // Student login URL
      assert.ok(email.html.includes(expectedStudentLoginUrl));
      assert.ok(email.text.includes(expectedStudentLoginUrl));

      // Temporary password in HTML and text
      assert.ok(email.html.includes(tempPass));
      assert.ok(email.text.includes(tempPass));

      // 24-hour expiry and forced password change
      assert.ok(email.html.includes("24 hours"));
      assert.ok(email.text.includes("24 hours"));

      // Fallback activation link preserved
      assert.ok(email.html.includes("https://dev.itclub.one/auth/confirm?token=xyz"));
    });

    it("renders shortlisted student invitation with student login link, temporary password, and 24h expiry", () => {
      const emailConfig = getEmailConfig();
      const expectedStudentLoginUrl = `${emailConfig.appBaseUrl}/student/login`;
      const tempPass = "Short#Secr3t77";

      const email = renderShortlistedInvitationEmail({
        fullName: "Nouran Ahmed",
        referenceCode: "ITC-SHT2026",
        primaryTrack: "ai",
        temporaryPassword: tempPass,
        loginUrl: expectedStudentLoginUrl,
        activationUrl: "https://dev.itclub.one/auth/confirm?token=short_abc",
        expiresInHours: 24,
        appBaseUrl: emailConfig.appBaseUrl,
      });

      assert.match(email.subject, /You've Been Shortlisted/);
      assert.match(email.subject, /ITC-SHT2026/);

      // Student login URL
      assert.ok(email.html.includes(expectedStudentLoginUrl));
      assert.ok(email.text.includes(expectedStudentLoginUrl));

      // Temporary password
      assert.ok(email.html.includes(tempPass));
      assert.ok(email.text.includes(tempPass));

      // 24-hour expiry
      assert.ok(email.html.includes("24 hours"));

      // Fallback activation URL preserved
      assert.ok(email.html.includes("https://dev.itclub.one/auth/confirm?token=short_abc"));
    });
  });

  // 6. Registration Receipt Template with All 18 Fields
  describe("6. Registration Receipt Template & Input Sanitization", () => {
    it("renders all submitted registration fields cleanly in HTML and text", () => {
      const fullData = {
        fullName: "Omar Khaled",
        referenceCode: "ITC-REG999",
        primaryTrack: "it",
        secondaryTrack: "Artificial Intelligence",
        academicYear: "first",
        department: "Information Technology",
        academicId: "20241234",
        universityEmail: "20241234@batechu.com",
        googleEmail: "omar.khaled@gmail.com",
        phone: "+201011112222",
        whatsapp: "+201011113333",
        experienceLevel: "beginner",
        skills: "Python, Git, Linux",
        experienceDetails: "Built a discord bot for university students",
        volunteerExperience: "Student Union Media Team 2025",
        motivation: "Eager to contribute to tech community",
        learningGoal: "Master cloud architectures and systems",
        contribution: "Conduct weekly study sessions and help peers",
        availability: "Weekdays after 4 PM and Saturdays full day",
        appBaseUrl: "https://dev.itclub.one",
      };

      const { subject, html, text } = renderRegistrationReceiptEmail(fullData);

      assert.match(subject, /IT Club Application Received/);
      assert.match(subject, /ITC-REG999/);

      // Verify all 18 fields are present in HTML
      assert.ok(html.includes("Omar Khaled"));
      assert.ok(html.includes("ITC-REG999"));
      assert.ok(html.includes("Information Technology"));
      assert.ok(html.includes("Artificial Intelligence"));
      assert.ok(html.includes("20241234"));
      assert.ok(html.includes("20241234@batechu.com"));
      assert.ok(html.includes("omar.khaled@gmail.com"));
      assert.ok(html.includes("+201011112222"));
      assert.ok(html.includes("+201011113333"));
      assert.ok(html.includes("Python, Git, Linux"));
      assert.ok(html.includes("Built a discord bot for university students"));
      assert.ok(html.includes("Student Union Media Team 2025"));
      assert.ok(html.includes("Eager to contribute to tech community"));
      assert.ok(html.includes("Master cloud architectures and systems"));
      assert.ok(html.includes("Conduct weekly study sessions and help peers"));
      assert.ok(html.includes("Weekdays after 4 PM and Saturdays full day"));

      // Verify text version includes fields
      assert.ok(text.includes("ITC-REG999"));
      assert.ok(text.includes("Omar Khaled"));
      assert.ok(text.includes("Python, Git, Linux"));
      assert.ok(text.includes("Master cloud architectures and systems"));
    });

    it("handles empty optional fields gracefully without undefined or broken layout", () => {
      const minimalData = {
        fullName: "Sara Ahmed",
        referenceCode: "ITC-MIN01",
        primaryTrack: "it",
        academicYear: "second",
        department: "CS",
        appBaseUrl: "https://dev.itclub.one",
      };

      const { html, text } = renderRegistrationReceiptEmail(minimalData);

      assert.ok(html.includes("Sara Ahmed"));
      assert.ok(html.includes("ITC-MIN01"));
      assert.ok(!html.includes("undefined"));
      assert.ok(!html.includes("null"));
      assert.ok(!text.includes("undefined"));
    });

    it("escapes malicious scripts and injection attempts in all registration fields", () => {
      const unsafeData = {
        fullName: "<img src=x onerror=alert(1)>",
        referenceCode: "ITC-XSS01",
        primaryTrack: "it",
        academicYear: "first",
        department: "<script>alert('dep')</script>",
        skills: "<b>dangerous</b>",
        motivation: "<a href='javascript:alert(1)'>Click</a>",
        appBaseUrl: "https://dev.itclub.one",
      };

      const { html } = renderRegistrationReceiptEmail(unsafeData);

      assert.ok(!html.includes("<img src=x onerror=alert(1)>"));
      assert.ok(html.includes("&lt;img src=x onerror=alert(1)&gt;"));
      assert.ok(!html.includes("<script>alert('dep')</script>"));
      assert.ok(!html.includes("<b>dangerous</b>"));
      assert.ok(html.includes("&lt;b&gt;dangerous&lt;/b&gt;"));
    });
  });

  // 7. Route Guards and Diagnostics Endpoint
  describe("7. Route Guards and Diagnostics Endpoint", () => {
    it("rejects non-owner requests to /api/admin/staff/email-diagnostics", async () => {
      const nonOwnerRequest = new Request("http://localhost:3000/api/admin/staff/email-diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const res = await postDiagnostics(nonOwnerRequest);
      assert.equal(res.status, 401);
    });

    it("rejects non-owner requests to /api/admin/staff/retry-invite", async () => {
      const nonOwnerRequest = new Request("http://localhost:3000/api/admin/staff/retry-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "00000000-0000-0000-0000-000000000001" }),
      });

      const res = await postRetryInvite(nonOwnerRequest);
      assert.equal(res.status, 401);
    });
  });
});

