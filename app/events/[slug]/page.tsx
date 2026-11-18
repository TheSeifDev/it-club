import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatEventDate, publicEvents, readPublicSiteContent, safeHref, safeImage, validSlug } from "@/src/components/site/content-utils";
import { PageIntro, SectionLabel, SiteFrame } from "@/src/components/site/SiteUI";
import { publicMetadata } from "@/src/components/site/content-utils";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!validSlug(slug)) return { title: "Event not found", robots: { index: false, follow: false } };
  const content = await readPublicSiteContent();
  const event = publicEvents(content.events).find((item) => item.slug === slug);
  if (!event) return { title: "Event not found", robots: { index: false, follow: false } };
  return publicMetadata(event.data.title, event.data.summary || `Published event details from IT Club at BATU: ${event.data.title}.`, `/events/${event.slug}`);
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await readPublicSiteContent();
  const event = publicEvents(content.events).find((item) => item.slug === slug);
  if (!event) notFound();
  const image = safeImage(event.data.image);
  const href = safeHref(event.data.href);
  const external = href?.startsWith("https:");

  return (
    <SiteFrame>
      <article className="site-event-detail">
        <PageIntro number="04" eyebrow="EVENTS / PUBLISHED DETAIL" title={event.data.title} description={event.data.summary || "This event listing contains the details approved for public view."} />
        <div className="site-container site-event-detail__body">
          <div className="site-event-detail__facts"><SectionLabel number="01">EVENT NOTES</SectionLabel><dl>{event.data.date ? <div><dt>DATE</dt><dd>{formatEventDate(event.data.date)}</dd></div> : null}{event.data.time ? <div><dt>TIME</dt><dd>{event.data.time}</dd></div> : null}{event.data.location ? <div><dt>LOCATION</dt><dd>{event.data.location}</dd></div> : null}{event.data.category ? <div><dt>TYPE</dt><dd>{event.data.category}</dd></div> : null}</dl>{href ? <a className="site-button site-button--emerald" href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>EVENT LINK <span aria-hidden="true">↗</span></a> : null}</div>
          <div className="site-event-detail__copy">{image ? <figure className="site-event-detail__image"><Image src={image} alt={event.data.title} width={1100} height={720} unoptimized /></figure> : null}<SectionLabel number="02">ABOUT THIS EVENT</SectionLabel>{event.data.body ? <p>{event.data.body}</p> : event.data.summary ? <p>{event.data.summary}</p> : <p>Additional information has not been published.</p>}</div>
        </div>
      </article>
      <div className="site-container site-detail-back"><Link href="/events" className="site-text-link">← All events</Link></div>
    </SiteFrame>
  );
}
