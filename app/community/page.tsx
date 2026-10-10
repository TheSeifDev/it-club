import type { Metadata } from "next";
import ResponsiveNav from "@/src/components/interview/navigation/ResponsiveNav";
import Footer from "@/src/components/interview/Home/Footer";
import { CommunityDirectory } from "@/src/components/interview/Community/CommunityDirectory";

export const metadata: Metadata = {
  title: "Community — IT Club | BATU",
  description:
    "Meet the students building, organizing, and growing the IT Club community across every committee. Explore the full community directory.",
  openGraph: {
    title: "Community — IT Club | BATU",
    description:
      "Meet the students building, organizing, and growing the IT Club community across every committee.",
    type: "website",
  },
};

export default function CommunityPage() {
  return (
    <main className="min-h-screen bg-[#050708] text-white">
      {/* Reusable Primary Site Navigation */}
      <ResponsiveNav />

      {/* Editorial BrainsMingle-Inspired Hero, Directory & CTA */}
      <CommunityDirectory />

      {/* Reusable Site Footer */}
      <Footer />
    </main>
  );
}
