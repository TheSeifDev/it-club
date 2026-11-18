import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import {
  MEMBER_CUTOUT_MAP,
  getTeamMemberById,
} from "@/src/components/interview/committee-data";
import { IT_CLUB_TRACKS } from "@/src/components/interview/Tracks/tracks-data";
import { ClubNetwork } from "@/src/components/site/visuals/ClubNetwork";
import SkillsMarquee from "@/src/components/site/SkillsMarquee";
import { ClubPractice } from "@/src/components/site/ClubPractice";
import {
  TrackShowcase,
  type ShowcaseTrack,
} from "@/src/components/site/TrackShowcase";
import { HomeHero, type HeroPerson } from "@/src/components/site/HomeHero";
import { getTrackTheme } from "@/lib/ui/track-theme";
import {
  activeAnnouncements,
  formatEventDate,
  publicEventTimeline,
  publicMembers,
  publicSponsors,
  publicTracks,
  readPublicSiteContent,
  safeHref,
  safeImage,
} from "@/src/components/site/content-utils";
import {
  SectionHeading,
  SectionLabel,
  SiteFrame,
  SiteUnavailable,
} from "@/src/components/site/SiteUI";
import { publicMetadata } from "@/src/components/site/content-utils";

export const metadata: Metadata = publicMetadata(
  "IT Club — BATU",
  "A student-led technology community at Borg Al Arab Technological University. Meet the people, teams and work behind IT Club.",
  "/",
);

function terrainFor(slug: string, title: string) {
  const normalized = `${slug} ${title}`.toLowerCase();
  return IT_CLUB_TRACKS.find(
    (track) =>
      track.anchorIds.some((anchor) => normalized.includes(anchor)) ||
      track.title.toLowerCase() === title.toLowerCase(),
  );
}

