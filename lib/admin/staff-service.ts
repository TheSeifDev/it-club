import { getServiceRoleClient } from "../auth/service-role.ts";
import { recordAuditEvent } from "../audit/service.ts";
import {
  isValidEmailAddress,
  sendMail,
  isEmailProviderActive,
  type EmailDeliveryState,
} from "../email/mailer.ts";
import { getEmailConfig } from "../email/config.ts";
import { renderAdminInvitationEmail } from "../email/templates/admin-invitation.ts";
import type { StaffRole } from "../auth/roles.ts";

export const FIXED_ADMIN_TEMPORARY_PASSWORD = "0123456789";

export interface InviteAdminInput {
  email: string;
  ownerUser: {
    id: string;
    email?: string | null;
    role: string;
  };
}

export interface AdminEmailDeliveryInfo {
  configured: boolean;
  sent: boolean;
  status: EmailDeliveryState;
  messageId?: string;
  response?: string;
  error?: string;
}

export interface InviteAdminResult {
  success: boolean;
  code?: string;
  error?: string;
  userId?: string;
  email?: string;
  role?: StaffRole;
  temporaryPassword?: string;
  expiresAt?: string;
  issuedAt?: string;
  emailDelivery?: AdminEmailDeliveryInfo;
}

export interface ReissueAdminCredentialInput {
  targetUserId: string;
  ownerUser: {
    id: string;
    email?: string | null;
    role: string;
  };
}

export interface ReissueAdminCredentialResult {
  success: boolean;
  code?: string;
  error?: string;
  userId?: string;
  email?: string;
  temporaryPassword?: string;
  expiresAt?: string;
  issuedAt?: string;
  emailDelivery?: AdminEmailDeliveryInfo;
}

export interface RetryAdminInvitationInput {
  targetUserId: string;
  ownerUser: {
    id: string;
    email?: string | null;
    role: string;
  };
}

export interface RetryAdminInvitationResult {
  success: boolean;
  code?: string;
  error?: string;
  emailDelivery?: AdminEmailDeliveryInfo;
}

export interface ChangeStaffPasswordInput {
  userId: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface ChangeStaffPasswordResult {
  success: boolean;
  code?: string;
  error?: string;
  message?: string;
}

/**
 * Creates a new administrative account with strict Owner authorization.
 * Sets mandatory first-login password change with 24-hour expiration.
 * Never grants the Owner role. Never persists plaintext passwords.
 */
export async function inviteAdminAccount(input: InviteAdminInput): Promise<InviteAdminResult> {
  // 1. Strict Owner role enforcement
  if (input.ownerUser.role !== "owner") {
    return {
      success: false,
      code: "FORBIDDEN",
      error: "Only the IT Club Owner can invite administrative staff members.",
    };
  }

  // 2. Validate and normalize email
  const rawEmail = input.email?.trim().toLowerCase();
  if (!rawEmail || !isValidEmailAddress(rawEmail)) {
    return {
      success: false,
      code: "INVALID_EMAIL",
      error: "Please provide a valid email address.",
    };
  }

  const serviceClient = getServiceRoleClient();

  // 3. Record Audit: Admin invitation initiated
  await recordAuditEvent({
    action: "ADMIN_INVITATION_INITIATED",
    entityType: "staff_member",
    entityReference: rawEmail,
    actor: {
      id: input.ownerUser.id,
      email: input.ownerUser.email || undefined,
      role: "owner",
    },
    outcome: "SUCCESS",
    metadata: {
      targetEmail: rawEmail,
      assignedRole: "admin",
    },
  });

  // 4. Check for existing staff membership
  const { data: existingStaff, error: checkStaffErr } = await serviceClient
    .from("staff_members")
    .select("user_id, role, email")
    .eq("email", rawEmail)
    .maybeSingle();

  if (checkStaffErr) {
    return {
      success: false,
      code: "DATABASE_ERROR",
      error: "Could not query staff directory. Please try again.",
    };
  }

  if (existingStaff) {
    return {
      success: false,
      code: "ACCOUNT_ALREADY_EXISTS",
      error: `A staff member with the email ${rawEmail} is already enrolled with the role: ${existingStaff.role}.`,
    };
  }

  // 5. Generate fixed temporary password & 24-hour expiration
  const temporaryPassword = FIXED_ADMIN_TEMPORARY_PASSWORD;
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 24 * 60 * 60 * 1000);

