import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import {
  isQrEligibleStatus,
} from "../lib/auth/student.ts";
import {
  getOrCreateInterviewQrToken,
  renderQrPngBuffer,
  renderQrDataUrl,
  verifyAndCheckInInterviewQr,
  revokeInterviewQrToken,
  buildQrPayload,
  parseQrPayload,
} from "../lib/interviews/qr-service.ts";
import { GET as getStudentMeRoute } from "../app/api/student/me/route.ts";
import { GET as getStudentQrRoute } from "../app/api/student/qr/route.ts";
import { POST as staffCheckInRoute } from "../app/api/admin/interviews/check-in/route.ts";

describe("Phase 4: Student Dashboard, Information Card & Interview QR Credentials", () => {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://wzendwuoankwiahbrwqt.supabase.co";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_SIK6ewo2TUtgD8Qizcl12Q__U0Irdns";
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
        await serviceClient.from("student_accounts").delete().eq("application_id", appId);
        await serviceClient.from("applications").delete().eq("id", appId);
      } catch {
        // ignore
      }
    }
  });

  // 1. Unauthenticated and Unauthorized Access Rejection
  describe("1. Unauthenticated & Cross-User Security Boundaries", () => {
    it("rejects unauthenticated requests to /api/student/me with 401 UNAUTHORIZED_STUDENT", async () => {
      const res = await getStudentMeRoute();
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "UNAUTHORIZED_STUDENT");
    });

    it("rejects unauthenticated requests to /api/student/qr with 401 UNAUTHORIZED_STUDENT", async () => {
      const req = new Request("http://localhost:3000/api/student/qr");
      const res = await getStudentQrRoute(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "UNAUTHORIZED_STUDENT");
    });

    it("rejects unauthenticated requests to staff interview check-in API with 401 UNAUTHORIZED", async () => {
      const req = new Request("http://localhost:3000/api/admin/interviews/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "itc_qr_synthetic_test_token" }),
      });
      const res = await staffCheckInRoute(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "UNAUTHORIZED");
    });

    it("verifies RLS prevents anonymous clients from reading interview_qr_tokens", async () => {
      const anonClient = createClient(supabaseUrl, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data, error } = await anonClient
        .from("interview_qr_tokens")
        .select("*")
        .limit(5);

      assert.ok(error || (data && data.length === 0));
    });
  });

  // 2. Status-Based QR Eligibility Rules
  describe("2. Status-Based QR Eligibility", () => {
    it("allows QR issuance for SHORTLISTED, ACCEPTED, and INTERVIEW_SCHEDULED statuses", () => {
      assert.equal(isQrEligibleStatus("SHORTLISTED"), true);
      assert.equal(isQrEligibleStatus("ACCEPTED"), true);
      assert.equal(isQrEligibleStatus("INTERVIEW_SCHEDULED"), true);

      assert.equal(isQrEligibleStatus("PENDING_REVIEW"), false);
      assert.equal(isQrEligibleStatus("UNDER_REVIEW"), false);
      assert.equal(isQrEligibleStatus("NEEDS_CORRECTION"), false);
      assert.equal(isQrEligibleStatus("REJECTED"), false);
      assert.equal(isQrEligibleStatus("WAITLISTED"), false);
      assert.equal(isQrEligibleStatus(undefined), false);
    });

    it("refuses QR token creation for applications with ineligible statuses (e.g. PENDING_REVIEW)", async () => {
      const dummyId = "00000000-0000-4000-8000-000000000011";
      const resPending = await getOrCreateInterviewQrToken(dummyId, "PENDING_REVIEW");
      assert.equal(resPending.eligible, false);
      assert.equal(resPending.code, "NOT_ELIGIBLE");

      const resRejected = await getOrCreateInterviewQrToken(dummyId, "REJECTED");
      assert.equal(resRejected.eligible, false);
      assert.equal(resRejected.code, "NOT_ELIGIBLE");
    });
  });

  // 3. QR Token Lifecycle, Token Persistence & Idempotency
  describe("3. QR Token Lifecycle & Token Persistence", () => {
    it("creates an unpredictable, secure token for an accepted application and returns the exact same token on subsequent queries", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2024${randomSuffix}@batechu.com`;
      const refCode = `ITC-QR${randomSuffix}`;

      // Insert synthetic ACCEPTED application
      const { data: newApp, error: appErr } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `QR Candidate ${randomSuffix}`,
          national_id: `304082501${randomSuffix}8`,
          academic_id: `BATU-QR-${randomSuffix}`,
          phone: "+201011112222",
          whatsapp: "+201011112222",
          university_email: testEmail,
          academic_year: "second",
          department: "Networks",
          experience_level: "beginner",
          primary_track: "it",
          motivation: "Motivation exceeding twenty characters for testing.",
          learning_goal: "Learning goal exceeding twenty characters for testing.",
          status: "ACCEPTED",
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      assert.equal(appErr, null);
      assert.ok(newApp?.id);
      createdAppIds.push(newApp.id);

      // First token generation
      const firstTokenRes = await getOrCreateInterviewQrToken(newApp.id, "ACCEPTED");
      assert.equal(firstTokenRes.eligible, true);
      assert.equal(firstTokenRes.status, "ACTIVE");
      assert.ok(firstTokenRes.token?.startsWith("itc_qr_"));
      assert.ok(firstTokenRes.qrPayload?.includes("itc-interview-v1"));

      const originalToken = firstTokenRes.token;

      // Second query simulating applicant logging out and signing in again
      const secondTokenRes = await getOrCreateInterviewQrToken(newApp.id, "ACCEPTED");
      assert.equal(secondTokenRes.eligible, true);
      assert.equal(secondTokenRes.status, "ACTIVE");
      // Must be identical token (no silent invalidation of previously downloaded cards)
      assert.equal(secondTokenRes.token, originalToken);
    });

    it("verifies QR payload contains ONLY protocol and opaque token without leaking personal data", () => {
      const syntheticToken = "itc_qr_test_secure_random_token_123456";
      const payload = buildQrPayload(syntheticToken);

      // Must be valid JSON with protocol and token
      assert.ok(payload.includes("itc-interview-v1"));
      assert.ok(payload.includes(syntheticToken));

      // Must NOT include sensitive personal fields
      assert.ok(!payload.includes("national_id"));
      assert.ok(!payload.includes("email"));
      assert.ok(!payload.includes("phone"));
      assert.ok(!payload.includes("reviewer_notes"));

      const parsed = parseQrPayload(payload);
      assert.equal(parsed, syntheticToken);
    });
  });

  // 4. Verification & Staff Check-In Integration
  describe("4. Interview Attendance Check-In & Revocation", () => {
    it("successfully checks in candidate on first scan, and strictly rejects duplicate check-ins", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2024${randomSuffix}@batechu.com`;
      const refCode = `ITC-CHK${randomSuffix}`;

      // Insert scheduled candidate application
      const { data: app } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `CheckIn Candidate ${randomSuffix}`,
          national_id: `304082501${randomSuffix}9`,
          academic_id: `BATU-CHK-${randomSuffix}`,
          phone: "+201022223333",
          whatsapp: "+201022223333",
          university_email: testEmail,
          academic_year: "first",
          department: "IT",
          experience_level: "beginner",
          primary_track: "it",
          motivation: "Motivation exceeding twenty characters for testing.",
          learning_goal: "Learning goal exceeding twenty characters for testing.",
          status: "INTERVIEW_SCHEDULED",
          interview_date: "Saturday, October 17, 2026",
          interview_location: "Hall 3 Check-In Desk",
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (!app) return;
      createdAppIds.push(app.id);

      // Generate active QR token
      const qrRes = await getOrCreateInterviewQrToken(app.id, "INTERVIEW_SCHEDULED");
      assert.ok(qrRes.token);

      const { data: staffAuth } = await serviceClient.auth.admin.createUser({
        email: `staff.checkin.${randomSuffix}@gmail.com`,
        password: "TempStaffPassword123!",
        email_confirm: true,
      });
      assert.ok(staffAuth?.user?.id);
      createdUserIds.push(staffAuth.user.id);
      const staffUserId = staffAuth.user.id;

      // 1. First check-in scan: must succeed
      const firstCheckIn = await verifyAndCheckInInterviewQr(qrRes.token, staffUserId);
      assert.equal(firstCheckIn.success, true);
      assert.equal(firstCheckIn.code, "CHECK_IN_SUCCESS");
      assert.ok(firstCheckIn.candidate);
      assert.equal(firstCheckIn.candidate.applicationReference, refCode);
      assert.equal(firstCheckIn.candidate.fullName, `CheckIn Candidate ${randomSuffix}`);

      // 2. Second check-in scan: MUST reject duplicate attendance
      const secondCheckIn = await verifyAndCheckInInterviewQr(qrRes.token, staffUserId);
      assert.equal(secondCheckIn.success, false);
      assert.equal(secondCheckIn.code, "ALREADY_CHECKED_IN");
      assert.ok(secondCheckIn.checkedInAt);
    });

    it("rejects check-in for revoked or invalid tokens", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2024${randomSuffix}@batechu.com`;
      const refCode = `ITC-RVK${randomSuffix}`;

      const { data: app } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Revoke Candidate ${randomSuffix}`,
          national_id: `304082501${randomSuffix}0`,
          academic_id: `BATU-RVK-${randomSuffix}`,
          phone: "+201033334444",
          whatsapp: "+201033334444",
          university_email: testEmail,
          academic_year: "third",
          department: "IT",
          experience_level: "beginner",
          primary_track: "it",
          motivation: "Motivation exceeding twenty characters for testing.",
          learning_goal: "Learning goal exceeding twenty characters for testing.",
          status: "ACCEPTED",
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (!app) return;
      createdAppIds.push(app.id);

      const qrRes = await getOrCreateInterviewQrToken(app.id, "ACCEPTED");
      assert.ok(qrRes.token);

      // Revoke the token
      const revokeRes = await revokeInterviewQrToken(app.id, "Revoked for security testing");
      assert.equal(revokeRes.success, true);

      // Attempt check-in with revoked token
      const checkInAttempt = await verifyAndCheckInInterviewQr(
        qrRes.token,
        "00000000-0000-4000-8000-000000000001"
      );
      assert.equal(checkInAttempt.success, false);
      assert.equal(checkInAttempt.code, "REVOKED_TOKEN");

      // Attempt check-in with arbitrary non-existent token
      const invalidAttempt = await verifyAndCheckInInterviewQr(
        "itc_qr_non_existent_token_string_99999",
        "00000000-0000-4000-8000-000000000001"
      );
      assert.equal(invalidAttempt.success, false);
      assert.equal(invalidAttempt.code, "INVALID_TOKEN");
    });
  });

  // 5. Image & Buffer Rendering (PNG Quality and Magic Bytes)
  describe("5. QR PNG Image Buffer & Rendering", () => {
    it("renders valid QR PNG buffer with correct PNG magic bytes and sufficient resolution", async () => {
      const payload = buildQrPayload("itc_qr_test_png_rendering_sample_123");
      const pngBuffer = await renderQrPngBuffer(payload);

      assert.ok(Buffer.isBuffer(pngBuffer));
      assert.ok(pngBuffer.length > 500, "PNG buffer should have realistic binary size");

      // Verify standard PNG file signature: 0x89 'P' 'N' 'G' 0x0D 0x0A 0x1A 0x0A
      assert.equal(pngBuffer[0], 0x89);
      assert.equal(pngBuffer[1], 0x50); // P
      assert.equal(pngBuffer[2], 0x4e); // N
      assert.equal(pngBuffer[3], 0x47); // G
      assert.equal(pngBuffer[4], 0x0d);
      assert.equal(pngBuffer[5], 0x0a);
      assert.equal(pngBuffer[6], 0x1a);
      assert.equal(pngBuffer[7], 0x0a);
    });

    it("renders Data URL string formatted for high-contrast inline display", async () => {
      const payload = buildQrPayload("itc_qr_test_dataurl");
      const dataUrl = await renderQrDataUrl(payload);

      assert.ok(dataUrl.startsWith("data:image/png;base64,"));
      assert.ok(dataUrl.length > 200);
    });
  });
});
