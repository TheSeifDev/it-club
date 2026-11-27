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
  band: number;
};

/** Small gap-free hexagons; only the <=38 horizontal bands are animated. */
export function transitionHoneycomb(width: number, height: number) {
  const safeWidth = Number.isFinite(width) ? Math.max(1, width) : 1;
  const safeHeight = Number.isFinite(height) ? Math.max(1, height) : 1;
  const minimumRadius = safeWidth < 600 ? 9 : 12;
  // Density cap keeps 4K/tall screens bounded without making ordinary tiles large.
  const radius = Math.max(
    minimumRadius,
    Math.sqrt((safeWidth * safeHeight) / (2600 * 2.598)),
  );
  const stepX = radius * 1.5;
  const stepY = radius * Math.sqrt(3);
  const columns = Math.ceil(safeWidth / stepX) + 2;
  const rows = Math.ceil(safeHeight / stepY) + 2;
  const bandHeight = Math.max(stepY, safeHeight / 36);
  const bandCount = Math.ceil(safeHeight / bandHeight);
  const tiles: TransitionTile[] = [];
  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      const x = column * stepX;
      const y = (row - 0.5 + (column % 2) * 0.5) * stepY;
      const band = Math.min(bandCount, Math.max(0, Math.floor(y / bandHeight)));
      tiles.push({
        x,
        y,
        band,
        delay: (band / Math.max(1, bandCount)) * 0.28,
        tone: (column * 3 + row * 5) % 7,
      });
    }
  }
  return { radius: radius + 0.75, tiles };
}
