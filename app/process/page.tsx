import type { Metadata } from "next";
import ResponsiveNav from "@/src/components/interview/navigation/ResponsiveNav";
import Footer from "@/src/components/interview/Home/Footer";
import { ProcessPageContent } from "@/src/components/interview/Process";

export const metadata: Metadata = {
  title: "Recruitment Process — IT Club | BATU",
  description:
    "Explore the step-by-step recruitment roadmap at IT Club: online application, profile review, exploratory challenge, interview dialogue, selection, and onboarding kickoff.",
  openGraph: {
    title: "Recruitment Process — IT Club | BATU",
    description:
      "Explore the step-by-step recruitment roadmap at IT Club: online application, profile review, exploratory challenge, interview dialogue, selection, and onboarding kickoff.",
    type: "website",
  },
};

export default function ProcessPage() {
  return (
    <main id="top" className="min-h-screen bg-[#050708] text-white">
      {/* Reusable Primary Site Navigation */}
      <ResponsiveNav />

      {/* Editorial Recruitment Process Journey Content */}
      <ProcessPageContent />

      {/* Reusable Site Footer */}
      <Footer />
    </main>
  );
}
