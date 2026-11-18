import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { getTrackTheme } from "@/lib/ui/track-theme";
import styles from "./CommunityPersonCard.module.css";

export type CommunityPerson = {
  slug: string;
  name: string;
  role: string;
  committee: string;
  summary: string;
  image?: string;
};

type ThemeVars = CSSProperties & {
  "--track-color"?: string;
  "--track-rgb"?: string;
  "--track-ink"?: string;
};

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1)
    return Array.from(words[0]).slice(0, 2).join("").toUpperCase();
  return words
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? "")
    .join("")
    .toUpperCase();
}

export default function CommunityPersonCard({
  person,
  variant = "directory",
  priority = false,
}: {
  person: CommunityPerson;
  variant?: "leadership" | "directory";
  priority?: boolean;
}) {
  const theme = getTrackTheme(person.committee);
  const style: ThemeVars = {
    "--track-color": theme.color,
    "--track-rgb": theme.rgb,
    "--track-ink": theme.ink,
  };
  const summary = person.summary.trim();

  return (
    <article
      className={`${styles.card} ${styles[variant]}`}
      data-community-card
      data-spotlight
      data-reveal
      style={style}
    >
      <Link
        className={styles.portraitLink}
        href={`/community/${person.slug}`}
        aria-label={`View ${person.name}'s profile`}
      >
        <span className={styles.portrait}>
          {person.image ? (
            <Image
              className={styles.image}
              src={person.image}
              alt={person.name}
              width={420}
              height={540}
              sizes={
                variant === "leadership"
                  ? "(min-width: 1200px) 31vw, (min-width: 640px) 47vw, 92vw"
                  : "(min-width: 1280px) 24vw, (min-width: 760px) 46vw, 92vw"
              }
              unoptimized
              priority={priority}
            />
          ) : (
            <span className={styles.fallback} aria-hidden="true">
              {initials(person.name)}
            </span>
          )}
          <span className={styles.portraitMark} aria-hidden="true">
            ↗
          </span>
        </span>
      </Link>

      <div className={styles.body}>
        <p className={styles.eyebrow}>
          <span className={styles.swatch} aria-hidden="true" />
          <span>{person.committee || "IT CLUB"}</span>
          {theme.arabic ? (
            <span lang="ar" dir="rtl">
              · {theme.arabic}
            </span>
          ) : null}
        </p>
        <h2 className={styles.name}>
          <Link href={`/community/${person.slug}`}>
            {person.name}
            <span aria-hidden="true">↗</span>
          </Link>
        </h2>
        {person.role ? <p className={styles.role}>{person.role}</p> : null}
        {summary ? (
          <div className={styles.focus}>
            <span className={styles.focusLabel}>TEAM FOCUS</span>
            <p>{summary}</p>
          </div>
        ) : null}
        <Link className={styles.profileLink} href={`/community/${person.slug}`}>
          VIEW PROFILE <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  );
}
