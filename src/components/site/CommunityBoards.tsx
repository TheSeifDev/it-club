import Image from "next/image";
import type { CSSProperties } from "react";
import type { BoardPhoto } from "@/lib/ui/board-photos";
import type { RosterPerson } from "@/lib/ui/board-roster";
import { Grain } from "./editorial/kit";

export type BoardCard = {
  slug: string;
  code: string;
  title: string;
  arabic?: string;
  category?: string;
  summary?: string;
  color: string;
  responsibilities: Array<{ title: string; desc?: string }>;
  photo?: BoardPhoto;
  people?: RosterPerson[];
};


function Person({ person, width, eager }: { person: RosterPerson; width: number; eager: boolean }) {
  return (
    <figure className="group/person relative m-0 shrink-0" style={{ width: `${width}%`, marginInline: `-${(width * .09).toFixed(2)}%` }}>
      <Image src={person.src} alt={`${person.name}, ${person.role}`} width={person.width} height={person.height} sizes="(max-width: 900px) 30vw, 14vw" priority={eager} className="h-auto w-full origin-bottom drop-shadow-[0_24px_40px_rgb(0_0_0_/_.45)] transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)] group-hover/person:-translate-y-[3%] group-hover/person:scale-[1.04] motion-reduce:transition-none" />
      <figcaption className="pointer-events-none absolute max-md:hidden bottom-[8%] left-1/2 z-10 -translate-x-1/2 translate-y-2 whitespace-nowrap rounded-full bg-[var(--site-ink)] px-3 py-1.5 text-[.62rem] text-[var(--site-night)] opacity-0 transition duration-300 group-hover/person:translate-y-0 group-hover/person:opacity-100">
        {person.name} <span className="opacity-60">· {person.role}</span>
      </figcaption>
    </figure>
  );
}

/** A board "group photo" composed from member cutouts; two rows when the board is large. */
function LineupSide({ board, index }: { board: BoardCard; index: number }) {
  const people = board.people ?? [];
  const split = people.length > 5 ? Math.ceil(people.length / 2) : people.length;
  const front = people.slice(0, split);
  const back = people.slice(split);
  const width = (count: number) => Math.min(42, 125 / Math.max(count, 1));
  return (
    <div className="relative h-full min-h-[380px] overflow-hidden [background:radial-gradient(ellipse_at_50%_100%,color-mix(in_srgb,var(--board)_48%,transparent),transparent_66%),radial-gradient(ellipse_at_15%_10%,color-mix(in_srgb,var(--board)_18%,transparent),transparent_55%),#0b1115]">
      <span data-stack-photo aria-hidden="true" className="absolute inset-x-0 top-[6%] block text-center text-[clamp(9rem,24vw,25rem)] leading-[.8] tracking-[-.09em] text-transparent [-webkit-text-stroke:1.5px_color-mix(in_srgb,var(--board)_70%,white)] opacity-70">{board.code}</span>
      <Grain className="opacity-20" />
      {back.length ? (
        <div className="absolute inset-x-[3%] bottom-[24%] flex items-end justify-center brightness-[.78] saturate-[.9]">
          {back.map((person) => <Person key={person.id} person={person} width={width(back.length) * .84} eager={false} />)}
        </div>
      ) : null}
      <div className="absolute inset-x-[3%] bottom-0 flex items-end justify-center">
        {front.map((person) => <Person key={person.id} person={person} width={width(front.length)} eager={index === 0} />)}
      </div>
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[18%] bg-[linear-gradient(to_top,rgb(5_8_11_/_.7),transparent)]" />
      <p className="absolute top-[clamp(18px,2vw,28px)] left-[clamp(18px,2vw,28px)] m-0 text-[.62rem] uppercase tracking-[.16em] text-white/75">The {board.code} board · {String(people.length).padStart(2, "0")}</p>
    </div>
  );
}

