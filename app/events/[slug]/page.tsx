import Link from "next/link";
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
import styles from "@/src/components/site/EventsEditorial.module.css";
import { SiteFrame } from "@/src/components/site/SiteUI";

type EventIconKind = "calendar" | "ticket";

function EventIcon({ kind }: { kind: EventIconKind }) {
  if (kind === "ticket") {
    return (
      <svg viewBox="0 0 96 96" fill="none" aria-hidden="true" focusable="false">
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
    <svg viewBox="0 0 96 96" fill="none" aria-hidden="true" focusable="false">
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
              <span aria-hidden="true">←</span> All events
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
              <EventIcon kind="ticket" />
            </div>
          </div>
        </header>

        <div className={styles.detailBody}>
          <aside className={styles.detailFacts} aria-labelledby="event-notes-heading">
            <SectionMarker number="01">Event notes</SectionMarker>
            <h2 className={styles.visuallyHidden} id="event-notes-heading">Event notes</h2>
            <dl className={styles.factsList}>
              <div>
                <dt>Date</dt>
                <dd>{hasUsableDate ? formatEventDate(event.data.date) : "Date not listed"}</dd>
              </div>
              {event.data.time ? (
                <div>
                  <dt>Time</dt>
                  <dd>{event.data.time}</dd>
                </div>
              ) : null}
              {event.data.location ? (
                <div>
                  <dt>Location</dt>
                  <dd>{event.data.location}</dd>
                </div>
              ) : null}
              {event.data.category ? (
                <div>
                  <dt>Type</dt>
                  <dd>{event.data.category}</dd>
                </div>
              ) : null}
              {!event.data.date && !event.data.time && !event.data.location && !event.data.category ? (
                <div>
                  <dt>Details</dt>
                  <dd>Further event information has not been listed.</dd>
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
