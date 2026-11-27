import { ArrowUpRight, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import ContactForm from "@/src/components/site/ContactForm";
import { SiteFrame } from "@/src/components/site/SiteUI";
import { publicMetadata } from "@/src/components/site/content-utils";
import styles from "@/src/components/site/ContactEditorial.module.css";

export const metadata: Metadata = publicMetadata(
  "Contact IT Club",
  "Reach the IT Club at Borg Al Arab Technological University with a question, collaboration, or partnership proposal.",
  "/contact",
);

export default function ContactPage() {
  return (
    <SiteFrame>
      <div className={styles.page}>
        <section className={styles.intro} aria-labelledby="contact-title">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionNumber}>07</span>
            <span className={styles.sectionName}>Contact</span>
          </div>
          <div className={styles.introGrid}>
            <h1 className={styles.title} id="contact-title">
              Start a conversation.
            </h1>
            <div className={styles.introCopy}>
              <p>
                A question, an idea, a collaboration, or something you want to
                build together—tell us what is on your mind.
              </p>
              <p className={styles.arabic} lang="ar" dir="rtl">
                لديك فكرة أو سؤال؟ يسعدنا أن نسمع منك.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.contactSection} aria-label="Get in touch">
          <div className={styles.contactLayout}>
            <aside className={styles.details} aria-labelledby="details-title">
              <div className={styles.sectionLabel}>
                <span className={styles.sectionNumber}>01</span>
                <span className={styles.sectionName}>Let’s talk</span>
              </div>
              <div className={styles.iconTile} aria-hidden="true">
                <MessageCircle size={34} strokeWidth={1.5} />
              </div>
              <h2 className={styles.detailsTitle} id="details-title">
                Good ideas
                <br />
                start <em>somewhere.</em>
              </h2>
              <p className={styles.detailsCopy}>
                Send a note to the IT Club team. For a partnership, select that
                option and share the context that would help us understand your
                proposal.
              </p>
              <a className={styles.emailLink} href="mailto:contact@itclub.one">
                <span>contact@itclub.one</span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
              <p className={styles.arabicNote} lang="ar" dir="rtl">
                نقرأ رسالتك ونتواصل معك عبر البريد الإلكتروني الذي تتركه لنا.
              </p>
            </aside>

            <div className={styles.formColumn}>
              <div className={styles.sectionLabel}>
                <span className={styles.sectionNumber}>02</span>
                <span className={styles.sectionName}>Send a message</span>
              </div>
              <p className={styles.formIntro}>
                Share a little context and we’ll take it from there.
              </p>
              <ContactForm />
            </div>
          </div>
        </section>
      </div>
    </SiteFrame>
  );
}
