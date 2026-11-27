/** Only public showcase pages opt into the visual route transition. */
export function isPublicTransitionPath(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  return ["/", "/about", "/tracks", "/events", "/community", "/sponsors", "/contact", "/alumni", "/privacy", "/terms"].includes(path)
    || /^\/(events|community|pages)\/[^/]+$/.test(path);
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
export function publicTransitionTarget(intent: PublicLinkIntent): string | null {
  if (!intent.sourcePublic || intent.reducedMotion || intent.defaultPrevented
    || (intent.button ?? 0) !== 0 || intent.metaKey || intent.ctrlKey
    || intent.shiftKey || intent.altKey || intent.download
    || (intent.target && intent.target.toLowerCase() !== "_self")) return null;
  try {
    const current = new URL(intent.currentHref);
    const destination = new URL(intent.href, current);
    if (!/^https?:$/.test(destination.protocol) || destination.origin !== current.origin
      || !isPublicTransitionPath(current.pathname)
      || !isPublicTransitionPath(destination.pathname)
      || destination.pathname === current.pathname) return null;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return null;
  }
}

export type TransitionTile = { x: number; y: number; delay: number; tone: number };

/** A bounded, gap-free honeycomb. Overscan avoids exposed viewport edges. */
export function transitionHoneycomb(width: number, height: number) {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  // Fewer, bigger tiles on narrow screens; cap work for unusually tall viewports.
  const radius = Math.max(safeWidth / 18, safeHeight / 24, 48);
  const stepX = radius * 1.5;
  const stepY = radius * Math.sqrt(3);
  const columns = Math.ceil(safeWidth / stepX) + 2;
  const rows = Math.ceil(safeHeight / stepY) + 2;
  const tiles: TransitionTile[] = [];
  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      const x = column * stepX;
      const y = (row - 0.5 + (column % 2) * 0.5) * stepY;
      tiles.push({
        x, y,
        delay: Math.max(0, y / safeHeight) * 0.28 + (column % 3) * 0.012,
        tone: (column * 3 + row * 5) % 7,
      });
    }
  }
  return { radius: radius + 0.75, tiles };
}
