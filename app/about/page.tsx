import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro, SectionLabel, SiteFrame } from "@/src/components/site/SiteUI";
import { publicMetadata } from "@/src/components/site/content-utils";

export const metadata: Metadata = publicMetadata(
  "About IT Club",
  "What IT Club means at Borg Al Arab Technological University: a student-led technology community built around people learning and making together.",
  "/about",
);

const principles = [
  { number: "01", title: "Learn by doing", text: "Knowledge takes shape when it is put to use: in a project, a conversation, a workshop, or a problem worth solving." },
  { number: "02", title: "Make room for people", text: "A club is its people. Different interests and ways of thinking belong at the same table." },
  { number: "03", title: "Build with care", text: "Good work is clear about what it is, useful to someone, and stronger because it was made together." },
];

export default function AboutPage() {
  return (
    <SiteFrame>
      <PageIntro number="01" eyebrow="ABOUT / THE SHORT VERSION" title="Technology is a team sport." description="IT Club means Information Technology Club: a student-led community at Borg Al Arab Technological University, Alexandria. We bring students together around technology, practical learning, and the shared work of turning ideas into things that matter." arabic="نادي طلابي في جامعة برج العرب التكنولوجية؛ نتعلم التقنية معًا ونحوّل الأفكار إلى عمل مشترك." tone="paper" />
      <section className="site-about-statement">
        <div className="site-container site-about-statement__grid">
          <div><SectionLabel number="02" tone="dark">WHAT WE BELIEVE</SectionLabel><h2 className="site-display">Curiosity<br />needs a place<br />to <em>work.</em></h2></div>
          <div className="site-about-statement__copy"><p>IT Club is not one course, one specialty, or a promise of instant expertise. It is a place for students to find a team, contribute to a shared purpose, and learn by taking part in the work.</p><p>The club brings technical and operational work into one community. People make the tools, organize the moments, tell the stories, support the teams, and carry ideas forward.</p><p className="site-arabic" lang="ar" dir="rtl">التقنية تبدأ بالفضول، وتكبر بالتجربة والعمل الجماعي. هنا يجد كل طالب مساحة ليشارك ويتعلم ويترك أثرًا.</p></div>
        </div>
      </section>
      <section className="site-about-principles site-container">
        <SectionLabel number="03">HOW WE SHOW UP</SectionLabel>
        <div className="site-principle-list">{principles.map((item) => <article key={item.number} data-reveal><span>{item.number}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </section>
      <section className="site-about-links">
        <div className="site-container"><SectionLabel number="04">EXPLORE THE CLUB</SectionLabel><div className="site-about-links__rows"><Link href="/community"><span>People & teams</span><span>Meet the community ↗</span></Link><Link href="/tracks"><span>How we work</span><span>Explore tracks ↗</span></Link><Link href="/events"><span>What we do together</span><span>Published events ↗</span></Link></div></div>
      </section>
    </SiteFrame>
  );
}
