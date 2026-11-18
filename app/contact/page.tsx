import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import ContactForm from "@/src/components/site/ContactForm";
import { PageIntro, SectionLabel, SiteFrame } from "@/src/components/site/SiteUI";
import { publicMetadata } from "@/src/components/site/content-utils";

export const metadata: Metadata = publicMetadata(
  "Contact IT Club",
  "Reach the IT Club at Borg Al Arab Technological University with a question, collaboration, or partnership proposal.",
  "/contact",
);

export default function ContactPage() {
  return (
    <SiteFrame>
      <PageIntro number="07" eyebrow="CONTACT / OPEN CHANNEL" title="Start a conversation." description="A question, an idea, a collaboration, or something you want to build together—tell us what is on your mind." arabic="لديك فكرة أو سؤال؟ يسعدنا أن نسمع منك." />
      <section className="site-contact-section">
        <div className="site-container site-contact-layout">
          <aside className="site-contact-aside"><SectionLabel number="01">LET’S TALK</SectionLabel><h2 className="site-display">Good ideas<br />start <em>somewhere.</em></h2><p>Send a note to the IT Club team. For a partnership, select that option and share the context that would help us understand your proposal.</p><a className="site-contact-email" href="mailto:contact@itclub.one">contact@itclub.one <ArrowUpRight size={16} aria-hidden="true" /></a><p className="site-arabic" lang="ar" dir="rtl">نقرأ رسالتك ونتواصل معك عبر البريد الإلكتروني الذي تتركه لنا.</p></aside>
          <div className="site-contact-form-wrap"><p className="site-eyebrow">02 / SEND A MESSAGE</p><ContactForm /></div>
        </div>
      </section>
    </SiteFrame>
  );
}
