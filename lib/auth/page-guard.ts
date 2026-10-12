import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser, getStaffRole, type StaffContext } from "./server.ts";
import type { StaffRole } from "./roles.ts";

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
 */
export async function requireStaffRole(allowedRoles: StaffRole[] = ["owner", "admin"]): Promise<StaffContext> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const role = await getStaffRole(user.id);
  if (!role || !allowedRoles.includes(role)) {
    redirect("/login?error=unauthorized");
  }

  return { user, role };
}

/**
 * Convenience helper requiring strictly the Owner role in Server Components.
 */
export async function requireOwner(): Promise<StaffContext> {
  return requireStaffRole(["owner"]);
}
