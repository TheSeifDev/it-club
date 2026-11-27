import { createHash } from "node:crypto";
import { teamMembers, unverifiedLeadershipPositions } from "../../src/components/interview/committee-data.ts";
import { IT_CLUB_TRACKS } from "../../src/components/interview/Tracks/tracks-data.ts";
import { sponsors } from "../../src/data/sponsors.ts";
import { IT_CLUB_EVENTS } from "../../src/data/events.ts";
import type { ContentEntry, ContentKind, ContentStatus, PublicSiteContent } from "./types.ts";

export interface SiteContentSeed extends ContentEntry {
  seed_key: string;
}

function seedUuid(seedKey: string): string {
  const bytes = createHash("sha256").update(`itclub-site-content:${seedKey}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function entry(
  kind: ContentKind,
  slug: string,
  data: ContentEntry["data"],
  options: { sort_order?: number; featured?: boolean; status?: ContentStatus } = {}
): SiteContentSeed {
  const seedKey = `${kind}:${slug}`;
  return {
    id: seedUuid(seedKey),
    kind,
    slug,
    status: options.status ?? "published",
    sort_order: options.sort_order ?? 0,
    featured: options.featured ?? false,
    publish_at: null,
    unpublish_at: null,
    revision: 1,
    data,
    seed_key: seedKey,
  };
}

const trackByCommittee = new Map(IT_CLUB_TRACKS.map((track) => [track.title.toLowerCase(), track]));
const clubMission = "A student technology community at BATU where members learn and turn ideas into collaborative work.";

const memberSeeds = teamMembers
  .filter((member) => !member.isAlternate && !member.needsReview)
  .map((member) => {
    const track = trackByCommittee.get(member.committee.trim().toLowerCase());
    const committeeMission = track?.description ?? clubMission;
    const role = member.role.trim();
    const links = [
      member.linkedin ? { label: "LinkedIn", href: member.linkedin } : null,
      member.github ? { label: "GitHub", href: member.github } : null,
      member.portfolio ? { label: "Portfolio", href: member.portfolio } : null,
    ].filter((link): link is { label: string; href: string } => link !== null);
    return entry(
      "member",
      member.id,
      {
        title: member.name,
        subtitle: role,
        role,
        committee: member.committee,
        summary: `Committee mission: ${committeeMission}`,
        image: member.image,
        links,
        ...(member.isAlumni ? { alumni: true } : {}),
      },
      {
        sort_order: member.order,
        // Imported member records stay private until the owner supplies an
        // actual individual responsibility, rather than promoting a shared remit.
        status: "draft",
      }
    );
  });

const boardSeeds = IT_CLUB_TRACKS.map((track, index) =>
  entry(
    "board",
    track.id,
    {
      title: track.title,
      arabicTitle: track.arabicTitle,
      committee: track.title,
      category: "Committee",
      summary: `Committee mission: ${track.description}`,
      responsibilities: track.terrain.map((item) => `${item.title}: ${item.desc}`),
    },
    { sort_order: index + 1 }
  )
);

const trackSeeds = IT_CLUB_TRACKS.map((track, index) =>
  entry(
    "track",
    track.id,
    {
      title: track.title,
      arabicTitle: track.arabicTitle,
      summary: track.description,
      category: track.tag,
      tags: [track.tag],
    },
    { sort_order: index + 1 }
  )
);

const sponsorSeeds = sponsors.map((sponsor) =>
  entry(
    "sponsor",
    sponsor.id,
    {
      title: sponsor.name,
      summary: sponsor.description,
      image: sponsor.logo,
      href: sponsor.website,
      category: sponsor.tierLabel ?? sponsor.category,
    },
    { sort_order: sponsor.order, featured: Boolean(sponsor.featured) }
  )
);

// Existing events contain seasonal, future, or otherwise unverified claims. They are review material only.
const eventSeeds = IT_CLUB_EVENTS.map((event, index) =>
  entry(
    "event",
    event.id,
    {
      title: event.title,
      arabicTitle: event.arabicTitle,
      summary: event.shortDescription,
      body: event.fullDescription,
      date: event.date,
      location: event.location,
      category: event.categoryLabel,
      href: event.externalLink,
      tags: event.tags,
    },
    { sort_order: index + 1, featured: Boolean(event.featured), status: "draft" }
  )
);

/**
 * Canonical seed records are stable and imported only after an explicit owner action.
 * Member remit is deliberately labeled as shared committee mission, never personalized
 * achievement/task. Owner publication validation still requires an actual individual task.
 */
export const SITE_CONTENT_SEED: readonly SiteContentSeed[] = [
  ...boardSeeds,
  ...trackSeeds,
  ...memberSeeds,
  ...sponsorSeeds,
  ...eventSeeds,
];

// The source-only Preview fallback never promotes member rows: every seeded
// member remains draft until an owner supplies and publishes an approved,
// individual responsibility through the normal publication workflow.
const previewMemberSeeds: readonly SiteContentSeed[] = [];

export const UNRESOLVED_SEED_NOTES = unverifiedLeadershipPositions.map((position) => ({
  role: position.role,
  committee: position.committee,
  status: position.status,
  notes: position.notes,
}));

export function emptyPublicSiteContent(): PublicSiteContent {
  return { members: [], boards: [], tracks: [], events: [], sponsors: [], announcements: [], pages: [] };
}

export function isVisibleAt(entryValue: ContentEntry, now: number = Date.now()): boolean {
  const startsAt = entryValue.publish_at ? Date.parse(entryValue.publish_at) : Number.NEGATIVE_INFINITY;
  const endsAt = entryValue.unpublish_at ? Date.parse(entryValue.unpublish_at) : Number.POSITIVE_INFINITY;
  return entryValue.status === "published" && now >= startsAt && now < endsAt;
}

function toContentEntry(seed: SiteContentSeed): ContentEntry {
  return {
    id: seed.id,
    kind: seed.kind,
    slug: seed.slug,
    status: seed.status,
    sort_order: seed.sort_order,
    featured: seed.featured,
    publish_at: seed.publish_at,
    unpublish_at: seed.unpublish_at,
    revision: seed.revision,
    data: seed.data,
  };
}

export function getCommittedPublicSeed(now: number = Date.now()): PublicSiteContent {
  const result = emptyPublicSiteContent();
  const fallback = [...SITE_CONTENT_SEED.filter((seed) => seed.kind !== "member"), ...previewMemberSeeds];
  for (const seed of fallback) {
    if (!isVisibleAt(seed, now)) continue;
    const key = seed.kind === "member" ? "members"
      : seed.kind === "board" ? "boards"
      : seed.kind === "track" ? "tracks"
      : seed.kind === "event" ? "events"
      : seed.kind === "sponsor" ? "sponsors"
      : seed.kind === "announcement" ? "announcements"
      : "pages";
    result[key].push(toContentEntry(seed));
  }
  for (const key of Object.keys(result) as (keyof PublicSiteContent)[]) {
    result[key].sort((left, right) => left.sort_order - right.sort_order || left.slug.localeCompare(right.slug));
  }
  return result;
}

export function getOwnerSeed(kind?: ContentKind): ContentEntry[] {
  return SITE_CONTENT_SEED
    .filter((seed) => !kind || seed.kind === kind)
    .map(toContentEntry)
    .sort((left, right) => left.kind.localeCompare(right.kind) || left.sort_order - right.sort_order);
}
