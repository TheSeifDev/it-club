import { cookies } from "next/headers.js";
import type { User } from "@supabase/supabase-js";
import { createClient as createServerSupabaseClient } from "../../utils/supabase/server.ts";
import { getServiceRoleClient } from "./service-role.ts";
import { projectStudentApplication, type StudentApplicationView } from "./student-projection.ts";

export interface StudentContext {
  user: User;
  application: StudentApplicationView;
  activatedAt: string;
  passwordChangeRequired: boolean;
  tempPasswordIssuedAt: string | null;
  tempPasswordExpiresAt: string | null;
  passwordChangedAt: string | null;
  isTempPasswordExpired: boolean;
}

export type StudentCredentialState = Pick<
  StudentContext,
  "passwordChangeRequired" | "isTempPasswordExpired"
>;

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
      .select(
        "id, application_reference, full_name, national_id, academic_id, phone, whatsapp, university_email, google_email, academic_year, department, experience_level, skills, experience_details, volunteer_experience, primary_track, secondary_track, motivation, learning_goal, contribution, availability, status, interview_date, interview_time, interview_location, activated_at, consented_at, created_at"
      )
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
      application: projectStudentApplication(app),
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

export function isStudentPasswordChangeRequired(student: StudentCredentialState): boolean {
  return student.passwordChangeRequired;
}

export function isStudentCredentialExpired(student: StudentCredentialState): boolean {
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
 * SHORTLISTED, ACCEPTED, and INTERVIEW_SCHEDULED are approved for QR issuance.
 * PENDING_REVIEW, UNDER_REVIEW, NEEDS_CORRECTION, REJECTED, and WAITLISTED are ineligible.
 */
export function isQrEligibleStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return (
    status === "SHORTLISTED" ||
    status === "INTERVIEW_SCHEDULED" ||
    status === "ACCEPTED"
  );
}
