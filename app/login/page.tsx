import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  ClipboardList,
  Calendar,
  QrCode,
  BarChart3,
} from "lucide-react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Staff Login — IT Club Recruitment | BATU",
  description: "Authorized staff sign-in for IT Club recruitment review and administration.",
  robots: { index: false, follow: false },
};

function LoginFormSkeleton() {
  return (
    <div className="w-full rounded-2xl lg:rounded-3xl border border-emerald-500/20 bg-[#080d0b]/90 backdrop-blur-2xl p-8 sm:p-11 flex flex-col items-center justify-center min-h-[480px]">
      <Loader2 size={34} className="animate-spin text-[#00e599] mb-4" />
      <p className="font-sans text-xs uppercase tracking-widest text-white/50">
        Loading secure portal...
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#050708] text-white flex flex-col selection:bg-[#00e599] selection:text-[#050708] font-sans antialiased relative overflow-x-hidden">
      {/* Background Architectural View in bottom-left */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -left-10 w-full max-w-[850px] h-[550px] z-0 opacity-40 lg:opacity-55 mix-blend-screen"
        style={{
          backgroundImage: "url('/images/auth-building-night.webp')",
          backgroundSize: "cover",
          backgroundPosition: "left bottom",
          maskImage: "radial-gradient(ellipse 90% 80% at 20% 80%, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 20% 80%, black 40%, transparent 80%)",
        }}
      />

      {/* Subtle Dot Grid Pattern Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.45) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Atmospheric Emerald Ambient Glow in upper right and center */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 w-[650px] h-[500px] opacity-[0.09] blur-[150px]"
        style={{
          background: "radial-gradient(circle at 60% 40%, #00e599 0%, #18c8ed 45%, transparent 75%)",
        }}
      />

      {/* Minimal Dedicated Authentication Header */}
      <header className="relative z-10 w-full border-b border-white/[0.08] bg-[#050708]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-3 text-white transition-opacity hover:opacity-90"
            aria-label="IT Club Home"
          >
            <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-sans">
              <Image
                src="/logo.webp"
                alt="IT Club"
                width={26}
                height={26}
                className="object-contain"
                priority
              />
              <span className="text-sm font-black tracking-[0.16em] uppercase text-white">
                IT<span className="text-[#00e599] ml-1">CLUB</span>
              </span>
            </div>
            <span className="hidden sm:inline-block font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-white/40 border-l border-white/10 pl-3">
              Staff Portal
            </span>
          </Link>

          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/70 hover:border-[#00e599]/40 hover:bg-[#00e599]/5 hover:text-white transition-all duration-200"
          >
            <ArrowLeft
              size={14}
              className="text-[#00e599] transition-transform duration-200 group-hover:-translate-x-1"
            />
            <span>Return to Website</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area: Responsive Two-Column Composition */}
      <main className="relative z-10 flex-1 flex flex-col justify-center py-8 sm:py-12 lg:py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
            {/* Left Column: Brand & Capability Overview (Desktop left, Mobile below form) */}
            <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center order-2 lg:order-1">
              {/* Eyebrow Pill */}
              <div className="flex items-center gap-2.5 self-start mb-5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599]">
                  <ShieldCheck size={14} />
                </span>
                <span className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-[#00e599]">
                  STAFF PORTAL
                </span>
                <span className="h-px w-10 bg-gradient-to-r from-[#00e599]/60 to-transparent" />
              </div>

              {/* Editorial Headline */}
              <h1 className="font-sans text-4xl sm:text-5xl xl:text-6xl font-black tracking-[-0.03em] text-white leading-[1.08]">
                IT Club <br />
                <span className="text-[#00e599]">Staff</span> Portal
              </h1>

              {/* Supporting Copy */}
              <p className="mt-4 text-sm sm:text-base text-white/70 leading-relaxed font-sans max-w-lg">
                Secure access for authorized committee members to manage applications, interviews, and recruitment operations.
              </p>

              {/* 2x2 Capability Grid */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-xl">
                {/* 1. Review Applications */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-white/8 bg-[#0a0f0d]/60 backdrop-blur-sm transition-colors hover:border-[#00e599]/30">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#00e599]/30 bg-[#00e599]/10 text-[#00e599]">
                    <ClipboardList size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white font-sans">
                      Review Applications
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5 leading-relaxed font-sans">
                      Evaluate and manage student applications
                    </p>
                  </div>
                </div>

                {/* 2. Manage Interviews */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-white/8 bg-[#0a0f0d]/60 backdrop-blur-sm transition-colors hover:border-[#00e599]/30">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#00e599]/30 bg-[#00e599]/10 text-[#00e599]">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white font-sans">
                      Manage Interviews
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5 leading-relaxed font-sans">
                      Schedule and track interview sessions
                    </p>
                  </div>
                </div>

                {/* 3. QR Scanner */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-white/8 bg-[#0a0f0d]/60 backdrop-blur-sm transition-colors hover:border-[#00e599]/30">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#00e599]/30 bg-[#00e599]/10 text-[#00e599]">
                    <QrCode size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white font-sans">
                      QR Scanner
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5 leading-relaxed font-sans">
                      Verify attendance and check-in students
                    </p>
                  </div>
                </div>

                {/* 4. Analytics & Insights */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-white/8 bg-[#0a0f0d]/60 backdrop-blur-sm transition-colors hover:border-[#00e599]/30">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#00e599]/30 bg-[#00e599]/10 text-[#00e599]">
                    <BarChart3 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white font-sans">
                      Analytics & Insights
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5 leading-relaxed font-sans">
                      Monitor recruitment progress and statistics
                    </p>
                  </div>
                </div>
              </div>

              {/* Reference Security Audited Badge */}
              <div className="mt-8 flex items-center gap-2.5 text-xs text-white/50 font-sans">
                <ShieldCheck size={16} className="text-[#00e599]" />
                <span>Security Audited · Benha Applied Technology University</span>
              </div>
            </div>

            {/* Right Column: Authentication Card Panel */}
            <div className="lg:col-span-6 xl:col-span-6 w-full max-w-lg mx-auto lg:max-w-none order-1 lg:order-2">
              <Suspense fallback={<LoginFormSkeleton />}>
                <LoginForm />
              </Suspense>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Dedicated Authentication Footer */}
      <footer className="relative z-10 w-full border-t border-white/[0.08] bg-[#050708]/90 py-5">
        <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl px-4 sm:px-6 lg:px-8 text-xs text-white/40">
          <p className="font-sans">
            © 2026 IT Club · Borg Al Arab Technological University. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-white/30 hidden md:inline font-sans">
              Restricted Administrative Gateway
            </span>
            <Link href="/privacy" className="hover:text-white transition-colors font-sans">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors font-sans">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
