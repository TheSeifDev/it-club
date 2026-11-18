import { NextResponse } from "next/server.js";
import { getContentEntry, isMissingSiteContentSchema, isUniqueConstraintError, patchContent } from "../../../../../lib/site-content/repository.ts";
import { isValidSlug, validateContentData, validatePublicationWindow, validatePublishReadiness } from "../../../../../lib/site-content/validation.ts";
import type { ContentAction, ContentPatch } from "../../../../../lib/site-content/repository.ts";
import type { ContentData } from "../../../../../lib/site-content/types.ts";
import { hasServiceConfiguration, jsonError, NO_STORE_HEADERS, parseJsonBody, requireOwner, unavailableResponse } from "../../_shared.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = new Set<ContentAction>(["save", "publish", "archive", "unpublish", "restore"]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner(request);
  if (!owner.authorized) return owner.response;
  if (!hasServiceConfiguration()) return unavailableResponse();
  const { id } = await context.params;
  if (!UUID.test(id)) return jsonError(400, "Invalid content id.", "INVALID_ID");
  const parsed = await parseJsonBody(request);
  if (!parsed.ok) return parsed.response;
  if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return jsonError(400, "A JSON object is required.", "INVALID_INPUT");
  const body = parsed.value as Record<string, unknown>;
  const allowed = new Set(["revision", "slug", "sort_order", "featured", "publish_at", "unpublish_at", "data", "action"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) return jsonError(400, "Unsupported request field.", "INVALID_INPUT");
  if (!Number.isSafeInteger(body.revision) || Number(body.revision) < 1) return jsonError(400, "A positive revision is required.", "INVALID_REVISION");
  const action = body.action === undefined ? "save" : body.action;
  if (typeof action !== "string" || !ACTIONS.has(action as ContentAction)) return jsonError(400, "Unsupported content action.", "INVALID_ACTION");
  const requestedAction = action as ContentAction;
  const patch: ContentPatch = {};

  if ("slug" in body) {
    if (!isValidSlug(body.slug)) return jsonError(400, "slug must be a lowercase URL-safe identifier.", "INVALID_SLUG");
    patch.slug = body.slug;
  }
  if ("sort_order" in body) {
    if (!Number.isSafeInteger(body.sort_order) || Number(body.sort_order) < 0 || Number(body.sort_order) > 100_000) return jsonError(400, "sort_order must be an integer from 0 to 100000.", "INVALID_SORT_ORDER");
    patch.sort_order = Number(body.sort_order);
  }
  if ("featured" in body) {
    if (typeof body.featured !== "boolean") return jsonError(400, "featured must be a boolean.", "INVALID_FEATURED");
    patch.featured = body.featured;
  }
  for (const key of ["publish_at", "unpublish_at"] as const) {
    if (!(key in body)) continue;
    const value = body[key];
    if (value !== null && !isSafeTimestamp(value)) return jsonError(400, `${key} must be an ISO timestamp or null.`, "INVALID_WINDOW");
    patch[key] = value as string | null;
  }
  if ("data" in body) patch.data = body.data as ContentData;

  try {
    const current = await getContentEntry(id);
    if (!current) return jsonError(404, "Content entry was not found.", "NOT_FOUND");
    if (current.revision !== Number(body.revision)) return jsonError(409, "This content entry changed. Reload before saving.", "REVISION_CONFLICT", { revision: current.revision });
    if ("data" in body) {
      const issues = validateContentData(current.kind, body.data);
      if (issues.length) return jsonError(400, "Content needs correction.", "INVALID_CONTENT", { issues });
    }

    const mergedData = patch.data ?? current.data;
    const mergedPublishAt = "publish_at" in patch ? patch.publish_at! : current.publish_at;
    const mergedUnpublishAt = "unpublish_at" in patch ? patch.unpublish_at! : current.unpublish_at;
    const windowErrors = validatePublicationWindow(mergedPublishAt, mergedUnpublishAt);
    if (windowErrors.length) return jsonError(400, "Publication window needs correction.", "INVALID_WINDOW", { issues: windowErrors });
    if (requestedAction === "publish") {
      const issues = validatePublishReadiness(current.kind, mergedData);
      if (issues.length) return jsonError(400, "Entry is not ready to publish.", "PUBLISH_NOT_READY", { issues });
    }

    const result = await patchContent(id, Number(body.revision), requestedAction, patch, owner.actorId);
    if (result.conflict) return jsonError(409, "This content entry changed. Reload before saving.", "REVISION_CONFLICT");
    return NextResponse.json({ ok: true, entry: result.entry }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (isUniqueConstraintError(error)) return jsonError(409, "An entry with this kind and slug already exists.", "DUPLICATE_SLUG");
    if (isMissingSiteContentSchema(error)) return unavailableResponse(error);
    return unavailableResponse(error);
  }
}

function isSafeTimestamp(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
}
