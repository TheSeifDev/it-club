/** Typographic stand-in for a portrait: up to two initials, never an icon. */
export function initials(name: string, fallback = "IT"): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => Array.from(part)[0]?.toUpperCase() || "")
      .join("") || fallback
  );
}
