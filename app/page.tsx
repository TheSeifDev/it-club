import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { MEMBER_CUTOUT_MAP } from "@/src/components/interview/committee-data";
import { activeAnnouncements, formatEventDate, publicEventTimeline, publicMembers, publicSponsors, publicTracks, readPublicSiteContent, safeHref, safeImage } from "@/src/components/site/content-utils";
import { EmptyState, SectionHeading, SectionLabel, SiteFrame, SiteUnavailable } from "@/src/components/site/SiteUI";
import { publicMetadata } from "@/src/components/site/content-utils";

export const metadata: Metadata = publicMetadata(
  "IT Club — BATU",
  "A student-led technology community at Borg Al Arab Technological University. Meet the people, teams and work behind IT Club.",
  "/",
);

export default async function HomePage() {
  let content;
  try {
    content = await readPublicSiteContent();
  } catch {
    return <SiteFrame><SiteUnavailable /></SiteFrame>;
  }
  const members = publicMembers(content.members);
  const selected = members.filter((member) => member.featured);
  const portraitMembers = (selected.length >= 2 ? selected : members).slice(0, 3);
  const tracks = publicTracks(content.tracks);
  const upcoming = publicEventTimeline(content.events).upcoming;
  const sponsors = publicSponsors(content.sponsors).slice(0, 3);
  const announcement = activeAnnouncements(content.announcements)[0];

  return (
    <SiteFrame>
      <section className="site-home-hero" data-site-hero>
        <div className="site-container site-home-hero__grid">
          <div className="site-home-hero__copy">
            <div className="site-home-kicker"><span className="site-live-dot" aria-hidden="true" /> BATU · ALEXANDRIA, EGYPT</div>
            <h1 className="site-display site-home-title">BUILT BY<br /><span>CURIOUS</span><br />PEOPLE<span className="site-home-title__period">.</span></h1>
            <p className="site-home-intro">IT Club is a student-led technology community at Borg Al Arab Technological University. We bring people together to learn, make, and move ideas into the real world.</p>
            <div className="site-home-actions">
              <Link href="/community" className="site-button site-button--emerald">MEET THE TEAMS <span aria-hidden="true">↗</span></Link>
              <Link href="/about" className="site-button site-button--quiet">WHAT WE&apos;RE ABOUT <span aria-hidden="true">↓</span></Link>
            </div>
          </div>

          <div className="site-hero-art" aria-label={portraitMembers.length ? "Portraits of published IT Club members" : "IT Club editorial artwork"}>
            <div className="site-hero-art__index"><span>PEOPLE / IDEAS / PRACTICE</span><span>01—03</span></div>
            <div className="site-hero-art__orbit site-hero-art__orbit--one" aria-hidden="true" />
            <div className="site-hero-art__orbit site-hero-art__orbit--two" aria-hidden="true" />
            <div className="site-hero-art__spark" aria-hidden="true">✳</div>
            {portraitMembers.map((member, index) => {
              const cutout = MEMBER_CUTOUT_MAP[member.slug];
              const uploadedImage = safeImage(member.data.image);
              const image = uploadedImage || cutout;
              const isCutout = !uploadedImage && Boolean(cutout);
              if (!image) return null;
              return (
                <figure className={`site-hero-person site-hero-person--${index + 1}`} key={member.id} data-parallax={index === 0 ? "true" : undefined}>
                  <Image
                    src={image}
                    alt={member.data.title}
                    width={index === 0 ? 550 : 420}
                    height={index === 0 ? 735 : 560}
                    unoptimized
                    priority={index === 0}
                    className={isCutout ? "site-hero-person__image is-cutout" : "site-hero-person__image"}
                  />
                  <figcaption><span>{member.data.title}</span><small>{member.data.role} · {member.data.committee}</small></figcaption>
                </figure>
              );
            })}
            <div className="site-hero-art__stamp" aria-hidden="true"><span>MAKE</span><span>IT</span><span>MATTER</span></div>
          </div>
        </div>
        <div className="site-container site-home-hero__foot">
          <span>IT CLUB / BORG AL ARAB TECHNOLOGICAL UNIVERSITY</span>
          <span>SCROLL TO EXPLORE <b aria-hidden="true">↓</b></span>
        </div>
      </section>

      {announcement ? (
        <aside className="site-announcement site-container" aria-label="Published announcement">
          <span className="site-eyebrow">CURRENT NOTICE</span>
          <p><strong>{announcement.data.title}</strong>{announcement.data.summary ? ` — ${announcement.data.summary}` : ""}</p>
          {safeHref(announcement.data.href) ? <a href={safeHref(announcement.data.href)}>{announcement.data.category || "READ THE NOTICE"}<span aria-hidden="true">↗</span></a> : null}
        </aside>
      ) : null}

      <section className="site-home-manifesto">
        <div className="site-container site-manifesto-panel" data-reveal>
          <SectionLabel number="01" tone="dark">THE CLUB, IN PRACTICE</SectionLabel>
          <div className="site-manifesto-panel__body">
            <h2 className="site-display">Not a spectator sport.<br /><span>A place to make.</span></h2>
            <div className="site-manifesto-panel__copy">
              <p>Technology is learned by doing it with other people. IT Club is where curiosity gets a team, a direction, and room to become useful work.</p>
              <p className="site-arabic" lang="ar" dir="rtl">مجتمع طلابي يجمع الفضول والعمل الجماعي وتحويل الأفكار إلى خبرة حقيقية.</p>
              <Link href="/about" className="site-text-link">A little more about us <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
          <div className="site-manifesto-panel__foot"><span>LEARN WITH OTHERS</span><span>MAKE SOMETHING REAL</span><span>PASS IT FORWARD</span></div>
        </div>
      </section>

      <section className="site-home-tracks site-container">
        <div className="site-split-heading">
          <SectionHeading eyebrow="02 / HOW WE WORK" title={"Different teams.\nShared momentum."} note="Find the committee or track where your interests can do practical work." />
          <Link href="/tracks" className="site-text-link">Explore all tracks <span aria-hidden="true">↗</span></Link>
        </div>
        {tracks.length ? (
          <div className="site-track-list">
            {tracks.slice(0, 5).map((track, index) => (
              <article className="site-track-row" key={track.id} data-reveal>
                <span className="site-track-row__number">{String(index + 1).padStart(2, "0")}</span>
                <div><h3><Link href={`/tracks#${track.slug}`}>{track.data.title}<span aria-hidden="true">↗</span></Link></h3>{track.data.summary ? <p>{track.data.summary}</p> : null}</div>
                <span className="site-track-row__arrow" aria-hidden="true">↗</span>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState label="TRACKS / PUBLIC DIRECTORY" title="The index is being assembled." text="There are no track details published right now. Meet the teams page shows the people and work that have been approved for public view." href="/community" linkLabel="Meet the teams" />
        )}
      </section>

      <section className="site-home-community">
        <div className="site-container site-home-community__inner">
          <div><SectionLabel number="03">THE PEOPLE BEHIND IT</SectionLabel><h2 className="site-display">A team makes<br /><span>the difference.</span></h2><p>Meet the published leaders, boards, and members—and see what each team is responsible for.</p><Link href="/community" className="site-button site-button--paper">MEET THE COMMUNITY <span aria-hidden="true">↗</span></Link></div>
          <div className="site-home-community__aside"><span className="site-home-community__bracket" aria-hidden="true">{`{ }`}</span><p>Curiosity is personal.<br />Progress is a team sport.</p><Link href="/alumni" className="site-text-link">And the people who helped build it <span aria-hidden="true">↗</span></Link></div>
        </div>
      </section>

      <section className="site-home-now site-container">
        <SectionHeading eyebrow="04 / OUT IN THE WORLD" title="What’s happening." note="Only dates and details that have been published appear here." />
        {upcoming.length ? (
          <div className="site-upcoming-feature" data-reveal>
            <span className="site-upcoming-feature__index">NEXT / {formatEventDate(upcoming[0].data.date)}</span>
            <div><h3>{upcoming[0].data.title}</h3>{upcoming[0].data.summary ? <p>{upcoming[0].data.summary}</p> : null}</div>
            <Link href={`/events/${upcoming[0].slug}`} aria-label={`Event details: ${upcoming[0].data.title}`}>↗</Link>
          </div>
        ) : (
          <div className="site-home-now__empty"><p>No upcoming event listing has been published.</p><Link className="site-text-link" href="/events">Visit the events page <span aria-hidden="true">↗</span></Link></div>
        )}
        {sponsors.length ? <div className="site-home-partners" aria-label="Published partners"><span className="site-eyebrow">IN GOOD COMPANY</span>{sponsors.map((sponsor) => {
          const image = safeImage(sponsor.data.image);
          const href = safeHref(sponsor.data.href);
          return <a key={sponsor.id} href={href || "/sponsors"} target={href?.startsWith("https:") ? "_blank" : undefined} rel={href?.startsWith("https:") ? "noreferrer" : undefined} aria-label={sponsor.data.title}>{image ? <Image src={image} alt={sponsor.data.title} width={150} height={72} unoptimized /> : <span>{sponsor.data.title}</span>}</a>;
        })}<Link href="/sponsors" className="site-text-link">Partner with us <span aria-hidden="true">↗</span></Link></div> : <Link href="/sponsors" className="site-home-partner-link">Meet our partners <span aria-hidden="true">↗</span></Link>}
      </section>

      <section className="site-home-cta">
        <div className="site-container site-home-cta__inner">
          <p className="site-eyebrow">IT CLUB / BATU</p>
          <h2 className="site-display">Find your people.<br /><span>Build your next thing.</span></h2>
          <div><p>Start with the teams. See where your curiosity fits.</p><Link className="site-button site-button--ink" href="/community">MEET THE TEAMS <span aria-hidden="true">↗</span></Link></div>
        </div>
      </section>
    </SiteFrame>
  );
}
