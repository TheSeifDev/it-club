import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../../../lib/auth/server.ts";
import {
  getApplicationById,
  updateApplicationStatus,
  saveReviewerNotes,
} from "../../../../../lib/admin/queries.ts";

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

      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      ok: true,
      application: result.application,
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
