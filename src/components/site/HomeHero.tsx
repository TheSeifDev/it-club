import Link from "next/link";
import { ArrowDown, ArrowUpRight, Code2, Lightbulb, Users } from "lucide-react";
import { HeroVideo } from "./HeroVideo";

const styles = {
  root: "relative isolate h-[min(880px,100svh)] min-h-[680px] w-full overflow-hidden bg-[var(--site-paper)] text-[var(--site-ink)] max-[900px]:h-[90svh] max-[900px]:max-h-[940px] max-[900px]:min-h-[690px] max-[540px]:h-[100svh] max-[540px]:max-h-[850px] max-[540px]:min-h-[680px]",
  film: "absolute inset-0 -z-[3] overflow-hidden",
  overlay: "pointer-events-none absolute inset-0 -z-[1] bg-[linear-gradient(90deg,rgb(5_13_11_/_0.65)_0%,rgb(5_13_11_/_0.15)_62%),linear-gradient(0deg,rgb(5_13_11_/_0.38),transparent_68%)]",
  support: "absolute top-[34%] left-[var(--site-gutter)] w-[360px] max-w-[calc(100%_-_2_*_var(--site-gutter))] max-[900px]:top-[29%] max-[540px]:top-[28%] [&>p]:mt-[23px] [&>p]:mb-0 [&>p]:text-[clamp(.73rem,1vw,.91rem)] [&>p]:leading-[1.6] [&>p]:tracking-[-.025em] [&>p]:text-[var(--site-ink)] max-[540px]:[&>p]:text-[.74rem]",
  miniPeople: "flex w-fit rounded-full border border-[var(--site-glass-border)] bg-[var(--site-glass)] py-[5px] pr-2 pl-[5px] shadow-[inset_0_1px_0_var(--site-glass-highlight)] backdrop-blur-[12px] backdrop-saturate-[140%] supports-[not_(backdrop-filter:blur(1px))]:bg-[var(--site-paper-dim)] max-[900px]:backdrop-blur-none motion-reduce:backdrop-blur-none",
  miniPersonLink: "relative z-0 -mr-[5px] grid size-[41px] place-items-center rounded-full border border-[var(--site-glass-border)] bg-[var(--site-glass-strong)] text-[var(--site-ink)] transition-[transform,background] duration-[250ms] hover:z-[1] hover:-translate-y-1 hover:bg-[var(--site-sky)] hover:text-[var(--site-paper)] motion-reduce:transform-none motion-reduce:transition-none",
  miniPersonEmpty: "-mr-[5px] grid size-[41px] place-items-center rounded-full border border-[var(--site-glass-border)] bg-[var(--site-glass-strong)] text-[var(--site-ink)]",
  supportArabic: "mt-3 block w-fit text-[.75rem] text-[var(--site-mist)]",
  bottom: "absolute right-[var(--site-gutter)] bottom-[clamp(36px,4vw,64px)] left-[var(--site-gutter)] flex items-end justify-between gap-6 max-[540px]:bottom-[42px]",
  headline: "min-w-0",
  title: "m-0 text-[clamp(3.4rem,5.7vw,7.2rem)] font-normal leading-[1.04] tracking-[-.07em] min-[1600px]:text-[6.2vw] max-[900px]:text-[clamp(3.1rem,7.3vw,5.4rem)] max-[540px]:text-[clamp(2.65rem,10.5vw,4rem)] max-[540px]:tracking-[-.065em]",
  mask: "my-[-.05em] block overflow-hidden pt-[.05em] pr-[.06em] pb-[.06em] [&>span]:block",
  lastLine: "flex flex-wrap items-center gap-[clamp(18px,2.2vw,38px)] max-[540px]:gap-[13px]",
  join: "group inline-flex min-h-[47px] items-center justify-between gap-4 whitespace-nowrap rounded-full border border-[var(--site-glass-border)] bg-[var(--site-glass-strong)] py-[5px] pr-[5px] pl-[17px] text-[.82rem] leading-none tracking-[-.03em] text-[var(--site-ink)]! shadow-[inset_0_1px_0_var(--site-glass-highlight)] backdrop-blur-[12px] backdrop-saturate-[140%] supports-[not_(backdrop-filter:blur(1px))]:bg-[var(--site-paper-dim)] transition-colors duration-300 hover:[&>span]:rotate-45 hover:[&>span]:bg-[var(--site-sky-ink)] motion-reduce:backdrop-blur-none motion-reduce:hover:[&>span]:rotate-0 [&>span]:grid [&>span]:size-[38px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[var(--site-sky)] [&>span]:text-[var(--site-paper)] [&>span]:transition-[transform,background] [&>span]:duration-300 max-[900px]:backdrop-blur-none max-[540px]:min-h-[43px] max-[540px]:gap-2 max-[540px]:pl-[13px] max-[540px]:text-[.7rem] max-[540px]:[&>span]:size-8",
  scroll: "inline-flex items-center gap-3 whitespace-nowrap text-[.75rem] tracking-[-.04em] text-[var(--site-ink)]! max-[900px]:hidden",
  filmNote: "absolute top-[110px] right-[var(--site-gutter)] grid gap-1 text-right text-[.54rem] tracking-[.13em] text-[var(--site-mist)] [&>span]:text-[.62rem] [&>span]:tracking-[-.02em] max-[900px]:hidden",
} as const;

export type HeroPerson = {
  id: string;
  slug: string;
  name: string;
  role?: string;
};

export function HomeHero({ people }: { people: HeroPerson[] }) {
  const icons = [Users, Code2, Lightbulb];
  return (
    <section className={styles.root} id="home" data-editorial-hero aria-labelledby="home-hero-title">
      <div className={styles.film} data-editorial-film>
        <HeroVideo />
      </div>
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.support} data-editorial-hero-support>
        <div className={styles.miniPeople} aria-label="Meet our published community">
          {people.slice(0, 3).map((person, index) => {
            const Icon = icons[index];
            return (
                <Link key={person.id} href={`/community/${person.slug}`} className={styles.miniPersonLink} aria-label={`Meet ${person.name}${person.role ? `, ${person.role}` : ""}`}>
                <Icon size={23} strokeWidth={1.3} aria-hidden="true" />
              </Link>
            );
          })}
          {!people.length ? <span className={styles.miniPersonEmpty}><Users size={23} aria-hidden="true" /></span> : null}
        </div>
        <p>A student-led community for curious minds.<br />We learn, share ideas, and build together<br />at Borg Al Arab Technological University.</p>
        <span className={styles.supportArabic} lang="ar" dir="rtl">الفضول بداية. والفريق يكمل.</span>
      </div>
      <div className={styles.bottom}>
        <div className={styles.headline}>
          <h1 id="home-hero-title" className={styles.title}>
            <span className={styles.mask}><span data-editorial-hero-line>Curiosity deserves</span></span>
            <span className={styles.mask}><span data-editorial-hero-line>a community.</span></span>
            <span className={styles.lastLine}>
              <span className={styles.mask}><span data-editorial-hero-line>Find yours.</span></span>
              <Link href="/community" className={styles.join} data-magnetic data-editorial-hero-action>
                Meet us <span><ArrowUpRight size={22} strokeWidth={1.6} aria-hidden="true" /></span>
              </Link>
            </span>
          </h1>
        </div>
        <a className={styles.scroll} href="#about">Scroll down <ArrowDown size={15} aria-hidden="true" /></a>
      </div>
      <span className={styles.filmNote}>IT CLUB / BATU <span>Ideas in motion.</span></span>
    </section>
  );
}
