import type { Metadata } from "next";
import { PageIntro, SectionLabel, SiteFrame } from "@/src/components/site/SiteUI";
import { publicMetadata } from "@/src/components/site/content-utils";

export const metadata: Metadata = publicMetadata(
  "Terms of Use",
  "Terms and conditions for using the IT Club website and interview platform.",
  "/terms",
);

const sections = [
  { title: "Using the website", text: "You may use the IT Club website to learn about the club, explore available tracks, understand the interview process, review opportunities, and access information made available to applicants and members." },
  { title: "Registering to IT Club", text: "Submitting an application means that you are interested in joining IT Club. An application does not guarantee an interview, acceptance, a specific track, or a specific position within the club." },
  { title: "Interview process", text: "Interview activities may include questions, discussions, technical or non-technical evaluation, and conversations about your interests and experience. The format and evaluation criteria may vary depending on the track and recruitment cycle." },
  { title: "Accurate information", text: "Applicants are expected to provide information that is accurate and represents their own experience. Submitting misleading information, impersonating another person, or intentionally misrepresenting your skills may affect your application." },
  { title: "Respectful participation", text: "IT Club is a student community. Applicants and participants are expected to communicate respectfully with other students, interviewers, organizers, and club members throughout the application and interview process." },
  { title: "Submitted content", text: "You are responsible for content you submit through the platform, including descriptions, portfolio links, project information, and other materials. Do not submit content that violates applicable laws or the rights of another person." },
  { title: "Intellectual property", text: "The IT Club name, visual identity, website design, original graphics, written content, and other original materials belong to their respective owners. They should not be copied, redistributed, or presented as your own without permission." },
  { title: "Platform availability", text: "We may update, modify, temporarily suspend, or remove parts of the website or interview platform when necessary. We do not guarantee that every feature will always be available." },
  { title: "Changes to these terms", text: "These Terms may be updated as the IT Club website, recruitment process, or services evolve. The current version of the Terms will be published on this page." },
];

export default function TermsPage() {
  return (
    <SiteFrame>
      <PageIntro number="09" eyebrow="TERMS / HOW WE WORK TOGETHER" title="Show up. Build together." description="These terms set out basic expectations for using the IT Club website, exploring opportunities, and participating in the interview platform." arabic="توضح هذه الشروط التوقعات الأساسية لاستخدام موقع النادي والمشاركة في أنشطته." />
      <section className="site-legal-section"><div className="site-container site-legal-layout"><aside><SectionLabel number="01" tone="dark">IN THESE TERMS</SectionLabel><nav aria-label="Terms sections">{sections.map((section, index) => <a key={section.title} href={`#terms-${index + 1}`}><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</a>)}</nav></aside><div className="site-legal-copy"><div className="site-legal-copy__intro"><p className="site-eyebrow">IT CLUB / TERMS</p><h2 className="site-display">Be clear.<br />Be considerate.</h2><p className="site-arabic" lang="ar" dir="rtl">شروط الاستخدام</p></div>{sections.map((section, index) => <section className="site-legal-item" id={`terms-${index + 1}`} key={section.title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{section.title}</h3><p>{section.text}</p></div></section>)}<section className="site-legal-contact"><p className="site-eyebrow">QUESTIONS ABOUT THESE TERMS?</p><h3>Get in touch.</h3><p>If you have a question about using this site or interview platform, contact the IT Club team.</p><a href="mailto:contact@itclub.one">contact@itclub.one <span aria-hidden="true">↗</span></a></section></div></div></section>
    </SiteFrame>
  );
}
