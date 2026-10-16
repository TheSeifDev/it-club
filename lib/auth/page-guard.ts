import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser, getCurrentStaff, type StaffContext } from "./server.ts";
import type { StaffRole } from "./roles.ts";

export interface PageGuardOptions {
  allowPendingPasswordChange?: boolean;
}

/**
 * Ensures an authenticated user exists in Server Components.
 * Redirects to /login if unauthenticated.
 */
export async function requireAuthenticatedUser(redirectTo = "/login"): Promise<User> {
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
    redirect("/login");
  }

  const staff = await getCurrentStaff();
  if (!staff || !allowedRoles.includes(staff.role)) {
    redirect("/login?error=unauthorized");
  }

  // Enforce password lifecycle unless explicitly allowed
  if (!options?.allowPendingPasswordChange && staff.passwordChangeRequired) {
    if (staff.isTempPasswordExpired) {
      redirect("/admin/change-password?error=expired");
    }
    redirect("/admin/change-password");
  }

  return staff;
}

/**
 * Convenience helper requiring strictly the Owner role in Server Components.
 */
export async function requireOwner(options?: PageGuardOptions): Promise<StaffContext> {
  return requireStaffRole(["owner"], options);
}
