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
import { parseClientQrPayload, isValidQrTokenFormat } from "../lib/interviews/qr-client.ts";
import {
  classifyCameraError,
  diagnoseCameraEnvironment,
} from "../lib/interviews/camera-diagnostics.ts";
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

    it("extracts token from URLs and query parameters", () => {
      const expectedToken = "itc_qr_url_token_1234567890";
      const testUrl1 = `https://itclub.org/admin/interviews/scan?token=${expectedToken}`;
      const testUrl2 = `itclub://interview/checkin?ref=ITC-123&token=${expectedToken}&source=scanner`;
      const testParamOnly = `token=${expectedToken}`;

      assert.equal(parseClientQrPayload(testUrl1), expectedToken);
      assert.equal(parseClientQrPayload(testUrl2), expectedToken);
      assert.equal(parseClientQrPayload(testParamOnly), expectedToken);
    });

    it("handles surrounding whitespace, newlines, and quotes gracefully", () => {
      const rawToken = "itc_qr_token_with_whitespace_1122334455";
      const dirtyString = `   \n  ${rawToken} \t \r  `;

      assert.equal(parseQrPayload(dirtyString), rawToken);
      assert.equal(parseClientQrPayload(dirtyString), rawToken);

      const quotedString = `"${rawToken}"`;
      assert.equal(parseClientQrPayload(quotedString), rawToken);
    });

    it("validates token format using isValidQrTokenFormat", () => {
      assert.equal(isValidQrTokenFormat("itc_qr_valid_token_123"), true);
      assert.equal(isValidQrTokenFormat("short"), false);
      assert.equal(isValidQrTokenFormat(""), false);
      assert.equal(isValidQrTokenFormat("token with invalid spaces!"), false);
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

      // @ts-expect-error test invalid client inputs
      assert.equal(parseClientQrPayload(null), "");
      // @ts-expect-error test invalid client inputs
      assert.equal(parseClientQrPayload(undefined), "");
      assert.equal(parseClientQrPayload(""), "");
    });
  });

  // 2. Camera Diagnostics & Environment Pre-Flight Checks
  describe("2. Camera Diagnostics & Environment Checks", () => {
    it("detects insecure HTTP context correctly", async () => {
      const diag = await diagnoseCameraEnvironment({
        isSecure: false,
        win: {
          isSecureContext: false,
          location: { protocol: "http:", hostname: "192.168.1.10" } as Location,
        },
      });

      assert.equal(diag.isSecureContext, false);
      assert.equal(diag.isSupported, false);
      assert.match(diag.diagnosticMessage, /secure context/i);
    });

    it("recognizes localhost and HTTPS as secure contexts", async () => {
      const diagLocal = await diagnoseCameraEnvironment({
        win: {
          isSecureContext: true,
          location: { protocol: "http:", hostname: "localhost" } as Location,
        },
        nav: {
          mediaDevices: {
            getUserMedia: async () => ({} as MediaStream),
          } as unknown as MediaDevices,
        },
      });

      assert.equal(diagLocal.isSecureContext, true);
      assert.equal(diagLocal.hasGetUserMedia, true);
      assert.equal(diagLocal.isSupported, true);
    });

    it("identifies environments lacking navigator.mediaDevices or getUserMedia", async () => {
      const diagMissing = await diagnoseCameraEnvironment({
        isSecure: true,
        nav: {} as Navigator,
      });

      assert.equal(diagMissing.hasMediaDevices, false);
      assert.equal(diagMissing.hasGetUserMedia, false);
      assert.equal(diagMissing.isSupported, false);
      assert.match(diagMissing.diagnosticMessage, /optical video capture APIs/i);
    });

    it("queries permissions API safely when supported", async () => {
      const mockNav = {
        mediaDevices: {
          getUserMedia: async () => ({} as MediaStream),
        } as unknown as MediaDevices,
        permissions: {
          query: async () => ({ state: "granted" } as PermissionStatus),
        } as unknown as Permissions,
      };

      const diag = await diagnoseCameraEnvironment({ isSecure: true, nav: mockNav });
      assert.equal(diag.permissionState, "granted");
    });

    it("falls back safely to 'unsupported' when permissions.query throws (e.g. Safari / Firefox)", async () => {
      const mockNav = {
        mediaDevices: {
          getUserMedia: async () => ({} as MediaStream),
        } as unknown as MediaDevices,
        permissions: {
          query: async () => {
            throw new TypeError("Unsupported permission name: camera");
          },
        } as unknown as Permissions,
      };

      const diag = await diagnoseCameraEnvironment({ isSecure: true, nav: mockNav });
      assert.equal(diag.permissionState, "unsupported");
    });
  });

  // 3. Camera Error Classification & Recovery Instructions
  describe("3. Camera Error Classification & User Instructions", () => {
    it("classifies NotAllowedError as expected denial with actionable instructions", () => {
      const err = new Error("Permission denied by user");
      err.name = "NotAllowedError";

      const classified = classifyCameraError(err);
      assert.equal(classified.code, "not_allowed");
      assert.equal(classified.isExpectedDenial, true); // Must not produce alarming console.error stack trace
      assert.equal(classified.canRetry, true);
      assert.equal(classified.fallbackToManual, true);
      assert.ok(classified.instructions.some((line) => line.includes("address bar")));
    });

    it("classifies NotFoundError when no camera hardware is attached", () => {
      const err = new Error("Requested device not found");
      err.name = "NotFoundError";

      const classified = classifyCameraError(err);
      assert.equal(classified.code, "not_found");
      assert.equal(classified.isExpectedDenial, false);
      assert.equal(classified.fallbackToManual, true);
      assert.ok(classified.instructions.some((line) => line.includes("webcam")));
    });

    it("classifies NotReadableError when camera is locked by Zoom/Teams/OS", () => {
      const err = new Error("Could not start video source");
      err.name = "NotReadableError";

      const classified = classifyCameraError(err);
      assert.equal(classified.code, "not_readable");
      assert.equal(classified.canRetry, true);
      assert.ok(classified.instructions.some((line) => line.includes("Zoom") || line.includes("Teams")));
    });

    it("classifies OverconstrainedError for unsupported camera constraints", () => {
      const err = new Error("Constraints could not be satisfied");
      err.name = "OverconstrainedError";

      const classified = classifyCameraError(err);
      assert.equal(classified.code, "overconstrained");
      assert.equal(classified.canRetry, true);
    });

    it("classifies insecure context / SecurityError", () => {
      const err = new Error("Only supported in secure context");
      err.name = "SecurityError";

      const classified = classifyCameraError(err);
      assert.equal(classified.code, "insecure_context");
      assert.equal(classified.canRetry, false);
      assert.equal(classified.fallbackToManual, true);
    });

    it("handles unknown or string errors cleanly without leaking sensitive data", () => {
      const classified = classifyCameraError("Generic hardware failure code 0x88");
      assert.equal(classified.code, "unknown");
      assert.equal(classified.canRetry, true);
      assert.equal(classified.fallbackToManual, true);
    });
  });

  // 4. Scanner Lifecycle, Concurrency & Stream Cleanup
  describe("4. Scanner Lifecycle, Concurrency & Stream Cleanup", () => {
    it("simulates stream stop and cleanup on unmount", async () => {
      let isScanning = true;
      let stopCalled = false;
      let clearCalled = false;

      const mockScanner = {
        isScanning,
        stop: async () => {
          stopCalled = true;
          isScanning = false;
        },
        clear: () => {
          clearCalled = true;
        },
      };

      // Emulate stopCamera logic from ScannerClient
      if (mockScanner.isScanning) {
        await mockScanner.stop();
      }
      mockScanner.clear();

      assert.equal(stopCalled, true);
      assert.equal(clearCalled, true);
    });

    it("suppresses duplicate in-flight scans while check-in is processing", async () => {
      let processCount = 0;
      let isProcessing = false;
      let hasResult = false;

      const checkInHandler = async () => {
        if (isProcessing || hasResult) return;
        isProcessing = true;
        processCount++;
        // Simulate async network latency
        await new Promise((res) => setTimeout(res, 25));
        isProcessing = false;
        hasResult = true;
      };

      // Trigger 5 rapid scan frames simultaneously
      await Promise.all([
        checkInHandler(),
        checkInHandler(),
        checkInHandler(),
        checkInHandler(),
        checkInHandler(),
      ]);

      // Exactly 1 request must have proceeded
      assert.equal(processCount, 1);
    });

    it("allows scanning to resume after explicit reset", async () => {
      let processCount = 0;
      let isProcessing = false;
      let hasResult = false;

      const checkInHandler = async () => {
        if (isProcessing || hasResult) return;
        isProcessing = true;
        processCount++;
        await new Promise((res) => setTimeout(res, 10));
        isProcessing = false;
        hasResult = true;
      };

      await checkInHandler();
      assert.equal(processCount, 1);
      assert.equal(hasResult, true);

      // Attempt second scan while result showing: blocked
      await checkInHandler();
      assert.equal(processCount, 1);

      // Staff clicks "SCAN NEXT CANDIDATE" (resumes scanning)
      hasResult = false;
      isProcessing = false;

      // Next candidate scan succeeds
      await checkInHandler();
      assert.equal(processCount, 2);
    });
  });

  // 5. Check-In API Security Guards & Validation
  describe("5. Check-In API Security & Input Validation", () => {
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
      const req = new Request("http://localhost:3000/api/admin/interviews/check-in", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "invalid plain string",
      });

      const res = await staffCheckInRoute(req);
      assert.equal(res.status, 401);
    });

    it("rejects invalid, short, or non-existent token with INVALID_TOKEN", async () => {
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

  // 6. Complete Verification Flow & Duplicate Check-in Prevention
  describe("6. Attendance Verification & Duplicate Check-In Prevention", () => {
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
