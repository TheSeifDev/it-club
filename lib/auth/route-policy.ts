const LEGACY_ROUTE_REDIRECTS = [
  { from: "/login", to: "/interview/login" },
  { from: "/admin/applications", to: "/interview/applications" },
  { from: "/admin/interviews", to: "/interview/interviews" },
  { from: "/admin/audit-logs", to: "/interview/audit-logs" },
  { from: "/admin/change-password", to: "/interview/change-password" },
  { from: "/admin/settings", to: "/interview/settings" },
  { from: "/admin/staff", to: "/interview/staff" },
] as const;

/** Return a same-origin destination only for known legacy operations routes. */
export function getLegacyRouteRedirect(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  for (const route of LEGACY_ROUTE_REDIRECTS) {
    if (path === route.from || path.startsWith(`${route.from}/`)) {
      return `${route.to}${path.slice(route.from.length)}`;
    }
  }
  return null;
}
