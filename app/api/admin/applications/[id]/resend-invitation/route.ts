import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../../../../lib/auth/server.ts";
import { getApplicationById } from "../../../../../../lib/admin/queries.ts";
import { requireApplicationCommitteeAccess } from "../../../../../../lib/auth/committee-access.ts";
import { reissueInvitation } from "../../../../../../lib/email/notification-service.ts";
import { recordAuditEvent } from "../../../../../../lib/audit/service.ts";
import type { AuditActorRole } from "../../../../../../lib/audit/types.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Owner/Admin authorized endpoint to retry or reissue an activation invitation.
 * Sourced strictly from the actual saved application record.
 * Generates a fresh single-use Supabase Auth token and dispatches via Gmail SMTP.
 * Never exposes invitation tokens or credentials to clients.
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await verifyStaffApiRequest(request, ["owner", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  const { id } = await props.params;

  let body: { force?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // Optional request body
  }

  const force = body.force !== false; // defaults to true on explicit admin reissue request

  const application = await getApplicationById(id);
  if (!application) {
    return NextResponse.json(
      { error: "Applicant not found.", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const access = await requireApplicationCommitteeAccess(
    application.application_reference,
    application.primary_track,
    "REISSUE_INVITATION"
  );
  if (!access.allowed) {
    return NextResponse.json(
      { error: access.error, code: access.code },
      { status: access.status || 403 }
    );
  }

  // Enforce status eligibility
  if (application.status !== "SHORTLISTED" && application.status !== "ACCEPTED") {
    return NextResponse.json(
      {
        error: `Cannot reissue invitation for application with status ${application.status}. Only SHORTLISTED and ACCEPTED applications are eligible.`,
        code: "INELIGIBLE_STATUS",
      },
      { status: 400 }
    );
  }

  // Record audit event for attempt
  await recordAuditEvent({
    actor: {
      id: auth.user!.id,
      email: auth.user!.email,
      role: auth.role as AuditActorRole,
    },
    action: "NOTIFICATION_ATTEMPTED",
    entityType: "application",
    entityId: application.id,
    entityReference: application.application_reference,
    outcome: "SUCCESS",
    metadata: {
      action: "REISSUE_INVITATION",
      notificationType:
        application.status === "SHORTLISTED"
          ? "SHORTLISTED_INVITATION"
          : "ACCEPTANCE_INVITATION",
      recipient: application.google_email || application.university_email,
      authEmail: application.university_email,
      force,
    },
  });

  const result = await reissueInvitation({
    applicationId: application.id,
    force,
  });

  if (!result.success && result.status !== "already_sent") {
    return NextResponse.json(
      {
        ok: false,
        status: result.status,
        safeReason: result.safeReason,
        error: result.message,
      },
      { status: result.status === "unconfigured" ? 503 : 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    status: result.status,
    message: result.message,
    recipientEmail: result.recipientEmail || application.google_email || application.university_email,
    authEmail: result.authEmail || application.university_email,
    isFallback: result.isFallback,
    providerMessageId: result.providerMessageId || undefined,
  });
}
