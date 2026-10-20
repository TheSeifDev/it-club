/**
 * committee-access.ts
 *
 * Server-only committee-scoped authorization helper.
 * All authorization decisions are derived from trusted server-side data only —
 * never from browser-supplied values, query strings, or JWT user_metadata.
 *
 * Usage:
 *   import { getAuthorizedApplicationScope, requireApplicationCommitteeAccess }
 *     from "../../lib/auth/committee-access";
 */
import type { ApplicationDetail, ApplicationListItem } from "../admin/types.ts";
import type { CommitteeTrack } from "./roles.ts";
import { isCommitteeTrack } from "./roles.ts";
import { getCurrentStaff } from "./server.ts";
import { recordAuditEvent } from "../audit/service.ts";
import type { AuditActorRole } from "../audit/types.ts";

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface CommitteeScope {
  /** true = owner role with access to every committee */
  isOwner: boolean;
  /** The authoritative committee this staff member is assigned to, or null */
  committee: CommitteeTrack | null;
  actorId: string;
  actorEmail: string | null;
  actorRole: AuditActorRole;
}

export interface ApplicationScopeResult {
  /** null means "all applications" (owner) */
  committee: CommitteeTrack | null;
  isOwner: boolean;
}

export interface AccessCheckResult {
  allowed: boolean;
  /** HTTP status to return on denial: 403 by convention, sometimes 404 for privacy */
  status?: 403 | 404;
  error?: string;
  code?: string;
}

// ---------------------------------------------------------------------------
// Core scope resolver
// ---------------------------------------------------------------------------

/**
 * Resolves the current authenticated staff member's committee scope from
 * trusted server-side data. Returns null if the user is not authenticated
 * or not a recognized staff member.
 *
 * Never reads from headers, cookies values passed by the browser, or
 * client-supplied parameters.
 */
export async function getCurrentStaffCommittee(): Promise<CommitteeScope | null> {
  const ctx = await getCurrentStaff();
  if (!ctx) return null;

  const { staffMember, role } = ctx;
  if (!staffMember) return null;

  const isOwner = role === "owner";

  // Owner always gets unrestricted access regardless of committee field value
  if (isOwner) {
    return {
      isOwner: true,
      committee: null,
      actorId: ctx.user.id,
      actorEmail: ctx.user.email ?? null,
      actorRole: "owner",
    };
  }

  // For non-owner staff, use the DB-stored committee value
  const committee = staffMember.committee ?? null;
  const validatedCommittee =
    committee !== null && isCommitteeTrack(committee) ? committee : null;

  return {
    isOwner: false,
    committee: validatedCommittee,
    actorId: ctx.user.id,
    actorEmail: ctx.user.email ?? null,
    actorRole: role as AuditActorRole,
  };
}

// ---------------------------------------------------------------------------
// Application-level access checks
// ---------------------------------------------------------------------------

/**
 * Returns the scope that should be applied when querying applications.
 * Owners get null (no restriction). Non-owners get their committee (or null = denied).
 */
export async function getAuthorizedApplicationScope(): Promise<ApplicationScopeResult | null> {
  const scope = await getCurrentStaffCommittee();
  if (!scope) return null;

  return {
    committee: scope.committee,
    isOwner: scope.isOwner,
  };
}

/**
 * Checks whether the current staff member can access a specific application
 * based on its primary_track.
 *
 * Owner: always allowed.
 * Non-owner with valid committee: allowed if application.primary_track === committee.
 * Non-owner with no committee: always denied.
 */
export function canAccessApplication(
  scope: CommitteeScope,
  applicationOrTrack:
    | Pick<ApplicationDetail | ApplicationListItem, "primary_track">
    | CommitteeTrack
    | string
    | null
    | undefined
): boolean {
  if (scope.isOwner) return true;
  if (!scope.committee) return false;
  const track =
    typeof applicationOrTrack === "object" && applicationOrTrack !== null
      ? applicationOrTrack.primary_track
      : applicationOrTrack;
  return track === scope.committee;
}

