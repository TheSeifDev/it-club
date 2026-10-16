import { cookies } from "next/headers.js";
import type { User } from "@supabase/supabase-js";
import { createClient as createServerSupabaseClient } from "../../utils/supabase/server.ts";
import { getServiceRoleClient } from "./service-role.ts";
import type { ApplicationDetail } from "../admin/types.ts";
import { maskNationalId } from "../admin/transitions.ts";

export interface StudentContext {
  user: User;
  application: ApplicationDetail;
  activatedAt: string;
  passwordChangeRequired: boolean;
  tempPasswordIssuedAt: string | null;
  tempPasswordExpiresAt: string | null;
  passwordChangedAt: string | null;
  isTempPasswordExpired: boolean;
}

/**
 * Retrieves the authenticated student context by verifying the session
 * and the database-backed link in public.student_accounts and public.applications.
 * Does not trust client-supplied JWT claims or mutable metadata.
 */
export async function getCurrentStudent(): Promise<StudentContext | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerSupabaseClient(cookieStore);
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user || !user.email) {
      return null;
    }

    const serviceClient = getServiceRoleClient();

    // Query the mapping table to verify authorized linkage and password lifecycle
    const { data: account, error: accountErr } = await serviceClient
      .from("student_accounts")
      .select(
        "application_id, university_email, activated_at, password_change_required, temp_password_issued_at, temp_password_expires_at, password_changed_at"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (accountErr || !account) {
      return null;
    }

    // Verify the linked application exists and belongs to the authenticated applicant
    const { data: app, error: appErr } = await serviceClient
      .from("applications")
      .select("*")
      .eq("id", account.application_id)
      .maybeSingle();

    if (appErr || !app) {
      return null;
    }

    // Ensure university email matches between auth user and application
    if (app.university_email.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
      return null;
    }

    // Ensure application status permits student portal access
    if (!isStudentPortalAllowedStatus(app.status)) {
      return null;
    }

    const passwordChangeRequired = Boolean(account.password_change_required);
    const tempPasswordIssuedAt = account.temp_password_issued_at || null;
    const tempPasswordExpiresAt = account.temp_password_expires_at || null;
    const passwordChangedAt = account.password_changed_at || null;
    const isTempPasswordExpired = Boolean(
      passwordChangeRequired &&
      tempPasswordExpiresAt &&
      Date.now() > new Date(tempPasswordExpiresAt).getTime()
    );

    return {
      user,
      application: {
        ...app,
        national_id_masked: maskNationalId(app.national_id),
        student_account: {
          user_id: user.id,
          application_id: account.application_id,
          university_email: account.university_email,
          activated_at: account.activated_at,
          password_change_required: passwordChangeRequired,
          temp_password_issued_at: tempPasswordIssuedAt,
          temp_password_expires_at: tempPasswordExpiresAt,
          password_changed_at: passwordChangedAt,
        },
      },
      activatedAt: account.activated_at,
      passwordChangeRequired,
      tempPasswordIssuedAt,
      tempPasswordExpiresAt,
      passwordChangedAt,
      isTempPasswordExpired,
    };
  } catch {
    return null;
  }
}

export function isStudentPasswordChangeRequired(student: StudentContext): boolean {
  return student.passwordChangeRequired;
}

export function isStudentCredentialExpired(student: StudentContext): boolean {
  return student.isTempPasswordExpired;
}

/**
 * Statuses that permit an activated student to access their Student Dashboard.
 * Shortlisted, scheduled, interviewed, and accepted candidates have active self-service access.
 */
export const STUDENT_PORTAL_ALLOWED_STATUSES = [
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEWED",
  "ACCEPTED",
] as const;

export function isStudentPortalAllowedStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return (STUDENT_PORTAL_ALLOWED_STATUSES as readonly string[]).includes(status);
}

/**
 * Validates whether an application status is eligible for interview QR code and credential issuance.
 * Only ACCEPTED and INTERVIEW_SCHEDULED are approved for QR issuance.
 * PENDING_REVIEW, UNDER_REVIEW, NEEDS_CORRECTION, SHORTLISTED, REJECTED, and WAITLISTED are ineligible.
 */
export function isQrEligibleStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return status === "ACCEPTED" || status === "INTERVIEW_SCHEDULED";
}

