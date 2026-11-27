"use client";

import Image from "next/image";
import { initials } from "@/lib/ui/initials";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "./motion/gsap";
import type { EditorialEvent, EditorialPartner, EditorialPerson, EditorialTrack } from "./editorial-types";
import type { SessionPhoto } from "@/lib/ui/session-gallery";
import { HomeEvents } from "./HomeEvents";
import { MiniFilm } from "./HeroVideo";
import { Chapter } from "./HomeChapter";

// Static Tailwind v4 utilities keep this public page themeable without a CSS module.
const styles = {
  fillWord: "[--word-fill:100%] [--word-ink:var(--site-ink)] inline-block bg-[linear-gradient(90deg,var(--word-ink)_var(--word-fill),var(--site-word-muted)_var(--word-fill))] bg-clip-text text-transparent data-[word-accent]:[--word-ink:var(--site-sky-ink)] supports-[not_(background-clip:text)]:bg-none supports-[not_(background-clip:text)]:text-[var(--word-ink)] forced-colors:bg-none forced-colors:text-[CanvasText]",
  textLink: "group/link inline-flex min-h-11 items-center gap-2 text-[.76rem] tracking-[-.03em] text-[var(--site-copy)]! transition-colors hover:text-[var(--site-ink)]! [&>span]:inline-block [&>span]:text-[var(--site-sky-ink)] [&>span]:transition-transform [&>span]:duration-300 hover:[&>span]:translate-x-0.5 hover:[&>span]:-translate-y-0.5 motion-reduce:[&>span]:transition-none",
  pill: "group/pill relative isolate inline-flex min-h-[50px] items-center gap-4 overflow-hidden rounded-full bg-[var(--site-glass-strong)] py-[5px] pr-[5px] pl-5 text-[.78rem] tracking-[-.03em] text-[var(--site-ink)]! transition-colors duration-300 before:absolute before:inset-0 before:-z-[1] before:translate-y-full before:rounded-[inherit] before:bg-[var(--site-ink)] before:transition-transform before:duration-500 before:ease-[cubic-bezier(.2,.8,.2,1)] hover:text-[var(--site-night)]! hover:before:translate-y-0 motion-reduce:before:transition-none [&>span]:grid [&>span]:size-10 [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[var(--site-sky)] [&>span]:text-[var(--site-night)] [&>span]:transition-transform [&>span]:duration-500 hover:[&>span]:rotate-45 motion-reduce:hover:[&>span]:rotate-0",
  empty: "rounded-[18px] bg-[var(--site-glass)] p-[clamp(26px,3vw,44px)] text-[var(--site-copy)] shadow-[inset_0_1px_0_var(--site-glass-highlight)] [&_h3]:mt-0 [&_h3]:text-[clamp(1.7rem,2.6vw,2.6rem)] [&_h3]:font-normal [&_h3]:leading-[1.1] [&_h3]:tracking-[-.055em] [&_h3]:text-[var(--site-ink)] [&_p]:text-[.83rem]",
  section: "scroll-mt-[88px] px-[var(--site-gutter)] text-[var(--site-ink)]",
  sectionTop: "flex items-start justify-between gap-8 max-[520px]:items-center max-[520px]:gap-3",

  about: "relative pt-[clamp(80px,9vw,150px)] pb-[clamp(60px,7vw,110px)]",
  aboutStatement: "relative [perspective:1400px] [transform-style:preserve-3d] px-[4vw] pt-[clamp(42px,4.5vw,70px)] max-[800px]:px-0 [&>h2]:mx-auto [&>h2]:my-0 [&>h2]:max-w-[1380px] [&>h2]:[transform-style:preserve-3d] [&>h2]:[backface-visibility:hidden] [&>h2]:text-center [&>h2]:text-[clamp(1.6rem,3.15vw,3.9rem)] [&>h2]:font-normal [&>h2]:leading-[1.36] [&>h2]:tracking-[-.063em] max-[800px]:[&>h2]:text-[clamp(1.55rem,4vw,2.6rem)] max-[520px]:[&>h2]:text-[1.5rem] max-[520px]:[&>h2]:leading-[1.5]",
  chipFilm: "relative mx-[.12em] inline-block h-[.92em] w-[1.6em] overflow-hidden rounded-full align-[-0.14em] [transform-style:preserve-3d] [backface-visibility:hidden] shadow-[0_0_0_1px_rgb(82_232_209_/_.22),0_10px_30px_rgb(0_0_0_/_.35)] [&>video]:h-full [&>video]:w-full [&>video]:object-cover [&>video]:object-[64%_50%] [&>video]:scale-[1.6]",
  chipLogo: "relative mx-[.12em] inline-grid h-[.92em] w-[1.6em] place-items-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_40%,rgb(40_205_183_/_.32),rgb(12_19_23_/_.96)_70%)] align-[-0.14em] [transform-style:preserve-3d] [backface-visibility:hidden] shadow-[0_0_0_1px_rgb(82_232_209_/_.22),0_10px_30px_rgb(0_0_0_/_.35)] [&>img]:h-[72%] [&>img]:w-auto [&>img]:drop-shadow-[0_0_10px_rgb(82_232_209_/_.55)]",
  chipText: "inline-block -rotate-2 rounded-full bg-[var(--site-sky)] px-[.45em] py-[.02em] align-middle text-[.66em] font-medium leading-[1.5] tracking-[-.03em] text-[var(--site-night)] [transform-style:preserve-3d] [backface-visibility:hidden] shadow-[0_10px_30px_rgb(40_205_183_/_.25)]",
  aboutArabic: "mt-[26px] mb-0 text-center text-[.87rem] text-[var(--site-copy)] max-[520px]:text-[.72rem]",
  seal: "relative mx-auto mt-[clamp(36px,4vw,60px)] grid size-[clamp(110px,9vw,140px)] place-items-center [&>svg]:absolute [&>svg]:inset-0 [&>svg]:size-full [&>svg]:fill-[var(--site-copy)] [&>svg]:motion-safe:animate-[spin_22s_linear_infinite] [&>img]:size-[38%] [&>img]:drop-shadow-[0_0_18px_rgb(82_232_209_/_.45)]",
  stats: "grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-px overflow-hidden rounded-[18px] bg-[rgb(255_255_255_/_.06)]",
  stat: "flex min-h-[190px] flex-col justify-between bg-[var(--site-night)] p-[clamp(20px,2vw,30px)] max-[520px]:min-h-[150px] [&_strong]:block [&_strong]:text-[clamp(3.2rem,6vw,6.6rem)] [&_strong]:font-normal [&_strong]:leading-[.9] [&_strong]:tracking-[-.08em] [&_strong]:tabular-nums",

  tracks: "relative overflow-hidden",
  tracksPin: "flex flex-col pt-[clamp(70px,8vw,120px)] pb-[clamp(50px,6vw,90px)] data-[pinned=true]:h-[100svh] data-[pinned=true]:justify-center data-[pinned=true]:pt-[96px] data-[pinned=true]:pb-[40px]",
  tracksHead: "flex items-end justify-between gap-8 px-[var(--site-gutter)] max-[800px]:flex-col max-[800px]:items-start max-[800px]:gap-5 [&_h2]:m-0 [&_h2]:mt-6 [&_h2]:text-[clamp(2.2rem,4.6vw,5.4rem)] [&_h2]:font-normal [&_h2]:leading-[1] [&_h2]:tracking-[-.07em] [&_h2_em]:not-italic [&_h2_em]:text-[var(--site-sky-ink)]",
  tracksMeta: "grid min-w-[220px] justify-items-end gap-3 text-[.7rem] text-[var(--site-copy)] max-[800px]:w-full max-[800px]:justify-items-start [&>span:first-child]:text-[clamp(1.4rem,2vw,2rem)] [&>span:first-child]:tabular-nums [&>span:first-child]:tracking-[-.05em] [&>span:first-child]:text-[var(--site-ink)]",
  progress: "relative block h-[2px] w-[220px] overflow-hidden rounded-full bg-[rgb(255_255_255_/_.1)] max-[800px]:hidden [&>i]:absolute [&>i]:inset-0 [&>i]:origin-left [&>i]:scale-x-0 [&>i]:bg-[var(--site-sky-ink)]",
  viewport: "mt-[clamp(30px,4vh,56px)] overflow-x-auto overscroll-x-contain [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden data-[pinned=true]:snap-none",
  strip: "m-0 flex w-max list-none gap-[clamp(14px,1.4vw,22px)] p-0 px-[var(--site-gutter)] will-change-transform",
  panel: "group/panel relative flex h-[clamp(400px,58vh,620px)] w-[clamp(300px,34vw,560px)] snap-start flex-col justify-between overflow-hidden rounded-[18px] bg-[radial-gradient(ellipse_at_85%_-10%,color-mix(in_srgb,var(--track)_30%,transparent),transparent_62%),linear-gradient(160deg,rgb(255_255_255_/_.05),rgb(255_255_255_/_.015))] p-[clamp(22px,2.2vw,34px)] text-[var(--site-ink)]! shadow-[inset_0_1px_0_var(--site-glass-highlight)] transition-shadow duration-500 hover:shadow-[inset_0_1px_0_var(--site-glass-highlight),0_0_70px_color-mix(in_srgb,var(--track)_18%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--site-sky-ink)] max-[520px]:w-[82vw]",
  panelTop: "relative z-[1] flex items-start justify-between gap-4 text-[.68rem] text-[var(--site-copy)] [&>span:first-child]:tabular-nums [&>span:last-child]:rounded-full [&>span:last-child]:bg-[color-mix(in_srgb,var(--track)_16%,transparent)] [&>span:last-child]:px-3 [&>span:last-child]:py-1.5 [&>span:last-child]:text-[var(--track)]",
  panelCode: "pointer-events-none absolute top-[14%] right-[-.06em] text-[clamp(8rem,15vw,15rem)] leading-[.8] font-medium tracking-[-.09em] text-transparent [-webkit-text-stroke:1px_color-mix(in_srgb,var(--track)_55%,transparent)] opacity-80 transition-[color] duration-700 group-hover/panel:text-[color-mix(in_srgb,var(--track)_14%,transparent)]",
  panelBody: "relative z-[1] [&_h3]:m-0 [&_h3]:text-[clamp(2rem,3.2vw,3.6rem)] [&_h3]:font-normal [&_h3]:leading-[1] [&_h3]:tracking-[-.07em] [&_p]:mt-4 [&_p]:mb-0 [&_p]:max-w-[40ch] [&_p]:text-[.8rem] [&_p]:leading-[1.65] [&_p]:text-[var(--site-copy)]",
  panelArabic: "mt-2 block text-[.8rem] text-[var(--track)]",
  panelTags: "mt-5 flex flex-wrap gap-1.5 [&>span]:rounded-full [&>span]:bg-[rgb(255_255_255_/_.06)] [&>span]:px-2.5 [&>span]:py-1 [&>span]:text-[.62rem] [&>span]:text-[var(--site-copy)]",
  panelCta: "mt-6 inline-flex items-center gap-2 text-[.72rem] text-[var(--track)] [&>span]:inline-block [&>span]:transition-transform [&>span]:duration-500 group-hover/panel:[&>span]:rotate-45",
  panelEnd: "flex h-[clamp(400px,58vh,620px)] w-[clamp(260px,24vw,380px)] snap-start flex-col justify-end gap-6 rounded-[18px] p-[clamp(22px,2.2vw,34px)] [&>p]:m-0 [&>p]:text-[clamp(1.5rem,2.2vw,2.4rem)] [&>p]:leading-[1.1] [&>p]:tracking-[-.06em]",

  community: "pt-[clamp(70px,8vw,120px)] pb-[clamp(50px,6vw,90px)]",
  peopleHead: "mt-8 grid grid-cols-[1fr_auto] items-end gap-8 max-[800px]:grid-cols-1 [&_h2]:m-0 [&_h2]:text-[clamp(2.2rem,4.6vw,5.4rem)] [&_h2]:font-normal [&_h2]:leading-[1] [&_h2]:tracking-[-.07em] [&_h2_em]:not-italic [&_h2_em]:text-[var(--site-sky-ink)]",
  peopleArabic: "mt-4 mb-0 w-fit text-[.78rem] text-[var(--site-copy)]",
  peopleGrid: "mt-[clamp(36px,4vw,60px)] grid grid-cols-4 gap-[clamp(12px,1.2vw,20px)] max-[1100px]:grid-cols-3 max-[800px]:grid-cols-2 max-[520px]:grid-cols-1",
  personCard: "group/person relative flex min-h-[330px] flex-col justify-between overflow-hidden rounded-[18px] bg-[var(--site-glass)] p-[clamp(20px,1.8vw,28px)] text-[var(--site-ink)]! shadow-[inset_0_1px_0_var(--site-glass-highlight)] transition-[background] duration-500 hover:bg-[var(--site-glass-strong)]",
  monogram: "grid size-[clamp(64px,6vw,86px)] place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,rgb(82_232_209_/_.35),rgb(40_205_183_/_.08)_60%,transparent)] text-[clamp(1.3rem,1.8vw,1.8rem)] tracking-[-.06em] text-[var(--site-ink)] shadow-[inset_0_0_0_1px_rgb(82_232_209_/_.25)] transition-transform duration-700 group-hover/person:scale-[1.08] motion-reduce:transition-none",
  personBody: "[&_small]:block [&_small]:text-[.62rem] [&_small]:uppercase [&_small]:tracking-[.12em] [&_small]:text-[var(--site-sky-ink)] [&_h3]:mt-3 [&_h3]:mb-0 [&_h3]:text-[clamp(1.25rem,1.6vw,1.7rem)] [&_h3]:font-normal [&_h3]:leading-[1.1] [&_h3]:tracking-[-.05em] [&_p]:mt-2 [&_p]:mb-0 [&_p]:text-[.72rem] [&_p]:leading-[1.6] [&_p]:text-[var(--site-copy)]",
  partners: "mt-[clamp(40px,4vw,64px)] flex flex-wrap items-baseline gap-x-6 gap-y-3 text-[.74rem] text-[var(--site-copy)] [&_a]:text-[var(--site-ink)] [&_a]:transition-colors [&_a:hover]:text-[var(--site-sky-ink)]",

  sessions: "pt-[clamp(70px,8vw,120px)] pb-[clamp(50px,6vw,90px)]",
  sessionsGrid: "mt-[clamp(36px,4vw,60px)] columns-3 gap-[clamp(12px,1.2vw,20px)] max-[800px]:columns-2 max-[520px]:columns-1 [&>figure]:mb-[clamp(12px,1.2vw,20px)] [&>figure]:break-inside-avoid",

  join: "relative isolate overflow-hidden pt-[clamp(80px,9vw,140px)] pb-[clamp(70px,8vw,120px)]",
  marquee: "pointer-events-none select-none overflow-hidden whitespace-nowrap text-[clamp(4.6rem,14vw,15rem)] leading-[.9] tracking-[-.08em] [&>div]:flex [&>div]:w-max [&>div]:will-change-transform [&>div>span]:pr-[.35em] [&_em]:not-italic [&_em]:text-transparent [&_em]:[-webkit-text-stroke:1px_rgb(82_232_209_/_.7)]",
  joinBody: "relative mt-[clamp(40px,5vw,80px)] grid grid-cols-[1fr_auto] items-end gap-10 px-[var(--site-gutter)] max-[800px]:grid-cols-1 [&_h2]:m-0 [&_h2]:max-w-[18ch] [&_h2]:text-[clamp(2rem,3.6vw,4.2rem)] [&_h2]:font-normal [&_h2]:leading-[1.06] [&_h2]:tracking-[-.065em]",
  joinCopy: "mt-6 flex flex-wrap items-center gap-x-7 gap-y-4 [&>p]:m-0 [&>p]:max-w-[44ch] [&>p]:text-[.8rem] [&>p]:leading-[1.7] [&>p]:text-[var(--site-copy)]",
  joinTile: "group/tile relative grid size-[clamp(150px,15vw,230px)] place-items-center overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_50%_38%,rgb(40_205_183_/_.3),rgb(10_16_20_/_.95)_68%)] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_30px_90px_rgb(40_205_183_/_.12)] [&>img]:h-[52%] [&>img]:w-auto [&>img]:drop-shadow-[0_0_24px_rgb(82_232_209_/_.5)] [&>img]:transition-transform [&>img]:duration-700 hover:[&>img]:scale-110 hover:[&>img]:rotate-[-6deg] motion-reduce:[&>img]:transition-none [&>span]:absolute [&>span]:right-4 [&>span]:bottom-3 [&>span]:text-[.66rem] [&>span]:text-[var(--site-copy)]",
  notice: "flex items-center gap-5 bg-[rgb(40_205_183_/_7%)] px-[var(--site-gutter)] py-[18px] text-[.78rem] [&>span]:whitespace-nowrap [&>span]:text-[.62rem] [&>span]:uppercase [&>span]:tracking-[.14em] [&>span]:text-[var(--site-sky-ink)] [&>p]:m-0 [&>a]:ml-auto [&>a]:whitespace-nowrap [&>a]:text-[var(--site-sky-ink)] max-[800px]:flex-wrap max-[800px]:gap-[9px]",
} as const;

