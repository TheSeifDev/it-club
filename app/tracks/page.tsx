import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { IT_CLUB_TRACKS } from "@/src/components/interview/Tracks/tracks-data";
import { getTrackTheme } from "@/lib/ui/track-theme";
import {
  publicBoards,
  publicTracks,
  readPublicSiteContent,
} from "@/src/components/site/content-utils";
import {
  EmptyState,
  PageIntro,
  SectionLabel,
  SiteFrame,
} from "@/src/components/site/SiteUI";
import { publicMetadata } from "@/src/components/site/content-utils";

type ThemeVars = React.CSSProperties & {
  "--track-color"?: string;
  "--track-rgb"?: string;
  "--track-ink"?: string;
};

export const metadata: Metadata = publicMetadata(
  "Tracks & Teams",
  "Explore the approved tracks and committees that make up IT Club at Borg Al Arab Technological University.",
  "/tracks",
);

function terrainFor(slug: string, title: string) {
  const normalized = `${slug} ${title}`.toLowerCase();
  return IT_CLUB_TRACKS.find(
    (track) =>
      track.anchorIds.some((anchor) => normalized.includes(anchor)) ||
      track.title.toLowerCase() === title.toLowerCase(),
  );
}

export default async function TracksPage() {
  const content = await readPublicSiteContent();
  const tracks = publicTracks(content.tracks);
  const boards = publicBoards(content.boards);

  return (
    <SiteFrame>
      <PageIntro
        number="03"
        eyebrow="TRACKS / WHERE IDEAS GET A TEAM"
        title="Different ways to build."
        description="Every published track has a distinct remit, a clear way to contribute, and a place in the club's shared momentum."
        arabic="لكل مسار طريقته، لكننا نتحرك كفريق واحد."
      />
      <section
        className="site-tracks-index site-container"
        data-showcase
        aria-labelledby="tracks-index-title"
      >
        <div className="site-tracks-index__head">
          <div>
            <SectionLabel number="01">
              THE FULL INDEX / الدليل الكامل
            </SectionLabel>
            <h2
              id="tracks-index-title"
              className="site-display"
              data-line-heading
            >
              Find your
              <br />
              <span>place to contribute.</span>
            </h2>
          </div>
          <p>
            Track colors belong to the club’s identity. The work descriptions
            below come from the published track record and canonical committee
            remit.
          </p>
        </div>
        {tracks.length ? (
          <div className="site-track-showcase" data-showcase-viewport>
            <div className="site-track-showcase__track" data-showcase-track>
              {tracks.map((track, index) => {
                const theme = getTrackTheme(track.slug || track.data.title);
                const canonical = terrainFor(track.slug, track.data.title);
                const board = boards.find(
                  (item) =>
                    item.slug === track.slug ||
                    item.data.title === track.data.title,
                );
                const terrain = canonical?.terrain ?? [];
                const style: ThemeVars = {
                  "--track-color": theme.color,
                  "--track-rgb": theme.rgb,
                  "--track-ink": theme.ink,
                };
                return (
                  <article
                    className="site-track-card"
                    id={track.slug}
                    key={track.id}
                    data-showcase-card
                    data-reveal
                    style={style}
                  >
                    <div className="site-track-card__top">
                      <span className="site-track-card__number">
                        0{index + 1}
                      </span>
                      <span className="site-track-card__tag">
                        {track.data.category || canonical?.tag || "TRACK"}
                      </span>
                      <span
                        className="site-track-card__mark"
                        aria-hidden="true"
                      >
                        ↗
                      </span>
                    </div>
                    <div className="site-track-card__heading">
                      <h3>{track.data.title}</h3>
                      <p lang="ar" dir="rtl">
                        {track.data.arabicTitle ||
                          theme.arabic ||
                          canonical?.arabicTitle}
                      </p>
                    </div>
                    <p className="site-track-card__summary">
                      {track.data.summary ||
                        track.data.body ||
                        canonical?.description}
                    </p>
                    <div className="site-track-card__scope">
                      <p className="site-eyebrow">
                        DOCUMENTED TERRAIN / نطاق العمل
                      </p>
                      <ul>
                        {(terrain.length
                          ? terrain.slice(0, 4).map((item) => item.title)
                          : (board?.data.responsibilities?.slice(0, 4) ?? [])
                        ).map((item) => (
                          <li key={item}>
                            <span aria-hidden="true" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link className="site-track-card__link" href="/community">
                      Meet the people{" "}
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState
            title="The track index is in progress."
            text="No track descriptions have been published yet. We will add details here when the current structure is ready to share."
            href="/community"
            linkLabel="See published community profiles"
          />
        )}
      </section>
      <section className="site-tracks-note">
        <div className="site-container">
          <SectionLabel number="02">FIND YOUR PLACE / مكانك</SectionLabel>
          <div>
            <h2 className="site-display" data-line-heading>
              Start with what
              <br />
              <span>you want to learn.</span>
            </h2>
            <p>
              Tracks are a way into the work—not a limit on what you can become.
              Explore the published community directory to understand who owns
              each responsibility.
            </p>
            <Link className="site-button site-button--paper" href="/community">
              MEET THE TEAMS <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>
    </SiteFrame>
  );
}
