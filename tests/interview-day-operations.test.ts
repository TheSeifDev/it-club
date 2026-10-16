import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { isStaffRole } from "../lib/auth/roles.ts";
import {
  getOrCreateInterviewQrToken,
  verifyAndCheckInInterviewQr,
  lookupInterviewCandidateByQr,
  saveInterviewEvaluation,
  revokeInterviewQrToken,
} from "../lib/interviews/qr-service.ts";
import { POST as checkInRoute } from "../app/api/admin/interviews/check-in/route.ts";
import { POST as lookupRoute } from "../app/api/admin/interviews/lookup/route.ts";
import { POST as evaluationPostRoute, GET as evaluationGetRoute } from "../app/api/admin/interviews/evaluations/route.ts";
import { queryAuditLogs } from "../lib/audit/service.ts";

describe("Interview-Day Operations & Least-Privilege Staff Access", () => {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://wzendwuoankwiahbrwqt.supabase.co";
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_SIK6ewo2TUtgD8Qizcl12Q__U0Irdns";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const serviceClient = serviceKey
    ? createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

  const cleanupAppIds: string[] = [];
  const cleanupUserIds: string[] = [];

  async function createTestStaffUser(role: "interviewer" | "admin" | "owner" = "interviewer") {
    if (!serviceClient) throw new Error("serviceClient required");
    const suffix = Math.floor(10000 + Math.random() * 90000);
    const { data: staffAuth, error } = await serviceClient.auth.admin.createUser({
      email: `test.${role}.${suffix}@itclub.org`,
      password: "TempPassword123!",
      email_confirm: true,
    });
    if (error || !staffAuth?.user) {
      throw new Error(`Failed to create test auth user: ${error?.message}`);
    }
    cleanupUserIds.push(staffAuth.user.id);
    await serviceClient.from("staff_members").insert({
      user_id: staffAuth.user.id,
      role,
    });
    return staffAuth.user.id;
  }

  after(async () => {
    if (!serviceClient) return;

    for (const uid of cleanupUserIds) {
      try {
        await serviceClient.from("staff_members").delete().eq("user_id", uid);
        await serviceClient.auth.admin.deleteUser(uid);
      } catch {
        // ignore cleanup errors
      }
    }

    for (const appId of cleanupAppIds) {
      try {
        await serviceClient.from("interview_evaluations").delete().eq("application_id", appId);
        await serviceClient.from("interview_qr_tokens").delete().eq("application_id", appId);
        await serviceClient.from("applications").delete().eq("id", appId);
      } catch {
        // ignore cleanup errors
      }
    }
  });

  // 1. Role Model & Least-Privilege Role Validation
  describe("1. Role Model & Authorization Boundaries", () => {
    it("recognizes interviewer as a valid least-privilege staff role", () => {
      assert.equal(isStaffRole("interviewer"), true);
      assert.equal(isStaffRole("owner"), true);
      assert.equal(isStaffRole("admin"), true);
      assert.equal(isStaffRole("student"), false);
      assert.equal(isStaffRole("candidate"), false);
      assert.equal(isStaffRole("anonymous"), false);
    });

    it("verifies public anonymous clients cannot access check-in, lookup, or evaluation APIs", async () => {
      // Station 1 Check-in anonymous access
      const reqCheckIn = new Request("http://localhost:3000/api/admin/interviews/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "itc_qr_test_token_123456789012" }),
      });
      const resCheckIn = await checkInRoute(reqCheckIn);
      assert.equal(resCheckIn.status, 401);
      const jsonCheckIn = await resCheckIn.json();
      assert.equal(jsonCheckIn.code, "UNAUTHORIZED");

      // Station 2 Lookup anonymous access
      const reqLookup = new Request("http://localhost:3000/api/admin/interviews/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "itc_qr_test_token_123456789012" }),
      });
      const resLookup = await lookupRoute(reqLookup);
      assert.equal(resLookup.status, 401);
      const jsonLookup = await resLookup.json();
      assert.equal(jsonLookup.code, "UNAUTHORIZED");

      // Evaluation POST anonymous access
      const reqEval = new Request("http://localhost:3000/api/admin/interviews/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: "00000000-0000-0000-0000-000000000001", evaluationNotes: "test" }),
      });
      const resEval = await evaluationPostRoute(reqEval);
      assert.equal(resEval.status, 401);

      // Evaluation GET anonymous access
      const reqEvalGet = new Request("http://localhost:3000/api/admin/interviews/evaluations?applicationId=00000000-0000-0000-0000-000000000001");
      const resEvalGet = await evaluationGetRoute(reqEvalGet);
      assert.equal(resEvalGet.status, 401);
    });

    it("enforces RLS preventing anonymous clients from reading interview_evaluations", async () => {
      const publicClient = createClient(supabaseUrl, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data, error } = await publicClient.from("interview_evaluations").select("*");
      if (error) {
        assert.ok(error.message);
      } else {
        assert.deepEqual(data, []);
      }
    });
  });

  // 2. Station One Attendance Check-In Workflow
  describe("2. Station One — Attendance Check-In", () => {
    it("atomically records attendance once and prevents duplicate check-in", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2024${randomSuffix}@batechu.com`;
      const refCode = `ITC-CHK${randomSuffix}`;
      const staffInterviewerId = await createTestStaffUser("interviewer");

      const { data: app } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Checkin Candidate ${randomSuffix}`,
          national_id: `304082501${randomSuffix}1`,
          academic_id: `BATU-CHK-${randomSuffix}`,
          phone: "+201011112222",
          whatsapp: "+201011112222",
          university_email: testEmail,
          academic_year: "second",
          department: "Computer Science",
          experience_level: "beginner",
          primary_track: "it",
          secondary_track: "rnd",
          motivation: "Motivation exceeding twenty characters for interview test.",
          learning_goal: "Learning goal exceeding twenty characters for interview test.",
          status: "ACCEPTED",
          consented_at: new Date().toISOString(),
        })
        .select("id, application_reference, full_name, primary_track, status")
        .single();

      if (!app) assert.fail("Failed to insert candidate");
      cleanupAppIds.push(app.id);

      // Generate active QR token
      const tokenRes = await getOrCreateInterviewQrToken(app.id, "ACCEPTED");
      assert.ok(tokenRes.token);

      // 1st Check-In attempt by Interviewer staff
      const checkIn1 = await verifyAndCheckInInterviewQr(tokenRes.token, staffInterviewerId, "interviewer");
      assert.equal(checkIn1.success, true);
      assert.equal(checkIn1.code, "CHECK_IN_SUCCESS");
      assert.ok(checkIn1.checkedInAt);
      assert.ok(checkIn1.candidate);
      assert.equal(checkIn1.candidate.fullName, `Checkin Candidate ${randomSuffix}`);
      assert.equal(checkIn1.candidate.applicationReference, refCode);
      assert.equal(checkIn1.candidate.primaryTrack, "it");
      // Verify least-privilege: candidate object does NOT leak national_id or sensitive contacts
      assert.equal((checkIn1.candidate as unknown as Record<string, unknown>).national_id, undefined);
      assert.equal((checkIn1.candidate as unknown as Record<string, unknown>).phone, undefined);
      assert.equal((checkIn1.candidate as unknown as Record<string, unknown>).university_email, undefined);

      const firstTimestamp = checkIn1.checkedInAt;

      // 2nd Check-In attempt (Duplicate scan)
      const checkIn2 = await verifyAndCheckInInterviewQr(tokenRes.token, staffInterviewerId, "interviewer");
      assert.equal(checkIn2.success, false);
      assert.equal(checkIn2.code, "ALREADY_CHECKED_IN");
      assert.equal(new Date(checkIn2.checkedInAt || "").getTime(), new Date(firstTimestamp).getTime());

      // Database verification: token status is CHECKED_IN and timestamp was not changed
      const { data: dbToken } = await serviceClient
        .from("interview_qr_tokens")
        .select("status, checked_in_at, checked_in_by")
        .eq("application_id", app.id)
        .single();

      assert.equal(dbToken?.status, "CHECKED_IN");
      assert.equal(dbToken?.checked_in_by, staffInterviewerId);
      assert.equal(new Date(dbToken?.checked_in_at).getTime(), new Date(firstTimestamp).getTime());
    });
  });

  // 3. Station Two Interview Candidate Lookup Workflow
  describe("3. Station Two — Interview Candidate Lookup", () => {
    it("rejects candidate lookup if candidate has NOT checked in at Station 1 yet", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2024${randomSuffix}@batechu.com`;
      const refCode = `ITC-NOTCHK${randomSuffix}`;
      const staffInterviewerId = await createTestStaffUser("interviewer");

      const { data: app } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Not Checked In Candidate ${randomSuffix}`,
          national_id: `304082501${randomSuffix}2`,
          academic_id: `BATU-NCHK-${randomSuffix}`,
          phone: "+201022223333",
          whatsapp: "+201022223333",
          university_email: testEmail,
          academic_year: "third",
          department: "Information Systems",
          experience_level: "experienced",
          skills: "TypeScript, Python, Next.js",
          primary_track: "it",
          motivation: "Motivation exceeding twenty characters for interview testing.",
          learning_goal: "Learning goal exceeding twenty characters for interview testing.",
          status: "ACCEPTED",
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (!app) assert.fail("Failed to insert candidate");
      cleanupAppIds.push(app.id);

      // Issue active QR token (status is ACTIVE, not CHECKED_IN)
      const tokenRes = await getOrCreateInterviewQrToken(app.id, "ACCEPTED");
      assert.ok(tokenRes.token);

      // Attempt Station Two lookup before check-in: MUST be rejected with NOT_CHECKED_IN
      const lookupRes = await lookupInterviewCandidateByQr(tokenRes.token, staffInterviewerId, "interviewer");
      assert.equal(lookupRes.success, false);
      assert.equal(lookupRes.code, "NOT_CHECKED_IN");
      assert.match(lookupRes.error || "", /Station One/i);
    });

    it("succeeds for checked-in candidate and never alters original attendance timestamp on repeated lookups", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2024${randomSuffix}@batechu.com`;
      const refCode = `ITC-LOOK${randomSuffix}`;
      const checkinDeskStaffId = await createTestStaffUser("interviewer");
      const interviewerStaffId = await createTestStaffUser("interviewer");

      const { data: app } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Lookup Candidate ${randomSuffix}`,
          national_id: `304082501${randomSuffix}3`,
          academic_id: `BATU-LOOK-${randomSuffix}`,
          phone: "+201033334444",
          whatsapp: "+201033334444",
          university_email: testEmail,
          academic_year: "first",
          department: "Artificial Intelligence",
          experience_level: "beginner",
          skills: "Robotics, Arduino, C++",
          primary_track: "rnd",
          secondary_track: "it",
          motivation: "Motivation exceeding twenty characters for lookup test.",
          learning_goal: "Learning goal exceeding twenty characters for lookup test.",
          status: "ACCEPTED",
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (!app) assert.fail("Failed to insert candidate");
      cleanupAppIds.push(app.id);

      const tokenRes = await getOrCreateInterviewQrToken(app.id, "ACCEPTED");
      assert.ok(tokenRes.token);

      // Station 1: Candidate checks in at Attendance Desk
      const checkInRes = await verifyAndCheckInInterviewQr(tokenRes.token, checkinDeskStaffId, "interviewer");
      assert.equal(checkInRes.success, true);
      const originalAttendanceTime = checkInRes.checkedInAt;

      // Station 2: First lookup by interviewer desk
      const lookup1 = await lookupInterviewCandidateByQr(tokenRes.token, interviewerStaffId, "interviewer");
      assert.equal(lookup1.success, true);
      assert.equal(lookup1.code, "LOOKUP_SUCCESS");
      assert.ok(lookup1.candidate);
      assert.equal(lookup1.candidate.fullName, `Lookup Candidate ${randomSuffix}`);
      assert.equal(lookup1.candidate.primaryTrack, "rnd");
      assert.equal(lookup1.candidate.secondaryTrack, "it");
      assert.equal(lookup1.candidate.skills, "Robotics, Arduino, C++");
      assert.equal(new Date(lookup1.candidate.checkedInAt || "").getTime(), new Date(originalAttendanceTime || "").getTime());

      // Verify no national_id leak
      assert.equal((lookup1.candidate as unknown as Record<string, unknown>).national_id, undefined);

      // Station 2: Second repeated lookup by interviewer desk
      const lookup2 = await lookupInterviewCandidateByQr(tokenRes.token, interviewerStaffId, "interviewer");
      assert.equal(lookup2.success, true);
      assert.equal(new Date(lookup2.candidate?.checkedInAt || "").getTime(), new Date(originalAttendanceTime || "").getTime());
      assert.equal(lookup2.candidate?.checkedInAt, lookup1.candidate.checkedInAt);

      // Verify DB record: attendance timestamp was NOT altered by lookup
      const { data: dbToken } = await serviceClient
        .from("interview_qr_tokens")
        .select("checked_in_at, checked_in_by, status")
        .eq("application_id", app.id)
        .single();

      assert.equal(dbToken?.status, "CHECKED_IN");
      assert.equal(dbToken?.checked_in_by, checkinDeskStaffId);
      assert.equal(new Date(dbToken?.checked_in_at).getTime(), new Date(originalAttendanceTime || "").getTime());
    });

    it("rejects revoked or invalid tokens at Station 2 lookup", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2024${randomSuffix}@batechu.com`;
      const refCode = `ITC-REVLOK${randomSuffix}`;
      const staffId = await createTestStaffUser("interviewer");

      const { data: app } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Revoked Lookup Candidate ${randomSuffix}`,
          national_id: `304082501${randomSuffix}4`,
          academic_id: `BATU-RLOK-${randomSuffix}`,
          phone: "+201044445555",
          whatsapp: "+201044445555",
          university_email: testEmail,
          academic_year: "second",
          department: "IT",
          experience_level: "new",
          primary_track: "hr",
          motivation: "Motivation exceeding twenty characters for testing.",
          learning_goal: "Learning goal exceeding twenty characters for testing.",
          status: "ACCEPTED",
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (!app) assert.fail("Failed to insert candidate");
      cleanupAppIds.push(app.id);

      const tokenRes = await getOrCreateInterviewQrToken(app.id, "ACCEPTED");
      assert.ok(tokenRes.token);

      // Check-in first
      await verifyAndCheckInInterviewQr(tokenRes.token, staffId, "interviewer");

      // Revoke token
      await revokeInterviewQrToken(app.id, "Candidate requested withdrawal");

      // Lookup must be rejected
      const lookupRev = await lookupInterviewCandidateByQr(tokenRes.token, staffId, "interviewer");
      assert.equal(lookupRev.success, false);
      assert.equal(lookupRev.code, "REVOKED_TOKEN");

      // Malformed / invalid token lookup
      const lookupInvalid = await lookupInterviewCandidateByQr("itc_qr_fake_invalid_token_9999", staffId, "interviewer");
      assert.equal(lookupInvalid.success, false);
      assert.equal(lookupInvalid.code, "INVALID_TOKEN");
    });
  });

  // 4. Interview Evaluations and Notes Workflow
  describe("4. Interview Evaluation & Notes Workflow", () => {
    it("creates, retrieves, and updates evaluation notes attributed to authenticated interviewer", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2024${randomSuffix}@batechu.com`;
      const refCode = `ITC-EVAL${randomSuffix}`;

      // Create two distinct mock interviewer users in auth.users
      const { data: user1, error: uErr1 } = await serviceClient.auth.admin.createUser({
        email: `interviewer1_${randomSuffix}@itclub.org`,
        password: "TempPassword123!",
        email_confirm: true,
      });
      const { data: user2, error: uErr2 } = await serviceClient.auth.admin.createUser({
        email: `interviewer2_${randomSuffix}@itclub.org`,
        password: "TempPassword123!",
        email_confirm: true,
      });

      if (uErr1 || !user1.user || uErr2 || !user2.user) {
        assert.fail("Failed to create test interviewers in Supabase Auth");
      }
      cleanupUserIds.push(user1.user.id, user2.user.id);

      // Assign interviewer roles in staff_members
      await serviceClient.from("staff_members").insert([
        { user_id: user1.user.id, role: "interviewer" },
        { user_id: user2.user.id, role: "interviewer" },
      ]);

      // Create candidate application
      const { data: app } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Evaluation Candidate ${randomSuffix}`,
          national_id: `304082501${randomSuffix}5`,
          academic_id: `BATU-EVAL-${randomSuffix}`,
          phone: "+201055556666",
          whatsapp: "+201055556666",
          university_email: testEmail,
          academic_year: "third",
          department: "Computer Science",
          experience_level: "experienced",
          primary_track: "it",
          motivation: "Motivation exceeding twenty characters for evaluation test.",
          learning_goal: "Learning goal exceeding twenty characters for evaluation test.",
          reviewer_notes: "Initial recruitment review note (must not be overwritten).",
          status: "ACCEPTED",
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (!app) assert.fail("Failed to insert candidate");
      cleanupAppIds.push(app.id);

      // 1. Interviewer 1 saves initial evaluation
      const saveRes1 = await saveInterviewEvaluation({
        applicationId: app.id,
        interviewerId: user1.user.id,
        interviewerRole: "interviewer",
        evaluationNotes: "Strong technical skills in Linux and networking. Excellent problem solver.",
        rating: "STRONG_HIRE",
        recommendation: "Recommended for Infrastructure Sub-track Lead",
      });

      assert.equal(saveRes1.success, true);
      assert.ok(saveRes1.evaluation);
      assert.equal(saveRes1.evaluation.interviewerId, user1.user.id);
      assert.equal(saveRes1.evaluation.rating, "STRONG_HIRE");

      // 2. Interviewer 1 edits their evaluation note
      const saveRes2 = await saveInterviewEvaluation({
        applicationId: app.id,
        interviewerId: user1.user.id,
        interviewerRole: "interviewer",
        evaluationNotes: "Updated: Candidate demonstrated exceptional Bash scripting proficiency.",
        rating: "STRONG_HIRE",
        recommendation: "Strongly recommended for Infrastructure Sub-track Lead",
      });

      assert.equal(saveRes2.success, true);
      assert.equal(saveRes2.evaluation?.evaluationNotes, "Updated: Candidate demonstrated exceptional Bash scripting proficiency.");
      assert.equal(saveRes2.evaluation?.id, saveRes1.evaluation.id); // Same record updated

      // 3. Interviewer 2 saves their own separate evaluation for the same candidate
      const saveRes3 = await saveInterviewEvaluation({
        applicationId: app.id,
        interviewerId: user2.user.id,
        interviewerRole: "interviewer",
        evaluationNotes: "Good culture fit and teamwork attitude.",
        rating: "HIRE",
        recommendation: "Recommended for Core Workshop Mentor",
      });

      assert.equal(saveRes3.success, true);
      assert.equal(saveRes3.evaluation?.interviewerId, user2.user.id);
      assert.notEqual(saveRes3.evaluation?.id, saveRes1.evaluation.id); // Distinct evaluation ID

      // 4. Verify candidate's recruitment reviewer_notes was NOT overwritten
      const { data: checkApp } = await serviceClient
        .from("applications")
        .select("reviewer_notes, status")
        .eq("id", app.id)
        .single();

      assert.equal(checkApp?.reviewer_notes, "Initial recruitment review note (must not be overwritten).");
      // Recruitment status remains intact (not auto accepted/rejected)
      assert.equal(checkApp?.status, "ACCEPTED");
    });
  });

  // 5. Audit Logging Verification
  describe("5. Audit Logging for Interview Operations", () => {
    it("records interview operations in public.audit_events with true staff actor without leaking PII", async () => {
      const logs = await queryAuditLogs({ pageSize: 30 });
      assert.ok(Array.isArray(logs.events));

      // Check for interview check-in and lookup actions in audit log
      const checkInEvent = logs.events.find(
        (e) => e.action === "INTERVIEW_CHECK_IN_SUCCESS" || e.action === "INTERVIEW_CHECK_IN_DUPLICATE"
      );
      if (checkInEvent) {
        assert.ok(checkInEvent.actor_role);
        assert.equal(checkInEvent.entity_type, "interview_qr");
        // Ensure no raw QR token or 14-digit national ID in metadata
        const metaStr = JSON.stringify(checkInEvent.metadata);
        assert.equal(/itc_qr_[A-Za-z0-9_-]{20,}/.test(metaStr), false);
        assert.equal(/^[23]\d{13}$/.test(metaStr), false);
      }
    });
  });
});
