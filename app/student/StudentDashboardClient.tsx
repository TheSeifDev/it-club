"use client";

import React, { useState } from "react";
import NextImage from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  LogOut,
  MapPin,
  QrCode,
  User,
} from "lucide-react";
import type { ApplicationDetail } from "../../lib/admin/types.ts";
import {
  ACADEMIC_YEAR_METADATA,
  STATUS_METADATA,
  TRACK_METADATA,
  isCommitteeTrack,
} from "../../lib/admin/transitions.ts";
import ResponsiveNav from "@/src/components/interview/navigation/ResponsiveNav";
import Footer from "@/src/components/interview/Home/Footer";

interface StudentDashboardProps {
  application: ApplicationDetail;
  userEmail: string;
  activatedAt: string;
  qrInfo: {
    eligible: boolean;
    status?: string;
    qrDataUrl?: string;
    expiresAt?: string;
    checkedInAt?: string | null;
  };
}

export default function StudentDashboardClient({
  application,
  userEmail,
  activatedAt,
  qrInfo,
}: StudentDashboardProps) {
  const [showNationalId, setShowNationalId] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [isExportingCard, setIsExportingCard] = useState(false);

  const statusMeta = STATUS_METADATA[application.status] || {
    label: application.status,
    arabicLabel: "",
    bgClass: "bg-white/10",
    borderClass: "border-white/20",
    textClass: "text-white",
    dotClass: "bg-white",
    description: "Status update pending.",
  };

  const primaryMeta = isCommitteeTrack(application.primary_track)
    ? TRACK_METADATA[application.primary_track]
    : null;

  const secondaryMeta =
    application.secondary_track && isCommitteeTrack(application.secondary_track)
      ? TRACK_METADATA[application.secondary_track]
      : null;

  const yearLabel = ACADEMIC_YEAR_METADATA[application.academic_year] || application.academic_year;
  const interviewDate = application.interview_date || null;
  const interviewTime = application.interview_time || null;
  const interviewLocation = application.interview_location || null;
  const hasInterview = Boolean(interviewDate || interviewTime || interviewLocation);

  const copyRefCode = () => {
    navigator.clipboard.writeText(application.application_reference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleDownloadQrOnly = () => {
    if (!qrInfo.eligible) return;
    const link = document.createElement("a");
    link.href = "/api/student/qr?format=png";
    link.download = "IT-Club-Interview-QR.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadInformationCard = async () => {
    if (isExportingCard) return;
    setIsExportingCard(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      ctx.fillStyle = "#050708";
      ctx.fillRect(0, 0, 1200, 720);
      ctx.fillStyle = "#080a0c";
      ctx.fillRect(36, 36, 1128, 648);
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 2;
      ctx.strokeRect(36, 36, 1128, 648);

      const grad = ctx.createLinearGradient(36, 36, 1164, 36);
      grad.addColorStop(0, "#00e599");
      grad.addColorStop(0.5, "#18c8ed");
      grad.addColorStop(1, "#9b7cff");
      ctx.fillStyle = grad;
      ctx.fillRect(36, 36, 1128, 8);

      // Draw official IT Club logo onto the card header
      try {
        const logoImage = new window.Image();
        logoImage.src = "/logo.webp";
        await new Promise((resolve) => {
          logoImage.onload = resolve;
          logoImage.onerror = resolve;
        });
        if (logoImage.complete && logoImage.naturalWidth > 0) {
          ctx.drawImage(logoImage, 1030, 60, 58, 58);
        }
      } catch (err) {
        console.warn("Failed to load logo on card canvas:", err);
      }

      ctx.fillStyle = "#00e599";
      ctx.font = "700 16px Montserrat, sans-serif";
      ctx.fillText("IT CLUB RECRUITMENT 2026", 74, 88);
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 34px Montserrat, sans-serif";
      ctx.fillText("Official Candidate Information Card", 74, 132);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 15px Alexandria, sans-serif";
      ctx.fillText("بطاقة المرشح الرسمية للمقابلة والتحقق", 74, 164);

      drawCardField(ctx, "Candidate", application.full_name, 74, 230);
      drawCardField(ctx, "Reference", application.application_reference, 74, 310, "#00e599");
      drawCardField(
        ctx,
        "Track",
        primaryMeta ? `${primaryMeta.abbreviation} - ${primaryMeta.name}` : application.primary_track,
        74,
        390,
        primaryMeta?.color || "#18c8ed"
      );
      drawCardField(ctx, "Academic", `${application.department} / ${yearLabel}`, 74, 470);
      drawCardField(ctx, "Status", statusMeta.label, 74, 550, "#00e599");

      ctx.fillStyle = "#0a0f14";
      ctx.fillRect(744, 140, 344, 398);
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.strokeRect(744, 140, 344, 398);
      ctx.fillStyle = "#00e599";
      ctx.font = "800 14px Montserrat, sans-serif";
      ctx.fillText("ATTENDANCE QR", 858, 180);

      if (qrInfo.qrDataUrl) {
        const qrImage = new Image();
        qrImage.src = qrInfo.qrDataUrl;
        await new Promise((resolve) => {
          qrImage.onload = resolve;
          qrImage.onerror = resolve;
        });
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(792, 210, 248, 248);
        ctx.drawImage(qrImage, 802, 220, 228, 228);
      } else {
        ctx.fillStyle = "#111827";
        ctx.fillRect(792, 210, 248, 248);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "700 16px Montserrat, sans-serif";
        ctx.fillText("QR pending", 872, 340);
      }

      ctx.fillStyle = "#64748b";
      ctx.font = "500 13px Montserrat, sans-serif";
      ctx.fillText("Protocol: itc-interview-v1", 828, 496);
      ctx.fillText("Present this card at check-in.", 74, 632);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "IT-Club-Information-Card.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (err) {
      console.error("Failed to export Information Card PNG:", err);
    } finally {
      setIsExportingCard(false);
    }
  };

  return (
    <div className="student-portal flex min-h-screen flex-col bg-[#050708] text-white selection:bg-[#00e599] selection:text-[#050708]">
      <ResponsiveNav />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(330px,0.75fr)]">
            <div className="relative overflow-hidden border border-white/10 bg-[#080a0c] p-5 sm:p-7">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00e599] via-[#18c8ed] to-[#9b7cff]" />
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#00e599]">
                    <NextImage
                      src="/logo.webp"
                      alt="IT Club"
                      width={18}
                      height={18}
                      className="object-contain"
                    />
                    <span>IT Club Recruitment 2026</span>
                  </div>
                  <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">
                    Welcome, {application.full_name}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/52">
                    Your application status, official reference, interview credential, and submitted information are collected here.
                  </p>
                  <p className="arabic mt-2 text-sm text-white/48" dir="rtl">
                    بوابة الطالب الرسمية لمتابعة طلب الانضمام لنادي تكنولوجيا المعلومات.
                  </p>
                </div>
                <Link
                  href="/auth/signout?next=/student/login"
                  className="inline-flex items-center justify-center gap-2 border border-white/10 px-3 py-2 text-xs font-bold text-white/62 transition-colors hover:border-white/25 hover:text-white"
                >
                  <LogOut size={14} />
                  Sign out
                </Link>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <OverviewStat label="Reference" value={application.application_reference} accent="#00e599" onCopy={copyRefCode} copied={copiedRef} />
                <OverviewStat label="Primary track" value={primaryMeta?.abbreviation || application.primary_track} accent={primaryMeta?.color || "#18c8ed"} />
                <OverviewStat label="Academic year" value={yearLabel} accent="#18c8ed" />
              </div>

              <div className={`mt-5 border p-4 ${statusMeta.bgClass} ${statusMeta.borderClass}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Current status</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${statusMeta.dotClass}`} />
                      <span className={`text-lg font-black ${statusMeta.textClass}`}>{statusMeta.label}</span>
                      {statusMeta.arabicLabel ? (
                        <span className="arabic text-sm text-white/58" dir="rtl">
                          {statusMeta.arabicLabel}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <CheckCircle2 size={24} className={statusMeta.textClass} />
                </div>
                <p className="mt-3 text-sm leading-6 text-white/62">{nextStepForStatus(application.status, statusMeta.description)}</p>
              </div>
            </div>

            <CredentialCard
              application={application}
              qrInfo={qrInfo}
              statusLabel={statusMeta.label}
              primaryTrack={primaryMeta ? `${primaryMeta.abbreviation} - ${primaryMeta.name}` : application.primary_track}
              onDownloadCard={handleDownloadInformationCard}
              onDownloadQr={handleDownloadQrOnly}
              isExporting={isExportingCard}
            />
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <InfoPanel title="Interview Details" icon={Calendar}>
              {hasInterview ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <DetailTile icon={Calendar} label="Date" value={interviewDate || "To be announced"} />
                  <DetailTile icon={Clock} label="Time" value={interviewTime || "To be announced"} />
                  <DetailTile icon={MapPin} label="Location" value={interviewLocation || "To be announced"} />
                </div>
              ) : (
                <p className="text-sm leading-6 text-white/50">
                  Interview details are not attached to your application yet. They will appear here when the committee schedules them.
                </p>
              )}
            </InfoPanel>

            <InfoPanel title="Track Preferences" icon={FileText}>
              <div className="grid gap-3 sm:grid-cols-2">
                <PreferenceCard label="Primary preference" value={primaryMeta ? `${primaryMeta.abbreviation} - ${primaryMeta.name}` : application.primary_track} arabic={primaryMeta?.arabicName} color={primaryMeta?.color || "#00e599"} />
                <PreferenceCard label="Secondary preference" value={secondaryMeta ? `${secondaryMeta.abbreviation} - ${secondaryMeta.name}` : application.secondary_track || "Not selected"} arabic={secondaryMeta?.arabicName} color={secondaryMeta?.color || "#ffffff"} />
              </div>
            </InfoPanel>
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-3">
            <InfoPanel title="Academic" icon={GraduationCap}>
              <Field label="Academic ID" value={application.academic_id} />
              <Field label="Department" value={application.department} />
              <Field label="Academic year" value={yearLabel} />
            </InfoPanel>

            <InfoPanel title="Personal" icon={User}>
              <Field label="University email" value={application.university_email} />
              <Field label="Account email" value={userEmail} />
              <div className="border-t border-white/5 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">National ID</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-white/82">
                    {showNationalId ? application.national_id : application.national_id_masked}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNationalId((value) => !value)}
                    className="border border-white/10 p-1 text-white/45 hover:text-white"
                    aria-label={showNationalId ? "Hide National ID" : "Show National ID"}
                  >
                    {showNationalId ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </InfoPanel>

            <InfoPanel title="Experience" icon={Briefcase}>
              <Field label="Experience level" value={application.experience_level.replace("_", " ")} />
              <Field label="Activated" value={new Date(activatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
              <Field label="Submitted" value={new Date(application.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
            </InfoPanel>
          </section>

          <section className="mt-5 grid gap-5 lg:grid-cols-2">
            <LongText title="Skills and tools" value={application.skills} />
            <LongText title="Previous experience" value={application.experience_details} />
            <LongText title="Motivation" value={application.motivation} />
            <LongText title="Learning goal" value={application.learning_goal} />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function drawCardField(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number,
  color = "#ffffff"
) {
  ctx.fillStyle = "#64748b";
  ctx.font = "800 12px Montserrat, sans-serif";
  ctx.fillText(label.toUpperCase(), x, y);
  ctx.fillStyle = color;
  ctx.font = "800 22px Montserrat, sans-serif";
  ctx.fillText(value.slice(0, 48), x, y + 32);
}

function nextStepForStatus(status: string, fallback: string) {
  if (status === "ACCEPTED") {
    return "Your application is accepted. Keep your information card and QR credential ready for check-in and orientation.";
  }
  if (status === "INTERVIEW_SCHEDULED") {
    return "Your interview has been scheduled. Bring this portal credential and arrive early enough for QR check-in.";
  }
  if (status === "SHORTLISTED") {
    return "You are shortlisted. Watch this portal and your university email for interview scheduling updates.";
  }
  if (status === "PENDING_REVIEW" || status === "UNDER_REVIEW") {
    return "Your application is being reviewed. No action is required right now.";
  }
  return fallback;
}

function OverviewStat({
  label,
  value,
  accent,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  accent: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="border border-white/10 bg-[#050708] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <p className="min-w-0 truncate text-lg font-black" style={{ color: accent }}>
          {value}
        </p>
        {onCopy ? (
          <button type="button" onClick={onCopy} className="shrink-0 text-white/45 hover:text-white" aria-label="Copy application reference">
            {copied ? <Check size={14} className="text-[#00e599]" /> : <Copy size={14} />}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CredentialCard({
  application,
  qrInfo,
  statusLabel,
  primaryTrack,
  onDownloadCard,
  onDownloadQr,
  isExporting,
}: {
  application: ApplicationDetail;
  qrInfo: StudentDashboardProps["qrInfo"];
  statusLabel: string;
  primaryTrack: string;
  onDownloadCard: () => void;
  onDownloadQr: () => void;
  isExporting: boolean;
}) {
  return (
    <aside className="border border-white/10 bg-[#080a0c] p-5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#00e599]">
        <NextImage
          src="/logo.webp"
          alt="IT Club"
          width={18}
          height={18}
          className="object-contain"
        />
        Information Card
      </div>
      <div className="mt-4 border border-white/10 bg-[#050708] p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/35">Candidate</p>
            <h2 className="mt-1 text-xl font-black text-white">{application.full_name}</h2>
          </div>
          <NextImage
            src="/logo.webp"
            alt="IT Club"
            width={28}
            height={28}
            className="object-contain opacity-75"
          />
        </div>
        <p className="mt-2 text-sm font-bold text-[#00e599]">{application.application_reference}</p>
        <p className="mt-1 text-xs text-white/50">{primaryTrack}</p>
        <p className="mt-1 text-xs text-white/50">Status: {statusLabel}</p>

        <div className="mt-5 flex justify-center">
          {qrInfo.eligible && qrInfo.qrDataUrl ? (
            <div className="bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrInfo.qrDataUrl} alt="IT Club interview QR code" width={204} height={204} className="h-52 w-52" />
            </div>
          ) : (
            <div className="flex h-52 w-52 flex-col items-center justify-center border border-white/10 bg-white/[0.035] text-center">
              <AlertCircle size={30} className="text-amber-300" />
              <p className="mt-3 px-4 text-xs leading-5 text-white/55">QR is not available for your current status.</p>
            </div>
          )}
        </div>
        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.14em] text-white/35">
          Protocol: itc-interview-v1
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <button
          type="button"
          onClick={onDownloadCard}
          disabled={!qrInfo.eligible || isExporting}
          className="inline-flex items-center justify-center gap-2 bg-[#00e599] px-4 py-2.5 text-xs font-black uppercase tracking-wide text-[#050708] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Download size={14} />
          {isExporting ? "Generating" : "Card PNG"}
        </button>
        <button
          type="button"
          onClick={onDownloadQr}
          disabled={!qrInfo.eligible}
          className="inline-flex items-center justify-center gap-2 border border-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          <QrCode size={14} />
          QR PNG
        </button>
      </div>
    </aside>
  );
}

function InfoPanel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-white/10 bg-[#080a0c] p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
        <Icon size={17} className="text-[#00e599]" />
        <h2 className="text-sm font-black text-white">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function DetailTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-white/10 bg-[#050708] p-4">
      <Icon size={16} className="text-white/35" />
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function PreferenceCard({
  label,
  value,
  arabic,
  color,
}: {
  label: string;
  value: string;
  arabic?: string;
  color: string;
}) {
  return (
    <div className="border border-white/10 bg-[#050708] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">{label}</p>
      <p className="mt-2 text-sm font-black" style={{ color }}>{value}</p>
      {arabic ? <p className="arabic mt-1 text-xs text-white/42" dir="rtl">{arabic}</p> : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-white/5 pt-3 first:border-t-0 first:pt-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold capitalize text-white/82">{value}</p>
    </div>
  );
}

function LongText({ title, value }: { title: string; value: string | null }) {
  return (
    <section className="border border-white/10 bg-[#080a0c] p-5">
      <h2 className="text-sm font-black text-white">{title}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/62">
        {value || "Not provided."}
      </p>
    </section>
  );
}
