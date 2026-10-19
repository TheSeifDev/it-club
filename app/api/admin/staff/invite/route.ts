import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../../../lib/auth/server.ts";
import { inviteAdminAccount } from "../../../../../lib/admin/staff-service.ts";
import type { StaffRole, CommitteeTrack } from "../../../../../lib/auth/roles.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // 1. Strict Owner role enforcement
  const auth = await verifyStaffApiRequest(request, ["owner"]);
  if (!auth.authorized || !auth.user || auth.role !== "owner") {
    return NextResponse.json(
      {
        error: auth.error || "Only the IT Club Owner can invite administrative staff members.",
        code: auth.code || "FORBIDDEN",
      },
      {
        status: auth.status || 403,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }

  // 2. Parse request JSON
  interface InvitePayload {
    email?: string;
    role?: string;
    committee?: string | null;
  }

  let body: InvitePayload;
  try {
    body = (await request.json()) as InvitePayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body.", code: "MALFORMED_JSON" },
      { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  if (!body.email || typeof body.email !== "string") {
    return NextResponse.json(
      { error: "A valid email address is required.", code: "INVALID_INPUT" },
      { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  // 3. Invite Admin Account
  const result = await inviteAdminAccount({
    email: body.email,
    role: (body.role as StaffRole) || "admin",
    committee: (body.committee as CommitteeTrack | null) ?? null,
    ownerUser: {
      id: auth.user.id,
      email: auth.user.email,
      role: auth.role,
    },
  });

  if (!result.success) {
    const statusCode =
      result.code === "ACCOUNT_ALREADY_EXISTS"
        ? 409
        : result.code === "INVALID_EMAIL" || result.code === "INVALID_COMMITTEE" || result.code === "INVALID_ROLE"
        ? 400
        : result.code === "FORBIDDEN"
        ? 403
        : 500;

    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: statusCode, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  return NextResponse.json(
    {
      ...result,
      accountCreated: true,
      emailSent: result.emailDelivery?.sent ?? false,
      emailDeliveryStatus: result.emailDelivery?.status ?? "CONFIG_ERROR",
    },
    {
      status: 201,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
