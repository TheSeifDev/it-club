import Link from "next/link";
import { DateMark } from "@/src/components/site/DateMark";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  formatEventDate,
  publicEventTimeline,
  publicEvents,
  readPublicSiteContent,
  safeHref,
  validSlug,
} from "@/src/components/site/content-utils";
import { publicMetadata } from "@/src/components/site/content-utils";
import { SiteFrame } from "@/src/components/site/SiteUI";

const styles = {
  canvas: "relative w-full min-w-0 bg-transparent text-[var(--site-ink)] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-[var(--site-sky-ink)] [&_a:focus-visible]:outline-offset-4 motion-reduce:[&_*]:scroll-auto motion-reduce:[&_*]:duration-[0.01ms] motion-reduce:[&_*]:animate-[1]",
  detailPage: "pb-[clamp(60px,8vw,112px)]",
  sectionMarker: "inline-flex max-w-full items-center gap-[9px] text-[var(--site-ink)]",
  sectionNumber: "inline-grid h-[30px] w-[30px] flex-[0_0_30px] place-items-center rounded-full bg-[var(--site-paper-dim)] text-[0.64rem] font-semibold tabular-nums tracking-[-0.02em] text-white",
  sectionName: "inline-flex min-h-[30px] items-center rounded-full bg-[var(--site-glass-soft)] px-3 py-1.5 text-[0.61rem] font-semibold uppercase leading-[1.35] tracking-[0.1em] text-[var(--site-copy)]",
  detailHero: "px-[clamp(20px,3.5vw,64px)] pt-[clamp(40px,5.5vw,78px)] pb-[clamp(45px,6vw,84px)] max-[680px]:pt-[clamp(82px,21vw,98px)]",
  detailTopline: "flex items-center justify-between gap-[18px] max-[680px]:flex-wrap max-[680px]:items-start",
  backLink: "inline-flex min-h-[42px] items-center gap-[10px] rounded-full bg-[var(--site-glass-soft)] py-1.5 pl-[9px] pr-[15px] text-[0.72rem] font-medium text-[var(--site-ink)] no-underline transition-colors duration-[180ms] hover:bg-[var(--site-glass)]",
  backArrow: "inline-grid h-[29px] w-[29px] place-items-center rounded-full bg-[var(--site-glass-soft)] text-base",
  detailHeroGrid: "mt-[clamp(45px,7vw,94px)] grid grid-cols-[minmax(0,1fr)_minmax(220px,0.34fr)] items-end gap-[clamp(32px,7vw,102px)] max-[680px]:mt-12 max-[680px]:grid-cols-1 max-[680px]:gap-[25px]",
  detailTitleBlock: "min-w-0",
  detailBadges: "flex flex-wrap items-center gap-2",
  statusBadge: "inline-flex min-h-7 items-center rounded-full bg-[var(--site-glass-soft)] px-[10px] py-1.5 text-[0.59rem] font-semibold uppercase leading-[1.25] tracking-[0.065em] text-[var(--site-sky-ink)]",
  categoryBadge: "inline-flex min-h-7 items-center rounded-full bg-[var(--site-glass-soft)] px-[10px] py-1.5 text-[0.59rem] font-semibold uppercase leading-[1.25] tracking-[0.065em] text-[var(--site-copy)]",
  detailTitle: "mt-[clamp(27px,4vw,47px)] mb-0 max-w-[14ch] [overflow-wrap:anywhere] text-[clamp(3.2rem,8.2vw,8rem)] font-normal leading-[0.98] tracking-[-0.062em] text-[var(--site-ink)] max-[680px]:mt-[27px] max-[680px]:text-[clamp(3rem,14vw,5rem)]",
  detailSummary: "mt-[22px] mb-0 max-w-[740px] whitespace-pre-line text-[clamp(0.96rem,1.3vw,1.08rem)] leading-[1.8] text-[var(--site-copy)]",
  iconTile: "relative grid place-items-center overflow-hidden rounded-2xl bg-[var(--site-glass-soft)] text-[var(--site-mist)] ",
  detailIcon: "aspect-[1.05/1] min-h-[260px] bg-[var(--site-glass)] max-[680px]:aspect-[1.8/1] max-[680px]:max-h-[200px] max-[680px]:min-h-[155px]",
  tileCaption: "absolute left-[18px] top-[17px] text-[0.58rem] font-semibold uppercase leading-[1.4] tracking-[0.12em] text-[var(--site-mist)]",
  detailBody: "grid grid-cols-[minmax(245px,0.55fr)_minmax(0,1.45fr)] items-start gap-[clamp(28px,6vw,86px)] px-[clamp(20px,3.5vw,64px)] max-[900px]:grid-cols-[minmax(220px,0.65fr)_minmax(0,1.35fr)] max-[680px]:grid-cols-1 max-[680px]:gap-[34px]",
  detailFacts: "min-w-0 rounded-2xl border border-[var(--site-glass-border)] bg-[var(--site-glass)] p-[clamp(23px,3vw,36px)] shadow-[inset_0_1px_0_var(--site-glass-highlight)] lg:backdrop-blur-md max-[680px]:order-2",
  factsList: "my-6 mb-[25px] grid gap-0",
  factsRow: "grid grid-cols-[minmax(72px,0.45fr)_minmax(0,1fr)] gap-[14px] border-b border-[var(--site-glass-border)] py-[13px] max-[390px]:grid-cols-[minmax(63px,0.43fr)_minmax(0,1fr)] max-[390px]:gap-[10px]",
  factLabel: "text-[0.59rem] font-semibold uppercase leading-[1.55] tracking-[0.09em] text-[var(--site-mist)]",
  factValue: "m-0 [overflow-wrap:anywhere] text-[0.78rem] leading-[1.65] text-[var(--site-ink)]",
  pillLink: "inline-flex min-h-[46px] flex-[0_0_auto] items-center justify-center gap-[14px] rounded-full bg-[var(--site-paper-dim)] py-1.5 pl-[19px] pr-[7px] text-[0.72rem] font-semibold leading-[1.25] text-white no-underline transition-[background-color,transform] duration-[180ms] hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 [&>span]:inline-grid [&>span]:h-8 [&>span]:w-8 [&>span]:flex-[0_0_32px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[var(--site-sky)] [&>span]:text-base [&>span]:text-[var(--site-paper-dim)]",
  detailCopy: "min-w-0 pt-2 max-[680px]:order-1 [&>p]:mt-[27px] [&>p]:mb-0 [&>p]:max-w-[760px] [&>p]:whitespace-pre-line [&>p]:text-[clamp(1rem,1.4vw,1.12rem)] [&>p]:leading-[1.9] [&>p]:text-[var(--site-copy)]",
  visuallyHidden: "sr-only",
};

