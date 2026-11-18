import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import {
  MEMBER_CUTOUT_MAP,
  getTeamMemberById,
} from "@/src/components/interview/committee-data";
import { IT_CLUB_TRACKS } from "@/src/components/interview/Tracks/tracks-data";
import { ClubNetwork } from "@/src/components/site/visuals/ClubNetwork";
import SkillsMarquee from "@/src/components/site/SkillsMarquee";
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
  EmptyState,
  SectionHeading,
  SectionLabel,
  SiteFrame,
  SiteUnavailable,
} from "@/src/components/site/SiteUI";
import { publicMetadata } from "@/src/components/site/content-utils";

type ThemeVars = React.CSSProperties & {
  "--track-color"?: string;
  "--track-rgb"?: string;
  "--track-ink"?: string;
};

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
  const tracks = publicTracks(content.tracks);
  const timeline = publicEventTimeline(content.events);
  const sponsors = publicSponsors(content.sponsors).slice(0, 3);
  const announcement = activeAnnouncements(content.announcements)[0];

  return (
    <SiteFrame>
      <section
        className="site-home-hero"
        data-hero
        data-site-hero
        aria-labelledby="home-title"
      >
        <div data-hero-bg aria-hidden="true">
          <div data-hero-bg-inner />
        </div>
        <div className="site-home-hero__grid site-container">
          <div className="site-home-hero__copy" data-hero-content>
            <div className="site-home-kicker" data-hero-role>
              <span className="site-live-dot" aria-hidden="true" /> BATU ·
              ALEXANDRIA, EGYPT
            </div>
            <h1 id="home-title" className="site-home-title">
              <span className="site-title-mask">
                <span data-hero-title-line>LEARN</span>
              </span>
              <span className="site-title-mask">
                <span data-hero-title-line className="site-home-title__accent">
                  MAKE
                </span>
              </span>
              <span className="site-title-mask">
                <span data-hero-title-line>MOVE.</span>
              </span>
            </h1>
            <p className="site-home-intro" data-hero-copy>
              IT Club is a student-led technology community at Borg Al Arab
              Technological University. We bring people together to learn, make,
              and move ideas into the real world.
            </p>
            <p className="site-home-arabic" lang="ar" dir="rtl" data-hero-copy>
              نتعلم، نصنع، ونتقدم معًا.
            </p>
            <div className="site-home-actions" data-hero-actions>
              <Link
                href="/community"
                className="site-button site-button--sky"
                data-magnetic="true"
              >
                MEET THE TEAMS <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/tracks" className="site-button site-button--quiet">
                EXPLORE TRACKS <ArrowDown size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div
            className="site-hero-art"
            data-hero-portrait
            aria-label={
              portraitMembers.length
                ? "Published IT Club members"
                : "IT Club identity mark"
            }
          >
            <div className="site-hero-art__top">
              <span>PEOPLE / IDEAS / PRACTICE</span>
              <span>01—03</span>
            </div>
            <div className="site-hero-art__grid" aria-hidden="true" />
            <div className="site-hero-logo">
              <Image
                src="/logo.webp"
                alt=""
                width={132}
                height={132}
                priority
              />
            </div>
            <div
              className="site-hero-portrait-reveal"
              data-hero-portrait-reveal
            >
              {portraitMembers.map((member, index) => {
                const cutout = MEMBER_CUTOUT_MAP[member.slug];
                const uploadedImage = safeImage(member.data.image);
                const canonicalImage = safeImage(
                  getTeamMemberById(member.slug)?.image,
                );
                const isCustomImage = Boolean(
                  uploadedImage && uploadedImage !== canonicalImage,
                );
                const image = isCustomImage
                  ? uploadedImage
                  : cutout || uploadedImage;
                if (!image) return null;
                return (
                  <figure
                    className={`site-hero-person site-hero-person--${index + 1}`}
                    key={member.id}
                  >
                    <Image
                      src={image}
                      alt={member.data.title}
                      width={index === 0 ? 520 : 360}
                      height={index === 0 ? 690 : 520}
                      unoptimized
                      priority={index === 0}
                      className={
                        !isCustomImage && cutout
                          ? "site-hero-person__image is-cutout"
                          : "site-hero-person__image"
                      }
                    />
                    <figcaption>
                      <span>{member.data.title}</span>
                      <small>
                        {member.data.role} · {member.data.committee}
                      </small>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
            <div className="site-hero-stamp" aria-hidden="true">
              BUILD
              <br />
              TOGETHER
            </div>
            <div className="site-hero-art__meta" data-hero-meta>
              <span>IT CLUB / BATU</span>
              <span>EST. STUDENT-LED</span>
            </div>
          </div>
        </div>
        <div className="site-home-hero__foot site-container">
          <span>TECHNOLOGY · COMMUNITY · PRACTICE</span>
          <span>
            SCROLL TO EXPLORE <b aria-hidden="true">↓</b>
          </span>
        </div>
        <div data-hero-card aria-hidden="true" />
        <div data-hero-shade aria-hidden="true" />
      </section>

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

      <section
        className="site-home-manifesto"
        data-club-about
        aria-labelledby="about-title"
      >
        <div className="site-container site-manifesto-panel">
          <div
            className="site-manifesto-panel__art"
            data-about-art
            aria-hidden="true"
          >
            <div data-about-art-img>
              <Image
                src="/spotlight-stage.webp"
                alt=""
                fill
                sizes="(min-width: 900px) 36vw, 100vw"
              />
            </div>
            <span>IT CLUB / 01</span>
          </div>
          <div className="site-manifesto-panel__content">
            <SectionLabel number="01" tone="dark">
              THE CLUB, IN PRACTICE
            </SectionLabel>
            <h2 id="about-title" className="site-display">
              <span className="site-title-mask">
                <span data-about-line>Not a spectator</span>
              </span>
              <span className="site-title-mask">
                <span data-about-line>sport.</span>
              </span>
              <span className="site-title-mask">
                <span data-about-line className="site-manifesto-accent">
                  A place to make.
                </span>
              </span>
            </h2>
            <div className="site-manifesto-panel__copy">
              <p data-about-statement>
                {"Technology is learned by doing it with other people. IT Club is where curiosity gets a team, a direction, and room to become useful work."
                  .split(" ")
                  .map((word, index) => (
                    <span data-word key={`${word}-${index}`}>
                      {word}{" "}
                    </span>
                  ))}
              </p>
              <p className="site-arabic" lang="ar" dir="rtl">
                مجتمع طلابي يجمع الفضول والعمل الجماعي وتحويل الأفكار إلى خبرة
                حقيقية.
              </p>
              <Link href="/about" className="site-text-link">
                A little more about us <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
          <div className="site-manifesto-panel__foot">
            <span>LEARN WITH OTHERS</span>
            <span>MAKE SOMETHING REAL</span>
            <span>PASS IT FORWARD</span>
          </div>
        </div>
      </section>

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

      <section
        className="site-home-tracks"
        data-showcase
        aria-labelledby="showcase-title"
      >
        <div className="site-container">
          <div className="site-split-heading">
            <SectionHeading
              eyebrow="03 / HOW WE WORK"
              title={"Different teams.\nShared momentum."}
              note="Explore every published track and the documented work it makes possible."
            />
            <Link href="/tracks" className="site-text-link">
              Explore all tracks <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        {tracks.length ? (
          <div
            className="site-showcase-viewport site-container"
            data-showcase-viewport
          >
            <div className="site-showcase-track" data-showcase-track>
              {tracks.map((track, index) => {
                const theme = getTrackTheme(track.slug || track.data.title);
                const canonical = terrainFor(track.slug, track.data.title);
                const style: ThemeVars = {
                  "--track-color": theme.color,
                  "--track-rgb": theme.rgb,
                  "--track-ink": theme.ink,
                };
                return (
                  <article
                    className="site-showcase-card"
                    data-showcase-card
                    data-reveal
                    key={track.id}
                    style={style}
                  >
                    <div className="site-showcase-card__top">
                      <span>0{index + 1}</span>
                      <span
                        className="site-track-swatch"
                        aria-hidden="true"
                      />{" "}
                      <span>
                        {track.data.category || canonical?.tag || "TRACK"}
                      </span>
                    </div>
                    <h3>{track.data.title}</h3>
                    <p
                      className="site-showcase-card__arabic"
                      lang="ar"
                      dir="rtl"
                    >
                      {track.data.arabicTitle ||
                        theme.arabic ||
                        canonical?.arabicTitle}
                    </p>
                    <p className="site-showcase-card__summary">
                      {track.data.summary ||
                        track.data.body ||
                        canonical?.description}
                    </p>
                    <ul>
                      {(canonical?.terrain.slice(0, 3) ?? []).map((item) => (
                        <li key={item.title}>{item.title}</li>
                      ))}
                    </ul>
                    <Link
                      href={`/tracks#${track.slug}`}
                      aria-label={`Explore ${track.data.title}`}
                    >
                      VIEW TRACK <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="site-container">
            <EmptyState
              label="TRACKS / PUBLIC DIRECTORY"
              title="The index is being assembled."
              text="There are no track details published right now. Meet the teams page shows approved people and responsibilities."
              href="/community"
              linkLabel="Meet the teams"
            />
          </div>
        )}
      </section>

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
