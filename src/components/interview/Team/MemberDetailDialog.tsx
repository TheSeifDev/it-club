"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { FaLinkedinIn, FaGithub, FaGlobe } from "react-icons/fa6";
import type { TeamMember } from "@/src/components/interview/committee-data";
import {
  formatRoleMetadata,
  formatCommitteeMetadata,
  getMemberAboutInfo,
  isValidHttpsUrl,
} from "@/src/components/interview/committee-data";
import { CountryFlag } from "./CountryFlag";

export interface MemberDetailDialogProps {
  member: TeamMember | null;
  onClose: () => void;
  onClosing?: () => void;
}

export const MemberDetailDialog = ({
  member,
  onClose,
  onClosing,
}: MemberDetailDialogProps) => {
  const [prevMember, setPrevMember] = useState<TeamMember | null>(null);
  const [displayedMember, setDisplayedMember] = useState<TeamMember | null>(null);
  const [isEntering, setIsEntering] = useState(false);

  // Sync displayed member during render without useEffect cascading renders
  if (member !== prevMember) {
    setPrevMember(member);
    if (member) {
      setDisplayedMember(member);
    } else {
      setIsEntering(false);
    }
  }

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isMouseDownOnBackdrop = useRef(false);
  const isClosingRef = useRef(false);

  // Kick off entrance transition via RAF once member is present
  useEffect(() => {
    if (!member) return;

    isClosingRef.current = false;
    const raf = requestAnimationFrame(() => {
      setIsEntering(true);
    });

    return () => cancelAnimationFrame(raf);
  }, [member]);

  // Coordinated closing sequence
  const initiateClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    // Trigger reverse animation
    setIsEntering(false);
    onClosing?.();

    // After reverse transition finishes (350ms), notify parent to clear selection
    const timer = window.setTimeout(() => {
      isClosingRef.current = false;
      onClose();
    }, 350);

    return () => clearTimeout(timer);
  }, [onClose, onClosing]);

  // Lock body scroll while open or animating
  useEffect(() => {
    if (member || isEntering) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [member, isEntering]);

  // Focus trap and keyboard navigation (Escape, Tab, Shift+Tab)
  useEffect(() => {
    if (!member && !isEntering) return;

    // Focus close button initially once entered
    if (isEntering) {
      const focusTimer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(focusTimer);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        initiateClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [member, isEntering, initiateClose]);

  if (!member && !isEntering) return null;
  const currentMember = member ?? displayedMember;
  if (!currentMember) return null;

  const countryLabel = currentMember.countryName;
  const roleLine = formatRoleMetadata(
    currentMember.role,
    currentMember.committee,
    currentMember.needsReview
  );
  const committeeLine = formatCommitteeMetadata(currentMember.committee);
  const aboutInfo = getMemberAboutInfo(currentMember);

  // Validate external profile destinations (accepts only verified https:// URLs)
  const validLinkedin = isValidHttpsUrl(currentMember.linkedin)
    ? currentMember.linkedin
    : undefined;
  const validGithub = isValidHttpsUrl(currentMember.github)
    ? currentMember.github
    : undefined;
  const validPortfolio = isValidHttpsUrl(currentMember.portfolio)
    ? currentMember.portfolio
    : undefined;
  const hasAnyLinks = Boolean(validLinkedin || validGithub || validPortfolio);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-profile-name"
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 transition-all duration-400 ease-out motion-reduce:transition-none ${
        isEntering
          ? "bg-black/85 backdrop-blur-md opacity-100"
          : "bg-black/0 backdrop-blur-none opacity-0 pointer-events-none"
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          isMouseDownOnBackdrop.current = true;
        }
      }}
      onMouseUp={(e) => {
        if (isMouseDownOnBackdrop.current && e.target === e.currentTarget) {
          initiateClose();
        }
        isMouseDownOnBackdrop.current = false;
      }}
    >
      {/* Editorial Profile Overlay Container */}
      <div
        ref={dialogRef}
        onMouseDown={(e) => {
          e.stopPropagation();
          isMouseDownOnBackdrop.current = false;
        }}
        className={`relative w-full max-w-4xl lg:max-w-5xl max-h-[92vh] flex flex-col md:flex-row bg-[#080b0e] border border-white/12 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden rounded-none transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none motion-reduce:transform-none ${
          isEntering
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-[0.98] translate-y-4"
        }`}
      >
        {/* Close Button positioned in the upper-right corner */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={initiateClose}
          aria-label="Close profile"
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 z-40 p-2.5 text-neutral-400 hover:text-white bg-black/60 hover:bg-black/90 border border-white/10 hover:border-white/30 rounded-full transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d98a]"
        >
          <X size={18} />
        </button>

        {/* ========================================================= */}
        {/* LEFT COLUMN — PORTRAIT (40–45% of width, full color)      */}
        {/* ========================================================= */}
        <div className="relative w-full md:w-[42%] lg:w-[40%] aspect-4/3 sm:aspect-square md:aspect-auto md:min-h-[520px] lg:min-h-[580px] shrink-0 bg-[#06080a] overflow-hidden border-b md:border-b-0 md:border-r border-white/10">
          {currentMember.image ? (
            <div
              className={`relative w-full h-full transition-all duration-500 ease-out motion-reduce:transition-none ${
                isEntering ? "opacity-100 scale-100" : "opacity-0 scale-[1.03]"
              }`}
            >
              <Image
                src={currentMember.image}
                alt={currentMember.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 420px, 480px"
                className="object-cover object-top filter-none"
                priority
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-neutral-700">
              <svg
                viewBox="0 0 100 133"
                className="h-3/4 w-full text-neutral-800"
                fill="currentColor"
                aria-hidden="true"
              >
                <circle cx="50" cy="42" r="19" />
                <path d="M8 133c0-30 18-46 42-46s42 16 42 46z" />
              </svg>
            </div>
          )}

          {/* Subtle bottom vignette on photo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent md:from-black/40"
          />
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN — PROFILE INFORMATION (55–60% of width)      */}
        {/* ========================================================= */}
        <div className="w-full md:w-[58%] lg:w-[60%] flex flex-col justify-between p-6 sm:p-8 md:p-10 lg:p-12 overflow-y-auto max-h-[85vh]">
          <div>
            {/* 1. First Line: Large Member Name */}
            <div
              style={{
                transitionDelay: isEntering ? "100ms" : "0ms",
              }}
              className={`transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none motion-reduce:transform-none ${
                isEntering
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3"
              }`}
            >
              <h2
                id="member-profile-name"
                className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-bold text-white tracking-tight leading-tight pr-12"
              >
                {currentMember.name}
              </h2>
            </div>

            {/* 2. Second Line: Emerald Role Title | Subtle Divider | Country Flag & Muted Country Label */}
            <div
              style={{
                transitionDelay: isEntering ? "160ms" : "0ms",
              }}
              className={`mt-2 sm:mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm md:text-[14.5px] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none motion-reduce:transform-none ${
                isEntering
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3"
              }`}
            >
              {/* Role in emerald green */}
              <span className="font-semibold text-[#35d98a] tracking-normal leading-normal uppercase">
                {roleLine}
              </span>

              {/* Vertical Divider, Flag & Muted Gray Country Label */}
              {(countryLabel || currentMember.countryCode) && (
                <>
                  <span aria-hidden="true" className="text-white/20 select-none">
                    |
                  </span>
                  <div className="inline-flex items-center gap-1.5 font-mono text-xs sm:text-sm uppercase tracking-wider text-neutral-400">
                    <CountryFlag
                      countryCode={currentMember.countryCode}
                      countryName={countryLabel}
                      className="w-4.5 h-auto aspect-3/2 shrink-0 rounded-[1px] shadow-xs"
                    />
                    {countryLabel && <span>{countryLabel}</span>}
                  </div>
                </>
              )}
            </div>

            {/* Optional full committee metadata line when distinct from role */}
            {committeeLine &&
              committeeLine !== roleLine &&
              !(roleLine.includes("CLUB") && committeeLine.includes("CLUB")) && (
                <p
                  style={{
                    transitionDelay: isEntering ? "200ms" : "0ms",
                  }}
                  className={`text-xs sm:text-[13px] font-semibold tracking-wider text-[#35d98a]/85 uppercase mt-1 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none motion-reduce:transform-none ${
                    isEntering
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-3"
                  }`}
                >
                  {committeeLine}
                </p>
              )}

            {/* 3. Compact Social Links Row immediately below (LinkedIn, GitHub, Portfolio) */}
            {hasAnyLinks && (
              <div
                style={{
                  transitionDelay: isEntering ? "240ms" : "0ms",
                }}
                className={`mt-3.5 sm:mt-4 flex items-center gap-2.5 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none motion-reduce:transform-none ${
                  isEntering
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-3"
                }`}
              >
                {validLinkedin && (
                  <a
                    href={validLinkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View ${currentMember.name}'s LinkedIn profile`}
                    title="View LinkedIn profile"
                    className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-[#35d98a]/50 text-neutral-300 hover:text-[#35d98a] transition-all duration-200 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d98a]"
                  >
                    <FaLinkedinIn size={14} aria-hidden="true" />
                  </a>
                )}

                {validGithub && (
                  <a
                    href={validGithub}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View ${currentMember.name}'s GitHub profile`}
                    title="View GitHub profile"
                    className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-[#35d98a]/50 text-neutral-300 hover:text-[#35d98a] transition-all duration-200 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d98a]"
                  >
                    <FaGithub size={14} aria-hidden="true" />
                  </a>
                )}

                {validPortfolio && (
                  <a
                    href={validPortfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View ${currentMember.name}'s portfolio`}
                    title="View portfolio"
                    className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-[#35d98a]/50 text-neutral-300 hover:text-[#35d98a] transition-all duration-200 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d98a]"
                  >
                    <FaGlobe size={14} aria-hidden="true" />
                  </a>
                )}
              </div>
            )}

            {/* 6. ABOUT Section */}
            {aboutInfo.aboutEn && (
              <div
                style={{
                  transitionDelay: isEntering ? "290ms" : "0ms",
                }}
                className={`mt-6 sm:mt-8 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none motion-reduce:transform-none ${
                  isEntering
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-3"
                }`}
              >
                <h3 className="text-xs font-mono font-bold tracking-[0.18em] text-neutral-500 uppercase mb-2">
                  ABOUT
                </h3>
                <p className="text-sm sm:text-[15px] leading-[1.65] text-[#cfd5db] font-sans">
                  {aboutInfo.aboutEn}
                </p>
                {aboutInfo.aboutAr && (
                  <p className="arabic mt-3 text-sm sm:text-[15px] leading-[1.8] text-[#8f969d]">
                    {aboutInfo.aboutAr}
                  </p>
                )}
              </div>
            )}

            {/* 7. Verified Responsibilities or Assignment Note */}
            {aboutInfo.responsibilities && aboutInfo.responsibilities.length > 0 && (
              <div
                style={{
                  transitionDelay: isEntering ? "340ms" : "0ms",
                }}
                className={`mt-6 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none motion-reduce:transform-none ${
                  isEntering
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-3"
                }`}
              >
                <h3 className="text-xs font-mono font-bold tracking-[0.18em] text-neutral-500 uppercase mb-2.5">
                  RESPONSIBILITIES
                </h3>
                <ul className="space-y-2">
                  {aboutInfo.responsibilities.map((resp, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-300"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#35d98a] shrink-0 mt-1.5" />
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aboutInfo.note && (
              <div
                style={{
                  transitionDelay: isEntering ? "330ms" : "0ms",
                }}
                className={`mt-6 p-3 sm:p-4 bg-white/5 border border-white/10 text-xs text-neutral-400 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none motion-reduce:transform-none ${
                  isEntering
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-3"
                }`}
              >
                <span className="text-neutral-300 font-semibold block mb-1">
                  VERIFICATION STATUS
                </span>
                {aboutInfo.note}
              </div>
            )}
          </div>

          {/* 8. Footer Metadata */}
          <div
            style={{
              transitionDelay: isEntering ? "390ms" : "0ms",
            }}
            className={`mt-8 pt-5 border-t border-white/10 flex items-center justify-between text-[11px] sm:text-xs text-neutral-500 font-mono tracking-wider uppercase transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none motion-reduce:transform-none ${
              isEntering
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-3"
            }`}
          >
            <span>IT CLUB LEADERSHIP</span>
            <span>RECRUITMENT 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};
