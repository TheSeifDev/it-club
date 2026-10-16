import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import {
  generateSecureTemporaryPassword,
  provisionStudentAccount,
} from "../lib/auth/provisioning.ts";
import {
  isStudentPortalAllowedStatus,
  isQrEligibleStatus,
  isStudentPasswordChangeRequired,
  isStudentCredentialExpired,
} from "../lib/auth/student.ts";

describe("Immediate Student Account Provisioning & 24-Hour Password Enforcement Suite", () => {
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
  let staffUser: { id: string; email: string; role: string } = {
    id: "00000000-0000-0000-0000-000000000001",
    email: "owner@itclub.test",
    role: "owner",
  };

  before(async () => {
    if (!serviceClient) return;

    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000).toString();
    const { data: staffAuth, error: staffErr } = await serviceClient.auth.admin.createUser({
      email: `admin.prov.${randomSuffix}@itclub.org`,
      password: "TempStaffPassword123!",
      email_confirm: true,
    });

    if (staffAuth?.user) {
      createdUserIds.push(staffAuth.user.id);
      staffUser = {
        id: staffAuth.user.id,
        email: staffAuth.user.email!,
        role: "owner",
      };
    } else if (staffErr) {
      console.warn("Could not create test staff user:", staffErr.message);
    }
  });

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
        await serviceClient.from("audit_events").delete().eq("metadata->>applicationId", appId);
        await serviceClient.from("applications").delete().eq("id", appId);
      } catch {
        // cleanup suppression
      }
    }
  });

  // 1 & 4. Temporary Password Generator
  describe("1. Cryptographic Temporary Password Generation", () => {
    it("generates a 14+ character unpredictable password with uppercase, lowercase, numbers, and symbols", () => {
      const pwd = generateSecureTemporaryPassword("ITC-99999999");
      assert.ok(pwd.length >= 14, "Password must be at least 14 characters");
      assert.match(pwd, /[A-Z]/, "Must contain uppercase");
      assert.match(pwd, /[a-z]/, "Must contain lowercase");
      assert.match(pwd, /[0-9]/, "Must contain numbers");
      assert.match(pwd, /[!@#$%*&]/, "Must contain allowed symbols");
    });

    it("never includes the application reference code in the generated password", () => {
      const reference = "ITC-77889900";
      for (let i = 0; i < 20; i++) {
        const pwd = generateSecureTemporaryPassword(reference);
        assert.equal(
          pwd.toUpperCase().includes("77889900"),
          false,
          "Password must not include application reference"
        );
      }
    });

    it("generates unique passwords across consecutive invocations", () => {
      const p1 = generateSecureTemporaryPassword();
      const p2 = generateSecureTemporaryPassword();
      const p3 = generateSecureTemporaryPassword();
      assert.notEqual(p1, p2);
      assert.notEqual(p2, p3);
      assert.notEqual(p1, p3);
    });
  });

  // 2. Ineligible Applicant Rejection
  describe("2. Applicant Status Eligibility Rules", () => {
    it("permits student access for SHORTLISTED, INTERVIEW_SCHEDULED, INTERVIEWED, and ACCEPTED", () => {
      assert.equal(isStudentPortalAllowedStatus("SHORTLISTED"), true);
      assert.equal(isStudentPortalAllowedStatus("INTERVIEW_SCHEDULED"), true);
      assert.equal(isStudentPortalAllowedStatus("INTERVIEWED"), true);
      assert.equal(isStudentPortalAllowedStatus("ACCEPTED"), true);
    });

    it("rejects student access and provisioning for ineligible statuses", () => {
      assert.equal(isStudentPortalAllowedStatus("PENDING_REVIEW"), false);
      assert.equal(isStudentPortalAllowedStatus("UNDER_REVIEW"), false);
      assert.equal(isStudentPortalAllowedStatus("NEEDS_CORRECTION"), false);
      assert.equal(isStudentPortalAllowedStatus("REJECTED"), false);
      assert.equal(isStudentPortalAllowedStatus("WAITLISTED"), false);
    });

    it("rejects provisioning when applicant status is PENDING_REVIEW", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(10000000 + Math.random() * 90000000).toString();
      const ref = `ITC-TEST-PND-${randomSuffix.slice(0, 4)}`;
      const email = `2024${randomSuffix.slice(0, 4)}@batechu.com`;

      const { data: app, error } = await serviceClient
        .from("applications")
        .insert({
          application_reference: ref,
          full_name: "Test Ineligible Candidate",
          national_id: `2980101${randomSuffix.slice(0, 7)}`,
          academic_id: `2024${randomSuffix.slice(0, 4)}`,
          university_email: email,
          phone: "01099999999",
          whatsapp: "01099999999",
          academic_year: "second",
          department: "Computer Science",
          experience_level: "beginner",
          primary_track: "it",
          motivation: "Test motivation",
          learning_goal: "Test goals",
          status: "PENDING_REVIEW",
          consented_at: new Date().toISOString(),
        })
        .select()
        .single();

      assert.ok(!error, `Failed to create fixture app: ${error?.message}`);
      createdAppIds.push(app.id);

      const result = await provisionStudentAccount({
        applicationId: app.id,
        staffUser,
      });

      assert.equal(result.success, false);
      assert.equal(result.code, "INELIGIBLE_STATUS");
      assert.ok(result.error?.includes("not eligible"));
    });
  });

  // 3. Canonical University Email Identity
  describe("3. University Email Authentication Identity", () => {
    it("enforces canonical @batechu.com email identity and rejects non-university domains", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(10000000 + Math.random() * 90000000).toString();
      const ref = `ITC-TEST-EML-${randomSuffix.slice(0, 4)}`;

      // Attempting to insert an invalid domain into applications is blocked by database constraint
      const { error: insertErr } = await serviceClient
        .from("applications")
        .insert({
          application_reference: ref,
          full_name: "Test Email Candidate",
          national_id: `2980101${randomSuffix.slice(0, 7)}`,
          academic_id: `2024${randomSuffix.slice(0, 4)}`,
          university_email: "student@gmail.com",
          google_email: "student@gmail.com",
          phone: "01099999999",
          whatsapp: "01099999999",
          academic_year: "second",
          department: "Computer Science",
          experience_level: "beginner",
          primary_track: "it",
          motivation: "Test motivation",
          learning_goal: "Test goals",
          status: "SHORTLISTED",
          consented_at: new Date().toISOString(),
        });

      assert.ok(insertErr, "Database must reject non-@batechu.com university email");
      assert.match(insertErr.message, /university_email_format_check/);
    });
  });

  // 1, 5, 11, 13. End-to-End Eligible Provisioning & Reissue
  describe("4. Eligible Shortlisted Provisioning, Audit & Credential Reissue", () => {
    it("successfully provisions an eligible shortlisted applicant, sets 24h deadline, and does not leak password to DB or audit", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(10000000 + Math.random() * 90000000).toString();
      const ref = `ITC-PRV-${randomSuffix.slice(0, 4)}`;
      const universityEmail = `2025${randomSuffix.slice(0, 4)}@batechu.com`;

      const { data: app, error: appErr } = await serviceClient
        .from("applications")
        .insert({
          application_reference: ref,
          full_name: "Youssef Provisioning Candidate",
          national_id: `2990101${randomSuffix.slice(0, 7)}`,
          academic_id: `2025${randomSuffix.slice(0, 4)}`,
          university_email: universityEmail,
          google_email: "youssef.test@gmail.com",
          phone: "01011112222",
          whatsapp: "01011112222",
          academic_year: "first",
          department: "Engineering",
          experience_level: "experienced",
          primary_track: "rnd",
          motivation: "Test motivation",
          learning_goal: "Test goals",
          status: "SHORTLISTED",
          consented_at: new Date().toISOString(),
        })
        .select()
        .single();

      assert.ok(!appErr, `Insert failed: ${appErr?.message}`);
      createdAppIds.push(app.id);

      // 1. Provision account directly
      const result = await provisionStudentAccount({
        applicationId: app.id,
        staffUser,
      });

      assert.equal(result.success, true);
      assert.ok(result.temporaryPassword, "Must return temporary password once in result");
      assert.ok(result.userId, "Must return created userId");
      createdUserIds.push(result.userId!);

      assert.equal(result.universityEmail, universityEmail);
      assert.equal(result.isReissue, false);

      // Verify 24-hour expiration calculation
      const issuedTime = new Date(result.issuedAt!).getTime();
      const expireTime = new Date(result.expiresAt!).getTime();
      const diffHours = (expireTime - issuedTime) / (1000 * 60 * 60);
      assert.ok(Math.abs(diffHours - 24) < 0.1, "Expiration must be set exactly 24 hours from issuance");

      // Verify DB mapping table (student_accounts)
      const { data: dbAccount, error: accErr } = await serviceClient
        .from("student_accounts")
        .select("*")
        .eq("user_id", result.userId!)
        .single();

      assert.ok(!accErr, `Failed to load student_accounts: ${accErr?.message}`);
      assert.equal(dbAccount.application_id, app.id);
      assert.equal(dbAccount.university_email, universityEmail);
      assert.equal(dbAccount.password_change_required, true);
      assert.ok(dbAccount.temp_password_issued_at);
      assert.ok(dbAccount.temp_password_expires_at);
      assert.equal(dbAccount.password_changed_at, null);

      // Crucial: Verify plaintext password NEVER appears in any database column or metadata
      const rawAccountJson = JSON.stringify(dbAccount);
      assert.equal(
        rawAccountJson.includes(result.temporaryPassword!),
        false,
        "Temporary password must NEVER be persisted in public.student_accounts!"
      );

      // Verify audit trail recorded without storing password
      const { data: auditRows } = await serviceClient
        .from("audit_events")
        .select("*")
        .eq("entity_id", result.userId!)
        .order("created_at", { ascending: false });

      assert.ok(auditRows && auditRows.length > 0, "Audit event must be logged");
      const provisionAuditEvent = auditRows.find((a) => a.action === "STUDENT_ACCOUNT_PROVISIONED");
      assert.ok(provisionAuditEvent, "Must have STUDENT_ACCOUNT_PROVISIONED event");
      assert.equal(provisionAuditEvent.outcome, "SUCCESS");
      assert.equal(
        JSON.stringify(provisionAuditEvent.metadata).includes(result.temporaryPassword!),
        false,
        "Temporary password must NEVER be logged in audit metadata!"
      );

      // 2. Controlled Reissue of Temporary Password
      const reissueResult = await provisionStudentAccount({
        applicationId: app.id,
        staffUser,
        isReissue: true,
      });

      assert.equal(reissueResult.success, true);
      assert.equal(reissueResult.isReissue, true);
      assert.notEqual(
        reissueResult.temporaryPassword,
        result.temporaryPassword,
        "Reissued password must be a fresh unique credential"
      );

      // Verify audit for reissue
      const { data: reissueAudit } = await serviceClient
        .from("audit_events")
        .select("*")
        .eq("action", "STUDENT_CREDENTIAL_REISSUED")
        .eq("entity_id", result.userId!)
        .maybeSingle();

      assert.ok(reissueAudit, "Must record STUDENT_CREDENTIAL_REISSUED audit event");
      assert.equal(
        JSON.stringify(reissueAudit.metadata).includes(reissueResult.temporaryPassword!),
        false,
        "Reissued password must NEVER be in audit metadata"
      );
    });
  });

  // 6. Conflicting Account Rejection
  describe("5. Existing Auth User Reconciliation & Conflict Prevention", () => {
    it("rejects provisioning when an existing Auth user belongs to a different application", async () => {
      if (!serviceClient) return;

      const randomSuffix1 = Math.floor(10000000 + Math.random() * 90000000).toString();
      const randomSuffix2 = Math.floor(10000000 + Math.random() * 90000000).toString();
      const email1 = `2026${randomSuffix1.slice(0, 4)}@batechu.com`;
      const email2 = `2026${randomSuffix2.slice(0, 4)}@batechu.com`;

      // 1. Create first application and provision
      const { data: app1 } = await serviceClient
        .from("applications")
        .insert({
          application_reference: `ITC-CNF1-${randomSuffix1.slice(0, 3)}`,
          full_name: "Original Candidate",
          national_id: `2980101${randomSuffix1.slice(0, 7)}`,
          academic_id: `2026${randomSuffix1.slice(0, 4)}`,
          university_email: email1,
          phone: "01011113333",
          whatsapp: "01011113333",
          academic_year: "second",
          department: "CS",
          experience_level: "beginner",
          primary_track: "it",
          motivation: "Test motivation",
          learning_goal: "Test goals",
          status: "SHORTLISTED",
          consented_at: new Date().toISOString(),
        })
        .select()
        .single();

      createdAppIds.push(app1.id);

      const p1 = await provisionStudentAccount({
        applicationId: app1.id,
        staffUser,
      });
      assert.equal(p1.success, true);
      createdUserIds.push(p1.userId!);

      // 2. Create second application (distinct email2, not yet provisioned)
      const { data: app2 } = await serviceClient
        .from("applications")
        .insert({
          application_reference: `ITC-CNF2-${randomSuffix2.slice(0, 3)}`,
          full_name: "Conflicting Candidate",
          national_id: `2980101${randomSuffix2.slice(0, 7)}`,
          academic_id: `2026${randomSuffix2.slice(0, 4)}`,
          university_email: email2,
          phone: "01011114444",
          whatsapp: "01011114444",
          academic_year: "second",
          department: "CS",
          experience_level: "beginner",
          primary_track: "it",
          motivation: "Test motivation",
          learning_goal: "Test goals",
          status: "SHORTLISTED",
          consented_at: new Date().toISOString(),
        })
        .select()
        .single();

      createdAppIds.push(app2.id);

      // 3. Create a third application to act as the existing linked application
      const randomSuffix3 = Math.floor(10000000 + Math.random() * 90000000).toString();
      const { data: appOther, error: otherErr } = await serviceClient
        .from("applications")
        .insert({
          application_reference: `ITC-OTH-${randomSuffix3.slice(0, 3)}`,
          full_name: "Other Linked Candidate",
          national_id: `2980101${randomSuffix3.slice(0, 7)}`,
          academic_id: `2026${randomSuffix3.slice(0, 4)}`,
          university_email: `2026${randomSuffix3.slice(0, 4)}@batechu.com`,
          phone: "01011116666",
          whatsapp: "01011116666",
          academic_year: "second",
          department: "CS",
          experience_level: "beginner",
          primary_track: "it",
          motivation: "Test motivation",
          learning_goal: "Test goals",
          status: "SHORTLISTED",
          consented_at: new Date().toISOString(),
        })
        .select()
        .single();

      assert.ok(!otherErr && appOther);
      createdAppIds.push(appOther.id);

      // Create an Auth user matching email2, BUT link that user in student_accounts to appOther.id!
      const { data: conflictAuth } = await serviceClient.auth.admin.createUser({
        email: email2,
        password: "TempPassForConflict123!",
        email_confirm: true,
      });

      assert.ok(conflictAuth?.user);
      createdUserIds.push(conflictAuth.user.id);

      const { error: insertAccErr } = await serviceClient.from("student_accounts").insert({
        user_id: conflictAuth.user.id,
        application_id: appOther.id, // Conflicting link to appOther!
        university_email: email2,
        activated_at: new Date().toISOString(),
        password_change_required: true,
      });
      assert.ok(!insertAccErr, `Failed to setup conflict account: ${insertAccErr?.message}`);

      // Attempting to provision app2 must detect ownership collision and fail safely
      const p2 = await provisionStudentAccount({
        applicationId: app2.id,
        staffUser,
      });

      assert.equal(p2.success, false);
      assert.equal(p2.code, "ACCOUNT_CONFLICT");
      assert.ok(p2.error?.includes("already linked to another application"));
    });
  });

  // 7, 8, 9, 10, 12. Password Lifecycle, Expiration & Route Enforcement
  describe("6. Password Lifecycle, 24-Hour Expiry & Guard Enforcement", () => {
    it("correctly evaluates pending password change requirement and expiration", () => {
      const now = Date.now();

      // Active temporary password (issued 1 hour ago, expires in 23 hours)
      const activeStudent = {
        user: { id: "u1", email: "test@batechu.com" } as unknown as import("@supabase/supabase-js").User,
        application: { id: "a1", status: "SHORTLISTED" } as unknown as import("../lib/admin/types.ts").ApplicationDetail,
        activatedAt: new Date(now - 3600000).toISOString(),
        passwordChangeRequired: true,
        tempPasswordIssuedAt: new Date(now - 3600000).toISOString(),
        tempPasswordExpiresAt: new Date(now + 23 * 3600000).toISOString(),
        passwordChangedAt: null,
        isTempPasswordExpired: false,
      };

      assert.equal(isStudentPasswordChangeRequired(activeStudent), true);
      assert.equal(isStudentCredentialExpired(activeStudent), false);

      // Expired temporary password (expiresAt was 2 hours ago)
      const expiredStudent = {
        ...activeStudent,
        tempPasswordExpiresAt: new Date(now - 2 * 3600000).toISOString(),
        isTempPasswordExpired: true,
      };

      assert.equal(isStudentPasswordChangeRequired(expiredStudent), true);
      assert.equal(isStudentCredentialExpired(expiredStudent), true);

      // Password already changed (permanent credential active)
      const permanentStudent = {
        ...activeStudent,
        passwordChangeRequired: false,
        passwordChangedAt: new Date(now - 1000).toISOString(),
        isTempPasswordExpired: false,
      };

      assert.equal(isStudentPasswordChangeRequired(permanentStudent), false);
      assert.equal(isStudentCredentialExpired(permanentStudent), false);
    });

    it("does not delete user, application, or student account when credential expires", async () => {
      if (!serviceClient) return;

      const randomSuffix = Math.floor(10000000 + Math.random() * 90000000).toString();
      const ref = `ITC-EXP-${randomSuffix.slice(0, 4)}`;
      const universityEmail = `2027${randomSuffix.slice(0, 4)}@batechu.com`;

      const { data: app } = await serviceClient
        .from("applications")
        .insert({
          application_reference: ref,
          full_name: "Preserved Expiry Candidate",
          national_id: `2980101${randomSuffix.slice(0, 7)}`,
          academic_id: `2027${randomSuffix.slice(0, 4)}`,
          university_email: universityEmail,
          phone: "01011115555",
          whatsapp: "01011115555",
          academic_year: "second",
          department: "CS",
          experience_level: "beginner",
          primary_track: "it",
          motivation: "Test motivation",
          learning_goal: "Test goals",
          status: "SHORTLISTED",
          consented_at: new Date().toISOString(),
        })
        .select()
        .single();

      createdAppIds.push(app.id);

      const prov = await provisionStudentAccount({
        applicationId: app.id,
        staffUser,
      });
      assert.equal(prov.success, true);
      createdUserIds.push(prov.userId!);

      // Artificially expire the credential in the database (set expires_at to 25 hours in the past)
      const pastExpiry = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      await serviceClient
        .from("student_accounts")
        .update({ temp_password_expires_at: pastExpiry })
        .eq("user_id", prov.userId!);

      // Verify the application and student account records are STILL completely intact
      const { data: checkAccount } = await serviceClient
        .from("student_accounts")
        .select("*")
        .eq("user_id", prov.userId!)
        .single();

      assert.ok(checkAccount, "Student account record must NOT be deleted upon expiry");
      assert.equal(checkAccount.password_change_required, true);
      assert.equal(
        new Date(checkAccount.temp_password_expires_at).getTime(),
        new Date(pastExpiry).getTime()
      );

      const { data: checkApp } = await serviceClient
        .from("applications")
        .select("id, status, application_reference")
        .eq("id", app.id)
        .single();

      assert.ok(checkApp, "Application must NOT be deleted upon expiry");
      assert.equal(checkApp.status, "SHORTLISTED", "Application status must remain SHORTLISTED");
    });
  });

  // 14. Existing QR Eligibility Rules Intact
  describe("7. QR Eligibility Rules Preservation", () => {
    it("only permits QR token issuance for ACCEPTED or INTERVIEW_SCHEDULED statuses", () => {
      assert.equal(isQrEligibleStatus("ACCEPTED"), true);
      assert.equal(isQrEligibleStatus("INTERVIEW_SCHEDULED"), true);

      // Provisioned SHORTLISTED applicant is NOT eligible for QR until scheduled or accepted
      assert.equal(isQrEligibleStatus("SHORTLISTED"), false);
      assert.equal(isQrEligibleStatus("UNDER_REVIEW"), false);
      assert.equal(isQrEligibleStatus("PENDING_REVIEW"), false);
      assert.equal(isQrEligibleStatus("REJECTED"), false);
    });
  });

  // 15. Staff Authorization Boundaries
  describe("8. Staff Role Authorization Boundaries", () => {
    it("rejects unauthorized provisioning requests when actor is interviewer or applicant", async () => {
      const result = await provisionStudentAccount({
        applicationId: "00000000-0000-0000-0000-000000000000",
        staffUser: { id: "interviewer-1", role: "interviewer" },
      });

      assert.equal(result.success, false);
      assert.equal(result.code, "FORBIDDEN");
      assert.ok(result.error?.includes("Only Owner and Admin"));
    });
  });
});
