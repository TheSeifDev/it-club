import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { publicAlumni, readPublicSiteContent, safeImage } from "@/src/components/site/content-utils";
import { EmptyState, PageIntro, SectionLabel, SiteFrame } from "@/src/components/site/SiteUI";
import { publicMetadata } from "@/src/components/site/content-utils";

export const metadata: Metadata = publicMetadata(
  "Alumni",
  "Recognizing former IT Club members whose published contributions remain part of the community story.",
  "/alumni",
);

export default async function AlumniPage() {
  const content = await readPublicSiteContent();
  const alumni = publicAlumni(content.members);

  return (
    <SiteFrame>
      <PageIntro number="06" eyebrow="ALUMNI / PART OF THE STORY" title="Built by more than one generation." description="A community lasts because people share what they know, take responsibility, and make space for the next person. This page recognizes former members whose profiles have been approved for public view." arabic="أثر الأعضاء السابقين يظل حاضرًا في كل ما يبنيه الفريق اليوم." />
      <section className="site-alumni-section site-container">
        <SectionLabel number="01">FORMER MEMBERS</SectionLabel>
        {alumni.length ? (
          <div className="site-alumni-list">{alumni.map((member, index) => {
            const image = safeImage(member.data.image);
            return (
              <article className="site-alumni-row" key={member.id} data-reveal>
                <span className="site-alumni-row__index">{String(index + 1).padStart(2, "0")}</span>
                {image ? <Link className="site-alumni-row__portrait" href={`/community/${member.slug}`} aria-label={`View ${member.data.title}'s profile`}><Image src={image} alt={member.data.title} width={120} height={150} unoptimized /></Link> : null}
                <div className="site-alumni-row__copy"><p className="site-eyebrow">{member.data.committee || "IT CLUB ALUMNI"}</p><h2><Link href={`/community/${member.slug}`}>{member.data.title}<span aria-hidden="true">↗</span></Link></h2><p className="site-alumni-row__role">{member.data.role}</p>{member.data.summary ? <p>{member.data.summary}</p> : member.data.responsibilities?.length ? <p>{member.data.responsibilities.join(" · ")}</p> : null}</div>
                <span className="site-alumni-row__word" aria-hidden="true">THEN / NOW</span>
              </article>
            );
          })}</div>
        ) : <EmptyState title="No alumni profiles are published yet." text="We do not invent a roll of honor. Former members will appear here when their profile and contribution are confirmed for publication." />}
      </section>
      <section className="site-alumni-cta"><div className="site-container"><SectionLabel number="02">THE COMMUNITY CONTINUES</SectionLabel><h2 className="site-display">Good work leaves<br />a way forward.</h2><p>Meet the people carrying the club forward today.</p><Link href="/community" className="site-button site-button--paper">EXPLORE THE COMMUNITY <span aria-hidden="true">↗</span></Link></div></section>
    </SiteFrame>
  );
}
