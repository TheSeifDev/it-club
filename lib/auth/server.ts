import { cookies } from "next/headers.js";
import type { User } from "@supabase/supabase-js";
import { createClient as createServerSupabaseClient } from "../../utils/supabase/server.ts";
import { getServiceRoleClient } from "./service-role.ts";
import type { StaffRole, StaffMember } from "./roles.ts";
import { isStaffRole } from "./roles.ts";

export interface StaffContext {
  user: User;
  role: StaffRole;
  staffMember?: StaffMember;
  passwordChangeRequired?: boolean;
  isTempPasswordExpired?: boolean;
}

/**
 * Returns the currently authenticated Supabase Auth user from SSR cookies, or null if unauthenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerSupabaseClient(cookieStore);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Retrieves the database-verified staff member record for a specific user ID using the trusted server client.
 * Does not trust client-supplied metadata or JWT user_metadata claims.
 */
export async function getStaffMember(userId: string): Promise<StaffMember | null> {
  try {
    const serviceClient = getServiceRoleClient();
    const { data, error } = await serviceClient
      .from("staff_members")
      .select("user_id, role, email, created_at, created_by, password_change_required, temporary_password_issued_at, temporary_password_expires_at, password_changed_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    if (!isStaffRole(data.role)) {
      return null;
    }

    return data as StaffMember;
  } catch {
    return null;
  }
}

/**
 * Retrieves the database-verified staff role for a specific user ID using the trusted server client.
 * Does not trust client-supplied metadata or JWT user_metadata claims.
 */
export async function getStaffRole(userId: string): Promise<StaffRole | null> {
  const member = await getStaffMember(userId);
  return member?.role ?? null;
}

/**
 * Returns both the authenticated user and their verified staff role/membership, or null if unauthenticated or not staff.
 */
export async function getCurrentStaff(): Promise<StaffContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const staffMember = await getStaffMember(user.id);
  if (!staffMember) return null;

  const passwordChangeRequired = Boolean(staffMember.password_change_required);
  const isTempPasswordExpired = Boolean(
    passwordChangeRequired &&
      staffMember.temporary_password_expires_at &&
      new Date() > new Date(staffMember.temporary_password_expires_at)
  );

  return {
    user,
    role: staffMember.role,
    staffMember,
    passwordChangeRequired,
    isTempPasswordExpired,
  };
}

export interface VerifyStaffApiOptions {
  allowPendingPasswordChange?: boolean;
}

/**
 * Verifies staff authorization for Route Handlers (API endpoints), returning appropriate status codes.
 * Enforces temporary password expiry and mandatory password change requirements by default.
 */
export async function verifyStaffApiRequest(
  _request?: Request,
  allowedRoles: StaffRole[] = ["owner", "admin"],
  options?: VerifyStaffApiOptions
): Promise<{
  authorized: boolean;
  status: 200 | 401 | 403;
  error?: string;
  code?: string;
  user?: User;
  role?: StaffRole;
  staffMember?: StaffMember;
  passwordChangeRequired?: boolean;
  isTempPasswordExpired?: boolean;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      authorized: false,
      status: 401,
      error: "Authentication required to access this resource.",
      code: "UNAUTHORIZED",
    };
  }

  const staffMember = await getStaffMember(user.id);
  if (!staffMember || !allowedRoles.includes(staffMember.role)) {
    return {
      authorized: false,
      status: 403,
      error: "Forbidden: You do not possess the required staff privileges.",
      code: "FORBIDDEN",
      user,
    };
  }

  const passwordChangeRequired = Boolean(staffMember.password_change_required);
  const isTempPasswordExpired = Boolean(
    passwordChangeRequired &&
      staffMember.temporary_password_expires_at &&
      new Date() > new Date(staffMember.temporary_password_expires_at)
  );

  // If password change is required, block access to normal APIs unless explicitly allowed
  if (!options?.allowPendingPasswordChange && passwordChangeRequired) {
    if (isTempPasswordExpired) {
      return {
        authorized: false,
        status: 403,
        error:
          "Your temporary administrative credential has expired (24-hour limit exceeded). Contact the IT Club Owner to reissue an invitation.",
        code: "TEMPORARY_PASSWORD_EXPIRED",
        user,
        role: staffMember.role,
        staffMember,
        passwordChangeRequired: true,
        isTempPasswordExpired: true,
      };
    }

    return {
      authorized: false,
      status: 403,
      error: "Password change is required before accessing administrative endpoints.",
      code: "PASSWORD_CHANGE_REQUIRED",
      user,
      role: staffMember.role,
      staffMember,
      passwordChangeRequired: true,
      isTempPasswordExpired: false,
    };
  }

  return {
    authorized: true,
    status: 200,
    user,
    role: staffMember.role,
    staffMember,
    passwordChangeRequired,
    isTempPasswordExpired,
  };
}
