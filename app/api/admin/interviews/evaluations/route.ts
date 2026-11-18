import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../../../lib/auth/server.ts";
import {
  saveInterviewEvaluation,
} from "../../../../../lib/interviews/qr-service.ts";
import { getServiceRoleClient } from "../../../../../lib/auth/service-role.ts";
import { verifyEvaluationTarget } from "../../../../../lib/interviews/security.ts";
import {
  parseInterviewEvaluationPayload,
  readBoundedJsonBody,
} from "../../../../../lib/interviews/request-validation.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // 1. Staff authorization (owner, admin, interviewer)
  const auth = await verifyStaffApiRequest(request, ["owner", "admin", "interviewer"]);
  if (!auth.authorized || !auth.user || !auth.role) {
    return NextResponse.json(
      { error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  // 2. Parse a bounded JSON object and validate each field before use.
  const body = await readBoundedJsonBody(request, 64 * 1024);
  if (!body.ok) {
    return NextResponse.json(
      {
        error: body.code === "PAYLOAD_TOO_LARGE" ? "Request payload is too large." : "Invalid JSON request body.",
        code: body.code,
      },
      { status: body.code === "PAYLOAD_TOO_LARGE" ? 413 : 400 }
    );
  }

  const parsedPayload = parseInterviewEvaluationPayload(body.value);
  if (!parsedPayload.ok) {
    return NextResponse.json(
      { error: `Invalid evaluation request: ${parsedPayload.code}.`, code: parsedPayload.code },
      { status: parsedPayload.code.endsWith("TOO_LONG") ? 413 : 400 }
    );
  }
  const { applicationId, evaluationNotes, rating, recommendation } = parsedPayload.payload;

  const targetAccess = await verifyEvaluationTarget({
    applicationId,
    role: auth.role,
    assignedCommittee: auth.staffMember?.committee,
  });
  if (!targetAccess.allowed) {
    return NextResponse.json(
      { error: targetAccess.error, code: targetAccess.code },
      { status: targetAccess.status }
    );
  }

  // 3. Save or update evaluation
  const result = await saveInterviewEvaluation({
    applicationId,
    interviewerId: auth.user.id,
    interviewerRole: auth.role,
    evaluationNotes,
    rating,
    recommendation,
  });

  if (!result.success) {
    const status = result.code === "INVALID_RATING" ? 400 : 500;
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      code: "EVALUATION_SAVED",
      evaluation: result.evaluation,
    },
    { status: 200 }
  );
}

export async function GET(request: Request) {
  const auth = await verifyStaffApiRequest(request, ["owner", "admin", "interviewer"]);
  if (!auth.authorized || !auth.user || !auth.role) {
    return NextResponse.json(
      { error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  const currentUserId = auth.user.id;
  const currentRole = auth.role;

  const url = new URL(request.url);
  const applicationId = url.searchParams.get("applicationId")?.trim();

  if (!applicationId) {
    return NextResponse.json(
      { error: "applicationId query parameter is required.", code: "MISSING_APPLICATION_ID" },
      { status: 400 }
    );
  }

  const targetAccess = await verifyEvaluationTarget({
    applicationId,
    role: currentRole,
    assignedCommittee: auth.staffMember?.committee,
  });
  if (!targetAccess.allowed) {
    return NextResponse.json(
      { error: targetAccess.error, code: targetAccess.code },
      { status: targetAccess.status }
    );
  }

  const serviceClient = getServiceRoleClient();

  // If interviewer, strictly select their own evaluation
  if (currentRole === "interviewer") {
    const { data: evaluation, error } = await serviceClient
      .from("interview_evaluations")
      .select("id, application_id, interviewer_id, evaluation_notes, rating, recommendation, created_at, updated_at")
      .eq("application_id", applicationId)
      .eq("interviewer_id", currentUserId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message, code: "DATABASE_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        evaluation: evaluation
          ? {
              id: evaluation.id,
              applicationId: evaluation.application_id,
              interviewerId: evaluation.interviewer_id,
              evaluationNotes: evaluation.evaluation_notes,
              rating: evaluation.rating,
              recommendation: evaluation.recommendation,
              createdAt: evaluation.created_at,
              updatedAt: evaluation.updated_at,
            }
          : null,
      },
      { status: 200 }
    );
  }

  // If owner or admin, return all evaluations for the candidate
  const { data: evaluations, error } = await serviceClient
    .from("interview_evaluations")
    .select("id, application_id, interviewer_id, evaluation_notes, rating, recommendation, created_at, updated_at")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: error.message, code: "DATABASE_ERROR" },
      { status: 500 }
    );
  }

  const myEval = evaluations?.find((e) => e.interviewer_id === currentUserId);

  return NextResponse.json(
    {
      ok: true,
      evaluation: myEval
        ? {
            id: myEval.id,
            applicationId: myEval.application_id,
            interviewerId: myEval.interviewer_id,
            evaluationNotes: myEval.evaluation_notes,
            rating: myEval.rating,
            recommendation: myEval.recommendation,
            createdAt: myEval.created_at,
            updatedAt: myEval.updated_at,
          }
        : null,
      allEvaluations: (evaluations || []).map((e) => ({
        id: e.id,
        applicationId: e.application_id,
        interviewerId: e.interviewer_id,
        evaluationNotes: e.evaluation_notes,
        rating: e.rating,
        recommendation: e.recommendation,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
      })),
    },
    { status: 200 }
  );
}
