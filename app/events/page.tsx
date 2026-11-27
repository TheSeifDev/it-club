import Link from "next/link";
import type { Metadata } from "next";
import {
  formatEventDate,
  publicEventTimeline,
  readPublicSiteContent,
} from "@/src/components/site/content-utils";
import { publicMetadata } from "@/src/components/site/content-utils";
import { SiteFrame } from "@/src/components/site/SiteUI";

const styles = {
  canvas: "relative w-full min-w-0 bg-transparent text-[var(--site-ink)] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-[var(--site-sky-ink)] [&_a:focus-visible]:outline-offset-4 motion-reduce:[&_*]:scroll-auto motion-reduce:[&_*]:duration-[0.01ms] motion-reduce:[&_*]:animate-none",
  listPage: "pb-[clamp(52px,7vw,100px)]",
  hero: "px-[clamp(20px,3.5vw,64px)] pt-[clamp(48px,6.7vw,94px)] pb-[clamp(52px,7vw,98px)] max-[680px]:pt-[clamp(82px,21vw,98px)] max-[680px]:pb-[58px]",
  heroMeta: "flex items-center justify-between gap-[18px] max-[390px]:items-start max-[390px]:flex-col",
  sectionMarker: "inline-flex max-w-full items-center gap-[9px] text-[var(--site-ink)]",
  sectionNumber: "inline-grid h-[30px] w-[30px] flex-[0_0_30px] place-items-center rounded-full bg-[var(--site-paper-dim)] text-[0.64rem] font-semibold tabular-nums tracking-[-0.02em] text-white",
  sectionName: "inline-flex min-h-[30px] items-center rounded-full bg-[var(--site-glass-soft)] px-3 py-1.5 text-[0.61rem] font-semibold uppercase leading-[1.35] tracking-[0.1em] text-[var(--site-copy)]",
  heroKicker: "m-0 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-[var(--site-mist)]",
  heroGrid: "mt-[clamp(46px,7.5vw,106px)] grid grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] items-end gap-[clamp(36px,8vw,124px)] max-[900px]:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)] max-[900px]:gap-9 max-[680px]:mt-[54px] max-[680px]:grid-cols-1 max-[680px]:gap-7",
  heroTitleBlock: "min-w-0",
  heroTitle: "m-0 text-[clamp(4rem,10.4vw,10.3rem)] font-normal leading-[0.9] tracking-[-0.065em] text-[var(--site-ink)] max-[680px]:text-[clamp(3.8rem,16vw,6.4rem)] [&_span]:text-[var(--site-sky-ink)]",
  arabic: "mt-[26px] mb-0 font-[family-name:var(--font-alexandria),_sans-serif] text-[clamp(0.88rem,1.2vw,1rem)] leading-[1.9] text-[var(--site-mist)] max-[680px]:mt-[19px]",
  heroAside: "grid min-w-0 gap-[25px] pb-[3px] max-[680px]:gap-[18px]",
  heroAsideCopy: "m-0 max-w-[420px] text-[clamp(0.93rem,1.25vw,1.06rem)] leading-[1.8] text-[var(--site-copy)]",
  iconTile: "relative grid place-items-center overflow-hidden rounded-2xl bg-[var(--site-glass-soft)] text-[var(--site-mist)] [&_svg]:block [&_svg]:h-auto",
  heroIcon: "aspect-[2.05/1] min-h-[150px] w-[min(100%,440px)] justify-self-end bg-[var(--site-glass)] max-[680px]:min-h-[130px] max-[680px]:w-full max-[680px]:justify-self-stretch",
  heroSvg: "w-[clamp(66px,9vw,112px)]",
  tileCaption: "absolute left-[18px] top-[17px] text-[0.58rem] font-semibold uppercase leading-[1.4] tracking-[0.12em] text-[var(--site-mist)]",
  eventSection: "px-[clamp(20px,3.5vw,64px)] pb-[clamp(66px,8.2vw,116px)] max-[680px]:pb-[62px]",
  sectionHead: "mb-6 flex items-center justify-between gap-[22px] max-[680px]:mb-3 max-[680px]:items-start max-[680px]:flex-col [&>p]:m-0 [&>p]:max-w-[480px] [&>p]:text-right [&>p]:text-[0.78rem] [&>p]:leading-[1.65] [&>p]:text-[var(--site-mist)] max-[680px]:[&>p]:max-w-[440px] max-[680px]:[&>p]:text-left",
  sectionHeadCopy: "m-0 max-w-[480px] text-right text-[0.78rem] leading-[1.65] text-[var(--site-mist)] max-[680px]:max-w-[440px] max-[680px]:text-left",
  upcomingContent: "grid gap-3 [&>.eventRows]:mt-0",
  featuredEvent: "grid grid-cols-[minmax(0,1fr)_minmax(190px,0.39fr)] items-stretch gap-[clamp(26px,5vw,72px)] rounded-2xl border border-[var(--site-glass-border)] bg-[var(--site-glass)] p-[clamp(23px,4.3vw,58px)] shadow-[inset_0_1px_0_var(--site-glass-highlight)] max-[900px]:grid-cols-[minmax(0,1fr)_minmax(155px,0.35fr)] max-[680px]:grid-cols-1 max-[680px]:gap-5 max-[680px]:p-[23px]",
  featuredCopy: "flex min-w-0 flex-col items-start",
  eventMeta: "flex flex-wrap items-center gap-2 [&>span]:inline-flex [&>span]:min-h-7 [&>span]:items-center [&>span]:rounded-full [&>span]:bg-[var(--site-glass-soft)] [&>span]:px-[10px] [&>span]:py-1.5 [&>span]:text-[0.59rem] [&>span]:font-semibold [&>span]:uppercase [&>span]:leading-[1.25] [&>span]:tracking-[0.065em] [&>span]:text-[var(--site-copy)]",
  featuredTitle: "mt-[clamp(26px,4vw,48px)] mb-0 max-w-[18ch] [overflow-wrap:anywhere] text-[clamp(2.3rem,5.1vw,5.1rem)] font-normal leading-[1.02] tracking-[-0.055em] max-[680px]:mt-[25px] max-[680px]:text-[clamp(2.2rem,9.4vw,3.8rem)] [&_a]:text-[var(--site-ink)] [&_a]:no-underline",
  inlineArrow: "ml-[0.17em] inline-block align-[0.18em] text-[0.62em] text-[var(--site-sky-ink)] transition-transform duration-[180ms] group-hover:translate-x-[3px] group-hover:-translate-y-[3px] group-focus-visible:translate-x-[3px] group-focus-visible:-translate-y-[3px]",
  eventSummary: "mt-[17px] mb-0 max-w-[680px] whitespace-pre-line text-[clamp(0.9rem,1.15vw,1rem)] leading-[1.8] text-[var(--site-copy)]",
  eventFooter: "mt-auto flex w-full items-center justify-between gap-[18px] pt-7 max-[680px]:mt-0 max-[680px]:items-start max-[680px]:flex-col max-[680px]:gap-4 max-[390px]:items-stretch max-[390px]:[&_.pillLink]:self-start",
  eventLocation: "text-[0.7rem] leading-[1.5] text-[var(--site-mist)]",
  pillLink: "inline-flex min-h-[46px] flex-[0_0_auto] items-center justify-center gap-[14px] rounded-full bg-[var(--site-paper-dim)] py-1.5 pl-[19px] pr-[7px] text-[0.72rem] font-semibold leading-[1.25] text-white no-underline transition-[background-color,transform] duration-[180ms] hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 [&>span]:inline-grid [&>span]:h-8 [&>span]:w-8 [&>span]:flex-[0_0_32px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[var(--site-sky)] [&>span]:text-base [&>span]:text-[var(--site-paper-dim)]",
  pillArrow: "inline-grid h-8 w-8 flex-[0_0_32px] place-items-center rounded-full bg-[var(--site-sky)] text-base text-[var(--site-paper-dim)]",
  featuredIcon: "min-h-[210px] self-stretch bg-[var(--site-glass)] max-[680px]:max-h-[200px] max-[680px]:min-h-[145px]",
  featuredSvg: "w-[clamp(66px,9vw,112px)] max-[680px]:w-[74px]",
  eventRows: "mt-3 grid gap-[9px]",
  eventRow: "grid grid-cols-[minmax(150px,0.35fr)_minmax(0,1fr)_42px] items-center gap-[clamp(17px,3vw,42px)] rounded-[14px] bg-[var(--site-glass-soft)] p-[clamp(20px,2.8vw,32px)] max-[680px]:grid-cols-[minmax(0,1fr)_38px] max-[680px]:items-start max-[680px]:gap-x-[14px] max-[680px]:gap-y-[11px] max-[680px]:p-5",
  rowDate: "flex min-w-0 flex-col items-start gap-[5px] text-[0.68rem] font-semibold leading-[1.45] text-[var(--site-sky-ink)] [&_small]:text-[0.68rem] [&_small]:font-medium [&_small]:text-[var(--site-mist)] max-[680px]:col-span-full max-[680px]:flex-row max-[680px]:flex-wrap max-[680px]:gap-x-[13px] max-[680px]:gap-y-2",
  rowCopy: "min-w-0 max-[680px]:col-start-1",
  rowCategory: "mb-[7px] mt-0 text-[0.59rem] font-semibold uppercase leading-[1.5] tracking-[0.1em] text-[var(--site-sky-ink)]",
  rowTitle: "m-0 [overflow-wrap:anywhere] text-[clamp(1.3rem,2.4vw,2.2rem)] font-[450] leading-[1.15] tracking-[-0.045em] max-[680px]:text-[clamp(1.28rem,6vw,1.8rem)] [&_a]:text-[var(--site-ink)] [&_a]:no-underline",
  rowSummary: "my-0 mt-2 whitespace-pre-line text-[0.8rem] leading-[1.7] text-[var(--site-copy)]",
  rowLocation: "my-0 mt-2 text-[0.7rem] leading-[1.7] text-[var(--site-mist)]",
  roundLink: "col-start-3 inline-grid h-[42px] w-[42px] justify-self-end place-items-center rounded-full bg-[var(--site-glass-soft)] text-[1.1rem] text-[var(--site-ink)] no-underline transition-[color,background-color,transform] duration-[180ms] hover:translate-x-0.5 hover:-translate-y-0.5 hover:bg-[var(--site-sky)] hover:text-[var(--site-paper-dim)] max-[680px]:col-start-2 max-[680px]:row-start-2 max-[680px]:h-[38px] max-[680px]:w-[38px] motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0",
  undatedSection: "pt-0",
  emptyState: "grid grid-cols-[minmax(150px,0.35fr)_minmax(0,1fr)] items-center gap-[clamp(24px,5vw,64px)] rounded-2xl border border-[var(--site-glass-border)] bg-[var(--site-glass)] p-[clamp(22px,4vw,46px)] shadow-[inset_0_1px_0_var(--site-glass-highlight)] max-[680px]:grid-cols-1 max-[680px]:gap-5 max-[680px]:p-[21px] [&_h3]:m-0 [&_h3]:text-[clamp(1.6rem,3.4vw,3rem)] [&_h3]:font-[450] [&_h3]:leading-[1.08] [&_h3]:tracking-[-0.05em] [&>div:last-child>p:last-child]:mt-[13px] [&>div:last-child>p:last-child]:mb-0 [&>div:last-child>p:last-child]:max-w-[680px] [&>div:last-child>p:last-child]:text-[0.86rem] [&>div:last-child>p:last-child]:leading-[1.75] [&>div:last-child>p:last-child]:text-[var(--site-copy)]",
  emptyIcon: "min-h-[175px] bg-[var(--site-glass)] max-[680px]:min-h-[130px]",
  emptySvg: "w-[clamp(58px,7vw,82px)]",
  emptyEyebrow: "mb-[10px] mt-0 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--site-sky-ink)]",
  archiveSection: "bg-transparent px-[clamp(20px,3.5vw,64px)] py-[clamp(58px,8vw,112px)] max-[680px]:py-[58px]",
  archiveInner: "[&_.sectionHead]:mb-[27px] [&_.eventRow]:bg-[var(--site-glass-soft)]",
  pageFooter: "flex min-h-[110px] items-center justify-between gap-[22px] px-[clamp(20px,3.5vw,64px)] pt-[clamp(34px,5vw,62px)] max-[680px]:items-start max-[680px]:flex-col max-[680px]:gap-4 max-[680px]:pt-10 [&>p]:m-0 [&>p]:mr-auto [&>p]:max-w-[440px] [&>p]:text-[0.84rem] [&>p]:leading-[1.6] [&>p]:text-[var(--site-copy)] max-[680px]:[&>p]:mr-0",
  visuallyHidden: "sr-only",
};

