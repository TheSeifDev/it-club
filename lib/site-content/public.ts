import { createClient } from "@supabase/supabase-js";
import { getCommittedPublicSeed, isVisibleAt } from "./seed.ts";
import { CONTENT_KINDS, PUBLIC_CONTENT_KEYS, type ContentEntry, type ContentKind, type PublicSiteContent } from "./types.ts";

const PUBLIC_COLUMNS = "entry_id,kind,slug,sort_order,featured,publish_at,unpublish_at,revision,data";
const PUBLIC_LIMIT = 500;

export class SiteContentUnavailableError extends Error {
  constructor() {
    super("Published site content is temporarily unavailable.");
    this.name = "SiteContentUnavailableError";
  }
}

export async function getPublicSiteContent(): Promise<PublicSiteContent> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return getCommittedPublicSeed();

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: globalThis.fetch,
        headers: { "x-application-source": "it-club-public-content" },
      },
    });
    const { data, error } = await supabase
      .from("site_content_publications")
      .select(PUBLIC_COLUMNS)
      .order("sort_order", { ascending: true })
      .order("slug", { ascending: true })
      .limit(PUBLIC_LIMIT);
    if (error || !data) throw new SiteContentUnavailableError();

    const result: PublicSiteContent = {
      members: [], boards: [], tracks: [], events: [], sponsors: [], announcements: [], pages: [],
    };
    const now = Date.now();
    for (const row of data) {
      const kind = row.kind as ContentKind;
      if (!CONTENT_KINDS.includes(kind)) continue;
      const entry: ContentEntry = {
        id: row.entry_id,
        kind,
        slug: row.slug,
        status: "published",
        sort_order: row.sort_order,
        featured: row.featured,
        publish_at: row.publish_at,
        unpublish_at: row.unpublish_at,
        revision: row.revision,
        data: row.data,
      };
      if (!isVisibleAt(entry, now)) continue;
      result[PUBLIC_CONTENT_KEYS[kind]].push(entry);
    }
    return result;
  } catch (error) {
    if (error instanceof SiteContentUnavailableError) throw error;
    throw new SiteContentUnavailableError();
  }
}
