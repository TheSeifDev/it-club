"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, CalendarDays, Clock3, MapPin, Ticket } from "lucide-react";
import type { EditorialEvent } from "./editorial-types";
import type { EditorialEventMode } from "./editorial-events";

const styles = {
  section: "scroll-mt-[88px] px-[var(--site-gutter)] pt-[65px] pb-[74px] text-[var(--site-ink)] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-[var(--site-sky-ink)] max-[520px]:pt-11 max-[520px]:pb-[46px]",
  top: "flex items-center justify-between gap-5",
  chapter: "m-0 inline-flex items-center text-[.77rem] tracking-[-.04em] [&>span]:inline-flex [&>span]:min-h-[43px] [&>span]:items-center [&>span]:rounded-full [&>span]:bg-[var(--site-glass-soft)] [&>span]:px-[19px] [&>span:first-child]:px-[14px] [&>span:first-child]:text-[var(--site-sky-ink)] [&>span:first-child]:text-[.7rem] max-[520px]:text-[.71rem] max-[520px]:[&>span]:min-h-[38px] max-[520px]:[&>span]:px-[15px]",
  allLink: "group inline-flex min-h-11 items-center gap-3 text-[.75rem] text-[var(--site-copy)] transition-colors hover:text-[var(--site-ink)] [&>svg]:text-[var(--site-sky-ink)] [&>svg]:transition-transform group-hover:[&>svg]:translate-x-0.5 group-hover:[&>svg]:-translate-y-0.5 motion-reduce:[&>svg]:transition-none max-[520px]:gap-2 max-[520px]:text-[.67rem]",
  headingRow: "mt-8 mb-10 flex items-end justify-between gap-8 max-[800px]:items-start max-[800px]:flex-col max-[800px]:gap-5 max-[520px]:mb-7",
  title: "m-0 text-[clamp(2.8rem,5.6vw,6.2rem)] font-normal leading-[.98] tracking-[-.07em] [&>span]:text-[var(--site-sky-ink)] max-[520px]:text-[2.8rem]",
  intro: "m-0 max-w-[350px] pb-1 text-[.82rem] leading-[1.8] text-[var(--site-copy)] max-[800px]:max-w-[480px] max-[520px]:text-[.76rem]",
  feature: "grid min-w-0 grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] items-stretch gap-[clamp(28px,4vw,64px)] max-[800px]:grid-cols-1 max-[800px]:gap-6",
  copy: "flex min-w-0 flex-col items-start justify-center py-[clamp(22px,3vw,48px)] max-[800px]:row-start-2 max-[800px]:py-0",
  eyebrow: "m-0 inline-flex items-center gap-2 text-[.6rem] uppercase leading-[1.5] tracking-[.12em] text-[var(--site-sky-ink)] [&>span]:size-1.5 [&>span]:rounded-full [&>span]:bg-[var(--site-sky-ink)]",
  meta: "mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[.68rem] leading-[1.6] text-[var(--site-copy)] [&>span]:rounded-full [&>span]:bg-[var(--site-glass-soft)] [&>span]:px-3 [&>span]:py-1.5 [&>span]:text-[var(--site-sky-ink)] max-[520px]:mt-5",
  featureTitle: "mt-5 mb-0 max-w-[19ch] [overflow-wrap:anywhere] text-[clamp(2rem,3.5vw,4rem)] font-normal leading-[1.06] tracking-[-.065em] max-[520px]:text-[2rem]",
  summary: "mt-5 mb-0 max-w-[520px] whitespace-pre-line text-[.84rem] leading-[1.85] text-[var(--site-copy)] max-[520px]:text-[.78rem]",
  details: "mt-6 flex flex-wrap gap-x-5 gap-y-3 text-[.7rem] leading-[1.6] text-[var(--site-copy)] [&>span]:inline-flex [&>span]:items-start [&>span]:gap-2 [&_svg]:mt-0.5 [&_svg]:shrink-0 [&_svg]:text-[var(--site-sky-ink)]",
  actions: "mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 max-[520px]:mt-6",
  button: "group inline-flex min-h-[47px] items-center gap-5 rounded-full bg-[var(--site-glass-strong)] py-[5px] pl-[18px] pr-[5px] text-[.72rem] text-[var(--site-ink)] transition-colors hover:bg-[var(--site-glass-soft)] [&>span]:grid [&>span]:size-[37px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[var(--site-sky)] [&>span]:text-[var(--site-night)] [&>span]:transition-transform group-hover:[&>span]:rotate-45 motion-reduce:[&>span]:transition-none",
  external: "inline-flex min-h-11 items-center gap-2 text-[.7rem] text-[var(--site-sky-ink)] hover:underline hover:underline-offset-4",
  visual: "group relative isolate min-w-0 overflow-hidden rounded-2xl bg-[var(--site-glass-strong)]",
  featureVisual: "min-h-[clamp(320px,34vw,510px)] max-[800px]:row-start-1 max-[800px]:min-h-0 max-[800px]:aspect-[16/10]",
  photo: "object-cover transition-transform duration-700 group-hover:scale-[1.025] motion-reduce:transition-none",
  fallback: "absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_75%_20%,rgb(40_205_183_/_9%),transparent_65%)] text-[var(--site-mist)] [&>svg]:h-auto [&>svg]:w-[30%] [&>svg]:max-w-[160px]",
  caption: "absolute bottom-5 left-6 text-[.56rem] uppercase tracking-[.15em] text-[var(--site-copy)] max-[520px]:bottom-4 max-[520px]:left-5",
  badge: "absolute top-5 left-5 grid min-w-[64px] justify-items-center rounded-xl bg-[var(--site-night)] px-3 py-2.5 text-[var(--site-ink)] [&>span:first-child]:text-[1.7rem] [&>span:first-child]:leading-none [&>span:first-child]:tracking-[-.06em] [&>span:last-child]:mt-1.5 [&>span:last-child]:text-[.54rem] [&>span:last-child]:uppercase [&>span:last-child]:tracking-[.06em] [&>span:last-child]:text-[var(--site-sky-ink)]",
  listHead: "mt-12 mb-4 flex items-center justify-between gap-3 text-[.66rem] text-[var(--site-copy)] [&>h3]:m-0 [&>h3]:text-[.75rem] [&>h3]:font-normal [&>h3]:text-[var(--site-ink)] max-[800px]:mt-9",
  list: "m-0 grid list-none gap-3 p-0",
  row: "grid min-w-0 grid-cols-[110px_minmax(100px,.24fr)_minmax(0,1fr)_44px] items-center gap-[clamp(18px,3vw,44px)] rounded-[14px] bg-[var(--site-glass-soft)] p-4 transition-colors hover:bg-[var(--site-glass-strong)] max-[900px]:gap-5 max-[800px]:grid-cols-[90px_minmax(0,1fr)_44px] max-[800px]:gap-x-4 max-[800px]:gap-y-2 max-[520px]:grid-cols-[72px_minmax(0,1fr)_36px] max-[520px]:gap-x-3 max-[520px]:p-3",
  thumb: "relative block h-[86px] w-full overflow-hidden rounded-[9px] bg-[var(--site-glass-strong)] text-[var(--site-mist)] [&_svg]:w-[40%] max-[800px]:row-span-2 max-[520px]:h-[82px]",
  rowDate: "flex flex-col items-start gap-1 text-[.67rem] leading-[1.6] text-[var(--site-sky-ink)] [&>span]:text-[var(--site-copy)] max-[800px]:col-start-2 max-[800px]:row-start-1 max-[800px]:flex-row max-[800px]:flex-wrap max-[800px]:gap-x-3 max-[520px]:text-[.59rem]",
  rowCopy: "min-w-0 max-[800px]:col-start-2 max-[800px]:row-start-2",
  rowCategory: "mt-0 mb-2 text-[.55rem] uppercase tracking-[.09em] text-[var(--site-sky-ink)] max-[800px]:hidden",
  rowTitle: "m-0 [overflow-wrap:anywhere] text-[clamp(1.2rem,2vw,2rem)] font-normal leading-[1.2] tracking-[-.055em] max-[520px]:text-[1.1rem]",
  rowSummary: "mt-2 mb-0 text-[.73rem] leading-[1.7] text-[var(--site-copy)] max-[800px]:hidden",
  rowLocation: "mt-2 mb-0 inline-flex items-start gap-1.5 text-[.63rem] leading-[1.6] text-[var(--site-copy)] [&_svg]:mt-0.5 [&_svg]:shrink-0 max-[520px]:text-[.58rem]",
  arrow: "grid size-11 place-items-center rounded-full bg-[var(--site-glass-strong)] text-[var(--site-sky-ink)] transition-[background,color] hover:bg-[var(--site-sky)] hover:text-[var(--site-night)] max-[800px]:col-start-3 max-[800px]:row-span-2 max-[800px]:row-start-1 max-[520px]:size-9",
  empty: "grid min-w-0 grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] items-stretch gap-[clamp(28px,4vw,64px)] max-[800px]:grid-cols-1 max-[800px]:gap-6",
  emptyTitle: "mt-6 mb-0 max-w-[16ch] text-[clamp(2rem,3.5vw,4rem)] font-normal leading-[1.06] tracking-[-.065em] [&>span]:text-[var(--site-sky-ink)] max-[520px]:text-[2rem]",
  emptyArt: "relative grid min-h-[clamp(290px,30vw,420px)] place-items-center overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_48%,rgb(40_205_183_/_12%),transparent_48%),var(--site-glass-strong)] text-[var(--site-sky-ink)] max-[800px]:row-start-1 max-[800px]:min-h-0 max-[800px]:aspect-[16/9] [&>svg]:h-auto [&>svg]:w-[28%] [&>svg]:max-w-[130px]",
} as const;

