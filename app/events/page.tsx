import Link from "next/link";
import type { Metadata } from "next";
import {
  formatEventDate,
  publicEventTimeline,
  readPublicSiteContent,
} from "@/src/components/site/content-utils";
import {
  EmptyState,
  PageIntro,
  SectionLabel,
  SiteFrame,
} from "@/src/components/site/SiteUI";
import { publicMetadata } from "@/src/components/site/content-utils";

export const metadata: Metadata = publicMetadata(
  "Events",
  "See IT Club events that have been approved for publication, with dates, locations, and details when provided.",
  "/events",
);

export default async function EventsPage() {
  const content = await readPublicSiteContent();
  const {
    upcoming,
    archive,
    undated: unlistedDates,
  } = publicEventTimeline(content.events);

  return (
    <SiteFrame>
      <PageIntro
        number="04"
        eyebrow="EVENTS / WHAT WE DO TOGETHER"
        title="Make a day of it."
        description="A workshop, a project night, a talk, or something new. This page lists only events and details that have been approved for public view—no reconstructed dates or imagined archives."
        arabic="حين يجتمع الناس حول فكرة، تبدأ التجربة الحقيقية."
      />
      <section className="site-events-section site-container">
        <SectionLabel number="01">UPCOMING</SectionLabel>
        {upcoming.length ? (
          <div className="site-event-list">
            {upcoming.map((event) => (
              <article
                data-spotlight
                className="site-event-row"
                key={event.id}
                data-reveal
              >
                <div className="site-event-row__date">
                  <span>{formatEventDate(event.data.date)}</span>
                  {event.data.time ? <small>{event.data.time}</small> : null}
                </div>
                <div className="site-event-row__copy">
                  <p className="site-eyebrow">
                    {event.data.category || "IT CLUB / EVENT"}
                  </p>
                  <h2>
                    <Link href={`/events/${event.slug}`}>
                      {event.data.title}
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </h2>
                  {event.data.summary ? <p>{event.data.summary}</p> : null}
                  <div className="site-event-row__details">
                    {event.data.location ? (
                      <span>{event.data.location}</span>
                    ) : null}
                    {event.data.time ? <span>{event.data.time}</span> : null}
                  </div>
                </div>
                <Link
                  className="site-event-row__link"
                  href={`/events/${event.slug}`}
                  aria-label={`Read details for ${event.data.title}`}
                >
                  ↗
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No upcoming events have been published."
            text="When the next event is confirmed, its date and details will appear here. Nothing is scheduled on this page until it is officially listed."
          />
        )}
      </section>
      {unlistedDates.length ? (
        <section className="site-events-section site-events-section--undated site-container">
          <SectionLabel number="02">PUBLISHED / DATE NOT LISTED</SectionLabel>
          <div className="site-event-list">
            {unlistedDates.map((event) => (
              <article data-spotlight className="site-event-row" key={event.id}>
                <div className="site-event-row__date">
                  <span>DATE NOT LISTED</span>
                </div>
                <div className="site-event-row__copy">
                  <p className="site-eyebrow">
                    {event.data.category || "IT CLUB / EVENT"}
                  </p>
                  <h2>
                    <Link href={`/events/${event.slug}`}>
                      {event.data.title}
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </h2>
                  {event.data.summary ? <p>{event.data.summary}</p> : null}
                </div>
                <Link
                  className="site-event-row__link"
                  href={`/events/${event.slug}`}
                  aria-label={`Read details for ${event.data.title}`}
                >
                  ↗
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {archive.length ? (
        <section className="site-events-section site-events-section--archive">
          <div className="site-container">
            <SectionLabel number="03">
              PAST EVENTS / PUBLISHED ARCHIVE
            </SectionLabel>
            <div className="site-event-list">
              {archive.map((event) => (
                <article
                  data-spotlight
                  className="site-event-row site-event-row--past"
                  key={event.id}
                >
                  <div className="site-event-row__date">
                    <span>{formatEventDate(event.data.date)}</span>
                  </div>
                  <div className="site-event-row__copy">
                    <p className="site-eyebrow">
                      {event.data.category || "IT CLUB / EVENT"}
                    </p>
                    <h2>
                      <Link href={`/events/${event.slug}`}>
                        {event.data.title}
                        <span aria-hidden="true">↗</span>
                      </Link>
                    </h2>
                    {event.data.summary ? <p>{event.data.summary}</p> : null}
                  </div>
                  <Link
                    className="site-event-row__link"
                    href={`/events/${event.slug}`}
                    aria-label={`Read archive details for ${event.data.title}`}
                  >
                    ↗
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <section className="site-events-cta">
        <div className="site-container">
          <SectionLabel number="04">HAVE AN IDEA?</SectionLabel>
          <h2 className="site-display">
            Something worth
            <br />
            doing together.
          </h2>
          <p>
            Talk to the team about a workshop, a collaboration, or an idea you
            want to bring to campus.
          </p>
          <Link className="site-button site-button--paper" href="/contact">
            START A CONVERSATION <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
    </SiteFrame>
  );
}
