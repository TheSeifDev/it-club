import { getServiceRoleClient } from "../auth/service-role.ts";
import { getEmailConfig } from "./config.ts";
import { sendMail, isEmailProviderActive } from "./mailer.ts";
import { renderRegistrationReceiptEmail } from "./templates/registration-receipt.ts";
import { renderAcceptanceInvitationEmail } from "./templates/acceptance-invitation.ts";
import { renderShortlistedInvitationEmail } from "./templates/shortlisted-invitation.ts";
import { renderInterviewScheduledEmail } from "./templates/interview-scheduled.ts";
import { recordAuditEvent } from "../audit/service.ts";
import { validatePersonalEmail } from "../validation/university-email.ts";
import { randomUUID } from "node:crypto";
import { generateSecureTemporaryPassword } from "../auth/provisioning.ts";

const REISSUE_COOLDOWN_MS = 10 * 60 * 1000;

async function mayCreateFreshInvitation(
  applicationId: string,
  notificationType: "SHORTLISTED_INVITATION" | "ACCEPTANCE_INVITATION"
): Promise<boolean> {
  const { data } = await getServiceRoleClient()
    .from("application_notifications")
    .select("attempted_at")
    .eq("application_id", applicationId)
    .eq("notification_type", notificationType)
    .order("attempted_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const attemptedAt = data?.attempted_at ? Date.parse(data.attempted_at) : NaN;
  return !Number.isFinite(attemptedAt) || Date.now() - attemptedAt >= REISSUE_COOLDOWN_MS;
}

export interface ResolvedRecipient {
  recipientEmail: string;
  authEmail: string;
  source: "google_email" | "university_email_fallback";
  isFallback: boolean;
  reason?: string;
}

/**
 * Resolves the student notification delivery recipient according to official policy:
 * 1. Uses `google_email` (student's personal Gmail) when present and valid.
 * 2. Uses `university_email` ONLY as a documented fallback when personal Google email is missing or invalid.
 * 3. Never silently sends to both addresses.
 * 4. Supabase Auth remains strictly bound to `university_email`.
 */
export function resolveNotificationRecipient(input: {
  googleEmail?: string | null;
  universityEmail: string;
}): ResolvedRecipient {
  const authEmail = (input.universityEmail || "").trim().toLowerCase();
  const rawGoogle = input.googleEmail?.trim();

  if (rawGoogle) {
    const val = validatePersonalEmail(rawGoogle);
    if (val.isValid && val.normalized) {
      return {
        recipientEmail: val.normalized,
        authEmail,
        source: "google_email",
        isFallback: false,
      };
    }
  }

  return {
    recipientEmail: authEmail,
    authEmail,
    source: "university_email_fallback",
    isFallback: true,
    reason: rawGoogle ? "INVALID_GOOGLE_EMAIL" : "MISSING_GOOGLE_EMAIL",
  };
}

export interface SendRegistrationReceiptInput {
  applicationId: string;
  applicationReference: string;
  recipientEmail?: string;
  fullName: string;
  academicId?: string | null;
  academicYear: string;
  department: string;
  primaryTrack: string;
  secondaryTrack?: string | null;
  universityEmail?: string | null;
  googleEmail?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  experienceLevel?: string | null;
  skills?: string | null;
  experienceDetails?: string | null;
  volunteerExperience?: string | null;
  motivation?: string | null;
  learningGoal?: string | null;
  contribution?: string | null;
  availability?: string | null;
}

export interface SendAcceptanceInvitationInput {
  applicationId: string;
  applicationReference: string;
  recipientEmail?: string;
  universityEmail?: string;
  googleEmail?: string | null;
  fullName: string;
  primaryTrack: string;
}

export interface SendShortlistedInvitationInput {
  applicationId: string;
  applicationReference: string;
  recipientEmail?: string;
  universityEmail?: string;
  googleEmail?: string | null;
  fullName: string;
  primaryTrack: string;
}

export interface SendInterviewScheduledInput {
  applicationId: string;
  applicationReference: string;
  recipientEmail?: string;
  universityEmail?: string;
  googleEmail?: string | null;
  fullName: string;
  primaryTrack: string;
  interviewDate: string;
  interviewTime?: string | null;
  interviewLocation?: string | null;
  isRescheduled?: boolean;
}

export interface NotificationSendResult {
  success: boolean;
  status: "sent" | "already_sent" | "unconfigured" | "failed" | "pending";
  notificationId?: string;
  providerMessageId?: string;
  safeReason?: string;
  recipientEmail?: string;
  authEmail?: string;
  isFallback?: boolean;
}

export interface SendReceiptOptions {
  dispatchMode?: "sync" | "queue";
  timeoutMs?: number;
}

export interface ApplicationNotificationRecord {
  id: string;
  application_id: string;
  notification_type: string;
  idempotency_key: string;
  recipient_email: string;
  delivery_status: "PENDING" | "SENT" | "FAILED";
  attempt_count: number;
  provider_message_id: string | null;
  safe_error_category: string | null;
  error_message: string | null;
  created_at: string;
  attempted_at: string | null;
  completed_at: string | null;
}

/**
 * Attempts delivery of a registration receipt to the student.
 * Guaranteed idempotency: will never send duplicate emails for the same application.
 * Never throws — failures are recorded safely in the database and returned gracefully.
 */
export async function sendRegistrationReceipt(
  input: SendRegistrationReceiptInput,
  options?: SendReceiptOptions
): Promise<NotificationSendResult> {
  const serviceClient = getServiceRoleClient();
  const idempotencyKey = `reg_receipt_${input.applicationId}`;
  const now = new Date().toISOString();

  let notificationId: string | undefined;
  let attemptCount = 1;

  try {
    // 0. Recipient Resolution: Google email by default, university email as fallback
    let uniEmail = input.universityEmail || input.recipientEmail || "";
    let googleEmail = input.googleEmail;

    if ((!googleEmail || !uniEmail) && input.applicationId) {
      const { data: appRecord } = await serviceClient
        .from("applications")
        .select("university_email, google_email")
        .eq("id", input.applicationId)
        .maybeSingle();

      if (appRecord) {
        if (!uniEmail) uniEmail = appRecord.university_email;
        if (googleEmail === undefined) googleEmail = appRecord.google_email;
      }
    }

    const resolved = resolveNotificationRecipient({
      googleEmail,
      universityEmail: uniEmail,
    });
    const destinationEmail = resolved.recipientEmail;

    // 1. Idempotency Check: lookup existing notification record
    const { data: existing, error: lookupErr } = await serviceClient
      .from("application_notifications")
      .select("id, delivery_status, attempt_count, provider_message_id, recipient_email")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (lookupErr) {
      console.error(
        `[notification-service] Failed to query notification status for ${input.applicationReference}:`,
        lookupErr.message
      );
    }

    if (existing) {
      notificationId = existing.id;
      attemptCount = (existing.attempt_count || 0) + 1;

      // If already sent, return immediately without re-sending
      if (existing.delivery_status === "SENT") {
        return {
          success: true,
          status: "already_sent",
          notificationId: existing.id,
          providerMessageId: existing.provider_message_id || undefined,
          recipientEmail: existing.recipient_email,
          authEmail: resolved.authEmail,
          isFallback: resolved.isFallback,
        };
      }

      // Update attempt count, timestamp, and recipient
      await serviceClient
        .from("application_notifications")
        .update({
          attempt_count: attemptCount,
          attempted_at: now,
          delivery_status: "PENDING",
          recipient_email: destinationEmail,
        })
        .eq("id", existing.id);
    } else {
      // Insert initial tracking record in PENDING state (Outbox pattern)
      const { data: inserted, error: insertErr } = await serviceClient
        .from("application_notifications")
        .insert({
          application_id: input.applicationId,
          notification_type: "REGISTRATION_RECEIPT",
          idempotency_key: idempotencyKey,
          recipient_email: destinationEmail,
          delivery_status: "PENDING",
          attempt_count: 1,
          attempted_at: now,
        })
        .select("id")
        .single();

      if (insertErr) {
        // If concurrent insert occurred, handle duplicate gracefully
        if (insertErr.code === "23505") {
          return {
            success: true,
            status: "already_sent",
            safeReason: "CONCURRENT_NOTIFICATION_ATTEMPT",
            recipientEmail: destinationEmail,
            authEmail: resolved.authEmail,
            isFallback: resolved.isFallback,
          };
        }
        console.error(
          `[notification-service] Failed to create notification log for ${input.applicationReference}:`,
          insertErr.message
        );
      } else if (inserted) {
        notificationId = inserted.id;
      }
    }

    // 2. Check if outbox queue mode is active (requires explicit queue dispatchMode or active outbox worker)
    const isQueueMode =
      options?.dispatchMode === "queue" ||
      (options?.dispatchMode !== "sync" &&
        process.env.EMAIL_DELIVERY_MODE === "outbox" &&
        process.env.OUTBOX_WORKER_ENABLED === "true");

    if (isQueueMode) {
      return {
        success: true,
        status: "pending",
        notificationId,
        safeReason: "QUEUED_FOR_OUTBOX_DELIVERY",
        recipientEmail: destinationEmail,
        authEmail: resolved.authEmail,
        isFallback: resolved.isFallback,
      };
    }

    // 3. Provider Configuration Check
    if (!isEmailProviderActive()) {
      if (notificationId) {
        await serviceClient
          .from("application_notifications")
          .update({
            delivery_status: "FAILED",
            safe_error_category: "PROVIDER_NOT_CONFIGURED",
            error_message:
              "Gmail SMTP credentials (GMAIL_USER, GMAIL_APP_PASSWORD) are not configured.",
          })
          .eq("id", notificationId);
      }
      return {
        success: false,
        status: "unconfigured",
        notificationId,
        safeReason: "PROVIDER_NOT_CONFIGURED",
        recipientEmail: destinationEmail,
        authEmail: resolved.authEmail,
        isFallback: resolved.isFallback,
      };
    }

    // 4. Render Email Template
    const config = getEmailConfig();
    const { subject, html, text } = renderRegistrationReceiptEmail({
      fullName: input.fullName,
      referenceCode: input.applicationReference,
      primaryTrack: input.primaryTrack,
      secondaryTrack: input.secondaryTrack,
      academicYear: input.academicYear,
      department: input.department,
      academicId: input.academicId,
      universityEmail: resolved.authEmail,
      googleEmail: resolved.isFallback ? null : destinationEmail,
      phone: input.phone,
      whatsapp: input.whatsapp,
      experienceLevel: input.experienceLevel,
      skills: input.skills,
      experienceDetails: input.experienceDetails,
      volunteerExperience: input.volunteerExperience,
      motivation: input.motivation,
      learningGoal: input.learningGoal,
      contribution: input.contribution,
      availability: input.availability,
      appBaseUrl: config.appBaseUrl,
    });

    // 5. Dispatch Email via Gmail SMTP with bounded timeout
    const timeoutMs =
      options?.timeoutMs ?? (Number(process.env.EMAIL_DISPATCH_TIMEOUT_MS) || 4000);
    const timeoutPromise = new Promise<{
      success: false;
      safeCategory: "CONNECTION_FAILED";
      errorMessage: string;
    }>((resolve) =>
      setTimeout(
        () =>
          resolve({
            success: false,
            safeCategory: "CONNECTION_FAILED",
            errorMessage: "SMTP dispatch timed out.",
          }),
        timeoutMs
      )
    );

    const mailResult = await Promise.race([
      sendMail({
        from: config.from,
        to: destinationEmail,
        subject,
        html,
        text,
      }),
      timeoutPromise,
    ]);

    if (!mailResult.success) {
      // If dispatch timed out, keep in PENDING status so outbox worker can retry
      if (mailResult.errorMessage === "SMTP dispatch timed out.") {
        console.warn(
          `[notification-service] Gmail SMTP dispatch timed out for ${input.applicationReference}. Kept in PENDING outbox state.`
        );
        return {
          success: true,
          status: "pending",
          notificationId,
          safeReason: "DISPATCH_TIMED_OUT_QUEUED",
          recipientEmail: destinationEmail,
          authEmail: resolved.authEmail,
          isFallback: resolved.isFallback,
        };
      }
      const safeReason = mailResult.safeCategory || "PROVIDER_ERROR";
      const safeMsg =
        mailResult.errorMessage || "Gmail SMTP delivery failed.";

      console.error(
        `[notification-service] Gmail SMTP dispatch failed for ${input.applicationReference}: ${safeReason}`
      );
      if (notificationId) {
        await serviceClient
          .from("application_notifications")
          .update({
            delivery_status: "FAILED",
            safe_error_category: safeReason,
            error_message: safeMsg,
            recipient_email: destinationEmail,
          })
          .eq("id", notificationId);
      }

      await recordAuditEvent({
        actor: { role: "system" },
        action: "NOTIFICATION_FAILED",
        entityType: "notification",
        entityId: input.applicationId,
        entityReference: input.applicationReference,
        metadata: {
          notificationType: "REGISTRATION_RECEIPT",
          recipient: destinationEmail,
          authEmail: resolved.authEmail,
          isFallback: resolved.isFallback,
        },
        outcome: "FAILURE",
        errorCategory: safeReason,
      });

      return {
        success: false,
        status: "failed",
        notificationId,
        safeReason,
        recipientEmail: destinationEmail,
        authEmail: resolved.authEmail,
        isFallback: resolved.isFallback,
      };
    }

    // 5. Success Confirmation
    const providerMessageId = mailResult.messageId;
    if (notificationId) {
      await serviceClient
        .from("application_notifications")
        .update({
          delivery_status: "SENT",
          recipient_email: destinationEmail,
          provider_message_id: providerMessageId,
          completed_at: new Date().toISOString(),
          error_message: null,
          safe_error_category: null,
        })
        .eq("id", notificationId);
    }

    await recordAuditEvent({
      actor: { role: "system" },
      action: "NOTIFICATION_DELIVERED",
      entityType: "notification",
      entityId: input.applicationId,
      entityReference: input.applicationReference,
      metadata: {
        notificationType: "REGISTRATION_RECEIPT",
        recipient: destinationEmail,
        authEmail: resolved.authEmail,
        isFallback: resolved.isFallback,
        providerMessageId,
      },
      outcome: "SUCCESS",
    });

    return {
      success: true,
      status: "sent",
      notificationId,
      providerMessageId,
      recipientEmail: destinationEmail,
      authEmail: resolved.authEmail,
      isFallback: resolved.isFallback,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      `[notification-service] Unexpected notification dispatch failure for ${input.applicationReference}:`,
      errorMsg
    );

    if (notificationId) {
      try {
        await serviceClient
          .from("application_notifications")
          .update({
            delivery_status: "FAILED",
            safe_error_category: "UNEXPECTED_ERROR",
            error_message: errorMsg,
          })
          .eq("id", notificationId);
      } catch {
        // Suppress secondary logging error
      }
    }

    return {
      success: false,
      status: "failed",
      notificationId,
      safeReason: "UNEXPECTED_ERROR",
    };
  }
}

/**
 * Retrieves the latest notification record for an application.
 * Accessible for server-side monitoring or staff dashboards.
 */
export async function getNotificationForApplication(
  applicationId: string,
  type?: string
): Promise<ApplicationNotificationRecord | null> {
  const serviceClient = getServiceRoleClient();
  let query = serviceClient
    .from("application_notifications")
    .select("*")
    .eq("application_id", applicationId);

  if (type) {
    query = query.eq("notification_type", type);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as ApplicationNotificationRecord;
}

/**
 * Sends an acceptance invitation email with a secure time-limited account activation link.
 * Strictly idempotent: will not send duplicate invitations for the same application lifecycle event.
 * Never throws — failures are recorded in public.application_notifications.
 */
export async function sendAcceptanceInvitation(
  input: SendAcceptanceInvitationInput,
  options?: NotificationOptions & { forceReissue?: boolean }
): Promise<NotificationSendResult> {
  const serviceClient = getServiceRoleClient();
  const baseIdempotencyKey = `acceptance_invitation_${input.applicationId}`;
  if (options?.forceReissue && !(await mayCreateFreshInvitation(input.applicationId, "ACCEPTANCE_INVITATION"))) {
    return { success: true, status: "already_sent", safeReason: "REISSUE_COOLDOWN" };
  }
  const idempotencyKey = options?.forceReissue
    ? `${baseIdempotencyKey}_${randomUUID()}`
    : baseIdempotencyKey;
  const now = new Date().toISOString();

  let notificationId: string | undefined;
  let attemptCount = 1;

  try {
    // 0. Recipient Resolution: Google email by default, university email as fallback
    let uniEmail = input.universityEmail || input.recipientEmail || "";
    let googleEmail = input.googleEmail;

    if ((!googleEmail || !uniEmail) && input.applicationId) {
      try {
        const { data: appData } = await serviceClient
          .from("applications")
          .select("university_email, google_email")
          .eq("id", input.applicationId)
          .maybeSingle();

        if (appData) {
          if (!uniEmail && appData.university_email) uniEmail = appData.university_email;
          if (googleEmail === undefined && appData.google_email !== undefined) {
            googleEmail = appData.google_email;
          }
        }
      } catch {
        // Fallback to input params
      }
    }

    const resolved = resolveNotificationRecipient({
      googleEmail,
      universityEmail: uniEmail,
    });
    const destinationEmail = resolved.recipientEmail;
    const cleanAuthEmail = resolved.authEmail;

    // 1. Idempotency Check
    const { data: existing, error: lookupErr } = await serviceClient
      .from("application_notifications")
      .select("id, delivery_status, attempt_count, provider_message_id")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (lookupErr) {
      console.error(
        `[notification-service] Failed to query acceptance invitation for ${input.applicationReference}:`,
        lookupErr.message
      );
    }

    if (existing) {
      notificationId = existing.id;
      attemptCount = (existing.attempt_count || 0) + 1;

      if (existing.delivery_status === "SENT" && !options?.forceReissue) {
        return {
          success: true,
          status: "already_sent",
          notificationId: existing.id,
          providerMessageId: existing.provider_message_id || undefined,
          recipientEmail: destinationEmail,
          authEmail: cleanAuthEmail,
          isFallback: resolved.isFallback,
        };
      }

      await serviceClient
        .from("application_notifications")
        .update({
          attempt_count: attemptCount,
          attempted_at: now,
          delivery_status: "PENDING",
          recipient_email: destinationEmail,
        })
        .eq("id", existing.id);
    } else {
      const { data: inserted, error: insertErr } = await serviceClient
        .from("application_notifications")
        .insert({
          application_id: input.applicationId,
          notification_type: "ACCEPTANCE_INVITATION",
          idempotency_key: idempotencyKey,
          recipient_email: destinationEmail,
          delivery_status: "PENDING",
          attempt_count: 1,
          attempted_at: now,
        })
        .select("id")
        .single();

      if (insertErr) {
        if (insertErr.code === "23505") {
          return {
            success: true,
            status: "already_sent",
            safeReason: "CONCURRENT_INVITATION_ATTEMPT",
            recipientEmail: destinationEmail,
            authEmail: cleanAuthEmail,
            isFallback: resolved.isFallback,
          };
        }
        console.error(
          `[notification-service] Failed to create invitation log for ${input.applicationReference}:`,
          insertErr.message
        );
      } else if (inserted) {
        notificationId = inserted.id;
      }
    }

    // 2. Generate Secure Activation Link via Supabase Auth Admin (Strictly for university email)
    const config = getEmailConfig();
    const redirectUrl = `${config.appBaseUrl}/auth/confirm?next=/student/activate`;

    let actionLink: string | null = null;
    let hashedToken: string | null = null;
    let verificationType = "invite";

    const linkRes = await serviceClient.auth.admin.generateLink({
      type: "invite",
      email: cleanAuthEmail,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (linkRes.error) {
      if (
        linkRes.error.message.includes("already been registered") ||
        linkRes.error.code === "email_exists"
      ) {
        // If user already exists, verify they aren't linked to a different application
        const { data: conflictingAccount } = await serviceClient
          .from("student_accounts")
          .select("application_id")
          .eq("university_email", cleanAuthEmail)
          .maybeSingle();

        if (conflictingAccount && conflictingAccount.application_id !== input.applicationId) {
          const errMsg = "Auth account already linked to another recruitment application.";
          if (notificationId) {
            await serviceClient
              .from("application_notifications")
              .update({
                delivery_status: "FAILED",
                safe_error_category: "ACCOUNT_CONFLICT",
                error_message: errMsg,
              })
              .eq("id", notificationId);
          }
          return {
            success: false,
            status: "failed",
            notificationId,
            safeReason: "ACCOUNT_CONFLICT",
            recipientEmail: destinationEmail,
            authEmail: cleanAuthEmail,
            isFallback: resolved.isFallback,
          };
        }

        // Account is unlinked or already belongs to this application: generate recovery link
        verificationType = "recovery";
        const recoveryRes = await serviceClient.auth.admin.generateLink({
          type: "recovery",
          email: cleanAuthEmail,
          options: {
            redirectTo: redirectUrl,
          },
        });

        if (recoveryRes.error) {
          throw new Error(`Failed to generate recovery link: ${recoveryRes.error.message}`);
        }

        actionLink = recoveryRes.data.properties.action_link;
        hashedToken = recoveryRes.data.properties.hashed_token;
      } else {
        throw new Error(`Failed to generate invitation link: ${linkRes.error.message}`);
      }
    } else {
      actionLink = linkRes.data.properties.action_link;
      hashedToken = linkRes.data.properties.hashed_token;
      verificationType = linkRes.data.properties.verification_type || "invite";
    }

    const activationUrl = hashedToken
      ? `${config.appBaseUrl}/auth/confirm?token_hash=${encodeURIComponent(hashedToken)}&type=${encodeURIComponent(verificationType)}&next=${encodeURIComponent("/student/activate")}`
      : actionLink;

    if (!activationUrl) {
      throw new Error("Unable to construct valid activation URL.");
    }

    // 3. Provider Configuration Check
    if (!isEmailProviderActive()) {
      if (notificationId) {
        await serviceClient
          .from("application_notifications")
          .update({
            delivery_status: "FAILED",
            safe_error_category: "PROVIDER_NOT_CONFIGURED",
            error_message:
              "Gmail SMTP credentials (GMAIL_USER, GMAIL_APP_PASSWORD) are not configured.",
          })
          .eq("id", notificationId);
      }
      return {
        success: false,
        status: "unconfigured",
        notificationId,
        safeReason: "PROVIDER_NOT_CONFIGURED",
        recipientEmail: destinationEmail,
        authEmail: cleanAuthEmail,
        isFallback: resolved.isFallback,
      };
    }

    // 3b. Provision student temporary password in Supabase Auth & enforce first-login password change
    const temporaryPassword = generateSecureTemporaryPassword(input.applicationReference);
    let studentAuthUserId: string | null = null;

    try {
      const { data: createdAuth, error: createAuthErr } = await serviceClient.auth.admin.createUser({
        email: cleanAuthEmail,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          university_email: cleanAuthEmail,
          application_reference: input.applicationReference,
        },
      });

      if (createAuthErr || !createdAuth?.user) {
        const isExistingUser =
          createAuthErr?.message?.toLowerCase().includes("already") ||
          (createAuthErr as { status?: number })?.status === 422;

        if (isExistingUser) {
          const { data: usersData } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const existingUser = usersData?.users?.find(
            (u) => u.email?.trim().toLowerCase() === cleanAuthEmail.trim().toLowerCase()
          );
          if (existingUser) {
            studentAuthUserId = existingUser.id;
            await serviceClient.auth.admin.updateUserById(existingUser.id, {
              password: temporaryPassword,
              email_confirm: true,
            });
          }
        }
      } else {
        studentAuthUserId = createdAuth.user.id;
      }

      if (studentAuthUserId && input.applicationId) {
        const issuedAt = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await serviceClient.from("student_accounts").upsert(
          {
            user_id: studentAuthUserId,
            application_id: input.applicationId,
            university_email: cleanAuthEmail,
            password_change_required: true,
            temp_password_issued_at: issuedAt,
            temp_password_expires_at: expiresAt,
            activated_at: issuedAt,
          },
          { onConflict: "user_id" }
        );

        await serviceClient
          .from("applications")
          .update({ user_id: studentAuthUserId, updated_at: issuedAt })
          .eq("id", input.applicationId);
      }
    } catch (authErr) {
      console.warn("[notification-service] Student credential provisioning notice:", authErr);
    }

    // 4. Render Acceptance Email
    const { subject, html, text } = renderAcceptanceInvitationEmail({
      fullName: input.fullName,
      referenceCode: input.applicationReference,
      primaryTrack: input.primaryTrack,
      activationUrl,
      loginUrl: `${config.appBaseUrl}/student/login`,
      temporaryPassword,
      expiresInHours: 24,
      authEmail: cleanAuthEmail,
      appBaseUrl: config.appBaseUrl,
    });

    // 5. Dispatch via Gmail SMTP to resolved personal recipient
    const mailResult = await sendMail({
      from: config.from,
      to: destinationEmail,
      subject,
      html,
      text,
    });

    if (!mailResult.success) {
      const safeReason = mailResult.safeCategory || "PROVIDER_ERROR";
      const safeMsg =
        mailResult.errorMessage || "Gmail SMTP delivery failed.";

      console.error(
        `[notification-service] Gmail SMTP dispatch failed for invitation to ${input.applicationReference}: ${safeReason}`
      );
      if (notificationId) {
        await serviceClient
          .from("application_notifications")
          .update({
            delivery_status: "FAILED",
            safe_error_category: safeReason,
            error_message: safeMsg,
          })
          .eq("id", notificationId);
      }

      await recordAuditEvent({
        actor: { role: "system" },
        action: "NOTIFICATION_FAILED",
        entityType: "notification",
        entityId: input.applicationId,
        entityReference: input.applicationReference,
        metadata: {
          notificationType: "ACCEPTANCE_INVITATION",
          recipient: destinationEmail,
          authEmail: cleanAuthEmail,
          isFallback: resolved.isFallback,
        },
        outcome: "FAILURE",
        errorCategory: safeReason,
      });

      return {
        success: false,
        status: "failed",
        notificationId,
        safeReason,
        recipientEmail: destinationEmail,
        authEmail: cleanAuthEmail,
        isFallback: resolved.isFallback,
      };
    }

    // 6. Success
    const providerMessageId = mailResult.messageId;
    if (notificationId) {
      await serviceClient
        .from("application_notifications")
        .update({
          delivery_status: "SENT",
          provider_message_id: providerMessageId,
          completed_at: new Date().toISOString(),
          error_message: null,
          safe_error_category: null,
        })
        .eq("id", notificationId);
    }

    await recordAuditEvent({
      actor: { role: "system" },
      action: "NOTIFICATION_DELIVERED",
      entityType: "notification",
      entityId: input.applicationId,
      entityReference: input.applicationReference,
      metadata: {
        notificationType: "ACCEPTANCE_INVITATION",
        recipient: destinationEmail,
        authEmail: cleanAuthEmail,
        isFallback: resolved.isFallback,
        providerMessageId,
        providerStatus: mailResult.status,
        deliveryConfirmed: false,
      },
      outcome: "SUCCESS",
    });

    return {
      success: true,
      status: "sent",
      notificationId,
      providerMessageId,
      recipientEmail: destinationEmail,
      authEmail: cleanAuthEmail,
      isFallback: resolved.isFallback,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      `[notification-service] Unexpected invitation dispatch failure for ${input.applicationReference}:`,
      errorMsg
    );

    if (notificationId) {
      try {
        await serviceClient
          .from("application_notifications")
          .update({
            delivery_status: "FAILED",
            safe_error_category: "UNEXPECTED_ERROR",
            error_message: errorMsg,
          })
          .eq("id", notificationId);
      } catch {
        // Suppress secondary logging error
      }
    }

    return {
      success: false,
      status: "failed",
      notificationId,
      safeReason: "UNEXPECTED_ERROR",
    };
  }
}

/**
 * Dispatches an account activation invitation to a shortlisted candidate.
 * Strictly idempotent: prevents duplicate notifications for the same shortlisted application.
 * Securely provisions a Supabase Auth invitation/recovery link with single-use / 24-hour expiry semantics.
 */
export async function sendShortlistedInvitation(
  input: SendShortlistedInvitationInput,
  options?: NotificationOptions & { forceReissue?: boolean }
): Promise<NotificationSendResult> {
  const serviceClient = getServiceRoleClient();
  const baseIdempotencyKey = `shortlisted_invitation_${input.applicationId}`;
  // A forced, staff-authorized reissue gets a new immutable notification row,
  // preserving prior SMTP attempts and audit history. The cooldown prevents a
  // click-loop from becoming an email relay.
  if (options?.forceReissue && !(await mayCreateFreshInvitation(input.applicationId, "SHORTLISTED_INVITATION"))) {
    return { success: true, status: "already_sent", safeReason: "REISSUE_COOLDOWN" };
  }
  const idempotencyKey = options?.forceReissue
    ? `${baseIdempotencyKey}_${randomUUID()}`
    : baseIdempotencyKey;
  const now = new Date().toISOString();

  let notificationId: string | undefined;
  let attemptCount = 1;

  try {
    // 0. Recipient Resolution: Google email by default, university email as fallback
    let uniEmail = input.universityEmail || input.recipientEmail || "";
    let googleEmail = input.googleEmail;

    if ((!googleEmail || !uniEmail) && input.applicationId) {
      try {
        const { data: appData } = await serviceClient
          .from("applications")
          .select("university_email, google_email")
          .eq("id", input.applicationId)
          .maybeSingle();

        if (appData) {
          if (!uniEmail && appData.university_email) uniEmail = appData.university_email;
          if (googleEmail === undefined && appData.google_email !== undefined) {
            googleEmail = appData.google_email;
          }
        }
      } catch {
        // Fallback to input params
      }
    }

    const resolved = resolveNotificationRecipient({
      googleEmail,
      universityEmail: uniEmail,
    });
    const destinationEmail = resolved.recipientEmail;
    const cleanAuthEmail = resolved.authEmail;

    // 1. Idempotency Check
    const { data: existing, error: lookupErr } = await serviceClient
      .from("application_notifications")
      .select("id, delivery_status, attempt_count, provider_message_id")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (lookupErr) {
      console.error(
        `[notification-service] Failed to query existing shortlisted invitation for ${input.applicationReference}:`,
        lookupErr.message
      );
    }

    if (existing) {
      notificationId = existing.id;
      attemptCount = (existing.attempt_count || 1) + 1;

      if (existing.delivery_status === "SENT" && !options?.forceReissue) {
        return {
          success: true,
          status: "already_sent",
          notificationId: existing.id,
          providerMessageId: existing.provider_message_id,
          recipientEmail: destinationEmail,
          authEmail: cleanAuthEmail,
          isFallback: resolved.isFallback,
        };
      }

      await serviceClient
        .from("application_notifications")
        .update({
          attempt_count: attemptCount,
          attempted_at: now,
          delivery_status: "PENDING",
          recipient_email: destinationEmail,
        })
        .eq("id", existing.id);
    } else {
      const { data: inserted, error: insertErr } = await serviceClient
        .from("application_notifications")
        .insert({
          application_id: input.applicationId,
          notification_type: "SHORTLISTED_INVITATION",
          idempotency_key: idempotencyKey,
          recipient_email: destinationEmail,
          delivery_status: "PENDING",
          attempt_count: 1,
          attempted_at: now,
        })
        .select("id")
        .single();

      if (insertErr) {
        if (insertErr.code === "23505") {
          return {
            success: true,
            status: "already_sent",
            safeReason: "CONCURRENT_INVITATION_ATTEMPT",
            recipientEmail: destinationEmail,
            authEmail: cleanAuthEmail,
            isFallback: resolved.isFallback,
          };
        }
        console.error(
          `[notification-service] Failed to create shortlisted invitation log for ${input.applicationReference}:`,
          insertErr.message
        );
      } else if (inserted) {
        notificationId = inserted.id;
      }
    }

    // 2. Generate Secure Activation Link via Supabase Auth Admin (Strictly bound to university email)
    const config = getEmailConfig();
    const redirectUrl = `${config.appBaseUrl}/auth/confirm?next=/student/activate`;

    let actionLink: string | null = null;
    let hashedToken: string | null = null;
    let verificationType = "invite";

    const linkRes = await serviceClient.auth.admin.generateLink({
      type: "invite",
      email: cleanAuthEmail,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (linkRes.error) {
      if (
        linkRes.error.message.includes("already been registered") ||
        linkRes.error.code === "email_exists"
      ) {
        // If user already exists, verify they aren't linked to a conflicting application
        const { data: conflictingAccount } = await serviceClient
          .from("student_accounts")
          .select("application_id")
          .eq("university_email", cleanAuthEmail)
          .maybeSingle();

        if (conflictingAccount && conflictingAccount.application_id !== input.applicationId) {
          const errMsg = "Auth account already linked to another recruitment application.";
          if (notificationId) {
            await serviceClient
              .from("application_notifications")
              .update({
                delivery_status: "FAILED",
                safe_error_category: "ACCOUNT_CONFLICT",
                error_message: errMsg,
              })
              .eq("id", notificationId);
          }
          return {
            success: false,
            status: "failed",
            notificationId,
            safeReason: "ACCOUNT_CONFLICT",
            recipientEmail: destinationEmail,
            authEmail: cleanAuthEmail,
            isFallback: resolved.isFallback,
          };
        }

        // Account is unlinked or already belongs to this application: generate recovery link
        verificationType = "recovery";
        const recoveryRes = await serviceClient.auth.admin.generateLink({
          type: "recovery",
          email: cleanAuthEmail,
          options: {
            redirectTo: redirectUrl,
          },
        });

        if (recoveryRes.error) {
          throw new Error(`Failed to generate recovery link: ${recoveryRes.error.message}`);
        }

        actionLink = recoveryRes.data.properties.action_link;
        hashedToken = recoveryRes.data.properties.hashed_token;
      } else {
        throw new Error(`Failed to generate invitation link: ${linkRes.error.message}`);
      }
    } else {
      actionLink = linkRes.data.properties.action_link;
      hashedToken = linkRes.data.properties.hashed_token;
      verificationType = linkRes.data.properties.verification_type || "invite";
    }

    const activationUrl = hashedToken
      ? `${config.appBaseUrl}/auth/confirm?token_hash=${encodeURIComponent(hashedToken)}&type=${encodeURIComponent(verificationType)}&next=${encodeURIComponent("/student/activate")}`
      : actionLink;

    if (!activationUrl) {
      throw new Error("Unable to construct valid activation URL.");
    }

    // 3. Provider Configuration Check
    if (!isEmailProviderActive()) {
      if (notificationId) {
        await serviceClient
          .from("application_notifications")
          .update({
            delivery_status: "FAILED",
            safe_error_category: "PROVIDER_NOT_CONFIGURED",
            error_message:
              "Gmail SMTP credentials (GMAIL_USER, GMAIL_APP_PASSWORD) are not configured.",
          })
          .eq("id", notificationId);
      }
      return {
        success: false,
        status: "unconfigured",
        notificationId,
        safeReason: "PROVIDER_NOT_CONFIGURED",
        recipientEmail: destinationEmail,
        authEmail: cleanAuthEmail,
        isFallback: resolved.isFallback,
      };
    }

    // 3b. Provision student temporary password in Supabase Auth & enforce first-login password change
    const temporaryPassword = generateSecureTemporaryPassword(input.applicationReference);
    let studentAuthUserId: string | null = null;

    try {
      const { data: createdAuth, error: createAuthErr } = await serviceClient.auth.admin.createUser({
        email: cleanAuthEmail,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          university_email: cleanAuthEmail,
          application_reference: input.applicationReference,
        },
      });

      if (createAuthErr || !createdAuth?.user) {
        const isExistingUser =
          createAuthErr?.message?.toLowerCase().includes("already") ||
          (createAuthErr as { status?: number })?.status === 422;

        if (isExistingUser) {
          const { data: usersData } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const existingUser = usersData?.users?.find(
            (u) => u.email?.trim().toLowerCase() === cleanAuthEmail.trim().toLowerCase()
          );
          if (existingUser) {
            studentAuthUserId = existingUser.id;
            await serviceClient.auth.admin.updateUserById(existingUser.id, {
              password: temporaryPassword,
              email_confirm: true,
            });
          }
        }
      } else {
        studentAuthUserId = createdAuth.user.id;
      }

      if (studentAuthUserId && input.applicationId) {
        const issuedAt = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await serviceClient.from("student_accounts").upsert(
          {
            user_id: studentAuthUserId,
            application_id: input.applicationId,
            university_email: cleanAuthEmail,
            password_change_required: true,
            temp_password_issued_at: issuedAt,
            temp_password_expires_at: expiresAt,
            activated_at: issuedAt,
          },
          { onConflict: "user_id" }
        );

        await serviceClient
          .from("applications")
          .update({ user_id: studentAuthUserId, updated_at: issuedAt })
          .eq("id", input.applicationId);
      }
    } catch (authErr) {
      console.warn("[notification-service] Student credential provisioning notice:", authErr);
    }

    // 4. Render Shortlisted Email Template
    const { subject, html, text } = renderShortlistedInvitationEmail({
      fullName: input.fullName,
      referenceCode: input.applicationReference,
      primaryTrack: input.primaryTrack,
      activationUrl,
      loginUrl: `${config.appBaseUrl}/student/login`,
      temporaryPassword,
      expiresInHours: 24,
      authEmail: cleanAuthEmail,
      appBaseUrl: config.appBaseUrl,
    });

    // 5. Dispatch via Gmail SMTP to resolved personal recipient
    const mailResult = await sendMail({
      from: config.from,
      to: destinationEmail,
      subject,
      html,
      text,
    });

    if (!mailResult.success) {
      const safeReason = mailResult.safeCategory || "PROVIDER_ERROR";
      const safeMsg =
        mailResult.errorMessage || "Gmail SMTP delivery failed.";

      console.error(
        `[notification-service] Gmail SMTP dispatch failed for shortlisted invitation to ${input.applicationReference}: ${safeReason}`
      );
      if (notificationId) {
        await serviceClient
          .from("application_notifications")
          .update({
            delivery_status: "FAILED",
            safe_error_category: safeReason,
            error_message: safeMsg,
          })
          .eq("id", notificationId);
      }

      await recordAuditEvent({
        actor: { role: "system" },
        action: "NOTIFICATION_FAILED",
        entityType: "notification",
        entityId: input.applicationId,
        entityReference: input.applicationReference,
        metadata: {
          notificationType: "SHORTLISTED_INVITATION",
          recipient: destinationEmail,
          authEmail: cleanAuthEmail,
          isFallback: resolved.isFallback,
        },
        outcome: "FAILURE",
        errorCategory: safeReason,
      });

      return {
        success: false,
        status: "failed",
        notificationId,
        safeReason,
        recipientEmail: destinationEmail,
        authEmail: cleanAuthEmail,
        isFallback: resolved.isFallback,
      };
    }

    // 6. Record Success
    const providerMessageId = mailResult.messageId;
    if (notificationId) {
      await serviceClient
        .from("application_notifications")
        .update({
          delivery_status: "SENT",
          provider_message_id: providerMessageId,
          completed_at: new Date().toISOString(),
          error_message: null,
          safe_error_category: null,
        })
        .eq("id", notificationId);
    }

    await recordAuditEvent({
      actor: { role: "system" },
      action: "NOTIFICATION_DELIVERED",
      entityType: "notification",
      entityId: input.applicationId,
      entityReference: input.applicationReference,
      metadata: {
        notificationType: "SHORTLISTED_INVITATION",
        recipient: destinationEmail,
        authEmail: cleanAuthEmail,
        isFallback: resolved.isFallback,
        providerMessageId,
        providerStatus: mailResult.status,
        deliveryConfirmed: false,
      },
      outcome: "SUCCESS",
    });

    return {
      success: true,
      status: "sent",
      notificationId,
      providerMessageId,
      recipientEmail: destinationEmail,
      authEmail: cleanAuthEmail,
      isFallback: resolved.isFallback,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      `[notification-service] Unexpected shortlisted invitation dispatch failure for ${input.applicationReference}:`,
      errorMsg
    );

    if (notificationId) {
      try {
        await serviceClient
          .from("application_notifications")
          .update({
            delivery_status: "FAILED",
            safe_error_category: "UNEXPECTED_ERROR",
            error_message: errorMsg,
          })
          .eq("id", notificationId);
      } catch {
        // Suppress secondary logging error
      }
    }

    return {
      success: false,
      status: "failed",
      notificationId,
      safeReason: "UNEXPECTED_ERROR",
    };
  }
}



/**
 * Sends an interview scheduling or rescheduling notification with confirmed appointment details.
 * Strictly idempotent: will not send duplicate notifications for the same confirmed schedule.
 * Does not invent fake dates or times — data must be sourced from the actual saved application record.
 */
export async function sendInterviewScheduled(
  input: SendInterviewScheduledInput
): Promise<NotificationSendResult> {
  const serviceClient = getServiceRoleClient();
  const scheduleSlug = `${input.interviewDate}_${input.interviewTime || "slot"}`.replace(/[^a-zA-Z0-9_-]/g, "_");
  const idempotencyKey = `interview_scheduled_${input.applicationId}_${scheduleSlug}`;
  const now = new Date().toISOString();

  let notificationId: string | undefined;
  let attemptCount = 1;

  try {
    // 0. Recipient Resolution: Google email by default, university email as fallback
    let uniEmail = input.universityEmail || input.recipientEmail || "";
    let googleEmail = input.googleEmail;

    if ((!googleEmail || !uniEmail) && input.applicationId) {
      try {
        const { data: appData } = await serviceClient
          .from("applications")
          .select("university_email, google_email")
          .eq("id", input.applicationId)
          .maybeSingle();

        if (appData) {
          if (!uniEmail && appData.university_email) uniEmail = appData.university_email;
          if (googleEmail === undefined && appData.google_email !== undefined) {
            googleEmail = appData.google_email;
          }
        }
      } catch {
        // Fallback to input params
      }
    }

    const resolved = resolveNotificationRecipient({
      googleEmail,
      universityEmail: uniEmail,
    });
    const destinationEmail = resolved.recipientEmail;
    const cleanAuthEmail = resolved.authEmail;

    // 1. Idempotency Check
    const { data: existing, error: lookupErr } = await serviceClient
      .from("application_notifications")
      .select("id, delivery_status, attempt_count, provider_message_id")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (lookupErr) {
      console.error(
        `[notification-service] Failed to query interview notification for ${input.applicationReference}:`,
        lookupErr.message
      );
    }

    if (existing) {
      notificationId = existing.id;
      attemptCount = (existing.attempt_count || 0) + 1;

      if (existing.delivery_status === "SENT") {
        return {
          success: true,
          status: "already_sent",
          notificationId: existing.id,
          providerMessageId: existing.provider_message_id || undefined,
          recipientEmail: destinationEmail,
          authEmail: cleanAuthEmail,
          isFallback: resolved.isFallback,
        };
      }

      await serviceClient
        .from("application_notifications")
        .update({
          attempt_count: attemptCount,
          attempted_at: now,
          delivery_status: "PENDING",
          recipient_email: destinationEmail,
        })
        .eq("id", existing.id);
    } else {
      const { data: inserted, error: insertErr } = await serviceClient
        .from("application_notifications")
        .insert({
          application_id: input.applicationId,
          notification_type: "INTERVIEW_SCHEDULED",
          idempotency_key: idempotencyKey,
          recipient_email: destinationEmail,
          delivery_status: "PENDING",
          attempt_count: 1,
          attempted_at: now,
        })
        .select("id")
        .single();

      if (insertErr) {
        if (insertErr.code === "23505") {
          return {
            success: true,
            status: "already_sent",
            safeReason: "CONCURRENT_NOTIFICATION_ATTEMPT",
            recipientEmail: destinationEmail,
            authEmail: cleanAuthEmail,
            isFallback: resolved.isFallback,
          };
        }
        console.error(
          `[notification-service] Failed to create interview notification log for ${input.applicationReference}:`,
          insertErr.message
        );
      } else if (inserted) {
        notificationId = inserted.id;
      }
    }

    // 2. Provider Configuration Check
    if (!isEmailProviderActive()) {
      if (notificationId) {
        await serviceClient
          .from("application_notifications")
          .update({
            delivery_status: "FAILED",
            safe_error_category: "PROVIDER_NOT_CONFIGURED",
            error_message:
              "Gmail SMTP credentials (GMAIL_USER, GMAIL_APP_PASSWORD) are not configured.",
          })
          .eq("id", notificationId);
      }
      return {
        success: false,
        status: "unconfigured",
        notificationId,
        safeReason: "PROVIDER_NOT_CONFIGURED",
        recipientEmail: destinationEmail,
        authEmail: cleanAuthEmail,
        isFallback: resolved.isFallback,
      };
    }

    // 3. Render Email Template
    const config = getEmailConfig();
    const { subject, html, text } = renderInterviewScheduledEmail({
      fullName: input.fullName,
      referenceCode: input.applicationReference,
      primaryTrack: input.primaryTrack,
      interviewDate: input.interviewDate,
      interviewTime: input.interviewTime,
      interviewLocation: input.interviewLocation,
      isRescheduled: input.isRescheduled,
      appBaseUrl: config.appBaseUrl,
    });

    // 4. Dispatch Email via Gmail SMTP to resolved personal recipient
    const mailResult = await sendMail({
      from: config.from,
      to: destinationEmail,
      subject,
      html,
      text,
    });

    if (!mailResult.success) {
      const safeReason = mailResult.safeCategory || "PROVIDER_ERROR";
      const safeMsg =
        mailResult.errorMessage || "Gmail SMTP delivery failed.";

      console.error(
        `[notification-service] Gmail SMTP dispatch failed for interview notification to ${input.applicationReference}: ${safeReason}`
      );
      if (notificationId) {
        await serviceClient
          .from("application_notifications")
          .update({
            delivery_status: "FAILED",
            safe_error_category: safeReason,
            error_message: safeMsg,
          })
          .eq("id", notificationId);
      }

      await recordAuditEvent({
        actor: { role: "system" },
        action: "NOTIFICATION_FAILED",
        entityType: "notification",
        entityId: input.applicationId,
        entityReference: input.applicationReference,
        metadata: {
          notificationType: "INTERVIEW_SCHEDULED",
          recipient: destinationEmail,
          authEmail: cleanAuthEmail,
          isFallback: resolved.isFallback,
        },
        outcome: "FAILURE",
        errorCategory: safeReason,
      });

      return {
        success: false,
        status: "failed",
        notificationId,
        safeReason,
        recipientEmail: destinationEmail,
        authEmail: cleanAuthEmail,
        isFallback: resolved.isFallback,
      };
    }

    // 5. Success
    const providerMessageId = mailResult.messageId;
    if (notificationId) {
      await serviceClient
        .from("application_notifications")
        .update({
          delivery_status: "SENT",
          provider_message_id: providerMessageId,
          completed_at: new Date().toISOString(),
          error_message: null,
          safe_error_category: null,
        })
        .eq("id", notificationId);
    }

    await recordAuditEvent({
      actor: { role: "system" },
      action: "NOTIFICATION_DELIVERED",
      entityType: "notification",
      entityId: input.applicationId,
      entityReference: input.applicationReference,
      metadata: {
        notificationType: "INTERVIEW_SCHEDULED",
        recipient: destinationEmail,
        authEmail: cleanAuthEmail,
        isFallback: resolved.isFallback,
        providerMessageId,
      },
      outcome: "SUCCESS",
    });

    return {
      success: true,
      status: "sent",
      notificationId,
      providerMessageId,
      recipientEmail: destinationEmail,
      authEmail: cleanAuthEmail,
      isFallback: resolved.isFallback,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      `[notification-service] Unexpected interview notification failure for ${input.applicationReference}:`,
      errorMsg
    );

    if (notificationId) {
      try {
        await serviceClient
          .from("application_notifications")
          .update({
            delivery_status: "FAILED",
            safe_error_category: "UNEXPECTED_ERROR",
            error_message: errorMsg,
          })
          .eq("id", notificationId);
      } catch {
        // Suppress secondary logging error
      }
    }

    return {
      success: false,
      status: "failed",
      notificationId,
      safeReason: "UNEXPECTED_ERROR",
    };
  }
}

export interface ProcessNotificationsResult {
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Outbox processor worker function.
 * Batches and sequentially processes pending notifications from public.application_notifications.
 * Paces requests to strictly adhere to Gmail SMTP daily quotas (500-2,000/day) and avoid connection exhaustion.
 */
export async function processPendingNotifications(
  options: { batchSize?: number; delayBetweenMs?: number } = {}
): Promise<ProcessNotificationsResult> {
  const batchSize = Math.min(100, Math.max(1, options.batchSize || 25));
  const delayBetweenMs = Math.max(0, options.delayBetweenMs ?? 250);
  const serviceClient = getServiceRoleClient();

  const { data: pending, error } = await serviceClient
    .from("application_notifications")
    .select("id, application_id, notification_type, recipient_email, attempt_count")
    .eq("delivery_status", "PENDING")
    .lt("attempt_count", 5)
    .order("created_at", { ascending: true })
    .limit(batchSize);

  if (error || !pending || pending.length === 0) {
    return { processed: 0, sent: 0, failed: 0, errors: error ? [error.message] : [] };
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const notif of pending) {
    try {
      const { data: app, error: appErr } = await serviceClient
        .from("applications")
        .select(
          "application_reference, full_name, academic_id, academic_year, department, primary_track, secondary_track, university_email, google_email, phone, whatsapp, experience_level, skills, experience_details, volunteer_experience, motivation, learning_goal, contribution, availability, interview_date, interview_time, interview_location"
        )
        .eq("id", notif.application_id)
        .maybeSingle();

      if (appErr || !app) {
        await serviceClient
          .from("application_notifications")
          .update({
            delivery_status: "FAILED",
            safe_error_category: "APPLICATION_NOT_FOUND",
            error_message: "Associated application record could not be found.",
          })
          .eq("id", notif.id);
        failed++;
        continue;
      }

      let res: NotificationSendResult;

      if (notif.notification_type === "ACCEPTANCE_INVITATION") {
        res = await sendAcceptanceInvitation({
          applicationId: notif.application_id,
          applicationReference: app.application_reference,
          universityEmail: app.university_email,
          googleEmail: app.google_email,
          recipientEmail: notif.recipient_email,
          fullName: app.full_name,
          primaryTrack: app.primary_track,
        });
      } else if (notif.notification_type === "SHORTLISTED_INVITATION") {
        res = await sendShortlistedInvitation({
          applicationId: notif.application_id,
          applicationReference: app.application_reference,
          universityEmail: app.university_email,
          googleEmail: app.google_email,
          recipientEmail: notif.recipient_email,
          fullName: app.full_name,
          primaryTrack: app.primary_track,
        });
      } else if (notif.notification_type === "INTERVIEW_SCHEDULED") {
        if (!app.interview_date) {
          await serviceClient
            .from("application_notifications")
            .update({
              delivery_status: "FAILED",
              safe_error_category: "MISSING_SCHEDULE_DATA",
              error_message: "Interview date has not been set for this candidate.",
            })
            .eq("id", notif.id);
          failed++;
          continue;
        }

        res = await sendInterviewScheduled({
          applicationId: notif.application_id,
          applicationReference: app.application_reference,
          universityEmail: app.university_email,
          googleEmail: app.google_email,
          recipientEmail: notif.recipient_email,
          fullName: app.full_name,
          primaryTrack: app.primary_track,
          interviewDate: app.interview_date,
          interviewTime: app.interview_time,
          interviewLocation: app.interview_location,
        });
      } else {
        // Default: REGISTRATION_RECEIPT with rich submitted fields
        res = await sendRegistrationReceipt(
          {
            applicationId: notif.application_id,
            applicationReference: app.application_reference,
            recipientEmail: notif.recipient_email,
            fullName: app.full_name,
            academicId: app.academic_id,
            academicYear: app.academic_year,
            department: app.department,
            primaryTrack: app.primary_track,
            secondaryTrack: app.secondary_track,
            universityEmail: app.university_email,
            googleEmail: app.google_email,
            phone: app.phone,
            whatsapp: app.whatsapp,
            experienceLevel: app.experience_level,
            skills: app.skills,
            experienceDetails: app.experience_details,
            volunteerExperience: app.volunteer_experience,
            motivation: app.motivation,
            learningGoal: app.learning_goal,
            contribution: app.contribution,
            availability: app.availability,
          },
          { dispatchMode: "sync", timeoutMs: 8000 }
        );
      }

      if (res.status === "sent" || res.status === "already_sent") {
        sent++;
      } else {
        failed++;
        if (res.safeReason) errors.push(res.safeReason);
      }

      if (delayBetweenMs > 0) {
        await new Promise((r) => setTimeout(r, delayBetweenMs));
      }
    } catch (procErr) {
      failed++;
      errors.push(procErr instanceof Error ? procErr.message : "Process error");
    }
  }

  return { processed: pending.length, sent, failed, errors };
}

export interface ReissueInvitationInput {
  applicationId: string;
  force?: boolean;
}

export interface ReissueInvitationResult {
  success: boolean;
  status: "sent" | "already_sent" | "unconfigured" | "failed";
  message: string;
  recipientEmail?: string;
  authEmail?: string;
  isFallback?: boolean;
  providerMessageId?: string | null;
  safeReason?: string | null;
}

/**
 * Owner/Admin authorized action to retry or reissue an activation invitation.
 * Sourced strictly from the actual saved application record.
 * Generates a fresh single-use Supabase Auth token and dispatches via Gmail SMTP.
 */
export async function reissueInvitation(
  input: ReissueInvitationInput
): Promise<ReissueInvitationResult> {
  const serviceClient = getServiceRoleClient();
  const { data: app, error } = await serviceClient
    .from("applications")
    .select("id, application_reference, full_name, primary_track, university_email, google_email, status, activated_at")
    .eq("id", input.applicationId)
    .maybeSingle();

  if (error || !app) {
    return {
      success: false,
      status: "failed",
      message: "Application not found.",
      safeReason: "APPLICATION_NOT_FOUND",
    };
  }

  if (app.status !== "SHORTLISTED" && app.status !== "ACCEPTED") {
    return {
      success: false,
      status: "failed",
      message: `Cannot reissue invitation for application with status ${app.status}. Only SHORTLISTED and ACCEPTED applications are eligible.`,
      safeReason: "INELIGIBLE_STATUS",
    };
  }

  const resolved = resolveNotificationRecipient({
    googleEmail: app.google_email,
    universityEmail: app.university_email,
  });

  let res: NotificationSendResult;
  if (app.status === "SHORTLISTED") {
    res = await sendShortlistedInvitation(
      {
        applicationId: app.id,
        applicationReference: app.application_reference,
        universityEmail: app.university_email,
        googleEmail: app.google_email,
        recipientEmail: resolved.recipientEmail,
        fullName: app.full_name,
        primaryTrack: app.primary_track,
      },
      { forceReissue: input.force ?? true }
    );
  } else {
    res = await sendAcceptanceInvitation(
      {
        applicationId: app.id,
        applicationReference: app.application_reference,
        universityEmail: app.university_email,
        googleEmail: app.google_email,
        recipientEmail: resolved.recipientEmail,
        fullName: app.full_name,
        primaryTrack: app.primary_track,
      },
      { forceReissue: input.force ?? true }
    );
  }

  const targetEmail = res.recipientEmail || resolved.recipientEmail;

  return {
    success: res.success,
    status: res.status === "pending" ? "failed" : res.status,
    recipientEmail: targetEmail,
    authEmail: res.authEmail || resolved.authEmail,
    isFallback: res.isFallback ?? resolved.isFallback,
    message: res.status === "sent"
      ? `SMTP accepted an activation invitation for ${targetEmail}.`
      : res.status === "already_sent"
      ? "An activation invitation was sent recently; reissue is temporarily rate-limited."
      : res.status === "unconfigured"
      ? "Gmail SMTP credentials are not configured on the server."
      : "Failed to dispatch email invitation.",
    providerMessageId: res.providerMessageId,
    safeReason: res.safeReason,
  };
}

