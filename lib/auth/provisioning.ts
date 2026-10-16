import crypto from "node:crypto";
import { getServiceRoleClient } from "./service-role.ts";
import { isStudentPortalAllowedStatus } from "./student.ts";
import { recordAuditEvent } from "../audit/service.ts";
import type { AuditActorRole } from "../audit/types.ts";

const UPPERCASE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Excludes easily confused I, O
const LOWERCASE_CHARS = "abcdefghjkmnpqrstuvwxyz"; // Excludes easily confused l, o
const NUMBER_CHARS = "23456789"; // Excludes 0, 1
const SYMBOL_CHARS = "!@#$%*&";
const ALL_CHARS = UPPERCASE_CHARS + LOWERCASE_CHARS + NUMBER_CHARS + SYMBOL_CHARS;

/**
 * Generates an unpredictable, cryptographically secure temporary password.
 * Guaranteed to have uppercase, lowercase, numbers, and symbols.
 * Never uses or contains the application reference code.
 */
export function generateSecureTemporaryPassword(applicationReference?: string): string {
  const refClean = applicationReference?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  while (true) {
    // 14 characters total
    const chars: string[] = [
      UPPERCASE_CHARS[crypto.randomInt(0, UPPERCASE_CHARS.length)],
      LOWERCASE_CHARS[crypto.randomInt(0, LOWERCASE_CHARS.length)],
      NUMBER_CHARS[crypto.randomInt(0, NUMBER_CHARS.length)],
      SYMBOL_CHARS[crypto.randomInt(0, SYMBOL_CHARS.length)],
    ];

    for (let i = chars.length; i < 14; i++) {
      chars.push(ALL_CHARS[crypto.randomInt(0, ALL_CHARS.length)]);
    }

    // Shuffle characters securely using Fisher-Yates
    for (let i = chars.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      const temp = chars[i];
      chars[i] = chars[j];
      chars[j] = temp;
    }

    const password = chars.join("");

    // Ensure it doesn't match or contain the application reference
    if (refClean && password.toUpperCase().includes(refClean)) {
      continue;
    }

    return password;
  }
}

export interface ProvisionStudentAccountInput {
  applicationId: string;
  staffUser: {
    id: string;
    email?: string | null;
    role: string;
  };
  isReissue?: boolean;
}

export interface ProvisionStudentAccountResult {
  success: boolean;
  code?: string;
  error?: string;
  temporaryPassword?: string;
  expiresAt?: string;
  issuedAt?: string;
  universityEmail?: string;
  applicationReference?: string;
  userId?: string;
  isReissue?: boolean;
  studentAccount?: {
    user_id: string;
    application_id: string;
    university_email: string;
    password_change_required: boolean;
    temp_password_issued_at: string;
    temp_password_expires_at: string;
    password_changed_at: string | null;
    activated_at: string;
  };
}

/**
 * Server-only, role-protected student account provisioning and password reissuance.
 * Bypasses email delivery dependency by generating an in-person temporary credential
 * with a strict 24-hour expiration deadline.
 */
