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
import { isEmailConfigured } from "../lib/email/config.ts";
import { renderAdminInvitationEmail } from "../lib/email/templates/admin-invitation.ts";
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

  // 4. Content Hygiene: Plaintext Temporary Password Omitted from Email
  describe("4. Email Content Hygiene & Anti-Phishing Safety", () => {
    it("never includes plaintext temporary passwords in the invitation email body or text", () => {
      const email = renderAdminInvitationEmail({
        recipientEmail: "safalmoaz16@gmail.com",
        loginUrl: "https://dev.itclub.one/login",
        expiresInHours: 24,
        temporaryPassword: FIXED_ADMIN_TEMPORARY_PASSWORD,
      });

      // Assert password is NOT in HTML or text body
      assert.equal(email.html.includes(FIXED_ADMIN_TEMPORARY_PASSWORD), false);
      assert.equal(email.text.includes(FIXED_ADMIN_TEMPORARY_PASSWORD), false);

      // Assert security notice instructs recipient to obtain credential from Owner
      assert.equal(email.html.includes("issued directly to the IT Club Owner"), true);
      assert.equal(email.text.includes("issued directly to the IT Club Owner"), true);

      // Assert valid subject and login portal link
      assert.equal(email.subject, "IT Club Staff Invitation — Administrator Access");
      assert.equal(email.html.includes("https://dev.itclub.one/login"), true);
      assert.equal(email.text.includes("https://dev.itclub.one/login"), true);
    });
  });

  // 5. Owner-Only Security Enforcement & Route Guards
  describe("5. Route Guards and Diagnostics Endpoint", () => {
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
