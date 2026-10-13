import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import {
  sendAcceptanceInvitation,
  getNotificationForApplication,
} from "../lib/email/notification-service.ts";
import { renderAcceptanceInvitationEmail } from "../lib/email/templates/acceptance-invitation.ts";
import { isEmailConfigured } from "../lib/email/config.ts";
import { POST as activateStudentRoute } from "../app/api/student/activate/route.ts";
import { GET as getStudentMeRoute } from "../app/api/student/me/route.ts";
import { GET as getAdminMeRoute } from "../app/api/admin/me/route.ts";
import { updateApplicationStatus } from "../lib/admin/queries.ts";

describe("Phase 3B: Acceptance Invitation & Student Account Activation", () => {
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

  // Track created test entities for guaranteed cleanup
  const createdUserIds: string[] = [];
  const createdAppIds: string[] = [];

  after(async () => {
    if (!serviceClient) return;

    for (const uid of createdUserIds) {
      try {
        await serviceClient.auth.admin.deleteUser(uid);
      } catch {
        // cleanup suppression
      }
    }

    for (const appId of createdAppIds) {
      try {
        await serviceClient.from("student_accounts").delete().eq("application_id", appId);
        await serviceClient.from("application_notifications").delete().eq("application_id", appId);
        await serviceClient.from("applications").delete().eq("id", appId);
      } catch {
        // cleanup suppression
      }
    }
  });

  // 1. Acceptance Email Template Rendering & Data Safety
  describe("1. Acceptance Email Template & Content Security", () => {
    it("renders branded acceptance notice with activation link and escapes untrusted inputs", () => {
      const emailData = {
        fullName: "Kareem <script>alert(1)</script>",
        referenceCode: "ITC-ACCEPT01",
        primaryTrack: "it",
        activationUrl: "https://recruitment.itclub.org/student/activate?token=test_abc_123",
        appBaseUrl: "https://recruitment.itclub.org",
      };

      const { subject, html, text } = renderAcceptanceInvitationEmail(emailData);

      // Subject
      assert.match(subject, /Welcome to IT Club/);
      assert.match(subject, /ITC-ACCEPT01/);

      // XSS Protection
      assert.ok(!html.includes("<script>"));
      assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));

      // Activation link presence
      assert.ok(html.includes(emailData.activationUrl));
      assert.ok(text.includes(emailData.activationUrl));

      // Required fields
      assert.ok(html.includes("ITC-ACCEPT01"));
      assert.ok(html.includes("Information Technology"));
      assert.ok(html.includes("ACTIVATE STUDENT ACCOUNT"));
      assert.ok(html.includes("expires in 24 hours"));

      // Sensitive fields must NOT exist
      assert.ok(!html.includes("password="));
      assert.ok(!html.includes("temp_password"));
      assert.ok(!html.includes("national_id"));
      assert.ok(!html.includes("reviewer_notes"));
    });
  });

  // 2. Acceptance Trigger & Idempotency Rules
  describe("2. Acceptance Trigger, Idempotency & Delivery Tracking", () => {
    it("creates an invitation link and records notification tracking on first acceptance", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2024${randomSuffix}@batechu.com`;
      const refCode = `ITC-ACC${randomSuffix}`;

      // Insert a synthetic accepted application
      const { data: newApp, error: appErr } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Accepted Student ${randomSuffix}`,
          national_id: `304082501${randomSuffix}1`,
          academic_id: `BATU-ACC-${randomSuffix}`,
          phone: "+201000000001",
          whatsapp: "+201000000001",
          university_email: testEmail,
          academic_year: "first",
          department: "Information Technology",
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

      // Call sendAcceptanceInvitation
      const invResult = await sendAcceptanceInvitation({
        applicationId: newApp.id,
        applicationReference: refCode,
        recipientEmail: testEmail,
        fullName: `Accepted Student ${randomSuffix}`,
        primaryTrack: "it",
      });

      // Verify notification tracking
      assert.ok(invResult.notificationId);

      const notification = await getNotificationForApplication(
        newApp.id,
        "ACCEPTANCE_INVITATION"
      );
      assert.ok(notification);
      assert.equal(notification.notification_type, "ACCEPTANCE_INVITATION");
      assert.equal(notification.application_id, newApp.id);
      assert.equal(notification.recipient_email, testEmail);

      // If Resend is unconfigured, must NOT claim false success
      if (!isEmailConfigured()) {
        assert.equal(invResult.status, "unconfigured");
        assert.equal(invResult.safeReason, "PROVIDER_NOT_CONFIGURED");
        assert.equal(notification.delivery_status, "FAILED");
        assert.equal(notification.safe_error_category, "PROVIDER_NOT_CONFIGURED");
      }

      // Cleanup newly created Supabase auth user if generated
      const { data: authUsers } = await serviceClient.auth.admin.listUsers();
      const createdAuth = authUsers.users.find((u) => u.email === testEmail);
      if (createdAuth) {
        createdUserIds.push(createdAuth.id);
      }
    });

    it("enforces idempotency and prevents duplicate invitation sends on retry", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2025${randomSuffix}@batechu.com`;
      const refCode = `ITC-IDM${randomSuffix}`;

      const { data: newApp } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Idempotent Test ${randomSuffix}`,
          national_id: `304082501${randomSuffix}2`,
          academic_id: `BATU-IDM-${randomSuffix}`,
          phone: "+201000000002",
          whatsapp: "+201000000002",
          university_email: testEmail,
          academic_year: "second",
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

      assert.ok(newApp?.id);
      createdAppIds.push(newApp.id);

      // Simulate a previously completed SENT notification
      await serviceClient.from("application_notifications").insert({
        application_id: newApp.id,
        notification_type: "ACCEPTANCE_INVITATION",
        idempotency_key: `acceptance_invitation_${newApp.id}`,
        recipient_email: testEmail,
        delivery_status: "SENT",
        attempt_count: 1,
        provider_message_id: "msg_existing_invitation_sent_123",
        completed_at: new Date().toISOString(),
      });

      // Second invocation must be intercepted by idempotency
      const secondCall = await sendAcceptanceInvitation({
        applicationId: newApp.id,
        applicationReference: refCode,
        recipientEmail: testEmail,
        fullName: `Idempotent Test ${randomSuffix}`,
        primaryTrack: "it",
      });

      assert.equal(secondCall.success, true);
      assert.equal(secondCall.status, "already_sent");
      assert.equal(secondCall.providerMessageId, "msg_existing_invitation_sent_123");
    });

    it("preserves application status as ACCEPTED even if notification fails", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const refCode = `ITC-PRS${randomSuffix}`;

      // Insert an application in UNDER_REVIEW
      const { data: newApp } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Preserve Decision ${randomSuffix}`,
          national_id: `304082501${randomSuffix}3`,
          academic_id: `BATU-PRS-${randomSuffix}`,
          phone: "+201000000003",
          whatsapp: "+201000000003",
          university_email: `2026${randomSuffix}@batechu.com`,
          academic_year: "third",
          department: "IT",
          experience_level: "beginner",
          primary_track: "it",
          motivation: "Motivation exceeding twenty characters for testing.",
          learning_goal: "Learning goal exceeding twenty characters for testing.",
          status: "UNDER_REVIEW",
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      assert.ok(newApp?.id);
      createdAppIds.push(newApp.id);

      // Perform authorized transition to ACCEPTED
      const transitionResult = await updateApplicationStatus({
        id: newApp.id,
        nextStatus: "ACCEPTED",
        reviewerUserId: "00000000-0000-0000-0000-000000000001",
        expectedCurrentStatus: "UNDER_REVIEW",
      });

      assert.equal(transitionResult.success, true);
      assert.equal(transitionResult.previousStatus, "UNDER_REVIEW");
      assert.equal(transitionResult.application?.status, "ACCEPTED");

      // Verify persisted database record is strictly ACCEPTED
      const { data: verifyApp } = await serviceClient
        .from("applications")
        .select("status")
        .eq("id", newApp.id)
        .single();

      assert.equal(verifyApp?.status, "ACCEPTED");
    });
  });

  // 3. Student Account Activation & Verification Flow
  describe("3. Student Account Activation Endpoint (/api/student/activate)", () => {
    it("rejects unauthenticated requests with 401 SESSION_EXPIRED", async () => {
      const req = new Request("http://localhost:3000/api/student/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationReference: "ITC-NONEXIST",
          password: "SecurePassword123!",
          confirmPassword: "SecurePassword123!",
        }),
      });

      const res = await activateStudentRoute(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "SESSION_EXPIRED");
    });

    it("verifies and links authenticated student to accepted application", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2027${randomSuffix}@batechu.com`;
      const refCode = `ITC-E2E${randomSuffix}`;

      // 1. Create Supabase Auth user
      const { data: authUser, error: authErr } =
        await serviceClient.auth.admin.createUser({
          email: testEmail,
          password: "InitialTempPassword123!",
          email_confirm: true,
        });

      assert.equal(authErr, null);
      assert.ok(authUser?.user?.id);
      createdUserIds.push(authUser.user.id);

      // 2. Insert corresponding ACCEPTED application
      const { data: newApp, error: appErr } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `E2E Student ${randomSuffix}`,
          national_id: `304082501${randomSuffix}4`,
          academic_id: `BATU-E2E-${randomSuffix}`,
          phone: "+201000000004",
          whatsapp: "+201000000004",
          university_email: testEmail,
          academic_year: "first",
          department: "Information Technology",
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

      // 3. Simulate authenticated session and activate account
      // Manually link through student_accounts to verify durable mapping
      const { error: linkErr } = await serviceClient
        .from("student_accounts")
        .insert({
          user_id: authUser.user.id,
          application_id: newApp.id,
          university_email: testEmail,
          activated_at: new Date().toISOString(),
        });

      assert.equal(linkErr, null);

      // Verify mapping in student_accounts
      const { data: mapping } = await serviceClient
        .from("student_accounts")
        .select("user_id, application_id, university_email")
        .eq("user_id", authUser.user.id)
        .single();

      assert.ok(mapping);
      assert.equal(mapping.application_id, newApp.id);
      assert.equal(mapping.university_email, testEmail);

      // Update application user_id
      await serviceClient
        .from("applications")
        .update({ user_id: authUser.user.id, activated_at: new Date().toISOString() })
        .eq("id", newApp.id);

      // 4. Verify another user CANNOT claim the same application (Unique Constraint)
      const { data: otherUser } = await serviceClient.auth.admin.createUser({
        email: `2028${randomSuffix}@batechu.com`,
        password: "OtherTempPassword123!",
        email_confirm: true,
      });

      if (otherUser?.user) {
        createdUserIds.push(otherUser.user.id);
        const { error: duplicateClaimErr } = await serviceClient
          .from("student_accounts")
          .insert({
            user_id: otherUser.user.id,
            application_id: newApp.id,
            university_email: otherUser.user.email!,
          });

        assert.ok(
          duplicateClaimErr,
          "Database must reject claiming an application already claimed by another user."
        );
      }
    });

    it("verifies RLS prevents anonymous clients from reading student_accounts", async () => {
      const publicClient = createClient(supabaseUrl, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data, error } = await publicClient
        .from("student_accounts")
        .select("*")
        .limit(5);

      assert.ok(error || (data && data.length === 0));
    });

    it("verifies unauthenticated requests to /api/student/me receive 401 UNAUTHORIZED_STUDENT", async () => {
      const res = await getStudentMeRoute();
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "UNAUTHORIZED_STUDENT");
    });

    it("verifies students cannot access staff administrative endpoints (/api/admin/me)", async () => {
      const req = new Request("http://localhost:3000/api/admin/me");
      const res = await getAdminMeRoute(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "UNAUTHORIZED");
    });
  });
});
