"use client";

import React, { useState } from "react";
import { ArrowUpRight, Presentation, Users, Sparkles, CheckCircle2 } from "lucide-react";

const inputClass =
  "w-full rounded-none border-0 border-b border-white/15 bg-transparent px-0 py-3 text-[15px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#35d98a] autofill:bg-transparent autofill:text-white";

const labelClass =
  "block font-mono text-[9.5px] tracking-[0.18em] uppercase text-neutral-400 mb-1";

interface FormData {
  fullName: string;
  email: string;
  organization: string;
  phone: string;
  linkedin: string;
  track: string;
  sessionTitle: string;
  proposal: string;
}

const initialForm: FormData = {
  fullName: "",
  email: "",
  organization: "",
  phone: "",
  linkedin: "",
  track: "",
  sessionTitle: "",
  proposal: "",
};

export function SpeakerApplicationSection() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.track || !form.sessionTitle) {
      setError("Please complete all required fields before submitting.");
      return;
    }

    setIsSubmitting(true);
    // Note: Backend integration notice — currently client validated demo
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <section
      id="speaker-application"
      aria-labelledby="speaker-application-heading"
      className="relative w-full overflow-hidden bg-[#050708] text-white py-24 sm:py-28 lg:py-36 border-t border-white/5"
    >
      <div className="mx-auto w-full max-w-[1520px] px-6 md:px-10 lg:px-12">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-20">
          {/* ========================================================= */}
          {/* LEFT COLUMN — EDITORIAL INTRODUCTION                      */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 font-mono text-[10.5px] font-bold tracking-[0.2em] text-[#35d98a] uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-[#35d98a]" />
                <span>COMMUNITY CONTRIBUTIONS</span>
              </div>

              {/* Main Heading */}
              <h2
                id="speaker-application-heading"
                className="mt-6 text-4xl sm:text-5xl lg:text-[58px] font-bold leading-[0.98] tracking-[-0.04em] text-white"
              >
                Know something
                <br />
                <span className="text-[#35d98a]">worth sharing?</span>
              </h2>

              {/* Subheading & Copy */}
              <div className="mt-8 space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                  Want to share your knowledge at IT Club?
                </h3>
                <p className="text-sm sm:text-base leading-[1.7] text-[#aeb4bb] max-w-lg font-sans">
                  We welcome students and community members who want to share practical
                  knowledge, technical experience, project insights, and ideas that help others grow.
                </p>
              </div>

              {/* Three Compact Information Rows with Icons */}
              <div className="mt-10 space-y-5 max-w-lg">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-white/5 border border-white/10 text-[#35d98a]">
                    <Presentation className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Technical Workshops & Sessions</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Knowledge-sharing sessions, deep dives, and hands-on coding demonstrations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-white/5 border border-white/10 text-[#35d98a]">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Mentorship & Demonstrations</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Community events, peer mentoring, and portfolio/project showcases.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-white/5 border border-white/10 text-[#35d98a]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Learning Guild Impact</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Opportunities to contribute directly to the expanding IT Club learning ecosystem.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom note */}
            <div className="mt-12 pt-8 border-t border-white/10 max-w-lg">
              <p className="font-mono text-[10px] tracking-[0.14em] text-neutral-400 uppercase">
                IT CLUB SPEAKER CALL · ACADEMIC YEAR 2026
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN — MINIMALIST EDITORIAL APPLICATION FORM      */}
          {/* ========================================================= */}
          <div className="lg:col-span-7">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-16 px-8 rounded-lg border border-[#35d98a]/30 bg-[#35d98a]/5 text-center">
                <CheckCircle2 className="h-14 w-14 text-[#35d98a] mb-5 animate-in fade-in zoom-in duration-300" />
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Proposal Received
                </h3>
                <p className="mt-3 text-sm sm:text-base text-neutral-300 max-w-md">
                  Thank you for offering to share your knowledge! Submissions are reviewed by the
                  IT Club academic and tracks leadership.
                </p>
                <div className="mt-5 p-4 rounded bg-black/40 border border-white/10 text-xs text-neutral-400 max-w-md font-mono">
                  Submitted as: <span className="text-white font-medium">{form.fullName}</span> ({form.email})
                  <br />
                  Topic: <span className="text-[#35d98a]">{form.sessionTitle}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setForm(initialForm);
                  }}
                  className="mt-6 inline-flex items-center gap-2 font-mono text-xs tracking-wider text-[#35d98a] hover:text-white transition-colors cursor-pointer"
                >
                  Submit another proposal &rarr;
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-7">
                {error && (
                  <div className="p-3.5 bg-red-950/40 border border-red-500/30 rounded text-red-300 text-xs">
                    {error}
                  </div>
                )}

                {/* Row 1: Full Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="speaker-fullName" className={labelClass}>
                      Full Name <span className="text-[#35d98a]">*</span>
                    </label>
                    <input
                      id="speaker-fullName"
                      name="fullName"
                      type="text"
                      required
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Mostafa Ali"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="speaker-email" className={labelClass}>
                      Email Address <span className="text-[#35d98a]">*</span>
                    </label>
                    <input
                      id="speaker-email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Row 2: Organization / Title & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="speaker-organization" className={labelClass}>
                      Title / Organization <span className="text-white/30">(Optional)</span>
                    </label>
                    <input
                      id="speaker-organization"
                      name="organization"
                      type="text"
                      value={form.organization}
                      onChange={handleChange}
                      placeholder="e.g. Student / Software Engineer"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="speaker-phone" className={labelClass}>
                      Phone Number <span className="text-white/30">(Optional)</span>
                    </label>
                    <input
                      id="speaker-phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+20 1..."
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Row 3: LinkedIn Profile & Preferred Track */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="speaker-linkedin" className={labelClass}>
                      LinkedIn Profile <span className="text-white/30">(Optional)</span>
                    </label>
                    <input
                      id="speaker-linkedin"
                      name="linkedin"
                      type="url"
                      value={form.linkedin}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/username"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="speaker-track" className={labelClass}>
                      Preferred Track <span className="text-[#35d98a]">*</span>
                    </label>
                    <select
                      id="speaker-track"
                      name="track"
                      required
                      value={form.track}
                      onChange={handleChange}
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="" disabled className="bg-[#050708]">
                        Select a track
                      </option>
                      <option value="Information Technology" className="bg-[#050708]">
                        Information Technology (IT)
                      </option>
                      <option value="Organizing Committee" className="bg-[#050708]">
                        Organizing Committee (OC)
                      </option>
                      <option value="Social Media" className="bg-[#050708]">
                        Social Media & Content
                      </option>
                      <option value="Research & Development" className="bg-[#050708]">
                        Research & Development (R&amp;D)
                      </option>
                      <option value="Human Resources" className="bg-[#050708]">
                        Human Resources (HR)
                      </option>
                      <option value="Student Relations" className="bg-[#050708]">
                        Student Relations (SR)
                      </option>
                      <option value="General Tech" className="bg-[#050708]">
                        General Tech / Cross-Track
                      </option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Proposed Session Title */}
                <div>
                  <label htmlFor="speaker-sessionTitle" className={labelClass}>
                    Proposed Session Title <span className="text-[#35d98a]">*</span>
                  </label>
                  <input
                    id="speaker-sessionTitle"
                    name="sessionTitle"
                    type="text"
                    required
                    value={form.sessionTitle}
                    onChange={handleChange}
                    placeholder="e.g. Practical Intro to Modern Next.js or Building Microservices"
                    className={inputClass}
                  />
                </div>

                {/* Row 5: Brief Bio / Proposal */}
                <div>
                  <label htmlFor="speaker-proposal" className={labelClass}>
                    Brief Bio / Proposal Description <span className="text-white/30">(Optional)</span>
                  </label>
                  <textarea
                    id="speaker-proposal"
                    name="proposal"
                    rows={4}
                    value={form.proposal}
                    onChange={handleChange}
                    placeholder="Describe your session topic, key takeaways for students, and your background..."
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {/* Submit CTA button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group w-full inline-flex h-14 items-center justify-center gap-3 bg-[#35d98a] px-8 text-xs font-bold tracking-[0.18em] uppercase text-[#050708] transition-all duration-300 hover:bg-white cursor-pointer disabled:opacity-50"
                  >
                    <span>{isSubmitting ? "Submitting Proposal..." : "Submit Your Proposal →"}</span>
                    {!isSubmitting && (
                      <ArrowUpRight
                        size={17}
                        strokeWidth={2}
                        className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      />
                    )}
                  </button>
                  <p className="mt-3 text-[11px] text-center text-neutral-400 font-mono">
                    All proposals are reviewed fairly by IT Club track heads.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
