import Link from "next/link";
import type { Metadata } from "next";
import {
  formatEventDate,
  publicEventTimeline,
  readPublicSiteContent,
} from "@/src/components/site/content-utils";
import { publicMetadata } from "@/src/components/site/content-utils";
import styles from "@/src/components/site/EventsEditorial.module.css";
import { SiteFrame } from "@/src/components/site/SiteUI";

export const metadata: Metadata = publicMetadata(
  "Events",
  "Explore published IT Club events, with confirmed dates, locations, and links shown when provided.",
  "/events",
);

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
            <p>
              Find published details for upcoming and past IT Club events. Dates,
              venues, and event links appear only when they have been provided.
            </p>
            <div className={`${styles.iconTile} ${styles.heroIcon}`}>
              <span className={styles.tileCaption}>A calendar of shared ideas</span>
              <EventIcon kind="calendar" />
            </div>
          </div>
        </div>
      </header>

      <section className={styles.eventSection} aria-labelledby="upcoming-heading">
        <div className={styles.sectionHead}>
          <SectionMarker number="01">Upcoming</SectionMarker>
          <p>Published events with a date that has not passed.</p>
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
                  <Link href={`/events/${featuredEvent.slug}`}>
                    {featuredEvent.data.title}
                    <span className={styles.inlineArrow} aria-hidden="true">↗</span>
                  </Link>
                </h3>
                {featuredEvent.data.summary ? <p className={styles.eventSummary}>{featuredEvent.data.summary}</p> : null}
                <div className={styles.eventFooter}>
                  {featuredEvent.data.location ? <span className={styles.eventLocation}>{featuredEvent.data.location}</span> : <span />}
                  <Link className={styles.pillLink} href={`/events/${featuredEvent.slug}`}>
                    Event details <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </div>
              <div className={`${styles.iconTile} ${styles.featuredIcon}`}>
                <span className={styles.tileCaption}>Published event</span>
                <EventIcon kind="ticket" />
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
                      <h3><Link href={`/events/${event.slug}`}>{event.data.title}<span className={styles.inlineArrow} aria-hidden="true">↗</span></Link></h3>
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
              <EventIcon kind="calendar" />
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
            <p>These published listings do not include a usable event date.</p>
          </div>
          <h2 className={styles.visuallyHidden} id="undated-heading">Published events without a listed date</h2>
          <div className={styles.eventRows}>
            {undated.map((event) => (
              <article className={styles.eventRow} key={event.id}>
                <div className={styles.rowDate}><span>Date not listed</span></div>
                <div className={styles.rowCopy}>
                  <p className={styles.rowCategory}>{event.data.category || "IT Club / Event"}</p>
                  <h3><Link href={`/events/${event.slug}`}>{event.data.title}<span className={styles.inlineArrow} aria-hidden="true">↗</span></Link></h3>
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
              <p>Previously dated events from the published archive.</p>
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
                    <h3><Link href={`/events/${event.slug}`}>{event.data.title}<span className={styles.inlineArrow} aria-hidden="true">↗</span></Link></h3>
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
        <Link className={styles.pillLink} href="/contact">Start a conversation <span aria-hidden="true">↗</span></Link>
        </footer>
      </div>
    </SiteFrame>
  );
}
