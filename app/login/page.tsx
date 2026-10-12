import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import ResponsiveNav from "@/src/components/interview/navigation/ResponsiveNav";
import Footer from "@/src/components/interview/Home/Footer";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Staff Login — IT Club Recruitment | BATU",
  description: "Authorized staff sign-in for IT Club recruitment review and administration.",
  robots: { index: false, follow: false },
};

function LoginFormSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto border border-white/10 bg-[#080a0c] p-8 sm:p-10 flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 size={28} className="animate-spin text-[#00e599] mb-4" />
      <p className="font-mono text-xs uppercase tracking-widest text-white/40">Loading secure portal...</p>
    </div>
  );
}

export default function LoginPage() {
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
          <div className="mb-6 max-w-md mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-mono text-xs tracking-wider text-white/40 hover:text-[#00e599] transition-colors uppercase"
            >
              <ArrowLeft size={14} />
              Return to Website
            </Link>
          </div>

          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
