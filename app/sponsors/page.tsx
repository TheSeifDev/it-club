import type { Metadata } from "next";
import SiteMaintenanceNotice from "@/src/components/interview/SiteMaintenanceNotice";

export const metadata: Metadata = {
  title: "Sponsors & Partners",
  description:
    "Collaborate with IT Club to empower 500+ ambitious tech students and developers. Discover genuine technology, educational, community, and support partnership opportunities.",
  openGraph: {
    title: "Sponsors & Partners — IT Club | BATU",
    description:
      "Collaborate with IT Club to empower 500+ ambitious tech students and developers. Discover genuine technology, educational, community, and support partnership opportunities.",
    url: "/sponsors",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sponsors & Partners — IT Club | BATU",
    description:
      "Collaborate with IT Club to empower 500+ ambitious tech students and developers.",
  },
};

export default function SponsorsPage() {
  return <SiteMaintenanceNotice />;
}