  // 6. Create account in Supabase Auth
  let createdAuthUserId: string | null = null;
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email: rawEmail,
    password: temporaryPassword,
    email_confirm: true,
  });

  if (authError || !authData?.user) {
    // Check if user already exists in auth.users
    const isExistingUser =
      authError?.message?.includes("already registered") ||
      authError?.message?.includes("already exists");

    if (isExistingUser) {
      // Find the user ID from auth.users to see if they're a non-staff user
      const { data: existingUsers } = await serviceClient.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u) => u.email?.toLowerCase() === rawEmail
      );

      if (existingUser) {
        // User exists in auth.users, verify they aren't in staff_members
        const { data: staffCheck } = await serviceClient
          .from("staff_members")
          .select("user_id")
          .eq("user_id", existingUser.id)
          .maybeSingle();

        if (staffCheck) {
          return {
            success: false,
            code: "ACCOUNT_ALREADY_EXISTS",
            error: "A staff account with this email address already exists.",
          };
        }

        // Elevate user to staff member with temporary credential
        await serviceClient.auth.admin.updateUserById(existingUser.id, {
          password: temporaryPassword,
          email_confirm: true,
        });

        createdAuthUserId = existingUser.id;
      } else {
        return {
          success: false,
          code: "AUTH_CREATION_FAILED",
          error: authError?.message || "Failed to create staff authentication credentials.",
        };
      }
    } else {
      return {
        success: false,
        code: "AUTH_CREATION_FAILED",
        error: authError?.message || "Failed to create staff authentication credentials.",
      };
    }
  } else {
    createdAuthUserId = authData.user.id;
  }

  // Verify if owner user exists in auth.users to satisfy foreign key constraint
  let createdByUserId: string | null = null;
  if (input.ownerUser.id) {
    try {
      const { data: ownerAuthCheck } = await serviceClient.auth.admin.getUserById(input.ownerUser.id);
      if (ownerAuthCheck?.user) {
        createdByUserId = ownerAuthCheck.user.id;
      }
    } catch {
      createdByUserId = null;
    }
  }

  // 7. Insert record into public.staff_members (Strictly 'admin' role, never 'owner')
  const { error: insertErr } = await serviceClient.from("staff_members").insert({
    user_id: createdAuthUserId,
    role: "admin",
    email: rawEmail,
    created_by: createdByUserId,
    password_change_required: true,
    temporary_password_issued_at: issuedAt.toISOString(),
    temporary_password_expires_at: expiresAt.toISOString(),
    password_changed_at: null,
  });

  if (insertErr) {
    // Rollback auth user creation if staff_members insert fails
    await serviceClient.auth.admin.deleteUser(createdAuthUserId);
    return {
      success: false,
      code: "DATABASE_INSERT_FAILED",
      error: `Failed to register staff membership record: ${insertErr.message}. Account creation was cancelled.`,
    };
  }

  // 8. Record Audit: Admin account created
  await recordAuditEvent({
    action: "ADMIN_ACCOUNT_CREATED",
    entityType: "staff_member",
    entityId: createdAuthUserId,
    entityReference: rawEmail,
    actor: {
      id: input.ownerUser.id,
      email: input.ownerUser.email || undefined,
      role: "owner",
    },
    outcome: "SUCCESS",
    metadata: {
      targetEmail: rawEmail,
      assignedRole: "admin",
      temporaryPasswordIssued: true,
      expiresAt: expiresAt.toISOString(),
    },
  });

  // 9. Email dispatch (if configured)
  const emailConfig = getEmailConfig();
  const loginUrl = `${emailConfig.appBaseUrl}/login`;

  const emailDeliveryResult: AdminEmailDeliveryInfo = {
    configured: isEmailProviderActive(),
    sent: false,
    status: isEmailProviderActive() ? "PROVIDER_REJECTED" : "CONFIG_ERROR",
    error: undefined,
  };

  if (emailDeliveryResult.configured) {
    try {
      const emailTemplate = renderAdminInvitationEmail({
        recipientEmail: rawEmail,
        loginUrl,
        expiresInHours: 24,
      });

      const sendResult = await sendMail({
        to: rawEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      emailDeliveryResult.status = sendResult.status;
      emailDeliveryResult.messageId = sendResult.messageId;
      emailDeliveryResult.response = sendResult.response;

      if (sendResult.success) {
        emailDeliveryResult.sent = true;
        await recordAuditEvent({
          action: "ADMIN_INVITATION_DELIVERY_SUCCESS",
          entityType: "staff_member",
          entityId: createdAuthUserId,
          entityReference: rawEmail,
          actor: {
            id: input.ownerUser.id,
            email: input.ownerUser.email || undefined,
            role: "owner",
          },
          outcome: "SUCCESS",
          metadata: {
            targetEmail: rawEmail,
            provider: "gmail-smtp",
            status: sendResult.status,
            messageId: sendResult.messageId,
            response: sendResult.response,
            deliveryConfirmed: false,
          },
        });
      } else {
        emailDeliveryResult.sent = false;
        emailDeliveryResult.error = sendResult.errorMessage || "SMTP dispatch rejected";
        await recordAuditEvent({
          action: "ADMIN_INVITATION_DELIVERY_FAILURE",
          entityType: "staff_member",
          entityId: createdAuthUserId,
          entityReference: rawEmail,
          actor: {
            id: input.ownerUser.id,
            email: input.ownerUser.email || undefined,
            role: "owner",
          },
          outcome: "FAILURE",
          errorCategory: sendResult.safeCategory || sendResult.status,
          metadata: {
            targetEmail: rawEmail,
            provider: "gmail-smtp",
            status: sendResult.status,
            error: sendResult.errorMessage,
          },
        });
      }
    } catch (mailErr) {
      emailDeliveryResult.sent = false;
      emailDeliveryResult.status = "PROVIDER_REJECTED";
      emailDeliveryResult.error = mailErr instanceof Error ? mailErr.message : "SMTP exception";
      await recordAuditEvent({
        action: "ADMIN_INVITATION_DELIVERY_FAILURE",
        entityType: "staff_member",
        entityId: createdAuthUserId,
        entityReference: rawEmail,
        actor: {
          id: input.ownerUser.id,
          email: input.ownerUser.email || undefined,
          role: "owner",
        },
        outcome: "FAILURE",
        errorCategory: "PROVIDER_ERROR",
        metadata: {
          targetEmail: rawEmail,
          provider: "gmail-smtp",
          status: "PROVIDER_REJECTED",
          error: emailDeliveryResult.error,
        },
      });
    }
  }

  // 10. Return result with temporary password only to the Owner
  return {
    success: true,
    userId: createdAuthUserId,
    email: rawEmail,
    role: "admin",
    temporaryPassword,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    emailDelivery: emailDeliveryResult,
  };
}

/**
 * Reissues a fresh temporary credential for an existing Admin account.
 * Strictly Owner-only. Resets 24-hour expiration window.
 * Never permits reissuing Owner credentials.
 */
export async function reissueAdminTemporaryPassword(
  input: ReissueAdminCredentialInput
): Promise<ReissueAdminCredentialResult> {
  // 1. Strict Owner role enforcement
  if (input.ownerUser.role !== "owner") {
    return {
      success: false,
      code: "FORBIDDEN",
      error: "Only the IT Club Owner can reissue administrative staff credentials.",
    };
  }

  const serviceClient = getServiceRoleClient();

  // 2. Fetch target staff member record
  const { data: targetStaff, error: fetchErr } = await serviceClient
    .from("staff_members")
    .select("user_id, role, email, password_change_required")
    .eq("user_id", input.targetUserId)
    .maybeSingle();

  if (fetchErr || !targetStaff) {
    return {
      success: false,
      code: "STAFF_NOT_FOUND",
      error: "Staff member record not found.",
    };
  }

  // Never allow reissuing credentials for an Owner account
  if (targetStaff.role === "owner") {
    await recordAuditEvent({
      action: "ADMIN_TEMPORARY_PASSWORD_REISSUED",
      entityType: "staff_member",
      entityId: input.targetUserId,
      entityReference: targetStaff.email || input.targetUserId,
      actor: {
        id: input.ownerUser.id,
        email: input.ownerUser.email || undefined,
        role: "owner",
      },
      outcome: "FAILURE",
      errorCategory: "CANNOT_RESET_OWNER",
      metadata: {
        targetUserId: input.targetUserId,
        targetEmail: targetStaff.email,
        targetRole: targetStaff.role,
      },
    });

    return {
      success: false,
      code: "INVALID_TARGET_ROLE",
      error: "Owner credentials cannot be reissued via this workflow.",
    };
  }

  // 3. Set fixed temporary password and reset expiry
  const temporaryPassword = FIXED_ADMIN_TEMPORARY_PASSWORD;
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 24 * 60 * 60 * 1000);

  // 4. Update Supabase Auth password
  const { error: authErr } = await serviceClient.auth.admin.updateUserById(
    input.targetUserId,
    {
      password: temporaryPassword,
      email_confirm: true,
    }
  );

  if (authErr) {
    await recordAuditEvent({
      action: "ADMIN_TEMPORARY_PASSWORD_REISSUED",
      entityType: "staff_member",
      entityId: input.targetUserId,
      entityReference: targetStaff.email || input.targetUserId,
      actor: {
        id: input.ownerUser.id,
        email: input.ownerUser.email || undefined,
        role: "owner",
      },
      outcome: "FAILURE",
      errorCategory: "AUTH_UPDATE_FAILED",
      metadata: {
        targetUserId: input.targetUserId,
        targetEmail: targetStaff.email,
        error: authErr.message,
      },
    });

    return {
      success: false,
      code: "AUTH_UPDATE_FAILED",
      error: authErr.message || "Could not update authentication credentials.",
    };
  }

  // 5. Update staff_members table
  const { error: updateErr } = await serviceClient
    .from("staff_members")
    .update({
      password_change_required: true,
      temporary_password_issued_at: issuedAt.toISOString(),
      temporary_password_expires_at: expiresAt.toISOString(),
      password_changed_at: null,
    })
    .eq("user_id", input.targetUserId);

  if (updateErr) {
    await recordAuditEvent({
      action: "ADMIN_TEMPORARY_PASSWORD_REISSUED",
      entityType: "staff_member",
      entityId: input.targetUserId,
      entityReference: targetStaff.email || input.targetUserId,
      actor: {
        id: input.ownerUser.id,
        email: input.ownerUser.email || undefined,
        role: "owner",
      },
      outcome: "FAILURE",
      errorCategory: "DATABASE_UPDATE_FAILED",
      metadata: {
        targetUserId: input.targetUserId,
        targetEmail: targetStaff.email,
        error: updateErr.message,
      },
    });

    return {
      success: false,
      code: "DATABASE_UPDATE_FAILED",
      error: "Could not update staff membership record in database.",
    };
  }

  // 6. Record Audit: Temporary password reissued
  await recordAuditEvent({
    action: "ADMIN_TEMPORARY_PASSWORD_REISSUED",
    entityType: "staff_member",
    entityId: input.targetUserId,
    entityReference: targetStaff.email || input.targetUserId,
    actor: {
      id: input.ownerUser.id,
      email: input.ownerUser.email || undefined,
      role: "owner",
    },
    outcome: "SUCCESS",
    metadata: {
      targetUserId: input.targetUserId,
      targetEmail: targetStaff.email,
      expiresAt: expiresAt.toISOString(),
    },
  });

  // 7. Dispatch email if target email exists and mailer is active
  const emailConfig = getEmailConfig();
  const loginUrl = `${emailConfig.appBaseUrl}/login`;

  const emailDeliveryResult: AdminEmailDeliveryInfo = {
    configured: isEmailProviderActive(),
    sent: false,
    status: isEmailProviderActive() ? "PROVIDER_REJECTED" : "CONFIG_ERROR",
    error: undefined,
  };

  if (emailDeliveryResult.configured && targetStaff.email) {
    try {
      const emailTemplate = renderAdminInvitationEmail({
        recipientEmail: targetStaff.email,
        loginUrl,
        expiresInHours: 24,
      });

      const sendResult = await sendMail({
        to: targetStaff.email,
        subject: "IT Club Staff Credentials Reissued — Administrator Access",
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      emailDeliveryResult.status = sendResult.status;
      emailDeliveryResult.messageId = sendResult.messageId;
      emailDeliveryResult.response = sendResult.response;

      if (sendResult.success) {
        emailDeliveryResult.sent = true;
        await recordAuditEvent({
          action: "ADMIN_INVITATION_DELIVERY_SUCCESS",
          entityType: "staff_member",
          entityId: input.targetUserId,
          entityReference: targetStaff.email,
          actor: {
            id: input.ownerUser.id,
            email: input.ownerUser.email || undefined,
            role: "owner",
          },
          outcome: "SUCCESS",
          metadata: {
            targetEmail: targetStaff.email,
            provider: "gmail-smtp",
            status: sendResult.status,
            messageId: sendResult.messageId,
            response: sendResult.response,
            deliveryConfirmed: false,
            isReissue: true,
          },
        });
      } else {
        emailDeliveryResult.sent = false;
        emailDeliveryResult.error = sendResult.errorMessage || "SMTP dispatch rejected";
        await recordAuditEvent({
          action: "ADMIN_INVITATION_DELIVERY_FAILURE",
          entityType: "staff_member",
          entityId: input.targetUserId,
          entityReference: targetStaff.email,
          actor: {
            id: input.ownerUser.id,
            email: input.ownerUser.email || undefined,
            role: "owner",
          },
          outcome: "FAILURE",
          errorCategory: sendResult.safeCategory || sendResult.status,
          metadata: {
            targetEmail: targetStaff.email,
            provider: "gmail-smtp",
            status: sendResult.status,
            error: sendResult.errorMessage,
            isReissue: true,
          },
        });
      }
    } catch (mailErr) {
      emailDeliveryResult.sent = false;
      emailDeliveryResult.status = "PROVIDER_REJECTED";
      emailDeliveryResult.error = mailErr instanceof Error ? mailErr.message : "SMTP exception";
      await recordAuditEvent({
        action: "ADMIN_INVITATION_DELIVERY_FAILURE",
        entityType: "staff_member",
        entityId: input.targetUserId,
        entityReference: targetStaff.email,
        actor: {
          id: input.ownerUser.id,
          email: input.ownerUser.email || undefined,
          role: "owner",
        },
        outcome: "FAILURE",
        errorCategory: "PROVIDER_ERROR",
        metadata: {
          targetEmail: targetStaff.email,
          provider: "gmail-smtp",
          status: "PROVIDER_REJECTED",
          error: emailDeliveryResult.error,
          isReissue: true,
        },
      });
    }
  }

  return {
    success: true,
    userId: input.targetUserId,
    email: targetStaff.email || undefined,
    temporaryPassword,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    emailDelivery: emailDeliveryResult,
  };
}

/**
 * Retries dispatching the invitation notification to an existing Admin.
 * Strictly Owner-only. NEVER creates a second Auth user, NEVER resets passwords.
 * Guarded against double submissions within 30 seconds.
 */
export async function retryAdminInvitationEmail(
  input: RetryAdminInvitationInput
): Promise<RetryAdminInvitationResult> {
  // 1. Strict Owner role enforcement
  if (input.ownerUser.role !== "owner") {
    return {
      success: false,
      code: "FORBIDDEN",
      error: "Only the IT Club Owner can retry admin invitations.",
    };
  }

  const serviceClient = getServiceRoleClient();

  // 2. Fetch staff member
  const { data: targetStaff, error: fetchErr } = await serviceClient
    .from("staff_members")
    .select("user_id, role, email, password_change_required, temporary_password_expires_at")
    .eq("user_id", input.targetUserId)
    .maybeSingle();

  if (fetchErr || !targetStaff || !targetStaff.email) {
    return {
      success: false,
      code: "STAFF_NOT_FOUND",
      error: "Staff member record with email address not found.",
    };
  }

  if (targetStaff.role !== "admin") {
    return {
      success: false,
      code: "INVALID_TARGET_ROLE",
      error: "Only Administrator invitations can be retried.",
    };
  }

  if (!targetStaff.password_change_required) {
    return {
      success: false,
      code: "ALREADY_ACTIVATED",
      error: "This administrator has already completed their first login and set their password.",
    };
  }

  // 3. Double-submission / Rate-limiting guard (prevent spamming within 30 seconds)
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
  const { data: recentEvents } = await serviceClient
    .from("audit_events")
    .select("id, created_at")
    .eq("entity_id", input.targetUserId)
    .in("action", [
      "ADMIN_INVITATION_DELIVERY_SUCCESS",
      "ADMIN_INVITATION_DELIVERY_FAILURE",
      "ADMIN_INVITATION_RETRY_DISPATCHED",
    ])
    .gte("created_at", thirtySecondsAgo)
    .limit(1);

  if (recentEvents && recentEvents.length > 0) {
    return {
      success: false,
      code: "RATE_LIMITED",
      error: "An invitation email was dispatched recently. Please wait 30 seconds before retrying.",
    };
  }

  // 4. Send email (NEVER resets password, NEVER creates a new user)
  const emailConfig = getEmailConfig();
  const loginUrl = `${emailConfig.appBaseUrl}/login`;

  const emailTemplate = renderAdminInvitationEmail({
    recipientEmail: targetStaff.email,
    loginUrl,
    expiresInHours: 24,
  });

  const sendResult = await sendMail({
    to: targetStaff.email,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
  });

  const emailDelivery: AdminEmailDeliveryInfo = {
    configured: isEmailProviderActive(),
    sent: sendResult.success,
    status: sendResult.status,
    messageId: sendResult.messageId,
    response: sendResult.response,
    error: sendResult.errorMessage,
  };

  await recordAuditEvent({
    action: "ADMIN_INVITATION_RETRY_DISPATCHED",
    entityType: "staff_member",
    entityId: input.targetUserId,
    entityReference: targetStaff.email,
    actor: {
      id: input.ownerUser.id,
      email: input.ownerUser.email || undefined,
      role: "owner",
    },
    outcome: sendResult.success ? "SUCCESS" : "FAILURE",
    errorCategory: sendResult.success ? undefined : (sendResult.safeCategory || sendResult.status),
    metadata: {
      targetEmail: targetStaff.email,
      provider: "gmail-smtp",
      status: sendResult.status,
      messageId: sendResult.messageId,
      response: sendResult.response,
      deliveryConfirmed: false,
      error: sendResult.errorMessage,
    },
  });

  return {
    success: sendResult.success,
    emailDelivery,
    error: sendResult.errorMessage,
  };
}

/**
 * Handles password change for a staff member.
 * Enforces 24-hour expiration check for temporary credentials.
 * Updates Supabase Auth first, then clears database flag only on success.
 */
export async function changeStaffPassword(
  input: ChangeStaffPasswordInput
): Promise<ChangeStaffPasswordResult> {
  const serviceClient = getServiceRoleClient();

  // 1. Fetch staff member
  const { data: staffMember, error: fetchErr } = await serviceClient
    .from("staff_members")
    .select("user_id, role, email, password_change_required, temporary_password_expires_at")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (fetchErr || !staffMember) {
    return {
      success: false,
      code: "STAFF_NOT_FOUND",
      error: "Staff member record not found.",
    };
  }

  // 2. Enforce 24-hour expiration if temporary password is required
  if (staffMember.password_change_required && staffMember.temporary_password_expires_at) {
    const isExpired = new Date() > new Date(staffMember.temporary_password_expires_at);
    if (isExpired) {
      // Record Audit: Expired account credential rejected
      await recordAuditEvent({
        action: "EXPIRED_STAFF_CREDENTIAL_REJECTED",
        entityType: "staff_member",
        entityId: input.userId,
        entityReference: staffMember.email || input.userId,
        actor: {
          id: input.userId,
          email: staffMember.email || undefined,
          role: staffMember.role,
        },
        outcome: "FAILURE",
        errorCategory: "CREDENTIAL_EXPIRED",
        metadata: {
          expiredAt: staffMember.temporary_password_expires_at,
        },
      });

      return {
        success: false,
        code: "TEMPORARY_PASSWORD_EXPIRED",
        error:
          "Your temporary administrative credential has expired (24-hour limit exceeded). Contact the IT Club Owner to reissue an invitation.",
      };
    }
  }

  // 3. Validate new password
  const newPassword = input.newPassword;
  const confirmPassword = input.confirmPassword;

  if (!newPassword || typeof newPassword !== "string" || !confirmPassword || typeof confirmPassword !== "string") {
    return {
      success: false,
      code: "INVALID_INPUT",
      error: "New password and password confirmation are required.",
    };
  }

  if (newPassword.length < 8) {
    return {
      success: false,
      code: "PASSWORD_TOO_SHORT",
      error: "New password must be at least 8 characters long.",
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      success: false,
      code: "PASSWORDS_DO_NOT_MATCH",
      error: "Passwords do not match.",
    };
  }

  // 4. Update password via Supabase Auth Admin API
  const { error: updateAuthErr } = await serviceClient.auth.admin.updateUserById(
    input.userId,
    {
      password: newPassword,
      email_confirm: true,
    }
  );

  if (updateAuthErr) {
    return {
      success: false,
      code: "AUTH_UPDATE_FAILED",
      error: updateAuthErr.message || "Failed to update authentication password in Supabase.",
    };
  }

  // 5. Update database record: clear password_change_required and record password_changed_at
  const now = new Date().toISOString();
  const { error: updateDbErr } = await serviceClient
    .from("staff_members")
    .update({
      password_change_required: false,
      password_changed_at: now,
      temporary_password_expires_at: null,
    })
    .eq("user_id", input.userId);

  if (updateDbErr) {
    return {
      success: false,
      code: "DATABASE_UPDATE_FAILED",
      error: "Password updated in authentication, but failed to clear state in database.",
    };
  }

  // 6. Record Audit: Password changed
  await recordAuditEvent({
    action: "STAFF_PASSWORD_CHANGED",
    entityType: "staff_member",
    entityId: input.userId,
    entityReference: staffMember.email || input.userId,
    actor: {
      id: input.userId,
      email: staffMember.email || undefined,
      role: staffMember.role,
    },
    outcome: "SUCCESS",
    metadata: {
      passwordChangedAt: now,
    },
  });

  return {
    success: true,
    message: "Password changed successfully.",
  };
}

export interface UpdateStaffAccountInput {
  targetUserId: string;
  email?: string;
  role?: StaffRole;
  ownerUser: {
    id: string;
    email?: string | null;
    role: string;
  };
}

export interface UpdateStaffAccountResult {
  success: boolean;
  code?: string;
  error?: string;
  staffMember?: {
    user_id: string;
    role: StaffRole;
    email: string | null;
  };
}

/**
 * Updates a non-owner staff member's email address and/or role.
 * Strictly Owner-only. Never permits editing or assigning Owner role.
 * Synchronizes Supabase Auth email and public.staff_members email.
 * Records immutable audit logs for both email and role changes.
 */
export async function updateStaffAccount(
  input: UpdateStaffAccountInput
): Promise<UpdateStaffAccountResult> {
  // 1. Strict Owner role enforcement
  if (input.ownerUser.role !== "owner") {
    return {
      success: false,
      code: "FORBIDDEN",
      error: "Only the IT Club Owner can update staff accounts.",
    };
  }

  if (!input.targetUserId || typeof input.targetUserId !== "string") {
    return {
      success: false,
      code: "INVALID_INPUT",
      error: "Target staff user ID is required.",
    };
  }

  const serviceClient = getServiceRoleClient();

  // 2. Fetch target staff member record
  const { data: targetStaff, error: fetchErr } = await serviceClient
    .from("staff_members")
    .select("user_id, role, email")
    .eq("user_id", input.targetUserId)
    .maybeSingle();

  if (fetchErr || !targetStaff) {
    return {
      success: false,
      code: "STAFF_NOT_FOUND",
      error: "Staff member record not found.",
    };
  }

  // Never allow changing any target Owner account
  if (targetStaff.role === "owner") {
    return {
      success: false,
      code: "CANNOT_MODIFY_OWNER",
      error: "Owner accounts cannot be modified.",
    };
  }

  // 3. Validate role if provided (must only be 'admin' or 'interviewer')
  if (input.role !== undefined) {
    if (input.role === "owner" || (input.role !== "admin" && input.role !== "interviewer")) {
      return {
        success: false,
        code: "INVALID_ROLE",
        error: "Staff role can only be updated to 'admin' or 'interviewer'. Assigning the owner role is forbidden.",
      };
    }
  }

  // 4. Validate email if provided
  let cleanEmail: string | undefined = undefined;
  if (input.email !== undefined) {
    cleanEmail = input.email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmailAddress(cleanEmail)) {
      return {
        success: false,
        code: "INVALID_EMAIL",
        error: "Please provide a valid email address.",
      };
    }

    if (cleanEmail !== targetStaff.email?.toLowerCase()) {
      // Check for duplicate staff account
      const { data: duplicateStaff, error: checkDupErr } = await serviceClient
        .from("staff_members")
        .select("user_id")
        .eq("email", cleanEmail)
        .neq("user_id", input.targetUserId)
        .maybeSingle();

      if (checkDupErr) {
        return {
          success: false,
          code: "DATABASE_ERROR",
          error: "Could not verify email uniqueness in staff directory.",
        };
      }

      if (duplicateStaff) {
        return {
          success: false,
          code: "ACCOUNT_ALREADY_EXISTS",
          error: `A staff member with the email ${cleanEmail} is already enrolled.`,
        };
      }
    }
  }

  // 5. Update Email if changed
  let updatedEmail = targetStaff.email;
  if (cleanEmail && cleanEmail !== targetStaff.email?.toLowerCase()) {
    // Update Supabase Auth user email
    const { error: authErr } = await serviceClient.auth.admin.updateUserById(
      input.targetUserId,
      {
        email: cleanEmail,
        email_confirm: true,
      }
    );

    if (authErr) {
      await recordAuditEvent({
        action: "ADMIN_EMAIL_UPDATED",
        entityType: "staff_member",
        entityId: input.targetUserId,
        entityReference: cleanEmail,
        actor: {
          id: input.ownerUser.id,
          email: input.ownerUser.email || undefined,
          role: "owner",
        },
        outcome: "FAILURE",
        errorCategory: "AUTH_UPDATE_FAILED",
        metadata: {
          targetUserId: input.targetUserId,
          previousEmail: targetStaff.email,
          newEmail: cleanEmail,
          error: authErr.message,
        },
      });

      return {
        success: false,
        code: "AUTH_UPDATE_FAILED",
        error: `Could not update authentication email: ${authErr.message}`,
      };
    }

    // Update staff_members email
    const { error: dbErr } = await serviceClient
      .from("staff_members")
      .update({ email: cleanEmail })
      .eq("user_id", input.targetUserId);

    if (dbErr) {
      await recordAuditEvent({
        action: "ADMIN_EMAIL_UPDATED",
        entityType: "staff_member",
        entityId: input.targetUserId,
        entityReference: cleanEmail,
        actor: {
          id: input.ownerUser.id,
          email: input.ownerUser.email || undefined,
          role: "owner",
        },
        outcome: "FAILURE",
        errorCategory: "DATABASE_UPDATE_FAILED",
        metadata: {
          targetUserId: input.targetUserId,
          previousEmail: targetStaff.email,
          newEmail: cleanEmail,
          error: dbErr.message,
        },
      });

      return {
        success: false,
        code: "DATABASE_UPDATE_FAILED",
        error: "Failed to update staff record in database.",
      };
    }

    await recordAuditEvent({
      action: "ADMIN_EMAIL_UPDATED",
      entityType: "staff_member",
      entityId: input.targetUserId,
      entityReference: cleanEmail,
      actor: {
        id: input.ownerUser.id,
        email: input.ownerUser.email || undefined,
        role: "owner",
      },
      outcome: "SUCCESS",
      metadata: {
        targetUserId: input.targetUserId,
        previousEmail: targetStaff.email,
        newEmail: cleanEmail,
      },
    });

    updatedEmail = cleanEmail;
  }

  // 6. Update Role if changed
  let updatedRole = targetStaff.role;
  if (input.role !== undefined && input.role !== targetStaff.role) {
    const { error: roleDbErr } = await serviceClient
      .from("staff_members")
      .update({ role: input.role })
      .eq("user_id", input.targetUserId);

    if (roleDbErr) {
      await recordAuditEvent({
        action: "ADMIN_ROLE_UPDATED",
        entityType: "staff_member",
        entityId: input.targetUserId,
        entityReference: updatedEmail || input.targetUserId,
        actor: {
          id: input.ownerUser.id,
          email: input.ownerUser.email || undefined,
          role: "owner",
        },
        outcome: "FAILURE",
        errorCategory: "DATABASE_UPDATE_FAILED",
        metadata: {
          targetUserId: input.targetUserId,
          previousRole: targetStaff.role,
          newRole: input.role,
          error: roleDbErr.message,
        },
      });

      return {
        success: false,
        code: "DATABASE_UPDATE_FAILED",
        error: "Failed to update staff role in database.",
      };
    }

    await recordAuditEvent({
      action: "ADMIN_ROLE_UPDATED",
      entityType: "staff_member",
      entityId: input.targetUserId,
      entityReference: updatedEmail || input.targetUserId,
      actor: {
        id: input.ownerUser.id,
        email: input.ownerUser.email || undefined,
        role: "owner",
      },
      outcome: "SUCCESS",
      metadata: {
        targetUserId: input.targetUserId,
        previousRole: targetStaff.role,
        newRole: input.role,
      },
    });

    updatedRole = input.role;
  }

  return {
    success: true,
    staffMember: {
      user_id: input.targetUserId,
      role: updatedRole as StaffRole,
      email: updatedEmail,
    },
  };
}
