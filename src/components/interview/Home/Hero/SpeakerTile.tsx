import Image from "next/image";

import type { Speaker } from "./hero-data";

export const SpeakerTile = ({
  speaker,
  priority = false,
}: {
  speaker: Speaker;
  priority?: boolean;
}) => {
  const label = speaker.roleLabel ?? speaker.company;

  return (
    <div className="relative aspect-3/4 w-full shrink-0 overflow-hidden border-b border-white/5 bg-linear-to-b from-neutral-800 to-neutral-900">
      {speaker.image ? (
        <Image
          src={speaker.image}
          alt={`${speaker.name} — ${label}`}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover object-top grayscale"
          priority={priority}
        />
      ) : (
        <svg
          viewBox="0 0 100 133"
          className="absolute inset-x-0 bottom-0 h-[75%] w-full text-neutral-700/70"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="50" cy="42" r="19" />
          <path d="M8 133c0-30 18-46 42-46s42 16 42 46z" />
        </svg>
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />

      <div className="absolute bottom-6 left-6 right-6 font-mono md:bottom-10 md:left-11 md:right-8">
        <p className="truncate text-sm font-bold tracking-[0.12em] text-white md:text-base">
          {speaker.name}
        </p>

        <p className="mt-1 truncate text-[10px] tracking-[0.15em] text-neutral-400 md:mt-2 md:text-xs md:tracking-[0.2em]">
          {label}
        </p>
      </div>
    </div>
  );
};