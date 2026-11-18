import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getAuthConfirmationDestination,
  getStaffLoginDestination,
  getStaffPostPasswordChangeDestination,
  sanitizeRedirectPath,
} from "../lib/auth/redirect.ts";
import { getLegacyRouteRedirect } from "../lib/auth/route-policy.ts";
import nextConfig from "../next.config.ts";
import { projectStudentApplication } from "../lib/auth/student-projection.ts";
import { generateStaffTemporaryPassword } from "../lib/auth/staff-credentials.ts";
import { authorizeEvaluationTarget } from "../lib/interviews/security.ts";
import {
  parseInterviewEvaluationPayload,
  parseQrRequestPayload,
  readBoundedJsonBody,
} from "../lib/interviews/request-validation.ts";

const CHECKED_IN_AT = "2026-11-18T18:00:00.000Z";
const VALID_EVALUATION = {
  role: "interviewer" as const,
  assignedCommittee: "it",
  applicationPrimaryTrack: "it",
  applicationStatus: "INTERVIEW_SCHEDULED",
  qrStatus: "CHECKED_IN",
  checkedInAt: CHECKED_IN_AT,
  qrExpiresAt: "2026-11-19T18:00:00.000Z",
  now: Date.parse("2026-11-18T19:00:00.000Z"),
};

