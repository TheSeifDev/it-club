export interface NavLink {
  readonly label: string;
  readonly href: string;
}

export const BRAND: NavLink = { label: "IT CLUB", href: "/" };

export const NAV_LINKS: readonly NavLink[] = [
  { label: "About", href: "/" },
  { label: "Tracks", href: "/tracks" },
  { label: "Community", href: "/community" },
  { label: "Alumni", href: "/alumni" },
];

export function isActiveLink(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}