import { NextResponse } from "next/server.js";
import { SITE_CONTENT_SEED } from "../../../../lib/site-content/seed.ts";
import { importSiteSeed, isMissingSiteContentSchema } from "../../../../lib/site-content/repository.ts";
import { hasServiceConfiguration, NO_STORE_HEADERS, requireOwner, unavailableResponse } from "../_shared.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const owner = await requireOwner(request);
  if (!owner.authorized) return owner.response;
  if (!hasServiceConfiguration()) return unavailableResponse();
  try {
    const result = await importSiteSeed(SITE_CONTENT_SEED, owner.actorId);
    return NextResponse.json({ ok: true, ...result }, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error) {
    if (isMissingSiteContentSchema(error)) return unavailableResponse(error);
    return unavailableResponse(error);
  }
}