export type HomeStat = { value: number; label: string; arabic?: string };

type HomeProps = {
  tracks: EditorialTrack[];
  people: EditorialPerson[];
  events: EditorialEvent[];
  eventMode: "upcoming" | "archive" | "undated";
  partners: EditorialPartner[];
  stats: HomeStat[];
  sessions: SessionPhoto[];
  notice?: { title: string; summary?: string; href?: string };
};

/** Each word keeps its semantic text in SSR; only its paint is scroll-driven. */
function FillWords({ text, accent = false }: { text: string; accent?: boolean }) {
  return text.split(/(\s+)/).filter(Boolean).map((word, index) => /^\s+$/.test(word) ? word : (
    <span key={index} className={styles.fillWord} data-editorial-word data-word-accent={accent || undefined}>{word}</span>
  ));
}

function PillLink({ href, children }: { href: string; children: string }) {
  return <Link href={href} className={styles.pill} data-magnetic>{children}<span aria-hidden="true">↗</span></Link>;
}

function TextLink({ href, children }: { href: string; children: string }) {
  return <Link href={href} className={styles.textLink}>{children} <span aria-hidden="true">↗</span></Link>;
}


function SealText() {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true">
      <defs><path id="home-seal-path" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" /></defs>
      <text fontSize="13.2" letterSpacing="4.2"><textPath href="#home-seal-path">LEARN BY DOING · BUILD TOGETHER · SHARE FORWARD ·</textPath></text>
    </svg>
  );
}

