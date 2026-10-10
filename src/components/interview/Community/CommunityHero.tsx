"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import {
  getFeaturedHeroMembers,
  getLegitimateMembers,
  getMemberCutoutImage,
  formatRoleMetadata,
  formatCommitteeMetadata,
  type TeamMember,
} from "@/src/components/interview/committee-data";

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export interface CommunityHeroProps {
  /**
   * Note: As specified, hero portraits and member elements are hover-only,
   * decorative previews that NEVER trigger a modal or navigation.
   * onSelectMember is retained only for interface backward-compatibility.
   */
  onSelectMember?: (member: TeamMember) => void;
}

export function CommunityHero({}: CommunityHeroProps) {
  // 1. First 10 eligible unique members for featured rotation
  const featuredMembers = useMemo(() => getFeaturedHeroMembers(), []);
  const allLegitimate = useMemo(() => getLegitimateMembers(), []);

  // 2. Verified stats derived dynamically from dataset
  const totalMembersCount = allLegitimate.length;
  const uniqueCommitteesCount = new Set(
    allLegitimate.map((m) => (m.committee || "").trim())
  ).size;
  const leadershipCount = allLegitimate.filter(
    (m) =>
      !m.needsReview &&
      (m.role.toLowerCase().includes("head") ||
        m.role.toLowerCase().includes("lead"))
  ).length;

  // 3. Auto-rotation state (faster 2.8s interval)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Next / Prev member callbacks
  const nextMember = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % featuredMembers.length);
  }, [featuredMembers.length]);

  const selectMemberIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Rotation timer (2.8 seconds) with page visibility awareness
  useEffect(() => {
    if (reducedMotion || isPaused || featuredMembers.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const startTimer = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        nextMember();
      }, 2800);
    };

    startTimer();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        startTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [nextMember, isPaused, reducedMotion, featuredMembers.length]);

  const currentMember = featuredMembers[currentIndex] || featuredMembers[0];
  const currentRole = formatRoleMetadata(
    currentMember?.role,
    currentMember?.committee,
    currentMember?.needsReview
  );
  const currentCommittee = formatCommitteeMetadata(currentMember?.committee);

  return (
    <section
      aria-labelledby="community-hero-heading"
      className="relative w-full overflow-hidden bg-[#050708] text-white min-h-[760px] lg:min-h-[820px] flex flex-col justify-between select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ================================================================= */}
      {/* CINEMATIC STAGE SPOTLIGHT ENVIRONMENT (LAYER 1 & 2)               */}
      {/* ================================================================= */}

      {/* Layer 2A: Photographic Stage Spotlight Asset */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
      >
        <Image
          src="/spotlight-stage.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-top opacity-60 mix-blend-screen scale-[1.03] transition-opacity duration-1000"
        />
      </div>

      {/* Layer 2B: Angled Volumetric Light Cones & Stage Truss Beams */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none opacity-85"
      >
        {/* Overhead beam 1 from top-right truss shining onto center-right */}
        <div
          className="absolute -top-10 right-[15%] w-[420px] h-[850px] opacity-75 blur-2xl origin-top -rotate-[22deg]"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(66,232,149,0.45) 15%, rgba(24,200,237,0.18) 45%, transparent 80%)",
          }}
        />

        {/* Overhead beam 2: tighter, intense focus beam */}
        <div
          className="absolute -top-10 right-[25%] w-[320px] h-[800px] opacity-65 blur-xl origin-top -rotate-[16deg]"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(53,217,138,0.5) 18%, rgba(66,232,149,0.12) 50%, transparent 85%)",
          }}
        />

        {/* Overhead beam 3: wide ambient teal wash */}
        <div
          className="absolute -top-10 right-[6%] w-[480px] h-[900px] opacity-50 blur-3xl origin-top -rotate-[28deg]"
          style={{
            background:
              "linear-gradient(180deg, rgba(66,232,149,0.45) 0%, rgba(24,200,237,0.15) 35%, transparent 75%)",
          }}
        />

        {/* Light sources / Stage pinpoints at top right */}
        <div className="absolute top-0 right-[20%] w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_28px_10px_rgba(255,255,255,0.9),0_0_60px_25px_rgba(66,232,149,0.8)]" />
        <div className="absolute top-2 right-[12%] w-3 h-3 rounded-full bg-white shadow-[0_0_24px_8px_rgba(255,255,255,0.8),0_0_50px_20px_rgba(24,200,237,0.7)]" />
        <div className="absolute top-4 right-[27%] w-3 h-3 rounded-full bg-white shadow-[0_0_20px_6px_rgba(255,255,255,0.7),0_0_45px_15px_rgba(66,232,149,0.6)]" />

        {/* Soft emerald atmospheric halo directly behind featured person */}
        <div
          className="absolute top-[20%] right-[10%] w-[580px] h-[580px] rounded-full blur-[110px] opacity-75"
          style={{
            background:
              "radial-gradient(circle, rgba(66,232,149,0.3) 0%, rgba(24,200,237,0.12) 40%, transparent 70%)",
          }}
        />
      </div>

      {/* Layer 2C: Environmental dark fades ensuring left text legibility and smooth bottom blend */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-1 select-none"
        style={{
          background:
            "linear-gradient(to right, #050708 38%, rgba(5,7,8,0.75) 55%, transparent 78%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 z-1 select-none"
        style={{
          background:
            "linear-gradient(to top, #050708 20%, rgba(5,7,8,0.9) 45%, transparent 100%)",
        }}
      />

      {/* ================================================================= */}
      {/* MAIN HERO CONTENT (SPLIT COMPOSITION)                             */}
      {/* ================================================================= */}
      <div className="relative z-10 mx-auto w-full max-w-[1520px] px-6 pt-16 pb-12 sm:pb-16 md:px-10 lg:px-12 lg:pt-24 lg:pb-20 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
          {/* ========================================================= */}
          {/* LEFT SIDE — EDITORIAL CONTENT & VERIFIED STATISTICS       */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Arabic Subtitle */}
            <p className="arabic text-sm sm:text-base md:text-lg text-neutral-300 font-semibold tracking-wide">
              مجتمع نادي تكنولوجيا المعلومات
            </p>

            {/* Large Bold Editorial Headline */}
            <h1
              id="community-hero-heading"
              className="mt-4 text-4xl sm:text-5xl md:text-6xl lg:text-[74px] font-bold leading-[0.92] tracking-[-0.045em] text-white"
            >
              The people building
              <span className="text-[#35d98a] block mt-1 transition-all duration-300 hover:[text-shadow:0_0_35px_rgba(53,217,138,0.4)]">
                what comes next.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="mt-6 text-base sm:text-lg md:text-[18.5px] leading-[1.6] text-[#aeb4bb] max-w-xl font-sans">
              Meet the students behind IT Club — the people organizing,
              engineering, designing, and growing the community at BATU.
            </p>

            {/* Thin Horizontal Divider */}
            <div className="h-px w-full max-w-xl bg-white/10 mt-9 mb-7" />

            {/* Row of Compact Community Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-7 max-w-xl">
              <div>
                <p className="text-3xl sm:text-4xl font-bold tracking-tight text-white tabular-nums">
                  {totalMembersCount}
                </p>
                <p className="font-mono text-[9.5px] sm:text-[10px] tracking-[0.18em] uppercase text-neutral-400 mt-1">
                  MEMBERS
                </p>
              </div>

              <div>
                <p className="text-3xl sm:text-4xl font-bold tracking-tight text-[#35d98a] tabular-nums">
                  {uniqueCommitteesCount}
                </p>
                <p className="font-mono text-[9.5px] sm:text-[10px] tracking-[0.18em] uppercase text-neutral-400 mt-1">
                  COMMITTEES
                </p>
              </div>

              <div>
                <p className="text-3xl sm:text-4xl font-bold tracking-tight text-white tabular-nums">
                  {leadershipCount}
                </p>
                <p className="font-mono text-[9.5px] sm:text-[10px] tracking-[0.18em] uppercase text-neutral-400 mt-1">
                  LEADERSHIP
                </p>
              </div>

              <div>
                <p className="text-3xl sm:text-4xl font-bold tracking-tight text-white tabular-nums">
                  2026
                </p>
                <p className="font-mono text-[9.5px] sm:text-[10px] tracking-[0.18em] uppercase text-neutral-400 mt-1">
                  ACADEMIC CYCLE
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT SIDE — FEATURED MEMBER IN CINEMATIC SPOTLIGHT       */}
          {/* (HOVER-ONLY, NEVER CLICKS TO OPEN A MODAL)                 */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            {/* Spotlight Portrait Stage (NO CARD BOUNDARY, HOVER-ONLY) */}
            <div
              className="group relative w-full max-w-[360px] sm:max-w-[420px] lg:max-w-[460px] aspect-3/4 sm:aspect-4/5 flex items-center justify-center cursor-default select-none"
              aria-label={`Featured spotlight: ${currentMember?.name}, ${currentRole}`}
            >
              {/* Backlight halo directly on the silhouette with hover rim-light intensification */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-6 top-8 bottom-10 rounded-full opacity-65 blur-3xl transition-all duration-300 group-hover:opacity-85 group-hover:scale-105"
                style={{
                  background:
                    "radial-gradient(circle, rgba(53,217,138,0.4) 0%, rgba(24,200,237,0.18) 45%, transparent 70%)",
                }}
              />

              {/* Layered Crossfading Isolated Transparent Portraits */}
              <div
                className="relative w-full h-full overflow-hidden"
                style={{
                  WebkitMaskImage:
                    "linear-gradient(to bottom, black 72%, transparent 99%)",
                  maskImage:
                    "linear-gradient(to bottom, black 72%, transparent 99%)",
                }}
              >
                {featuredMembers.map((member, idx) => {
                  const isActive = idx === currentIndex;
                  const cutoutSrc = getMemberCutoutImage(member) || member.image;

                  return (
                    <div
                      key={member.id}
                      aria-hidden={!isActive}
                      className={`absolute inset-0 flex items-end justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isActive
                          ? "opacity-100 scale-100 pointer-events-auto"
                          : "opacity-0 scale-[1.025] pointer-events-none"
                      } ${reducedMotion ? "transition-none" : ""}`}
                    >
                      {cutoutSrc ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={cutoutSrc}
                            alt={member.name}
                            fill
                            priority={idx <= 1}
                            sizes="(max-width: 768px) 380px, 480px"
                            className="object-contain object-bottom transition-all duration-300 filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)] group-hover:brightness-105 group-hover:scale-[1.02]"
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {/* Subtle dark bottom feather blending isolated body naturally into dark floor */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-[#050708] via-[#050708]/80 to-transparent z-10"
                />
              </div>
            </div>

            {/* ========================================================= */}
            {/* FEATURED MEMBER METADATA (CENTERED BENEATH PORTRAIT)       */}
            {/* (NO CLICK HANDLER, HOVER-SENSITIVE)                       */}
            {/* ========================================================= */}
            <div className="mt-4 flex flex-col items-center text-center max-w-sm px-4">
              {/* Emerald Status Indicator */}
              <div className="inline-flex items-center gap-2 mb-1.5 font-mono text-[10.5px] font-bold tracking-[0.2em] text-[#35d98a] uppercase">
                <span className="h-2 w-2 rounded-full bg-[#35d98a] animate-pulse" />
                <span>COMMUNITY SPOTLIGHT</span>
              </div>

              {/* Member Name (Non-clickable heading) */}
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-[#35d98a]">
                {currentMember?.name}
              </h2>

              {/* Compact Role & Committee Description */}
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-neutral-400 mt-1 transition-colors duration-300 group-hover:text-neutral-300">
                <span className="text-[#35d98a]/90 font-medium">{currentRole}</span>
                {currentCommittee && (
                  <>
                    <span className="text-white/20 mx-1.5">·</span>
                    <span>{currentCommittee}</span>
                  </>
                )}
              </p>

              {/* Rotation Stepper Indicators (10 members) */}
              <div
                className="mt-4 flex items-center justify-center gap-1.5"
                aria-label="Featured members rotation selector"
              >
                {featuredMembers.map((m, idx) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => selectMemberIndex(idx)}
                    aria-label={`Show ${m.name}`}
                    title={m.name}
                    className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === currentIndex
                        ? "w-6 bg-[#35d98a]"
                        : "w-2 bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
