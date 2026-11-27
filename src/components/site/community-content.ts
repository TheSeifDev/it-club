import { publicBoards, publicMembers } from "./content-utils.ts";
import type { ContentEntry } from "../../../lib/site-content/types.ts";

function normalizeLabel(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function isResearchAndDevelopment(value?: string): boolean {
  if (!value) return false;
  const normalized = normalizeLabel(value);
  const compact = normalized.replace(/\s+/g, "");
  return (
    /\bresearch(?:\s+and)?\s+development\b/.test(normalized) ||
    /\br\s*(?:and\s*)?d\b/.test(normalized) ||
    /\brnd\b/.test(normalized) ||
    /^(?:research(?:and)?development|r(?:and)?d|rnd)(?:committee|team|board|group|unit|division)?$/.test(compact) ||
    normalized.includes("البحث والتطوير")
  );
}

export function communityMembers(entries: ContentEntry[]): ContentEntry[] {
  return publicMembers(entries).filter(
    (entry) => !isResearchAndDevelopment(entry.data.committee),
  );
}

export function communityBoards(entries: ContentEntry[]): ContentEntry[] {
  return publicBoards(entries).filter(
    (entry) =>
      ![
        entry.slug,
        entry.data.title,
        entry.data.committee,
        entry.data.arabicTitle,
      ].some(isResearchAndDevelopment),
  );
}
