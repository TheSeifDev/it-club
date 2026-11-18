import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../lib/auth/server.ts";
import { SiteContentDatabaseError, isMissingSiteContentSchema } from "../../../lib/site-content/repository.ts";

export const NO_STORE_HEADERS = { "Cache-Control": "private, no-store, max-age=0" };

export function hasServiceConfiguration(): boolean {
  const hasUrl = Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasServiceKey = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY
  );
  return hasUrl && hasServiceKey;
}

export async function requireOwner(request: Request): Promise<
  | { authorized: true; actorId: string }
  | { authorized: false; response: Response }
> {
  const configured = hasServiceConfiguration();
  const auth = await verifyStaffApiRequest(request, ["owner"]);
  if (!auth.authorized || !auth.user || auth.role !== "owner") {
    if (!configured) {
      return {
        authorized: false,
        response: NextResponse.json(
          { ok: false, error: "Content service is unavailable.", code: "CMS_UNAVAILABLE" },
          { status: 503, headers: NO_STORE_HEADERS }
        ),
      };
    }
    return {
      authorized: false,
      response: NextResponse.json(
        { ok: false, error: auth.error ?? "Owner access is required.", code: auth.code ?? "FORBIDDEN" },
        { status: auth.status ?? 403, headers: NO_STORE_HEADERS }
      ),
    };
  }
  return { authorized: true, actorId: auth.user.id };
}

export async function parseJsonBody(request: Request, maxBytes = 128_000): Promise<
  | { ok: true; value: unknown }
  | { ok: false; response: Response }
> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    return { ok: false, response: jsonError(413, "Request body is too large.", "BODY_TOO_LARGE") };
  }
  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, response: jsonError(400, "Invalid request body.", "INVALID_BODY") };
  }
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    return { ok: false, response: jsonError(413, "Request body is too large.", "BODY_TOO_LARGE") };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, response: jsonError(400, "Invalid JSON request body.", "MALFORMED_JSON") };
  }
}

export function jsonError(status: number, error: string, code: string, extra: Record<string, unknown> = {}): Response {
  return NextResponse.json({ ok: false, error, code, ...extra }, { status, headers: NO_STORE_HEADERS });
}

export function unavailableResponse(error?: unknown): Response {
  if (error instanceof SiteContentDatabaseError && isMissingSiteContentSchema(error)) {
    return jsonError(503, "Content service is not configured.", "CMS_NOT_CONFIGURED");
  }
  return jsonError(503, "Content service is temporarily unavailable.", "CMS_UNAVAILABLE");
}
