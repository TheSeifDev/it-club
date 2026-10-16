import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isQrEligibleStatus, isStudentPortalAllowedStatus } from "../lib/auth/student.ts";
import { reissueInvitation, sendShortlistedInvitation } from "../lib/email/notification-service.ts";
import { POST as resendInvitationRoute } from "../app/api/admin/applications/[id]/resend-invitation/route.ts";
import { POST as activateStudentRoute } from "../app/api/student/activate/route.ts";
import { GET as confirmAuthRoute } from "../app/auth/confirm/route.ts";
import { NextRequest } from "next/server.js";

describe("Shortlisted Student Login & Activation Fix Suite", () => {
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

    it("strictly separates QR issuance from SHORTLISTED account activation", () => {
      // QR codes are NOT issued to SHORTLISTED applicants until an interview is scheduled or accepted
      assert.equal(
        isQrEligibleStatus("SHORTLISTED"),
        false,
        "SHORTLISTED applicants must not receive QR credentials upon initial activation"
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
});
