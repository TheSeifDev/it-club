import Link from "next/link";
import type { CSSProperties } from "react";
import { CodeCycle } from "./editorial/CodeCycle";
import { HoverIndex } from "./editorial/HoverIndex";
import { ChapterRow, Chars, Grain, kit, KLine, KTile, Marquee, MaskLines, Meta, Pill, ScrollCue, TextLink } from "./editorial/kit";

export type ExhibitionMember = { slug: string; name: string; role?: string };
export type ExhibitionBoard = { title: string; href: string };
export type ExhibitionTrack = {
  id: string;
  slug: string;
  number: string;
  title: string;
  arabicTitle: string;
  tag: string;
  summary: string;
  body?: string;
  color: string;
  rgb: string;
  ink: string;
  terrain: Array<{ title: string; desc?: string }>;
  board?: ExhibitionBoard;
  members: ExhibitionMember[];
  /** Short typographic code (HR, PR, IT…) shown instead of an icon. */
  code: string;
};

const numberWords = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

function splitTerrain(item: { title: string; desc?: string }) {
  if (item.desc) return item;
  const at = item.title.indexOf(":");
  return at > 0 ? { title: item.title.slice(0, at).trim(), desc: item.title.slice(at + 1).trim() } : item;
}

function TrackScene({ track, index, total }: { track: ExhibitionTrack; index: number; total: number }) {
  const terrain = (track.terrain.length ? track.terrain : [{ title: "Published scope is being prepared." }]).map(splitTerrain).slice(0, 6);
  return (
    <article
      id={track.slug}
      data-stack-card
      data-tint={track.color}
      aria-labelledby={`track-title-${track.slug}`}
      style={{ "--track": track.color, "--track-rgb": track.rgb } as CSSProperties}
      className="scroll-mt-0 min-[900px]:sticky min-[900px]:top-0 min-[900px]:h-[100svh] min-[900px]:min-h-[680px]"
    >
      <div data-stack-body className="relative flex h-full origin-top flex-col justify-between gap-10 overflow-hidden rounded-t-[26px] [background:radial-gradient(ellipse_at_88%_0%,rgba(var(--track-rgb),.28),transparent_55%),radial-gradient(ellipse_at_0%_100%,rgba(var(--track-rgb),.12),transparent_50%),#070b0e] px-[var(--site-gutter)] pt-[calc(var(--site-header-clearance,112px)+4px)] pb-[clamp(26px,3vw,46px)] shadow-[0_-40px_90px_rgb(0_0_0_/_.6),inset_0_1px_0_rgba(var(--track-rgb),.35)] max-[899px]:rounded-[22px] max-[899px]:pt-[clamp(26px,6vw,40px)]">
        <Grain className="opacity-[.08]" />
        <div className="relative flex items-start justify-between gap-6 text-[.68rem] uppercase tracking-[.14em] text-[var(--site-copy)]">
          <span className="tabular-nums"><span className="text-[var(--track)]">{track.number}</span> / {String(total).padStart(2, "0")}</span>
          <span className="max-[600px]:hidden">{track.tag}</span>
          {track.arabicTitle ? <span lang="ar" dir="rtl" className="font-[family-name:var(--font-alexandria)] text-[.8rem] tracking-normal normal-case text-[var(--track)]">{track.arabicTitle}</span> : null}
        </div>

        <div className="relative grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-end gap-[clamp(24px,4vw,70px)] max-[899px]:grid-cols-1">
          <span aria-hidden="true" data-fill className={`${kit.fill} block text-[clamp(8rem,27vw,30rem)] leading-[.74] tracking-[-.09em] [--fill-ink:var(--track)] [--stroke:rgba(var(--track-rgb),.7)] max-[899px]:text-[clamp(7rem,40vw,12rem)]`}>{track.code}</span>
          <div className="pb-[clamp(6px,1vw,18px)]">
            <h2 id={`track-title-${track.slug}`} className="m-0 text-[clamp(2.4rem,5vw,5.8rem)] font-normal leading-[.92] tracking-[-.075em]">{track.title}</h2>
            <p className="mt-5 mb-0 max-w-[48ch] text-[clamp(.85rem,1vw,.98rem)] leading-[1.75] text-[var(--site-copy)]">{track.summary}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[.74rem]">
              {track.board ? <Link href={track.board.href} className="inline-flex min-h-11 items-center gap-2 text-[var(--track)]! transition-opacity hover:opacity-75">Meet the {track.board.title} board <span aria-hidden="true">↗</span></Link> : null}
              {track.members.length ? <span className="text-[var(--site-copy)]">{track.members.map((member) => member.name).join(" · ")}</span> : null}
            </div>
          </div>
        </div>

        <ol className="relative m-0 grid list-none grid-cols-3 gap-x-[clamp(16px,2vw,34px)] p-0 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1" aria-label={`What ${track.title} works on`}>
          {terrain.map((item, itemIndex) => (
            <li key={item.title} className={`grid grid-cols-[30px_minmax(0,1fr)] gap-2 border-t border-[rgba(var(--track-rgb),.22)] py-3 text-[.78rem] leading-[1.5] ${itemIndex > 3 ? "max-[1100px]:hidden" : ""} ${itemIndex > 2 ? "max-[600px]:hidden" : ""}`}>
              <span className="tabular-nums text-[var(--track)]">{String(itemIndex + 1).padStart(2, "0")}</span>
              <span><span className="text-[var(--site-ink)]">{item.title}</span>{item.desc ? <span className="mt-1 block text-[.72rem] text-[var(--site-copy)] max-[1280px]:line-clamp-2">{item.desc}</span> : null}</span>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}

export default function TracksExperience({ tracks }: { tracks: ExhibitionTrack[] }) {
  const countWord = numberWords[tracks.length] ?? String(tracks.length);
  const cycle = tracks.map((track) => ({ code: track.code, color: track.color }));
  return (
    <div className={kit.page} data-editorial-page data-tint-scope style={{ "--tint": "#28cdb7" } as CSSProperties}>
      {/* Page glow follows the chapter in view. */}
      <span aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_120%,color-mix(in_srgb,var(--tint)_22%,transparent),transparent_60%)]" />

      <section data-k-spread aria-labelledby="tracks-title" className="relative flex min-h-[max(700px,100svh)] flex-col justify-between px-[var(--site-gutter)] pt-[calc(var(--site-header-clearance,112px)+18px)] pb-[clamp(22px,3vw,40px)]">
        <div className="grid grid-cols-3 items-start gap-4 max-[700px]:grid-cols-2" data-k-fade>
          <Meta>IT Club — Tracks</Meta>
          <Meta className="justify-self-center max-[700px]:hidden">{String(tracks.length).padStart(2, "0")} tracks · one practice</Meta>
          <p className="m-0 justify-self-end font-[family-name:var(--font-alexandria)] text-[.8rem] text-[var(--site-sky-ink)]" lang="ar" dir="rtl">لكل مسار طريقته</p>
        </div>
        <div>
          <h1 id="tracks-title" aria-label={`${countWord} ways to build.`} data-k-title className="m-0 text-[clamp(4rem,15.6vw,18rem)] font-normal leading-[.84] tracking-[-.085em]">
            <KLine side="l"><Chars text={countWord} />{cycle.length ? <KTile className="w-[1.32em] bg-[var(--site-sky)]"><CodeCycle items={cycle} /></KTile> : " "}<Chars text="ways" /></KLine>
            <KLine side="r" className="text-right"><Chars text="to " /><span className="text-[var(--site-sky-ink)]"><Chars text="build" /></span><Chars text="." /></KLine>
          </h1>
          <div className="mt-[clamp(22px,3vw,44px)] flex items-end justify-between gap-8 max-[700px]:flex-col max-[700px]:items-start max-[700px]:gap-5">
            <p data-k-fade className={kit.lead}>Each track is a way of contributing — people, outreach, media, operations, engineering and research. Different crafts, moving as one team.</p>
            <a data-k-fade href="#tracks-index" className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--site-sky-ink)]"><ScrollCue label="Choose a track" /></a>
          </div>
        </div>
      </section>

      {tracks.length ? (
        <>
          <section id="tracks-index" aria-labelledby="tracks-index-title" className="scroll-mt-[var(--site-header-clearance,112px)] pt-[clamp(90px,11vw,170px)] pb-[clamp(70px,8vw,130px)]">
            <div className={kit.gutter}>
              <ChapterRow number="I" label="The index" aside={<span className={`${kit.meta} max-[700px]:hidden`}>Hover · open</span>} />
              <div className="mt-[clamp(28px,3.4vw,52px)] grid grid-cols-[minmax(0,1fr)_minmax(240px,.38fr)] items-end gap-10 max-[900px]:grid-cols-1 max-[900px]:gap-6">
                <MaskLines id="tracks-index-title" className={kit.h2} lines={["Pick a starting", <em key="b">point.</em>]} />
                <p className={kit.lead} data-rise>Jump straight into a track, or keep scrolling — each one takes the stage in its own colour.</p>
              </div>
            </div>
            <div className="mt-[clamp(40px,5vw,80px)]">
              <HoverIndex
                label="IT Club tracks"
                items={tracks.map((track) => ({ key: track.id, href: `#${track.slug}`, number: track.number, title: track.title, arabic: track.arabicTitle, meta: track.code, code: track.code, color: track.color }))}
              />
            </div>
          </section>

          <section aria-label="Tracks, one by one" className="relative">
            <div className={`${kit.gutter} pb-[clamp(36px,4vw,64px)]`}>
              <ChapterRow number="II" label="On stage" aside={<span className={`${kit.meta} max-[700px]:hidden`}>{String(tracks.length).padStart(2, "0")} chapters</span>} />
            </div>
            <div data-stack className="grid gap-4 px-[var(--site-gutter)] min-[900px]:gap-0 min-[900px]:px-0">
              {tracks.map((track, index) => <TrackScene key={track.id} track={track} index={index} total={tracks.length} />)}
            </div>
          </section>
        </>
      ) : (
        <section className={`${kit.gutter} py-[clamp(70px,8vw,130px)]`} role="status">
          <MaskLines className={kit.h2} lines={["The tracks are", <em key="b">being prepared.</em>]} />
          <p className={`${kit.lead} mt-6`}>Published tracks will appear here as soon as they are approved.</p>
        </section>
      )}

      <section aria-labelledby="tracks-cta-title" className="relative overflow-hidden pt-[clamp(80px,9vw,150px)] pb-[clamp(70px,8vw,130px)]">
        <Marquee className="text-[clamp(5rem,15vw,16rem)] leading-[.95] tracking-[-.08em]" speed={1.2}>
          {tracks.map((track) => <span key={track.id} className="pr-[.35em]" style={{ color: track.color }}>{track.code}<span className={`${kit.outline} pl-[.35em] [--stroke:rgb(255_255_255_/_.3)]`}>·</span></span>)}
        </Marquee>
        <div className={`${kit.gutter} mt-[clamp(40px,5vw,80px)] flex items-end justify-between gap-8 max-[800px]:flex-col max-[800px]:items-start`} data-rise>
          <h2 id="tracks-cta-title" className="m-0 max-w-[15ch] text-[clamp(2rem,3.6vw,4.2rem)] font-normal leading-[1.04] tracking-[-.065em]">Found the one that sounds like you?</h2>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
            <Pill href="/register">Apply to a track</Pill>
            <TextLink href="/community">Meet the boards</TextLink>
          </div>
        </div>
      </section>
    </div>
  );
}
