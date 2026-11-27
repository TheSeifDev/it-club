import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, UsersRound } from "lucide-react";
import CommunityHero from "@/src/components/site/CommunityHero";
import CommunityCommittees from "@/src/components/site/CommunityCommittees";
import CommunityDirectory from "@/src/components/site/CommunityDirectory";
import CommunityPersonCard, {
  type CommunityPerson,
} from "@/src/components/site/CommunityPersonCard";
import communityStyles from "@/src/components/site/CommunityStyles";
import {
  communityBoards,
  communityMembers,
} from "@/src/components/site/community-content";
import { getTrackTheme } from "@/lib/ui/track-theme";
import {
  displayResponsibilities,
  publicMetadata,
  readPublicSiteContent,
} from "@/src/components/site/content-utils";
import { SiteFrame } from "@/src/components/site/SiteUI";

export const metadata: Metadata = publicMetadata(
  "Community & Teams",
  "Meet the people and published committees behind IT Club at BATU, with verified roles, responsibilities, and team filters.",
  "/community",
);

function personFromEntry(
  entry: Parameters<typeof displayResponsibilities>[0],
): CommunityPerson {
  return {
    slug: entry.slug,
    name: entry.data.title,
    role: entry.data.role ?? "",
    committee: entry.data.committee ?? "",
    summary: displayResponsibilities(entry).join(" "),
  };
}

export default async function CommunityPage() {
  const content = await readPublicSiteContent();
  // Presentation-only exclusion: stored records and other public routes stay unchanged.
  const members = communityMembers(content.members);
  const boards = communityBoards(content.boards);
  const leadership = members
    .filter(
      (member) => member.data.committee?.trim().toLowerCase() === "it club",
    )
    .map(personFromEntry);
  const committees = [
    ...new Set(
      members
        .map((member) => member.data.committee?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort((a, b) => a.localeCompare(b));
  const teams = boards.map((board) => {
    const theme = getTrackTheme(
      board.slug || board.data.committee || board.data.title,
    );
    return { name: board.data.title, short: theme.short, color: theme.color };
  });
  const directoryMembers = members.map(personFromEntry);
  const directoryNumber = leadership.length ? "04" : "03";
  const ctaNumber = leadership.length ? "05" : "04";

  return (
    <SiteFrame>
      <div className={communityStyles.page}>
        <CommunityHero teams={teams} />

        <section
          id="community-committees"
          aria-labelledby="community-committees-title"
          className={`${communityStyles.boardSection} scroll-mt-[var(--site-header-clearance,112px)]`}
        >
          <div className={communityStyles.container}>
            <div className={communityStyles.sectionLabel}>
              <span
                className={communityStyles.sectionNumber}
                data-section-number="02"
              >
                02
              </span>
              <span className={communityStyles.sectionLabelText}>
                The committees / اللجان
              </span>
            </div>
            <div className={communityStyles.boardHeading} data-reveal>
              <h2
                id="community-committees-title"
                className={communityStyles.heading}
              >
                Many disciplines.
                <br />
                <span className="text-[var(--site-sky-ink,#52e8d1)]">
                  One community.
                </span>
              </h2>
              <p className={communityStyles.headingNote}>
                Different teams, connected by the same ambition. Discover each
                committee’s focus and the work that brings us together.
              </p>
            </div>
            {boards.length ? (
              <CommunityCommittees boards={boards} />
            ) : (
              <div className={communityStyles.noMatches} role="status">
                <span aria-hidden="true">—</span>
                <div>
                  <p className={communityStyles.eyebrow}>Committee index</p>
                  <h2>No committee details are published yet.</h2>
                  <p>
                    Approved committee information will appear here. The
                    directory below shows profiles cleared for public view.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {leadership.length ? (
          <section
            className={communityStyles.leadership}
            aria-labelledby="community-leadership-title"
          >
            <div className={communityStyles.container}>
              <div className={communityStyles.sectionLabel}>
                <span
                  className={communityStyles.sectionNumber}
                  data-section-number="03"
                >
                  03
                </span>
                <span className={communityStyles.sectionLabelText}>
                  Club leadership / قيادة النادي
                </span>
              </div>
              <div className={communityStyles.leadershipHeading} data-reveal>
                <h2
                  id="community-leadership-title"
                  className={communityStyles.heading}
                >
                  The people setting the pace.
                </h2>
                <p className={communityStyles.headingNote}>
                  Meet the leadership bringing our people, ideas, and teams
                  together.
                </p>
              </div>
              <div className={communityStyles.leadershipGrid}>
                {leadership.map((person) => (
                  <CommunityPersonCard
                    key={person.slug}
                    person={person}
                    variant="leadership"
                  />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section
          className={communityStyles.directorySection}
          aria-labelledby="community-directory-title"
        >
          <div className={communityStyles.container}>
            <div className={communityStyles.sectionLabel}>
              <span
                className={communityStyles.sectionNumber}
                data-section-number={directoryNumber}
              >
                {directoryNumber}
              </span>
              <span className={communityStyles.sectionLabelText}>
                Member directory / دليل الأعضاء
              </span>
            </div>
            <div className={communityStyles.directoryHeading} data-reveal>
              <h2
                id="community-directory-title"
                className={communityStyles.heading}
              >
                Know who does what.
              </h2>
              <p className={communityStyles.headingNote}>
                Search names, roles, or committees. Use the team filters to find
                the people behind the work.
              </p>
            </div>
          </div>
          {directoryMembers.length ? (
            <CommunityDirectory
              members={directoryMembers}
              committees={committees}
            />
          ) : (
            <div
              className={`${communityStyles.container} ${communityStyles.noMatches}`}
              role="status"
            >
              <span aria-hidden="true">—</span>
              <div>
                <p className={communityStyles.eyebrow}>Member directory</p>
                <h2>No member profiles are published yet.</h2>
                <p>
                  The directory will show members once their role, committee,
                  and responsibilities are approved for public view.
                </p>
              </div>
            </div>
          )}
        </section>

        <section
          className={communityStyles.cta}
          aria-labelledby="community-cta-title"
        >
          <div className={communityStyles.container}>
            <div className={communityStyles.ctaPanel}>
              <div className={communityStyles.sectionLabel}>
                <span
                  className={communityStyles.sectionNumber}
                  data-section-number={ctaNumber}
                >
                  {ctaNumber}
                </span>
                <span className={communityStyles.sectionLabelText}>
                  Find your place
                </span>
              </div>
              <div className={communityStyles.ctaCopy}>
                <h2 id="community-cta-title">
                  Find your team.
                  <span
                    className={communityStyles.ctaAccent}
                    aria-hidden="true"
                  >
                    <UsersRound size={24} strokeWidth={1.6} />
                  </span>
                </h2>
                <p>
                  Explore the published tracks and find a place to learn and
                  contribute.
                </p>
                <Link className={communityStyles.ctaLink} href="/tracks">
                  Explore tracks
                  <span className={communityStyles.ctaArrow} aria-hidden="true">
                    <ArrowUpRight size={17} strokeWidth={1.8} />
                  </span>
                </Link>
              </div>
              <span className={communityStyles.ctaIconTile} aria-hidden="true">
                <UsersRound size={30} strokeWidth={1.4} />
              </span>
            </div>
          </div>
        </section>
      </div>
    </SiteFrame>
  );
}
