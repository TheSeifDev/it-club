import type { Metadata } from "next";
import ResponsiveNav from "@/src/components/interview/navigation/ResponsiveNav";
import Footer from "@/src/components/interview/Home/Footer";
import RegisterFlow from "./RegisterFlow";

export const metadata: Metadata = {
  title: "Apply to IT Club — Recruitment 2026 | BATU",
  description:
    "Join the next cohort of IT Club. Apply for our six specialized tracks across software, engineering, people, media, and technology leadership.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#050708] text-white flex flex-col selection:bg-[#00e599] selection:text-[#050708]">
      {/* Unified Site Navigation */}
      <ResponsiveNav />

      {/* Main Registration Content */}
      <main className="flex-1 relative overflow-hidden">
        {/* Subtle Ambient Emerald-Cyan Aurora Bloom matching Hero/Process pages */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] opacity-[0.14] blur-[120px]"
          style={{
            background:
              "radial-gradient(ellipse 70% 260px at 50% 0%, #00e599 0%, #18c8ed 40%, transparent 80%)",
          }}
        />

        {/* Hero Banner & Application Container */}
        <div className="relative tracks-content-container py-12 sm:py-16 lg:py-20">
          {/* Top Architectural Eyebrow */}
          <div className="flex items-center gap-4 mb-6">
            <span className="font-mono text-xs font-semibold tracking-[0.2em] text-[#00e599]">
              05
            </span>
            <span className="font-mono text-xs font-bold tracking-[0.2em] text-white/80 uppercase">
              RECRUITMENT APPLICATION
            </span>
            <span className="arabic text-sm sm:text-base text-white/40 font-medium">
              استمارة التقديم
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Heading Section */}
          <div className="mb-10 sm:mb-12 max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] font-black tracking-[-0.035em] leading-[1.05] text-white">
              Your next chapter{" "}
              <span className="text-[#00e599] transition-all duration-300 hover:[text-shadow:0_0_28px_rgba(0,229,153,0.4)]">
                starts here.
              </span>
            </h1>

            <p
              className="arabic mt-4 text-base sm:text-lg leading-[1.8] text-white/60 max-w-2xl font-medium"
              dir="rtl"
            >
              مش لازم تكون خبير عشان تقدم. عرّفنا بنفسك، بمستواك الحالي، وبالمجال اللي حابب تتعلمه وتساهم فيه مع نادي تكنولوجيا المعلومات.
            </p>

            {/* Contextual Badges Row */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-[10px] font-bold tracking-[0.16em] uppercase px-3 py-1 bg-white/[0.03] border border-white/10 text-white/60">
                BATU CAMPUS
              </span>
              <span className="font-mono text-[10px] font-bold tracking-[0.16em] uppercase px-3 py-1 bg-white/[0.03] border border-white/10 text-white/60">
                SEASON 2026
              </span>
              <span className="font-mono text-[10px] font-bold tracking-[0.16em] uppercase px-3 py-1 bg-white/[0.03] border border-white/10 text-[#00e599]">
                6 SPECIALIZED TRACKS
              </span>
              <span className="font-mono text-[10px] font-bold tracking-[0.16em] uppercase px-3 py-1 bg-white/[0.03] border border-white/10 text-white/60">
                INTERVIEWS: OCT 17, 2026
              </span>
            </div>
          </div>

          {/* Registration Multi-Step Interactive Form */}
          <div className="relative">
            <RegisterFlow />
          </div>

          {/* Privacy & Evaluation Disclaimer */}
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-white/35 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e599]/60" />
              <span>CONFIDENTIAL RECRUITMENT DATA · AUTHORIZED COMMITTEE HEADS ONLY</span>
            </div>
            <span>IT CLUB — BENHA APPLIED TECHNOLOGY UNIVERSITY</span>
          </div>
        </div>
      </main>

      {/* Unified Site Footer */}
      <Footer />
    </div>
  );
}
