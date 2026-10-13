import { NextResponse } from "next/server.js";
import { getCurrentStudent } from "../../../../lib/auth/student.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const student = await getCurrentStudent();
  if (!student) {
    return NextResponse.json(
      {
        error: "Authenticated student membership required.",
        code: "UNAUTHORIZED_STUDENT",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: student.user.id,
      email: student.user.email,
    },
    application: {
      id: student.application.id,
      application_reference: student.application.application_reference,
      full_name: student.application.full_name,
      primary_track: student.application.primary_track,
      status: student.application.status,
      academic_year: student.application.academic_year,
      department: student.application.department,
    },
    activatedAt: student.activatedAt,
  });
}
