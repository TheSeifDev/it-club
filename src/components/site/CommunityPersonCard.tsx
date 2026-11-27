import Link from "next/link";
import type { CSSProperties } from "react";
import { getTrackTheme } from "@/lib/ui/track-theme";
import { initials } from "@/lib/ui/initials";

const styles = {
  card: "group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--site-glass-border,rgb(218_244_244_/_14%))] bg-[var(--site-glass,rgb(18_27_35_/_58%))] text-[var(--site-ink,#f1f6f5)] shadow-[inset_0_1px_0_var(--site-glass-highlight,rgb(245_255_255_/_11%))] transition-[transform,box-shadow] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] focus-within:-translate-y-[3px] hover:shadow-[0_16px_34px_-28px_rgba(var(--track-rgb,40,205,183),0.56)] focus-within:shadow-[0_16px_34px_-28px_rgba(var(--track-rgb,40,205,183),0.56)] motion-reduce:transition-none motion-reduce:transform-none",
  leadership: "",
  directory: "",
  portraitLink: "block min-w-0 rounded-[3px] text-inherit no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--site-sky-ink,#52e8d1)]",
  portrait: "relative grid aspect-[1.32/1] place-items-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_44%,rgba(var(--track-rgb,40,205,183),0.11),transparent_36%),var(--site-glass-soft,rgb(233_249_250_/_5%))] text-[var(--track-color,var(--site-sky-ink,#52e8d1))] transition-colors duration-220 [@media(max-width:620px)]:aspect-[1.35/1] motion-reduce:transition-none",
  monogram: "relative text-[clamp(3.6rem,7vw,6.2rem)] leading-none font-medium tracking-[-0.08em] text-[var(--site-ink,#f1f6f5)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1 group-hover:scale-[1.04] group-focus-within:-translate-y-1 group-focus-within:scale-[1.04] motion-reduce:transition-none motion-reduce:transform-none",
  ring: "absolute size-[62%] rounded-full shadow-[inset_0_0_0_1px_rgba(var(--track-rgb,40,205,183),0.22)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08] motion-reduce:transition-none motion-reduce:transform-none",
  code: "absolute top-4 left-4 text-[length:0.66rem] tracking-[0.18em] text-[var(--track-color,var(--site-sky-ink,#52e8d1))]",
  portraitMark: "absolute right-4 bottom-4 grid size-[38px] translate-y-1 place-items-center rounded-full bg-[var(--site-paper-dim,#0c1218)] text-[length:1rem] text-white opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transition-none motion-reduce:transform-none",
  body: "flex min-w-0 flex-1 flex-col items-start px-[2px] pt-[clamp(18px,2vw,26px)] pb-[2px] [@media(max-width:620px)]:pt-[17px]",
  eyebrow: "m-0 flex min-w-0 flex-wrap items-center gap-2 text-[length:0.76rem] leading-[1.5] font-medium text-[var(--track-color,var(--site-sky-ink,#52e8d1))]",
  swatch: "size-[9px] shrink-0 rounded-full bg-[var(--track-color,#28cdb7)]",
  name: "m-0 mt-[15px] mb-[6px] max-w-full [overflow-wrap:anywhere] text-[length:clamp(1.35rem,2.3vw,1.95rem)] leading-[1.08] font-medium tracking-[-0.05em] text-[var(--site-ink,#f1f6f5)]",
  nameLink: "group/name inline-flex items-baseline gap-[7px] text-inherit no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--site-sky-ink,#52e8d1)]",
  nameIcon: "shrink-0 translate-y-px text-[length:0.7em] text-[var(--track-color,var(--site-sky-ink,#52e8d1))] transition-transform duration-180 group-hover/name:translate-x-0.5 group-hover/name:-translate-y-0.5 group-focus-visible/name:translate-x-0.5 group-focus-visible/name:-translate-y-0.5 motion-reduce:transition-none motion-reduce:transform-none",
  role: "m-0 text-[length:0.88rem] leading-[1.55] font-medium text-[var(--site-copy,#a7b2b8)]",
  focus: "mt-4",
  focusLabel: "block text-[length:0.71rem] font-medium text-[var(--site-mist,#9aa8ae)]",
  focusText: "mt-[5px] mb-0 [overflow-wrap:anywhere] text-[length:0.84rem] leading-[1.7] text-[var(--site-copy,#a7b2b8)]",
  profileLink: "mt-auto inline-flex min-h-[38px] items-center gap-[9px] pt-[13px] text-[length:0.78rem] font-medium text-[var(--track-color,var(--site-sky-ink,#52e8d1))] no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--site-sky-ink,#52e8d1)]",
  profileArrow: "grid size-[26px] place-items-center rounded-full text-[length:0.8rem] bg-[var(--site-glass-soft,rgb(233_249_250_/_5%))] transition-[background-color,transform] duration-180 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 group-hover/link:bg-[rgba(var(--track-rgb,40,205,183),0.18)] group-focus-visible/link:translate-x-0.5 group-focus-visible/link:-translate-y-0.5 group-focus-visible/link:bg-[rgba(var(--track-rgb,40,205,183),0.18)] motion-reduce:transition-none motion-reduce:transform-none",
} as const;

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
          <span className={styles.ring} aria-hidden="true" />
          <span className={styles.code} aria-hidden="true">{theme.short}</span>
          <span className={styles.monogram} aria-hidden="true">{initials(person.name)}</span>
          <span className={styles.portraitMark} aria-hidden="true">↗</span>
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
          <Link className={styles.nameLink} href={profileHref}>
            {person.name}
            <span className={styles.nameIcon} aria-hidden="true">↗</span>
          </Link>
        </h2>
        {person.role ? <p className={styles.role}>{person.role}</p> : null}
        {summary ? (
          <div className={styles.focus}>
            <span className={styles.focusLabel}>Team focus</span>
            <p className={styles.focusText}>{summary}</p>
          </div>
        ) : null}
        <Link className={`${styles.profileLink} group/link`} href={profileHref}>
          View profile
          <span className={styles.profileArrow} aria-hidden="true">
            ↗
          </span>
        </Link>
      </div>
    </article>
  );
}
