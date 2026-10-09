"use client";

import Image from "next/image";
import type { TeamMember } from "@/src/components/interview/committee-data";

export interface TeamMemberCardProps {
  member: TeamMember;
  priority?: boolean;
  onSelect?: (member: TeamMember) => void;
}

export const TeamMemberCard = ({
  member,
  priority = false,
  onSelect,
}: TeamMemberCardProps) => {
  const countryLabel = member.countryName || "EGYPT";
  const countryFlag = member.countryFlag || "🇪🇬";

  const formatRoleTitle = () => {
    if (member.committee && member.committee !== "IT Club" && member.committee !== "PENDING_VERIFICATION") {
      return `${member.role} of ${member.committee}`;
    }
    if (member.committee === "IT Club") {
      return `${member.role} of IT Club`;
    }
    return member.role || "Leader";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && onSelect) {
      e.preventDefault();
      onSelect(member);
    }
  };

  return (
    <article
      tabIndex={0}
      role="button"
      onClick={() => onSelect?.(member)}
      onKeyDown={handleKeyDown}
      aria-label={`${member.name}, ${member.role} in ${member.committee}`}
      className="group relative aspect-3/4 w-full overflow-hidden bg-[#0a0d10] select-none rounded-none border border-white/5 transition-all duration-400 ease-out hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d98a] focus-visible:ring-offset-2 focus-visible:ring-offset-black cursor-pointer"
    >
      {/* Portrait Image */}
      {member.image ? (
        <Image
          src={member.image}
          alt={`${member.name} — ${member.role}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 17vw"
          className="object-cover object-top filter grayscale contrast-[1.05] transition-all duration-400 ease-out group-hover:grayscale-0 group-hover:scale-[1.02] group-focus-visible:grayscale-0 group-focus-visible:scale-[1.02] motion-reduce:transition-none motion-reduce:transform-none"
          priority={priority}
          loading={priority ? undefined : "lazy"}
        />
      ) : (
        /* Silhouette Fallback */
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 text-neutral-700">
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

      {/* Subtle top vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-black/40 to-transparent"
      />

      {/* Dark bottom gradient: default state is legible, strengthens on hover for revealed metadata */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-black/50 via-40% to-transparent transition-all duration-400 ease-out group-hover:from-black/95 group-hover:via-black/75 group-hover:via-55% group-focus-visible:from-black/95 group-focus-visible:via-black/75"
      />

      {/* Metadata Container */}
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 md:p-4.5 flex flex-col justify-end pointer-events-none">
        {/* On-hover emerald accent bar (revealed smoothly on pointer hover / keyboard focus) */}
        <div
          aria-hidden="true"
          className="w-7 h-[2px] bg-[#35d98a] mb-2 transform origin-left transition-all duration-400 ease-out opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 group-focus-visible:opacity-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
        />

        {/* Country Flag & Label (Visible in default state) */}
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono font-medium tracking-[0.16em] uppercase text-neutral-400 mb-0.5">
          <span className="text-xs shrink-0 select-none" aria-hidden="true">
            {countryFlag}
          </span>
          <span className="truncate">{countryLabel}</span>
        </div>

        {/* Member Name (Visible in default state) */}
        <h3 className="font-sans text-sm sm:text-base lg:text-[17px] font-bold text-white tracking-tight leading-snug line-clamp-1">
          {member.name}
        </h3>

        {/* On-hover Role & Committee (Hidden in default state, smoothly revealed on hover/focus) */}
        <div className="max-h-0 opacity-0 overflow-hidden transform translate-y-1 transition-all duration-400 ease-out group-hover:max-h-24 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:max-h-24 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 motion-reduce:transition-none">
          {/* Role */}
          <p className="text-neutral-300 text-xs sm:text-[13px] font-medium pt-1 leading-tight truncate">
            {formatRoleTitle()}
          </p>

          {/* Committee / Organization in Emerald Green */}
          <p className="text-[#35d98a] text-[11px] sm:text-xs font-bold tracking-wider uppercase mt-0.5 truncate">
            {member.committee}
          </p>
        </div>
      </div>
    </article>
  );
};
