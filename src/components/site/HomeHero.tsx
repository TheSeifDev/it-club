import Link from "next/link";
import { HeroVideo } from "./HeroVideo";

/*
 * Baseline (no JS / reduced motion): a full-bleed film with the title, tagline
 * and actions readable on top. With motion, editorial-home.ts switches
 * data-hero-stage to "scroll": the film is clipped to the inline tile between
 * "IT" and "Club" and opens to full-bleed while the sticky stage is scrolled.
 */
const styles = {
  root: "group/hero relative isolate h-[100svh] min-h-[620px] w-full bg-[var(--site-night)] text-[var(--site-ink)] data-[hero-stage=scroll]:h-[250svh]",
  sticky: "sticky top-0 isolate h-[100svh] min-h-[620px] w-full overflow-hidden",
  film: "absolute inset-0 -z-[2] overflow-hidden bg-[var(--site-night)]",
  media: "absolute inset-0 origin-[0_0] will-change-transform",
  shade: "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_0%,rgb(5_7_10_/_.35)_55%,rgb(5_7_10_/_.88)_100%),linear-gradient(0deg,rgb(5_7_10_/_.78),transparent_55%)]",
  meta: "pointer-events-none absolute top-[clamp(108px,17vh,170px)] right-[var(--site-gutter)] left-[var(--site-gutter)] flex items-start justify-between text-[clamp(.62rem,.8vw,.78rem)] tracking-[-.01em] text-[var(--site-copy)] max-[520px]:top-[102px]",
  metaCenter: "max-[800px]:hidden",
  title: "absolute top-1/2 right-0 left-0 m-0 flex -translate-y-[58%] items-center justify-center gap-[.07em] px-[var(--site-gutter)] text-[clamp(4.1rem,18.5vw,17rem)] font-normal leading-[.82] tracking-[-.085em] whitespace-nowrap max-[520px]:-translate-y-[70%] max-[520px]:text-[clamp(3.6rem,21vw,6rem)]",
  word: "block overflow-hidden pt-[.04em] pr-[.05em] pb-[.1em] [&>span]:block",
  tile: "relative inline-block h-[.74em] w-[1.04em] shrink-0 translate-y-[.02em] overflow-hidden rounded-[.07em] bg-[var(--site-night-2,#0b1014)] shadow-[0_0_0_1px_rgb(82_232_209_/_.16),0_30px_90px_rgb(40_205_183_/_.16)]",
  tileImage: "absolute inset-0 h-full w-full object-cover object-[64%_50%]",
  bottom: "absolute right-[var(--site-gutter)] bottom-[clamp(28px,5vh,56px)] left-[var(--site-gutter)] grid grid-cols-[1fr_auto] items-end gap-8 max-[800px]:grid-cols-1 max-[800px]:gap-6",
  intro: "max-w-[390px] [&>p]:m-0 [&>p]:text-[clamp(.78rem,.95vw,.92rem)] [&>p]:leading-[1.6] [&>p]:tracking-[-.02em] [&>p]:text-[var(--site-copy)]",
  rotator: "relative mb-4 block h-[1.2em] overflow-hidden text-[clamp(1.1rem,1.7vw,1.6rem)] leading-[1.2] tracking-[-.05em] text-[var(--site-ink)] [&>span]:absolute [&>span]:inset-x-0 [&>span]:top-0 [&>span]:block [&>span:not(:first-child)]:translate-y-full",
  arabic: "mt-3 block w-fit text-[.75rem] text-[var(--site-mist)]",
  actions: "flex items-center gap-6 max-[800px]:justify-between",
  join: "group/join relative isolate inline-flex min-h-[52px] items-center gap-4 overflow-hidden rounded-full bg-[var(--site-ink)] py-[6px] pr-[6px] pl-6 text-[.82rem] tracking-[-.03em] text-[var(--site-night)]! transition-colors duration-300 before:absolute before:inset-0 before:-z-[1] before:translate-y-full before:rounded-[inherit] before:bg-[var(--site-sky-ink)] before:transition-transform before:duration-500 before:ease-[cubic-bezier(.2,.8,.2,1)] hover:before:translate-y-0 motion-reduce:before:transition-none [&>span]:grid [&>span]:size-10 [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[var(--site-night)] [&>span]:text-[1rem] [&>span]:text-[var(--site-ink)] [&>span]:transition-transform [&>span]:duration-500 hover:[&>span]:rotate-45 motion-reduce:hover:[&>span]:rotate-0",
  scroll: "inline-flex items-center gap-3 text-[.68rem] uppercase tracking-[.16em] text-[var(--site-copy)]! [&>i]:block [&>i]:h-px [&>i]:w-10 [&>i]:origin-left [&>i]:bg-[var(--site-sky-ink)] [&>i]:not-italic",
  statement: "pointer-events-none absolute right-[var(--site-gutter)] bottom-[clamp(120px,22vh,230px)] left-[var(--site-gutter)] m-0 hidden text-[clamp(2.4rem,6.4vw,7.4rem)] font-normal leading-[.98] tracking-[-.075em] group-data-[hero-stage=scroll]/hero:block max-[800px]:bottom-[clamp(190px,30vh,260px)] [&>span]:block [&>span]:overflow-hidden [&>span]:pb-[.06em] [&>span>span]:block [&_em]:not-italic [&_em]:text-[var(--site-sky-ink)]",
} as const;

