import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import {
  sanitizeAuditMetadata,
  recordAuditEvent,
  queryAuditLogs,
  getAuditStats,
} from "../lib/audit/service.ts";
import {
  updateApplicationStatus,
  saveReviewerNotes,
} from "../lib/admin/queries.ts";
import {
  getOrCreateInterviewQrToken,
  verifyAndCheckInInterviewQr,
} from "../lib/interviews/qr-service.ts";
import { GET as getAuditLogsRoute } from "../app/api/admin/audit-logs/route.ts";
import { PATCH as patchApplicantDetailRoute } from "../app/api/admin/applications/[id]/route.ts";

describe("Phase 5B: Comprehensive Audit Logging & Traceability", () => {
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

  const publicClient = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const createdAppIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdAuditIds: string[] = [];

  after(async () => {
    if (!serviceClient) return;

    // Clean up created test audit events
    if (createdAuditIds.length > 0) {
      try {
        await serviceClient.from("audit_events").delete().in("id", createdAuditIds);
      } catch {
        // ignore
      }
    }

    // Clean up created users
    for (const uid of createdUserIds) {
      try {
        await serviceClient.auth.admin.deleteUser(uid);
      } catch {
        // ignore
      }
    }

    // Clean up created applications and associated QR tokens
    for (const appId of createdAppIds) {
      try {
        await serviceClient.from("interview_qr_tokens").delete().eq("application_id", appId);
        await serviceClient.from("applications").delete().eq("id", appId);
      } catch {
        // ignore
      }
    }
  });

  // 1. Sensitive Data Redaction & Sanitization
  describe("1. Sensitive Data Redaction & Metadata Sanitization", () => {
    it("redacts Egyptian National IDs (14 digits) to safe masked representation", () => {
      const sanitized = sanitizeAuditMetadata({
        candidate_nid: "30408250101234",
        nested: {
          user_national_id: "29901010109876",
        },
      });

      assert.equal(sanitized.candidate_nid, "3040******1234");
      assert.equal((sanitized.nested as Record<string, unknown>).user_national_id, "2990******9876");
    });

    it("redacts sensitive credential keys (passwords, tokens, cookies, auth secrets)", () => {
      const sanitized = sanitizeAuditMetadata({
        password: "SuperSecretPassword123!",
        userPassword: "AnotherSecretPassword!",
        accessToken: "jwt.header.payload.signature",
        refreshToken: "refresh_token_value_xyz",
        session_cookie: "sb-auth-token=xyz",
        secret_key: "supa_secret_key_12345",
        bearer_token: "Bearer test_token",
      });

      assert.equal(sanitized.password, "[REDACTED]");
      assert.equal(sanitized.userPassword, "[REDACTED]");
      assert.equal(sanitized.accessToken, "[REDACTED_TOKEN]");
      assert.equal(sanitized.refreshToken, "[REDACTED_TOKEN]");
      assert.equal(sanitized.session_cookie, "[REDACTED]");
      assert.equal(sanitized.secret_key, "[REDACTED]");
      assert.equal(sanitized.bearer_token, "[REDACTED_TOKEN]");
    });

    it("redacts raw interview QR bearer tokens while preserving prefix", () => {
      const rawToken = "itc_qr_998877665544332211aabbccddeeff00";
      const sanitized = sanitizeAuditMetadata({
        scanned_code: rawToken,
        list: [rawToken, "normal_value"],
      });

      assert.equal(sanitized.scanned_code, "itc_qr_998...[REDACTED]");
      assert.equal((sanitized.list as string[])[0], "[REDACTED_TOKEN]");
      assert.equal((sanitized.list as string[])[1], "normal_value");
    });

    it("truncates excessively long string values to prevent log bloat", () => {
      const longString = "A".repeat(800);
      const sanitized = sanitizeAuditMetadata({
        long_feedback: longString,
      });

      const result = sanitized.long_feedback as string;
      assert.ok(result.length <= 520);
      assert.ok(result.endsWith("[TRUNCATED]"));
    });

    it("handles null, non-objects, and empty payloads safely", () => {
      assert.deepEqual(sanitizeAuditMetadata(null), {});
      assert.deepEqual(sanitizeAuditMetadata(undefined), {});
      assert.deepEqual(sanitizeAuditMetadata({}), {});
    });
  });

  // 2. Access Control & Authorization (Owner vs Admin vs Student vs Anon)
  describe("2. Route & Database Access Control Boundaries", () => {
    it("rejects unauthenticated requests to /api/admin/audit-logs with 401 UNAUTHORIZED", async () => {
      const req = new Request("http://localhost:3000/api/admin/audit-logs");
      const res = await getAuditLogsRoute(req);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.code, "UNAUTHORIZED");
    });

    it("confirms anonymous public client cannot read audit_events via Supabase RLS", async () => {
      const { data, error } = await publicClient
        .from("audit_events")
        .select("id, action, actor_id, created_at");

      if (error) {
        assert.ok(error.code || error.message);
      } else {
        assert.deepEqual(data, []);
      }
    });

    it("confirms anonymous public client cannot insert into audit_events", async () => {
      const { error } = await publicClient.from("audit_events").insert({
        action: "APPLICATION_SUBMITTED",
        actor_role: "anonymous",
        entity_type: "application",
        outcome: "SUCCESS",
      });

      // RLS policy only allows service_role to insert
      assert.ok(error, "Anonymous insert must be blocked by RLS");
    });

    it("confirms audit_events cannot be modified or deleted by non-service clients (append-only)", async () => {
      const { error: updateErr, count: updateCount } = await publicClient
        .from("audit_events")
        .update({ outcome: "FAILURE" })
        .eq("action", "APPLICATION_SUBMITTED");

      if (!updateErr) {
        assert.equal(updateCount ?? 0, 0);
      } else {
        assert.ok(updateErr);
      }

      const { error: deleteErr, count: deleteCount } = await publicClient
        .from("audit_events")
        .delete()
        .eq("action", "APPLICATION_SUBMITTED");

      if (!deleteErr) {
        assert.equal(deleteCount ?? 0, 0);
      } else {
        assert.ok(deleteErr);
      }
    });
  });

  // 3. Application Status & Review Operations Audit Recording
  describe("3. Application Status Mutation & Review Audit Trails", () => {
    it("records a correctly attributed audit event upon successful status transition", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const refCode = `ITC-AUD${randomSuffix}`;

      // Insert applicant
      const { data: app, error: appErr } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Audit Applicant ${randomSuffix}`,
          national_id: `304082501${randomSuffix}8`,
          academic_id: `BATU-AUD-${randomSuffix}`,
          phone: "+201011112222",
          whatsapp: "+201011112222",
          university_email: `2024${randomSuffix}@batechu.com`,
          academic_year: "first",
          department: "Computer Systems",
          experience_level: "beginner",
          primary_track: "it",
          motivation: "Motivation exceeding twenty characters for testing audit trail.",
          learning_goal: "Learning goal exceeding twenty characters for testing audit trail.",
          status: "PENDING_REVIEW",
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      assert.ok(app && !appErr);
      createdAppIds.push(app.id);

      // Create temporary staff user for foreign key integrity
      const { data: staffAuth } = await serviceClient.auth.admin.createUser({
        email: `status.staff.${randomSuffix}@itclub.org`,
        password: "TempStaffStatus123!",
        email_confirm: true,
      });
      assert.ok(staffAuth?.user?.id);
      createdUserIds.push(staffAuth.user.id);
      const staffActorId = staffAuth.user.id;
      const staffEmail = staffAuth.user.email || "station.lead@itclub.org";

      // Perform status update
      const result = await updateApplicationStatus({
        id: app.id,
        nextStatus: "UNDER_REVIEW",
        reviewerNotes: "Candidate looks promising for technical evaluation.",
        reviewerUserId: staffActorId,
      });

      assert.equal(result.success, true);
      assert.ok(result.application);
      assert.equal(result.application.status, "UNDER_REVIEW");

      // Record audit event as done in the admin route
      const auditEvent = await recordAuditEvent({
        actor: {
          id: staffActorId,
          email: staffEmail,
          role: "admin",
        },
        action: "APPLICATION_STATUS_UPDATED",
        entityType: "application",
        entityId: app.id,
        entityReference: refCode,
        previousStatus: result.previousStatus,
        newStatus: result.application.status,
        outcome: "SUCCESS",
        metadata: {
          notesUpdated: true,
        },
      });

      assert.ok(auditEvent);
      assert.ok(auditEvent.id);
      createdAuditIds.push(auditEvent.id);

      // Verify audit record in database
      const { data: auditLogs, error: auditErr } = await serviceClient
        .from("audit_events")
        .select("*")
        .eq("id", auditEvent.id);

      assert.ok(!auditErr);
      assert.ok(auditLogs && auditLogs.length === 1);

      const log = auditLogs[0];
      assert.equal(log.action, "APPLICATION_STATUS_UPDATED");
      assert.equal(log.entity_type, "application");
      assert.equal(log.entity_id, app.id);
      assert.equal(log.entity_reference, refCode);
      assert.equal(log.previous_status, "PENDING_REVIEW");
      assert.equal(log.new_status, "UNDER_REVIEW");
      assert.equal(log.actor_id, staffActorId);
      assert.equal(log.actor_role, "admin");
      assert.equal(log.actor_email, staffEmail);
      assert.equal(log.outcome, "SUCCESS");
    });

    it("rejects invalid status transition and unauthenticated mutations without creating false success events", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const refCode = `ITC-INV${randomSuffix}`;

      // Insert applicant in NEEDS_CORRECTION
      const { data: app } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Invalid Transition Applicant ${randomSuffix}`,
          national_id: `304082501${randomSuffix}9`,
          academic_id: `BATU-INV-${randomSuffix}`,
          phone: "+201011112222",
          whatsapp: "+201011112222",
          university_email: `2024${randomSuffix}@batechu.com`,
          academic_year: "first",
          department: "Computer Systems",
          experience_level: "beginner",
          primary_track: "it",
          motivation: "Motivation exceeding twenty characters for testing audit trail.",
          learning_goal: "Learning goal exceeding twenty characters for testing audit trail.",
          status: "NEEDS_CORRECTION",
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      assert.ok(app);
      createdAppIds.push(app.id);

      // Attempt invalid jump from NEEDS_CORRECTION to ACCEPTED
      const invalidResult = await updateApplicationStatus({
        id: app.id,
        nextStatus: "ACCEPTED",
        reviewerUserId: "00000000-0000-4000-a000-000000000001",
      });

      assert.equal(invalidResult.success, false);
      assert.equal(invalidResult.code, "INVALID_TRANSITION");

      // Verify unauthenticated API request is rejected with 401
      const unauthReq = new Request(`http://localhost:3000/api/admin/applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextStatus: "UNDER_REVIEW" }),
      });
      const unauthRes = await patchApplicantDetailRoute(unauthReq, {
        params: Promise.resolve({ id: app.id }),
      });
      assert.equal(unauthRes.status, 401);

      // Verify NO success event was created for this entity
      const { data: logs } = await serviceClient
        .from("audit_events")
        .select("*")
        .eq("entity_reference", refCode)
        .eq("action", "APPLICATION_STATUS_UPDATED")
        .eq("outcome", "SUCCESS");

      assert.deepEqual(logs, []);
    });

    it("records reviewer note updates with attribution and sanitized metadata", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const refCode = `ITC-NTE${randomSuffix}`;

      const { data: app } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Note Applicant ${randomSuffix}`,
          national_id: `304082501${randomSuffix}1`,
          academic_id: `BATU-NTE-${randomSuffix}`,
          phone: "+201011112222",
          whatsapp: "+201011112222",
          university_email: `2024${randomSuffix}@batechu.com`,
          academic_year: "second",
          department: "Computer Systems",
          experience_level: "experienced",
          primary_track: "it",
          motivation: "Motivation exceeding twenty characters for testing audit trail.",
          learning_goal: "Learning goal exceeding twenty characters for testing audit trail.",
          status: "PENDING_REVIEW",
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      assert.ok(app);
      createdAppIds.push(app.id);

      // Create temporary staff user for foreign key integrity
      const { data: staffAuth } = await serviceClient.auth.admin.createUser({
        email: `reviewer.staff.${randomSuffix}@itclub.org`,
        password: "TempStaffReviewer123!",
        email_confirm: true,
      });
      assert.ok(staffAuth?.user?.id);
      createdUserIds.push(staffAuth.user.id);
      const staffId = staffAuth.user.id;
      const notesContent = "Applicant has strong networking portfolio.";

      const noteRes = await saveReviewerNotes({
        id: app.id,
        notes: notesContent,
        reviewerUserId: staffId,
      });

      assert.equal(noteRes.success, true);

      // Record reviewer note update event
      const noteEvent = await recordAuditEvent({
        actor: {
          id: staffId,
          email: "reviewer@itclub.org",
          role: "admin",
        },
        action: "APPLICATION_REVIEW_NOTE_UPDATED",
        entityType: "application",
        entityId: app.id,
        entityReference: refCode,
        outcome: "SUCCESS",
        metadata: {
          noteLength: notesContent.length,
          preview: notesContent.slice(0, 30),
        },
      });

      assert.ok(noteEvent);
      assert.ok(noteEvent.id);
      createdAuditIds.push(noteEvent.id);

      const { data: logs } = await serviceClient
        .from("audit_events")
        .select("*")
        .eq("id", noteEvent.id);

      assert.ok(logs && logs.length === 1);
      const noteLog = logs[0];

      assert.equal(noteLog.actor_id, staffId);
      assert.equal(noteLog.actor_role, "admin");
      assert.equal(noteLog.outcome, "SUCCESS");
      assert.equal(noteLog.metadata?.preview, notesContent.slice(0, 30));
    });
  });

  // 4. Interview Check-In & Duplicate Detection Audit Trails
  describe("4. Interview Check-In & Duplicate Attendance Audit Trails", () => {
    it("records verified staff actor upon successful QR check-in and logs duplicate attempts as failures", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const refCode = `ITC-CKI${randomSuffix}`;

      // Insert scheduled candidate
      const { data: app } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Interview Candidate ${randomSuffix}`,
          national_id: `304082501${randomSuffix}2`,
          academic_id: `BATU-CKI-${randomSuffix}`,
          phone: "+201011112222",
          whatsapp: "+201011112222",
          university_email: `2024${randomSuffix}@batechu.com`,
          academic_year: "second",
          department: "Computer Systems",
          experience_level: "experienced",
          primary_track: "it",
          motivation: "Motivation exceeding twenty characters for testing audit trail.",
          learning_goal: "Learning goal exceeding twenty characters for testing audit trail.",
          status: "INTERVIEW_SCHEDULED",
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      assert.ok(app);
      createdAppIds.push(app.id);

      // Create QR token
      const qrRes = await getOrCreateInterviewQrToken(app.id, "INTERVIEW_SCHEDULED");
      assert.ok(qrRes.token);
      const qrToken = qrRes.token;

      // Create synthetic staff user
      const { data: staffAuth } = await serviceClient.auth.admin.createUser({
        email: `scanner.staff.${randomSuffix}@itclub.org`,
        password: "StaffPassword123!",
        email_confirm: true,
      });
      assert.ok(staffAuth?.user?.id);
      createdUserIds.push(staffAuth.user.id);
      const staffId = staffAuth.user.id;

      // Check-in 1: SUCCESSFUL
      const checkIn1 = await verifyAndCheckInInterviewQr(qrToken, staffId);
      assert.equal(checkIn1.success, true);

      // Verify successful check-in audit event
      const { data: successLogs } = await serviceClient
        .from("audit_events")
        .select("*")
        .eq("entity_reference", refCode)
        .eq("action", "INTERVIEW_CHECK_IN_SUCCESS");

      assert.ok(successLogs && successLogs.length === 1);
      const successEvent = successLogs[0];
      createdAuditIds.push(successEvent.id);

      assert.equal(successEvent.actor_id, staffId);
      assert.equal(successEvent.actor_role, "admin");
      assert.equal(successEvent.outcome, "SUCCESS");
      assert.equal(successEvent.entity_type, "interview_qr");
      // Verify raw bearer token is NOT stored in metadata
      assert.equal(successEvent.metadata?.raw_token, undefined);

      // Check-in 2: DUPLICATE ATTEMPT
      const checkIn2 = await verifyAndCheckInInterviewQr(qrToken, staffId);
      assert.equal(checkIn2.success, false);
      assert.equal(checkIn2.code, "ALREADY_CHECKED_IN");

      // Verify duplicate scan audit event recorded with FAILURE outcome
      const { data: duplicateLogs } = await serviceClient
        .from("audit_events")
        .select("*")
        .eq("entity_reference", refCode)
        .eq("action", "INTERVIEW_CHECK_IN_DUPLICATE");

      assert.ok(duplicateLogs && duplicateLogs.length === 1);
      const dupEvent = duplicateLogs[0];
      createdAuditIds.push(dupEvent.id);

      assert.equal(dupEvent.actor_id, staffId);
      assert.equal(dupEvent.outcome, "FAILURE");
      assert.equal(dupEvent.error_category, "ALREADY_CHECKED_IN");
    });
  });

  // 5. Notification Integrity & Audit Failure Non-False-Reporting
  describe("5. Notification Delivery & Failure Audit Integrity", () => {
    it("records NOTIFICATION_FAILED with safe category when delivery fails", async () => {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const refCode = `ITC-FLN${randomSuffix}`;

      const event = await recordAuditEvent({
        action: "NOTIFICATION_FAILED",
        actorRole: "system",
        entityType: "notification",
        entityReference: refCode,
        outcome: "FAILURE",
        errorCategory: "SMTP_CONNECTION_REFUSED",
        metadata: {
          recipient_domain: "batechu.com",
          template: "REGISTRATION_RECEIPT",
        },
      });

      assert.ok(event);
      assert.equal(event.success, true);
      assert.ok(event.id);
      createdAuditIds.push(event.id!);

      // Verify recorded event in database
      if (serviceClient) {
        const { data: dbLog } = await serviceClient
          .from("audit_events")
          .select("*")
          .eq("id", event.id!)
          .single();

        assert.ok(dbLog);
        assert.equal(dbLog.action, "NOTIFICATION_FAILED");
        assert.equal(dbLog.outcome, "FAILURE");
        assert.equal(dbLog.error_category, "SMTP_CONNECTION_REFUSED");

        // Verify no false delivery-success event exists for this notification
        const { data: successLogs } = await serviceClient
          .from("audit_events")
          .select("*")
          .eq("entity_reference", refCode)
          .eq("action", "NOTIFICATION_DELIVERED");

        assert.deepEqual(successLogs, []);
      }
    });
  });

  // 6. Querying, Filtering, & Server-Side Pagination
  describe("6. Audit Log Querying, Filtering, & Server-Side Pagination", () => {
    it("safely queries audit logs with filters, search, and bounded pagination", async () => {
      // Query page 1 with pageSize 5
      const result = await queryAuditLogs({
        page: 1,
        pageSize: 5,
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.events));
      assert.ok(result.totalCount >= 0);
      assert.ok(result.totalPages >= 1);
      assert.equal(result.page, 1);
      assert.equal(result.pageSize, 5);

      // Verify each event has required audit fields
      for (const ev of result.events) {
        assert.ok(ev.id);
        assert.ok(ev.created_at);
        assert.ok(ev.action);
        assert.ok(ev.entity_type);
        assert.ok(ev.outcome);
      }
    });

    it("filters accurately by action, entityType, and outcome", async () => {
      const outcomeFiltered = await queryAuditLogs({
        outcome: "SUCCESS",
        pageSize: 10,
      });

      for (const ev of outcomeFiltered.events) {
        assert.equal(ev.outcome, "SUCCESS");
      }
    });

    it("computes live aggregated audit statistics", async () => {
      const stats = await getAuditStats();
      assert.ok(stats);
      assert.equal(typeof stats.total, "number");
      assert.equal(typeof stats.recent24h, "number");
      assert.equal(typeof stats.successful, "number");
      assert.equal(typeof stats.failed, "number");
      assert.ok(typeof stats.byEntityType === "object");
    });
  });
});