function TracksRail({ tracks }: { tracks: EditorialTrack[] }) {
  if (!tracks.length) {
    return <div className="px-[var(--site-gutter)] pt-10"><div className={styles.empty}><h3>The next chapter is taking shape.</h3><p>No tracks have been published yet.</p><PillLink href="/community">Meet the community</PillLink></div></div>;
  }
  return (
    <div className={styles.viewport} data-tracks-viewport>
      <ol className={styles.strip} data-tracks-strip aria-label="Published tracks">
        {tracks.map((track, index) => (
          <li key={track.id} data-tracks-panel>
            <Link href={`/tracks#${track.slug}`} className={styles.panel} style={{ "--track": track.color } as CSSProperties} data-cursor="Explore" aria-label={`Explore ${track.title}`}>
              <div className={styles.panelTop}><span>{String(index + 1).padStart(2, "0")} / {String(tracks.length).padStart(2, "0")}</span><span>{track.category || "Track"}</span></div>
              <span className={styles.panelCode} aria-hidden="true" data-tracks-code>{track.code || track.slug.toUpperCase()}</span>
              <div className={styles.panelBody}>
                <h3>{track.title}</h3>
                {track.arabicTitle ? <span className={styles.panelArabic} lang="ar" dir="rtl">{track.arabicTitle}</span> : null}
                {track.summary ? <p>{track.summary}</p> : null}
                {track.capabilities.length ? <div className={styles.panelTags}>{track.capabilities.map((item) => <span key={item}>{item}</span>)}</div> : null}
                <span className={styles.panelCta}>Explore this track <span aria-hidden="true">↗</span></span>
              </div>
            </Link>
          </li>
        ))}
        <li className={styles.panelEnd}>
          <p>Different ways to contribute.<br /><span className="text-[var(--site-copy)]">One shared practice.</span></p>
          <PillLink href="/tracks">All tracks</PillLink>
        </li>
      </ol>
    </div>
  );
}

