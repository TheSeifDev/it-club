import Image from "next/image";
import { ArrowUpRight, BookOpen, Hammer, Users } from "lucide-react";
import styles from "./ClubPractice.module.css";

const PRACTICE_POINTS = [
  {
    icon: Users,
    eyebrow: "01 / learn together",
    title: "Learning together",
    body: "We trade context, ask better questions, and make room for different starting points.",
  },
  {
    icon: Hammer,
    eyebrow: "02 / build with care",
    title: "Building with care",
    body: "Ideas get clearer when they become small, testable things made by real people.",
  },
  {
    icon: BookOpen,
    eyebrow: "03 / practice often",
    title: "Craft through practice",
    body: "Regular experiments turn curiosity into a dependable craft, one session at a time.",
  },
] as const;

/** The public-facing explanation of how the club works day to day. */
export function ClubPractice() {
  return (
    <section
      className={styles.section}
      data-club-about
      aria-labelledby="about-title"
    >
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>
            <span>01</span>
            <i aria-hidden="true" />
            The club, in practice
          </p>
          <p className={styles.headerNote}>
            A working culture for curious people.
          </p>
        </div>

        <div className={styles.introGrid}>
          <div className={styles.headingBlock}>
            <h2 id="about-title" className={styles.heading}>
              <span className={styles.lineMask}>
                <span data-about-line>Learn by doing.</span>
              </span>
              <span className={styles.lineMask}>
                <span data-about-line className={styles.headingAccent}>
                  Build together.
                </span>
              </span>
            </h2>
          </div>

          <div className={styles.summaryBlock}>
            <p className={styles.summary}>
              IT Club is a place to move from interest to practice. We share
              what we know, build useful experiments, and give each other the
              time and feedback to get better.
            </p>
            <p className={styles.arabic} dir="rtl" lang="ar">
              نادي تكنولوجيا المعلومات مساحة نحول فيها الفضول إلى ممارسة. نتعلم
              معًا، نبني تجارب مفيدة، ونتبادل الوقت والملاحظات حتى نتطور خطوة
              بخطوة.
            </p>
            <a className={styles.textLink} href="#tracks">
              See the ways we work
              <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </a>
          </div>
        </div>

        <figure className={styles.art} data-about-art>
          <Image
            src="/manus-storage/async-images/sRVj1Lb2UBtRXgo0s9Dro9/image-1.webp"
            alt="Bright editorial electronics workbench with a laptop and hands-on components"
            width={1600}
            height={1200}
            unoptimized
            loading="lazy"
            data-about-art-img
            className={styles.artImage}
          />
          <figcaption className={styles.artCaption}>
            <span>Hands-on by default</span>
            <span aria-hidden="true">LEARN / BUILD / SHARE</span>
          </figcaption>
        </figure>

        <div className={styles.practiceRow} aria-label="How we practice">
          {PRACTICE_POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <article className={styles.practiceItem} key={point.title}>
                <div className={styles.practiceTopline}>
                  <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
                  <span>{point.eyebrow}</span>
                </div>
                <h3>{point.title}</h3>
                <p>{point.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
