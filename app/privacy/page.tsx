import type { Metadata } from "next";
import { PageIntro, SectionLabel, SiteFrame } from "@/src/components/site/SiteUI";
import { publicMetadata } from "@/src/components/site/content-utils";

export const metadata: Metadata = publicMetadata(
  "Privacy Policy",
  "How IT Club handles information submitted through the website and interview platform.",
  "/privacy",
);

const sections = [
  { title: "What we collect", text: "Depending on how you interact with IT Club, we may collect information such as your name, email address, phone number, academic information, selected track, technical interests, portfolio links, and information you choose to provide during the application or interview process." },
  { title: "Why we collect it", text: "Your information helps us review applications, understand your interests, prepare for interviews, communicate important updates, organize teams, and determine where your skills and interests may fit within IT Club." },
  { title: "Application information", text: "Information submitted through the interview platform is used for the club's selection and recruitment process. Access to this information should be limited to people responsible for reviewing applications, conducting interviews, or managing the relevant club operations." },
  { title: "Communications", text: "If you provide your contact information, IT Club may use it to contact you about your application, interview schedule, selection results, club activities, or other information directly related to your participation." },
  { title: "Data protection", text: "We take reasonable steps to protect information against unauthorized access, alteration, disclosure, or loss. Access should be restricted to information that is necessary for the person's role within the club." },
  { title: "Third-party services", text: "Parts of the platform may rely on external infrastructure, hosting, analytics, storage, or communication services. Those services may process information according to their own policies and terms." },
  { title: "Your information", text: "If you have questions about information you submitted, believe something is inaccurate, or want to understand how your information is being handled, you can contact the IT Club team." },
];

export default function PrivacyPage() {
  return (
    <SiteFrame>
      <PageIntro number="08" eyebrow="PRIVACY / YOUR INFORMATION" title="Your information deserves care." description="This notice explains how IT Club may handle information submitted through the website and interview platform. It describes the purposes for which information may be used and how to contact the team with questions." arabic="نحترم خصوصية المعلومات التي تشاركها معنا، ونستخدمها في السياق الذي قُدّمت من أجله." />
      <section className="site-legal-section"><div className="site-container site-legal-layout"><aside><SectionLabel number="01" tone="dark">IN THIS NOTICE</SectionLabel><nav aria-label="Privacy notice sections">{sections.map((section, index) => <a key={section.title} href={`#privacy-${index + 1}`}><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</a>)}</nav></aside><div className="site-legal-copy"><div className="site-legal-copy__intro"><p className="site-eyebrow">IT CLUB / PRIVACY</p><h2 className="site-display">Clear terms.<br />Respectful use.</h2><p className="site-arabic" lang="ar" dir="rtl">سياسة الخصوصية</p></div>{sections.map((section, index) => <section className="site-legal-item" id={`privacy-${index + 1}`} key={section.title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{section.title}</h3><p>{section.text}</p></div></section>)}<section className="site-legal-contact"><p className="site-eyebrow">QUESTIONS ABOUT YOUR INFORMATION?</p><h3>Talk to the IT Club team.</h3><p>For questions about information you provided, contact the club directly.</p><a href="mailto:contact@itclub.one">contact@itclub.one <span aria-hidden="true">↗</span></a></section></div></div></section>
    </SiteFrame>
  );
}
