export const ABOUT_HREF = "/#about";

export const SITE_NAV_LINKS = [
  { href: ABOUT_HREF, label: "About", arabic: "عن النادي" },
  { href: "/community", label: "Community", arabic: "المجتمع" },
  { href: "/tracks", label: "Tracks", arabic: "المسارات" },
  { href: "/events", label: "Events", arabic: "الفعاليات" },
  { href: "/sponsors", label: "Partners", arabic: "الشركاء" },
] as const;

/** Hash links identify a section, not an independently active page. */
export function isSitePageActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
