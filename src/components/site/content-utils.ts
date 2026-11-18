import { cache } from "react";
import type { Metadata } from "next";
import { getPublicSiteContent } from "../../../lib/site-content/public.ts";
import type { ContentEntry } from "../../../lib/site-content/types.ts";

export const SITE_ORIGIN = "https://dev.itclub.one";

export const readPublicSiteContent = cache(getPublicSiteContent);

export function publicMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    openGraph: {
      title: `${title} — IT Club | BATU`,
      description,
      url: path,
      siteName: "IT Club",
      locale: "en_US",
      type: "website",
    },
  };
}

export function isPublishedNow(entry: ContentEntry, now = Date.now()): boolean {
  if (entry.status !== "published") return false;
  if (entry.publish_at) {
    const publishTime = new Date(entry.publish_at).getTime();
    if (!Number.isFinite(publishTime) || publishTime > now) return false;
  }
  if (entry.unpublish_at) {
    const unpublishTime = new Date(entry.unpublish_at).getTime();
    if (!Number.isFinite(unpublishTime) || unpublishTime <= now) return false;
  }
  return true;
}

export function publishedEntries(entries: ContentEntry[]): ContentEntry[] {
  const now = Date.now();
  return entries.filter((entry) => isPublishedNow(entry, now)).sort((a, b) => a.sort_order - b.sort_order);
}

export function publicMembers(entries: ContentEntry[]): ContentEntry[] {
  return publishedEntries(entries).filter((entry) => {
    if (entry.kind !== "member" || entry.data.alumni) return false;
    const role = entry.data.role?.trim();
    const committee = entry.data.committee?.trim();
    const hasScope = Boolean(
      entry.data.responsibilities?.some((item) => item.trim()) ||
        entry.data.summary?.trim() ||
        entry.data.body?.trim(),
    );
    const unresolved = [role, committee].some((value) =>
      /unresolved|pending|unknown|unassigned|none/i.test(value ?? ""),
    );
    const excludedPrHead =
      /^head(?:\s+of\s+|\s+)?(?:pr|public relations)?$/i.test(role ?? "") &&
      /public relations/i.test(committee ?? "");
    return Boolean(entry.slug && entry.data.title.trim() && role && committee && hasScope && !unresolved && !excludedPrHead);
  });
}

export function publicAlumni(entries: ContentEntry[]): ContentEntry[] {
  return publishedEntries(entries).filter((entry) => {
    if (entry.kind !== "member" || !entry.data.alumni) return false;
    const hasScope = Boolean(
      entry.data.responsibilities?.some((item) => item.trim()) ||
        entry.data.summary?.trim() ||
        entry.data.body?.trim(),
    );
    return Boolean(entry.slug && entry.data.title.trim() && entry.data.role?.trim() && hasScope);
  });
}

export function publicBoards(entries: ContentEntry[]): ContentEntry[] {
  return publishedEntries(entries).filter((entry) => entry.kind === "board");
}

export function publicTracks(entries: ContentEntry[]): ContentEntry[] {
  return publishedEntries(entries).filter((entry) => entry.kind === "track");
}

export function publicPages(entries: ContentEntry[]): ContentEntry[] {
  return publishedEntries(entries).filter((entry) => entry.kind === "page");
}

export function publicEvents(entries: ContentEntry[]): ContentEntry[] {
  return publishedEntries(entries).filter((entry) => entry.kind === "event");
}

function cairoDateKey(timestamp: number): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function formatEventDate(value?: string): string {
  if (!value?.trim()) return "DATE NOT LISTED";
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  const timestamp = dateOnly
    ? Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 12)
    : Date.parse(value);
  if (!Number.isFinite(timestamp)) return value.trim();
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: dateOnly ? "UTC" : "Africa/Cairo",
  }).format(timestamp);
}

export function publicEventTimeline(entries: ContentEntry[], now = Date.now()): {
  upcoming: ContentEntry[];
  archive: ContentEntry[];
  undated: ContentEntry[];
} {
  const events = publicEvents(entries);
  const isDateOnly = (entry: ContentEntry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.data.date?.trim() ?? "");
  const timestamp = (entry: ContentEntry) => entry.data.date ? Date.parse(entry.data.date) : Number.NaN;
  const undated = events.filter((entry) => !entry.data.date || !Number.isFinite(timestamp(entry)));
  const dated = events.filter((entry) => entry.data.date && Number.isFinite(timestamp(entry)));
  const upcoming = dated.filter((entry) => isDateOnly(entry)
    ? entry.data.date!.trim() >= cairoDateKey(now)
    : timestamp(entry) >= now);
  const archive = dated.filter((entry) => !upcoming.includes(entry));
  return {
    upcoming: upcoming.sort((a, b) => timestamp(a) - timestamp(b)),
    archive: archive.sort((a, b) => timestamp(b) - timestamp(a)),
    undated,
  };
}

export function publicSponsors(entries: ContentEntry[]): ContentEntry[] {
  return publishedEntries(entries).filter((entry) => entry.kind === "sponsor");
}

export function activeAnnouncements(entries: ContentEntry[], now = Date.now()): ContentEntry[] {
  return publishedEntries(entries).filter((entry) => {
    return (
      entry.kind === "announcement" &&
      (!entry.publish_at || new Date(entry.publish_at).getTime() <= now) &&
      (!entry.unpublish_at || new Date(entry.unpublish_at).getTime() > now)
    );
  });
}

export function safeHref(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("//") || /[\u0000-\u001f]/.test(trimmed)) return undefined;
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "mailto:" ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

export function safeImage(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

export function validSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function lookupBySlug(entries: ContentEntry[], slug: string): ContentEntry | undefined {
  if (!validSlug(slug)) return undefined;
  return publishedEntries(entries).find((entry) => entry.slug === slug);
}

export function displayResponsibilities(entry: ContentEntry): string[] {
  const values = entry.data.responsibilities?.map((item) => item.trim()).filter(Boolean) ?? [];
  if (values.length) return values;
  const fallback = entry.data.summary?.trim() || entry.data.body?.trim();
  return fallback ? [fallback] : [];
}
