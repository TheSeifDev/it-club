import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server.js";
import { getServiceRoleClient } from "../../../../lib/auth/service-role.ts";
import { hasServiceConfiguration, jsonError, NO_STORE_HEADERS, requireOwner, unavailableResponse } from "../_shared.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const IMAGE_TYPES = {
  "image/png": { extension: "png", matches: (bytes: Uint8Array) => bytes.length >= 8 && bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10" },
  "image/jpeg": { extension: "jpg", matches: (bytes: Uint8Array) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/webp": { extension: "webp", matches: (bytes: Uint8Array) => bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" },
} as const;

export async function POST(request: Request) {
  const owner = await requireOwner(request);
  if (!owner.authorized) return owner.response;
  if (!hasServiceConfiguration()) return unavailableResponse();
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_FILE_BYTES + 65_536) {
    return jsonError(413, "Image upload must be no larger than 5 MiB.", "IMAGE_TOO_LARGE");
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, "A multipart image upload is required.", "INVALID_UPLOAD");
  }
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError(400, "A file field is required.", "INVALID_UPLOAD");
  if (file.size <= 0 || file.size > MAX_FILE_BYTES) return jsonError(413, "Image must be no larger than 5 MiB.", "IMAGE_TOO_LARGE");
  const type = file.type as keyof typeof IMAGE_TYPES;
  const typeRule = IMAGE_TYPES[type];
  if (!typeRule) return jsonError(400, "Only PNG, JPEG, and WebP images are accepted.", "UNSUPPORTED_IMAGE_TYPE");

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    return jsonError(400, "The image could not be read.", "INVALID_UPLOAD");
  }
  if (bytes.byteLength > MAX_FILE_BYTES || !typeRule.matches(bytes)) {
    return jsonError(400, "Image type does not match its file signature.", "IMAGE_SIGNATURE_MISMATCH");
  }

  try {
    const supabase = getServiceRoleClient();
    const objectPath = `uploads/${randomUUID()}.${typeRule.extension}`;
    const { error } = await supabase.storage.from("site-media").upload(objectPath, bytes, {
      contentType: type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) return unavailableResponse();
    const { data } = supabase.storage.from("site-media").getPublicUrl(objectPath);
    if (!data.publicUrl) return unavailableResponse();
    return NextResponse.json({ ok: true, url: data.publicUrl }, { status: 201, headers: NO_STORE_HEADERS });
  } catch {
    return unavailableResponse();
  }
}
