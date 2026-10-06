export interface NavLink {
  readonly label: string;
  readonly href: string;
}

export const BRAND: NavLink = { label: "IT CLUB", href: "/" };

export const NAV_LINKS: readonly NavLink[] = [
  { label: "About", href: "/" },
  { label: "Tracks", href: "/tracks" },
  { label: "Process", href: "/process" },
  { label: "Community", href: "/community" },
  { label: "Events", href: "/events" },
];

export const NAV_CTA: NavLink = { label: "Apply Now", href: "/register" };

export function isActiveLink(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}