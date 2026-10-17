import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../../../lib/auth/server.ts";
import { getEmailConfig, isEmailConfigured } from "../../../../../lib/email/config.ts";
import {
  getTransporter,
  sendMail,
  classifySmtpError,
  maskEmail,
  isValidEmailAddress,
} from "../../../../../lib/email/mailer.ts";
import { checkRateLimit } from "../../../../../lib/security/rate-limiter.ts";
import { recordAuditEvent } from "../../../../../lib/audit/service.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // 1. Strict Owner role enforcement
  const auth = await verifyStaffApiRequest(request, ["owner"]);
  if (!auth.authorized || !auth.user || auth.role !== "owner") {
    return NextResponse.json(
      {
        error: auth.error || "Only the IT Club Owner can run email diagnostics.",
        code: auth.code || "FORBIDDEN",
      },
      {
        status: auth.status || 403,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }

  // 2. Rate limit (at most 5 runs per 10 minutes per Owner)
  const rl = await checkRateLimit(`email_diag_${auth.user.id}`, {
    maxRequests: 5,
    windowSeconds: 600,
    prefix: "diag",
  });

  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: "Too many email diagnostic checks. Please wait before retrying.",
        code: "RATE_LIMITED",
        retryAfter: rl.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.retryAfter),
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }

  const ownerEmail = auth.user.email?.trim().toLowerCase();
  if (!ownerEmail || !isValidEmailAddress(ownerEmail)) {
    return NextResponse.json(
      {
        error: "Authenticated Owner account does not have a valid email address.",
        code: "INVALID_OWNER_EMAIL",
      },
      {
        status: 400,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }

  // 3. Configuration check (never return passwords or tokens)
  const config = getEmailConfig();
  const configured = isEmailConfigured();

  // 4. Transporter verification
  let verified = false;
  let verifyErrorCategory: string | undefined;
  let verifyErrorMessage: string | undefined;

  const transporter = getTransporter();
  if (configured && transporter) {
    try {
      await transporter.verify();
      verified = true;
    } catch (err) {
      verified = false;
      const classified = classifySmtpError(err);
      verifyErrorCategory = classified.safeCategory;
      verifyErrorMessage = classified.safeMessage;
    }
  }

  // 5. Test email to authenticated Owner ONLY (No arbitrary recipients allowed)
  let testEmailResult = null;
  if (configured && verified) {
    const dispatchResult = await sendMail({
      to: ownerEmail,
      subject: "IT Club — Owner Email Diagnostics",
      text: "IT Club Owner email diagnostic test. This message verifies operational SMTP delivery to your mailbox.",
      html: "<p><strong>IT Club Recruitment</strong></p><p>Owner email diagnostic test. This message verifies operational SMTP delivery to your mailbox.</p>",
    });

    testEmailResult = {
      recipient: maskEmail(ownerEmail),
      sent: dispatchResult.success,
      status: dispatchResult.status,
      messageId: dispatchResult.messageId,
      response: dispatchResult.response,
      error: dispatchResult.errorMessage,
    };
  }

  // 6. Record audit event
  await recordAuditEvent({
    action: "ADMIN_EMAIL_DIAGNOSTICS_RUN",
    entityType: "staff_member",
    entityId: auth.user.id,
    entityReference: ownerEmail,
    actor: {
      id: auth.user.id,
      email: ownerEmail,
      role: "owner",
    },
    outcome: verified && testEmailResult?.sent ? "SUCCESS" : "FAILURE",
    errorCategory: verifyErrorCategory || testEmailResult?.error ? "PROVIDER_ERROR" : undefined,
    metadata: {
      configured,
      verified,
      testRecipient: maskEmail(ownerEmail),
      testStatus: testEmailResult?.status,
      messageId: testEmailResult?.messageId,
      response: testEmailResult?.response,
    },
  });

  return NextResponse.json(
    {
      success: configured && verified && Boolean(testEmailResult?.sent),
      configured,
      verified,
      verifyError: verifyErrorMessage,
      testEmail: testEmailResult,
      settings: {
        provider: "gmail-smtp",
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        secure: config.secure,
        from: config.from,
        appBaseUrl: config.appBaseUrl,
      },
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
