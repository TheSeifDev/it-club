"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  Eye,
  EyeOff,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileText,
  Loader2,
  Lock,
} from "lucide-react";
import type { ApplicationDetail, ApplicationStatus } from "../../../../lib/admin/types";
import {
  STATUS_METADATA,
  TRACK_METADATA,
  ACADEMIC_YEAR_METADATA,
  VALID_STATUS_TRANSITIONS,
} from "../../../../lib/admin/transitions";

interface Props {
  application: ApplicationDetail;
  currentStaffRole: string;
}

export default function ApplicantDetailClient({ application: initialApp, currentStaffRole }: Props) {
  const router = useRouter();
  const [app, setApp] = useState<ApplicationDetail>(initialApp);
  const [revealNid, setRevealNid] = useState(false);

  // Status Action State
  const [actionTargetStatus, setActionTargetStatus] = useState<ApplicationStatus | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState("");

  // Reviewer Notes State
  const [notesText, setNotesText] = useState(initialApp.reviewer_notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesMessage, setNotesMessage] = useState("");

  // Invitation Reissue State
  const [isReissuingInvite, setIsReissuingInvite] = useState(false);
  const [reissueMessage, setReissueMessage] = useState("");
  const [reissueError, setReissueError] = useState("");

  const trackMeta = TRACK_METADATA[app.primary_track] || {
    name: app.primary_track,
    arabicName: app.primary_track,
    abbreviation: app.primary_track.toUpperCase(),
    color: "#00e599",
  };

  const secondaryMeta = app.secondary_track ? TRACK_METADATA[app.secondary_track] : null;

  const currentStatusMeta = STATUS_METADATA[app.status] || {
    label: app.status,
    arabicLabel: app.status,
    bgClass: "bg-white/10",
    borderClass: "border-white/20",
    textClass: "text-white",
    dotClass: "bg-white",
    description: "",
  };

  const allowedNextStatuses = VALID_STATUS_TRANSITIONS[app.status] || [];

  // Handle Status Update Decision
  const handleConfirmDecision = async () => {
    if (!actionTargetStatus) return;

    setIsSubmittingAction(true);
    setActionError("");
    setFeedbackSuccess("");

    try {
      const res = await fetch(`/api/admin/applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextStatus: actionTargetStatus,
          reviewerNotes: decisionNote.trim() ? decisionNote.trim() : undefined,
          expectedCurrentStatus: app.status, // Concurrency protection
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setActionError(json.error || "Failed to update application status.");
        setIsSubmittingAction(false);
        return;
      }

      setApp(json.application);
      if (decisionNote.trim()) {
        setNotesText(decisionNote.trim());
      }
      const deliverySuffix = json.shortlistDelivery?.message
        ? ` (${json.shortlistDelivery.message})`
        : json.invitationDelivery?.message
        ? ` (${json.invitationDelivery.message})`
        : json.interviewDelivery?.message
        ? ` (${json.interviewDelivery.message})`
        : "";
      setFeedbackSuccess(`Decision recorded: Status updated to ${STATUS_METADATA[actionTargetStatus].label}.${deliverySuffix}`);
      setActionTargetStatus(null);
      setDecisionNote("");
      router.refresh();
    } catch {
      setActionError("A network error occurred while updating the status. Please retry.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Reissue Invitation Email
  const handleReissueInvite = async () => {
    setIsReissuingInvite(true);
    setReissueMessage("");
    setReissueError("");

    try {
      const res = await fetch(`/api/admin/applications/${app.id}/resend-invitation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });

      const json = await res.json();
      if (!res.ok) {
        setReissueError(json.error || "Failed to reissue invitation.");
      } else {
        setReissueMessage(json.message || "Invitation dispatched successfully.");
        setTimeout(() => setReissueMessage(""), 8000);
      }
    } catch {
      setReissueError("Network error while attempting to reissue invitation.");
    } finally {
      setIsReissuingInvite(false);
    }
  };

  // Handle Save Internal Notes
  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    setNotesMessage("");

    try {
      const res = await fetch(`/api/admin/applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saveNotesOnly: true,
          notes: notesText,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setNotesMessage(json.error || "Failed to save notes.");
      } else {
        setNotesMessage("Notes saved successfully.");
        setTimeout(() => setNotesMessage(""), 3500);
      }
    } catch {
      setNotesMessage("Network error saving notes.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const sanitizedWaNumber = app.whatsapp.replace(/[^0-9]/g, "");

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Return Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-white/50 hover:text-[#00e599] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to All Applications</span>
        </Link>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-white/40">APPLICATION REF:</span>
          <span className="text-[#00e599] font-bold tracking-widest">{app.application_reference}</span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {feedbackSuccess && (
        <div className="border border-[#00e599]/40 bg-[#00e599]/10 p-4 text-xs font-mono text-[#00e599] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{feedbackSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackSuccess("")}
            className="text-white/50 hover:text-white"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Applicant Submitted Information (8 cols)     */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Card */}
          <div className="border border-white/10 bg-[#080a0c] p-6 sm:p-8 relative overflow-hidden">
            <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-[#00e599] via-[#18c8ed] to-[#9b7cff]" />

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 font-mono text-xs text-white/40 uppercase">
                  <span>REGISTERED APPLICANT</span>
                  <span>·</span>
                  <span>SEASON 2026</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {app.full_name}
                </h1>
                <p className="font-mono text-xs text-white/50 mt-1">
                  Student ID: <span className="text-white font-semibold">{app.academic_id}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="px-3 py-1 border text-xs uppercase font-bold tracking-wider"
                  style={{
                    borderColor: `${trackMeta.color}40`,
                    color: trackMeta.color,
                    backgroundColor: `${trackMeta.color}10`,
                  }}
                >
                  {trackMeta.abbreviation} — {trackMeta.name}
                </span>
              </div>
            </div>
          </div>

          {/* 1. Personal Information */}
          <div className="border border-white/10 bg-[#080a0c] p-6 space-y-4">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#00e599] flex items-center gap-2 pb-3 border-b border-white/5">
              <Shield size={14} />
              <span>1. PERSONAL INFORMATION</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <span className="text-white/40 block text-[10px] uppercase mb-1">NATIONAL ID</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold select-all">
                    {revealNid ? app.national_id : app.national_id_masked}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRevealNid(!revealNid)}
                    className="p-1 border border-white/10 hover:border-white/20 text-white/50 hover:text-white transition-colors"
                    title={revealNid ? "Mask National ID" : "Reveal full National ID"}
                  >
                    {revealNid ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-white/40 block text-[10px] uppercase mb-1">UNIVERSITY LOGIN EMAIL (AUTH)</span>
                <a
                  href={`mailto:${app.university_email}`}
                  className="text-white hover:text-[#00e599] transition-colors flex items-center gap-1.5"
                >
                  <Mail size={12} className="text-white/40" />
                  <span className="truncate">{app.university_email}</span>
                </a>
              </div>

              <div>
                <span className="text-white/40 block text-[10px] uppercase mb-1">PHONE NUMBER</span>
                <a
                  href={`tel:${app.phone}`}
                  className="text-white hover:text-[#00e599] transition-colors flex items-center gap-1.5"
                >
                  <Phone size={12} className="text-white/40" />
                  <span>{app.phone}</span>
                </a>
              </div>

              <div>
                <span className="text-white/40 block text-[10px] uppercase mb-1">WHATSAPP</span>
                <a
                  href={`https://wa.me/${sanitizedWaNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00e599] hover:underline flex items-center gap-1.5"
                >
                  <MessageSquare size={12} />
                  <span>{app.whatsapp} (Chat &rarr;)</span>
                </a>
              </div>

              <div className="sm:col-span-2">
                <span className="text-white/40 block text-[10px] uppercase mb-1">NOTIFICATION RECIPIENT (PERSONAL GMAIL)</span>
                {app.google_email ? (
                  <a
                    href={`mailto:${app.google_email}`}
                    className="text-[#00e599] hover:underline transition-colors flex items-center gap-1.5"
                  >
                    <Mail size={12} />
                    <span>{app.google_email} (All notifications dispatched here)</span>
                  </a>
                ) : (
                  <span className="text-white/50 flex items-center gap-1.5">
                    <Mail size={12} className="text-white/30" />
                    <span>{app.university_email}</span>
                    <span className="text-amber-400 text-[10px]">(Fallback: No Google email provided)</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Academic Information */}
          <div className="border border-white/10 bg-[#080a0c] p-6 space-y-4">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#18c8ed] flex items-center gap-2 pb-3 border-b border-white/5">
              <Calendar size={14} />
              <span>2. ACADEMIC BACKGROUND</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <span className="text-white/40 block text-[10px] uppercase mb-1">ACADEMIC YEAR</span>
                <span className="text-white font-semibold">
                  {ACADEMIC_YEAR_METADATA[app.academic_year] || app.academic_year}
                </span>
              </div>

              <div>
                <span className="text-white/40 block text-[10px] uppercase mb-1">DEPARTMENT / MAJOR</span>
                <span className="text-white font-semibold">{app.department}</span>
              </div>
            </div>
          </div>

          {/* 3. Experience & Skills */}
          <div className="border border-white/10 bg-[#080a0c] p-6 space-y-4">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#eaff00] flex items-center gap-2 pb-3 border-b border-white/5">
              <Sparkles size={14} />
              <span>3. EXPERIENCE & TECHNICAL SKILLS</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-mono text-white/40 block text-[10px] uppercase mb-1">EXPERIENCE LEVEL</span>
                <span className="font-mono text-xs uppercase px-2 py-0.5 border border-white/15 bg-white/[0.03] text-white">
                  {app.experience_level.replace("_", " ")}
                </span>
              </div>

              {app.skills && (
                <div>
                  <span className="font-mono text-white/40 block text-[10px] uppercase mb-1">DECLARED SKILLS</span>
                  <div className="border border-white/5 bg-white/[0.02] p-3 text-white/90 leading-relaxed font-sans whitespace-pre-wrap">
                    {app.skills}
                  </div>
                </div>
              )}

              {app.experience_details && (
                <div>
                  <span className="font-mono text-white/40 block text-[10px] uppercase mb-1">PRACTICAL DETAILS & PROJECTS</span>
                  <div className="border border-white/5 bg-white/[0.02] p-3 text-white/80 leading-relaxed font-sans whitespace-pre-wrap">
                    {app.experience_details}
                  </div>
                </div>
              )}

              {app.volunteer_experience && (
                <div>
                  <span className="font-mono text-white/40 block text-[10px] uppercase mb-1">VOLUNTEERING & COMMUNITY BACKGROUND</span>
                  <div className="border border-white/5 bg-white/[0.02] p-3 text-white/80 leading-relaxed font-sans whitespace-pre-wrap">
                    {app.volunteer_experience}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Track Preferences & Written Answers */}
          <div className="border border-white/10 bg-[#080a0c] p-6 space-y-4">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#ff3ca7] flex items-center gap-2 pb-3 border-b border-white/5">
              <FileText size={14} />
              <span>4. TRACK PREFERENCES & MOTIVATION</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
                <div>
                  <span className="text-white/40 block text-[10px] uppercase mb-1">PRIMARY TRACK</span>
                  <span
                    className="px-2 py-0.5 border text-xs uppercase font-bold"
                    style={{
                      borderColor: `${trackMeta.color}40`,
                      color: trackMeta.color,
                      backgroundColor: `${trackMeta.color}10`,
                    }}
                  >
                    {trackMeta.name}
                  </span>
                </div>

                {secondaryMeta && (
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase mb-1">SECONDARY TRACK</span>
                    <span
                      className="px-2 py-0.5 border text-xs uppercase font-bold"
                      style={{
                        borderColor: `${secondaryMeta.color}40`,
                        color: secondaryMeta.color,
                        backgroundColor: `${secondaryMeta.color}10`,
                      }}
                    >
                      {secondaryMeta.name}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <span className="font-mono text-white/40 block text-[10px] uppercase mb-1">WHY DO YOU WANT TO JOIN IT CLUB? (MOTIVATION)</span>
                <div className="border border-white/5 bg-white/[0.02] p-3.5 text-white/90 leading-relaxed font-sans text-sm whitespace-pre-wrap">
                  {app.motivation}
                </div>
              </div>

              <div>
                <span className="font-mono text-white/40 block text-[10px] uppercase mb-1">WHAT DO YOU HOPE TO LEARN? (LEARNING GOAL)</span>
                <div className="border border-white/5 bg-white/[0.02] p-3.5 text-white/90 leading-relaxed font-sans text-sm whitespace-pre-wrap">
                  {app.learning_goal}
                </div>
              </div>

              {app.contribution && (
                <div>
                  <span className="font-mono text-white/40 block text-[10px] uppercase mb-1">HOW CAN YOU CONTRIBUTE TO THE TEAM?</span>
                  <div className="border border-white/5 bg-white/[0.02] p-3.5 text-white/90 leading-relaxed font-sans text-sm whitespace-pre-wrap">
                    {app.contribution}
                  </div>
                </div>
              )}

              {app.availability && (
                <div>
                  <span className="font-mono text-white/40 block text-[10px] uppercase mb-1">AVAILABILITY & COMMITMENT</span>
                  <div className="border border-white/5 bg-white/[0.02] p-3 text-white/80 leading-relaxed font-sans whitespace-pre-wrap">
                    {app.availability}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Action Center & Reviewer Notes (4 cols)    */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 space-y-6 sticky top-20">
          {/* Status & Review Decisions Card */}
          <div className="border border-white/10 bg-[#080a0c] p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">
                  CURRENT STATUS
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/30">
                  {currentStaffRole.toUpperCase()} REVIEW
                </span>
              </div>

              <div
                className={`p-3 border flex items-center justify-between ${currentStatusMeta.bgClass} ${currentStatusMeta.borderClass}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${currentStatusMeta.dotClass}`} />
                  <span className={`font-mono text-sm font-bold uppercase ${currentStatusMeta.textClass}`}>
                    {currentStatusMeta.label}
                  </span>
                </div>
                <span className="arabic text-xs font-semibold text-white/60">
                  {currentStatusMeta.arabicLabel}
                </span>
              </div>

              <p className="text-[11px] text-white/50 mt-2 font-mono leading-relaxed">
                {currentStatusMeta.description}
              </p>
            </div>

            {/* Reviewer Attribution if reviewed */}
            {app.reviewed_at && (
              <div className="pt-3 border-t border-white/5 font-mono text-[10px] text-white/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span>LAST EVALUATED:</span>
                  <span className="text-white/70">
                    {new Date(app.reviewed_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {app.reviewed_by && (
                  <div className="flex items-center justify-between">
                    <span>REVIEWER ID:</span>
                    <span className="text-white/50 truncate max-w-[120px]">{app.reviewed_by}</span>
                  </div>
                )}
              </div>
            )}

            {/* Transition Actions */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-2">
                WORKFLOW DECISION ACTIONS
              </span>

              {allowedNextStatuses.length === 0 ? (
                <p className="text-xs font-mono text-white/40">No further status transitions available.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 font-mono text-xs">
                  {allowedNextStatuses.includes("UNDER_REVIEW") && (
                    <button
                      type="button"
                      onClick={() => setActionTargetStatus("UNDER_REVIEW")}
                      className="w-full text-left px-3 py-2 border border-sky-500/30 hover:border-sky-500/60 bg-sky-500/10 text-sky-300 font-semibold transition-colors cursor-pointer"
                    >
                      &bull; Start Review &rarr; (قيد المراجعة)
                    </button>
                  )}

                  {allowedNextStatuses.includes("SHORTLISTED") && (
                    <button
                      type="button"
                      onClick={() => setActionTargetStatus("SHORTLISTED")}
                      className="w-full text-left px-3 py-2 border border-purple-500/30 hover:border-purple-500/60 bg-purple-500/10 text-purple-300 font-semibold transition-colors cursor-pointer"
                    >
                      &bull; Shortlist for Interview &rarr; (ترشيح للمقابلة)
                    </button>
                  )}

                  {allowedNextStatuses.includes("ACCEPTED") && (
                    <button
                      type="button"
                      onClick={() => setActionTargetStatus("ACCEPTED")}
                      className="w-full text-left px-3 py-2 border border-[#00e599]/40 hover:border-[#00e599]/80 bg-[#00e599]/10 text-[#00e599] font-bold transition-colors cursor-pointer"
                    >
                      &bull; Accept Applicant &rarr; (قبول نهائي)
                    </button>
                  )}

                  {allowedNextStatuses.includes("NEEDS_CORRECTION") && (
                    <button
                      type="button"
                      onClick={() => setActionTargetStatus("NEEDS_CORRECTION")}
                      className="w-full text-left px-3 py-2 border border-orange-500/30 hover:border-orange-500/60 bg-orange-500/10 text-orange-300 transition-colors cursor-pointer"
                    >
                      &bull; Request Data Correction &rarr; (طلب تعديل)
                    </button>
                  )}

                  {allowedNextStatuses.includes("WAITLISTED") && (
                    <button
                      type="button"
                      onClick={() => setActionTargetStatus("WAITLISTED")}
                      className="w-full text-left px-3 py-2 border border-zinc-500/30 hover:border-zinc-500/60 bg-zinc-500/10 text-zinc-300 transition-colors cursor-pointer"
                    >
                      &bull; Add to Waitlist &rarr; (قائمة الانتظار)
                    </button>
                  )}

                  {allowedNextStatuses.includes("REJECTED") && (
                    <button
                      type="button"
                      onClick={() => setActionTargetStatus("REJECTED")}
                      className="w-full text-left px-3 py-2 border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 text-rose-300 transition-colors cursor-pointer"
                    >
                      &bull; Reject Application &rarr; (رفض)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Student Invitation & Portal Activation Card */}
          <div className="border border-white/10 bg-[#080a0c] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Mail size={13} className="text-[#00e599]" />
                <span>STUDENT INVITATION & PORTAL</span>
              </span>
              {app.activated_at ? (
                <span className="px-2 py-0.5 border border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599] font-mono text-[10px] font-bold uppercase">
                  ACTIVATED
                </span>
              ) : app.status === "SHORTLISTED" || app.status === "ACCEPTED" ? (
                <span className="px-2 py-0.5 border border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono text-[10px] font-bold uppercase">
                  PENDING ACTIVATION
                </span>
              ) : (
                <span className="px-2 py-0.5 border border-white/20 bg-white/5 text-white/50 font-mono text-[10px] font-bold uppercase">
                  NOT ACTIVATED
                </span>
              )}
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-white/40 block text-[10px] uppercase">UNIVERSITY LOGIN EMAIL</span>
                <span className="text-white font-semibold">{app.university_email}</span>
                <span className="text-[10px] text-white/40 block mt-0.5">
                  (Canonical Supabase Auth & Student Portal login identity)
                </span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px] uppercase">NOTIFICATION RECIPIENT</span>
                {app.google_email ? (
                  <>
                    <span className="text-[#00e599] font-semibold">{app.google_email}</span>
                    <span className="text-[10px] text-white/50 block mt-0.5">
                      (Personal Gmail — all invitations & status emails dispatched here)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-amber-300 font-semibold">{app.university_email}</span>
                    <span className="text-[10px] text-amber-400/80 block mt-0.5">
                      (Fallback: Personal Google email missing/invalid)
                    </span>
                  </>
                )}
              </div>
              <div>
                <span className="text-white/40 block text-[10px] uppercase">ACTIVATION STATUS</span>
                <span className={app.activated_at ? "text-[#00e599]" : app.status === "SHORTLISTED" || app.status === "ACCEPTED" ? "text-amber-300" : "text-white/50"}>
                  {app.activated_at
                    ? `Activated on ${new Date(app.activated_at).toLocaleString()}`
                    : app.status === "SHORTLISTED" || app.status === "ACCEPTED"
                    ? "Pending activation — invitation dispatched to notification recipient"
                    : "Not activated (Eligible after shortlisting or acceptance)"}
                </span>
              </div>
            </div>

            {(app.status === "SHORTLISTED" || app.status === "ACCEPTED") && (
              <div className="pt-2 border-t border-white/5 space-y-2">
                <button
                  type="button"
                  disabled={isReissuingInvite}
                  onClick={handleReissueInvite}
                  className="w-full py-2.5 px-3 border border-[#00e599]/30 hover:border-[#00e599] bg-[#00e599]/10 hover:bg-[#00e599]/20 text-[#00e599] font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {isReissuingInvite ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>DISPATCHING INVITATION...</span>
                    </>
                  ) : (
                    <>
                      <Mail size={13} />
                      <span>REISSUE INVITATION EMAIL</span>
                    </>
                  )}
                </button>
                {reissueMessage && (
                  <p className="font-mono text-[11px] leading-relaxed text-[#00e599]">
                    {reissueMessage}
                  </p>
                )}
                {reissueError && (
                  <p className="font-mono text-[11px] leading-relaxed text-red-400">
                    {reissueError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Internal Reviewer Notes Card */}
          <div className="border border-white/10 bg-[#080a0c] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                INTERNAL COMMITTEE NOTES
              </span>
              <Lock size={13} className="text-white/40" />
            </div>

            <p className="text-[11px] text-white/40 leading-relaxed font-sans">
              Private review notes visible strictly to authorized staff. Record committee evaluation feedback or reasons for decision.
            </p>

            <textarea
              rows={5}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add internal evaluation feedback, interview notes, or committee observations..."
              className="w-full border border-white/10 bg-white/[0.02] p-3 font-sans text-xs text-white placeholder:text-white/30 focus:border-[#00e599] focus:outline-none transition-colors resize-none"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="font-mono text-[10px] text-[#00e599]">{notesMessage}</span>
              <button
                type="button"
                disabled={isSavingNotes}
                onClick={handleSaveNotes}
                className="bg-white/10 hover:bg-white/20 text-white font-mono text-xs px-4 py-2 transition-colors disabled:opacity-40 cursor-pointer"
              >
                {isSavingNotes ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DECISION CONFIRMATION MODAL                               */}
      {/* ========================================================= */}
      {actionTargetStatus && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="border border-white/15 bg-[#080a0c] w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-[#00e599]" />
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                  CONFIRM RECRUITMENT DECISION
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActionTargetStatus(null)}
                className="text-white/40 hover:text-white text-lg font-mono"
              >
                &times;
              </button>
            </div>

            {actionError && (
              <div className="p-3 border border-rose-500/40 bg-rose-500/10 text-xs text-rose-300 font-mono">
                {actionError}
              </div>
            )}

            <div className="space-y-3 font-mono text-xs">
              <p className="text-white/70">
                You are about to change the application status for applicant:
              </p>
              <div className="p-3 border border-white/10 bg-white/[0.02]">
                <p className="font-sans font-bold text-white text-sm">{app.full_name}</p>
                <p className="text-white/40 text-[11px]">{app.application_reference} · {trackMeta.name}</p>
              </div>

              <div className="flex items-center justify-between py-2 border-y border-white/5">
                <span className="text-white/40">TARGET DECISION:</span>
                <span
                  className={`px-3 py-1 border text-xs uppercase font-bold ${STATUS_METADATA[actionTargetStatus].bgClass} ${STATUS_METADATA[actionTargetStatus].borderClass} ${STATUS_METADATA[actionTargetStatus].textClass}`}
                >
                  {STATUS_METADATA[actionTargetStatus].label}
                </span>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-white/50 mb-1.5">
                  INTERNAL DECISION NOTE (OPTIONAL)
                </label>
                <textarea
                  rows={3}
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="Reason for decision, committee remarks, or candidate feedback..."
                  className="w-full border border-white/10 bg-white/[0.02] p-2.5 text-xs text-white placeholder:text-white/30 focus:border-[#00e599] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 font-mono text-xs">
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={() => setActionTargetStatus(null)}
                className="px-4 py-2 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                CANCEL
              </button>

              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={handleConfirmDecision}
                className="px-5 py-2 bg-[#00e599] hover:bg-[#00c985] text-[#050708] font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAction ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>RECORDING...</span>
                  </>
                ) : (
                  <span>CONFIRM DECISION</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