/**
 * Pure authorization check for a specific application given an already-resolved CommitteeScope.
 * Useful for direct evaluations and test scenarios without SSR cookie contexts.
 */
export async function checkCommitteeAccess(
  scope: CommitteeScope | null,
  applicationRef: string | null,
  applicationTrack: string,
  operation: string
): Promise<AccessCheckResult> {
  if (!scope) {
    return {
      allowed: false,
      status: 403,
      error: "Authentication required.",
      code: "UNAUTHORIZED",
    };
  }

  if (scope.isOwner) {
    return { allowed: true };
  }

  // Validate the track from DB (not from caller)
  const normalizedTrack = isCommitteeTrack(applicationTrack) ? applicationTrack : null;

  if (!scope.committee) {
    // Staff has no committee assignment — deny and audit
    await recordDeniedAccess(scope, applicationRef, normalizedTrack, operation, "NO_COMMITTEE_ASSIGNED");
    return {
      allowed: false,
      status: 403,
      error: "Access denied: your account has no committee assignment.",
      code: "COMMITTEE_SCOPE_DENIED",
    };
  }

  if (normalizedTrack !== scope.committee) {
    // Committee mismatch — deny and audit
    await recordDeniedAccess(scope, applicationRef, normalizedTrack, operation, "COMMITTEE_SCOPE_DENIED");
    return {
      allowed: false,
      // Use 403 (not 404) — do not reveal record existence through error shape variation
      status: 403,
      error: "Access denied: this application belongs to a different committee.",
      code: "COMMITTEE_SCOPE_DENIED",
    };
  }

  return { allowed: true };
}

/**
 * Full authorization check for a specific application.
 * Resolves the scope, checks access, and records denied attempts in the audit log.
 *
 * Returns { allowed: true } for permitted access or
 * { allowed: false, status, error, code } for denied access.
 *
 * @param applicationRef - Application ID or reference (used only for audit logging, NOT for the access decision)
 * @param applicationTrack - primary_track value from the DB record (authoritative)
 * @param operation - Human-readable operation name for audit log
 */
export async function requireApplicationCommitteeAccess(
  applicationRef: string | null,
  applicationTrack: string,
  operation: string
): Promise<AccessCheckResult> {
  const scope = await getCurrentStaffCommittee();
  return checkCommitteeAccess(scope, applicationRef, applicationTrack, operation);
}

// ---------------------------------------------------------------------------
// Audit helper
// ---------------------------------------------------------------------------

async function recordDeniedAccess(
  scope: CommitteeScope,
  applicationRef: string | null,
  applicationTrack: string | null,
  operation: string,
  errorCategory: string
): Promise<void> {
  try {
    await recordAuditEvent({
      actor: {
        id: scope.actorId,
        email: scope.actorEmail,
        role: scope.actorRole,
      },
      action: "COMMITTEE_ACCESS_DENIED",
      entityType: "application",
      entityId: applicationRef || undefined,
      outcome: "FAILURE",
      errorCategory,
      metadata: {
        operation,
        actorCommittee: scope.committee ?? "NONE",
        applicationCommittee: applicationTrack ?? "UNKNOWN",
        // Do NOT include applicant name, email, national_id, or full payload
      },
    });
  } catch {
    // Audit write failure must never block the primary response
  }
}

// ---------------------------------------------------------------------------
// Scope-aware query builder helper
// ---------------------------------------------------------------------------

/**
 * Returns a Supabase-compatible filter constraint for scoping an applications
 * query to the authorized committee.
 *
 * Returns `{ column: "primary_track", value: committee }` for non-owners, or
 * `null` for owners (no restriction needed).
 *
 * The caller MUST Register this filter before executing the query.
 */
export function buildCommitteeFilter(
  scope: ApplicationScopeResult
): { column: "primary_track"; value: CommitteeTrack } | null {
  if (scope.isOwner) return null;
  if (!scope.committee) {
    // Caller should return empty results or 403 — this signals "no access"
    return null;
  }
  return { column: "primary_track", value: scope.committee };
}

