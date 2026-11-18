import { CONTENT_KINDS, type ContentData, type ContentKind } from "./types.ts";

const DATA_KEYS = new Set([
  "title", "subtitle", "summary", "body", "arabicTitle", "image", "href", "committee", "role", "date", "time", "location", "email", "category", "responsibilities", "tags", "links", "alumni",
]);
const STRING_LIMITS: Partial<Record<keyof ContentData, number>> = {
  title: 200, subtitle: 300, summary: 2_000, body: 50_000, arabicTitle: 200, image: 2_048, href: 2_048, committee: 160, role: 160, date: 100, time: 60, location: 240, email: 254, category: 160,
};
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

export function isContentKind(value: unknown): value is ContentKind {
  return typeof value === "string" && CONTENT_KINDS.includes(value as ContentKind);
}

export function isValidSlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function isValidTimestamp(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && ISO_DATE_TIME.test(value) && Number.isFinite(Date.parse(value)));
}

export function isSafeContentUrl(value: string, kind: "image" | "href" | "link" = "href"): boolean {
  if (value.length === 0 || value.length > 2_048 || /[\u0000-\u001f\u007f\\]/.test(value) || value.trim() !== value) return false;
  if (value.startsWith("/")) {
    if (value.startsWith("//")) return false;
    try {
      const parsed = new URL(value, "https://site-content.invalid");
      return parsed.origin === "https://site-content.invalid" && !parsed.pathname.split("/").includes("..");
    } catch {
      return false;
    }
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return false;
    return kind !== "image" || Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validateStringArray(value: unknown, name: string, maxItems: number, maxLength: number, errors: string[]): void {
  if (!Array.isArray(value) || value.length > maxItems) {
    errors.push(`${name} must be an array of at most ${maxItems} items.`);
    return;
  }
  value.forEach((item, index) => {
    if (typeof item !== "string" || item.trim().length === 0 || item.length > maxLength) errors.push(`${name}[${index}] must be a non-empty string of at most ${maxLength} characters.`);
  });
}

export function validateContentData(kind: ContentKind, value: unknown): string[] {
  const errors: string[] = [];
  if (!isPlainRecord(value)) return ["data must be a JSON object."];
  for (const key of Object.keys(value)) if (!DATA_KEYS.has(key)) errors.push(`data.${key} is not supported.`);
  if (typeof value.title !== "string" || !value.title.trim() || value.title.length > 200) errors.push("data.title is required and must be at most 200 characters.");
  for (const [key, limit] of Object.entries(STRING_LIMITS)) {
    if (!(key in value) || key === "title") continue;
    const fieldValue = value[key];
    if (typeof fieldValue !== "string" || fieldValue.length > limit || fieldValue.includes("\u0000")) {
      errors.push(`data.${key} must be a string of at most ${limit} characters.`);
      continue;
    }
    if ((key === "href" || key === "image") && !isSafeContentUrl(fieldValue, key)) errors.push(`data.${key} must be a safe HTTPS URL or same-site path.`);
  }
  if ("responsibilities" in value) validateStringArray(value.responsibilities, "data.responsibilities", 30, 500, errors);
  if ("tags" in value) validateStringArray(value.tags, "data.tags", 30, 80, errors);
  if ("links" in value) {
    if (!Array.isArray(value.links) || value.links.length > 20) errors.push("data.links must be an array of at most 20 items.");
    else value.links.forEach((link, index) => {
      if (!isPlainRecord(link) || Object.keys(link).some((key) => !["label", "href"].includes(key))) {
        errors.push(`data.links[${index}] must contain only label and href.`);
        return;
      }
      if (typeof link.label !== "string" || !link.label.trim() || link.label.length > 100) errors.push(`data.links[${index}].label must be a non-empty string of at most 100 characters.`);
      if (typeof link.href !== "string" || !isSafeContentUrl(link.href, "link")) errors.push(`data.links[${index}].href must be a safe HTTPS URL or same-site path.`);
    });
  }
  if ("alumni" in value && typeof value.alumni !== "boolean") errors.push("data.alumni must be a boolean.");
  if ("email" in value && typeof value.email === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) errors.push("data.email must be a valid email address.");
  try {
    if (new TextEncoder().encode(JSON.stringify(value)).byteLength > 100_000) errors.push("data exceeds the 100 KiB JSON limit.");
  } catch {
    errors.push("data must be JSON-serializable.");
  }
  return errors;
}

export function validatePublishReadiness(kind: ContentKind, data: ContentData): string[] {
  const errors = validateContentData(kind, data);
  if (errors.length) return errors;
  const required = (field: keyof ContentData, label: string) => {
    const value = data[field];
    if (typeof value !== "string" || !value.trim()) errors.push(`${label} is required before publishing.`);
  };
  switch (kind) {
    case "member":
      required("role", "A confirmed member role");
      required("committee", "A confirmed committee");
      if (!data.responsibilities?.some((item) => item.trim() && !/^committee mission\b/i.test(item.trim()))) {
        errors.push("At least one actual individual responsibility is required before publishing a member; committee mission text alone does not qualify.");
      }
      break;
    case "board":
      required("committee", "A committee name");
      required("summary", "A committee mission");
      break;
    case "track":
      required("summary", "A track mission");
      break;
    case "event": {
      required("summary", "An event description");
      required("location", "An event location");
      const eventDate = data.date;
      if (typeof eventDate !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(eventDate) || !Number.isFinite(Date.parse(eventDate))) {
        errors.push("An event needs a confirmed ISO date; seasonal or ambiguous dates cannot be published.");
      }
      break;
    }
    case "sponsor":
      required("category", "A sponsor category");
      required("image", "An approved sponsor logo");
      break;
    case "announcement":
      if (!data.summary?.trim() && !data.body?.trim()) errors.push("An announcement needs a summary or body before publishing.");
      break;
    case "page":
      if (!data.summary?.trim() && !data.body?.trim()) errors.push("A page needs a summary or body before publishing.");
      break;
  }
  return errors;
}

export function validatePublicationWindow(publishAt: unknown, unpublishAt: unknown): string[] {
  const errors: string[] = [];
  if (!isValidTimestamp(publishAt)) errors.push("publish_at must be an ISO timestamp with an explicit timezone or null.");
  if (!isValidTimestamp(unpublishAt)) errors.push("unpublish_at must be an ISO timestamp with an explicit timezone or null.");
  if (typeof publishAt === "string" && typeof unpublishAt === "string" && Date.parse(unpublishAt) <= Date.parse(publishAt)) errors.push("unpublish_at must be later than publish_at.");
  return errors;
}
