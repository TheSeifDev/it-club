/**
 * Validates and sanitizes redirect paths to prevent Open Redirect vulnerabilities.
 * Ensures the destination is strictly an internal, relative path.
 */
export function sanitizeRedirectPath(rawPath: string | null | undefined, defaultFallback = "/admin"): string {
  if (!rawPath || typeof rawPath !== "string") {
    return defaultFallback;
  }

  const trimmed = rawPath.trim();

  // Must begin with a single slash
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return defaultFallback;
  }

  // Reject protocol schemes or external targets
  if (trimmed.includes("://") || trimmed.toLowerCase().startsWith("javascript:") || trimmed.toLowerCase().startsWith("data:")) {
    return defaultFallback;
  }

  // Ensure path is on permitted application administrative routes
  const allowedPrefixes = ["/admin"];
  const isAllowed = allowedPrefixes.some(
    (prefix) => trimmed === prefix || trimmed.startsWith(`${prefix}/`) || trimmed.startsWith(`${prefix}?`)
  );

  return isAllowed ? trimmed : defaultFallback;
}
