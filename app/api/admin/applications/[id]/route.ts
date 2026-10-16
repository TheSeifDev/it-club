import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../../../lib/auth/server.ts";
import {
  getApplicationById,
  updateApplicationStatus,
  saveReviewerNotes,
} from "../../../../../lib/admin/queries.ts";
import {
  sendAcceptanceInvitation,
  sendShortlistedInvitation,
  sendInterviewScheduled,
} from "../../../../../lib/email/notification-service.ts";
import { recordAuditEvent } from "../../../../../lib/audit/service.ts";
import type { AuditActorRole } from "../../../../../lib/audit/types.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
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
  try {
    const application = await getApplicationById(id);
    if (!application) {
      return NextResponse.json(
        { error: "Applicant not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, application });
  } catch (err: unknown) {
    console.error("Failed to load application details:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Failed to load application.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

  interface ApplicationUpdatePayload {
    saveNotesOnly?: boolean;
    notes?: string;
    nextStatus?: string;
    expectedCurrentStatus?: string;
    reviewerNotes?: string;
    interviewDate?: string;
    interviewTime?: string;
    interviewLocation?: string;
  }

  let body: ApplicationUpdatePayload;
  try {
    body = (await request.json()) as ApplicationUpdatePayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body.", code: "MALFORMED_JSON" },
      { status: 400 }
    );
  }

  // If request is strictly saving reviewer notes
  if (body.saveNotesOnly) {
    if (typeof body.notes !== "string") {
      return NextResponse.json(
        { error: "Notes content is required.", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const saveRes = await saveReviewerNotes({
      id,
      notes: body.notes,
      reviewerUserId: auth.user!.id,
    });

    if (!saveRes.success) {
      return NextResponse.json(
        { error: saveRes.error || "Failed to save reviewer notes.", code: "DATABASE_ERROR" },
        { status: 500 }
      );
    }

    await recordAuditEvent({
      actor: {
        id: auth.user!.id,
        email: auth.user!.email,
        role: auth.role as AuditActorRole,
      },
      action: "APPLICATION_REVIEW_NOTE_UPDATED",
      entityType: "application",
      entityId: id,
      metadata: {
        noteLength: body.notes.length,
      },
      outcome: "SUCCESS",
    });

    return NextResponse.json({ ok: true, message: "Reviewer notes saved successfully." });
  }

  // Status transition update
  if (!body.nextStatus) {
    return NextResponse.json(
      { error: "Next status must be provided.", code: "INVALID_INPUT" },
      { status: 400 }
    );
  }

  try {
    const result = await updateApplicationStatus({
      id,
      nextStatus: body.nextStatus,
      reviewerNotes: body.reviewerNotes,
      reviewerUserId: auth.user!.id,
      expectedCurrentStatus: body.expectedCurrentStatus,
      interviewDate: body.interviewDate,
      interviewTime: body.interviewTime,
      interviewLocation: body.interviewLocation,
    });

    if (!result.success) {
      const statusCode =
        result.code === "CONFLICT"
          ? 409
          : result.code === "NOT_FOUND"
          ? 404
          : result.code === "INVALID_TRANSITION" || result.code === "INVALID_STATUS"
          ? 400
          : 500;

      await recordAuditEvent({
        actor: {
          id: auth.user!.id,
          email: auth.user!.email,
          role: auth.role as AuditActorRole,
        },
        action: "APPLICATION_STATUS_UPDATED",
        entityType: "application",
        entityId: id,
        newStatus: body.nextStatus,
        outcome: "FAILURE",
        errorCategory: result.code,
      });

      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: statusCode }
      );
    }

    // Record successful status change
    await recordAuditEvent({
      actor: {
        id: auth.user!.id,
        email: auth.user!.email,
        role: auth.role as AuditActorRole,
      },
      action: "APPLICATION_STATUS_UPDATED",
      entityType: "application",
      entityId: result.application!.id,
      entityReference: result.application!.application_reference,
      previousStatus: result.previousStatus,
      newStatus: result.application!.status,
      metadata: {
        hasReviewerNotes: Boolean(body.reviewerNotes?.trim()),
        track: result.application!.primary_track,
      },
      outcome: "SUCCESS",
    });

    let invitationDelivery: { status: string; message: string } | undefined;
    let interviewDelivery: { status: string; message: string } | undefined;
    let shortlistDelivery: { status: string; message: string } | undefined;

    // Trigger shortlisted invitation ONLY when transitioned to SHORTLISTED
    if (
      result.application?.status === "SHORTLISTED" &&
      result.previousStatus !== "SHORTLISTED"
    ) {
      try {
        const shortRes = await sendShortlistedInvitation({
          applicationId: result.application.id,
          applicationReference: result.application.application_reference,
          universityEmail: result.application.university_email,
          googleEmail: result.application.google_email,
          recipientEmail: result.application.google_email || result.application.university_email,
          fullName: result.application.full_name,
          primaryTrack: result.application.primary_track,
        });

        if (shortRes.status === "sent") {
          shortlistDelivery = {
            status: "sent",
            message: `Gmail SMTP accepted the shortlisted invitation for ${shortRes.recipientEmail || result.application.google_email || result.application.university_email}. This does not confirm receipt or opening.`,
          };
        } else if (shortRes.status === "already_sent") {
          shortlistDelivery = {
            status: "already_sent",
            message: "Shortlisted notification was previously sent.",
          };
        } else if (shortRes.status === "unconfigured") {
          shortlistDelivery = {
            status: "unconfigured",
            message: "Email provider unconfigured. Notification queued.",
          };
        } else {
          shortlistDelivery = {
            status: "failed",
            message: "Notification delivery queued or delayed.",
          };
        }
      } catch (shortErr: unknown) {
        console.error(
          "Shortlisted invitation dispatch failed:",
          shortErr instanceof Error ? shortErr.message : shortErr
        );
        shortlistDelivery = {
          status: "failed",
          message: "Notification delivery encountered an unexpected error.",
        };
      }
    }

    // Trigger acceptance invitation ONLY when transitioned to ACCEPTED
    if (
      result.application?.status === "ACCEPTED" &&
      result.previousStatus !== "ACCEPTED"
    ) {
      try {
        const invRes = await sendAcceptanceInvitation({
          applicationId: result.application.id,
          applicationReference: result.application.application_reference,
          universityEmail: result.application.university_email,
          googleEmail: result.application.google_email,
          recipientEmail: result.application.google_email || result.application.university_email,
          fullName: result.application.full_name,
          primaryTrack: result.application.primary_track,
        });

        if (invRes.status === "sent") {
          invitationDelivery = {
            status: "sent",
            message: `Gmail SMTP accepted the acceptance invitation for ${invRes.recipientEmail || result.application.google_email || result.application.university_email}. This does not confirm receipt or opening.`,
          };
        } else if (invRes.status === "already_sent") {
          invitationDelivery = {
            status: "already_sent",
            message: "Acceptance invitation was previously sent.",
          };
        } else if (invRes.status === "unconfigured") {
          invitationDelivery = {
            status: "unconfigured",
            message: "Email provider unconfigured. Invitation queued.",
          };
        } else {
          invitationDelivery = {
            status: "failed",
            message: "Invitation delivery queued or delayed.",
          };
        }
      } catch (invErr: unknown) {
        console.error(
          "Acceptance invitation dispatch failed:",
          invErr instanceof Error ? invErr.message : invErr
        );
        invitationDelivery = {
          status: "failed",
          message: "Invitation delivery encountered an unexpected error.",
        };
      }
    }

    // Trigger interview notification when transitioned to INTERVIEW_SCHEDULED with real saved schedule
    if (
      result.application?.status === "INTERVIEW_SCHEDULED" &&
      result.application.interview_date
    ) {
      try {
        const isRescheduled = result.previousStatus === "INTERVIEW_SCHEDULED";
        const intRes = await sendInterviewScheduled({
          applicationId: result.application.id,
          applicationReference: result.application.application_reference,
          universityEmail: result.application.university_email,
          googleEmail: result.application.google_email,
          recipientEmail: result.application.google_email || result.application.university_email,
          fullName: result.application.full_name,
          primaryTrack: result.application.primary_track,
          interviewDate: result.application.interview_date,
          interviewTime: result.application.interview_time,
          interviewLocation: result.application.interview_location,
          isRescheduled,
        });

        if (intRes.status === "sent") {
          interviewDelivery = {
            status: "sent",
            message: isRescheduled
              ? "Interview rescheduling notice dispatched."
              : "Interview appointment confirmation dispatched.",
          };
        } else if (intRes.status === "already_sent") {
          interviewDelivery = {
            status: "already_sent",
            message: "Interview notification was previously sent for this schedule.",
          };
        } else if (intRes.status === "unconfigured") {
          interviewDelivery = {
            status: "unconfigured",
            message: "Email provider unconfigured. Notification queued.",
          };
        } else {
          interviewDelivery = {
            status: "failed",
            message: "Interview notification delivery queued or delayed.",
          };
        }
      } catch (intErr: unknown) {
        console.error(
          "Interview notification dispatch failed:",
          intErr instanceof Error ? intErr.message : intErr
        );
        interviewDelivery = {
          status: "failed",
          message: "Interview notification encountered an unexpected error.",
        };
      }
    }

    return NextResponse.json({
      ok: true,
      application: result.application,
      invitationDelivery,
      interviewDelivery,
      shortlistDelivery,
      message: `Application status updated to ${result.application?.status}.`,
    });
  } catch (err: unknown) {
    console.error("Failed to update application decision:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Failed to persist application decision.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
