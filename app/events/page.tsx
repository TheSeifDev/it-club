import type { Metadata } from "next";
import ResponsiveNav from "@/src/components/interview/navigation/ResponsiveNav";
import Footer from "@/src/components/interview/Home/Footer";
import { EventsDirectory } from "@/src/components/interview/Events";

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
  return (
    <main className="min-h-screen bg-[#050708] text-white">
      {/* Reusable Primary Site Navigation */}
      <ResponsiveNav />

      {/* Community Events Archive & Detail Modal */}
      <EventsDirectory />

      {/* Reusable Site Footer */}
      <Footer />
    </main>
  );
}
