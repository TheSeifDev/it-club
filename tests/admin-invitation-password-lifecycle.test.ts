import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import {
  inviteAdminAccount,
  reissueAdminTemporaryPassword,
  changeStaffPassword,
} from "../lib/admin/staff-service.ts";
import {
  verifyStaffApiRequest,
  getStaffMember,
} from "../lib/auth/server.ts";
import { generateSecureTemporaryPassword } from "../lib/auth/provisioning.ts";
import { POST as postInviteAdmin } from "../app/api/admin/staff/invite/route.ts";
import { POST as postReissueCredential } from "../app/api/admin/staff/reissue/route.ts";
import { POST as postChangePassword } from "../app/api/admin/change-password/route.ts";

describe("IT Club — Owner-Only Admin Invitation & Mandatory First-Login Password Change Suite", () => {
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

  const createdAuthUserIds: string[] = [];
  const createdEmails: string[] = [];

  const ownerUser = {
    id: "00000000-0000-0000-0000-000000000001",
    email: "owner.governance@itclub.org",
    role: "owner",
  };

  const nonOwnerAdminUser = {
    id: "00000000-0000-0000-0000-000000000002",
    email: "regular.admin@itclub.org",
    role: "admin",
  };

  const interviewerUser = {
    id: "00000000-0000-0000-0000-000000000003",
    email: "scanner.interviewer@itclub.org",
    role: "interviewer",
  };

  before(async () => {
    if (!serviceClient) return;

    const { data: ownerRec } = await serviceClient
      .from("staff_members")
      .select("user_id, email, role")
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();

    if (ownerRec) {
      ownerUser.id = ownerRec.user_id;
      ownerUser.email = ownerRec.email || "owner.governance@itclub.org";
    }
  });

  after(async () => {
    if (!serviceClient) return;

    // Cleanup created test users
    for (const uid of createdAuthUserIds) {
      try {
        await serviceClient.from("staff_members").delete().eq("user_id", uid);
        await serviceClient.auth.admin.deleteUser(uid);
      } catch {
        // Ignore cleanup errors
      }
    }

    // Cleanup audit rows for test emails
    for (const em of createdEmails) {
      try {
        await serviceClient.from("audit_events").delete().eq("entity_reference", em);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  // --------------------------------------------------------------------------
  // 1. Temporary Password Generator
  // --------------------------------------------------------------------------
  describe("1. Cryptographic Temporary Password Security", () => {
    it("generates unpredictable, high-entropy passwords with required character classes", () => {
      const pwd1 = generateSecureTemporaryPassword();
      const pwd2 = generateSecureTemporaryPassword();

      assert.notEqual(pwd1, pwd2, "Subsequent passwords must be unique");
      assert.ok(pwd1.length >= 14, "Password length must be at least 14 characters");
      assert.notEqual(pwd1, "0123456789", "Must never use the shared default 0123456789 password");
      assert.match(pwd1, /[A-Z]/, "Must contain uppercase characters");
      assert.match(pwd1, /[a-z]/, "Must contain lowercase characters");
      assert.match(pwd1, /[0-9]/, "Must contain numeric characters");
      assert.match(pwd1, /[!@#$%*&]/, "Must contain symbol characters");
    });
  });

  // --------------------------------------------------------------------------
  // 2. Authorization & Privilege Boundaries
  // --------------------------------------------------------------------------
  describe("2. Owner-Only Clearance Authorization", () => {
    it("rejects invitations attempted by non-owner roles (admin, interviewer)", async () => {
      const randomTag = Math.floor(100000 + Math.random() * 900000);
      const testEmail = `admin.unauth.${randomTag}@itclub.org`;

      // Attempt as admin
      const resAdmin = await inviteAdminAccount({
        email: testEmail,
        ownerUser: nonOwnerAdminUser,
      });
      assert.equal(resAdmin.success, false);
      assert.equal(resAdmin.code, "FORBIDDEN");

      // Attempt as interviewer
      const resInterviewer = await inviteAdminAccount({
        email: testEmail,
        ownerUser: interviewerUser,
      });
      assert.equal(resInterviewer.success, false);
      assert.equal(resInterviewer.code, "FORBIDDEN");
    });

    it("rejects unauthenticated requests via Route Handlers (401 or 403)", async () => {
      // 1. Invite endpoint
      const reqInvite = new Request("http://localhost:3000/api/admin/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@itclub.org" }),
      });
      const resInvite = await postInviteAdmin(reqInvite);
      assert.ok(resInvite.status === 401 || resInvite.status === 403);

      // 2. Reissue endpoint
      const reqReissue = new Request("http://localhost:3000/api/admin/staff/reissue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "00000000-0000-0000-0000-000000000001" }),
      });
      const resReissue = await postReissueCredential(reqReissue);
      assert.ok(resReissue.status === 401 || resReissue.status === 403);

      // 3. Change password endpoint
      const reqChange = new Request("http://localhost:3000/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: "password", confirmPassword: "password" }),
      });
      const resChange = await postChangePassword(reqChange);
      assert.ok(resChange.status === 401 || resChange.status === 403);
    });

    it("verifies verifyStaffApiRequest rejects unauthenticated API calls", async () => {
      const auth = await verifyStaffApiRequest(undefined, ["owner", "admin"]);
      assert.equal(auth.authorized, false);
      assert.equal(auth.status, 401);
      assert.equal(auth.code, "UNAUTHORIZED");
    });
  });

  // --------------------------------------------------------------------------
  // 3. Admin Account Creation & Lifecycle Initialization
  // --------------------------------------------------------------------------
  describe("3. Account Provisioning & Role Safety", () => {
    it("allows Owner to invite an Admin, assigns strictly the 'admin' role, and sets 24-hr expiry", async () => {
      if (!serviceClient) return;

      const randomTag = Math.floor(100000 + Math.random() * 900000);
      const testEmail = `new.admin.${randomTag}@itclub.org`;
      createdEmails.push(testEmail);

      const result = await inviteAdminAccount({
        email: testEmail,
        ownerUser,
      });

      assert.ok(result.success, `Failed to invite admin: ${result.error}`);
      assert.ok(result.userId, "Must return created userId");
      createdAuthUserIds.push(result.userId!);

      assert.equal(result.email, testEmail);
      assert.equal(result.role, "admin", "Invited account must be assigned role 'admin'");
      assert.ok(result.temporaryPassword, "Must return temporary password only to Owner");
      assert.ok(result.expiresAt, "Must specify expiration timestamp");

      // Calculate expiry window: exactly ~24 hours
      const issued = new Date(result.issuedAt!).getTime();
      const expires = new Date(result.expiresAt!).getTime();
      const diffHours = (expires - issued) / (1000 * 60 * 60);
      assert.ok(Math.abs(diffHours - 24) < 0.1, "Expiration must be set to exactly 24 hours");

      // Verify public.staff_members row
      const { data: staffRow, error: staffErr } = await serviceClient
        .from("staff_members")
        .select("*")
        .eq("user_id", result.userId!)
        .single();

      assert.ok(!staffErr, `Failed to load staff_members: ${staffErr?.message}`);
      assert.equal(staffRow.role, "admin");
      assert.equal(staffRow.email, testEmail);
      assert.equal(staffRow.password_change_required, true);
      assert.ok(staffRow.temporary_password_issued_at);
      assert.ok(staffRow.temporary_password_expires_at);
      assert.equal(staffRow.password_changed_at, null);

      // Verify plaintext password NEVER appears in staff_members
      const rowJson = JSON.stringify(staffRow);
      assert.equal(
        rowJson.includes(result.temporaryPassword!),
        false,
        "Temporary password must NEVER be persisted in public.staff_members"
      );

      // Verify audit event was logged
      const { data: auditEvents } = await serviceClient
        .from("audit_events")
        .select("action, outcome, metadata")
        .eq("entity_reference", testEmail);

      assert.ok(auditEvents && auditEvents.length >= 1, "Audit event must be recorded");
      const accountCreatedEvent = auditEvents.find((e) => e.action === "ADMIN_ACCOUNT_CREATED");
      assert.ok(accountCreatedEvent, "Must record ADMIN_ACCOUNT_CREATED audit event");
      assert.equal(accountCreatedEvent.outcome, "SUCCESS");

      // Ensure no password in audit event metadata
      const auditJson = JSON.stringify(auditEvents);
      assert.equal(
        auditJson.includes(result.temporaryPassword!),
        false,
        "Temporary password must NEVER be persisted in audit_events metadata"
      );
    });

    it("prevents duplicate invitations for already enrolled staff members", async () => {
      if (!serviceClient) return;

      const randomTag = Math.floor(100000 + Math.random() * 900000);
      const testEmail = `duplicate.test.${randomTag}@itclub.org`;
      createdEmails.push(testEmail);

      // 1st Invitation
      const firstRes = await inviteAdminAccount({
        email: testEmail,
        ownerUser,
      });
      assert.ok(firstRes.success);
      createdAuthUserIds.push(firstRes.userId!);

      // 2nd Invitation with same email
      const secondRes = await inviteAdminAccount({
        email: testEmail,
        ownerUser,
      });

      assert.equal(secondRes.success, false);
      assert.equal(secondRes.code, "ACCOUNT_ALREADY_EXISTS");
    });
  });

  // --------------------------------------------------------------------------
  // 4. Password Change & Enforcement Lifecycle
  // --------------------------------------------------------------------------
  describe("4. First-Login Password Change Enforcement", () => {
    it("rejects weak or mismatched passwords", async () => {
      if (!serviceClient) return;

      const randomTag = Math.floor(100000 + Math.random() * 900000);
      const testEmail = `pwd.val.${randomTag}@itclub.org`;
      createdEmails.push(testEmail);

      const inv = await inviteAdminAccount({ email: testEmail, ownerUser });
      assert.ok(inv.success);
      createdAuthUserIds.push(inv.userId!);

      // Too short
      const shortRes = await changeStaffPassword({
        userId: inv.userId!,
        newPassword: "short",
        confirmPassword: "short",
      });
      assert.equal(shortRes.success, false);
      assert.equal(shortRes.code, "PASSWORD_TOO_SHORT");

      // Mismatch
      const mismatchRes = await changeStaffPassword({
        userId: inv.userId!,
        newPassword: "ValidPassword123!",
        confirmPassword: "DifferentPassword123!",
      });
      assert.equal(mismatchRes.success, false);
      assert.equal(mismatchRes.code, "PASSWORDS_DO_NOT_MATCH");
    });

    it("successfully changes password, clears database flag, and records audit event", async () => {
      if (!serviceClient) return;

      const randomTag = Math.floor(100000 + Math.random() * 900000);
      const testEmail = `pwd.success.${randomTag}@itclub.org`;
      createdEmails.push(testEmail);

      const inv = await inviteAdminAccount({ email: testEmail, ownerUser });
      assert.ok(inv.success);
      createdAuthUserIds.push(inv.userId!);

      // Execute password change
      const changeRes = await changeStaffPassword({
        userId: inv.userId!,
        newPassword: "BrandNewSecurePassword2026!",
        confirmPassword: "BrandNewSecurePassword2026!",
      });

      assert.ok(changeRes.success, `Change password failed: ${changeRes.error}`);

      // Verify DB record updated
      const { data: updatedStaff } = await serviceClient
        .from("staff_members")
        .select("*")
        .eq("user_id", inv.userId!)
        .single();

      assert.equal(updatedStaff.password_change_required, false);
      assert.ok(updatedStaff.password_changed_at);
      assert.equal(updatedStaff.temporary_password_expires_at, null);

      // Verify audit event
      const { data: auditEvents } = await serviceClient
        .from("audit_events")
        .select("action, outcome")
        .eq("entity_reference", testEmail)
        .eq("action", "STAFF_PASSWORD_CHANGED");

      assert.ok(auditEvents && auditEvents.length >= 1);
      assert.equal(auditEvents[0].outcome, "SUCCESS");
    });
  });

  // --------------------------------------------------------------------------
  // 5. Expiration & Reissue Workflow
  // --------------------------------------------------------------------------
  describe("5. Expiration Enforcement & Credential Reissue", () => {
    it("blocks password change when 24-hour credential has expired without deleting account", async () => {
      if (!serviceClient) return;

      const randomTag = Math.floor(100000 + Math.random() * 900000);
      const testEmail = `expired.admin.${randomTag}@itclub.org`;
      createdEmails.push(testEmail);

      const inv = await inviteAdminAccount({ email: testEmail, ownerUser });
      assert.ok(inv.success);
      createdAuthUserIds.push(inv.userId!);

      // Artificially expire the credential in DB (past date)
      const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      await serviceClient
        .from("staff_members")
        .update({ temporary_password_expires_at: pastDate })
        .eq("user_id", inv.userId!);

      // Verify expiration is detected
      const member = await getStaffMember(inv.userId!);
      assert.ok(member);
      const isExpired = Boolean(
        member.password_change_required &&
          member.temporary_password_expires_at &&
          new Date() > new Date(member.temporary_password_expires_at)
      );
      assert.equal(isExpired, true);

      // Attempt to change password with expired credential
      const changeRes = await changeStaffPassword({
        userId: inv.userId!,
        newPassword: "NewSecretPassword123!",
        confirmPassword: "NewSecretPassword123!",
      });

      assert.equal(changeRes.success, false);
      assert.equal(changeRes.code, "TEMPORARY_PASSWORD_EXPIRED");

      // Verify account still exists (was not deleted)
      const { data: checkAccount } = await serviceClient
        .from("staff_members")
        .select("user_id, password_change_required")
        .eq("user_id", inv.userId!)
        .maybeSingle();

      assert.ok(checkAccount, "Account must be preserved when temporary credential expires");
      assert.equal(checkAccount.password_change_required, true);

      // Verify audit trail logged rejection
      const { data: expiredAudit } = await serviceClient
        .from("audit_events")
        .select("action, outcome")
        .eq("entity_reference", testEmail)
        .eq("action", "EXPIRED_STAFF_CREDENTIAL_REJECTED");

      assert.ok(expiredAudit && expiredAudit.length >= 1, "Must log EXPIRED_STAFF_CREDENTIAL_REJECTED");
    });

    it("allows Owner to reissue a temporary credential, resetting the 24-hr window", async () => {
      if (!serviceClient) return;

      const randomTag = Math.floor(100000 + Math.random() * 900000);
      const testEmail = `reissue.test.${randomTag}@itclub.org`;
      createdEmails.push(testEmail);

      const inv = await inviteAdminAccount({ email: testEmail, ownerUser });
      assert.ok(inv.success);
      createdAuthUserIds.push(inv.userId!);

      // Artificially expire
      const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      await serviceClient
        .from("staff_members")
        .update({ temporary_password_expires_at: pastDate })
        .eq("user_id", inv.userId!);

      // Reissue credentials as Owner
      const reissueRes = await reissueAdminTemporaryPassword({
        targetUserId: inv.userId!,
        ownerUser,
      });

      assert.ok(reissueRes.success, `Reissue failed: ${reissueRes.error}`);
      assert.notEqual(reissueRes.temporaryPassword, inv.temporaryPassword, "Must generate a fresh password");

      // Check DB updated with new expiry in future
      const { data: reissuedStaff } = await serviceClient
        .from("staff_members")
        .select("temporary_password_expires_at, password_change_required")
        .eq("user_id", inv.userId!)
        .single();

      assert.ok(reissuedStaff, "reissuedStaff record must exist");
      const newExpiry = new Date(reissuedStaff.temporary_password_expires_at).getTime();
      assert.ok(newExpiry > Date.now(), "Expiration must be reset into the future");
      assert.equal(reissuedStaff.password_change_required, true);

      // Now change password succeeds
      const changeRes = await changeStaffPassword({
        userId: inv.userId!,
        newPassword: "AfterReissuePassword123!",
        confirmPassword: "AfterReissuePassword123!",
      });

      assert.ok(changeRes.success, `Password change should succeed after reissue: ${changeRes.error}`);
    });

    it("rejects reissuing credentials for an Owner account", async () => {
      const result = await reissueAdminTemporaryPassword({
        targetUserId: "b644118a-1099-422c-aa16-7e032659e055", // existing owner
        ownerUser,
      });

      assert.equal(result.success, false);
      assert.equal(result.code, "INVALID_TARGET_ROLE");
    });
  });

  // --------------------------------------------------------------------------
  // 6. Regression & Owner Integrity
  // --------------------------------------------------------------------------
  describe("6. Existing Owner Authentication & RLS Integrity", () => {
    it("verifies the primary Owner account is unaffected and password change is not required", async () => {
      if (!serviceClient) return;

      const { data: ownerRecord, error } = await serviceClient
        .from("staff_members")
        .select("*")
        .eq("role", "owner")
        .limit(1)
        .single();

      assert.ok(!error, "Owner record must exist");
      assert.equal(ownerRecord.role, "owner");
      assert.equal(
        ownerRecord.password_change_required,
        false,
        "Owner account must not have password_change_required flag set"
      );
    });
  });
});
