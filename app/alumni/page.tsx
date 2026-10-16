import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Award, Heart, Sparkles } from "lucide-react";
import ResponsiveNav from "@/src/components/interview/navigation/ResponsiveNav";
import Footer from "@/src/components/interview/Home/Footer";

export const metadata: Metadata = {
  title: "Alumni Recognition",
  description:
    "Celebrating former IT Club members whose dedication and foundational contributions shaped our university technology community.",
  openGraph: {
    title: "Alumni Recognition — IT Club | BATU",
    description:
      "Celebrating former IT Club members whose dedication and foundational contributions shaped our university technology community.",
    url: "/alumni",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alumni Recognition — IT Club | BATU",
    description:
      "Celebrating former IT Club members whose dedication and foundational contributions shaped our university technology community.",
  },
};

interface AlumniMember {
  id: string;
  name: string;
  arabicName?: string;
  image: string;
}

const ALUMNI_LIST: readonly AlumniMember[] = [
  {
    id: "ahmed-samir",
    name: "Ahmed Samir",
    arabicName: "أحمد سمير",
    image: "/COMMITTEES/Ahmed Samir.webp",
  },
  {
    id: "ahmed-mohsen",
    name: "Ahmed Mohsen",
    arabicName: "أحمد محسن",
    image: "/COMMITTEES/Ahmed Mohsen.webp",
  },
  {
    id: "sherif",
    name: "Sherif",
    arabicName: "شريف",
    image: "/COMMITTEES/Sherif.webp",
  },
  {
    id: "mohamed-sherif",
    name: "Mohamed Sherif",
    arabicName: "محمد شريف",
    image: "/COMMITTEES/Mohamed Sherif.webp",
  },
];

export default function AlumniPage() {
  return (
    <div className="min-h-screen bg-[#050708] text-white flex flex-col selection:bg-emerald-400 selection:text-zinc-950 font-sans antialiased">
      {/* Existing Shared Public Website Navigation */}
      <ResponsiveNav />

      <main className="flex-1">
        {/* ========================================================= */}
        {/* HERO SECTION                                              */}
        {/* ========================================================= */}
        <section className="relative overflow-hidden border-b border-white/10 pt-16 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32">
          {/* Subtle Ambient Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-[0.07] blur-[150px]"
            style={{
              background: "radial-gradient(circle, #34d399 0%, #38bdf8 45%, transparent 75%)",
            }}
          />

          <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              {/* Eyebrow */}
              <div className="flex flex-wrap items-center gap-2.5 mb-6">
                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-emerald-400/30 bg-emerald-400/10 text-emerald-400">
                  <Award size={14} />
                </span>
                <span className="font-mono text-xs font-bold tracking-[0.2em] text-emerald-400 uppercase">
                  HONOR ROLL · لوحة الشرف
                </span>
                <span className="text-white/20">|</span>
                <span className="arabic text-xs text-white/50" dir="rtl">
                  خريجو وقدامى النادي
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
                Recognizing Our <br />
                <span className="text-emerald-400">Former Members.</span>
              </h1>

              {/* Subtitle */}
              <p className="mt-6 text-base sm:text-lg text-white/70 leading-relaxed font-sans max-w-2xl">
                Honoring the dedication, initiative, and foundational contributions of former members who helped build and inspire the IT Club community at Borg Al Arab Technological University.
              </p>

              {/* Arabic Subtitle */}
              <p className="arabic mt-4 text-base sm:text-lg text-neutral-400 leading-relaxed font-medium max-w-2xl" dir="rtl">
                تحية تقدير واعتزاز للأعضاء والخريجين الذين ساهموا بجهودهم وعطائهم المخلص في تأسيس وتطوير مجتمع نادي تكنولوجيا المعلومات وتركوا أثرًا باقيًا للأجيال القادمة.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* ALUMNI RECOGNITION GRID                                   */}
        {/* ========================================================= */}
        <section
          aria-label="Alumni Members"
          className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
        >
          <div className="flex items-center justify-between gap-4 mb-10 pb-4 border-b border-white/10">
            <div>
              <span className="font-mono text-xs font-semibold tracking-[0.18em] text-emerald-400 uppercase">
                DISTINGUISHED ALUMNI
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                Members of Distinction
              </h2>
            </div>
            <span className="font-mono text-xs text-white/40 tabular-nums">
              04 RECOGNIZED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 lg:gap-8">
            {ALUMNI_LIST.map((member) => (
              <article
                key={member.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#080b0e] transition-all duration-300 hover:border-emerald-400/40 hover:shadow-[0_0_30px_rgba(52,211,153,0.12)] hover:-translate-y-1"
              >
                {/* Top Subtle Emerald Accent Line */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-transparent transition-colors duration-300 group-hover:bg-emerald-400 z-20" />

                {/* Portrait Image Container */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-900/60">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                  />

                  {/* Gradient bottom shadow to blend with card */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#080b0e] via-[#080b0e]/70 to-transparent"
                  />

                  {/* Recognition Badge on Top Right */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-3 py-1 backdrop-blur-md">
                    <Sparkles size={11} className="text-emerald-400" />
                    <span className="font-mono text-[9.5px] font-semibold uppercase tracking-wider text-white/80">
                      Alumni
                    </span>
                  </div>
                </div>

                {/* Member Identity Body */}
                <div className="relative p-5 sm:p-6 flex flex-col flex-1 justify-between bg-[#080b0e]">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-semibold block mb-1">
                      IT CLUB ALUMNUS
                    </span>

                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                      {member.name}
                    </h3>

                    {member.arabicName && (
                      <p className="arabic text-sm text-neutral-400 mt-1 font-medium" dir="rtl">
                        {member.arabicName}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                    <span className="font-mono text-[10px] tracking-wider uppercase">
                      BATU Community
                    </span>
                    <Heart size={13} className="text-emerald-400/60" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* CLOSING TRIBUTE / CONNECTION CTA                          */}
        {/* ========================================================= */}
        <section className="border-t border-white/10 bg-gradient-to-b from-transparent to-white/[0.01] py-16 sm:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 rounded-2xl border border-white/10 bg-[#080b0e]/60 p-8 sm:p-10 backdrop-blur-sm">
              <div className="max-w-2xl">
                <span className="font-mono text-xs font-bold tracking-[0.2em] text-emerald-400 uppercase">
                  OUR ENDURING LEGACY
                </span>
                <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Built on the efforts of those who came before.
                </h2>
                <p className="mt-2 text-sm sm:text-base text-white/60 leading-relaxed font-sans">
                  The projects, workshops, and standards thriving in IT Club today were made possible through the dedication and initiative of former leaders and members.
                </p>
              </div>

              <div className="shrink-0">
                <Link
                  href="/community"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-emerald-400"
                >
                  <span>Explore Current Community</span>
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Existing Shared Public Website Footer */}
      <Footer />
    </div>
  );
}
