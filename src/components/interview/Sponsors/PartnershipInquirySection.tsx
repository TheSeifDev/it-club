"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Mail, MapPin } from "lucide-react";
import { PARTNERSHIP_OPPORTUNITIES } from "@/src/data/sponsors";

interface FormState {
  fullName: string;
  organization: string;
  email: string;
  phone: string;
  categoryId: string;
  proposedContribution: string;
  message: string;
}

const initialFormState: FormState = {
  fullName: "",
  organization: "",
  email: "",
  phone: "",
  categoryId: "general",
  proposedContribution: "",
  message: "",
};

interface PartnershipInquirySectionProps {
  selectedCategory?: string;
}

export function PartnershipInquirySection({
  selectedCategory,
}: PartnershipInquirySectionProps) {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevCategory, setPrevCategory] = useState(selectedCategory);

  // Sync selected category during render when prop changes (React recommended pattern)
  if (selectedCategory !== prevCategory) {
    setPrevCategory(selectedCategory);
    if (selectedCategory) {
      setForm((prev) => ({ ...prev, categoryId: selectedCategory }));
    }
  }

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) {
      errs.fullName = "Contact person's name is required.";
    }
    if (!form.organization.trim()) {
      errs.organization = "Organization / company name is required.";
    }
    if (!form.email.trim()) {
      errs.email = "Work email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Please enter a valid email address.";
    }
    if (!form.message.trim()) {
      errs.message = "Please include a brief message or proposed ideas.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Smooth transition with actual form validation feedback
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 450);
  };

  const handleReset = () => {
    setForm(initialFormState);
    setErrors({});
    setSubmitted(false);
  };

  return (
    <section
      id="inquiry"
      aria-label="Partnership Inquiry Form"
      className="relative w-full bg-[#050708] py-20 md:py-28 text-white border-b border-white/10"
    >
      {/* Anchor alias for backwards compatibility */}
      <span id="inquire" className="absolute top-0" aria-hidden="true" />

      <div className="mx-auto w-full max-w-7xl px-6">
        {/* Section Header */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs font-semibold tracking-[0.2em] text-[#35d98a] mb-6">
          <span>05</span>
          <span>&bull;</span>
          <span className="text-white">START A CONVERSATION</span>
          <span className="text-neutral-500">|</span>
          <span className="arabic text-sm text-neutral-400">تواصل معنا</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start mb-16">
          <div className="lg:col-span-7">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight text-white">
              Let&apos;s build
              <br />
              <span className="text-neutral-400">something real together.</span>
            </h2>
          </div>

          <div className="lg:col-span-5">
            <p className="text-sm sm:text-base text-neutral-300 font-light leading-relaxed">
              Whether you are exploring developer tooling adoption, workshop
              instruction, hardware grants, or event collaboration &mdash; our
              leadership team is ready to design a purposeful partnership.
            </p>
          </div>
        </div>

        {/* Form and Contact Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Form Container */}
          <div className="lg:col-span-8 p-6 sm:p-10 bg-[#080b0d] border border-white/10">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-14 w-14 rounded-full bg-[#35d98a]/15 border border-[#35d98a]/40 flex items-center justify-center mb-6">
                  <CheckCircle2 size={28} className="text-[#35d98a]" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">
                  Inquiry Received
                </h3>

                <p className="text-sm text-neutral-300 max-w-md mb-2 font-light leading-relaxed">
                  Thank you, <span className="text-white font-medium">{form.fullName}</span> from{" "}
                  <span className="text-white font-medium">{form.organization}</span>.
                </p>

                <p className="text-xs text-neutral-400 max-w-md mb-8 font-light leading-relaxed">
                  Our partnership leadership will review your inquiry and follow
                  up at <span className="text-[#35d98a] font-mono">{form.email}</span> within
                  24&ndash;48 business hours.
                </p>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Organization Name */}
                  <div>
                    <label
                      htmlFor="organization"
                      className="block text-xs font-mono font-medium uppercase tracking-wider text-neutral-300 mb-2"
                    >
                      Organization / Company <span className="text-[#35d98a]">*</span>
                    </label>
                    <input
                      id="organization"
                      name="organization"
                      type="text"
                      value={form.organization}
                      onChange={handleChange}
                      placeholder="e.g. Acme Cloud, DevStudio"
                      className={`w-full bg-white/[0.03] border text-xs text-white px-4 py-3 placeholder:text-neutral-600 focus:outline-none transition-colors ${
                        errors.organization
                          ? "border-red-500/80 focus:border-red-500"
                          : "border-white/10 focus:border-[#35d98a]"
                      }`}
                    />
                    {errors.organization && (
                      <p className="mt-1 text-[11px] text-red-400 font-mono">
                        {errors.organization}
                      </p>
                    )}
                  </div>

                  {/* Contact Full Name */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-xs font-mono font-medium uppercase tracking-wider text-neutral-300 mb-2"
                    >
                      Contact Person <span className="text-[#35d98a]">*</span>
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Sarah Jenkins"
                      className={`w-full bg-white/[0.03] border text-xs text-white px-4 py-3 placeholder:text-neutral-600 focus:outline-none transition-colors ${
                        errors.fullName
                          ? "border-red-500/80 focus:border-red-500"
                          : "border-white/10 focus:border-[#35d98a]"
                      }`}
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-[11px] text-red-400 font-mono">
                        {errors.fullName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Work Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-mono font-medium uppercase tracking-wider text-neutral-300 mb-2"
                    >
                      Work Email <span className="text-[#35d98a]">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="sarah@company.com"
                      className={`w-full bg-white/[0.03] border text-xs text-white px-4 py-3 placeholder:text-neutral-600 focus:outline-none transition-colors ${
                        errors.email
                          ? "border-red-500/80 focus:border-red-500"
                          : "border-white/10 focus:border-[#35d98a]"
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-[11px] text-red-400 font-mono">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone / WhatsApp */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-xs font-mono font-medium uppercase tracking-wider text-neutral-300 mb-2"
                    >
                      Phone / WhatsApp (Optional)
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+20 100 000 0000"
                      className="w-full bg-white/[0.03] border border-white/10 focus:border-[#35d98a] text-xs text-white px-4 py-3 placeholder:text-neutral-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Partnership Category */}
                  <div>
                    <label
                      htmlFor="categoryId"
                      className="block text-xs font-mono font-medium uppercase tracking-wider text-neutral-300 mb-2"
                    >
                      Collaboration Area
                    </label>
                    <select
                      id="categoryId"
                      name="categoryId"
                      value={form.categoryId}
                      onChange={handleChange}
                      className="w-full bg-[#0d1114] border border-white/10 focus:border-[#35d98a] text-xs text-white px-4 py-3 focus:outline-none transition-colors"
                    >
                      <option value="general">General Partnership Inquiry</option>
                      {PARTNERSHIP_OPPORTUNITIES.map((opp) => (
                        <option key={opp.id} value={opp.id}>
                          {opp.categoryLabel} ({opp.title})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Proposed Contribution */}
                  <div>
                    <label
                      htmlFor="proposedContribution"
                      className="block text-xs font-mono font-medium uppercase tracking-wider text-neutral-300 mb-2"
                    >
                      Primary Contribution Type
                    </label>
                    <input
                      id="proposedContribution"
                      name="proposedContribution"
                      type="text"
                      value={form.proposedContribution}
                      onChange={handleChange}
                      placeholder="e.g. Cloud Credits, Workshop, Hardware"
                      className="w-full bg-white/[0.03] border border-white/10 focus:border-[#35d98a] text-xs text-white px-4 py-3 placeholder:text-neutral-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Short Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-xs font-mono font-medium uppercase tracking-wider text-neutral-300 mb-2"
                  >
                    Collaboration Scope / Message <span className="text-[#35d98a]">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us about your organization and how you envision collaborating with IT Club..."
                    className={`w-full bg-white/[0.03] border text-xs text-white p-4 placeholder:text-neutral-600 focus:outline-none transition-colors resize-y ${
                      errors.message
                        ? "border-red-500/80 focus:border-red-500"
                        : "border-white/10 focus:border-[#35d98a]"
                    }`}
                  />
                  {errors.message && (
                    <p className="mt-1 text-[11px] text-red-400 font-mono">
                      {errors.message}
                    </p>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-[#35d98a] hover:bg-[#40f09b] disabled:opacity-50 text-[#050708] font-bold text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(53,217,138,0.25)] hover:shadow-[0_0_35px_rgba(53,217,138,0.45)] focus:outline-none focus:ring-2 focus:ring-[#35d98a]"
                  >
                    <span>{isSubmitting ? "Sending..." : "Submit Inquiry"}</span>
                    <ArrowRight
                      size={15}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Direct Contact & Campus Details */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 bg-[#080b0d] border border-white/10">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white mb-4">
                Direct Inquiries
              </h3>

              <div className="space-y-4 text-xs font-light text-neutral-300">
                <div className="flex items-start gap-3">
                  <Mail size={16} className="text-[#35d98a] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-mono text-[10px] text-neutral-500 uppercase">
                      OFFICIAL EMAIL
                    </div>
                    <a
                      href="mailto:contact@itclub.tech"
                      className="hover:text-white font-mono transition-colors text-white"
                    >
                      contact@itclub.tech
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-3 border-t border-white/10">
                  <MapPin size={16} className="text-[#35d98a] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-mono text-[10px] text-neutral-500 uppercase">
                      CAMPUS HEADQUARTERS
                    </div>
                    <p className="text-neutral-400">
                      Benha University of Applied Technology (BATU)
                      <br />
                      Cairo-Alex Desert Road, Egypt
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#080b0d] border border-white/10">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white mb-2">
                Response Guarantee
              </h3>
              <p className="text-xs text-neutral-400 font-light leading-relaxed">
                All inquiries are directly dispatched to the club president,
                vice president, and public relations lead. We guarantee an
                initial response within two business days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PartnershipInquirySection;
