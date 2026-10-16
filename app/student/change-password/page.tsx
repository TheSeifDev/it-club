import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentStudent } from "../../../lib/auth/student.ts";
import ResponsiveNav from "@/src/components/interview/navigation/ResponsiveNav";
import Footer from "@/src/components/interview/Home/Footer";
import ChangePasswordForm from "./ChangePasswordForm";

export const metadata: Metadata = {
  title: "Update Password — IT Club Recruitment",
  description: "Mandatory student password update and credential verification.",
  robots: { index: false, follow: false },
};

export default async function ChangePasswordPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const isExpiredQuery = searchParams.error === "expired";

  const student = await getCurrentStudent();
  if (!student) {
    redirect("/student/login");
  }

  const isExpired = student.isTempPasswordExpired || isExpiredQuery;
  const isMandatory = student.passwordChangeRequired;

  return (
    <div className="min-h-screen bg-[#050708] text-white flex flex-col selection:bg-[#00e599] selection:text-[#050708]">
      <ResponsiveNav />

      <main className="flex-1 relative overflow-hidden flex flex-col justify-center py-12 sm:py-16 lg:py-20">
        {/* Subtle Ambient Aurora Bloom */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[450px] opacity-[0.14] blur-[120px]"
          style={{
            background:
              "radial-gradient(ellipse 70% 280px at 50% 50%, #00e599 0%, #18c8ed 40%, transparent 80%)",
          }}
        />

        <div className="relative tracks-content-container">
          <div className="mb-6 max-w-lg mx-auto">
            <Link
              href={isMandatory ? "#" : "/student"}
              className={`inline-flex items-center gap-2 font-mono text-xs tracking-wider uppercase transition-colors ${
                isMandatory
                  ? "text-white/30 cursor-not-allowed"
                  : "text-white/40 hover:text-[#00e599]"
              }`}
            >
              <ArrowLeft size={14} />
              <span>{isMandatory ? "Password Update Required" : "Return to Portal"}</span>
            </Link>
          </div>

          <ChangePasswordForm
            isExpired={isExpired}
            expiresAt={student.tempPasswordExpiresAt}
            issuedAt={student.tempPasswordIssuedAt}
            universityEmail={student.application.university_email}
            applicationReference={student.application.application_reference}
            isMandatory={isMandatory}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
