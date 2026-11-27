import type { MetadataRoute } from "next";
import {
  publicAlumni,
  publicEvents,
  publicMembers,
  publicPages,
  readPublicSiteContent,
  SITE_ORIGIN,
} from "@/src/components/site/content-utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "/",
    "/community",
    "/tracks",
    "/events",
    "/store",
    "/sponsors",
    "/alumni",
    "/contact",
    "/privacy",
    "/terms",
  ];
  const content = await readPublicSiteContent();
  const memberSlugs = [
    ...publicMembers(content.members),
    ...publicAlumni(content.members),
  ].map((entry) => `/community/${entry.slug}`);
  const eventSlugs = publicEvents(content.events).map(
    (entry) => `/events/${entry.slug}`,
  );
  const pageSlugs = publicPages(content.pages).map(
    (entry) => `/pages/${entry.slug}`,
  );
  return [
    ...new Set([...staticRoutes, ...memberSlugs, ...eventSlugs, ...pageSlugs]),
  ].map((path) => ({
    url: new URL(path, SITE_ORIGIN).toString(),
    changeFrequency: "weekly",
  }));
}
