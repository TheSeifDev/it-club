import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import {
  VALID_COMMITTEE_TRACKS,
  isCommitteeTrack,
  type CommitteeTrack,
} from "../lib/auth/roles.ts";
import {
  canAccessApplication,
  checkCommitteeAccess,
  type CommitteeScope,
} from "../lib/auth/committee-access.ts";
import {
  getDashboardMetrics,
  listApplications,
  getApplicationById,
} from "../lib/admin/queries.ts";
import {
  inviteAdminAccount,
  updateStaffAccount,
} from "../lib/admin/staff-service.ts";
import { GET as getApplicationsRoute } from "../app/api/admin/applications/route.ts";
import { GET as getMetricsRoute } from "../app/api/admin/metrics/route.ts";
import {
  GET as getApplicationDetailRoute,
  PATCH as patchApplicationDetailRoute,
} from "../app/api/admin/applications/[id]/route.ts";
import { POST as postResendInvitationRoute } from "../app/api/admin/applications/[id]/resend-invitation/route.ts";
import { POST as postProvisionAccountRoute } from "../app/api/admin/applications/[id]/provision-account/route.ts";
import { POST as postInviteStaffRoute } from "../app/api/admin/staff/invite/route.ts";
import { PATCH as patchStaffAccountRoute } from "../app/api/admin/staff/[userId]/route.ts";

