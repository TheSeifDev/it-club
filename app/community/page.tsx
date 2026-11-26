import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import CommunityDirectory from "@/src/components/site/CommunityDirectory";
import CommunityPersonCard, {
  type CommunityPerson,
} from "@/src/components/site/CommunityPersonCard";
import communityStyles from "@/src/components/site/Community.module.css";
import { getTrackTheme } from "@/lib/ui/track-theme";
import {
  displayResponsibilities,
  publicBoards,
  publicMembers,
  publicMetadata,
  readPublicSiteContent,
  safeImage,
} from "@/src/components/site/content-utils";
import { SiteFrame } from "@/src/components/site/SiteUI";

type ThemeVars = CSSProperties & {
  "--track-color"?: string;
  "--track-rgb"?: string;
  "--track-ink"?: string;
};

export const metadata: Metadata = publicMetadata(
  "Community & Teams",
  "Meet the people and published boards behind IT Club at BATU, with verified roles, responsibilities, and committee filters.",
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
    image: safeImage(entry.data.image),
  };
}

export default async function CommunityPage() {
  const content = await readPublicSiteContent();
  const members = publicMembers(content.members);
  const boards = publicBoards(content.boards);
  const leaders = members.filter(
    (member) => member.data.committee?.trim().toLowerCase() === "it club",
  );
  const committees = [
    ...new Set(
      members
        .map((member) => member.data.committee?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort((a, b) => a.localeCompare(b));
  const directoryMembers = members.map(personFromEntry);
  const leadership = leaders.map(personFromEntry);

  return (
    <SiteFrame>
      <div className={communityStyles.page}>
        <section className={communityStyles.intro}>
          <div className={communityStyles.container}>
            <div className={communityStyles.sectionLabel}>
              <span className={communityStyles.sectionNumber}>02</span>
              <span>COMMUNITY / THE PEOPLE</span>
            </div>
            <div className={communityStyles.introBody} data-reveal>
              <div>
                <h1 className={communityStyles.title}>A club is its people.</h1>
                <p className={communityStyles.arabic} lang="ar" dir="rtl">
                  وراء كل فكرة فريق، ووراء كل فريق أشخاص يصنعون الفرق.
                </p>
              </div>
              <p className={communityStyles.introCopy}>
                Meet the people moving IT Club forward. Explore our leadership,
                find your team, and see how every role contributes.
              </p>
            </div>
          </div>
        </section>

        {leadership.length ? (
          <section className={communityStyles.leadership}>
            <div className={communityStyles.container}>
              <div className={communityStyles.sectionLabel}>
                <span className={communityStyles.sectionNumber}>01</span>
                <span>CLUB LEADERSHIP / قيادة النادي</span>
              </div>
              <div className={communityStyles.leadershipHeading} data-reveal>
                <h2 className={communityStyles.heading}>
                  The people setting the pace.
                </h2>
                <p className={communityStyles.headingNote}>
                  Meet the leadership bringing our people, ideas, and teams
                  together.
                </p>
              </div>
              <div className={communityStyles.leadershipGrid}>
                {leadership.map((person, index) => (
                  <CommunityPersonCard
                    key={person.slug}
                    person={person}
                    variant="leadership"
                    priority={index < 3}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className={communityStyles.boardSection}>
          <div className={communityStyles.container}>
            <div className={communityStyles.sectionLabel}>
              <span className={communityStyles.sectionNumber}>02</span>
              <span>THE BOARDS / اللجان</span>
            </div>
            <div className={communityStyles.boardHeading} data-reveal>
              <h2 className={communityStyles.heading}>
                Many disciplines. <span>One community.</span>
              </h2>
              <p className={communityStyles.headingNote}>
                Each board has its own responsibilities. Explore the teams, then
                meet the people doing that work.
              </p>
            </div>
            {boards.length ? (
              <div className={communityStyles.boardGrid}>
                {boards.map((board, index) => {
                  const theme = getTrackTheme(board.slug || board.data.title);
                  const style: ThemeVars = {
                    "--track-color": theme.color,
                    "--track-rgb": theme.rgb,
                    "--track-ink": theme.ink,
                  };
                  const summary = board.data.summary || board.data.body;
                  return (
                    <article
                      className={communityStyles.boardCard}
                      key={board.id}
                      data-reveal
                      style={style}
                    >
                      <span className={communityStyles.boardIndex}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className={communityStyles.boardCategory}>
                        <span
                          className={communityStyles.boardSwatch}
                          aria-hidden="true"
                        />
                        <span>{board.data.category || "IT CLUB / BOARD"}</span>
                        {theme.arabic ? (
                          <span lang="ar" dir="rtl">
                            · {theme.arabic}
                          </span>
                        ) : null}
                      </p>
                      <h3>{board.data.title}</h3>
                      {summary ? <p>{summary}</p> : null}
                      <Link
                        className={communityStyles.boardLink}
                        href="/tracks"
                        aria-label={`See tracks related to ${board.data.title}`}
                      >
                        ↗
                      </Link>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className={communityStyles.noMatches} role="status">
                <span aria-hidden="true">—</span>
                <div>
                  <p className={communityStyles.eyebrow}>BOARD INDEX</p>
                  <h2>No board details are available yet.</h2>
                  <p>
                    The directory below lists people whose profiles are approved
                    for public view.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={communityStyles.directorySection}>
          <div className={communityStyles.container}>
            <div className={communityStyles.sectionLabel}>
              <span className={communityStyles.sectionNumber}>03</span>
              <span>MEMBER DIRECTORY / دليل الأعضاء</span>
            </div>
            <div className={communityStyles.directoryHeading} data-reveal>
              <h2 className={communityStyles.heading}>Know who does what.</h2>
              <p className={communityStyles.headingNote}>
                Search names, roles, or committees. Use the color-coded filters
                to find your team.
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
                <p className={communityStyles.eyebrow}>MEMBER DIRECTORY</p>
                <h2>No member profiles are published yet.</h2>
                <p>
                  The directory will show members once their role, committee,
                  and responsibilities are approved for public view.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className={communityStyles.cta}>
          <div className={communityStyles.container}>
            <p className={communityStyles.ctaLabel}>
              A PLACE FOR PEOPLE WHO WANT TO MAKE
            </p>
            <h2>Find your team.</h2>
            <Link className={communityStyles.ctaLink} href="/tracks">
              EXPLORE TRACKS <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
      </div>
    </SiteFrame>
  );
}
