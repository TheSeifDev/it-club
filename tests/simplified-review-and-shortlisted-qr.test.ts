import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  isValidStatusTransition,
  VALID_STATUS_TRANSITIONS,
} from "../lib/admin/transitions.ts";
import { isQrEligibleStatus } from "../lib/auth/student.ts";
import {
  getOrCreateInterviewQrToken,
  verifyAndCheckInInterviewQr,
  renderQrPngBuffer,
} from "../lib/interviews/qr-service.ts";
import { GET as studentQrRoute } from "../app/api/student/qr/route.ts";
import { POST as staffCheckInRoute } from "../app/api/admin/interviews/check-in/route.ts";
import { PATCH as adminPatchApplicationRoute } from "../app/api/admin/applications/[id]/route.ts";

describe("Simplified Review Actions & Shortlisted QR Verification", () => {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://wzendwuoankwiahbrwqt.supabase.co";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const serviceClient = serviceKey
    ? createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

  const createdAppIds: string[] = [];
  const createdUserIds: string[] = [];

  after(async () => {
    if (!serviceClient) return;
    for (const uid of createdUserIds) {
      try {
        await serviceClient.auth.admin.deleteUser(uid);
      } catch {
        // ignore
      }
    }
    for (const appId of createdAppIds) {
      try {
        await serviceClient.from("interview_qr_tokens").delete().eq("application_id", appId);
        await serviceClient.from("applications").delete().eq("id", appId);
      } catch {
        // ignore
      }
    }
  });

  // 1. Review Status Transitions
  describe("1. Review Workflow Status Transitions", () => {
    it("confirms PENDING_REVIEW can transition to UNDER_REVIEW", () => {
      assert.equal(isValidStatusTransition("PENDING_REVIEW", "UNDER_REVIEW"), true);
    });

    it("confirms UNDER_REVIEW cannot transition repeatedly to UNDER_REVIEW", () => {
      assert.equal(isValidStatusTransition("UNDER_REVIEW", "UNDER_REVIEW"), false);
    });

    it("confirms permitted transitions for Reject Application", () => {
      assert.equal(isValidStatusTransition("PENDING_REVIEW", "REJECTED"), true);
      assert.equal(isValidStatusTransition("UNDER_REVIEW", "REJECTED"), true);
      assert.equal(isValidStatusTransition("SHORTLISTED", "REJECTED"), true);
      assert.equal(isValidStatusTransition("REJECTED", "REJECTED"), false);
    });

    it("confirms permitted transitions for Final Accept", () => {
      assert.equal(isValidStatusTransition("UNDER_REVIEW", "ACCEPTED"), true);
      assert.equal(isValidStatusTransition("SHORTLISTED", "ACCEPTED"), true);
      assert.equal(isValidStatusTransition("INTERVIEWED", "ACCEPTED"), true);
      assert.equal(isValidStatusTransition("ACCEPTED", "ACCEPTED"), false);
      assert.equal(isValidStatusTransition("PENDING_REVIEW", "ACCEPTED"), false);
    });
  });

  // 2. Client UI Contract Verification
  describe("2. Review Actions UI Layout & Waitlist Removal", () => {
    it("verifies ApplicantDetailClient renders Start Review, Reject Application, and Final Accept", () => {
      const clientFilePath = path.join(
        process.cwd(),
        "app/admin/applications/[id]/ApplicantDetailClient.tsx"
      );
      const content = fs.readFileSync(clientFilePath, "utf8");

      // Prominent Primary Action
      assert.ok(
        content.includes("START REVIEW · بدء المراجعة"),
        "Primary Start Review button must be present"
      );
      assert.ok(
        content.includes("REVIEW IN PROGRESS · قيد المراجعة"),
        "Meaningful in-progress state must be rendered when already Under Review"
      );

      // Secondary Actions
      assert.ok(
        content.includes("REJECT APPLICATION"),
        "Reject Application button must be present"
      );
      assert.ok(
        content.includes("FINAL ACCEPT"),
        "Final Accept button must be present"
      );

      // Waitlist Action Removed
      assert.ok(
        !content.includes("&bull; Add to Waitlist"),
        "Add to Waitlist action must be completely removed from ApplicantDetailClient active decisions"
      );
      assert.ok(
        !content.includes('onClick={() => setActionTargetStatus("WAITLISTED")}'),
        "No active waitlisting decision button should exist"
      );
    });

    it("preserves historical WAITLISTED state in system definitions", () => {
      assert.ok(VALID_STATUS_TRANSITIONS.WAITLISTED);
      assert.ok(Array.isArray(VALID_STATUS_TRANSITIONS.WAITLISTED));
    });
  });

  // 3. QR Eligibility for SHORTLISTED Applicants
  describe("3. QR Eligibility for SHORTLISTED Applicants", () => {
    it("authoritatively marks SHORTLISTED, INTERVIEW_SCHEDULED, and ACCEPTED as QR-eligible", () => {
      assert.equal(isQrEligibleStatus("SHORTLISTED"), true);
      assert.equal(isQrEligibleStatus("INTERVIEW_SCHEDULED"), true);
      assert.equal(isQrEligibleStatus("ACCEPTED"), true);
    });

    it("blocks all other statuses from QR eligibility", () => {
      assert.equal(isQrEligibleStatus("PENDING_REVIEW"), false);
      assert.equal(isQrEligibleStatus("UNDER_REVIEW"), false);
      assert.equal(isQrEligibleStatus("NEEDS_CORRECTION"), false);
      assert.equal(isQrEligibleStatus("REJECTED"), false);
      assert.equal(isQrEligibleStatus("WAITLISTED"), false);
      assert.equal(isQrEligibleStatus(null), false);
      assert.equal(isQrEligibleStatus(undefined), false);
    });
  });

  // 4. Server-Side QR Issuance, Check-in, and Attendance Security
  describe("4. QR Lifecycle, Check-In, and PII Protection for SHORTLISTED Candidates", () => {
    it("generates a valid QR token and payload for a SHORTLISTED applicant", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(Math.random() * 899999 + 100000);
      const { data: app, error } = await serviceClient
        .from("applications")
        .insert({
          application_reference: `ITC-SL-${randomSuffix}`,
          full_name: "Test Shortlist Candidate",
          national_id: `3010101${randomSuffix}1`,
          academic_id: `${randomSuffix}`,
          university_email: `${randomSuffix}@batechu.com`,
          phone: "01012345678",
          whatsapp: "01012345678",
          academic_year: "second",
          department: "Computer Science",
          primary_track: "it",
          experience_level: "experienced",
          motivation: "Test motivation",
          learning_goal: "Test learning goal",
          status: "SHORTLISTED",
          consented_at: new Date().toISOString(),
        })
        .select("id, status, application_reference")
        .single();

      assert.ok(!error && app, `Failed to insert test application: ${error?.message}`);
      createdAppIds.push(app.id);

      // 1. Issue QR token for shortlisted applicant
      const tokenRes = await getOrCreateInterviewQrToken(app.id, app.status);
      assert.equal(tokenRes.eligible, true);
      assert.ok(tokenRes.token);
      assert.ok(tokenRes.token.startsWith("itc_qr_"));
      assert.equal(tokenRes.status, "ACTIVE");

      // 2. Validate QR payload format does NOT contain PII
      const payload = tokenRes.qrPayload!;
      assert.ok(payload.includes("itc-interview-v1"));
      assert.ok(!payload.includes("Test Shortlist Candidate"));
      assert.ok(!payload.includes("301010112"));
      assert.ok(!payload.includes("@batechu.com"));
      assert.ok(!payload.includes("01012345678"));
      assert.ok(!payload.includes(app.application_reference));

      // 3. Render high-res PNG
      const pngBuffer = await renderQrPngBuffer(payload);
      assert.ok(Buffer.isBuffer(pngBuffer));
      assert.ok(pngBuffer.length > 500);

      // 4. Authorized staff check-in
      const { data: staffAuth } = await serviceClient.auth.admin.createUser({
        email: `staff_shortlist_scan_${randomSuffix}@batechu.com`,
        password: "TempStaffPassword123!",
        email_confirm: true,
      });
      assert.ok(staffAuth?.user?.id);
      createdUserIds.push(staffAuth.user.id);
      const staffUserId = staffAuth.user.id;

      const checkInRes = await verifyAndCheckInInterviewQr(tokenRes.token, staffUserId, "admin");
      assert.equal(checkInRes.success, true);
      assert.equal(checkInRes.code, "CHECK_IN_SUCCESS");
      assert.ok(checkInRes.checkedInAt);
      assert.equal(checkInRes.candidate?.applicationReference, app.application_reference);
      assert.equal(checkInRes.candidate?.fullName, "Test Shortlist Candidate");

      // Ensure sensitive data omitted from check-in response
      const checkInCandidate = checkInRes.candidate as Record<string, unknown>;
      assert.equal(checkInCandidate.national_id, undefined);
      assert.equal(checkInCandidate.phone, undefined);
      assert.equal(checkInCandidate.reviewer_notes, undefined);

      // 5. Duplicate check-in rejection
      const duplicateRes = await verifyAndCheckInInterviewQr(tokenRes.token, staffUserId, "admin");
      assert.equal(duplicateRes.success, false);
      assert.equal(duplicateRes.code, "ALREADY_CHECKED_IN");
      assert.ok(duplicateRes.checkedInAt);
      assert.equal(
        new Date(duplicateRes.checkedInAt).getTime(),
        new Date(checkInRes.checkedInAt!).getTime()
      );
    });

    it("rejects unauthenticated requests to /api/student/qr", async () => {
      const req = new Request("http://localhost:3000/api/student/qr");
      const res = await studentQrRoute(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "UNAUTHORIZED_STUDENT");
    });

    it("rejects unauthenticated requests to /api/admin/interviews/check-in", async () => {
      const req = new Request("http://localhost:3000/api/admin/interviews/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "itc_qr_test_token" }),
      });
      const res = await staffCheckInRoute(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "UNAUTHORIZED");
    });

    it("rejects unauthenticated requests to /api/admin/applications/[id] PATCH", async () => {
      const req = new Request("http://localhost:3000/api/admin/applications/some-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextStatus: "UNDER_REVIEW" }),
      });
      const res = await adminPatchApplicationRoute(req, {
        params: Promise.resolve({ id: "some-id" }),
      });
      assert.equal(res.status, 401);
    });
  });
});