function EventDate({ event }: { event: EditorialEvent }) {
  return event.dateTime ? <time dateTime={event.dateTime}>{event.date}</time> : <span>{event.date}</span>;
}

/** CMS imagery is never replaced with stock photography, including on load failure. */
function EventVisual({ event, featured = false }: { event: EditorialEvent; featured?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`${styles.visual} ${featured ? styles.featureVisual : "absolute inset-0 rounded-none"}`}>
      {event.image && !failed ? (
        <Image src={event.image} alt="" fill sizes={featured ? "(max-width: 800px) 92vw, 52vw" : "110px"} unoptimized loading="lazy" className={styles.photo} onError={() => setFailed(true)} />
      ) : (
        <div className={styles.fallback} aria-hidden="true"><Ticket strokeWidth={.9} size={160} />{featured ? <span className={styles.caption}>IT Club / Learn · Connect · Make</span> : null}</div>
      )}
      {featured && event.day && event.month ? <div className={styles.badge} aria-hidden="true"><span>{event.day}</span><span>{event.month} {event.year}</span></div> : null}
    </div>
  );
}

export function HomeEvents({ events, eventMode }: { events: EditorialEvent[]; eventMode: EditorialEventMode }) {
  const [featured, ...rest] = events;
  const upcoming = eventMode === "upcoming";
  const archive = eventMode === "archive";
  const title = upcoming || !featured ? <>Upcoming<br /><span>events.</span></> : archive ? <>From the<br /><span>archive.</span></> : <>Around<br /><span>the club.</span></>;
  return (
    <section className={styles.section} id="home-events" aria-labelledby="home-events-title" data-editorial-events>
      <div className={styles.top}>
        <p className={styles.chapter}><span>03</span><span>Events</span></p>
        <Link href="/events" className={styles.allLink}>All events <ArrowUpRight size={17} aria-hidden="true" /></Link>
      </div>
      <div className={styles.headingRow}>
        <h2 className={styles.title} id="home-events-title" data-editorial-reveal>{title}</h2>
        <p className={styles.intro} data-editorial-reveal>{upcoming ? "Ideas leave the screen. Meet us at the next published club event, with dates and details all in one place." : archive ? "A look back at the club’s published events. New dates will appear here when they are announced." : "A space to learn, connect and make together. Event dates and details appear here when published."}</p>
      </div>
      {featured ? (
        <>
          <article className={styles.feature} aria-labelledby="home-featured-event">
            <div className={styles.copy} data-editorial-reveal>
              <p className={styles.eyebrow}><span aria-hidden="true" />{upcoming ? "Next on the calendar" : archive ? "From the published archive" : "Published / Date not listed"}</p>
              <div className={styles.meta}>{featured.category ? <span>{featured.category}</span> : null}<EventDate event={featured} /></div>
              <h3 className={styles.featureTitle} id="home-featured-event"><Link href={`/events/${featured.slug}`}>{featured.title}</Link></h3>
              {featured.summary ? <p className={styles.summary}>{featured.summary}</p> : null}
              {featured.time || featured.location ? <div className={styles.details}>
                {featured.time ? <span><Clock3 size={15} aria-hidden="true" />{featured.time}</span> : null}
                {featured.location ? <span><MapPin size={15} aria-hidden="true" />{featured.location}</span> : null}
              </div> : null}
              <div className={styles.actions}>
                <Link href={`/events/${featured.slug}`} className={styles.button}>Event details <span><ArrowUpRight size={18} aria-hidden="true" /></span></Link>
                {featured.href && featured.href !== `/events/${featured.slug}` ? <a href={featured.href} className={styles.external}>Event link <ArrowUpRight size={14} aria-hidden="true" /></a> : null}
              </div>
            </div>
            <Link href={`/events/${featured.slug}`} className="relative block min-w-0 max-[800px]:row-start-1" aria-label={`View ${featured.title}`} data-editorial-reveal>
              <EventVisual key={featured.image} event={featured} featured />
            </Link>
          </article>
          {rest.length ? (
            <div>
              <div className={styles.listHead}><h3>{upcoming ? "More coming up" : archive ? "More from the archive" : "More published events"}</h3><span>{String(rest.length).padStart(2, "0")} listings</span></div>
              <ul className={styles.list}>
                {rest.map((event) => <li key={event.id}>
                  <article className={styles.row} data-editorial-reveal>
                    <Link href={`/events/${event.slug}`} className={styles.thumb} aria-label={`View ${event.title}`}><EventVisual key={event.image} event={event} /></Link>
                    <div className={styles.rowDate}><EventDate event={event} />{event.time ? <span>{event.time}</span> : null}</div>
                    <div className={styles.rowCopy}>
                      {event.category ? <p className={styles.rowCategory}>{event.category}</p> : null}
                      <h4 className={styles.rowTitle}><Link href={`/events/${event.slug}`}>{event.title}</Link></h4>
                      {event.summary ? <p className={styles.rowSummary}>{event.summary}</p> : null}
                      {event.location ? <p className={styles.rowLocation}><MapPin size={13} aria-hidden="true" />{event.location}</p> : null}
                      {event.href && event.href !== `/events/${event.slug}` ? <a href={event.href} className={styles.external}>Event link <ArrowUpRight size={12} aria-hidden="true" /></a> : null}
                    </div>
                    <Link href={`/events/${event.slug}`} className={styles.arrow} aria-label={`Read details for ${event.title}`}><ArrowUpRight size={19} aria-hidden="true" /></Link>
                  </article>
                </li>)}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <div className={styles.empty}>
          <div className={styles.copy} data-editorial-reveal>
            <p className={styles.eyebrow}><span aria-hidden="true" />No published listings yet</p>
            <h3 className={styles.emptyTitle}>Something worth<br /><span>showing up for.</span></h3>
            <p className={styles.summary}>No event listing has been published yet. When a confirmed event is published, you’ll find its details here.</p>
            <div className={styles.actions}><Link href="/events" className={styles.button}>Explore events <span><ArrowUpRight size={18} aria-hidden="true" /></span></Link></div>
          </div>
          <div className={styles.emptyArt} aria-hidden="true" data-editorial-reveal><CalendarDays size={130} strokeWidth={.85} /><span className={styles.caption}>IT Club / Ideas in good company</span></div>
        </div>
      )}
    </section>
  );
}
