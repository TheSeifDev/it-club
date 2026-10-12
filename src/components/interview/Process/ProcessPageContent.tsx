"use client";

import React from "react";
import ProcessHero from "./ProcessHero";
import ProcessStagesSection from "./ProcessStagesSection";
import ProcessTimeline from "./ProcessTimeline";
import HelpfulTipsSection from "./HelpfulTipsSection";
import ProcessFAQSection from "./ProcessFAQSection";
import ProcessFinalCTA from "./ProcessFinalCTA";

// Reference page section order:
// 1. Hero — "From Application to Impact" + 5-stage progress strip
// 2. Five Main Process Stages (alternating editorial, 01–05)
// 3. Key Dates Timeline
// 4. Helpful Tips (4 cards)
// 5. FAQ (2-column accordion)
// 6. Final CTA — "Take the First Step" with light-paths visual

export default function ProcessPageContent() {
  return (
    <div className="w-full">
      {/* 1. Hero */}
      <ProcessHero />

      {/* 2. Five Editorial Stage Sections */}
      <ProcessStagesSection />

      {/* 3. Key Dates Timeline */}
      <ProcessTimeline />

      {/* 4. Helpful Tips */}
      <HelpfulTipsSection />

      {/* 5. FAQ */}
      <ProcessFAQSection />

      {/* 6. Final CTA */}
      <ProcessFinalCTA />
    </div>
  );
}
