import type { Metadata } from "next";
import ResponsiveNav from "@/src/components/interview/navigation/ResponsiveNav";
import Footer from "@/src/components/interview/Home/Footer";
import { TracksPageContent } from "@/src/components/interview/Tracks";

export const metadata: Metadata = {
  title: "Tracks",
  description:
    "Explore the six specialized technical and operational tracks of IT Club: Human Resources, Public Relations, Social Media, Organizing Committee, Information Technology, and Research & Development.",
  openGraph: {
    title: "Tracks — IT Club | BATU",
    description:
      "Explore the six specialized technical and operational tracks of IT Club: Human Resources, Public Relations, Social Media, Organizing Committee, Information Technology, and Research & Development.",
    url: "/tracks",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tracks — IT Club | BATU",
    description:
      "Explore the six specialized technical and operational tracks of IT Club at BATU.",
  },
};

export default function TracksPage() {
  return (
    <main id="top" className="min-h-screen bg-[#050708] text-white">
      {/* Reusable Primary Site Navigation */}
      <ResponsiveNav />

      {/* Interactive Cinematic Tracks Content */}
      <TracksPageContent />

      {/* Reusable Site Footer */}
      <Footer />
    </main>
  );
}
