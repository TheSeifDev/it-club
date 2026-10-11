"use client";

import React, { useState } from "react";
import ProcessHero from "./ProcessHero";
import ProcessTimeline from "./ProcessTimeline";
import StageDetailsSection from "./StageDetailsSection";
import EvaluationPrinciplesSection from "./EvaluationPrinciplesSection";
import ProcessFAQSection from "./ProcessFAQSection";
import ProcessFinalCTA from "./ProcessFinalCTA";

export default function ProcessPageContent() {
  const [selectedStageId, setSelectedStageId] = useState<string>("application");

  const handleStageSelect = (stageId: string) => {
    setSelectedStageId(stageId);
    const element = document.getElementById("stage-details");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="w-full">
      {/* 1. Hero Section: Overview, Stage Meter & CTA */}
      <ProcessHero />

      {/* 2. Chronological Connected Timeline */}
      <ProcessTimeline
        activeStageId={selectedStageId}
        onSelectStage={handleStageSelect}
      />

      {/* 3. Deep-Dive Stage Breakdown: Expectations & Preparations */}
      <StageDetailsSection
        selectedStageId={selectedStageId}
        onStageChange={(id) => setSelectedStageId(id)}
      />

      {/* 4. Core Evaluation Principles & Mindset */}
      <EvaluationPrinciplesSection />

      {/* 5. Frequently Asked Questions (Interactive Accordion) */}
      <ProcessFAQSection />

      {/* 6. Concluding Minimal Call to Action */}
      <ProcessFinalCTA />
    </div>
  );
}
