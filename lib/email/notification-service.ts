import { getServiceRoleClient } from "../auth/service-role.ts";
import { getEmailConfig } from "./config.ts";
import { sendMail, isEmailProviderActive } from "./mailer.ts";
import { renderRegistrationReceiptEmail } from "./templates/registration-receipt.ts";
import { renderAcceptanceInvitationEmail } from "./templates/acceptance-invitation.ts";
import { renderInterviewScheduledEmail } from "./templates/interview-scheduled.ts";
import { recordAuditEvent } from "../audit/service.ts";

export interface SendRegistrationReceiptInput {
  applicationId: string;
  applicationReference: string;
  recipientEmail: string;
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
  recipientEmail: string;
  fullName: string;
  primaryTrack: string;
}

export interface SendInterviewScheduledInput {
  applicationId: string;
  applicationReference: string;
  recipientEmail: string;
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
    // 1. Idempotency Check: lookup existing notification record
    const { data: existing, error: lookupErr } = await serviceClient
      .from("application_notifications")
      .select("id, delivery_status, attempt_count, provider_message_id")
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
        };
      }

      // Update attempt count and timestamp
      await serviceClient
        .from("application_notifications")
        .update({
          attempt_count: attemptCount,
          attempted_at: now,
          delivery_status: "PENDING",
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
          recipient_email: input.recipientEmail.trim().toLowerCase(),
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

    // 2. Check if outbox queue mode is active (non-blocking delivery for burst readiness)
    const isQueueMode =
      options?.dispatchMode === "queue" ||
      process.env.EMAIL_DELIVERY_MODE === "outbox" ||
      process.env.BURST_MODE === "true";

    if (isQueueMode) {
      return {
        success: true,
        status: "pending",
        notificationId,
        safeReason: "QUEUED_FOR_OUTBOX_DELIVERY",
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
      universityEmail: input.universityEmail || input.recipientEmail,
      googleEmail: input.googleEmail,
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
        to: input.recipientEmail.trim().toLowerCase(),
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
          recipient: input.recipientEmail.trim().toLowerCase(),
        },
        outcome: "FAILURE",
        errorCategory: safeReason,
      });

      return {
        success: false,
        status: "failed",
        notificationId,
        safeReason,
      };
    }

    // 5. Success Confirmation
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
        notificationType: "REGISTRATION_RECEIPT",
        recipient: input.recipientEmail.trim().toLowerCase(),
        providerMessageId,
      },
      outcome: "SUCCESS",
    });

    return {
      success: true,
      status: "sent",
      notificationId,
      providerMessageId,
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
  input: SendAcceptanceInvitationInput
): Promise<NotificationSendResult> {
  const serviceClient = getServiceRoleClient();
  const idempotencyKey = `acceptance_invitation_${input.applicationId}`;
  const now = new Date().toISOString();

  let notificationId: string | undefined;
  let attemptCount = 1;

  try {
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

      if (existing.delivery_status === "SENT") {
        return {
          success: true,
          status: "already_sent",
          notificationId: existing.id,
          providerMessageId: existing.provider_message_id || undefined,
        };
      }

      await serviceClient
        .from("application_notifications")
        .update({
          attempt_count: attemptCount,
          attempted_at: now,
          delivery_status: "PENDING",
        })
        .eq("id", existing.id);
    } else {
      const { data: inserted, error: insertErr } = await serviceClient
        .from("application_notifications")
        .insert({
          application_id: input.applicationId,
          notification_type: "ACCEPTANCE_INVITATION",
          idempotency_key: idempotencyKey,
          recipient_email: input.recipientEmail.trim().toLowerCase(),
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

    // 2. Generate Secure Activation Link via Supabase Auth Admin
    const config = getEmailConfig();
    const cleanEmail = input.recipientEmail.trim().toLowerCase();
    const redirectUrl = `${config.appBaseUrl}/auth/confirm?next=/student/activate`;

    let actionLink: string | null = null;
    let hashedToken: string | null = null;
    let verificationType = "invite";

    const linkRes = await serviceClient.auth.admin.generateLink({
      type: "invite",
      email: cleanEmail,
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
          .eq("university_email", cleanEmail)
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
          };
        }

        // Account is unlinked or already belongs to this application: generate recovery link
        verificationType = "recovery";
        const recoveryRes = await serviceClient.auth.admin.generateLink({
          type: "recovery",
          email: cleanEmail,
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
      };
    }

    // 4. Render Acceptance Email
    const { subject, html, text } = renderAcceptanceInvitationEmail({
      fullName: input.fullName,
      referenceCode: input.applicationReference,
      primaryTrack: input.primaryTrack,
      activationUrl,
      appBaseUrl: config.appBaseUrl,
    });

    // 5. Dispatch via Gmail SMTP
    const mailResult = await sendMail({
      from: config.from,
      to: cleanEmail,
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
          recipient: cleanEmail,
        },
        outcome: "FAILURE",
        errorCategory: safeReason,
      });

      return {
        success: false,
        status: "failed",
        notificationId,
        safeReason,
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
        recipient: cleanEmail,
        providerMessageId,
      },
      outcome: "SUCCESS",
    });

    return {
      success: true,
      status: "sent",
      notificationId,
      providerMessageId,
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
        };
      }

      await serviceClient
        .from("application_notifications")
        .update({
          attempt_count: attemptCount,
          attempted_at: now,
          delivery_status: "PENDING",
        })
        .eq("id", existing.id);
    } else {
      const { data: inserted, error: insertErr } = await serviceClient
        .from("application_notifications")
        .insert({
          application_id: input.applicationId,
          notification_type: "INTERVIEW_SCHEDULED",
          idempotency_key: idempotencyKey,
          recipient_email: input.recipientEmail.trim().toLowerCase(),
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

    // 4. Dispatch Email via Gmail SMTP
    const mailResult = await sendMail({
      from: config.from,
      to: input.recipientEmail.trim().toLowerCase(),
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
          recipient: input.recipientEmail.trim().toLowerCase(),
        },
        outcome: "FAILURE",
        errorCategory: safeReason,
      });

      return {
        success: false,
        status: "failed",
        notificationId,
        safeReason,
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
        recipient: input.recipientEmail.trim().toLowerCase(),
        providerMessageId,
      },
      outcome: "SUCCESS",
    });

    return {
      success: true,
      status: "sent",
      notificationId,
      providerMessageId,
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

