import { NextResponse } from "next/server.js";
import { getOwnerSeed } from "../../../../lib/site-content/seed.ts";
import { createContent, isMissingSiteContentSchema, isUniqueConstraintError, listContent } from "../../../../lib/site-content/repository.ts";
import { isContentKind, isValidSlug, validateContentData, validatePublicationWindow } from "../../../../lib/site-content/validation.ts";
import type { ContentData, ContentKind } from "../../../../lib/site-content/types.ts";
import { hasServiceConfiguration, jsonError, NO_STORE_HEADERS, parseJsonBody, requireOwner, unavailableResponse } from "../_shared.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function positiveInteger(value: string | null, fallback: number, max: number): number | null {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= max ? parsed : null;
}

export async function GET(request: Request) {
  const owner = await requireOwner(request);
  if (!owner.authorized) return owner.response;
  const url = new URL(request.url);
  const kindValue = url.searchParams.get("kind");
  if (kindValue && !isContentKind(kindValue)) return jsonError(400, "Unknown content kind.", "INVALID_KIND");
  const limit = positiveInteger(url.searchParams.get("limit"), 50, 100);
  const offset = positiveInteger(url.searchParams.get("offset"), 0, 100_000);
  if (limit === null || limit < 1 || offset === null) return jsonError(400, "Invalid pagination values.", "INVALID_PAGINATION");
  const kind = kindValue as ContentKind | null;

  if (!hasServiceConfiguration()) {
    const entries = getOwnerSeed(kind ?? undefined);
    return NextResponse.json({ ok: true, entries: entries.slice(offset, offset + limit), total: entries.length, configured: false }, { headers: NO_STORE_HEADERS });
  }

  try {
    const result = await listContent(kind ?? undefined, limit, offset);
    return NextResponse.json({ ok: true, ...result, configured: true }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (isMissingSiteContentSchema(error)) {
      const entries = getOwnerSeed(kind ?? undefined);
      return NextResponse.json({ ok: true, entries: entries.slice(offset, offset + limit), total: entries.length, configured: false }, { headers: NO_STORE_HEADERS });
    }
    return unavailableResponse(error);
  }
}

export async function POST(request: Request) {
  const owner = await requireOwner(request);
  if (!owner.authorized) return owner.response;
  if (!hasServiceConfiguration()) return unavailableResponse();
  const parsed = await parseJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;
  if (!body || typeof body !== "object" || Array.isArray(body)) return jsonError(400, "A JSON object is required.", "INVALID_INPUT");
  const value = body as Record<string, unknown>;
  const allowed = new Set(["kind", "slug", "sort_order", "featured", "publish_at", "unpublish_at", "data"]);
  if (Object.keys(value).some((key) => !allowed.has(key))) return jsonError(400, "Unsupported request field.", "INVALID_INPUT");
  if (!isContentKind(value.kind)) return jsonError(400, "Unknown content kind.", "INVALID_KIND");
  if (!isValidSlug(value.slug)) return jsonError(400, "slug must be a lowercase URL-safe identifier.", "INVALID_SLUG");
  if (!Number.isSafeInteger(value.sort_order) || Number(value.sort_order) < 0 || Number(value.sort_order) > 100_000) {
    return jsonError(400, "sort_order must be an integer from 0 to 100000.", "INVALID_SORT_ORDER");
  }
  if (typeof value.featured !== "boolean") return jsonError(400, "featured must be a boolean.", "INVALID_FEATURED");
  const publishAt = value.publish_at === undefined ? null : value.publish_at;
  const unpublishAt = value.unpublish_at === undefined ? null : value.unpublish_at;
  const windowErrors = validatePublicationWindow(publishAt, unpublishAt);
  const dataErrors = validateContentData(value.kind, value.data);
  if (windowErrors.length || dataErrors.length) {
    return jsonError(400, "Content needs correction.", "INVALID_CONTENT", { issues: [...windowErrors, ...dataErrors] });
  }

  try {
    const entry = await createContent({
      kind: value.kind,
      slug: value.slug,
      sort_order: Number(value.sort_order),
      featured: value.featured,
      publish_at: publishAt as string | null,
      unpublish_at: unpublishAt as string | null,
      data: value.data as ContentData,
    }, owner.actorId);
    return NextResponse.json({ ok: true, entry }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error) {
    if (isUniqueConstraintError(error)) return jsonError(409, "An entry with this kind and slug already exists.", "DUPLICATE_SLUG");
    if (isMissingSiteContentSchema(error)) return unavailableResponse(error);
    return unavailableResponse(error);
  }
}
