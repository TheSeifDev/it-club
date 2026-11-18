import { getServiceRoleClient } from "../auth/service-role.ts";
import type { ContentData, ContentEntry, ContentKind, ContentStatus } from "./types.ts";
import type { SiteContentSeed } from "./seed.ts";
import { validatePublishReadiness } from "./validation.ts";

const EDITOR_COLUMNS = "id,kind,slug,status,sort_order,featured,publish_at,unpublish_at,revision,draft_data,created_at,updated_at,site_content_publications(revision,published_at)";

export interface ContentPatch {
  slug?: string;
  sort_order?: number;
  featured?: boolean;
  publish_at?: string | null;
  unpublish_at?: string | null;
  data?: ContentData;
}

export interface CreateContentInput {
  kind: ContentKind;
  slug: string;
  sort_order: number;
  featured: boolean;
  publish_at: string | null;
  unpublish_at: string | null;
  data: ContentData;
}

export type ContentAction = "save" | "publish" | "archive" | "unpublish" | "restore";

export function prepareSeedForImport(seed: readonly SiteContentSeed[]): SiteContentSeed[] {
  return seed.map((item) => {
    if (item.status === "published" && validatePublishReadiness(item.kind, item.data).length > 0) {
      return { ...item, status: "draft" };
    }
    return item;
  });
}

export class SiteContentDatabaseError extends Error {
  readonly code?: string;
  constructor(error: { message?: string; code?: string } | null | undefined) {
    super(error?.message ?? "Site content database operation failed.");
    this.name = "SiteContentDatabaseError";
    this.code = error?.code;
  }
}

export function isMissingSiteContentSchema(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string; details?: string };
  return ["42P01", "42703", "PGRST202", "PGRST204", "PGRST205"].includes(candidate.code ?? "") ||
    /site_content_(?:entries|publications|audit|seed_import)|site_inquiries|schema cache/i.test(
      `${candidate.message ?? ""} ${candidate.details ?? ""}`
    );
}

export function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && (error as { code?: string }).code === "23505");
}

function mapEditorRow(row: Record<string, unknown>): ContentEntry {
  const relation = row.site_content_publications;
  const publication = (Array.isArray(relation) ? relation[0] : relation) as { revision?: number; published_at?: string } | null | undefined;
  const revision = Number(row.revision);
  return {
    id: String(row.id),
    kind: row.kind as ContentKind,
    slug: String(row.slug),
    status: row.status as ContentStatus,
    sort_order: Number(row.sort_order),
    featured: Boolean(row.featured),
    publish_at: row.publish_at == null ? null : String(row.publish_at),
    unpublish_at: row.unpublish_at == null ? null : String(row.unpublish_at),
    revision,
    data: row.draft_data as ContentData,
    created_at: row.created_at == null ? null : String(row.created_at),
    updated_at: row.updated_at == null ? null : String(row.updated_at),
    published_at: publication?.published_at ?? null,
    published_revision: publication?.revision ?? null,
    has_unpublished_changes: publication != null && revision !== publication.revision,
  };
}

export async function listContent(kind: ContentKind | undefined, limit: number, offset: number): Promise<{ entries: ContentEntry[]; total: number }> {
  const supabase = getServiceRoleClient();
  let query = supabase.from("site_content_entries").select(EDITOR_COLUMNS, { count: "exact" });
  if (kind) query = query.eq("kind", kind);
  const { data, error, count } = await query
    .order("sort_order", { ascending: true })
    .order("slug", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) throw new SiteContentDatabaseError(error);
  return { entries: (data ?? []).map((row) => mapEditorRow(row)), total: count ?? 0 };
}

export async function getContentEntry(id: string): Promise<ContentEntry | null> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("site_content_entries")
    .select(EDITOR_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new SiteContentDatabaseError(error);
  return data ? mapEditorRow(data as Record<string, unknown>) : null;
}

export async function createContent(input: CreateContentInput, actorId: string): Promise<ContentEntry> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.rpc("site_content_create_entry", {
    p_kind: input.kind,
    p_slug: input.slug,
    p_sort_order: input.sort_order,
    p_featured: input.featured,
    p_publish_at: input.publish_at,
    p_unpublish_at: input.unpublish_at,
    p_data: input.data,
    p_user_id: actorId,
  });
  if (error) throw new SiteContentDatabaseError(error);
  return mapEditorRow(data as Record<string, unknown>);
}

export async function patchContent(
  id: string,
  revision: number,
  action: ContentAction,
  patch: ContentPatch,
  actorId: string
): Promise<{ entry: ContentEntry | null; conflict: boolean }> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.rpc("site_content_update_entry", {
    p_id: id,
    p_revision: revision,
    p_action: action,
    p_patch: patch,
    p_user_id: actorId,
  });
  if (error) throw new SiteContentDatabaseError(error);
  if (data?.conflict === true) return { entry: null, conflict: true };
  const entry = await getContentEntry(id);
  return { entry: entry ?? mapEditorRow(data as Record<string, unknown>), conflict: false };
}

export async function importSiteSeed(seed: readonly SiteContentSeed[], actorId: string): Promise<{ inserted: number; skipped: number }> {
  const supabase = getServiceRoleClient();
  const entries = prepareSeedForImport(seed).map((item) => ({
    id: item.id,
    seed_key: item.seed_key,
    kind: item.kind,
    slug: item.slug,
    status: item.status,
    sort_order: item.sort_order,
    featured: item.featured,
    publish_at: item.publish_at,
    unpublish_at: item.unpublish_at,
    revision: item.revision,
    data: item.data,
  }));
  const { data, error } = await supabase.rpc("site_content_seed_import", {
    p_entries: entries,
    p_user_id: actorId,
  });
  if (error) throw new SiteContentDatabaseError(error);
  return { inserted: Number(data?.inserted ?? 0), skipped: Number(data?.skipped ?? 0) };
}
