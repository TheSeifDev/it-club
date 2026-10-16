import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../../../lib/auth/server.ts";
import { lookupInterviewCandidateByQr } from "../../../../../lib/interviews/qr-service.ts";

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

  // 2. Parse request body
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body.", code: "MALFORMED_JSON" },
      { status: 400 }
    );
  }

  const rawToken = body.token?.trim();
  if (!rawToken) {
    return NextResponse.json(
      { error: "Interview QR token is required for lookup.", code: "MISSING_TOKEN" },
      { status: 400 }
    );
  }

  // 3. Lookup candidate through trusted server-side service
  const result = await lookupInterviewCandidateByQr(rawToken, auth.user.id, auth.role);

  if (!result.success) {
    let httpStatus = 400;
    if (result.code === "INVALID_TOKEN") httpStatus = 404;
    if (result.code === "NOT_CHECKED_IN") httpStatus = 409; // Conflict: check-in prerequisite not met

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
