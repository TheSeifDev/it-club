import type { Metadata } from "next";
import SiteMaintenanceNotice from "@/src/components/interview/SiteMaintenanceNotice";

export const metadata: Metadata = {
  title: "Events & Archives",
  description:
    "Explore the official IT Club community archive of hackathons, student innovation summits, and technical workshops organized and attended across Egypt.",
  openGraph: {
    title: "Events & Archives — IT Club | BATU",
    description:
      "Explore the official IT Club community archive of hackathons, student innovation summits, and technical workshops organized and attended across Egypt.",
    url: "/events",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Events & Archives — IT Club | BATU",
    description:
      "Explore the official IT Club community archive of hackathons, student innovation summits, and technical workshops.",
  },
};

export default function EventsPage() {
  return <SiteMaintenanceNotice />;
}
