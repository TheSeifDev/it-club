import { canStaffAccessCommittee, type CommitteeTrack, type StaffRole } from "../auth/roles.ts";
import { getServiceRoleClient } from "../auth/service-role.ts";
import { hasSupabaseServiceRoleConfig } from "../../utils/supabase/config.ts";

export type EvaluationTargetFacts = {
  role: StaffRole;
  assignedCommittee: string | null | undefined;
  applicationPrimaryTrack: string | null | undefined;
  applicationStatus: string | null | undefined;
  qrStatus: string | null | undefined;
  checkedInAt: string | null | undefined;
  qrExpiresAt: string | null | undefined;
  now?: number;
};

export type EvaluationAuthorization =
  | { allowed: true }
  | { allowed: false; status: 403 | 404 | 409 | 503; code: string; error: string };

const EVALUATION_ALLOWED_STATUSES = new Set(["SHORTLISTED", "INTERVIEW_SCHEDULED", "ACCEPTED"]);

/** Pure branch logic shared by the Route Handler and isolated unit tests. */
export function authorizeEvaluationTarget(facts: EvaluationTargetFacts): EvaluationAuthorization {
  if (!canStaffAccessCommittee(facts.role, facts.assignedCommittee, facts.applicationPrimaryTrack)) {
    return {
      allowed: false,
      status: 403,
      code: "COMMITTEE_SCOPE_DENIED",
      error: "Access denied: this application is outside your assigned committee.",
    };
  }

  if (!facts.applicationStatus || !EVALUATION_ALLOWED_STATUSES.has(facts.applicationStatus)) {
    return {
      allowed: false,
      status: 409,
      code: "INELIGIBLE_STATUS",
      error: "This application is not currently eligible for interview evaluation.",
    };
  }

  if (facts.qrStatus !== "CHECKED_IN" || !facts.checkedInAt) {
    return {
      allowed: false,
      status: 409,
      code: "CHECK_IN_REQUIRED",
      error: "Candidate must be checked in before an interview evaluation can be saved.",
    };
  }

  const expiresAt = facts.qrExpiresAt ? Date.parse(facts.qrExpiresAt) : Number.NaN;
  if (!Number.isFinite(expiresAt) || expiresAt <= (facts.now ?? Date.now())) {
    return {
      allowed: false,
      status: 409,
      code: "EXPIRED_TOKEN",
      error: "The interview check-in credential has expired.",
    };
  }

  return { allowed: true };
}

export async function verifyEvaluationTarget(input: {
  applicationId: string;
  role: StaffRole;
  assignedCommittee: CommitteeTrack | null | undefined;
}): Promise<EvaluationAuthorization> {
  if (!hasSupabaseServiceRoleConfig()) {
    return {
      allowed: false,
      status: 503,
      code: "CONFIG_UNAVAILABLE",
      error: "Interview evaluation is unavailable because the database service is not configured.",
    };
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.applicationId)) {
    return {
      allowed: false,
      status: 404,
      code: "APPLICATION_NOT_FOUND",
      error: "Application not found.",
    };
  }

  try {
    const service = getServiceRoleClient();
    const { data: application, error: applicationError } = await service
      .from("applications")
      .select("id, status, primary_track")
      .eq("id", input.applicationId)
      .maybeSingle();

    if (applicationError) {
      return {
        allowed: false,
        status: 503,
        code: "DATABASE_UNAVAILABLE",
        error: "Could not verify application eligibility for interview evaluation.",
      };
    }
    if (!application) {
      return {
        allowed: false,
        status: 404,
        code: "APPLICATION_NOT_FOUND",
        error: "Application not found.",
      };
    }

    const { data: qrToken, error: qrError } = await service
      .from("interview_qr_tokens")
      .select("status, checked_in_at, expires_at")
      .eq("application_id", input.applicationId)
      .maybeSingle();

    if (qrError) {
      return {
        allowed: false,
        status: 503,
        code: "DATABASE_UNAVAILABLE",
        error: "Could not verify interview check-in status.",
      };
    }

    return authorizeEvaluationTarget({
      role: input.role,
      assignedCommittee: input.assignedCommittee,
      applicationPrimaryTrack: application.primary_track,
      applicationStatus: application.status,
      qrStatus: qrToken?.status,
      checkedInAt: qrToken?.checked_in_at,
      qrExpiresAt: qrToken?.expires_at,
    });
  } catch {
    return {
      allowed: false,
      status: 503,
      code: "DATABASE_UNAVAILABLE",
      error: "Could not verify interview evaluation authorization.",
    };
  }
}
