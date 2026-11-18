import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser, getCurrentStaff, type StaffContext } from "./server.ts";
import type { StaffRole } from "./roles.ts";
import { getStaffPasswordChangeUrl } from "./redirect.ts";

export interface PageGuardOptions {
  allowPendingPasswordChange?: boolean;
  loginPath?: "/interview/login" | "/interview/login?mode=content";
  returnTo?: string;
}

function unauthorizedLoginPath(loginPath: PageGuardOptions["loginPath"]): string {
  const path = loginPath || "/interview/login";
  return `${path}${path.includes("?") ? "&" : "?"}error=unauthorized`;
}

/**
 * Ensures an authenticated user exists in Server Components.
 * Redirects to the interview login if unauthenticated.
 */
export async function requireAuthenticatedUser(redirectTo = "/interview/login"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}

/**
 * Enforces staff role authorization on the server for page layouts and server pages.
 * Ensures the user is authenticated AND exists in public.staff_members with an allowed role.
 * Redirects to /login if unauthenticated, or redirects with error if unauthorized.
 * Enforces temporary password expiry and mandatory password changes on administrative pages.
 */
export async function requireStaffRole(
  allowedRoles: StaffRole[] = ["owner", "admin"],
  options?: PageGuardOptions
): Promise<StaffContext> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(options?.loginPath || "/interview/login");
  }

  const staff = await getCurrentStaff();
  if (!staff || !allowedRoles.includes(staff.role)) {
    redirect(unauthorizedLoginPath(options?.loginPath));
  }

  // Enforce password lifecycle unless explicitly allowed
  if (!options?.allowPendingPasswordChange && staff.passwordChangeRequired) {
    redirect(getStaffPasswordChangeUrl({
      verifiedRole: staff.role,
      returnTo: options?.returnTo,
      error: staff.isTempPasswordExpired ? "expired" : null,
    }));
  }

  return staff;
}

/**
 * Convenience helper requiring strictly the Owner role in Server Components.
 */
export async function requireOwner(options?: PageGuardOptions): Promise<StaffContext> {
  return requireStaffRole(["owner"], options);
}
