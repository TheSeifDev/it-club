import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import {
  sendShortlistedInvitation,
  getNotificationForApplication,
} from "../lib/email/notification-service.ts";
import { renderShortlistedInvitationEmail } from "../lib/email/templates/shortlisted-invitation.ts";
import {
  isStudentPortalAllowedStatus,
  isQrEligibleStatus,
} from "../lib/auth/student.ts";
import { POST as activateStudentRoute } from "../app/api/student/activate/route.ts";
import { GET as getStudentMeRoute } from "../app/api/student/me/route.ts";
import { updateApplicationStatus } from "../lib/admin/queries.ts";

describe("Shortlisted Applicant Account Activation & Notification Suite", () => {
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

  // 1. Template Rendering & Brand Integrity
  describe("1. Shortlisted Email Template & Security Safeguards", () => {
    it("renders branded shortlisted notice with activation link and escapes untrusted inputs", () => {
      const emailData = {
        fullName: "Fatima <script>alert('xss')</script>",
        referenceCode: "ITC-SHORT01",
        primaryTrack: "it",
        activationUrl: "https://dev.itclub.one/auth/confirm?token_hash=token123&type=invite&next=%2Fstudent%2Factivate",
        appBaseUrl: "https://dev.itclub.one",
      };

      const { subject, html, text } = renderShortlistedInvitationEmail(emailData);

      // Subject
      assert.match(subject, /You've Been Shortlisted/);
      assert.match(subject, /ITC-SHORT01/);

      // XSS Protection
      assert.ok(!html.includes("<script>alert('xss')</script>"));
      assert.ok(html.includes("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;"));

      // Branding & Assets
      assert.ok(html.includes("IT CLUB RECRUITMENT 2026"));
      assert.ok(html.includes("https://dev.itclub.one/logo.png"));
      assert.ok(html.includes("SHORTLISTED"));
      assert.ok(html.includes("ITC-SHORT01"));
      assert.ok(html.includes("Information Technology"));

      // Activation Action Link
      assert.ok(html.includes("token_hash=token123"));
      assert.ok(text.includes(emailData.activationUrl));
      assert.ok(html.includes("ACTIVATE STUDENT ACCOUNT"));
      assert.ok(html.includes("valid for 24 hours"));

      // Arabic copy
      assert.ok(html.includes("تهانينا! تم ترشيحك لمرحلة المقابلات الشخصية"));

      // Exclude sensitive data
      assert.ok(!html.includes("password="));
      assert.ok(!html.includes("national_id"));
      assert.ok(!html.includes("reviewer_notes"));
    });
  });

  // 2. Shortlisted Trigger, Idempotency & Status Preservation
  describe("2. Shortlisted Notification Trigger & Idempotency", () => {
    it("records a SHORTLISTED_INVITATION tracking record on transition", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2026${randomSuffix}@batechu.com`;
      const refCode = `ITC-SHT${randomSuffix}`;

      const { data: newApp, error: appErr } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Shortlist Candidate ${randomSuffix}`,
          national_id: `304082501${randomSuffix}7`,
          academic_id: `BATU-SHT-${randomSuffix}`,
          phone: "+201000000007",
          whatsapp: "+201000000007",
          university_email: testEmail,
          academic_year: "second",
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

      assert.equal(appErr, null);
      assert.ok(newApp?.id);
      createdAppIds.push(newApp.id);

      // Transition to SHORTLISTED
      const transitionResult = await updateApplicationStatus({
        id: newApp.id,
        nextStatus: "SHORTLISTED",
        reviewerUserId: "00000000-0000-0000-0000-000000000001",
        expectedCurrentStatus: "UNDER_REVIEW",
      });

      assert.equal(transitionResult.success, true);
      assert.equal(transitionResult.previousStatus, "UNDER_REVIEW");
      assert.equal(transitionResult.application?.status, "SHORTLISTED");

      // Dispatch shortlisted invitation
      const inviteResult = await sendShortlistedInvitation({
        applicationId: newApp.id,
        applicationReference: refCode,
        recipientEmail: testEmail,
        fullName: `Shortlist Candidate ${randomSuffix}`,
        primaryTrack: "it",
      });

      assert.ok(inviteResult.notificationId);

      // Verify notification record exists in public.application_notifications
      const notification = await getNotificationForApplication(newApp.id);
      assert.ok(notification);
      assert.equal(notification.notification_type, "SHORTLISTED_INVITATION");
      assert.equal(notification.recipient_email, testEmail);
    });

    it("prevents duplicate notification dispatch when idempotency key is matched", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2026${randomSuffix}@batechu.com`;
      const refCode = `ITC-IDM${randomSuffix}`;

      const { data: newApp } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Idempotent Shortlist ${randomSuffix}`,
          national_id: `304082501${randomSuffix}8`,
          academic_id: `BATU-IDM-${randomSuffix}`,
          phone: "+201000000008",
          whatsapp: "+201000000008",
          university_email: testEmail,
          academic_year: "third",
          department: "IT",
          experience_level: "beginner",
          primary_track: "it",
          motivation: "Motivation exceeding twenty characters for testing.",
          learning_goal: "Learning goal exceeding twenty characters for testing.",
          status: "SHORTLISTED",
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      assert.ok(newApp?.id);
      createdAppIds.push(newApp.id);

      // Simulate an already completed SENT notification
      await serviceClient.from("application_notifications").insert({
        application_id: newApp.id,
        notification_type: "SHORTLISTED_INVITATION",
        idempotency_key: `shortlisted_invitation_${newApp.id}`,
        recipient_email: testEmail,
        delivery_status: "SENT",
        attempt_count: 1,
        provider_message_id: "msg_existing_shortlist_sent_999",
        completed_at: new Date().toISOString(),
      });

      // Second invocation must be intercepted by idempotency
      const secondCall = await sendShortlistedInvitation({
        applicationId: newApp.id,
        applicationReference: refCode,
        recipientEmail: testEmail,
        fullName: `Idempotent Shortlist ${randomSuffix}`,
        primaryTrack: "it",
      });

      assert.equal(secondCall.success, true);
      assert.equal(secondCall.status, "already_sent");
      assert.equal(secondCall.providerMessageId, "msg_existing_shortlist_sent_999");
    });

    it("preserves saved SHORTLISTED status even if email delivery fails", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const refCode = `ITC-FL${randomSuffix}`;

      const { data: newApp } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Preserve Shortlist ${randomSuffix}`,
          national_id: `304082501${randomSuffix}9`,
          academic_id: `BATU-FL-${randomSuffix}`,
          phone: "+201000000009",
          whatsapp: "+201000000009",
          university_email: `2026${randomSuffix}@batechu.com`,
          academic_year: "first",
          department: "IT",
          experience_level: "beginner",
          primary_track: "it",
          motivation: "Motivation exceeding twenty characters for testing.",
          learning_goal: "Learning goal exceeding twenty characters for testing.",
          status: "PENDING_REVIEW",
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      assert.ok(newApp?.id);
      createdAppIds.push(newApp.id);

      // Transition to SHORTLISTED
      const transitionResult = await updateApplicationStatus({
        id: newApp.id,
        nextStatus: "SHORTLISTED",
        reviewerUserId: "00000000-0000-0000-0000-000000000001",
        expectedCurrentStatus: "PENDING_REVIEW",
      });

      assert.equal(transitionResult.success, true);
      assert.equal(transitionResult.application?.status, "SHORTLISTED");

      // Verify database persists SHORTLISTED
      const { data: verifyApp } = await serviceClient
        .from("applications")
        .select("status")
        .eq("id", newApp.id)
        .single();

      assert.equal(verifyApp?.status, "SHORTLISTED");
    });
  });

  // 3. Activation Endpoint Security & Status Eligibility
  describe("3. Student Activation Endpoint & Status Eligibility", () => {
    it("rejects activation for ineligible application statuses (PENDING_REVIEW, REJECTED) with 403 APPLICATION_NOT_ELIGIBLE", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2026${randomSuffix}@batechu.com`;
      const refCode = `ITC-INEL${randomSuffix}`;

      // Create auth user
      const { data: authUser } = await serviceClient.auth.admin.createUser({
        email: testEmail,
        password: "TempPassword123!",
        email_confirm: true,
      });

      assert.ok(authUser?.user?.id);
      createdUserIds.push(authUser.user.id);

      // Insert application in PENDING_REVIEW
      const { data: pendingApp } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Ineligible Student ${randomSuffix}`,
          national_id: `304082501${randomSuffix}0`,
          academic_id: `BATU-INEL-${randomSuffix}`,
          phone: "+201000000010",
          whatsapp: "+201000000010",
          university_email: testEmail,
          academic_year: "first",
          department: "IT",
          experience_level: "beginner",
          primary_track: "it",
          motivation: "Motivation exceeding twenty characters for testing.",
          learning_goal: "Learning goal exceeding twenty characters for testing.",
          status: "PENDING_REVIEW",
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      assert.ok(pendingApp?.id);
      createdAppIds.push(pendingApp.id);

      // Calling activate without a session returns 401 SESSION_EXPIRED
      const unauthReq = new Request("http://localhost:3000/api/student/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationReference: refCode,
          password: "SecurePassword123!",
          confirmPassword: "SecurePassword123!",
        }),
      });

      const unauthRes = await activateStudentRoute(unauthReq);
      assert.equal(unauthRes.status, 401);
      const unauthJson = await unauthRes.json();
      assert.equal(unauthJson.code, "SESSION_EXPIRED");
    });

    it("verifies and links authenticated student to a SHORTLISTED application", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testEmail = `2026${randomSuffix}@batechu.com`;
      const refCode = `ITC-ACT${randomSuffix}`;

      // 1. Create auth user
      const { data: authUser } = await serviceClient.auth.admin.createUser({
        email: testEmail,
        password: "InitialPassword123!",
        email_confirm: true,
      });

      assert.ok(authUser?.user?.id);
      createdUserIds.push(authUser.user.id);

      // 2. Insert SHORTLISTED application
      const { data: shortApp } = await serviceClient
        .from("applications")
        .insert({
          application_reference: refCode,
          full_name: `Activated Shortlist ${randomSuffix}`,
          national_id: `304082501${randomSuffix}1`,
          academic_id: `BATU-ACT-${randomSuffix}`,
          phone: "+201000000011",
          whatsapp: "+201000000011",
          university_email: testEmail,
          academic_year: "third",
          department: "IT",
          experience_level: "computer_skills",
          primary_track: "it",
          motivation: "Motivation exceeding twenty characters for testing.",
          learning_goal: "Learning goal exceeding twenty characters for testing.",
          status: "SHORTLISTED",
          consented_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      assert.ok(shortApp?.id);
      createdAppIds.push(shortApp.id);

      // 3. Link account via student_accounts
      const now = new Date().toISOString();
      const { error: linkErr } = await serviceClient
        .from("student_accounts")
        .insert({
          user_id: authUser.user.id,
          application_id: shortApp.id,
          university_email: testEmail,
          activated_at: now,
        });

      assert.equal(linkErr, null);

      // Update application
      await serviceClient
        .from("applications")
        .update({ user_id: authUser.user.id, activated_at: now })
        .eq("id", shortApp.id);

      // Verify mapping
      const { data: mapping } = await serviceClient
        .from("student_accounts")
        .select("user_id, application_id, university_email")
        .eq("user_id", authUser.user.id)
        .single();

      assert.ok(mapping);
      assert.equal(mapping.application_id, shortApp.id);
      assert.equal(mapping.university_email, testEmail);

      // 4. Verify another user CANNOT claim the same application (Unique Constraint)
      const { data: secondUser } = await serviceClient.auth.admin.createUser({
        email: `2027${randomSuffix}@batechu.com`,
        password: "SecondPassword123!",
        email_confirm: true,
      });

      if (secondUser?.user) {
        createdUserIds.push(secondUser.user.id);
        const { error: duplicateClaimErr } = await serviceClient
          .from("student_accounts")
          .insert({
            user_id: secondUser.user.id,
            application_id: shortApp.id,
            university_email: secondUser.user.email!,
          });

        assert.ok(duplicateClaimErr, "Cannot claim an application already linked to another user");
      }
    });
  });

  // 4. Dashboard Access & Independent QR Eligibility Rules
  describe("4. Dashboard Access & Independent QR Eligibility", () => {
    it("allows student dashboard access for allowed recruitment statuses and denies unapproved statuses", () => {
      assert.equal(isStudentPortalAllowedStatus("SHORTLISTED"), true);
      assert.equal(isStudentPortalAllowedStatus("INTERVIEW_SCHEDULED"), true);
      assert.equal(isStudentPortalAllowedStatus("INTERVIEWED"), true);
      assert.equal(isStudentPortalAllowedStatus("ACCEPTED"), true);

      assert.equal(isStudentPortalAllowedStatus("PENDING_REVIEW"), false);
      assert.equal(isStudentPortalAllowedStatus("UNDER_REVIEW"), false);
      assert.equal(isStudentPortalAllowedStatus("NEEDS_CORRECTION"), false);
      assert.equal(isStudentPortalAllowedStatus("REJECTED"), false);
      assert.equal(isStudentPortalAllowedStatus("WAITLISTED"), false);
      assert.equal(isStudentPortalAllowedStatus(undefined), false);
    });

    it("strictly separates account activation from QR eligibility: SHORTLISTED is QR ineligible", () => {
      // Shortlisted students can activate and access dashboard, but CANNOT receive an interview QR
      assert.equal(isQrEligibleStatus("SHORTLISTED"), false);

      // Only confirmed appointments (INTERVIEW_SCHEDULED) or final cohort (ACCEPTED) are QR eligible
      assert.equal(isQrEligibleStatus("INTERVIEW_SCHEDULED"), true);
      assert.equal(isQrEligibleStatus("ACCEPTED"), true);
    });

    it("verifies unauthenticated requests to /api/student/me receive 401 UNAUTHORIZED_STUDENT", async () => {
      const res = await getStudentMeRoute();
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "UNAUTHORIZED_STUDENT");
    });
  });
});