function PhotoSide({ board, index }: { board: BoardCard; index: number }) {
  if (board.photo) {
    return (
      <div className="relative h-full min-h-[280px] overflow-hidden">
        <div data-stack-photo className="absolute inset-0">
          <Image src={board.photo.src} alt={board.photo.alt} fill sizes="(max-width: 900px) 100vw, 58vw" className="object-cover" unoptimized={board.photo.src.startsWith("/manus-storage")} priority={index === 0} />
        </div>
        <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgb(5_8_11_/_.75))]" />
        <Grain />
        <p className="absolute bottom-[clamp(16px,2vw,28px)] left-[clamp(16px,2vw,28px)] m-0 text-[.64rem] uppercase tracking-[.16em] text-white/85">{board.photo.caption || `The ${board.code} board`}</p>
      </div>
    );
  }
  if (board.people?.length) return <LineupSide board={board} index={index} />;
  // Placeholder print: honest about the missing group photo, still on-brand.
  return (
    <div className="relative grid h-full min-h-[280px] place-items-center overflow-hidden [background:radial-gradient(ellipse_at_30%_20%,color-mix(in_srgb,var(--board)_42%,transparent),transparent_62%),radial-gradient(ellipse_at_80%_90%,color-mix(in_srgb,var(--board)_22%,transparent),transparent_60%),#0b1115]">
      <span data-stack-photo aria-hidden="true" className="block text-[clamp(9rem,25vw,26rem)] leading-[.8] tracking-[-.09em] text-transparent [-webkit-text-stroke:1.5px_color-mix(in_srgb,var(--board)_85%,white)]">{board.code}</span>
      <Grain className="opacity-25" />
      <span aria-hidden="true" className="absolute inset-[clamp(12px,1.4vw,20px)] rounded-[10px] shadow-[inset_0_0_0_1px_rgb(255_255_255_/_.12)]" />
      <p className="absolute top-[clamp(22px,2.4vw,34px)] left-[clamp(22px,2.4vw,34px)] m-0 text-[.62rem] uppercase tracking-[.16em] text-white/70">Board photo</p>
      <p className="absolute right-[clamp(22px,2.4vw,34px)] bottom-[clamp(22px,2.4vw,34px)] m-0 inline-flex items-center gap-2 text-[.62rem] uppercase tracking-[.16em] text-white/70"><span className="size-1.5 rounded-full bg-[var(--board)] motion-safe:animate-pulse" aria-hidden="true" />Developing</p>
    </div>
  );
}

