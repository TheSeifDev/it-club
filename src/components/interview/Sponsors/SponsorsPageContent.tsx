"use client";

import React, { useState } from "react";
import SponsorsPageHero from "./SponsorsPageHero";
import PartnershipOpportunitiesSection from "./PartnershipOpportunitiesSection";
import PartnershipBenefitsSection from "./PartnershipBenefitsSection";
import SponsorsDirectory from "./SponsorsDirectory";
import PartnershipInquirySection from "./PartnershipInquirySection";
import FinalCTASection from "./FinalCTASection";

export default function SponsorsPageContent() {
  const [selectedCategory, setSelectedCategory] = useState<string>("general");

  return (
    <div className="w-full">
      {/* 1. Hero with Photographic Ecosystem Background */}
      <SponsorsPageHero />

      {/* 2. Opportunity Cards Grid (6 Real Categories with Photographic WebP Backgrounds) */}
      <PartnershipOpportunitiesSection
        onSelectCategory={(catId) => setSelectedCategory(catId)}
      />

      {/* 3. Why Partner with IT Club Benefits Section */}
      <PartnershipBenefitsSection />

      {/* 4. Verified Supporters & Collaborators Logos (icealex & WRK+R) */}
      <SponsorsDirectory />

      {/* 5. Partnership Inquiry Form with Category Synchronization */}
      <PartnershipInquirySection selectedCategory={selectedCategory} />

      {/* 6. Concluding Call to Action */}
      <FinalCTASection />
    </div>
  );
}
