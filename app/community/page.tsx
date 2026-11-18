import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import CommunityDirectory from "@/src/components/site/CommunityDirectory";
import { displayResponsibilities, publicBoards, publicMembers, readPublicSiteContent, safeImage } from "@/src/components/site/content-utils";
import { EmptyState, PageIntro, SectionLabel, SiteFrame } from "@/src/components/site/SiteUI";
import { publicMetadata } from "@/src/components/site/content-utils";

export const metadata: Metadata = publicMetadata(
  "Community & Teams",
  "Meet the people and published boards behind IT Club at BATU, with verified roles, responsibilities, and committee filters.",
  "/community",
);

export default async function CommunityPage() {
  const content = await readPublicSiteContent();
  const members = publicMembers(content.members);
  const boards = publicBoards(content.boards);
  const leaders = members.filter((member) => member.data.committee?.trim().toLowerCase() === "it club");
  const committees = [...new Set(members.map((member) => member.data.committee?.trim()).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));
  const directoryMembers = members.map((member) => ({
    slug: member.slug,
    name: member.data.title,
    role: member.data.role ?? "",
    committee: member.data.committee ?? "",
    summary: displayResponsibilities(member).join(" "),
    image: safeImage(member.data.image),
  }));

  return (
    <SiteFrame>
      <PageIntro number="02" eyebrow="COMMUNITY / THE PEOPLE" title="A club is its people." description="Meet the members, leaders, and boards whose published work makes IT Club run. Profiles show their approved role and team; where the public record describes a shared committee mission, it is presented as team scope rather than an individual claim." arabic="وراء كل فكرة فريق، ووراء كل فريق أشخاص يصنعون الفرق." />
      {leaders.length ? (
        <section className="site-leadership site-container">
          <SectionLabel number="01">CLUB LEADERSHIP</SectionLabel>
          <div className="site-leadership__list">
            {leaders.map((leader) => {
              const image = safeImage(leader.data.image);
              return (
                <article className="site-leader-feature" key={leader.id} data-reveal>
                  {image ? <Link className="site-leader-feature__portrait" href={`/community/${leader.slug}`} aria-label={`View ${leader.data.title}'s profile`}><Image src={image} alt={leader.data.title} width={340} height={430} unoptimized /></Link> : null}
                  <div className="site-leader-feature__copy"><p className="site-eyebrow">{leader.data.role} · IT CLUB</p><h2 className="site-display"><Link href={`/community/${leader.slug}`}>{leader.data.title}<span aria-hidden="true">↗</span></Link></h2><p>{displayResponsibilities(leader)[0]}</p><Link className="site-text-link" href={`/community/${leader.slug}`}>View profile <span aria-hidden="true">↗</span></Link></div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="site-board-index">
        <div className="site-container"><SectionLabel number="02">THE BOARDS</SectionLabel><div className="site-board-index__intro"><h2 className="site-display">Many disciplines.<br /><span>One community.</span></h2><p>Each board has its own responsibilities. Browse the published teams below, then find the people doing that work.</p></div>
          {boards.length ? <div className="site-board-rows">{boards.map((board, index) => <article className="site-board-row" key={board.id} data-reveal><span>{String(index + 1).padStart(2, "0")}</span><div><p className="site-eyebrow">{board.data.category || "IT CLUB / BOARD"}</p><h3>{board.data.title}</h3>{board.data.summary || board.data.body ? <p>{board.data.summary || board.data.body}</p> : null}</div><Link href="/tracks" aria-label={`See tracks related to ${board.data.title}`}>↗</Link></article>)}</div> : <EmptyState title="Board details are being prepared." text="No board description has been published yet. The directory below only lists people whose profiles have been approved." href="/tracks" linkLabel="Browse the track index" />}
        </div>
      </section>

      <section className="site-directory-section">
        <div className="site-container"><SectionLabel number="03">MEMBER DIRECTORY</SectionLabel><div className="site-directory-section__heading"><h2 className="site-display">Know who does what.</h2><p>Search names, roles, or committees. Use the team filters to narrow the list.</p></div></div>
        {directoryMembers.length ? <CommunityDirectory members={directoryMembers} committees={committees} /> : <div className="site-container"><EmptyState title="No member profiles are published yet." text="The directory will show members once their role, committee, and responsibilities have been approved for public view." /></div>}
      </section>
      <section className="site-cta-band"><div className="site-container"><p className="site-eyebrow">A PLACE FOR PEOPLE WHO WANT TO MAKE</p><h2 className="site-display">Find your team.</h2><Link className="site-button site-button--emerald" href="/tracks">EXPLORE TRACKS <span aria-hidden="true">↗</span></Link></div></section>
    </SiteFrame>
  );
}
