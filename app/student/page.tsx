import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentStudent, isQrEligibleStatus } from "../../lib/auth/student.ts";
import {
  getOrCreateInterviewQrToken,
  renderQrDataUrl,
} from "../../lib/interviews/qr-service.ts";
import StudentDashboardClient from "./StudentDashboardClient";

export const metadata: Metadata = {
  title: "Student Portal & Credential Card — IT Club Recruitment",
  description: "Official candidate portal for IT Club recruitment applicants.",
  robots: { index: false, follow: false },
};

export default async function StudentPortalPage() {
  const student = await getCurrentStudent();
  if (!student) {
    redirect("/student/login");
  }

  if (student.isTempPasswordExpired) {
    redirect("/student/change-password?error=expired");
  }

  if (student.passwordChangeRequired) {
    redirect("/student/change-password");
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
    try {
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
    } catch (err) {
      console.error("[student-portal] Error initializing interview QR token:", err);
    }
  }

  return (
    <StudentDashboardClient
      application={application}
      userEmail={student.user.email || student.application.university_email}
      activatedAt={student.activatedAt}
      qrInfo={qrInfo}
    />
  );
}
