/** Only public showcase pages opt into the visual route transition. */
export function isPublicTransitionPath(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  return (
    [
      "/",
      "/about",
      "/tracks",
      "/events",
      "/store",
      "/community",
      "/sponsors",
      "/contact",
      "/alumni",
      "/privacy",
      "/terms",
    ].includes(path) || /^\/(events|community|pages)\/[^/]+$/.test(path)
  );
}

export type PublicLinkIntent = {
  href: string;
  currentHref: string;
  sourcePublic: boolean;
  button?: number;
  defaultPrevented?: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  target?: string | null;
  download?: boolean;
  reducedMotion?: boolean;
};

/** Same-page hashes/query changes, modified clicks and operational links remain native. */
export function publicTransitionTarget(
  intent: PublicLinkIntent,
): string | null {
  if (
    !intent.sourcePublic ||
    intent.reducedMotion ||
    intent.defaultPrevented ||
    (intent.button ?? 0) !== 0 ||
    intent.metaKey ||
    intent.ctrlKey ||
    intent.shiftKey ||
    intent.altKey ||
    intent.download ||
    (intent.target && intent.target.toLowerCase() !== "_self")
  )
    return null;
  try {
    const current = new URL(intent.currentHref);
    const destination = new URL(intent.href, current);
    if (
      !/^https?:$/.test(destination.protocol) ||
      destination.origin !== current.origin ||
      !isPublicTransitionPath(current.pathname) ||
      !isPublicTransitionPath(destination.pathname) ||
      destination.pathname === current.pathname
    )
      return null;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return null;
  }
}

/** Section destinations retain native anchor positioning, not a forced top reset. */
export function transitionStartsAtTop(href: string): boolean {
  try {
    return !new URL(href, "https://transition.invalid").hash;
  } catch {
    return false;
  }
}

export type TransitionTile = {
  x: number;
  y: number;
  delay: number;
  tone: number;
};

/** Hex blocks fall from the top as a curtain, leading slightly at the centre. */
export function transitionHoneycomb(width: number, height: number) {
  const safeWidth = Number.isFinite(width) ? Math.max(1, width) : 1;
  const safeHeight = Number.isFinite(height) ? Math.max(1, height) : 1;
  const minimumRadius = safeWidth < 600 ? 24 : safeWidth < 900 ? 34 : 44;
  const densityRadius = Math.sqrt(
    (safeWidth * safeHeight) / (2.598 * 280),
  );
  const radius = Math.min(72, Math.max(minimumRadius, densityRadius));
  const stepX = radius * 1.5;
  const stepY = radius * Math.sqrt(3);
  const columns = Math.ceil(safeWidth / stepX) + 2;
  const rows = Math.ceil(safeHeight / stepY) + 2;
  const originX = safeWidth / 2;
  const positions: Array<Omit<TransitionTile, "delay">> = [];

  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      const x = column * stepX;
      const y = (row - 0.5 + (column % 2) * 0.5) * stepY;
      positions.push({
        x,
        y,
        // Hashed, not diagonal, so the dark field reads as texture rather than a pattern.
        tone: ((column * 73856093) ^ (row * 19349663)) >>> 0 & 3,
      });
    }
  }

  // Mostly vertical sweep with a gentle centre-first curve.
  const distances = positions.map(
    (tile) => Math.max(0, tile.y) + Math.abs(tile.x - originX) * 0.32,
  );
  const maximumDistance = Math.max(1, ...distances);
  const tiles = positions.map((tile, index) => ({
    ...tile,
    delay: (distances[index] / maximumDistance) * 0.62,
  }));

  return { radius: radius + 0.75, tiles };
}

const EXTRA_LABELS: Record<string, { label: string; arabic: string }> = {
  "/": { label: "Home", arabic: "الرئيسية" },
  "/contact": { label: "Contact", arabic: "تواصل معنا" },
  "/alumni": { label: "Alumni", arabic: "الخريجين" },
  "/privacy": { label: "Privacy", arabic: "الخصوصية" },
  "/terms": { label: "Terms", arabic: "الشروط" },
  // Mirrors SITE_NAV_LINKS; kept local so the pure test runner needs no resolver.
  "/community": { label: "Community", arabic: "المجتمع" },
  "/tracks": { label: "Tracks", arabic: "المسارات" },
  "/events": { label: "Events", arabic: "الفعاليات" },
  "/store": { label: "Store", arabic: "المتجر" },
  "/sponsors": { label: "Partners", arabic: "الشركاء" },
};
/** Destination name shown on the covered screen between pages. */
export function transitionLabel(href: string): { label: string; arabic: string } {
  let path = "/";
  try {
    path = new URL(href, "https://transition.invalid").pathname.replace(/\/$/, "") || "/";
  } catch {
    path = "/";
  }
  if (EXTRA_LABELS[path]) return EXTRA_LABELS[path];
  const root = `/${path.split("/")[1] ?? ""}`;
  return EXTRA_LABELS[root] ?? { label: "IT Club", arabic: "آي تي كلوب" };
}
