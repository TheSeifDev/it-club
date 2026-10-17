import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../../../lib/auth/server.ts";
import { retryAdminInvitationEmail } from "../../../../../lib/admin/staff-service.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // 1. Strict Owner role enforcement
  const auth = await verifyStaffApiRequest(request, ["owner"]);
  if (!auth.authorized || !auth.user || auth.role !== "owner") {
    return NextResponse.json(
      {
        error: auth.error || "Only the IT Club Owner can retry admin invitations.",
        code: auth.code || "FORBIDDEN",
      },
      {
        status: auth.status || 403,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }

  // 2. Parse request JSON
  interface RetryPayload {
    userId?: string;
  }

  let body: RetryPayload;
  try {
    body = (await request.json()) as RetryPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body.", code: "MALFORMED_JSON" },
      { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  if (!body.userId || typeof body.userId !== "string") {
    return NextResponse.json(
      { error: "Target administrator user ID is required.", code: "INVALID_INPUT" },
      { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  // 3. Retry invitation dispatch
  const result = await retryAdminInvitationEmail({
    targetUserId: body.userId,
    ownerUser: {
      id: auth.user.id,
      email: auth.user.email,
      role: auth.role,
    },
  });

  if (!result.success) {
    const statusCode =
      result.code === "RATE_LIMITED"
        ? 429
        : result.code === "STAFF_NOT_FOUND"
        ? 404
        : result.code === "ALREADY_ACTIVATED" || result.code === "INVALID_TARGET_ROLE"
        ? 400
        : result.code === "FORBIDDEN"
        ? 403
        : 500;

    return NextResponse.json(
      { error: result.error, code: result.code, emailDelivery: result.emailDelivery },
      { status: statusCode, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  return NextResponse.json(result, {
    status: 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
