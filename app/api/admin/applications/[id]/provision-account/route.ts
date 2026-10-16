import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../../../../lib/auth/server.ts";
import { provisionStudentAccount } from "../../../../../../lib/auth/provisioning.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await verifyStaffApiRequest(request, ["owner", "admin"]);
  if (!auth.authorized || !auth.user) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized.", code: auth.code || "UNAUTHORIZED" },
      { status: auth.status }
    );
  }

  const { id } = await props.params;

  let isReissue = false;
  try {
    const text = await request.text();
    if (text) {
      const parsed = JSON.parse(text);
      if (typeof parsed?.reissue === "boolean") {
        isReissue = parsed.reissue;
      }
    }
  } catch {
    // Empty body is acceptable
  }

  try {
    const result = await provisionStudentAccount({
      applicationId: id,
      staffUser: {
        id: auth.user.id,
        email: auth.user.email,
        role: auth.role as string,
      },
      isReissue,
    });

    if (!result.success) {
      const status =
        result.code === "NOT_FOUND"
          ? 404
          : result.code === "ACCOUNT_CONFLICT"
          ? 409
          : result.code === "FORBIDDEN"
          ? 403
          : result.code === "INELIGIBLE_STATUS" || result.code === "INVALID_EMAIL_DOMAIN"
          ? 400
          : 500;

      return NextResponse.json(
        { error: result.error, code: result.code },
        { status }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        temporaryPassword: result.temporaryPassword,
        expiresAt: result.expiresAt,
        issuedAt: result.issuedAt,
        universityEmail: result.universityEmail,
        applicationReference: result.applicationReference,
        userId: result.userId,
        isReissue: result.isReissue,
        studentAccount: result.studentAccount,
        message: result.isReissue
          ? "Temporary password reissued successfully. Communicate credentials to the student in person."
          : "Student account provisioned successfully. Communicate credentials to the student in person.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Pragma": "no-cache",
        },
      }
    );
  } catch (err: unknown) {
    console.error("[provision-account] Unexpected error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Internal server error during account provisioning.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
