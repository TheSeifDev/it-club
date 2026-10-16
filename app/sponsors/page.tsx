import type { Metadata } from "next";
import ResponsiveNav from "@/src/components/interview/navigation/ResponsiveNav";
import Footer from "@/src/components/interview/Home/Footer";
import { SponsorsPageContent } from "@/src/components/interview/Sponsors";

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
  return (
    <main className="min-h-screen bg-[#050708] text-white">
      {/* Reusable Primary Site Navigation */}
      <ResponsiveNav />

      {/* Redesigned Professional Partnership Ecosystem */}
      <SponsorsPageContent />

      {/* Reusable Site Footer */}
      <Footer />
    </main>
  );
}
