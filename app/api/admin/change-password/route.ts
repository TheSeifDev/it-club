import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../../lib/auth/server.ts";
import { changeStaffPassword } from "../../../../lib/admin/staff-service.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // 1. Authenticate staff member (allow pending password change)
  const auth = await verifyStaffApiRequest(
    request,
    ["owner", "admin", "interviewer"],
    { allowPendingPasswordChange: true }
  );

  if (!auth.authorized || !auth.user) {
    return NextResponse.json(
      {
        error: auth.error || "Staff authentication required.",
        code: auth.code || "UNAUTHORIZED",
      },
      {
        status: auth.status || 401,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }

  // 2. Parse request JSON
  interface ChangePasswordPayload {
    newPassword?: string;
    confirmPassword?: string;
  }

  let body: ChangePasswordPayload;
  try {
    body = (await request.json()) as ChangePasswordPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body.", code: "MALFORMED_JSON" },
      { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  // 3. Process password change
  const result = await changeStaffPassword({
    userId: auth.user.id,
    newPassword: body.newPassword,
    confirmPassword: body.confirmPassword,
  });

  if (!result.success) {
    const statusCode =
      result.code === "TEMPORARY_PASSWORD_EXPIRED"
        ? 403
        : result.code === "PASSWORD_TOO_SHORT" ||
          result.code === "PASSWORDS_DO_NOT_MATCH" ||
          result.code === "INVALID_INPUT"
        ? 400
        : 500;

    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: statusCode, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  return NextResponse.json(
    { success: true, message: result.message },
    { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
