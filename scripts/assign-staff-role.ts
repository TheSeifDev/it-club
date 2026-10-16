import { getServiceRoleClient } from "../lib/auth/service-role.ts";
import { recordAuditEvent } from "../lib/audit/service.ts";
import { isStaffRole, type StaffRole } from "../lib/auth/roles.ts";

async function main() {
  const args = process.argv.slice(2);
  const identifier = args[0];
  const requestedRole = args[1]?.toLowerCase() as StaffRole | undefined;

  if (!identifier || identifier === "--help" || identifier === "-h" || !requestedRole) {
    console.log(`
IT Club — Staff Role Assignment Tool (Owner-Clearance)
======================================================
Usage:
  node --env-file=.env.local --experimental-strip-types scripts/assign-staff-role.ts <EMAIL_OR_USER_UUID> <ROLE>

Allowed Roles:
  - interviewer   Least-privilege scanner & candidate evaluation access
  - admin         Full applicant review & interview scheduling access
  - owner         Supervisory governance, system settings & audit access

Prerequisites:
  1. The staff member's account must first exist in Supabase Auth
     (Create user in Supabase Dashboard -> Authentication -> Users).
  2. The account email must be verified.

Security Notice:
  - Role assignments are recorded in public.audit_events.
  - No credentials or passwords are ever transmitted or logged.
`);
    process.exit(identifier && requestedRole ? 1 : 0);
  }

  if (!isStaffRole(requestedRole)) {
    console.error(`[ERROR] Invalid role '${requestedRole}'. Allowed roles: 'interviewer', 'admin', 'owner'`);
    process.exit(1);
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  const serviceClient = getServiceRoleClient();

  // 1. Resolve user in Supabase Auth
  let authUserId: string | null = null;
  let userEmail: string | null = null;

  if (isUuid) {
    const { data: userRes, error: userErr } = await serviceClient.auth.admin.getUserById(identifier);
    if (!userErr && userRes.user) {
      authUserId = userRes.user.id;
      userEmail = userRes.user.email || null;
    }
  } else {
    const { data: listRes, error: listErr } = await serviceClient.auth.admin.listUsers();
    if (!listErr && listRes.users) {
      const match = listRes.users.find((u) => u.email?.toLowerCase() === identifier.toLowerCase());
      if (match) {
        authUserId = match.id;
        userEmail = match.email || null;
      }
    }
  }

  if (!authUserId) {
    console.error(
      `[ERROR] User '${identifier}' was not found in Supabase Auth.\n` +
      `Please create the staff user account in the Supabase Dashboard first before assigning a role.`
    );
    process.exit(1);
  }

  // 2. Check existing staff record
  const { data: existingStaff } = await serviceClient
    .from("staff_members")
    .select("role")
    .eq("user_id", authUserId)
    .maybeSingle();

  const previousRole = existingStaff?.role || null;

  if (previousRole === requestedRole) {
    console.log(`[NOTICE] User '${userEmail || authUserId}' already possesses the '${requestedRole}' role. No change required.`);
    process.exit(0);
  }

  // 3. Upsert role in public.staff_members
  const now = new Date().toISOString();
  if (existingStaff) {
    const { error: updateErr } = await serviceClient
      .from("staff_members")
      .update({ role: requestedRole })
      .eq("user_id", authUserId);

    if (updateErr) {
      console.error(`[ERROR] Failed to update staff role: ${updateErr.message}`);
      process.exit(1);
    }
  } else {
    const { error: insertErr } = await serviceClient
      .from("staff_members")
      .insert({
        user_id: authUserId,
        role: requestedRole,
        created_at: now,
      });

    if (insertErr) {
      console.error(`[ERROR] Failed to insert staff role: ${insertErr.message}`);
      process.exit(1);
    }
  }

  // 4. Record audit event
  await recordAuditEvent({
    actor: { role: "owner" },
    action: "STAFF_ROLE_ASSIGNED",
    entityType: "staff_member",
    entityId: authUserId,
    entityReference: userEmail || authUserId,
    previousStatus: previousRole,
    newStatus: requestedRole,
    metadata: {
      targetEmail: userEmail,
      assignedRole: requestedRole,
    },
    outcome: "SUCCESS",
  });

  console.log(`[SUCCESS] Staff role '${requestedRole}' successfully assigned to '${userEmail || authUserId}' (UUID: ${authUserId}).`);
}

main().catch((err) => {
  console.error("[FATAL]", err instanceof Error ? err.message : "Unknown error");
  process.exit(1);
});
