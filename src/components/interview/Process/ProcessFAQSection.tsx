"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Minus } from "lucide-react";
import { PROCESS_FAQS } from "./process-data";

export default function ProcessFAQSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  // Split FAQs into two columns
  const half = Math.ceil(PROCESS_FAQS.length / 2);
  const leftFAQs = PROCESS_FAQS.slice(0, half);
  const rightFAQs = PROCESS_FAQS.slice(half);

  return (
    <section
      id="faq"
      aria-label="Frequently Asked Questions"
      className="relative w-full overflow-hidden bg-[#050708] text-white border-b border-white/10"
    >
      <div className="relative tracks-content-container py-14 md:py-18">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-[-0.025em] text-white">
              Have Questions?
            </h2>
            <p className="arabic mt-1 text-base font-semibold text-white/50">
              أسئلة شائعة
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-4 py-2 border border-white/15 font-mono text-[11px] font-bold tracking-widest uppercase text-[#8f9ea0] hover:text-white hover:border-white/30 transition-colors self-start sm:self-auto"
            style={{ borderRadius: 0 }}
          >
            View More FAQs
          </Link>
        </div>

        {/* 2-Column Accordion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-white/8">
          {/* Left column */}
          <div className="border-r border-white/8">
            {leftFAQs.map((faq, idx) => {
              const isOpen = openId === faq.id;
              const isLast = idx === leftFAQs.length - 1;
              return (
                <div
                  key={faq.id}
                  className={`${!isLast ? "border-b border-white/8" : ""}`}
                >
                  <button
                    type="button"
                    id={`faq-btn-${faq.id}`}
                    onClick={() => toggleFAQ(faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left transition-colors hover:bg-white/[0.02] focus:outline-none focus-visible:bg-white/[0.03]"
                  >
                    <span
                      className={`text-sm font-semibold leading-snug transition-colors ${
                        isOpen ? "text-white" : "text-[#c5cfd4]"
                      }`}
                    >
                      {faq.question}
                    </span>
                    <div
                      className="shrink-0 w-5 h-5 flex items-center justify-center border"
                      style={{
                        borderColor: isOpen
                          ? "rgba(0,229,153,0.5)"
                          : "rgba(255,255,255,0.1)",
                        color: isOpen ? "#00e599" : "#8f9ea0",
                      }}
                    >
                      {isOpen ? <Minus size={11} /> : <Plus size={11} />}
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-answer-${faq.id}`}
                      role="region"
                      aria-labelledby={`faq-btn-${faq.id}`}
                      className="px-5 pb-5 pt-1"
                    >
                      <div className="h-px w-full bg-white/8 mb-3" />
                      <p className="text-xs text-[#8f9ea0] leading-[1.85]">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right column */}
          <div>
            {rightFAQs.map((faq, idx) => {
              const isOpen = openId === faq.id;
              const isLast = idx === rightFAQs.length - 1;
              return (
                <div
                  key={faq.id}
                  className={`${!isLast ? "border-b border-white/8" : ""}`}
                >
                  <button
                    type="button"
                    id={`faq-btn-${faq.id}`}
                    onClick={() => toggleFAQ(faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left transition-colors hover:bg-white/[0.02] focus:outline-none focus-visible:bg-white/[0.03]"
                  >
                    <span
                      className={`text-sm font-semibold leading-snug transition-colors ${
                        isOpen ? "text-white" : "text-[#c5cfd4]"
                      }`}
                    >
                      {faq.question}
                    </span>
                    <div
                      className="shrink-0 w-5 h-5 flex items-center justify-center border"
                      style={{
                        borderColor: isOpen
                          ? "rgba(0,229,153,0.5)"
                          : "rgba(255,255,255,0.1)",
                        color: isOpen ? "#00e599" : "#8f9ea0",
                      }}
                    >
                      {isOpen ? <Minus size={11} /> : <Plus size={11} />}
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-answer-${faq.id}`}
                      role="region"
                      aria-labelledby={`faq-btn-${faq.id}`}
                      className="px-5 pb-5 pt-1"
                    >
                      <div className="h-px w-full bg-white/8 mb-3" />
                      <p className="text-xs text-[#8f9ea0] leading-[1.85]">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