describe("Isolated routing and security regressions", () => {
  it("projects only student-owned fields and masks raw national ID", () => {
    const rawNationalId = "30405150101234";
    const projected = projectStudentApplication({
      id: "application-1",
      application_reference: "ITC-AB12CD34",
      full_name: "Test Student",
      national_id: rawNationalId,
      academic_id: "20260001",
      phone: "+201000000000",
      whatsapp: "+201000000001",
      university_email: "20260001@batechu.com",
      google_email: "student@example.com",
      academic_year: "second",
      department: "Information Technology",
      experience_level: "beginner",
      skills: "TypeScript",
      experience_details: null,
      volunteer_experience: "Open-source work",
      primary_track: "it",
      secondary_track: "rnd",
      motivation: "Build useful software",
      learning_goal: "Learn security",
      contribution: "Frontend support",
      availability: "Weekends",
      status: "SHORTLISTED",
      interview_date: "2026-12-01",
      interview_time: "10:00",
      interview_location: "Campus",
      activated_at: "2026-11-18T18:00:00.000Z",
      consented_at: "2026-11-17T10:00:00.000Z",
      created_at: "2026-11-17T10:00:00.000Z",
      reviewer_notes: "internal reviewer note must not escape",
      reviewed_by: "reviewer-user-id",
      reviewed_at: "2026-11-18T10:00:00.000Z",
    });

    assert.equal(projected.national_id_masked, "•••• •••• •••• 1234");
    assert.equal(projected.phone, "+201000000000");
    assert.equal(projected.whatsapp, "+201000000001");
    assert.equal(projected.google_email, "student@example.com");
    assert.equal(projected.volunteer_experience, "Open-source work");
    assert.equal(projected.contribution, "Frontend support");
    assert.equal(projected.availability, "Weekends");
    assert.equal(projected.activated_at, "2026-11-18T18:00:00.000Z");

    const serialized = JSON.stringify(projected);
    assert.equal(serialized.includes(rawNationalId), false);
    assert.equal("national_id" in projected, false);
    assert.equal("reviewer_notes" in projected, false);
    assert.equal("reviewed_by" in projected, false);
    assert.equal("reviewed_at" in projected, false);
  });

  it("generates unique high-entropy URL-safe temporary staff credentials", () => {
    const first = generateStaffTemporaryPassword();
    const second = generateStaffTemporaryPassword();
    assert.notEqual(first, second);
    assert.equal(first.length, 32);
    assert.match(first, /^[A-Za-z0-9_-]{32}$/);
  });

  it("sanitizes staff destinations and maps only known legacy operations aliases", () => {
    assert.equal(sanitizeRedirectPath("/interview/applications?status=SHORTLISTED"), "/interview/applications?status=SHORTLISTED");
    assert.equal(sanitizeRedirectPath("/admin"), "/interview");
    assert.equal(sanitizeRedirectPath("/admin/settings"), "/interview");
    assert.equal(sanitizeRedirectPath("//evil.example"), "/interview");
    assert.equal(sanitizeRedirectPath("/\\evil.example"), "/interview");
    assert.equal(getLegacyRouteRedirect("/login"), "/interview/login");
    assert.equal(getLegacyRouteRedirect("/admin/applications/42"), "/interview/applications/42");
    assert.equal(getLegacyRouteRedirect("/admin"), null);
  });

  it("redirects the legacy admin login route to the canonical content-mode login", async () => {
    const redirects = await nextConfig.redirects?.();
    const adminLoginRedirect = redirects?.find((redirect) => redirect.source === "/admin/login");
    assert.equal(adminLoginRedirect?.destination, "/interview/login?mode=content");
    assert.equal(adminLoginRedirect?.permanent, false);
  });

  it("keeps content login fixed to /admin for verified owners only", () => {
    assert.equal(
      getStaffLoginDestination({ mode: "content", verifiedRole: "owner", next: "/interview" }),
      "/admin"
    );
    assert.equal(
      getStaffLoginDestination({ mode: "content", verifiedRole: "admin", next: "/admin" }),
      null
    );
    assert.equal(
      getStaffLoginDestination({ mode: "interview", verifiedRole: "owner", next: "/admin" }),
      "/interview"
    );
    assert.equal(
      getStaffPostPasswordChangeDestination({ verifiedRole: "owner", returnTo: "/admin" }),
      "/admin"
    );
    assert.equal(
      getStaffPostPasswordChangeDestination({ verifiedRole: "admin", returnTo: "/admin" }),
      "/interview"
    );
  });

  it("sends verified staff recovery to staff password change but keeps student callbacks on activation", () => {
    assert.equal(
      getAuthConfirmationDestination({ verificationType: "recovery", verifiedStaffRole: "owner" }),
      "/interview/change-password?next=%2Fadmin"
    );
    assert.equal(
      getAuthConfirmationDestination({ verificationType: "recovery", verifiedStaffRole: "admin" }),
      "/interview/change-password"
    );
    assert.equal(
      getAuthConfirmationDestination({ verificationType: "recovery", studentNext: "/student/activate" }),
      "/student/activate"
    );
    assert.equal(
      getAuthConfirmationDestination({ verificationType: "invite", studentNext: "//evil.example" }),
      "/student/activate"
    );
  });

  it("requires committee scope, allowed application status, and live checked-in QR for evaluations", () => {
    assert.deepEqual(authorizeEvaluationTarget(VALID_EVALUATION), { allowed: true });
    assert.equal(
      authorizeEvaluationTarget({ ...VALID_EVALUATION, assignedCommittee: "hr" }).allowed,
      false
    );
    assert.equal(
      authorizeEvaluationTarget({ ...VALID_EVALUATION, qrStatus: "ACTIVE" }).allowed,
      false
    );
    assert.equal(
      authorizeEvaluationTarget({ ...VALID_EVALUATION, applicationStatus: "REJECTED" }).allowed,
      false
    );
    assert.equal(
      authorizeEvaluationTarget({ ...VALID_EVALUATION, qrExpiresAt: "2026-11-18T18:30:00.000Z" }).allowed,
      false
    );
  });

  it("rejects malicious QR and evaluation request body shapes and bounds", async () => {
    assert.equal(parseQrRequestPayload(null).ok, false);
    assert.equal(parseQrRequestPayload([]).ok, false);
    assert.equal(parseQrRequestPayload({ token: 123 }).ok, false);
    assert.equal(parseQrRequestPayload({ token: " " }).ok, false);
    assert.deepEqual(parseQrRequestPayload({ token: "  itc_qr_valid-token  " }), {
      ok: true,
      token: "itc_qr_valid-token",
    });
    assert.equal(parseQrRequestPayload({ token: "x".repeat(2049) }).ok, false);

    assert.equal(parseInterviewEvaluationPayload(null).ok, false);
    assert.equal(parseInterviewEvaluationPayload([]).ok, false);
    assert.equal(parseInterviewEvaluationPayload({ applicationId: "x", evaluationNotes: 7 }).ok, false);
    assert.equal(parseInterviewEvaluationPayload({ applicationId: "x", rating: "OWNER" }).ok, false);
    assert.equal(parseInterviewEvaluationPayload({ applicationId: "x", recommendation: {} }).ok, false);
    assert.equal(
      parseInterviewEvaluationPayload({ applicationId: "x", evaluationNotes: "n".repeat(10_001) }).ok,
      false
    );
    assert.equal(
      parseInterviewEvaluationPayload({ applicationId: "x", recommendation: "r".repeat(2_001) }).ok,
      false
    );
    assert.deepEqual(parseInterviewEvaluationPayload({
      applicationId: " application-id ",
      evaluationNotes: "candidate notes",
      rating: "HIRE",
      recommendation: "  continue  ",
    }), {
      ok: true,
      payload: {
        applicationId: "application-id",
        evaluationNotes: "candidate notes",
        rating: "HIRE",
        recommendation: "continue",
      },
    });

    const oversized = await readBoundedJsonBody(new Request("https://example.invalid", {
      method: "POST",
      body: JSON.stringify({ token: "too large" }),
    }), 4);
    assert.deepEqual(oversized, { ok: false, code: "PAYLOAD_TOO_LARGE" });

    const malformed = await readBoundedJsonBody(new Request("https://example.invalid", {
      method: "POST",
      body: "{invalid",
    }), 64);
    assert.deepEqual(malformed, { ok: false, code: "MALFORMED_JSON" });
  });
});