function SectionMarker({ number, children }: { number: string; children: string }) {
  return (
    <div className={styles.sectionMarker}>
      <span className={styles.sectionNumber}>{number}</span>
      <span className={styles.sectionName}>{children}</span>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!validSlug(slug)) return { title: "Event not found", robots: { index: false, follow: false } };
  const content = await readPublicSiteContent();
  const event = publicEvents(content.events).find((item) => item.slug === slug);
  if (!event) return { title: "Event not found", robots: { index: false, follow: false } };
  return publicMetadata(
    event.data.title,
    event.data.summary || `Published event details from IT Club at BATU: ${event.data.title}.`,
    `/events/${event.slug}`,
  );
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await readPublicSiteContent();
  const event = publicEvents(content.events).find((item) => item.slug === slug);
  if (!event) notFound();

  const { upcoming, archive, undated } = publicEventTimeline(content.events);
  const status = upcoming.some((item) => item.id === event.id)
    ? "Upcoming"
    : archive.some((item) => item.id === event.id)
      ? "Past event"
      : undated.some((item) => item.id === event.id)
        ? "Published / date not listed"
        : "Published event";
  const href = safeHref(event.data.href);
  const external = href?.startsWith("https:");
  const hasUsableDate = Boolean(event.data.date && Number.isFinite(Date.parse(event.data.date)));

  return (
    <SiteFrame>
      <div className={`${styles.canvas} ${styles.detailPage}`}>
        <article>
        <header className={styles.detailHero}>
          <div className={styles.detailTopline}>
            <SectionMarker number="04">Events / published detail</SectionMarker>
            <Link className={styles.backLink} href="/events">
              <span className={styles.backArrow} aria-hidden="true">←</span> All events
            </Link>
          </div>
          <div className={styles.detailHeroGrid}>
            <div className={styles.detailTitleBlock}>
              <div className={styles.detailBadges}>
                <span className={styles.statusBadge}>{status}</span>
                {event.data.category ? <span className={styles.categoryBadge}>{event.data.category}</span> : null}
              </div>
              <h1 className={styles.detailTitle}>{event.data.title}</h1>
              {event.data.summary ? <p className={styles.detailSummary}>{event.data.summary}</p> : null}
            </div>
            <div className={`${styles.iconTile} ${styles.detailIcon}`}>
              <span className={styles.tileCaption}>Published event</span>
              <DateMark date={event.data.date} fallback="IT" />
            </div>
          </div>
        </header>

        <div className={styles.detailBody}>
          <aside className={styles.detailFacts} aria-labelledby="event-notes-heading">
            <SectionMarker number="01">Event notes</SectionMarker>
            <h2 className={styles.visuallyHidden} id="event-notes-heading">Event notes</h2>
            <dl className={styles.factsList}>
              <div className={styles.factsRow}>
                <dt className={styles.factLabel}>Date</dt>
                <dd className={styles.factValue}>{hasUsableDate ? formatEventDate(event.data.date) : "Date not listed"}</dd>
              </div>
              {event.data.time ? (
                <div className={styles.factsRow}>
                  <dt className={styles.factLabel}>Time</dt>
                  <dd className={styles.factValue}>{event.data.time}</dd>
                </div>
              ) : null}
              {event.data.location ? (
                <div className={styles.factsRow}>
                  <dt className={styles.factLabel}>Location</dt>
                  <dd className={styles.factValue}>{event.data.location}</dd>
                </div>
              ) : null}
              {event.data.category ? (
                <div className={styles.factsRow}>
                  <dt className={styles.factLabel}>Type</dt>
                  <dd className={styles.factValue}>{event.data.category}</dd>
                </div>
              ) : null}
              {!event.data.date && !event.data.time && !event.data.location && !event.data.category ? (
                <div className={styles.factsRow}>
                  <dt className={styles.factLabel}>Details</dt>
                  <dd className={styles.factValue}>Further event information has not been listed.</dd>
                </div>
              ) : null}
            </dl>
            {href ? (
              <a
                className={styles.pillLink}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
              >
                Open event link <span aria-hidden="true">↗</span>
              </a>
            ) : null}
          </aside>

          <section className={styles.detailCopy} aria-labelledby="about-event-heading">
            <SectionMarker number="02">About this event</SectionMarker>
            <h2 className={styles.visuallyHidden} id="about-event-heading">About this event</h2>
            <p>{event.data.body || event.data.summary || "Additional information has not been published."}</p>
          </section>
        </div>
        </article>
      </div>
    </SiteFrame>
  );
}
