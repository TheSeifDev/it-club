import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import ResponsiveNav from "@/src/components/interview/navigation/ResponsiveNav";
import Footer from "@/src/components/interview/Home/Footer";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Staff Login",
  description: "Authorized staff sign-in for IT Club recruitment review and administration.",
  robots: { index: false, follow: false },
};

function LoginFormSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#080b0e]/80 backdrop-blur-xl p-8 sm:p-11 flex flex-col items-center justify-center min-h-[460px]">
      <Loader2 size={32} className="animate-spin text-emerald-400 mb-4" />
      <p className="font-mono text-xs uppercase tracking-widest text-white/50">
        Loading staff authentication...
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#050708] text-white flex flex-col selection:bg-emerald-400 selection:text-zinc-950 font-sans antialiased">
      {/* Existing Shared Public Website Navigation */}
      <ResponsiveNav />

      {/* Main Content Area: Responsive Composition */}
      <main className="relative flex-1 flex flex-col justify-center py-12 sm:py-16 lg:py-20">
        {/* Subtle Ambient Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.06] blur-[140px]"
          style={{
            background: "radial-gradient(circle, #34d399 0%, #38bdf8 50%, transparent 80%)",
          }}
        />

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-20 items-center">
            {/* Left Column: Context & Identity (Desktop left, Mobile below) */}
            <div className="lg:col-span-6 flex flex-col justify-center order-2 lg:order-1">
              {/* Eyebrow */}
              <div className="flex items-center gap-2 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="font-mono text-xs font-semibold tracking-[0.2em] text-emerald-400 uppercase">
                  STAFF PORTAL
                </span>
                <span className="text-white/20">|</span>
                <span className="arabic text-xs text-white/50" dir="rtl">
                  بوابة المخولين
                </span>
              </div>

              {/* Editorial Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
                Committee <br />
                <span className="text-emerald-400">Administration.</span>
              </h1>

              {/* Supporting Copy */}
              <p className="mt-5 text-base sm:text-lg text-white/70 leading-relaxed font-sans max-w-lg">
                Secure access for authorized IT Club committee leads, interviewers, and administrators to evaluate candidate submissions and manage recruitment workflows.
              </p>

              <p className="arabic mt-3 text-sm sm:text-base text-neutral-400 leading-relaxed max-w-lg" dir="rtl">
                تسجيل الدخول مخصص للجان العمل لمتابعة وتقييم طلبات الانضمام وتنظيم المقابلات الشخصية.
              </p>

              {/* Key Capabilities */}
              <div className="mt-8 pt-8 border-t border-white/10 space-y-4 max-w-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">Application Review &amp; Decisions</h3>
                    <p className="text-xs text-white/50 mt-0.5 font-sans">
                      Evaluate applicant portfolios, scores, and recruitment statuses across committees.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">Station QR Check-in &amp; Interview Notes</h3>
                    <p className="text-xs text-white/50 mt-0.5 font-sans">
                      Verify candidate attendance at on-campus stations and record structured evaluation notes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Institutional Attribution */}
              <div className="mt-8 flex items-center gap-2 text-xs text-white/40 font-mono">
                <ShieldCheck size={15} className="text-emerald-400" />
                <span>IT Club · Borg Al Arab Technological University</span>
              </div>
            </div>

            {/* Right Column: Authentication Card (Main Focus) */}
            <div className="lg:col-span-6 w-full max-w-md mx-auto lg:max-w-none order-1 lg:order-2">
              <Suspense fallback={<LoginFormSkeleton />}>
                <LoginForm />
              </Suspense>
            </div>
          </div>
        </div>
      </main>

      {/* Existing Shared Public Website Footer */}
      <Footer />
    </div>
  );
}
