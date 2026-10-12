import { getServiceRoleClient } from "./service-role.ts";

export interface BootstrapStatus {
  initialized: boolean;
  ownerCount: number;
}

export interface BootstrapResult {
  success: boolean;
  reason?: "ALREADY_INITIALIZED" | "USER_NOT_FOUND" | "DATABASE_ERROR";
  message: string;
  userId?: string;
}

/**
 * Checks whether the initial Owner has already been bootstrapped.
 */
export async function checkBootstrapStatus(): Promise<BootstrapStatus> {
  const serviceClient = getServiceRoleClient();
  const { data, error } = await serviceClient
    .from("staff_members")
    .select("user_id")
    .eq("role", "owner");

  if (error) {
    throw new Error(`Failed to check bootstrap status: ${error.message}`);
  }

  const count = data?.length || 0;
  return {
    initialized: count > 0,
    ownerCount: count,
  };
}

/**
 * Performs the one-time bootstrap of the first Owner.
 * Refuses silently or explicitly if an Owner already exists in the system.
 */
export async function bootstrapFirstOwner(target: {
  userId?: string;
  email?: string;
}): Promise<BootstrapResult> {
  const status = await checkBootstrapStatus();
  if (status.initialized) {
    return {
      success: false,
      reason: "ALREADY_INITIALIZED",
      message:
        "One-time bootstrap locked: An Owner has already been established in IT Club Recruitment. Arbitrary promotion is forbidden.",
    };
  }

  const serviceClient = getServiceRoleClient();

  // Resolve user from Supabase Auth
  let authUserId: string | null = null;

  if (target.userId) {
    const { data: userRes, error: userErr } = await serviceClient.auth.admin.getUserById(target.userId);
    if (!userErr && userRes.user) {
      authUserId = userRes.user.id;
    }
  } else if (target.email) {
    const { data: listRes, error: listErr } = await serviceClient.auth.admin.listUsers();
    if (!listErr && listRes.users) {
      const match = listRes.users.find((u) => u.email?.toLowerCase() === target.email?.toLowerCase());
      if (match) {
        authUserId = match.id;
      }
    }
  }

  if (!authUserId) {
    return {
      success: false,
      reason: "USER_NOT_FOUND",
      message:
        "Target user was not found in Supabase Auth. The user account must be created in Supabase Auth before bootstrapping the Owner role.",
    };
  }

  // Insert Owner record
  const { error: insertErr } = await serviceClient.from("staff_members").insert({
    user_id: authUserId,
    role: "owner",
  });

  if (insertErr) {
    return {
      success: false,
      reason: "DATABASE_ERROR",
      message: `Failed to insert staff member record: ${insertErr.message}`,
    };
  }

  return {
    success: true,
    userId: authUserId,
    message: "Initial Owner successfully bootstrapped with full administrative authority.",
  };
}
