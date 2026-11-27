import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Code2,
  Crown,
  FlaskConical,
  Lightbulb,
  Megaphone,
  Palette,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { CSSProperties } from "react";
import { getTrackTheme } from "@/lib/ui/track-theme";
import styles from "./CommunityPersonCard.module.css";

export type CommunityPerson = {
  slug: string;
  name: string;
  role: string;
  committee: string;
  summary: string;
};

type ThemeVars = CSSProperties & {
  "--track-color"?: string;
  "--track-rgb"?: string;
  "--track-ink"?: string;
};

function PersonRoleIcon({ person }: { person: CommunityPerson }) {
  const scope = `${person.role} ${person.committee} ${person.summary}`;
  const iconProps = {
    className: styles.roleIcon,
    size: 82,
    strokeWidth: 1.25,
    "aria-hidden": true as const,
  };

  if (/\b(president|vice president|chair|leadership|director)\b/i.test(scope)) {
    return <Crown {...iconProps} />;
  }
  if (/\b(research|r\s*&\s*d|innovation|laboratory)\b/i.test(scope)) {
    return <FlaskConical {...iconProps} />;
  }
  if (/\b(public relations|pr|communication|media|social|content|marketing)\b/i.test(scope)) {
    return <Megaphone {...iconProps} />;
  }
  if (/\b(event|operation|logistics|organizing)\b/i.test(scope)) {
    return <CalendarDays {...iconProps} />;
  }
  if (/\b(human resources|hr|people|talent|recruitment)\b/i.test(scope)) {
    return <UsersRound {...iconProps} />;
  }
  if (/\b(design|creative|visual|brand|art)\b/i.test(scope)) {
    return <Palette {...iconProps} />;
  }
  if (/\b(finance|business|partnership|sponsor|treasurer)\b/i.test(scope)) {
    return <BriefcaseBusiness {...iconProps} />;
  }
  if (/\b(education|learning|training)\b/i.test(scope)) {
    return <Lightbulb {...iconProps} />;
  }
  if (/\b(code|coding|developer|development|software|web|technical|it)\b/i.test(scope)) {
    return <Code2 {...iconProps} />;
  }
  return <UserRound {...iconProps} />;
}

export default function CommunityPersonCard({
  person,
  variant = "directory",
}: {
  person: CommunityPerson;
  variant?: "leadership" | "directory";
}) {
  const theme = getTrackTheme(person.committee);
  const style: ThemeVars = {
    "--track-color": theme.color,
    "--track-rgb": theme.rgb,
    "--track-ink": theme.ink,
  };
  const summary = person.summary.trim();
  const profileHref = `/community/${person.slug}`;

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
        href={profileHref}
        aria-label={`View ${person.name}'s profile`}
      >
        <span className={styles.portrait}>
          <PersonRoleIcon person={person} />
          <span className={styles.portraitMark} aria-hidden="true">
            <ArrowUpRight size={19} strokeWidth={1.7} />
          </span>
        </span>
      </Link>

      <div className={styles.body}>
        <p className={styles.eyebrow}>
          <span className={styles.swatch} aria-hidden="true" />
          <span>{person.committee || "IT Club"}</span>
          {theme.arabic ? (
            <span lang="ar" dir="rtl">
              · {theme.arabic}
            </span>
          ) : null}
        </p>
        <h2 className={styles.name}>
          <Link href={profileHref}>
            {person.name}
            <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.8} />
          </Link>
        </h2>
        {person.role ? <p className={styles.role}>{person.role}</p> : null}
        {summary ? (
          <div className={styles.focus}>
            <span className={styles.focusLabel}>Team focus</span>
            <p>{summary}</p>
          </div>
        ) : null}
        <Link className={styles.profileLink} href={profileHref}>
          View profile
          <span className={styles.profileArrow} aria-hidden="true">
            <ArrowUpRight size={15} strokeWidth={1.8} />
          </span>
        </Link>
      </div>
    </article>
  );
}
