import { NextResponse } from "next/server.js";
import { getCurrentStudent, isQrEligibleStatus } from "../../../../lib/auth/student.ts";
import {
  getOrCreateInterviewQrToken,
  renderQrDataUrl,
} from "../../../../lib/interviews/qr-service.ts";

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
      {
        status: 401,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }

  if (student.isTempPasswordExpired) {
    return NextResponse.json(
      {
        error: "Your temporary credentials have expired (24-hour deadline exceeded). Access is locked. Please contact an administrator to reissue a fresh password.",
        code: "CREDENTIAL_EXPIRED",
        requiresPasswordChange: true,
        expired: true,
      },
      {
        status: 403,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }

  if (student.passwordChangeRequired) {
    return NextResponse.json(
      {
        error: "You must change your temporary password before accessing the student dashboard.",
        code: "PASSWORD_CHANGE_REQUIRED",
        requiresPasswordChange: true,
        expired: false,
      },
      {
        status: 403,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }

  const { application } = student;
  const isEligible = isQrEligibleStatus(application.status);

  let qrInfo: {
    eligible: boolean;
    status?: string;
    qrDataUrl?: string;
    expiresAt?: string;
    checkedInAt?: string | null;
  } = {
    eligible: false,
  };

  if (isEligible) {
    const tokenRes = await getOrCreateInterviewQrToken(
      application.id,
      application.status
    );

    if (tokenRes.eligible && tokenRes.qrPayload) {
      const qrDataUrl = await renderQrDataUrl(tokenRes.qrPayload);
      qrInfo = {
        eligible: true,
        status: tokenRes.status,
        qrDataUrl,
        expiresAt: tokenRes.expiresAt,
        checkedInAt: tokenRes.checkedInAt,
      };
    }
  }

  // Construct sanitized student application context
  // Strictly excludes reviewer notes, internal flags, or reviewer identities
  return NextResponse.json(
    {
      ok: true,
      user: {
        id: student.user.id,
        email: student.user.email,
      },
      application: {
        id: application.id,
        application_reference: application.application_reference,
        full_name: application.full_name,
        national_id_masked: application.national_id_masked,
        academic_id: application.academic_id,
        phone: application.phone,
        whatsapp: application.whatsapp,
        university_email: application.university_email,
        google_email: application.google_email,

        academic_year: application.academic_year,
        department: application.department,

        experience_level: application.experience_level,
        skills: application.skills,
        experience_details: application.experience_details,
        volunteer_experience: application.volunteer_experience,

        primary_track: application.primary_track,
        secondary_track: application.secondary_track,
        motivation: application.motivation,
        learning_goal: application.learning_goal,
        contribution: application.contribution,
        availability: application.availability,

        status: application.status,
        interview_date: application.interview_date || null,
        interview_time: application.interview_time || null,
        interview_location: application.interview_location || null,

        created_at: application.created_at,
        consented_at: application.consented_at,
      },
      qr: qrInfo,
      activatedAt: student.activatedAt,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        "Pragma": "no-cache",
      },
    }
  );
}
