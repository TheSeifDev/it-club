"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PROCESS_FAQS } from "./process-data";

export default function ProcessFAQSection() {
  const [openId, setOpenId] = useState<string | null>("prior-experience");

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="faq"
      aria-label="Frequently Asked Questions Section"
      className="relative w-full overflow-hidden bg-[#050708] text-white py-20 md:py-28 lg:py-32 border-b border-white/10"
    >
      <div className="relative tracks-content-container">
        {/* =============================================================== */}
        {/* 1. SECTION HEADER                                               */}
        {/* =============================================================== */}
        <div className="flex items-center gap-4 mb-12 sm:mb-16">
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-xs font-bold text-[#ffab18] tracking-widest uppercase">
              05 • FREQUENTLY ASKED QUESTIONS
            </span>
            <span className="text-neutral-600">|</span>
            <span className="arabic text-sm text-neutral-400 font-medium">
              الأسئلة الشائعة
            </span>
          </div>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16">
          <div className="lg:col-span-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.08] text-white">
              Got questions?
              <br />
              <span className="text-[#ffab18]">Clear answers before you apply.</span>
            </h2>
          </div>

          <div className="lg:col-span-4">
            <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
              Find transparent answers regarding eligibility, preparation,
              interview conversations, and expected weekly commitments.
            </p>
          </div>
        </div>

        {/* =============================================================== */}
        {/* 2. ACCORDION LIST                                               */}
        {/* =============================================================== */}
        <div className="max-w-4xl mx-auto space-y-4">
          {PROCESS_FAQS.map((faq, idx) => {
            const isOpen = openId === faq.id;

            return (
              <div
                key={faq.id}
                className={`border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? "bg-[#0a0d10] border-white/30 shadow-[0_0_25px_rgba(255,255,255,0.03)]"
                    : "bg-[#07090b] border-white/10 hover:border-white/20"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                  className="w-full p-5 sm:p-6 flex items-start justify-between gap-4 text-left transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/40"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span className="font-mono text-xs font-bold text-[#ffab18] shrink-0 mt-0.5">
                      0{idx + 1}
                    </span>

                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        {faq.question}
                      </h3>

                      <h4 className="arabic mt-1 text-xs sm:text-sm font-semibold text-neutral-400">
                        {faq.arabicQuestion}
                      </h4>
                    </div>
                  </div>

                  <div
                    className={`shrink-0 p-1 rounded transition-transform duration-300 text-neutral-400 ${
                      isOpen ? "rotate-180 text-white" : ""
                    }`}
                  >
                    <ChevronDown size={18} />
                  </div>
                </button>

                {/* Collapsible Answer Panel */}
                {isOpen && (
                  <div
                    id={`faq-answer-${faq.id}`}
                    role="region"
                    className="px-5 sm:px-6 pb-6 pt-2 border-t border-white/5 space-y-3"
                  >
                    <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                      {faq.answer}
                    </p>

                    <p className="arabic text-xs sm:text-sm text-neutral-400 font-light leading-relaxed pt-2 border-t border-white/5">
                      {faq.arabicAnswer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Additional Help Link */}
        <div className="mt-12 text-center">
          <p className="text-xs text-neutral-400 font-light">
            Have a question not addressed here? Reach out to us via our{" "}
            <a
              href="/contact"
              className="text-[#00e599] hover:underline font-mono font-bold"
            >
              Contact Channels
            </a>{" "}
            or speak directly with committee members.
          </p>
        </div>
      </div>
    </section>
  );
}