export async function provisionStudentAccount(
  input: ProvisionStudentAccountInput
): Promise<ProvisionStudentAccountResult> {
  // 1. Verify staff authorization
  if (input.staffUser.role !== "owner" && input.staffUser.role !== "admin") {
    return {
      success: false,
      code: "FORBIDDEN",
      error: "Only Owner and Admin roles are authorized to provision student accounts.",
    };
  }

  const serviceClient = getServiceRoleClient();

  // 2. Fetch application
  const { data: application, error: appErr } = await serviceClient
    .from("applications")
    .select("id, application_reference, university_email, status, user_id, activated_at")
    .eq("id", input.applicationId)
    .maybeSingle();

  if (appErr || !application) {
    return {
      success: false,
      code: "NOT_FOUND",
      error: "Applicant record not found.",
    };
  }

  // 3. Confirm applicant is eligible for student portal access
  if (!isStudentPortalAllowedStatus(application.status)) {
    return {
      success: false,
      code: "INELIGIBLE_STATUS",
      error: `Applicant status '${application.status}' is not eligible for student portal access. Account provisioning requires shortlisted or accepted status.`,
    };
  }

  const canonicalEmail = application.university_email.trim().toLowerCase();
  if (!canonicalEmail.endsWith("@batechu.com")) {
    return {
      success: false,
      code: "INVALID_EMAIL_DOMAIN",
      error: "Applicant university email must end with @batechu.com.",
    };
  }

  // 4. Locate corresponding Supabase Auth user safely and verify ownership
  const { data: existingAccount } = await serviceClient
    .from("student_accounts")
    .select("user_id, application_id, university_email, activated_at")
    .eq("application_id", application.id)
    .maybeSingle();

  let targetUserId = existingAccount?.user_id || application.user_id || null;

  if (!targetUserId) {
    // Search auth users for canonical university email
    const { data: usersData, error: listErr } = await serviceClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (!listErr && usersData?.users) {
      const found = usersData.users.find(
        (u) => u.email?.trim().toLowerCase() === canonicalEmail
      );
      if (found) {
        targetUserId = found.id;
      }
    }
  }

  // 5. Conflict verification: Never silently reassign or replace an identity
  if (targetUserId) {
    const { data: linkedAccount } = await serviceClient
      .from("student_accounts")
      .select("application_id")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (linkedAccount && linkedAccount.application_id !== application.id) {
      return {
        success: false,
        code: "ACCOUNT_CONFLICT",
        error: "A Supabase Auth user with this university email is already linked to another application. Operation aborted to prevent identity collision. Owner review required.",
      };
    }

    const { data: linkedApp } = await serviceClient
      .from("applications")
      .select("id, application_reference")
      .eq("user_id", targetUserId)
      .neq("id", application.id)
      .maybeSingle();

    if (linkedApp) {
      return {
        success: false,
        code: "ACCOUNT_CONFLICT",
        error: `A Supabase Auth user with this university email is already linked to application ${linkedApp.application_reference}. Operation aborted to prevent identity collision. Owner review required.`,
      };
    }
  }

  // 6. Generate cryptographically random temporary password
  const tempPassword = generateSecureTemporaryPassword(application.application_reference);

  // 7. Create or update Supabase Auth user
  if (targetUserId) {
    const { error: updateAuthErr } = await serviceClient.auth.admin.updateUserById(targetUserId, {
      password: tempPassword,
      email_confirm: true,
    });

    if (updateAuthErr) {
      return {
        success: false,
        code: "AUTH_UPDATE_FAILED",
        error: `Failed to set temporary password in Supabase Auth: ${updateAuthErr.message}`,
      };
    }
  } else {
    const { data: createdAuth, error: createAuthErr } = await serviceClient.auth.admin.createUser({
      email: canonicalEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        university_email: canonicalEmail,
        application_reference: application.application_reference,
      },
    });

    if (createAuthErr || !createdAuth.user) {
      // If user already exists in Auth, handle gracefully
      if (createAuthErr?.message?.toLowerCase().includes("already") || (createAuthErr as { status?: number })?.status === 422) {
        const { data: listRes } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existing = listRes?.users?.find((u) => u.email?.trim().toLowerCase() === canonicalEmail);
        if (existing) {
          targetUserId = existing.id;
          const { error: updateErr } = await serviceClient.auth.admin.updateUserById(targetUserId, {
            password: tempPassword,
            email_confirm: true,
          });
          if (updateErr) {
            return {
              success: false,
              code: "AUTH_UPDATE_FAILED",
              error: `Failed to configure existing Supabase Auth user: ${updateErr.message}`,
            };
          }
        } else {
          return {
            success: false,
            code: "AUTH_CREATE_FAILED",
            error: createAuthErr?.message || "Failed to create Supabase Auth user.",
          };
        }
      } else {
        return {
          success: false,
          code: "AUTH_CREATE_FAILED",
          error: createAuthErr?.message || "Failed to create Supabase Auth user.",
        };
      }
    } else {
      targetUserId = createdAuth.user.id;
    }
  }

  // 8. Calculate 24-hour temporary password lifecycle timestamps
  const now = new Date();
  const issuedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const isReissue = Boolean(input.isReissue || existingAccount);

  // 9. Upsert student_accounts mapping with forced password change state
  const studentAccountData = {
    user_id: targetUserId,
    application_id: application.id,
    university_email: canonicalEmail,
    password_change_required: true,
    temp_password_issued_at: issuedAt,
    temp_password_expires_at: expiresAt,
    password_changed_at: null,
    activated_at: existingAccount?.activated_at || issuedAt,
  };

  const { error: upsertErr } = await serviceClient
    .from("student_accounts")
    .upsert(studentAccountData, { onConflict: "user_id" });

  if (upsertErr) {
    return {
      success: false,
      code: "DATABASE_ERROR",
      error: `Failed to persist student account linkage: ${upsertErr.message}`,
    };
  }

  // 10. Update applications record
  const { error: appUpdateErr } = await serviceClient
    .from("applications")
    .update({
      user_id: targetUserId,
      activated_at: application.activated_at || issuedAt,
      updated_at: issuedAt,
    })
    .eq("id", application.id);

  if (appUpdateErr) {
    console.error("[provisionStudentAccount] Warning: Failed to sync application user_id:", appUpdateErr.message);
  }

  // 11. Record audit event WITHOUT storing temporary password
  await recordAuditEvent({
    actor: {
      id: input.staffUser.id,
      email: input.staffUser.email,
      role: input.staffUser.role as AuditActorRole,
    },
    action: isReissue ? "STUDENT_CREDENTIAL_REISSUED" : "STUDENT_ACCOUNT_PROVISIONED",
    entityType: "student_account",
    entityId: targetUserId,
    entityReference: application.application_reference,
    outcome: "SUCCESS",
    metadata: {
      applicationId: application.id,
      universityEmail: canonicalEmail,
      expiresAt,
      isReissue,
    },
  });

  // 12. Return one-time temporary password result
  return {
    success: true,
    temporaryPassword: tempPassword,
    expiresAt,
    issuedAt,
    universityEmail: canonicalEmail,
    applicationReference: application.application_reference,
    userId: targetUserId,
    isReissue,
    studentAccount: studentAccountData,
  };
}