export function CommunityBoards({ boards }: { boards: BoardCard[] }) {
  const total = String(boards.length).padStart(2, "0");
  return (
    <div data-stack className="relative grid gap-[clamp(14px,2vw,22px)] px-[var(--site-gutter)] min-[900px]:gap-0">
      {boards.map((board, index) => {
        const people = board.people ?? [];
        const points = board.responsibilities.slice(0, people.length ? 3 : 4);
        return (
          <article
            key={board.slug}
            id={`board-${board.slug}`}
            data-stack-card
            aria-labelledby={`board-title-${board.slug}`}
            style={{ "--board": board.color } as CSSProperties}
            className="scroll-mt-[var(--site-header-clearance,112px)] min-[900px]:sticky min-[900px]:top-[calc(var(--site-header-clearance,112px)-6px)] min-[900px]:h-[calc(100svh-var(--site-header-clearance,112px)-10px)] min-[900px]:min-h-[600px] min-[900px]:pb-[clamp(14px,2vw,22px)]"
          >
            <div data-stack-body className="relative grid h-full origin-top overflow-hidden rounded-[22px] bg-[#0a0f13] shadow-[0_-30px_80px_rgb(0_0_0_/_.5),inset_0_1px_0_var(--site-glass-highlight)] min-[900px]:grid-cols-[1.18fr_1fr]">
              <PhotoSide board={board} index={index} />
              <div className="relative flex flex-col justify-between gap-8 p-[clamp(22px,3vw,52px)]">
                <div className="flex items-start justify-between gap-4 text-[.68rem] uppercase tracking-[.14em] text-[var(--site-copy)]">
                  <span className="tabular-nums"><span className="text-[var(--board)]">{String(index + 1).padStart(2, "0")}</span> / {total}</span>
                  <span>{board.category || "Board"}</span>
                </div>
                <div>
                  {board.arabic ? <p className="m-0 font-[family-name:var(--font-alexandria)] text-[clamp(.85rem,1.1vw,1rem)] text-[var(--board)]" lang="ar" dir="rtl">{board.arabic}</p> : null}
                  <h3 id={`board-title-${board.slug}`} className="mt-3 mb-0 text-[clamp(2.5rem,4.8vw,5.6rem)] font-normal leading-[.92] tracking-[-.075em]">{board.title}</h3>
                  {board.summary ? <p className="mt-5 mb-0 max-w-[46ch] text-[clamp(.84rem,.98vw,.95rem)] leading-[1.75] text-[var(--site-copy)]">{board.summary}</p> : null}
                </div>
                {people.length ? (
                  <ul aria-label={`${board.title} members`} className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                    {people.map((person) => (
                      <li key={person.id} className="rounded-full bg-white/[.05] px-3 py-1.5 text-[.68rem] text-[var(--site-ink)]">{person.name} <span className="text-[var(--board)]">· {person.role}</span></li>
                    ))}
                  </ul>
                ) : null}
                {points.length ? (
                  <ol className="m-0 grid list-none gap-0 p-0">
                    {points.map((point, pointIndex) => (
                      <li key={point.title} className="grid grid-cols-[34px_minmax(0,1fr)] gap-3 border-t border-[rgb(255_255_255_/_.07)] py-3 text-[.8rem] leading-[1.55]">
                        <span className="tabular-nums text-[var(--board)]">{String(pointIndex + 1).padStart(2, "0")}</span>
                        <span><span className="text-[var(--site-ink)]">{point.title}</span>{point.desc && people.length < 5 ? <span className="text-[var(--site-copy)] max-[1180px]:hidden"> — {point.desc}</span> : null}</span>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/** Club leadership line-up: tall portrait tiles from the roster cutouts. */
export function LeadershipLineup({ people }: { people: RosterPerson[] }) {
  return (
    <ol className="m-0 grid list-none grid-cols-4 gap-[clamp(10px,1.4vw,20px)] p-0 max-[900px]:grid-cols-2" data-rise-group>
      {people.map((person, index) => (
        <li key={person.id} data-rise className="group/lead">
          <figure className="relative m-0 aspect-[3/4] overflow-hidden rounded-[20px] [background:radial-gradient(ellipse_at_50%_100%,rgb(40_205_183_/_.42),transparent_68%),#0b1115]">
            <span aria-hidden="true" className="absolute top-4 left-4 text-[.62rem] tabular-nums uppercase tracking-[.16em] text-white/70">{String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden="true" className="absolute inset-0 origin-bottom scale-y-0 bg-[linear-gradient(to_top,rgb(40_205_183_/_.5),transparent_75%)] transition-transform duration-700 ease-[cubic-bezier(.7,0,.2,1)] group-hover/lead:scale-y-100 motion-reduce:transition-none" />
            <Image src={person.src} alt={`${person.name}, ${person.role} of IT Club`} fill sizes="(max-width: 900px) 46vw, 23vw" className="object-contain object-bottom pt-[12%] transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)] group-hover/lead:scale-[1.04] motion-reduce:transition-none" />
          </figure>
          <p className="mt-4 mb-0 text-[clamp(1.3rem,2vw,2rem)] leading-[1.05] tracking-[-.055em] text-[var(--site-ink)]">{person.name}</p>
          <p className="mt-1.5 mb-0 text-[.64rem] uppercase tracking-[.16em] text-[var(--site-sky-ink)]">{person.role} · IT Club</p>
        </li>
      ))}
    </ol>
  );
}
