import { NextResponse } from "next/server.js";
import { cookies } from "next/headers.js";
import type { User } from "@supabase/supabase-js";
import { createClient as createServerSupabaseClient } from "../../../../utils/supabase/server.ts";
import { getServiceRoleClient } from "../../../../lib/auth/service-role.ts";
import { recordAuditEvent } from "../../../../lib/audit/service.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // 1. Session verification
  let user: User | null = null;
  let supabaseClient: ReturnType<typeof createServerSupabaseClient> | null = null;
  try {
    const cookieStore = await cookies();
    supabaseClient = createServerSupabaseClient(cookieStore);
    const { data, error: userErr } = await supabaseClient.auth.getUser();
    if (!userErr && data?.user) {
      user = data.user;
    }
  } catch {
    // cookies() may throw outside Next.js request context (e.g. in test runners)
  }

  if (!user || !user.email) {
    return NextResponse.json(
      {
        error:
          "Your activation session has expired or is invalid. Please open your invitation link again or request a new one.",
        code: "SESSION_EXPIRED",
      },
      { status: 401 }
    );
  }

  // 2. Body parsing and input validation
  let body: {
    applicationReference?: string;
    password?: string;
    confirmPassword?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body.", code: "MALFORMED_JSON" },
      { status: 400 }
    );
  }

  const reference = body.applicationReference?.trim().toUpperCase();
  const password = body.password;
  const confirmPassword = body.confirmPassword;

  if (!reference || !/^ITC-[A-Z0-9]{8}$/.test(reference)) {
    return NextResponse.json(
      {
        error: "Please enter a valid 8-character application reference code (e.g. ITC-XXXXXXXX).",
        code: "INVALID_REFERENCE_FORMAT",
      },
      { status: 400 }
    );
  }

  if (!password || password.length < 8) {
    return NextResponse.json(
      {
        error: "Password must be at least 8 characters long.",
        code: "PASSWORD_TOO_SHORT",
      },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      {
        error: "Password confirmation does not match.",
        code: "PASSWORDS_DO_NOT_MATCH",
      },
      { status: 400 }
    );
  }

  // 3. Database-backed application matching & verification
  const serviceClient = getServiceRoleClient();

  const { data: app, error: appErr } = await serviceClient
    .from("applications")
    .select("id, application_reference, status, university_email, user_id")
    .eq("application_reference", reference)
    .maybeSingle();

  if (appErr || !app) {
    return NextResponse.json(
      {
        error: "The provided reference code does not match an eligible application.",
        code: "APPLICATION_NOT_FOUND",
      },
      { status: 400 }
    );
  }

  // Must be in an eligible recruitment lifecycle state
  const ACTIVATION_ELIGIBLE_STATUSES = [
    "SHORTLISTED",
    "INTERVIEW_SCHEDULED",
    "INTERVIEWED",
    "ACCEPTED",
  ];

  if (!ACTIVATION_ELIGIBLE_STATUSES.includes(app.status)) {
    return NextResponse.json(
      {
        error: "This application is not currently eligible for account activation.",
        code: "APPLICATION_NOT_ELIGIBLE",
      },
      { status: 403 }
    );
  }

  // University email must match authenticated identity
  if (
    app.university_email.trim().toLowerCase() !==
    user.email.trim().toLowerCase()
  ) {
    return NextResponse.json(
      {
        error:
          "The university email on this application does not match your authenticated invitation identity.",
        code: "EMAIL_MISMATCH",
      },
      { status: 403 }
    );
  }

  // Check if application is already linked to another user
  if (app.user_id && app.user_id !== user.id) {
    return NextResponse.json(
      {
        error: "This application has already been claimed by another account.",
        code: "ACCOUNT_ALREADY_LINKED",
      },
      { status: 409 }
    );
  }

  // Check if this user is already linked to a different application
  const { data: existingStudentAccount } = await serviceClient
    .from("student_accounts")
    .select("application_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    existingStudentAccount &&
    existingStudentAccount.application_id !== app.id
  ) {
    return NextResponse.json(
      {
        error: "Your user account is already linked to a different recruitment application.",
        code: "ACCOUNT_CONFLICT",
      },
      { status: 409 }
    );
  }

  // 4. Update password via Supabase Auth
  let updatePwErr = null;
  if (supabaseClient) {
    const res = await supabaseClient.auth.updateUser({ password });
    updatePwErr = res.error;
  } else {
    const res = await serviceClient.auth.admin.updateUserById(user.id, { password });
    updatePwErr = res.error;
  }

  if (updatePwErr) {
    console.error("[activate] Failed to update user password:", updatePwErr.message);
    return NextResponse.json(
      {
        error: updatePwErr.message || "Failed to set account password.",
        code: "AUTH_UPDATE_FAILED",
      },
      { status: 400 }
    );
  }

  // 5. Establish durable database linkage
  const now = new Date().toISOString();

  const { error: accountUpsertErr } = await serviceClient
    .from("student_accounts")
    .upsert(
      {
        user_id: user.id,
        application_id: app.id,
        university_email: user.email.toLowerCase(),
        activated_at: now,
      },
      { onConflict: "user_id" }
    );

  if (accountUpsertErr) {
    console.error("[activate] Failed to link student_accounts:", accountUpsertErr.message);
    return NextResponse.json(
      {
        error: "Failed to persist account linkage. Please retry.",
        code: "DATABASE_ERROR",
      },
      { status: 500 }
    );
  }

  // Stamp application as activated
  const { error: appUpdateErr } = await serviceClient
    .from("applications")
    .update({
      user_id: user.id,
      activated_at: now,
    })
    .eq("id", app.id);

  if (appUpdateErr) {
    console.error("[activate] Failed to update application user_id:", appUpdateErr.message);
  }

  // Record audit log for completed student activation
  await recordAuditEvent({
    actor: {
      id: user.id,
      email: user.email.toLowerCase(),
      role: "student",
    },
    action: "STUDENT_ACCOUNT_ACTIVATED",
    entityType: "student_account",
    entityId: user.id,
    entityReference: reference,
    outcome: "SUCCESS",
    metadata: {
      applicationId: app.id,
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Your IT Club student account has been successfully activated! You can now log in.",
    redirect: "/student/login?activated=true",
  });
}
