import "./public-design.css";
import "./public-hover.css";
import "./public-layout.css";
import "./public-editorial.css";
import { Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import SiteFooter from "@/src/components/site/SiteFooter";
import SiteHeader from "@/src/components/site/SiteHeader";
import SiteMotion from "@/src/components/site/SiteMotion";
import type { ContentEntry } from "@/lib/site-content/types";
import {
  displayResponsibilities,
  safeHref,
} from "@/src/components/site/content-utils";

export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="site-root" data-design="club" id="top">
      <a className="site-skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteMotion>
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </SiteMotion>
    </div>
  );
}

export function SectionLabel({
  number,
  children,
  tone = "light",
  className = "",
}: {
  number?: string;
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div
      className={`site-section-label site-section-label--${tone} ${className}`.trim()}
    >
      <span>{number ?? ""}</span>
      <span>{children}</span>
    </div>
  );
}

export function PageIntro({
  number,
  eyebrow,
  title,
  description,
  arabic,
  tone = "dark",
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  arabic?: string;
  tone?: "dark" | "paper";
}) {
  return (
    <section className={`site-page-intro site-page-intro--${tone}`}>
      <div className="site-container">
        <SectionLabel
          number={number}
          tone={tone === "paper" ? "dark" : "light"}
        >
          {eyebrow}
        </SectionLabel>
        <div className="site-page-intro__body" data-reveal>
          <div>
            <h1 className="site-display site-page-title" data-line-heading>
              {title}
            </h1>
            {arabic ? (
              <p className="site-intro-arabic" lang="ar" dir="rtl">
                {arabic}
              </p>
            ) : null}
          </div>
          <div className="site-page-intro__copy">
            <p>{description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  note,
}: {
  eyebrow: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="site-section-heading" data-reveal>
      <p className="site-eyebrow">{eyebrow}</p>
      <h2 className="site-display" data-line-heading>
        {title}
      </h2>
      {note ? <p className="site-section-heading__note">{note}</p> : null}
    </div>
  );
}

export function EmptyState({
  label = "NO PUBLISHED ITEMS",
  title,
  text,
  href,
  linkLabel,
}: {
  label?: string;
  title: string;
  text: string;
  href?: string;
  linkLabel?: string;
}) {
  const destination = safeHref(href);
  return (
    <div className="site-empty-state" data-reveal>
      <span className="site-empty-state__index" aria-hidden="true">
        —
      </span>
      <div>
        <p className="site-eyebrow">{label}</p>
        <h2>{title}</h2>
        <p>{text}</p>
        {destination && linkLabel ? (
          <Link className="site-text-link" href={destination}>
            {linkLabel}
            <span aria-hidden="true">↗</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function SiteUnavailable() {
  return (
    <section
      className="site-data-unavailable site-container"
      aria-labelledby="site-data-unavailable-title"
    >
      <SectionLabel number="00">PUBLISHED INFORMATION</SectionLabel>
      <h1
        className="site-display"
        id="site-data-unavailable-title"
        data-line-heading
      >
        This page is taking a pause.
      </h1>
      <p>
        The published site information could not be loaded just now. Please try
        again later, or contact the team. No draft or archived content has been
        substituted.
      </p>
      <Link className="site-button site-button--sky" href="/contact">
        CONTACT THE TEAM <span aria-hidden="true">↗</span>
      </Link>
    </section>
  );
}

export function EntryRow({
  entry,
  index,
  href,
  kind,
}: {
  entry: ContentEntry;
  index: number;
  href: string;
  kind: string;
}) {
  const description = entry.data.summary?.trim() || entry.data.body?.trim();
  const link = safeHref(href) ?? "/";
  return (
    <article className="site-entry-row" data-reveal data-spotlight>
      <span className="site-entry-row__number">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="site-entry-row__main">
        <p className="site-eyebrow">
          {kind}
          {entry.data.category ? ` / ${entry.data.category}` : ""}
        </p>
        <h3>
          <Link href={link}>
            {entry.data.title}
            <span aria-hidden="true">↗</span>
          </Link>
        </h3>
        {description ? (
          <p className="site-entry-row__summary">{description}</p>
        ) : null}
      </div>
      <div className="site-entry-row__meta">
        {entry.data.role ? <span>{entry.data.role}</span> : null}
        {entry.data.committee ? <span>{entry.data.committee}</span> : null}
      </div>
    </article>
  );
}

export function Portrait({
  entry,
}: {
  entry: ContentEntry;
  cutout?: boolean;
  priority?: boolean;
}) {
  return (
    <span className="site-icon-portrait" role="img" aria-label={`${entry.data.title} — community profile`}>
      <Users aria-hidden="true" />
    </span>
  );
}

export function ProfileDetail({ entry }: { entry: ContentEntry }) {
  const responsibilities = displayResponsibilities(entry);
  const links = entry.data.links
    ?.map((item) => ({ ...item, href: safeHref(item.href) }))
    .filter((item): item is { label: string; href: string } =>
      Boolean(item.href),
    );
  return (
    <article className="site-detail-layout">
      <div className="site-detail-layout__copy">
        <SectionLabel number="01">
          PROFILE / {entry.data.committee ?? "COMMUNITY"}
        </SectionLabel>
        <h1 className="site-display site-detail-title" data-line-heading>
          {entry.data.title}
        </h1>
        <p className="site-detail-role">
          {[entry.data.role, entry.data.committee].filter(Boolean).join(" · ")}
        </p>
        {entry.data.summary ? (
          <p className="site-detail-lede">{entry.data.summary}</p>
        ) : null}
        {entry.data.body ? (
          <p className="site-detail-body">{entry.data.body}</p>
        ) : null}
        {responsibilities.length ? (
          <div className="site-detail-responsibilities">
            <p className="site-eyebrow">PUBLISHED TEAM SCOPE</p>
            <ul>
              {responsibilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {links?.length ? (
          <nav
            className="site-detail-links"
            aria-label={`${entry.data.title} links`}
          >
            {links.map((item) => (
              <a key={`${item.label}-${item.href}`} href={item.href}>
                {item.label}
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </nav>
        ) : null}
      </div>
        <figure className="site-detail-portrait" data-spotlight>
          <div className="site-profile-symbol" aria-hidden="true"><Users /></div>
          <figcaption>{entry.data.role ?? "IT Club community"}</figcaption>
        </figure>
    </article>
  );
}
