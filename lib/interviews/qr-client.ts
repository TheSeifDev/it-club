/**
 * Client-safe QR payload parser.
 * Works across both browser client components and Node.js environments.
 */
export function parseClientQrPayload(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed.token === "string") {
      return parsed.token.trim();
    }
  } catch {
    // If raw token or string
  }
  return trimmed;
}