export const metadata: Metadata = publicMetadata(
  "Events",
  "Explore published IT Club events, with confirmed dates, locations, and links shown when provided.",
  "/events",
);

type EventIconKind = "calendar" | "ticket";

function EventIcon({ kind, className }: { kind: EventIconKind; className: string }) {
  if (kind === "ticket") {
    return (
      <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden="true" focusable="false">
        <path
          d="M20 31.5a8.5 8.5 0 0 0 0 17v16h56v-16a8.5 8.5 0 0 1 0-17v-16H20v16Z"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M48 20v8m0 8v8m0 8v8m0 8v3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden="true" focusable="false">
      <rect x="17" y="23" width="62" height="56" rx="8" stroke="currentColor" strokeWidth="3" />
      <path d="M18 40h60M34 17v13m28-13v13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M33 54h8m14 0h8m-30 13h8m14 0h8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function SectionMarker({ number, children }: { number: string; children: string }) {
  return (
    <div className={styles.sectionMarker}>
      <span className={styles.sectionNumber}>{number}</span>
      <span className={styles.sectionName}>{children}</span>
    </div>
  );
}

export default async function EventsPage() {
  const content = await readPublicSiteContent();
  const { upcoming, archive, undated } = publicEventTimeline(content.events);
  const [featuredEvent, ...otherUpcoming] = upcoming;

  return (
    <SiteFrame>
      <div className={`${styles.canvas} ${styles.listPage}`}>
        <header className={styles.hero}>
        <div className={styles.heroMeta}>
          <SectionMarker number="04">Events / together</SectionMarker>
          <p className={styles.heroKicker}>IT Club · BATU</p>
        </div>
        <div className={styles.heroGrid}>
          <div className={styles.heroTitleBlock}>
            <h1 className={styles.heroTitle}>
              Events,<br />
              <span>together.</span>
            </h1>
            <p className={styles.arabic} lang="ar" dir="rtl">
              حين يجتمع الناس حول فكرة، تبدأ التجربة الحقيقية.
            </p>
          </div>
          <div className={styles.heroAside}>
            <p className={styles.heroAsideCopy}>
              Find published details for upcoming and past IT Club events. Dates,
              venues, and event links appear only when they have been provided.
            </p>
            <div className={`${styles.iconTile} ${styles.heroIcon}`}>
              <span className={styles.tileCaption}>A calendar of shared ideas</span>
              <EventIcon kind="calendar" className={styles.heroSvg} />
            </div>
          </div>
        </div>
      </header>

      <section className={styles.eventSection} aria-labelledby="upcoming-heading">
        <div className={styles.sectionHead}>
          <SectionMarker number="01">Upcoming</SectionMarker>
          <p className={styles.sectionHeadCopy}>Published events with a date that has not passed.</p>
        </div>
        <h2 className={styles.visuallyHidden} id="upcoming-heading">Upcoming events</h2>

        {featuredEvent ? (
          <div className={styles.upcomingContent}>
            <article className={styles.featuredEvent}>
              <div className={styles.featuredCopy}>
                <div className={styles.eventMeta}>
                  {featuredEvent.data.category ? <span>{featuredEvent.data.category}</span> : <span>IT Club / Event</span>}
                  {featuredEvent.data.date ? <span>{formatEventDate(featuredEvent.data.date)}</span> : null}
                  {featuredEvent.data.time ? <span>{featuredEvent.data.time}</span> : null}
                </div>
                <h3 className={styles.featuredTitle}>
                  <Link className="group" href={`/events/${featuredEvent.slug}`}>
                    {featuredEvent.data.title}
                    <span className={styles.inlineArrow} aria-hidden="true">↗</span>
                  </Link>
                </h3>
                {featuredEvent.data.summary ? <p className={styles.eventSummary}>{featuredEvent.data.summary}</p> : null}
                <div className={styles.eventFooter}>
                  {featuredEvent.data.location ? <span className={styles.eventLocation}>{featuredEvent.data.location}</span> : <span />}
                  <Link className={styles.pillLink} href={`/events/${featuredEvent.slug}`}>
                    Event details <span className={styles.pillArrow} aria-hidden="true">↗</span>
                  </Link>
                </div>
              </div>
              <div className={`${styles.iconTile} ${styles.featuredIcon}`}>
                <span className={styles.tileCaption}>Published event</span>
                <EventIcon kind="ticket" className={styles.featuredSvg} />
              </div>
            </article>

            {otherUpcoming.length ? (
              <div className={styles.eventRows}>
                {otherUpcoming.map((event) => (
                  <article className={styles.eventRow} key={event.id}>
                    <div className={styles.rowDate}>
                      {event.data.date ? <span>{formatEventDate(event.data.date)}</span> : null}
                      {event.data.time ? <small>{event.data.time}</small> : null}
                    </div>
                    <div className={styles.rowCopy}>
                      <p className={styles.rowCategory}>{event.data.category || "IT Club / Event"}</p>
                      <h3 className={styles.rowTitle}><Link className="group" href={`/events/${event.slug}`}>{event.data.title}<span className={styles.inlineArrow} aria-hidden="true">↗</span></Link></h3>
                      {event.data.summary ? <p className={styles.rowSummary}>{event.data.summary}</p> : null}
                      {event.data.location ? <p className={styles.rowLocation}>{event.data.location}</p> : null}
                    </div>
                    <Link className={styles.roundLink} href={`/events/${event.slug}`} aria-label={`Read details for ${event.data.title}`}>
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={`${styles.iconTile} ${styles.emptyIcon}`}>
              <EventIcon kind="calendar" className={styles.emptySvg} />
            </div>
            <div>
              <p className={styles.emptyEyebrow}>No dates ahead</p>
              <h3>No upcoming events have been published.</h3>
              <p>When a future event is confirmed and published, its details will appear here. Past and undated listings are shown separately below when available.</p>
            </div>
          </div>
        )}
      </section>

      {undated.length ? (
        <section className={`${styles.eventSection} ${styles.undatedSection}`} aria-labelledby="undated-heading">
        <div className={styles.sectionHead}>
          <SectionMarker number="02">Published / date not listed</SectionMarker>
          <p className={styles.sectionHeadCopy}>These published listings do not include a usable event date.</p>
          </div>
          <h2 className={styles.visuallyHidden} id="undated-heading">Published events without a listed date</h2>
          <div className={styles.eventRows}>
            {undated.map((event) => (
              <article className={styles.eventRow} key={event.id}>
                <div className={styles.rowDate}><span>Date not listed</span></div>
                <div className={styles.rowCopy}>
                  <p className={styles.rowCategory}>{event.data.category || "IT Club / Event"}</p>
                  <h3 className={styles.rowTitle}><Link className="group" href={`/events/${event.slug}`}>{event.data.title}<span className={styles.inlineArrow} aria-hidden="true">↗</span></Link></h3>
                  {event.data.summary ? <p className={styles.rowSummary}>{event.data.summary}</p> : null}
                </div>
                <Link className={styles.roundLink} href={`/events/${event.slug}`} aria-label={`Read details for ${event.data.title}`}>
                  <span aria-hidden="true">↗</span>
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {archive.length ? (
        <section className={styles.archiveSection} aria-labelledby="archive-heading">
          <div className={styles.archiveInner}>
            <div className={styles.sectionHead}>
              <SectionMarker number="03">Past events / published archive</SectionMarker>
              <p className={styles.sectionHeadCopy}>Previously dated events from the published archive.</p>
            </div>
            <h2 className={styles.visuallyHidden} id="archive-heading">Past events / published archive</h2>
            <div className={styles.eventRows}>
              {archive.map((event) => (
                <article className={styles.eventRow} key={event.id}>
                  <div className={styles.rowDate}>
                    <span>{formatEventDate(event.data.date)}</span>
                    {event.data.time ? <small>{event.data.time}</small> : null}
                  </div>
                  <div className={styles.rowCopy}>
                    <p className={styles.rowCategory}>{event.data.category || "IT Club / Event"}</p>
                    <h3 className={styles.rowTitle}><Link className="group" href={`/events/${event.slug}`}>{event.data.title}<span className={styles.inlineArrow} aria-hidden="true">↗</span></Link></h3>
                    {event.data.summary ? <p className={styles.rowSummary}>{event.data.summary}</p> : null}
                    {event.data.location ? <p className={styles.rowLocation}>{event.data.location}</p> : null}
                  </div>
                  <Link className={styles.roundLink} href={`/events/${event.slug}`} aria-label={`Read archive details for ${event.data.title}`}>
                    <span aria-hidden="true">↗</span>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <footer className={styles.pageFooter}>
        <SectionMarker number="04">Bring an idea</SectionMarker>
        <p>Have something you would like the club to explore together?</p>
        <Link className={styles.pillLink} href="/contact">Start a conversation <span className={styles.pillArrow} aria-hidden="true">↗</span></Link>
        </footer>
      </div>
    </SiteFrame>
  );
}