function People({ people }: { people: EditorialPerson[] }) {
  if (!people.length) {
    return (
      <div className={`${styles.empty} mt-[clamp(36px,4vw,60px)] grid grid-cols-[1fr_auto] items-end gap-8 max-[800px]:grid-cols-1`} data-editorial-reveal>
        <div><h3>The people make the difference.</h3><p className="mb-0">Our published directory is being prepared. Meet the committees and how they work together.</p></div>
        <PillLink href="/community">Explore the community</PillLink>
      </div>
    );
  }
  return (
    <div className={styles.peopleGrid}>
      {people.slice(0, 8).map((person) => (
        <Link key={person.id} href={`/community/${person.slug}`} className={styles.personCard} data-editorial-lift data-cursor="Profile" aria-label={`Meet ${person.name}`}>
          <span className={styles.monogram} aria-hidden="true">{initials(person.name)}</span>
          <div className={styles.personBody}>
            <small>{person.committee || "Community"}</small>
            <h3>{person.name}</h3>
            {person.role ? <p>{person.role}</p> : null}
            {person.scope ? <p className="line-clamp-2">{person.scope}</p> : null}
          </div>
        </Link>
      ))}
    </div>
  );
}

function Sessions({ photos }: { photos: SessionPhoto[] }) {
  const [failed, setFailed] = useState<Record<string, true>>({});
  const visible = photos.filter((photo) => !failed[photo.src]);
  if (!visible.length) return null;
  return (
    <section className={`${styles.section} ${styles.sessions}`} id="home-sessions" aria-labelledby="home-sessions-title" data-editorial-sessions>
      <Chapter number="V">Sessions</Chapter>
      <div className={styles.peopleHead}><h2 id="home-sessions-title" data-editorial-reveal>Tile by tile.<br /><em>Session by session.</em></h2></div>
      <div className={styles.sessionsGrid}>
        {visible.map((photo) => (
          <figure key={photo.src} className="m-0 overflow-hidden rounded-[14px] bg-[var(--site-glass)]" data-editorial-lift>
            <Image src={photo.src} alt={photo.caption} width={photo.width} height={photo.height} sizes="(max-width: 520px) 92vw, (max-width: 800px) 46vw, 31vw" className="h-auto w-full" onError={() => setFailed((value) => ({ ...value, [photo.src]: true }))} />
            <figcaption className="flex justify-between gap-3 px-4 py-3 text-[.66rem] text-[var(--site-copy)]"><span>{photo.caption}</span><span className="text-[var(--site-sky-ink)]">{photo.committee}</span></figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function StatValue({ value }: { value: number }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const state = { value: 0 };
    const pad = (number: number) => String(number).padStart(2, "0");
    const context = gsap.context(() => {
      gsap.to(state, {
        value, duration: 1.6, ease: "power3.out",
        scrollTrigger: { trigger: element, start: "top 88%", once: true },
        onStart: () => { element.textContent = pad(0); },
        onUpdate: () => { element.textContent = pad(Math.round(state.value)); },
      });
    }, element);
    return () => { context.revert(); element.textContent = pad(value); };
  }, [value]);
  return <strong ref={ref}>{String(value).padStart(2, "0")}</strong>;
}

export function EditorialHome({ tracks, people, events, eventMode, partners, stats, sessions, notice }: HomeProps) {
  const shownStats = stats.filter((stat) => stat.value > 0);
  const hasSessions = sessions.length > 0;
  return (
    <>
      {notice ? <aside className={styles.notice} aria-label="Current club notice"><span>Club notice</span><p><strong>{notice.title}</strong>{notice.summary ? ` — ${notice.summary}` : ""}</p>{notice.href ? <a href={notice.href}>Read more ↗</a> : null}</aside> : null}

      <section className={`${styles.section} ${styles.about}`} id="about" aria-labelledby="about-title" data-editorial-about>
        <div className={styles.sectionTop}><Chapter number="I">About</Chapter><TextLink href="/community">Meet the people</TextLink></div>
        <div className={styles.aboutStatement}>
          <h2 id="about-title" data-editorial-statement>
            <FillWords text="We are a student-led " />
            <span className={styles.chipFilm} data-editorial-chip aria-hidden="true"><MiniFilm /></span>{" "}
            <FillWords text="technology community at " />
            <span className={styles.chipText} data-editorial-chip>BATU</span>
            <FillWords text=", making room for curious minds and different starting points. From sharing knowledge " />
            {/* eslint-disable-next-line @next/next/no-img-element -- 24px brand mark inside a heading chip */}
            <span className={styles.chipLogo} data-editorial-chip aria-hidden="true"><img src="/logo.webp" alt="" width={48} height={48} /></span>{" "}
            <FillWords text="to building useful ideas, we create the space to " />
            <FillWords text="learn together, practice with purpose, and move ideas forward." accent />
          </h2>
          <p className={styles.aboutArabic} lang="ar" dir="rtl">نتعلّم معًا، ونبني ما بعد الفكرة.</p>
        </div>
        <div className={styles.seal} aria-hidden="true" data-about-depth="seal" data-editorial-symbol>
          <SealText />
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative brand mark */}
          <img src="/logo.webp" alt="" width={64} height={64} />
        </div>
      </section>

        {shownStats.length ? (
          <dl className={`${styles.stats} mx-[var(--site-gutter)] mb-[clamp(20px,3vw,40px)]`} aria-label="IT Club in numbers">
            {shownStats.map((stat) => (
              <div key={stat.label} className={styles.stat} data-editorial-reveal>
                <dd className="m-0"><StatValue value={stat.value} /></dd>
                <dt><span className="block text-[.78rem] text-[var(--site-ink)]">{stat.label}</span>{stat.arabic ? <small className="mt-1 block text-[.7rem] text-[var(--site-mist)]" lang="ar" dir="rtl">{stat.arabic}</small> : null}</dt>
              </div>
            ))}
          </dl>
        ) : null}

      <section className={`${styles.tracks} scroll-mt-[0px] text-[var(--site-ink)]`} id="tracks" aria-labelledby="home-tracks-title" data-editorial-tracks>
        <div className={styles.tracksPin} data-tracks-pin>
          <div className={styles.tracksHead}>
            <div><Chapter number="II">Our tracks</Chapter><h2 id="home-tracks-title">Different ways to learn.<br /><em>One place to belong.</em></h2></div>
            {tracks.length ? <div className={styles.tracksMeta}><span data-tracks-counter>01 / {String(tracks.length).padStart(2, "0")}</span><span className={styles.progress} aria-hidden="true"><i data-tracks-progress /></span><span>Scroll to explore</span></div> : null}
          </div>
          <TracksRail tracks={tracks} />
        </div>
      </section>

      <HomeEvents events={events} eventMode={eventMode} />

      <section className={`${styles.section} ${styles.community}`} id="home-community" aria-labelledby="home-community-title" data-editorial-community>
        <div className={styles.sectionTop}><Chapter number="IV">Community</Chapter><TextLink href="/community">All committees</TextLink></div>
        <div className={styles.peopleHead}>
          <div><h2 id="home-community-title" data-editorial-reveal>Different people.<br /><em>Shared momentum.</em></h2><p className={styles.peopleArabic} lang="ar" dir="rtl">الفكرة بتكبر بناسها.</p></div>
        </div>
        <People people={people} />
        <div className={styles.partners}>
          <span>In good company —</span>
          {partners.length ? partners.slice(0, 5).map((partner, index) => <span key={partner.id}><a href={partner.href || "/sponsors"}>{partner.name}</a>{index < Math.min(5, partners.length) - 1 ? <span className="ml-6 text-[var(--site-mist)]" aria-hidden="true">/</span> : null}</span>) : <span>good ideas grow with good partners.</span>}
          <span className="ml-auto max-[520px]:ml-0"><TextLink href="/sponsors">Our partners</TextLink></span>
        </div>
      </section>

      {hasSessions ? <Sessions photos={sessions} /> : null}

      <section className={`${styles.join} text-[var(--site-ink)] scroll-mt-[88px]`} id="join" aria-labelledby="home-join-title" data-editorial-join>
        <div className="px-[var(--site-gutter)]"><Chapter number={hasSessions ? "VI" : "V"}>Find your place</Chapter></div>
        <div className={`${styles.marquee} mt-[clamp(30px,4vw,60px)]`} aria-hidden="true" data-editorial-join-art>
          <div data-marquee-row="1">{Array.from({ length: 4 }, (_, index) => <span key={index}>Find your people <em>—</em></span>)}</div>
          <div data-marquee-row="2" className="-translate-x-1/4">{Array.from({ length: 4 }, (_, index) => <span key={index}><em>Build</em> something real ·</span>)}</div>
        </div>
        <div className={styles.joinBody} data-editorial-join-panel>
          <div>
            <h2 id="home-join-title">Give your curiosity somewhere to go.</h2>
            <div className={styles.joinCopy}>
              <PillLink href="/tracks">Explore our tracks</PillLink>
              <p>Discover the teams, meet the people, and see where your next idea could begin.<span className="mt-2 block text-[var(--site-mist)]" lang="ar" dir="rtl">فكرتك الجاية مش لازم تبدأ لوحدك.</span></p>
            </div>
          </div>
          <Link href="/community" className={styles.joinTile} aria-label="Meet the IT Club community" data-editorial-symbol data-cursor="Join">
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative brand mark */}
            <img src="/logo.webp" alt="" width={120} height={120} />
            <span aria-hidden="true">Community ↗</span>
          </Link>
        </div>
      </section>
    </>
  );
}
