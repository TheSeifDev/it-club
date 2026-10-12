import type { Metadata } from "next";
import Link from "next/link";
import RegisterFlow from "./RegisterFlow";

export const metadata: Metadata = {
  title: "Apply to IT Club | Recruitment 2026",
  description:
    "Apply to IT Club through a guided, accessible multi-step registration process.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#080a0b] text-white">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="text-sm font-bold tracking-[0.16em] text-white">
          IT <span className="text-emerald-400">CLUB</span>
        </Link>
        <Link
          href="/"
          className="text-sm text-white/60 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
        >
          Back to website
        </Link>
      </header>

      <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-7 sm:px-8 sm:pt-12">
        <div className="mb-9 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
            Recruitment · 2026
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Your next chapter starts here.
          </h1>
          <p className="arabic mt-4 max-w-xl text-sm leading-7 text-white/60 sm:text-base" dir="rtl">
            مش لازم تكون خبير عشان تقدم. عرّفنا بنفسك، بمستواك الحالي، وبالمجال اللي حابب تتعلمه وتساهم فيه.
          </p>
        </div>
        <RegisterFlow />
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-6 text-white/40">
          Your information is used for IT Club recruitment only. Do not share your application reference with anyone you do not trust.
        </p>
      </section>
    </main>
  );
}
