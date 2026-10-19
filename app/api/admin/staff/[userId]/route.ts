import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../../../lib/auth/server.ts";
import { updateStaffAccount } from "../../../../../lib/admin/staff-service.ts";
import type { StaffRole, CommitteeTrack } from "../../../../../lib/auth/roles.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ userId: string }> }
) {
  // 1. Strict Owner role enforcement
  const auth = await verifyStaffApiRequest(request, ["owner"]);
  if (!auth.authorized || !auth.user || auth.role !== "owner") {
    return NextResponse.json(
      {
        error: auth.error || "Only the IT Club Owner can update administrative staff accounts.",
        code: auth.code || "FORBIDDEN",
      },
      {
        status: auth.status || 403,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }

  // 2. Validate target user ID parameter
  const { userId } = await props.params;
  if (!userId || typeof userId !== "string" || !userId.trim()) {
    return NextResponse.json(
      { error: "Target staff user ID is required.", code: "INVALID_INPUT" },
      { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  // 3. Parse JSON body
  interface UpdatePayload {
    email?: string;
    role?: string;
    committee?: string | null;
  }

  let body: UpdatePayload;
  try {
    body = (await request.json()) as UpdatePayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body.", code: "MALFORMED_JSON" },
      { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  if (body.email === undefined && body.role === undefined && body.committee === undefined) {
    return NextResponse.json(
      { error: "At least one of email, role, or committee must be provided for update.", code: "INVALID_INPUT" },
      { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  // 4. Update staff account
  const result = await updateStaffAccount({
    targetUserId: userId.trim(),
    email: body.email,
    role: body.role as StaffRole | undefined,
    committee: body.committee as CommitteeTrack | null | undefined,
    ownerUser: {
      id: auth.user.id,
      email: auth.user.email,
      role: auth.role,
    },
  });

  if (!result.success) {
    const statusCode =
      result.code === "STAFF_NOT_FOUND"
        ? 404
        : result.code === "CANNOT_MODIFY_OWNER" || result.code === "FORBIDDEN"
        ? 403
        : result.code === "ACCOUNT_ALREADY_EXISTS"
        ? 409
        : result.code === "INVALID_ROLE" || result.code === "INVALID_EMAIL" || result.code === "INVALID_COMMITTEE" || result.code === "INVALID_INPUT"
        ? 400
        : 500;

    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: statusCode, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  return NextResponse.json(result, {
    status: 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
