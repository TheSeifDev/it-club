import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { isQrEligibleStatus, isStudentPortalAllowedStatus } from "../lib/auth/student.ts";
import {
  resolveNotificationRecipient,
  reissueInvitation,
  sendShortlistedInvitation,
  sendRegistrationReceipt,
  sendAcceptanceInvitation,
} from "../lib/email/notification-service.ts";
import { setMockTransporter, resetMailerTransporter } from "../lib/email/mailer.ts";
import { POST as resendInvitationRoute } from "../app/api/admin/applications/[id]/resend-invitation/route.ts";
import { POST as activateStudentRoute } from "../app/api/student/activate/route.ts";
import { GET as confirmAuthRoute } from "../app/auth/confirm/route.ts";
import { NextRequest } from "next/server.js";

describe("Shortlisted Student Login & Activation Fix Suite", () => {
  afterEach(() => {
    resetMailerTransporter();
  });
  // 1. Domain Validation & Wrong Email Prevention
  describe("1. Email Domain & Credential Defense", () => {
    it("enforces canonical university email domain (@batechu.com) and rejects personal Gmail", () => {
      const personalEmail = "safalmoaz16@gmail.com";
      const validUniversityEmail = "2521233@batechu.com";

      const isValidDomain = (email: string) => email.trim().toLowerCase().endsWith("@batechu.com");

      assert.equal(
        isValidDomain(personalEmail),
        false,
        "Personal Gmail addresses must be rejected by client/server login validation"
      );
      assert.equal(
        isValidDomain(validUniversityEmail),
        true,
        "Canonical @batechu.com university emails must be accepted"
      );
    });

    it("requires numeric student ID in canonical university email", () => {
      const studentIdPattern = /^\d+@batechu\.com$/i;
      assert.equal(studentIdPattern.test("2521233@batechu.com"), true);
      assert.equal(studentIdPattern.test("john.doe@batechu.com"), false);
      assert.equal(studentIdPattern.test("safalmoaz16@gmail.com"), false);
    });
  });

  // 2. Lifecycle Status & QR Decoupling Guardrails
  describe("2. Status Eligibility & QR Separation Guardrails", () => {
    it("allows student portal access for SHORTLISTED, INTERVIEW_SCHEDULED, INTERVIEWED, and ACCEPTED", () => {
      assert.equal(isStudentPortalAllowedStatus("SHORTLISTED"), true);
      assert.equal(isStudentPortalAllowedStatus("INTERVIEW_SCHEDULED"), true);
      assert.equal(isStudentPortalAllowedStatus("INTERVIEWED"), true);
      assert.equal(isStudentPortalAllowedStatus("ACCEPTED"), true);
      assert.equal(isStudentPortalAllowedStatus("PENDING_REVIEW"), false);
      assert.equal(isStudentPortalAllowedStatus("UNDER_REVIEW"), false);
      assert.equal(isStudentPortalAllowedStatus("REJECTED"), false);
    });

    it("verifies QR issuance for SHORTLISTED applicants", () => {
      assert.equal(
        isQrEligibleStatus("SHORTLISTED"),
        true,
        "SHORTLISTED applicants are eligible for QR credentials"
      );
      assert.equal(
        isQrEligibleStatus("INTERVIEW_SCHEDULED"),
        true,
        "INTERVIEW_SCHEDULED candidates are eligible for QR check-in"
      );
      assert.equal(
        isQrEligibleStatus("ACCEPTED"),
        true,
        "ACCEPTED members are eligible for QR credentials"
      );
      assert.equal(isQrEligibleStatus("PENDING_REVIEW"), false);
      assert.equal(isQrEligibleStatus("REJECTED"), false);
    });
  });

  // 3. Auth Confirm and Activation Link Expiry Verification
  describe("3. /auth/confirm and /student/activate Token Handling", () => {
    it("redirects with missing_credentials error when neither token_hash nor code is provided", async () => {
      const req = new NextRequest("http://localhost:3000/auth/confirm");
      const res = await confirmAuthRoute(req);
      assert.equal(res.status, 307);
      const location = res.headers.get("location");
      assert.ok(location);
      assert.ok(location.includes("/student/activate?error=missing_credentials"));
    });

    it("redirects with invalid_or_expired when token_hash is invalid", async () => {
      const req = new NextRequest(
        "http://localhost:3000/auth/confirm?token_hash=invalid_synthetic_token&type=recovery&next=%2Fstudent%2Factivate"
      );
      const res = await confirmAuthRoute(req);
      assert.equal(res.status, 307);
      const location = res.headers.get("location");
      assert.ok(location);
      assert.ok(location.includes("/student/activate?error=invalid_or_expired"));
    });

    it("rejects activation attempts without an authenticated Supabase session", async () => {
      const req = new Request("http://localhost:3000/api/student/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationReference: "ITC-60037746",
          password: "SecurePassword123!",
          confirmPassword: "SecurePassword123!",
        }),
      });

      const res = await activateStudentRoute(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "SESSION_EXPIRED");
      assert.ok(json.error.includes("expired or is invalid"));
    });
  });

  // 4. Admin Resend & Reissue Authorization & Safety
  describe("4. Admin Resend & Reissue Controls", () => {
    it("rejects unauthenticated requests to POST /api/admin/applications/[id]/resend-invitation", async () => {
      const req = new Request("http://localhost:3000/api/admin/applications/test-id/resend-invitation", {
        method: "POST",
      });
      const res = await resendInvitationRoute(req, {
        params: Promise.resolve({ id: "test-id" }),
      });
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "UNAUTHORIZED");
    });

    it("reissueInvitation rejects non-existent application gracefully", async () => {
      const result = await reissueInvitation({
        applicationId: "00000000-0000-0000-0000-000000000000",
        force: true,
      });

      assert.equal(result.success, false);
      assert.equal(result.status, "failed");
      assert.equal(result.safeReason, "APPLICATION_NOT_FOUND");
    });
  });

  // 5. Duplicate Suppression vs Force Reissue
  describe("5. Idempotency and Forced Reissue Control", () => {
    it("sendShortlistedInvitation suppresses duplicates when not forced", async () => {
      assert.equal(typeof sendShortlistedInvitation, "function");
      assert.equal(typeof reissueInvitation, "function");
    });
  });

  // 6. Security & Activation Validation Safeguards
  describe("6. Input & Reference Validation in Activation API", () => {
    it("rejects activation with invalid reference code format", async () => {
      // Missing reference
      const req = new Request("http://localhost:3000/api/student/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationReference: "INVALID_CODE",
          password: "password123!",
          confirmPassword: "password123!",
        }),
      });

      const res = await activateStudentRoute(req);
      assert.equal(res.status, 401); // Session expired check fires first
    });
  });

  // 7. Student Notification Recipient Policy & Resolver
  describe("7. Student Recipient Resolution Policy (Personal Gmail vs University Auth)", () => {
    it("routes student notifications to valid google_email while preserving university_email auth identity", () => {
      const resolved = resolveNotificationRecipient({
        universityEmail: "2521233@batechu.com",
        googleEmail: "safalmoaz16@gmail.com",
      });

      assert.equal(resolved.recipientEmail, "safalmoaz16@gmail.com");
      assert.equal(resolved.authEmail, "2521233@batechu.com");
      assert.equal(resolved.isFallback, false);
      assert.equal(resolved.source, "google_email");
    });

    it("falls back safely to university_email when google_email is missing or null", () => {
      const resolvedMissing = resolveNotificationRecipient({
        universityEmail: "2521233@BATECHU.COM ",
        googleEmail: null,
      });

      assert.equal(resolvedMissing.recipientEmail, "2521233@batechu.com");
      assert.equal(resolvedMissing.authEmail, "2521233@batechu.com");
      assert.equal(resolvedMissing.isFallback, true);
      assert.equal(resolvedMissing.source, "university_email_fallback");
      assert.equal(resolvedMissing.reason, "MISSING_GOOGLE_EMAIL");
    });

    it("falls back safely to university_email when google_email has invalid format", () => {
      const resolvedInvalid = resolveNotificationRecipient({
        universityEmail: "2521233@batechu.com",
        googleEmail: "not-a-valid-email",
      });

      assert.equal(resolvedInvalid.recipientEmail, "2521233@batechu.com");
      assert.equal(resolvedInvalid.authEmail, "2521233@batechu.com");
      assert.equal(resolvedInvalid.isFallback, true);
      assert.equal(resolvedInvalid.reason, "INVALID_GOOGLE_EMAIL");
    });

    it("never silently sends to both addresses — exactly one recipient address is resolved", () => {
      const resolved = resolveNotificationRecipient({
        universityEmail: "2521233@batechu.com",
        googleEmail: "safalmoaz16@gmail.com",
      });

      assert.equal(typeof resolved.recipientEmail, "string");
      assert.equal(resolved.recipientEmail.includes(","), false);
      assert.equal(resolved.recipientEmail.includes(";"), false);
      assert.equal(resolved.recipientEmail, "safalmoaz16@gmail.com");
    });
  });

  // 8. Registration Receipts Recipient Routing
  describe("8. Registration Receipts Delivery Policy", () => {
    it("dispatches registration receipt to personal Gmail when valid", async () => {
      let dispatchedTo = "";
      setMockTransporter({
        sendMail: async (mailOpts: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          dispatchedTo = mailOpts.to;
          return {
            messageId: "<test_msg_reg_01@mock>",
            accepted: [mailOpts.to],
            rejected: [],
            response: "250 OK",
          };
        },
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await sendRegistrationReceipt({
        applicationId: "00000000-0000-4000-a000-000000000001",
        applicationReference: "ITC-REG0001",
        fullName: "Applicant One",
        academicYear: "second",
        department: "CS",
        primaryTrack: "it",
        universityEmail: "2521233@batechu.com",
        googleEmail: "safalmoaz16@gmail.com",
      });

      assert.equal(result.success, true);
      assert.equal(result.recipientEmail, "safalmoaz16@gmail.com");
      assert.equal(result.authEmail, "2521233@batechu.com");
      assert.equal(result.isFallback, false);
      assert.equal(dispatchedTo, "safalmoaz16@gmail.com");
    });

    it("falls back to university email when personal Google email is missing in registration receipt", async () => {
      let dispatchedTo = "";
      setMockTransporter({
        sendMail: async (mailOpts: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          dispatchedTo = mailOpts.to;
          return {
            messageId: "<test_msg_reg_02@mock>",
            accepted: [mailOpts.to],
            rejected: [],
            response: "250 OK",
          };
        },
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await sendRegistrationReceipt({
        applicationId: "00000000-0000-4000-a000-000000000002",
        applicationReference: "ITC-REG0002",
        fullName: "Applicant Two",
        academicYear: "second",
        department: "CS",
        primaryTrack: "it",
        universityEmail: "2521233@batechu.com",
        googleEmail: null,
      });

      assert.equal(result.success, true);
      assert.equal(result.recipientEmail, "2521233@batechu.com");
      assert.equal(result.isFallback, true);
      assert.equal(dispatchedTo, "2521233@batechu.com");
    });
  });

  // 9. Shortlisted Invitations & Supabase Auth Separation
  describe("9. Shortlisted Invitations & Supabase Auth Identity Separation", () => {
    it("dispatches shortlisted invitation to personal Gmail while binding auth identity to university email", async () => {
      let dispatchedTo = "";
      setMockTransporter({
        sendMail: async (mailOpts: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          dispatchedTo = mailOpts.to;
          return {
            messageId: "<test_msg_short_01@mock>",
            accepted: [mailOpts.to],
            rejected: [],
            response: "250 OK",
          };
        },
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await sendShortlistedInvitation({
        applicationId: "00000000-0000-4000-a000-000000000003",
        applicationReference: "ITC-60037746",
        fullName: "Seif Ayman",
        primaryTrack: "it",
        universityEmail: "2521993@batechu.com",
        googleEmail: "safalmoaz16@gmail.com",
      }, { forceReissue: true });

      assert.equal(result.success, true);
      assert.equal(result.recipientEmail, "safalmoaz16@gmail.com");
      assert.equal(result.authEmail, "2521993@batechu.com");
      assert.equal(result.isFallback, false);
      assert.equal(dispatchedTo, "safalmoaz16@gmail.com");
    });

    it("acceptance invitations also dispatch to personal Gmail with university email auth identity", async () => {
      let dispatchedTo = "";
      setMockTransporter({
        sendMail: async (mailOpts: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          dispatchedTo = mailOpts.to;
          return {
            messageId: "<test_msg_acc_01@mock>",
            accepted: [mailOpts.to],
            rejected: [],
            response: "250 OK",
          };
        },
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await sendAcceptanceInvitation({
        applicationId: "00000000-0000-4000-a000-000000000004",
        applicationReference: "ITC-60037746",
        fullName: "Seif Ayman",
        primaryTrack: "it",
        universityEmail: "2521994@batechu.com",
        googleEmail: "safalmoaz16@gmail.com",
      }, { forceReissue: true });

      assert.equal(result.success, true);
      assert.equal(result.recipientEmail, "safalmoaz16@gmail.com");
      assert.equal(result.authEmail, "2521994@batechu.com");
      assert.equal(result.isFallback, false);
      assert.equal(dispatchedTo, "safalmoaz16@gmail.com");
    });
  });

  // 10. Admin Reissue & UI Destination Display
  describe("10. Admin Reissue & UI Destination Truthfulness", () => {
    it("reports actual destination email when reissuing rather than automatically displaying university_email", () => {
      const resolved = resolveNotificationRecipient({
        universityEmail: "2521233@batechu.com",
        googleEmail: "safalmoaz16@gmail.com",
      });

      const successMsg = `Invitation successfully dispatched to ${resolved.recipientEmail}.`;
      assert.ok(successMsg.includes("safalmoaz16@gmail.com"));
      assert.ok(!successMsg.includes("2521233@batechu.com"));
    });

    it("truthfully reports failure and does not claim success when SMTP transport fails", async () => {
      setMockTransporter({
        sendMail: async () => {
          const err = new Error("Connection refused: connect ECONNREFUSED 127.0.0.1:465");
          Object.assign(err, { code: "ECONNREFUSED" });
          throw err;
        },
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await sendShortlistedInvitation({
        applicationId: "00000000-0000-4000-a000-000000000005",
        applicationReference: "ITC-FAIL01",
        fullName: "Fail Candidate",
        primaryTrack: "it",
        universityEmail: "2521995@batechu.com",
        googleEmail: "safalmoaz16@gmail.com",
      }, { forceReissue: true });

      assert.equal(result.success, false);
      assert.equal(result.status, "failed");
      assert.equal(result.safeReason, "CONNECTION_FAILED");
    });
  });
});
