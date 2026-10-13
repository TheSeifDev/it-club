/**
 * Client-safe QR payload parser and token validation utilities.
 * Works across both browser client components and Node.js environments.
 */

/**
 * Parses and extracts the opaque interview token from varied input formats:
 * 1. JSON payload: {"protocol":"itc-interview-v1","token":"itc_qr_..."}
 * 2. URL or URI query param: https://itclub.org/checkin?token=itc_qr_... or itclub://checkin?token=itc_qr_...
 * 3. Raw token string: itc_qr_...
 */
export function parseClientQrPayload(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();

  // 1. Try parsing JSON structure
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object") {
      if (typeof parsed.token === "string") {
        return parsed.token.trim();
      }
      if (parsed.data && typeof parsed.data.token === "string") {
        return parsed.data.token.trim();
      }
    }
  } catch {
    // Not valid JSON, proceed to URL / string inspection
  }

  // 2. Check for URL query parameter: ?token=... or &token=...
  if (trimmed.includes("token=")) {
    try {
      const match = trimmed.match(/[?&]token=([^&#\s]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]).trim();
      }
      const directMatch = trimmed.match(/^token=([^&#\s]+)/);
      if (directMatch && directMatch[1]) {
        return decodeURIComponent(directMatch[1]).trim();
      }
    } catch {
      // Ignore regex or decoding error and fallback
    }
  }

  // 3. Strip any accidental wrapping quotes (e.g. "\"itc_qr_...\"")
  let cleanToken = trimmed;
  if (
    (cleanToken.startsWith('"') && cleanToken.endsWith('"')) ||
    (cleanToken.startsWith("'") && cleanToken.endsWith("'"))
  ) {
    cleanToken = cleanToken.slice(1, -1).trim();
  }

  return cleanToken;
}

/**
 * Validates whether a token string adheres to the standard IT Club interview format.
 * Format is non-empty, minimal 10 characters, starts with 'itc_qr_' or contains valid opaque chars.
 */
export function isValidQrTokenFormat(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  const trimmed = token.trim();
  // Valid token must be at least 10 chars and contain safe URL-friendly chars
  if (trimmed.length < 10) return false;
  return /^[a-zA-Z0-9_\-\.]+$/.test(trimmed);
}