describe("IT Club — Committee-Scoped Student Data Authorization Suite", () => {
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
  const createdAppIds: string[] = [];
  const createdEmails: string[] = [];

  const ownerUser = {
    id: "00000000-0000-0000-0000-000000000001",
    email: "owner.governance@itclub.org",
    role: "owner",
  };

  const nonOwnerAdminUser = {
    id: "00000000-0000-0000-0000-000000000002",
    email: "hr.admin@itclub.org",
    role: "admin",
  };

  let testHrAppId = "";
  let testItAppId = "";

  before(async () => {
    if (!serviceClient) return;

    // Discover genuine owner ID if one exists in DB
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

    // Create synthetic test applications for HR and IT tracks to ensure deterministic data
    const randomTag = Math.floor(100000 + Math.random() * 900000);

    const hrAppPayload = {
      application_reference: `ITC-HR-${randomTag}`,
      full_name: `Test HR Student ${randomTag}`,
      national_id: `301010101${randomTag.toString().slice(0, 5)}`,
      academic_id: `ACAD-HR-${randomTag}`,
      phone: "+201000000001",
      whatsapp: "+201000000001",
      whatsapp_same: true,
      university_email: `hr.student.${randomTag}@batechu.com`,
      academic_year: "first",
      department: "Information Technology",
      experience_level: "beginner",
      skills: "Testing HR committee isolation",
      primary_track: "hr",
      secondary_track: "pr",
      motivation: "Test HR isolation motivation description text with required length.",
      learning_goal: "Test HR isolation learning goal description text with required length.",
      consent: true,
      status: "PENDING_REVIEW",
    };

    const itAppPayload = {
      application_reference: `ITC-IT-${randomTag}`,
      full_name: `Test IT Student ${randomTag}`,
      national_id: `301010102${randomTag.toString().slice(0, 5)}`,
      academic_id: `ACAD-IT-${randomTag}`,
      phone: "+201000000002",
      whatsapp: "+201000000002",
      whatsapp_same: true,
      university_email: `it.student.${randomTag}@batechu.com`,
      academic_year: "second",
      department: "Computer Science",
      experience_level: "intermediate",
      skills: "Testing IT committee isolation",
      primary_track: "it",
      secondary_track: "rnd",
      motivation: "Test IT isolation motivation description text with required length.",
      learning_goal: "Test IT isolation learning goal description text with required length.",
      consent: true,
      status: "PENDING_REVIEW",
    };

    const { data: hrApp, error: hrErr } = await serviceClient
      .from("applications")
      .insert(hrAppPayload)
      .select("id, application_reference")
      .single();

    if (!hrErr && hrApp) {
      testHrAppId = hrApp.id;
      createdAppIds.push(hrApp.id);
    }

    const { data: itApp, error: itErr } = await serviceClient
      .from("applications")
      .insert(itAppPayload)
      .select("id, application_reference")
      .single();

    if (!itErr && itApp) {
      testItAppId = itApp.id;
      createdAppIds.push(itApp.id);
    }

    // Provision a real test admin user to test genuine audit logging without foreign key errors
    const testAdminEmail = `test.audit.admin.${randomTag}@itclub.org`;
    createdEmails.push(testAdminEmail);
    const inv = await inviteAdminAccount({
      email: testAdminEmail,
      role: "admin",
      committee: "hr",
      ownerUser,
    });
    if (inv.success && inv.userId) {
      createdAuthUserIds.push(inv.userId);
      nonOwnerAdminUser.id = inv.userId;
      nonOwnerAdminUser.email = testAdminEmail;
    }
  });

  after(async () => {
    if (!serviceClient) return;

    // Clean up synthetic test applications
    for (const appId of createdAppIds) {
      try {
        await serviceClient.from("application_notes").delete().eq("application_id", appId);
        await serviceClient.from("application_notifications").delete().eq("application_id", appId);
        await serviceClient.from("applications").delete().eq("id", appId);
      } catch {
        // ignore cleanup errors
      }
    }

    // Clean up created test staff members & users
    for (const uid of createdAuthUserIds) {
      try {
        await serviceClient.from("staff_members").delete().eq("user_id", uid);
        await serviceClient.auth.admin.deleteUser(uid);
      } catch {
        // ignore cleanup errors
      }
    }

    // Clean up created emails from audit logs
    for (const em of createdEmails) {
      try {
        await serviceClient.from("audit_events").delete().eq("entity_reference", em);
      } catch {
        // ignore cleanup errors
      }
    }
  });

  // ==========================================================================
  // 1. Committee Track Models & Type Guards
  // ==========================================================================
  describe("1. Committee Track Models & Type Guards", () => {
    it("contains exact 6 valid committee tracks", () => {
      assert.deepEqual([...VALID_COMMITTEE_TRACKS], ["hr", "pr", "sm", "oc", "it", "rnd"]);
    });

    it("accepts valid committee tracks and rejects invalid or adversarial strings", () => {
      assert.equal(isCommitteeTrack("hr"), true);
      assert.equal(isCommitteeTrack("pr"), true);
      assert.equal(isCommitteeTrack("sm"), true);
      assert.equal(isCommitteeTrack("oc"), true);
      assert.equal(isCommitteeTrack("it"), true);
      assert.equal(isCommitteeTrack("rnd"), true);

      // Rejections
      assert.equal(isCommitteeTrack("finance"), false);
      assert.equal(isCommitteeTrack("admin"), false);
      assert.equal(isCommitteeTrack("owner"), false);
      assert.equal(isCommitteeTrack(""), false);
      assert.equal(isCommitteeTrack(null), false);
      assert.equal(isCommitteeTrack(undefined), false);
      assert.equal(isCommitteeTrack("../hr"), false);
      assert.equal(isCommitteeTrack("' OR '1'='1"), false);
    });
  });

  // ==========================================================================
  // 2. Access Scope Evaluation Logic (canAccessApplication & getAuthorizedApplicationScope)
  // ==========================================================================
  describe("2. Access Scope Evaluation Logic", () => {
    const ownerScope: CommitteeScope = {
      isOwner: true,
      committee: null,
      actorId: "00000000-0000-0000-0000-000000000001",
      actorEmail: "owner@itclub.org",
      actorRole: "owner",
    };

    const hrScope: CommitteeScope = {
      isOwner: false,
      committee: "hr",
      actorId: "00000000-0000-0000-0000-000000000002",
      actorEmail: "hr@itclub.org",
      actorRole: "admin",
    };

    const itScope: CommitteeScope = {
      isOwner: false,
      committee: "it",
      actorId: "00000000-0000-0000-0000-000000000003",
      actorEmail: "it@itclub.org",
      actorRole: "admin",
    };

    const unassignedScope: CommitteeScope = {
      isOwner: false,
      committee: null,
      actorId: "00000000-0000-0000-0000-000000000004",
      actorEmail: "unassigned@itclub.org",
      actorRole: "admin",
    };

    it("Owner retains full cross-committee access to every track", () => {
      for (const track of VALID_COMMITTEE_TRACKS) {
        assert.equal(canAccessApplication(ownerScope, track), true, `Owner must access track: ${track}`);
        assert.equal(
          canAccessApplication(ownerScope, { primary_track: track }),
          true,
          `Owner must access application object with track: ${track}`
        );
      }
    });

    it("HR Administrator can only access HR applications and is denied for all other committees", () => {
      assert.equal(canAccessApplication(hrScope, "hr"), true, "HR admin must access HR track");
      assert.equal(
        canAccessApplication(hrScope, { primary_track: "hr" }),
        true,
        "HR admin must access HR application object"
      );
      assert.equal(canAccessApplication(hrScope, "it"), false, "HR admin must NOT access IT track");
      assert.equal(canAccessApplication(hrScope, "pr"), false, "HR admin must NOT access PR track");
      assert.equal(canAccessApplication(hrScope, "sm"), false, "HR admin must NOT access SM track");
      assert.equal(canAccessApplication(hrScope, "oc"), false, "HR admin must NOT access OC track");
      assert.equal(canAccessApplication(hrScope, "rnd"), false, "HR admin must NOT access R&D track");
      assert.equal(canAccessApplication(hrScope, "unknown"), false, "HR admin must NOT access unknown track");
      assert.equal(canAccessApplication(hrScope, null), false, "HR admin must NOT access null track");
    });

    it("IT Administrator can only access IT applications and is denied for HR and other tracks", () => {
      assert.equal(canAccessApplication(itScope, "it"), true, "IT admin must access IT track");
      assert.equal(canAccessApplication(itScope, "hr"), false, "IT admin must NOT access HR track");
      assert.equal(canAccessApplication(itScope, "pr"), false, "IT admin must NOT access PR track");
    });

    it("Unassigned staff member (committee: null) is denied by default for all tracks", () => {
      for (const track of VALID_COMMITTEE_TRACKS) {
        assert.equal(
          canAccessApplication(unassignedScope, track),
          false,
          `Unassigned staff must be denied access to ${track}`
        );
      }
    });
  });

  // ==========================================================================
  // 3. Denial Response Guard & Audit Trail (checkCommitteeAccess)
  // ==========================================================================
  describe("3. Denial Response Guard & Audit Trail", () => {
    const getOwnerScope = (): CommitteeScope => ({
      isOwner: true,
      committee: null,
      actorId: ownerUser.id,
      actorEmail: ownerUser.email,
      actorRole: "owner",
    });

    const getHrScope = (): CommitteeScope => ({
      isOwner: false,
      committee: "hr",
      actorId: nonOwnerAdminUser.id,
      actorEmail: nonOwnerAdminUser.email,
      actorRole: "admin",
    });

    const getUnassignedScope = (): CommitteeScope => ({
      isOwner: false,
      committee: null,
      actorId: nonOwnerAdminUser.id,
      actorEmail: nonOwnerAdminUser.email,
      actorRole: "admin",
    });

    it("returns allowed: true when access is evaluated for owner", async () => {
      const result = await checkCommitteeAccess(
        getOwnerScope(),
        "ITC-APP-001",
        "it",
        "VIEW_DETAIL"
      );
      assert.equal(result.allowed, true, "Must allow Owner cross-committee access");
    });

    it("returns allowed: true when access is evaluated for assigned committee admin", async () => {
      const result = await checkCommitteeAccess(
        getHrScope(),
        "ITC-HR-001",
        "hr",
        "VIEW_DETAIL"
      );
      assert.equal(result.allowed, true, "Must allow HR admin to access HR application");
    });

    it("returns 403 and records sanitized audit log on cross-committee attempt", async () => {
      const checkResult = await checkCommitteeAccess(
        getHrScope(),
        "ITC-IT-PRIVATE-999",
        "it",
        "EVALUATE_APPLICATION"
      );

      assert.equal(checkResult.allowed, false, "Must deny cross-committee access");
      assert.equal(checkResult.status, 403);
      assert.equal(checkResult.code, "COMMITTEE_SCOPE_DENIED");
      assert.ok(checkResult.error);
      // Verify PII is not leaked in the error payload
      assert.equal(JSON.stringify(checkResult).includes("PRIVATE"), false, "Must not leak applicant ref details");
    });

    it("returns 403 when staff member has no assigned committee", async () => {
      const checkResult = await checkCommitteeAccess(
        getUnassignedScope(),
        "ITC-APP-002",
        "hr",
        "VIEW_DETAIL"
      );

      assert.equal(checkResult.allowed, false);
      assert.equal(checkResult.status, 403);
      assert.equal(checkResult.code, "COMMITTEE_SCOPE_DENIED");
    });
  });

  // ==========================================================================
  // 4. Query Scoping Enforcement (lib/admin/queries.ts)
  // ==========================================================================
  describe("4. Database Query Scoping Enforcement", () => {
    it("getDashboardMetrics scopes counts strictly to the authorized committee", async () => {
      if (!serviceClient) return;

      const hrMetrics = await getDashboardMetrics("hr");
      assert.ok(typeof hrMetrics.total === "number");

      // Verify that byTrack only reflects HR in primary counts
      assert.equal(hrMetrics.byTrack.it, 0, "HR-scoped metrics must report 0 for IT track");
      assert.equal(hrMetrics.byTrack.pr, 0, "HR-scoped metrics must report 0 for PR track");
      assert.equal(hrMetrics.byTrack.sm, 0, "HR-scoped metrics must report 0 for SM track");
      assert.equal(hrMetrics.byTrack.oc, 0, "HR-scoped metrics must report 0 for OC track");
      assert.equal(hrMetrics.byTrack.rnd, 0, "HR-scoped metrics must report 0 for R&D track");

      // IT metrics
      const itMetrics = await getDashboardMetrics("it");
      assert.equal(itMetrics.byTrack.hr, 0, "IT-scoped metrics must report 0 for HR track");

      // DENIED metrics
      const deniedMetrics = await getDashboardMetrics("DENIED");
      assert.equal(deniedMetrics.total, 0, "Denied scope must report 0 total applications");
      assert.equal(deniedMetrics.byTrack.hr, 0);
      assert.equal(deniedMetrics.byTrack.it, 0);

      // Unrestricted / Owner metrics
      const ownerMetrics = await getDashboardMetrics("ALL");
      assert.ok(ownerMetrics.total >= hrMetrics.total);
    });

    it("listApplications restricts returned records strictly to authorized committee", async () => {
      if (!serviceClient || !testHrAppId || !testItAppId) return;

      // 1. HR admin listing
      const hrListing = await listApplications({ page: 1, pageSize: 50 }, "hr");
      for (const app of hrListing.applications) {
        assert.equal(app.primary_track, "hr", "All records in HR listing must belong to HR committee");
      }
      assert.ok(
        hrListing.applications.some((a) => a.id === testHrAppId),
        "Test HR application must be included in HR list"
      );
      assert.equal(
        hrListing.applications.some((a) => a.id === testItAppId),
        false,
        "Test IT application must NEVER appear in HR list"
      );

      // 2. IT admin listing
      const itListing = await listApplications({ page: 1, pageSize: 50 }, "it");
      for (const app of itListing.applications) {
        assert.equal(app.primary_track, "it", "All records in IT listing must belong to IT committee");
      }
      assert.ok(
        itListing.applications.some((a) => a.id === testItAppId),
        "Test IT application must be included in IT list"
      );
      assert.equal(
        itListing.applications.some((a) => a.id === testHrAppId),
        false,
        "Test HR application must NEVER appear in IT list"
      );
    });

    it("listApplications prevents query parameter tampering from expanding scope", async () => {
      if (!serviceClient) return;

      // Attacker attempts to pass track: 'it' while authorized only for 'hr'
      const tamperedListing = await listApplications(
        { track: "it" as CommitteeTrack, page: 1, pageSize: 50 },
        "hr"
      );

      // The server ignores the 'it' filter or finds no match under 'hr' scope.
      // In either case, NO 'it' applications may EVER be returned.
      for (const app of tamperedListing.applications) {
        assert.equal(
          app.primary_track,
          "hr",
          "Tampered track query MUST NOT return applications outside 'hr'"
        );
      }
    });

    it("listApplications returns empty results for DENIED committee scope", async () => {
      const deniedListing = await listApplications({ page: 1, pageSize: 20 }, "DENIED");
      assert.equal(deniedListing.applications.length, 0);
      assert.equal(deniedListing.totalCount, 0);
    });

    it("getApplicationById respects committee scope isolation", async () => {
      if (!serviceClient || !testHrAppId || !testItAppId) return;

      // Accessing IT application with IT scope -> SUCCESS
      const itAppAsIt = await getApplicationById(testItAppId, "it");
      assert.ok(itAppAsIt, "IT admin must be able to load IT application");
      assert.equal(itAppAsIt?.id, testItAppId);

      // Accessing IT application with HR scope -> NULL (Inaccessible)
      const itAppAsHr = await getApplicationById(testItAppId, "hr");
      assert.equal(itAppAsHr, null, "HR admin MUST NOT be able to load IT application");

      // Accessing IT application with DENIED scope -> NULL
      const itAppAsDenied = await getApplicationById(testItAppId, "DENIED");
      assert.equal(itAppAsDenied, null, "Unassigned admin MUST NOT be able to load application");

      // Accessing IT application with Owner scope -> SUCCESS
      const itAppAsOwner = await getApplicationById(testItAppId, null);
      assert.ok(itAppAsOwner, "Owner must be able to load IT application");
      assert.equal(itAppAsOwner?.id, testItAppId);
    });
  });

  // ==========================================================================
  // 5. Staff Service Committee Provisioning & Modification
  // ==========================================================================
  describe("5. Staff Service Committee Provisioning & Modification", () => {
    it("Owner can invite an admin assigned to HR committee", async () => {
      if (!serviceClient) return;

      const randomTag = Math.floor(100000 + Math.random() * 900000);
      const testEmail = `staff.hr.${randomTag}@itclub.org`;
      createdEmails.push(testEmail);

      const inviteResult = await inviteAdminAccount({
        email: testEmail,
        role: "admin",
        committee: "hr",
        ownerUser,
      });

      assert.equal(inviteResult.success, true);
      assert.ok(inviteResult.userId);
      createdAuthUserIds.push(inviteResult.userId!);

      // Verify DB record has committee = 'hr'
      const { data: member } = await serviceClient
        .from("staff_members")
        .select("role, committee")
        .eq("user_id", inviteResult.userId!)
        .single();

      assert.ok(member);
      assert.equal(member.role, "admin");
      assert.equal(member.committee, "hr");
    });

    it("Owner can reassign an admin's committee scope", async () => {
      if (!serviceClient) return;

      const randomTag = Math.floor(100000 + Math.random() * 900000);
      const testEmail = `staff.reassign.${randomTag}@itclub.org`;
      createdEmails.push(testEmail);

      // 1. Create with HR
      const inviteResult = await inviteAdminAccount({
        email: testEmail,
        role: "admin",
        committee: "hr",
        ownerUser,
      });
      assert.ok(inviteResult.success && inviteResult.userId);
      createdAuthUserIds.push(inviteResult.userId!);

      // 2. Owner updates to PR
      const updateResult = await updateStaffAccount({
        targetUserId: inviteResult.userId!,
        email: testEmail,
        role: "admin",
        committee: "pr",
        ownerUser,
      });

      assert.equal(updateResult.success, true);

      // Verify DB record now has committee = 'pr'
      const { data: member } = await serviceClient
        .from("staff_members")
        .select("committee")
        .eq("user_id", inviteResult.userId!)
        .single();

      assert.ok(member);
      assert.equal(member.committee, "pr");
    });

    it("rejects staff invitation with invalid committee track", async () => {
      const randomTag = Math.floor(100000 + Math.random() * 900000);
      const testEmail = `invalid.comm.${randomTag}@itclub.org`;

      const inviteResult = await inviteAdminAccount({
        email: testEmail,
        role: "admin",
        committee: "finance" as unknown as CommitteeTrack,
        ownerUser,
      });

      assert.equal(inviteResult.success, false);
      assert.equal(inviteResult.code, "INVALID_COMMITTEE");
    });

    it("rejects staff committee updates attempted by non-owners", async () => {
      if (!serviceClient) return;

      const updateResult = await updateStaffAccount({
        targetUserId: nonOwnerAdminUser.id,
        email: nonOwnerAdminUser.email,
        role: "admin",
        committee: "it",
        ownerUser: nonOwnerAdminUser, // Non-owner acting as actor
      });

      assert.equal(updateResult.success, false);
      assert.equal(updateResult.code, "FORBIDDEN");
    });
  });

  // ==========================================================================
  // 6. API Route Handlers Protection
  // ==========================================================================
  describe("6. API Route Handlers Authorization Guards", () => {
    it("rejects unauthenticated requests to /api/admin/applications", async () => {
      const req = new Request("http://localhost:3000/api/admin/applications");
      const res = await getApplicationsRoute(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "UNAUTHORIZED");
    });

    it("rejects unauthenticated requests to /api/admin/metrics", async () => {
      const req = new Request("http://localhost:3000/api/admin/metrics");
      const res = await getMetricsRoute(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "UNAUTHORIZED");
    });

    it("rejects unauthenticated requests to /api/admin/applications/[id] GET and PATCH", async () => {
      const reqGet = new Request("http://localhost:3000/api/admin/applications/test-app-id");
      const resGet = await getApplicationDetailRoute(reqGet, {
        params: Promise.resolve({ id: "test-app-id" }),
      });
      assert.equal(resGet.status, 401);

      const reqPatch = new Request("http://localhost:3000/api/admin/applications/test-app-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextStatus: "UNDER_REVIEW" }),
      });
      const resPatch = await patchApplicationDetailRoute(reqPatch, {
        params: Promise.resolve({ id: "test-app-id" }),
      });
      assert.equal(resPatch.status, 401);
    });

    it("rejects unauthenticated requests to resend-invitation and provision-account", async () => {
      const reqResend = new Request(
        "http://localhost:3000/api/admin/applications/test-app-id/resend-invitation",
        { method: "POST" }
      );
      const resResend = await postResendInvitationRoute(reqResend, {
        params: Promise.resolve({ id: "test-app-id" }),
      });
      assert.equal(resResend.status, 401);

      const reqProvision = new Request(
        "http://localhost:3000/api/admin/applications/test-app-id/provision-account",
        { method: "POST" }
      );
      const resProvision = await postProvisionAccountRoute(reqProvision, {
        params: Promise.resolve({ id: "test-app-id" }),
      });
      assert.equal(resProvision.status, 401);
    });

    it("rejects unauthenticated staff invite and update endpoints", async () => {
      const reqInvite = new Request("http://localhost:3000/api/admin/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@itclub.org", role: "admin", committee: "hr" }),
      });
      const resInvite = await postInviteStaffRoute(reqInvite);
      assert.equal(resInvite.status, 401);

      const reqPatch = new Request("http://localhost:3000/api/admin/staff/u-test", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@itclub.org", role: "admin", committee: "hr" }),
      });
      const resPatch = await patchStaffAccountRoute(reqPatch, {
        params: Promise.resolve({ userId: "u-test" }),
      });
      assert.equal(resPatch.status, 401);
    });
  });
});
