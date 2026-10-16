import { NextResponse } from "next/server.js";
import { getCurrentStudent } from "../../../../lib/auth/student.ts";
import { getServiceRoleClient } from "../../../../lib/auth/service-role.ts";
import { recordAuditEvent } from "../../../../lib/audit/service.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // 1. Authenticate student session
  const student = await getCurrentStudent();
  if (!student) {
    return NextResponse.json(
      {
        error: "Authenticated student membership required.",
        code: "UNAUTHORIZED_STUDENT",
      },
      {
        status: 401,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }

  // 2. Enforce 24-hour expiration deadline server-side
  if (student.isTempPasswordExpired) {
    return NextResponse.json(
      {
        error:
          "Your temporary credentials have expired (24-hour limit exceeded). Access is locked. Please contact the IT Club administration in person to reissue a fresh temporary password.",
        code: "CREDENTIAL_EXPIRED",
      },
      {
        status: 403,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }

  // 3. Parse and validate input
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
      { status: 400 }
    );
  }

  const newPassword = body.newPassword;
  const confirmPassword = body.confirmPassword;

  if (!newPassword || typeof newPassword !== "string" || !confirmPassword || typeof confirmPassword !== "string") {
    return NextResponse.json(
      { error: "New password and confirmation are required.", code: "INVALID_INPUT" },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters long.", code: "PASSWORD_TOO_SHORT" },
      { status: 400 }
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "Passwords do not match.", code: "PASSWORDS_DO_NOT_MATCH" },
      { status: 400 }
    );
  }

  // Reject using the application reference code as password
  const cleanRef = student.application.application_reference.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const cleanNew = newPassword.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  if (cleanNew === cleanRef || cleanNew.includes(cleanRef)) {
    return NextResponse.json(
      {
        error: "Password cannot be or contain your application reference code. Please choose a private secret password.",
        code: "PASSWORD_CANNOT_BE_REFERENCE",
      },
      { status: 400 }
    );
  }

  // 4. Update password via Supabase Auth Admin API
  const serviceClient = getServiceRoleClient();
  const { error: updateAuthErr } = await serviceClient.auth.admin.updateUserById(
    student.user.id,
    {
      password: newPassword,
      email_confirm: true,
    }
  );

  if (updateAuthErr) {
    console.error("[change-password] Failed to update password in Auth:", updateAuthErr.message);
    return NextResponse.json(
      {
        error: updateAuthErr.message || "Failed to update account password.",
        code: "AUTH_UPDATE_FAILED",
      },
      { status: 400 }
    );
  }

  // 5. Clear password-change requirement in student_accounts
  const now = new Date().toISOString();
  const { error: accountUpdateErr } = await serviceClient
    .from("student_accounts")
    .update({
      password_change_required: false,
      password_changed_at: now,
      activated_at: student.activatedAt || now,
    })
    .eq("user_id", student.user.id);

  if (accountUpdateErr) {
    console.error("[change-password] Failed to update student_accounts:", accountUpdateErr.message);
    return NextResponse.json(
      {
        error: "Failed to update password lifecycle status in database.",
        code: "DATABASE_ERROR",
      },
      { status: 500 }
    );
  }

  // 6. Ensure applications record has user_id and activated_at
  await serviceClient
    .from("applications")
    .update({
      user_id: student.user.id,
      activated_at: student.application.activated_at || now,
      updated_at: now,
    })
    .eq("id", student.application.id);

  // 7. Record audit log
  await recordAuditEvent({
    actor: {
      id: student.user.id,
      email: student.user.email?.toLowerCase(),
      role: "student",
    },
    action: "STUDENT_PASSWORD_CHANGED",
    entityType: "student_account",
    entityId: student.user.id,
    entityReference: student.application.application_reference,
    outcome: "SUCCESS",
    metadata: {
      applicationId: student.application.id,
      universityEmail: student.application.university_email,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      message: "Password successfully updated! You now have full access to your Student Portal.",
      redirect: "/student",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Pragma": "no-cache",
      },
    }
  );
}
