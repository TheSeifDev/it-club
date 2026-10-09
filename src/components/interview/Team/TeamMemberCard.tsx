import Image from "next/image";
import type { TeamMember } from "@/src/components/interview/committee-data";

export interface TeamMemberCardProps {
  member: TeamMember;
  priority?: boolean;
}

export const TeamMemberCard = ({
  member,
  priority = false,
}: TeamMemberCardProps) => {
  const committeeDisplay =
    member.committee && member.committee !== "PENDING_VERIFICATION"
      ? member.committee
      : "IT Club Leadership";

  return (
    <article
      tabIndex={0}
      aria-label={`${member.name}, ${member.role} in ${committeeDisplay}`}
      className="group relative aspect-3/4 w-full overflow-hidden bg-[#080a0c] select-none transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d98a] focus-visible:ring-inset"
    >
      {/* Member Portrait */}
      {member.image ? (
        <Image
          src={member.image}
          alt={`${member.name} — ${member.role}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          className="object-cover object-top filter grayscale contrast-[1.05] transition-all duration-500 ease-out group-hover:grayscale-0 group-hover:scale-105 group-focus-visible:grayscale-0 group-focus-visible:scale-105 motion-reduce:transition-none motion-reduce:transform-none"
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
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-black/50 to-transparent"
      />

      {/* Deep bottom gradient for high contrast text readability */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent via-50%"
      />

      {/* Restrained emerald top accent indicator on hover/focus */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-[#35d98a] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
      />

      {/* Card Information Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4.5 flex flex-col justify-end">
        {/* Role with restrained emerald badge */}
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-[#35d98a] shrink-0"
            aria-hidden="true"
          />
          <span className="font-mono text-[10px] sm:text-xs font-semibold tracking-[0.14em] uppercase text-[#35d98a] truncate">
            {member.role}
          </span>
        </div>

        {/* Member Name */}
        <h3 className="font-sans text-sm sm:text-base lg:text-[17px] font-bold uppercase tracking-wide text-white leading-tight line-clamp-1">
          {member.name}
        </h3>

        {/* Committee */}
        <p className="mt-0.5 font-mono text-[10px] sm:text-[11px] tracking-wider text-neutral-400 truncate">
          {committeeDisplay}
        </p>
      </div>
    </article>
  );
};
