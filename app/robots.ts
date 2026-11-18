import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/src/components/site/content-utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/interview", "/student", "/api", "/auth", "/login", "/register"],
    },
    sitemap: new URL("/sitemap.xml", SITE_ORIGIN).toString(),
  };
}
