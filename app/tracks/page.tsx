import Link from "next/link";
import type { Metadata } from "next";
import { publicBoards, publicTracks, readPublicSiteContent } from "@/src/components/site/content-utils";
import { EmptyState, PageIntro, SectionLabel, SiteFrame } from "@/src/components/site/SiteUI";
import { publicMetadata } from "@/src/components/site/content-utils";

export const metadata: Metadata = publicMetadata(
  "Tracks & Teams",
  "Explore the approved tracks and committees that make up IT Club at Borg Al Arab Technological University.",
  "/tracks",
);

export default async function TracksPage() {
  const content = await readPublicSiteContent();
  const tracks = publicTracks(content.tracks);
  const boards = publicBoards(content.boards);

  return (
    <SiteFrame>
      <PageIntro number="03" eyebrow="TRACKS / WHERE IDEAS GET A TEAM" title="Different ways to build." description="IT Club brings technical and operational work together. Each track has its own purpose, people, and responsibilities; the index below includes only track details approved for publication." arabic="اختر المساحة التي تناسب فضولك، ثم تعلّم واشتغل مع فريقك." />
      <section className="site-tracks-index site-container">
        <div className="site-tracks-index__head"><SectionLabel number="01">THE INDEX</SectionLabel><p>Track descriptions and links reflect the current published directory.</p></div>
        {tracks.length ? (
          <div className="site-track-list site-track-list--page">
            {tracks.map((track, index) => (
              (() => {
                const board = boards.find((item) => item.slug === track.slug || item.data.title === track.data.title);
                return (
                  <article className="site-track-row site-track-row--page" id={track.slug} key={track.id} data-reveal>
                    <span className="site-track-row__number">{String(index + 1).padStart(2, "0")}</span>
                    <div><p className="site-eyebrow">{track.data.category || "TRACK"}</p><h2>{track.data.title}</h2>{track.data.summary ? <p>{track.data.summary}</p> : null}{track.data.body ? <p className="site-track-row__detail">{track.data.body}</p> : null}
                      {board?.data.responsibilities?.length ? <div className="site-track-row__scope"><p className="site-eyebrow">TEAM RESPONSIBILITIES</p><ul>{board.data.responsibilities.map((responsibility) => <li key={responsibility}>{responsibility}</li>)}</ul></div> : null}
                    </div>
                    <Link href="/community" aria-label={`Meet the people in ${track.data.title}`}>MEET THE PEOPLE <span aria-hidden="true">↗</span></Link>
                  </article>
                );
              })()
            ))}
          </div>
        ) : (
          <EmptyState title="The track index is in progress." text="No track descriptions have been published yet. We will add details here when the current structure is ready to share." href="/community" linkLabel="See published community profiles" />
        )}
      </section>
      <section className="site-tracks-note"><div className="site-container"><SectionLabel number="02">FIND YOUR PLACE</SectionLabel><div><h2 className="site-display">Start with what<br />you want to learn.</h2><p>Tracks are a way into the work—not a limit on what you can become. Explore the published team directory to understand who owns each responsibility.</p><Link className="site-button site-button--paper" href="/community">MEET THE TEAMS <span aria-hidden="true">↗</span></Link></div></div></section>
    </SiteFrame>
  );
}
