import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Sparkles, LogOut, ShieldCheck } from "lucide-react";
import { getCurrentStudent } from "../../lib/auth/student.ts";
import { TRACK_METADATA } from "../../lib/admin/transitions.ts";
import ResponsiveNav from "@/src/components/interview/navigation/ResponsiveNav";
import Footer from "@/src/components/interview/Home/Footer";

export const metadata: Metadata = {
  title: "Student Portal — IT Club Recruitment",
  robots: { index: false, follow: false },
};

export default async function StudentPortalPage() {
  const student = await getCurrentStudent();
  if (!student) {
    redirect("/student/login");
  }

  const trackMeta =
    student.application.primary_track in TRACK_METADATA
      ? TRACK_METADATA[student.application.primary_track]
      : null;

  return (
    <div className="min-h-screen bg-[#050708] text-white flex flex-col selection:bg-[#00e599] selection:text-[#050708]">
      <ResponsiveNav />

      <main className="flex-1 relative overflow-hidden py-12 sm:py-16">
        <div className="tracks-content-container max-w-3xl mx-auto">
          {/* Welcome Card */}
          <div className="relative overflow-hidden border border-white/10 bg-[#080a0c] p-8 sm:p-10 mb-8">
            <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-[#00e599] via-[#18c8ed] to-[#9b7cff]" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#00e599]" />
                <span className="font-mono text-[10px] tracking-widest uppercase text-[#00e599] font-bold">
                  ACCEPTED MEMBER PORTAL
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono border border-[#00e599]/30 bg-[#00e599]/10 text-[#00e599]">
                  <CheckCircle2 size={12} />
                  <span>ACTIVE MEMBER</span>
                </span>
                <Link
                  href="/auth/signout?next=/student/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors"
                >
                  <LogOut size={12} />
                  <span>SIGN OUT</span>
                </Link>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
              Welcome, {student.application.full_name}
            </h1>
            <p className="text-sm text-white/60 leading-relaxed font-sans mb-8">
              Your IT Club membership has been officially confirmed and activated.
            </p>

            {/* Member Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-white/10">
              <div className="p-4 border border-white/5 bg-[#050708]">
                <span className="font-mono text-[10px] uppercase text-white/40 tracking-wider block mb-1">
                  COMMITTEE TRACK
                </span>
                <span className="text-sm font-bold text-[#00e599]">
                  {trackMeta ? `${trackMeta.abbreviation} — ${trackMeta.name}` : student.application.primary_track}
                </span>
                <span className="text-xs text-white/40 block mt-0.5" dir="rtl">
                  {trackMeta?.arabicName}
                </span>
              </div>

              <div className="p-4 border border-white/5 bg-[#050708]">
                <span className="font-mono text-[10px] uppercase text-white/40 tracking-wider block mb-1">
                  APPLICATION REFERENCE
                </span>
                <span className="font-mono text-sm font-bold text-white tracking-wider">
                  {student.application.application_reference}
                </span>
                <span className="text-xs text-white/40 block mt-0.5">
                  Verified &amp; Linked
                </span>
              </div>

              <div className="p-4 border border-white/5 bg-[#050708]">
                <span className="font-mono text-[10px] uppercase text-white/40 tracking-wider block mb-1">
                  UNIVERSITY EMAIL
                </span>
                <span className="font-mono text-xs text-white/80">
                  {student.user.email}
                </span>
              </div>

              <div className="p-4 border border-white/5 bg-[#050708]">
                <span className="font-mono text-[10px] uppercase text-white/40 tracking-wider block mb-1">
                  DEPARTMENT &amp; YEAR
                </span>
                <span className="text-xs text-white/80">
                  {student.application.department} ({student.application.academic_year})
                </span>
              </div>
            </div>
          </div>

          {/* Upcoming Phases Info Notice */}
          <div className="border border-white/10 bg-[#080a0c] p-6 flex items-start gap-3.5">
            <div className="w-8 h-8 flex items-center justify-center shrink-0 border border-[#18c8ed]/30 bg-[#18c8ed]/10 text-[#18c8ed]">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#18c8ed] font-bold">
                ONBOARDING ROADMAP
              </p>
              <p className="text-xs text-white/70 mt-1 leading-relaxed">
                The full Student Dashboard, downloadable Digital Membership Card, and QR Attendance System are scheduled for release during onboarding week. You will receive further notifications as those modules become active.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
