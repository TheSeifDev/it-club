import { cookies } from "next/headers.js";
import type { User } from "@supabase/supabase-js";
import { createClient as createServerSupabaseClient } from "../../utils/supabase/server.ts";
import { getServiceRoleClient } from "./service-role.ts";
import type { StaffRole } from "./roles.ts";

export interface StaffContext {
  user: User;
  role: StaffRole;
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
 * Retrieves the database-verified staff role for a specific user ID using the trusted server client.
 * Does not trust client-supplied metadata or JWT user_metadata claims.
 */
export async function getStaffRole(userId: string): Promise<StaffRole | null> {
  try {
    const serviceClient = getServiceRoleClient();
    const { data, error } = await serviceClient
      .from("staff_members")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    if (data.role === "owner" || data.role === "admin") {
      return data.role;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Returns both the authenticated user and their verified staff role, or null if unauthenticated or not staff.
 */
export async function getCurrentStaff(): Promise<StaffContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const role = await getStaffRole(user.id);
  if (!role) return null;

  return { user, role };
}

/**
 * Verifies staff authorization for Route Handlers (API endpoints), returning appropriate status codes.
 */
export async function verifyStaffApiRequest(
  _request?: Request,
  allowedRoles: StaffRole[] = ["owner", "admin"]
): Promise<{
  authorized: boolean;
  status: 200 | 401 | 403;
  error?: string;
  code?: string;
  user?: User;
  role?: StaffRole;
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

  const role = await getStaffRole(user.id);
  if (!role || !allowedRoles.includes(role)) {
    return {
      authorized: false,
      status: 403,
      error: "Forbidden: You do not possess the required staff privileges.",
      code: "FORBIDDEN",
      user,
    };
  }

  return {
    authorized: true,
    status: 200,
    user,
    role,
  };
}
