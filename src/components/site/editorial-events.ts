import type { ContentEntry } from "../../../lib/site-content/types.ts";
import { formatEventDate, publicEventTimeline, safeHref, safeImage, validSlug } from "./content-utils.ts";
import type { EditorialEvent } from "./editorial-types.ts";

export type EditorialEventMode = "upcoming" | "archive" | "undated";

function hasUsableDate(value?: string): boolean {
  const raw = value?.trim();
  if (!raw || !Number.isFinite(Date.parse(raw))) return false;
  const isoCalendarDay = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/.exec(raw);
  if (isoCalendarDay) {
    const year = Number(isoCalendarDay[1]);
    const month = Number(isoCalendarDay[2]);
    const day = Number(isoCalendarDay[3]);
    const candidate = new Date(0);
    candidate.setUTCHours(0, 0, 0, 0);
    candidate.setUTCFullYear(year, month - 1, day);
    return candidate.getUTCFullYear() === year && candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day;
  }
  return Number.isFinite(Date.parse(raw));
}

/** Only real, usable dates receive a calendar badge; timestamps follow Cairo time. */
function dateFields(value?: string): Pick<EditorialEvent, "date" | "dateTime" | "day" | "month" | "year"> {
  const raw = value?.trim();
  if (!raw || !hasUsableDate(raw)) return { date: "Date not listed" };
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const date = new Date(dateOnly ? `${raw}T12:00:00Z` : raw);
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric", timeZone: dateOnly ? "UTC" : "Africa/Cairo",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return {
    date: formatEventDate(raw),
    dateTime: dateOnly ? raw : date.toISOString(),
    day: part("day"), month: part("month"), year: part("year"),
  };
}

export function editorialEvents(entries: ContentEntry[], now = Date.now()): {
  events: EditorialEvent[];
  eventMode: EditorialEventMode;
} {
  const candidates = entries.filter((entry) => validSlug(entry.slug) && entry.data.title.trim());
  const timelineEntries = candidates.map((entry) => hasUsableDate(entry.data.date) ? entry : {
    ...entry,
    data: { ...entry.data, date: undefined },
  });
  const timeline = publicEventTimeline(timelineEntries, now);
  const eventMode = timeline.upcoming.length ? "upcoming" : timeline.archive.length ? "archive" : "undated";
  const selected = timeline[eventMode].slice(0, 4);
  return {
    eventMode,
    events: selected.map((event) => ({
      id: event.id,
      slug: event.slug,
      title: event.data.title,
      ...dateFields(event.data.date),
      summary: event.data.summary?.trim() || undefined,
      time: event.data.time?.trim() || undefined,
      location: event.data.location?.trim() || undefined,
      category: event.data.category?.trim() || undefined,
      image: safeImage(event.data.image),
      href: safeHref(event.data.href),
    })),
  };
}
