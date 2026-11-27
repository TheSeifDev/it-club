import type { Metadata } from "next";
import { SiteFrame } from "@/src/components/site/SiteUI";
import RegisterFlow from "./RegisterFlow";
import styles from "./RegisterEditorial.module.css";

const pageDescription =
  "Tell us about yourself, your interests, and the IT Club track you would like to explore at Borg Al Arab Technological University.";

export const metadata: Metadata = {
  title: "Apply to IT Club",
  description: pageDescription,
  openGraph: {
    title: "Apply to IT Club",
    description: pageDescription,
    url: "/register",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apply to IT Club",
    description: pageDescription,
  },
};

export default function RegisterPage() {
  return (
    <SiteFrame>
      <div className={styles.page}>
        <section className={styles.intro} aria-labelledby="register-title">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionNumber}>05</span>
            <span className={styles.sectionName}>Application</span>
            <span className={styles.arabic} lang="ar" dir="rtl">
              استمارة التقديم
            </span>
          </div>

          <div className={styles.introGrid}>
            <h1 className={styles.title} id="register-title">
              There’s room for you to <em>grow.</em>
            </h1>
            <div className={styles.introCopy}>
              <p>
                Tell us what you are curious about and what you hope to learn.
                You do not need to be an expert to apply—bring your interest and
                your willingness to grow with the IT Club community.
              </p>
              <p className={styles.arabic} lang="ar" dir="rtl">
                مش لازم تكون خبير عشان تقدم. عرّفنا بنفسك وبالمجال اللي حابب
                تتعلمه وتساهم فيه مع نادي تكنولوجيا المعلومات.
              </p>
            </div>
          </div>

          <div className={styles.badges} aria-label="Application information">
            <span className={styles.badge}>Borg Al Arab Technological University</span>
            <span className={`${styles.badge} ${styles.badgeAccent}`}>
              Six specialized tracks
            </span>
          </div>
        </section>

        <section className={styles.formSection} aria-labelledby="application-heading">
          <div className={styles.formLead}>
            <p className={styles.formEyebrow}>A few thoughtful steps</p>
            <h2 id="application-heading">Your application</h2>
            <p>
              Share the details that help us understand you. Review your answers
              before submitting.
            </p>
          </div>
          <RegisterFlow />

          <div className={styles.privacyNote}>
            <span className={styles.privacyMark} aria-hidden="true" />
            <p>
              Application information is used for recruitment review and
              coordination by authorized IT Club management at Borg Al Arab
              Technological University.
            </p>
          </div>
        </section>
      </div>
    </SiteFrame>
  );
}
