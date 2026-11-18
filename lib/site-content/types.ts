export type ContentKind =
  | "member"
  | "board"
  | "track"
  | "event"
  | "sponsor"
  | "announcement"
  | "page";

export type ContentStatus = "draft" | "published" | "archived";

export interface ContentData {
  title: string;
  subtitle?: string;
  summary?: string;
  body?: string;
  arabicTitle?: string;
  image?: string;
  href?: string;
  committee?: string;
  role?: string;
  date?: string;
  time?: string;
  location?: string;
  email?: string;
  category?: string;
  responsibilities?: string[];
  tags?: string[];
  links?: { label: string; href: string }[];
  alumni?: boolean;
}

export interface ContentEntry {
  id: string;
  kind: ContentKind;
  slug: string;
  status: ContentStatus;
  sort_order: number;
  featured: boolean;
  publish_at: string | null;
  unpublish_at: string | null;
  revision: number;
  data: ContentData;
  created_at?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
  published_revision?: number | null;
  has_unpublished_changes?: boolean;
}

export interface PublicSiteContent {
  members: ContentEntry[];
  boards: ContentEntry[];
  tracks: ContentEntry[];
  events: ContentEntry[];
  sponsors: ContentEntry[];
  announcements: ContentEntry[];
  pages: ContentEntry[];
}

export const CONTENT_KINDS: readonly ContentKind[] = [
  "member",
  "board",
  "track",
  "event",
  "sponsor",
  "announcement",
  "page",
] as const;

export const PUBLIC_CONTENT_KEYS = {
  member: "members",
  board: "boards",
  track: "tracks",
  event: "events",
  sponsor: "sponsors",
  announcement: "announcements",
  page: "pages",
} as const satisfies Record<ContentKind, keyof PublicSiteContent>;
