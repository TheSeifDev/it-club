import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../../../lib/auth/server.ts";
import { verifyAndCheckInInterviewQr } from "../../../../../lib/interviews/qr-service.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // 1. Staff authentication enforcement
  const auth = await verifyStaffApiRequest(request, ["owner", "admin"]);
  if (!auth.authorized || !auth.user) {
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
      { error: "Interview QR token is required for check-in.", code: "MISSING_TOKEN" },
      { status: 400 }
    );
  }

  // 3. Verify token and atomically record check-in
  const result = await verifyAndCheckInInterviewQr(rawToken, auth.user.id);

  if (!result.success) {
    let httpStatus = 400;
    if (result.code === "ALREADY_CHECKED_IN") httpStatus = 409;
    if (result.code === "INVALID_TOKEN") httpStatus = 404;

    return NextResponse.json(
      {
        error: result.error,
        code: result.code,
        checkedInAt: result.checkedInAt,
        candidate: result.candidate,
      },
      { status: httpStatus }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      code: "CHECK_IN_SUCCESS",
      candidate: result.candidate,
      recordedBy: auth.user.email,
    },
    { status: 200 }
  );
}
