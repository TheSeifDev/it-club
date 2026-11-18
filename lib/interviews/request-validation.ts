import type { InterviewRating } from "./qr-service.ts";

export type BoundedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; code: "MALFORMED_JSON" | "PAYLOAD_TOO_LARGE" };

export async function readBoundedJsonBody(
  request: Request,
  maxBytes: number
): Promise<BoundedJsonResult> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isFinite(contentLength) || contentLength < 0) {
      return { ok: false, code: "MALFORMED_JSON" };
    }
    if (contentLength > maxBytes) {
      return { ok: false, code: "PAYLOAD_TOO_LARGE" };
    }
  }

  if (!request.body) {
    return { ok: false, code: "MALFORMED_JSON" };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return { ok: false, code: "PAYLOAD_TOO_LARGE" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, code: "MALFORMED_JSON" };
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const value: unknown = JSON.parse(decoded);
    return { ok: true, value };
  } catch {
    return { ok: false, code: "MALFORMED_JSON" };
  }
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export type QrRequestPayloadResult =
  | { ok: true; token: string }
  | { ok: false; code: "INVALID_BODY" | "MISSING_TOKEN" | "TOKEN_TOO_LONG" };

export function parseQrRequestPayload(value: unknown): QrRequestPayloadResult {
  if (!isJsonObject(value)) {
    return { ok: false, code: "INVALID_BODY" };
  }
  if (value.token === undefined || value.token === null || value.token === "") {
    return { ok: false, code: "MISSING_TOKEN" };
  }
  if (typeof value.token !== "string") {
    return { ok: false, code: "INVALID_BODY" };
  }
  const token = value.token.trim();
  if (!token) {
    return { ok: false, code: "MISSING_TOKEN" };
  }
  if (token.length > 2048) {
    return { ok: false, code: "TOKEN_TOO_LONG" };
  }
  return { ok: true, token };
}

export interface InterviewEvaluationPayload {
  applicationId: string;
  evaluationNotes: string;
  rating: InterviewRating | null;
  recommendation: string | null;
}

export type InterviewEvaluationPayloadResult =
  | { ok: true; payload: InterviewEvaluationPayload }
  | {
      ok: false;
      code:
        | "INVALID_BODY"
        | "MISSING_APPLICATION_ID"
        | "INVALID_APPLICATION_ID"
        | "INVALID_EVALUATION_NOTES"
        | "EVALUATION_NOTES_TOO_LONG"
        | "INVALID_RATING"
        | "INVALID_RECOMMENDATION"
        | "RECOMMENDATION_TOO_LONG";
    };

const INTERVIEW_RATINGS = ["STRONG_HIRE", "HIRE", "NEUTRAL", "NO_HIRE"] as const;

export function parseInterviewEvaluationPayload(value: unknown): InterviewEvaluationPayloadResult {
  if (!isJsonObject(value)) {
    return { ok: false, code: "INVALID_BODY" };
  }

  if (typeof value.applicationId !== "string" || !value.applicationId.trim()) {
    return { ok: false, code: "MISSING_APPLICATION_ID" };
  }
  const applicationId = value.applicationId.trim();
  if (applicationId.length > 64) {
    return { ok: false, code: "INVALID_APPLICATION_ID" };
  }

  const evaluationNotes = value.evaluationNotes === undefined ? "" : value.evaluationNotes;
  if (typeof evaluationNotes !== "string") {
    return { ok: false, code: "INVALID_EVALUATION_NOTES" };
  }
  if (evaluationNotes.length > 10_000) {
    return { ok: false, code: "EVALUATION_NOTES_TOO_LONG" };
  }

  let rating: InterviewRating | null = null;
  if (value.rating !== undefined && value.rating !== null) {
    if (
      typeof value.rating !== "string" ||
      !(INTERVIEW_RATINGS as readonly string[]).includes(value.rating)
    ) {
      return { ok: false, code: "INVALID_RATING" };
    }
    rating = value.rating as InterviewRating;
  }

  let recommendation: string | null = null;
  if (value.recommendation !== undefined && value.recommendation !== null) {
    if (typeof value.recommendation !== "string") {
      return { ok: false, code: "INVALID_RECOMMENDATION" };
    }
    if (value.recommendation.length > 2_000) {
      return { ok: false, code: "RECOMMENDATION_TOO_LONG" };
    }
    recommendation = value.recommendation.trim() || null;
  }

  return {
    ok: true,
    payload: { applicationId, evaluationNotes, rating, recommendation },
  };
}
