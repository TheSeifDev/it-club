import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../../../lib/auth/server.ts";
import { lookupInterviewCandidateByQr } from "../../../../../lib/interviews/qr-service.ts";
import { parseQrRequestPayload, readBoundedJsonBody } from "../../../../../lib/interviews/request-validation.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // 1. Staff authentication enforcement (owner, admin, or interviewer)
  const auth = await verifyStaffApiRequest(request, ["owner", "admin", "interviewer"]);
  if (!auth.authorized || !auth.user || !auth.role) {
    return NextResponse.json(
      { error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  // 2. Parse a bounded request body and reject arrays, primitives, and malformed token types.
  const body = await readBoundedJsonBody(request, 4096);
  if (!body.ok) {
    return NextResponse.json(
      {
        error: body.code === "PAYLOAD_TOO_LARGE" ? "Request payload is too large." : "Invalid JSON request body.",
        code: body.code,
      },
      { status: body.code === "PAYLOAD_TOO_LARGE" ? 413 : 400 }
    );
  }

  const tokenPayload = parseQrRequestPayload(body.value);
  if (!tokenPayload.ok) {
    return NextResponse.json(
      {
        error: tokenPayload.code === "MISSING_TOKEN"
          ? "Interview QR token is required for lookup."
          : tokenPayload.code === "TOKEN_TOO_LONG"
            ? "Interview QR token exceeds the allowed length."
            : "Request body must be an object with a string QR token.",
        code: tokenPayload.code,
      },
      { status: tokenPayload.code === "TOKEN_TOO_LONG" ? 413 : 400 }
    );
  }

  // 3. Lookup candidate through trusted server-side service
  const result = await lookupInterviewCandidateByQr(
    tokenPayload.token,
    auth.user.id,
    auth.role,
    auth.staffMember?.committee
  );

  if (!result.success) {
    let httpStatus = 400;
    if (result.code === "INVALID_TOKEN") httpStatus = 404;
    if (result.code === "NOT_CHECKED_IN") httpStatus = 409; // Conflict: check-in prerequisite not met
    if (result.code === "COMMITTEE_SCOPE_DENIED") httpStatus = 403;
    if (result.code === "EXPIRED_TOKEN" || result.code === "REVOKED_TOKEN") httpStatus = 410;
    if (result.code === "INELIGIBLE_STATUS") httpStatus = 409;
    if (result.code === "DATABASE_ERROR") httpStatus = 503;

    return NextResponse.json(
      {
        error: result.error,
        code: result.code,
      },
      { status: httpStatus }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      code: "LOOKUP_SUCCESS",
      candidate: result.candidate,
      evaluation: result.evaluation,
      allEvaluations: result.allEvaluations,
      staffRole: auth.role,
    },
    { status: 200 }
  );
}
