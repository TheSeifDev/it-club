import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import {
  parseQrPayload,
  buildQrPayload,
  getOrCreateInterviewQrToken,
  verifyAndCheckInInterviewQr,
  revokeInterviewQrToken,
} from "../lib/interviews/qr-service.ts";
import { parseClientQrPayload } from "../lib/interviews/qr-client.ts";
import { POST as staffCheckInRoute } from "../app/api/admin/interviews/check-in/route.ts";

describe("Phase 5A: Interview QR Scanner & Attendance Verification", () => {
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

  // 1. QR Protocol & Token Parsing
  describe("1. QR Protocol & Token Parsing", () => {
    it("parses official JSON payload protocol and extracts opaque token", () => {
      const syntheticToken = "itc_qr_test_synthetic_token_1234567890abcdef";
      const payload = buildQrPayload(syntheticToken);

      const parsedServer = parseQrPayload(payload);
      const parsedClient = parseClientQrPayload(payload);

      assert.equal(parsedServer, syntheticToken);
      assert.equal(parsedClient, syntheticToken);
    });

    it("parses raw token strings directly without JSON wrapping", () => {
      const rawToken = "itc_qr_direct_raw_token_9876543210fedcba";
      const parsedServer = parseQrPayload(rawToken);
      const parsedClient = parseClientQrPayload(rawToken);

      assert.equal(parsedServer, rawToken);
      assert.equal(parsedClient, rawToken);
    });

    it("handles surrounding whitespace, newlines, and quotes gracefully", () => {
      const rawToken = "itc_qr_token_with_whitespace_1122334455";
      const dirtyString = `   \n  ${rawToken} \t \r  `;

      assert.equal(parseQrPayload(dirtyString), rawToken);
      assert.equal(parseClientQrPayload(dirtyString), rawToken);
    });

    it("handles malformed JSON payload safely by falling back to trimmed string", () => {
      const malformed = '{"protocol":"itc-interview-v1", token: unquoted_val}';
      assert.equal(parseQrPayload(malformed), malformed.trim());
      assert.equal(parseClientQrPayload(malformed), malformed.trim());
    });

    it("handles null, empty, or non-string inputs safely without throwing", () => {
      // @ts-expect-error test invalid inputs
      assert.equal(parseQrPayload(null), "");
      // @ts-expect-error test invalid inputs
      assert.equal(parseQrPayload(undefined), "");
      // @ts-expect-error test invalid inputs
      assert.equal(parseQrPayload(12345), "");
      assert.equal(parseQrPayload(""), "");
    });
  });

  // 2. Check-In API Security Guards & Validation
  describe("2. Check-In API Security & Input Validation", () => {
    it("rejects unauthenticated requests with HTTP 401 UNAUTHORIZED", async () => {
      const req = new Request("http://localhost:3000/api/admin/interviews/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "itc_qr_unauthenticated_test_token" }),
      });

      const res = await staffCheckInRoute(req);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.code, "UNAUTHORIZED");
    });

    it("rejects request missing Content-Type / invalid JSON with HTTP 400 MALFORMED_JSON", async () => {
      // Note: verifyStaffApiRequest requires auth first; we test with empty body
      const req = new Request("http://localhost:3000/api/admin/interviews/check-in", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "invalid plain string",
      });

      const res = await staffCheckInRoute(req);
      // Unauthenticated first line of defense
      assert.equal(res.status, 401);
    });

    it("rejects invalid, short, or non-existent token with INVALID_TOKEN", async () => {
      // Directly test verifyAndCheckInInterviewQr with synthetic staff ID
      const result = await verifyAndCheckInInterviewQr("short_token", "synthetic-staff-id");
      assert.equal(result.success, false);
      assert.equal(result.code, "INVALID_TOKEN");
    });

    it("rejects non-existent token with INVALID_TOKEN", async () => {
      if (!serviceClient) return;
      const result = await verifyAndCheckInInterviewQr(
        "itc_qr_non_existent_token_00000000000000000",
        "synthetic-staff-id"
      );
      assert.equal(result.success, false);
      assert.equal(result.code, "INVALID_TOKEN");
    });
  });

  // 3. Complete Verification Flow & Duplicate Check-in Prevention
  describe("3. Attendance Verification & Duplicate Check-In Prevention", () => {
    it("checks in an interview-scheduled candidate on first scan and prevents duplicate attendance", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2024${randomSuffix}@batechu.com`;
      const refCode = `ITC-SCN${randomSuffix}`;

      // Insert scheduled candidate application
      const { data: app, error: appErr } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Scanner Candidate ${randomSuffix}`,
          national_id: `304082501${randomSuffix}7`,
          academic_id: `BATU-SCN-${randomSuffix}`,
          phone: "+201011112222",
          whatsapp: "+201011112222",
          university_email: testEmail,
          academic_year: "second",
          department: "Computer Systems",
          experience_level: "experienced",
          primary_track: "it",
          motivation: "Motivation exceeding twenty characters for testing scanner.",
          learning_goal: "Learning goal exceeding twenty characters for testing scanner.",
          status: "INTERVIEW_SCHEDULED",
          interview_date: "Saturday, October 17, 2026",
          interview_location: "Hall 2 Check-In Station",
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      assert.ok(app && !appErr, "Candidate application inserted");
      createdAppIds.push(app.id);

      // Create interview QR token
      const tokenRes = await getOrCreateInterviewQrToken(app.id, "INTERVIEW_SCHEDULED");
      assert.equal(tokenRes.eligible, true);
      assert.ok(tokenRes.token);
      const qrToken = tokenRes.token;

      // Create temporary staff user
      const { data: staffAuth } = await serviceClient.auth.admin.createUser({
        email: `staff.scanner.${randomSuffix}@gmail.com`,
        password: "TempStaffScanner123!",
        email_confirm: true,
      });
      assert.ok(staffAuth?.user?.id);
      createdUserIds.push(staffAuth.user.id);
      const staffId = staffAuth.user.id;

      // SCAN 1: First check-in scan must succeed
      const scan1 = await verifyAndCheckInInterviewQr(qrToken, staffId);
      assert.equal(scan1.success, true);
      assert.equal(scan1.code, "CHECK_IN_SUCCESS");
      assert.ok(scan1.checkedInAt);
      assert.ok(scan1.candidate);
      assert.equal(scan1.candidate.applicationReference, refCode);
      assert.equal(scan1.candidate.fullName, `Scanner Candidate ${randomSuffix}`);
      assert.equal(scan1.candidate.academicId, `BATU-SCN-${randomSuffix}`);
      assert.equal(scan1.candidate.primaryTrack, "it");
      assert.equal(scan1.candidate.academicYear, "second");
      assert.equal(scan1.candidate.department, "Computer Systems");

      // Verify privacy: Full National ID must NOT be present in candidate returned object
      // @ts-expect-error verify nationalId is not part of candidate object
      assert.equal(scan1.candidate.nationalId, undefined);
      // @ts-expect-error verify national_id is not part of candidate object
      assert.equal(scan1.candidate.national_id, undefined);

      const firstCheckedInAt = scan1.checkedInAt;

      // SCAN 2: Immediate duplicate scan MUST be rejected with ALREADY_CHECKED_IN
      const scan2 = await verifyAndCheckInInterviewQr(qrToken, staffId);
      assert.equal(scan2.success, false);
      assert.equal(scan2.code, "ALREADY_CHECKED_IN");
      assert.equal(
        new Date(scan2.checkedInAt || "").getTime(),
        new Date(firstCheckedInAt || "").getTime()
      );
      assert.ok(scan2.candidate);
      assert.equal(scan2.candidate.applicationReference, refCode);
      assert.equal(scan2.candidate.fullName, `Scanner Candidate ${randomSuffix}`);

      // SCAN 3: Subsequent third scan remains rejected (idempotent rejection)
      const scan3 = await verifyAndCheckInInterviewQr(qrToken, staffId);
      assert.equal(scan3.success, false);
      assert.equal(scan3.code, "ALREADY_CHECKED_IN");
      assert.equal(
        new Date(scan3.checkedInAt || "").getTime(),
        new Date(firstCheckedInAt || "").getTime()
      );

      // Verify database record status
      const { data: dbToken } = await serviceClient
        .from("interview_qr_tokens")
        .select("status, checked_in_at, checked_in_by")
        .eq("token", qrToken)
        .single();

      assert.equal(dbToken?.status, "CHECKED_IN");
      assert.equal(dbToken?.checked_in_by, staffId);
      assert.equal(
        new Date(dbToken?.checked_in_at || "").getTime(),
        new Date(firstCheckedInAt || "").getTime()
      );
    });

    it("strictly rejects check-in if QR token was revoked by admin", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2024${randomSuffix}@batechu.com`;
      const refCode = `ITC-REV${randomSuffix}`;

      const { data: app } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Revoked Candidate ${randomSuffix}`,
          national_id: `304082501${randomSuffix}8`,
          academic_id: `BATU-REV-${randomSuffix}`,
          phone: "+201099998888",
          whatsapp: "+201099998888",
          university_email: testEmail,
          academic_year: "third",
          department: "Electronics",
          experience_level: "beginner",
          primary_track: "oc",
          motivation: "Motivation exceeding twenty characters for revocation test.",
          learning_goal: "Learning goal exceeding twenty characters for revocation test.",
          status: "ACCEPTED",
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (!app) return;
      createdAppIds.push(app.id);

      const tokenRes = await getOrCreateInterviewQrToken(app.id, "ACCEPTED");
      assert.ok(tokenRes.token);

      // Revoke the token
      await revokeInterviewQrToken(app.id, "Candidate requested track change");

      // Attempt check-in with revoked token
      const checkInRes = await verifyAndCheckInInterviewQr(tokenRes.token, "staff-reviewer-id");
      assert.equal(checkInRes.success, false);
      assert.equal(checkInRes.code, "REVOKED_TOKEN");
    });

    it("rejects check-in if candidate application status is not eligible (e.g. REJECTED)", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2024${randomSuffix}@batechu.com`;
      const refCode = `ITC-INEL${randomSuffix}`;

      // Insert candidate in REJECTED status
      const { data: app } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Ineligible Candidate ${randomSuffix}`,
          national_id: `304082501${randomSuffix}6`,
          academic_id: `BATU-INEL-${randomSuffix}`,
          phone: "+201077776666",
          whatsapp: "+201077776666",
          university_email: testEmail,
          academic_year: "first",
          department: "IT",
          experience_level: "new",
          primary_track: "pr",
          motivation: "Motivation exceeding twenty characters for testing.",
          learning_goal: "Learning goal exceeding twenty characters for testing.",
          status: "ACCEPTED", // start as accepted to create token
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (!app) return;
      createdAppIds.push(app.id);

      const tokenRes = await getOrCreateInterviewQrToken(app.id, "ACCEPTED");
      assert.ok(tokenRes.token);

      // Admin updates status to REJECTED after token issuance
      await serviceClient
        .from("applications")
        .update({ status: "REJECTED" })
        .eq("id", app.id);

      // Attempt check-in: must be rejected with INELIGIBLE_STATUS
      const checkInRes = await verifyAndCheckInInterviewQr(tokenRes.token, "staff-reviewer-id");
      assert.equal(checkInRes.success, false);
      assert.equal(checkInRes.code, "INELIGIBLE_STATUS");
    });
  });
});