export type HeroPerson = {
  id: string;
  slug: string;
  name: string;
  role?: string;
};

const LINES = ["Learn by doing.", "Build together.", "Share forward."];

export function HomeHero() {
  const year = new Date().getFullYear();
  return (
    <section className={styles.root} id="home" data-editorial-hero data-hero-stage="static" aria-labelledby="home-hero-title">
      <div className={styles.sticky} data-hero-sticky>
        <div className={styles.film} data-editorial-film>
          <div className={styles.media} data-hero-media>
            <HeroVideo className="h-full w-full origin-[64%_50%] object-cover object-[64%_50%]" controlClassName="absolute top-[104px] right-[var(--site-gutter)] z-[5] max-[520px]:top-[96px]" />
          </div>
          <div className={styles.shade} data-hero-shade aria-hidden="true" />
        </div>

        <div className={styles.meta} data-editorial-hero-support aria-hidden="true">
          <span>(Borg Al Arab)</span>
          <span className={styles.metaCenter}>Student-led technology community</span>
          <span>(BATU — {year})</span>
        </div>

        <h1 id="home-hero-title" className={styles.title} aria-label="IT Club">
          <span className={styles.word} data-hero-word="left"><span data-editorial-hero-line>IT</span></span>
          <span className={styles.tile} data-hero-tile aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny, already-compressed poster crop */}
            <img className={styles.tileImage} src="/media/club-hero-poster.webp" alt="" width={1344} height={768} decoding="async" fetchPriority="high" />
          </span>
          <span className={styles.word} data-hero-word="right"><span data-editorial-hero-line>Club</span></span>
        </h1>

        <p className={styles.statement} data-hero-statement aria-hidden="true">
          <span><span data-hero-statement-line>Curiosity deserves</span></span>
          <span><span data-hero-statement-line>a <em>community.</em></span></span>
        </p>

        <div className={styles.bottom}>
          <div className={styles.intro} data-editorial-hero-support data-hero-intro>
            <span className={styles.rotator} data-hero-rotator aria-hidden="true">
              {LINES.map((line) => <span key={line} data-hero-rotator-line>{line}</span>)}
            </span>
            <p>Curiosity deserves a community. A student-led club where we learn, share ideas and build together at Borg Al Arab Technological University.</p>
            <span className={styles.arabic} lang="ar" dir="rtl">الفضول بداية. والفريق يكمل.</span>
          </div>
          <div className={styles.actions} data-editorial-hero-action>
            <a className={styles.scroll} href="#about" data-hero-scroll><i aria-hidden="true" />Scroll</a>
            <Link href="/community" className={styles.join} data-magnetic data-cursor="Meet">
              Meet the club <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