export default async function HomePage() {
  let content;
  try {
    content = await readPublicSiteContent();
  } catch {
    return (
      <SiteFrame>
        <SiteUnavailable />
      </SiteFrame>
    );
  }
  const members = publicMembers(content.members);
  const selected = members.filter((member) => member.featured);
  const portraitMembers = (selected.length >= 2 ? selected : members).slice(
    0,
    3,
  );
  const heroPeople: HeroPerson[] = portraitMembers.flatMap((member) => {
    const cutout = MEMBER_CUTOUT_MAP[member.slug];
    const uploadedImage = safeImage(member.data.image);
    const canonicalImage = safeImage(getTeamMemberById(member.slug)?.image);
    const isCustomImage = Boolean(
      uploadedImage && uploadedImage !== canonicalImage,
    );
    const image = isCustomImage ? uploadedImage : cutout || uploadedImage;
    return image
      ? [
          {
            id: member.id,
            slug: member.slug,
            name: member.data.title,
            role: member.data.role,
            committee: member.data.committee,
            image,
            isCutout: Boolean(!isCustomImage && cutout),
          },
        ]
      : [];
  });
  const tracks = publicTracks(content.tracks);
  const showcaseTracks: ShowcaseTrack[] = tracks.map((track) => {
    const theme = getTrackTheme(track.slug || track.data.title);
    const canonical = terrainFor(track.slug, track.data.title);
    return {
      id: track.id,
      slug: track.slug,
      title: track.data.title,
      arabicTitle:
        track.data.arabicTitle || theme.arabic || canonical?.arabicTitle,
      category: track.data.category || canonical?.tag,
      summary: track.data.summary || track.data.body || canonical?.description,
      image: safeImage(track.data.image),
      capabilities: track.data.responsibilities?.length
        ? track.data.responsibilities.slice(0, 3)
        : (canonical?.terrain.slice(0, 3).map((item) => item.title) ?? []),
      color: theme.color,
      rgb: theme.rgb,
      ink: theme.ink,
    };
  });
  const timeline = publicEventTimeline(content.events);
  const sponsors = publicSponsors(content.sponsors).slice(0, 3);
  const announcement = activeAnnouncements(content.announcements)[0];

  return (
    <SiteFrame>
      <HomeHero people={heroPeople} />

      {announcement ? (
        <aside
          className="site-announcement site-container"
          aria-label="Published announcement"
        >
          <span className="site-eyebrow">CURRENT NOTICE</span>
          <p>
            <strong>{announcement.data.title}</strong>
            {announcement.data.summary ? ` — ${announcement.data.summary}` : ""}
          </p>
          {safeHref(announcement.data.href) ? (
            <a href={safeHref(announcement.data.href)}>
              {announcement.data.category || "READ THE NOTICE"}
              <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </aside>
      ) : null}

      <ClubPractice />

      <section
        className="site-home-identity"
        data-club-identity
        aria-labelledby="identity-title"
      >
        <div data-identity-pin>
          <div className="site-container site-identity-layout">
            <div className="site-identity-kicker">
              <SectionLabel number="02">IDENTITY / هوية النادي</SectionLabel>
              <p>Different people, shared momentum.</p>
            </div>
            <h2
              id="identity-title"
              data-identity-heading
              className="site-identity-heading"
            >
              <span data-identity-half="a">WE BUILD</span>
              <span data-identity-half="b">TOGETHER.</span>
            </h2>
            <div
              className="site-identity-copy site-identity-copy--a"
              data-identity-copy="a"
            >
              <span className="site-identity-index">A / COMMUNITY</span>
              <h3>Curiosity gets a team.</h3>
              <p>
                Our boards make room for different kinds of contribution—from
                people and culture to engineering, media, operations, and
                research.
              </p>
            </div>
            <div
              className="site-identity-copy site-identity-copy--b"
              data-identity-copy="b"
            >
              <span className="site-identity-index">B / PRACTICE</span>
              <h3>Ideas become useful.</h3>
              <p>
                We learn by sharing responsibility, shipping work, and making
                the next person’s path clearer.
              </p>
            </div>
            <div className="site-identity-visual" data-identity-visual>
              <ClubNetwork className="site-club-network" />
              <div
                className="site-identity-visual__fallback"
                aria-hidden="true"
              >
                <Image src="/logo.webp" alt="" width={76} height={76} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrackShowcase tracks={showcaseTracks} />

      <SkillsMarquee />

      <section
        className="site-home-now site-container"
        aria-labelledby="now-title"
      >
        <SectionHeading
          eyebrow="04 / OUT IN THE WORLD"
          title="What’s happening."
          note="Only dates and details that have been published appear here."
        />
        {timeline.upcoming.length ? (
          <div className="site-upcoming-feature" data-reveal>
            <span className="site-upcoming-feature__index">
              NEXT / {formatEventDate(timeline.upcoming[0].data.date)}
            </span>
            <div>
              <h3 id="now-title">{timeline.upcoming[0].data.title}</h3>
              {timeline.upcoming[0].data.summary ? (
                <p>{timeline.upcoming[0].data.summary}</p>
              ) : null}
            </div>
            <Link
              href={`/events/${timeline.upcoming[0].slug}`}
              aria-label={`Event details: ${timeline.upcoming[0].data.title}`}
            >
              <ArrowUpRight size={22} />
            </Link>
          </div>
        ) : (
          <div className="site-home-now__empty">
            <p>No upcoming event listing has been published.</p>
            <Link className="site-text-link" href="/events">
              Visit the events page <span aria-hidden="true">↗</span>
            </Link>
          </div>
        )}
        {sponsors.length ? (
          <div className="site-home-partners" aria-label="Published partners">
            <span className="site-eyebrow">IN GOOD COMPANY</span>
            {sponsors.map((sponsor) => {
              const image = safeImage(sponsor.data.image);
              const href = safeHref(sponsor.data.href);
              return (
                <a
                  key={sponsor.id}
                  href={href || "/sponsors"}
                  target={href?.startsWith("https:") ? "_blank" : undefined}
                  rel={href?.startsWith("https:") ? "noreferrer" : undefined}
                  aria-label={sponsor.data.title}
                >
                  {image ? (
                    <Image
                      src={image}
                      alt={sponsor.data.title}
                      width={150}
                      height={72}
                      unoptimized
                    />
                  ) : (
                    <span>{sponsor.data.title}</span>
                  )}
                </a>
              );
            })}
            <Link href="/sponsors" className="site-text-link">
              Partner with us <span aria-hidden="true">↗</span>
            </Link>
          </div>
        ) : (
          <Link href="/sponsors" className="site-home-partner-link">
            Meet our partners <span>↗</span>
          </Link>
        )}
      </section>

      <section className="site-home-cta">
        <div className="site-container site-home-cta__inner">
          <p className="site-eyebrow">IT CLUB / BATU</p>
          <h2 className="site-display" data-line-heading>
            Find your people.
            <br />
            <span>Build your next thing.</span>
          </h2>
          <div>
            <p>Start with the teams. See where your curiosity fits.</p>
            <Link className="site-button site-button--ink" href="/community">
              MEET THE TEAMS <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </SiteFrame>
  );
}
