"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  LogOut,
  QrCode,
  Download,
  Calendar,
  MapPin,
  Clock,
  User,
  GraduationCap,
  Briefcase,
  FileText,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Shield,
  Layers,
} from "lucide-react";
import type { ApplicationDetail } from "../../lib/admin/types.ts";
import {
  STATUS_METADATA,
  TRACK_METADATA,
  ACADEMIC_YEAR_METADATA,
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
  const [activeTab, setActiveTab] = useState<
    "card" | "personal" | "academic" | "skills" | "tracks"
  >("card");

  const statusMeta =
    application.status in STATUS_METADATA
      ? STATUS_METADATA[application.status]
      : {
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

  const yearLabel =
    application.academic_year in ACADEMIC_YEAR_METADATA
      ? ACADEMIC_YEAR_METADATA[application.academic_year]
      : application.academic_year;

  const copyRefCode = () => {
    navigator.clipboard.writeText(application.application_reference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // Download raw QR code as PNG image
  const handleDownloadQrOnly = () => {
    if (!qrInfo.eligible) return;
    const link = document.createElement("a");
    link.href = "/api/student/qr?format=png";
    link.download = "IT-Club-Interview-QR.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Information Card to high-res PNG via HTML5 Canvas
  const handleDownloadInformationCard = async () => {
    if (isExportingCard) return;
    setIsExportingCard(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      // 1. Background
      ctx.fillStyle = "#080a0c";
      ctx.fillRect(0, 0, 1200, 720);

      // 2. Outer border
      ctx.strokeStyle = "#1a242f";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 1198, 718);

      // 3. Top accent gradient bar
      const grad = ctx.createLinearGradient(0, 0, 1200, 0);
      grad.addColorStop(0, "#00e599");
      grad.addColorStop(0.5, "#18c8ed");
      grad.addColorStop(1, "#9b7cff");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 6);

      // 4. Header branding
      ctx.fillStyle = "#00e599";
      ctx.font = "bold 14px monospace";
      ctx.fillText("IT CLUB RECRUITMENT 2026", 48, 50);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px sans-serif";
      ctx.fillText("OFFICIAL CANDIDATE CREDENTIAL", 48, 88);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "16px sans-serif";
      ctx.fillText("بطاقة المرشح الرسمية للمقابلة الشخصية وتأكيد العضوية", 48, 118);

      // Horizontal divider
      ctx.strokeStyle = "#16202a";
      ctx.beginPath();
      ctx.moveTo(48, 138);
      ctx.lineTo(1152, 138);
      ctx.stroke();

      // 5. Left column: Candidate details
      // Candidate Name
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 12px monospace";
      ctx.fillText("CANDIDATE NAME", 48, 175);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(application.full_name, 48, 206);

      // Application Reference
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 12px monospace";
      ctx.fillText("APPLICATION REFERENCE", 48, 252);
      ctx.fillStyle = "#00e599";
      ctx.font = "bold 20px monospace";
      ctx.fillText(application.application_reference, 48, 280);

      // Committee Track
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 12px monospace";
      ctx.fillText("ACCEPTED TRACK", 48, 326);
      ctx.fillStyle = "#18c8ed";
      ctx.font = "bold 18px sans-serif";
      const trackText = primaryMeta
        ? `${primaryMeta.abbreviation} — ${primaryMeta.name}`
        : application.primary_track;
      ctx.fillText(trackText, 48, 354);

      // Academic Information
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 12px monospace";
      ctx.fillText("ACADEMIC SPECIALIZATION", 48, 400);
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "15px sans-serif";
      ctx.fillText(`${application.department} • ${yearLabel}`, 48, 426);

      // Status Badge Callout
      ctx.fillStyle = "#091410";
      ctx.fillRect(48, 460, 650, 48);
      ctx.strokeStyle = "#00e599";
      ctx.strokeRect(48, 460, 650, 48);
      ctx.fillStyle = "#00e599";
      ctx.font = "bold 14px monospace";
      ctx.fillText(`LIFECYCLE STATUS: ${statusMeta.label.toUpperCase()}`, 68, 490);

      // Interview Check-In Details Box
      ctx.fillStyle = "#0a0f14";
      ctx.fillRect(48, 526, 650, 95);
      ctx.strokeStyle = "#1e293b";
      ctx.strokeRect(48, 526, 650, 95);

      ctx.fillStyle = "#18c8ed";
      ctx.font = "bold 12px monospace";
      ctx.fillText("INTERVIEW EVALUATION SESSION", 68, 552);

      const interviewDate = application.interview_date || "Saturday, October 17, 2026";
      const interviewVenue =
        application.interview_location ||
        "Faculty of Computers & Artificial Intelligence • IT Club Hub";
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "14px sans-serif";
      ctx.fillText(`Date: ${interviewDate}`, 68, 580);
      ctx.fillText(`Venue: ${interviewVenue}`, 68, 604);

      // Instructions footnote
      ctx.fillStyle = "#64748b";
      ctx.font = "12px sans-serif";
      ctx.fillText(
        "Present this official credential and QR code at the check-in desk upon arrival.",
        48,
        655
      );

      // 6. Right column: QR Code container
      ctx.fillStyle = "#040608";
      ctx.fillRect(740, 160, 412, 460);
      ctx.strokeStyle = "#1a2530";
      ctx.strokeRect(740, 160, 412, 460);

      ctx.fillStyle = "#00e599";
      ctx.font = "bold 13px monospace";
      ctx.fillText("ATTENDANCE QR CREDENTIAL", 830, 200);

      // Draw QR Image if available
      if (qrInfo.qrDataUrl) {
        const qrImage = new Image();
        qrImage.src = qrInfo.qrDataUrl;
        await new Promise((resolve) => {
          qrImage.onload = resolve;
          qrImage.onerror = resolve;
        });

        // White backing square for high scanner contrast
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(796, 225, 300, 300);
        ctx.drawImage(qrImage, 806, 235, 280, 280);
      } else {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(796, 225, 300, 300);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "14px sans-serif";
        ctx.fillText("QR PENDING APPROVAL", 850, 380);
      }

      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px sans-serif";
      ctx.fillText("رمز الحضور والتحقق الشخصي", 870, 555);

      ctx.fillStyle = "#475569";
      ctx.font = "11px monospace";
      ctx.fillText("PROTOCOL: itc-interview-v1", 870, 585);

      // Trigger browser download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "IT-Club-Information-Card.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (err) {
      console.error("Failed to export Information Card PNG:", err);
    } finally {
      setIsExportingCard(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050708] text-white flex flex-col selection:bg-[#00e599] selection:text-[#050708]">
      <ResponsiveNav />

      <main className="flex-1 relative overflow-hidden py-10 sm:py-14">
        <div className="tracks-content-container max-w-5xl mx-auto px-4 sm:px-6">
          {/* Top Greeting & Header Bar */}
          <div className="border border-white/10 bg-[#080a0c] p-6 sm:p-8 mb-8 relative overflow-hidden">
            <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-[#00e599] via-[#18c8ed] to-[#9b7cff]" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-[#00e599]" />
                  <span className="font-mono text-[11px] tracking-widest uppercase text-[#00e599] font-bold">
                    IT CLUB RECRUITMENT 2026 • STUDENT PORTAL
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Welcome back, {application.full_name}
                </h1>
                <p className="text-xs text-white/50 font-mono mt-1">
                  Account: {userEmail} • Registered: {new Date(application.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} • Activated: {new Date(activatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>

              {/* Status and Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold border ${statusMeta.borderClass} ${statusMeta.bgClass} ${statusMeta.textClass}`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusMeta.dotClass} animate-pulse`} />
                  <span>{statusMeta.label}</span>
                  {statusMeta.arabicLabel && (
                    <span className="text-[11px] font-sans opacity-70" dir="rtl">
                      ({statusMeta.arabicLabel})
                    </span>
                  )}
                </span>

                <Link
                  href="/auth/signout?next=/student/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors"
                >
                  <LogOut size={13} />
                  <span>SIGN OUT</span>
                </Link>
              </div>
            </div>

            {/* Next Steps Guidance Banner */}
            <div className="mt-6 pt-5 border-t border-white/10 flex items-start gap-3">
              <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 border border-[#00e599]/30 bg-[#00e599]/10 text-[#00e599]">
                <CheckCircle2 size={14} />
              </div>
              <div className="text-xs text-white/70 leading-relaxed">
                {application.status === "ACCEPTED" ? (
                  <>
                    <strong className="text-white block font-medium">
                      Membership Accepted &amp; Verified
                    </strong>
                    Congratulations! Your application has been approved by the IT Club leadership. Your official Information Card and Attendance QR credential are ready below. Please keep them accessible for orientation and check-in.
                  </>
                ) : application.status === "INTERVIEW_SCHEDULED" ? (
                  <>
                    <strong className="text-white block font-medium">
                      Interview Scheduled
                    </strong>
                    Your personal interview evaluation has been scheduled. Please present your official Information Card with the QR code at the check-in desk upon arrival.
                  </>
                ) : (
                  <>
                    <strong className="text-white block font-medium">
                      Status Update: {statusMeta.label}
                    </strong>
                    {statusMeta.description}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-3">
            <button
              onClick={() => setActiveTab("card")}
              className={`px-4 py-2 text-xs font-mono transition-colors flex items-center gap-2 border ${
                activeTab === "card"
                  ? "bg-[#00e599]/10 border-[#00e599]/40 text-[#00e599] font-bold"
                  : "border-white/5 text-white/60 hover:text-white hover:border-white/20"
              }`}
            >
              <QrCode size={14} />
              <span>INFORMATION CARD &amp; QR</span>
            </button>
            <button
              onClick={() => setActiveTab("personal")}
              className={`px-4 py-2 text-xs font-mono transition-colors flex items-center gap-2 border ${
                activeTab === "personal"
                  ? "bg-[#00e599]/10 border-[#00e599]/40 text-[#00e599] font-bold"
                  : "border-white/5 text-white/60 hover:text-white hover:border-white/20"
              }`}
            >
              <User size={14} />
              <span>PERSONAL INFO</span>
            </button>
            <button
              onClick={() => setActiveTab("academic")}
              className={`px-4 py-2 text-xs font-mono transition-colors flex items-center gap-2 border ${
                activeTab === "academic"
                  ? "bg-[#00e599]/10 border-[#00e599]/40 text-[#00e599] font-bold"
                  : "border-white/5 text-white/60 hover:text-white hover:border-white/20"
              }`}
            >
              <GraduationCap size={14} />
              <span>ACADEMIC</span>
            </button>
            <button
              onClick={() => setActiveTab("skills")}
              className={`px-4 py-2 text-xs font-mono transition-colors flex items-center gap-2 border ${
                activeTab === "skills"
                  ? "bg-[#00e599]/10 border-[#00e599]/40 text-[#00e599] font-bold"
                  : "border-white/5 text-white/60 hover:text-white hover:border-white/20"
              }`}
            >
              <Briefcase size={14} />
              <span>SKILLS &amp; EXPERIENCE</span>
            </button>
            <button
              onClick={() => setActiveTab("tracks")}
              className={`px-4 py-2 text-xs font-mono transition-colors flex items-center gap-2 border ${
                activeTab === "tracks"
                  ? "bg-[#00e599]/10 border-[#00e599]/40 text-[#00e599] font-bold"
                  : "border-white/5 text-white/60 hover:text-white hover:border-white/20"
              }`}
            >
              <Layers size={14} />
              <span>PREFERENCES &amp; ANSWERS</span>
            </button>
          </div>

          {/* TAB 1: INFORMATION CARD & QR CODE VIEW */}
          {activeTab === "card" && (
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-white/10 bg-[#080a0c]">
                <div className="flex items-center gap-2 text-xs text-white/60 font-mono">
                  <Shield size={14} className="text-[#00e599]" />
                  <span>OFFICIAL RECRUITMENT CREDENTIAL</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {qrInfo.eligible ? (
                    <>
                      <button
                        onClick={handleDownloadInformationCard}
                        disabled={isExportingCard}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#00e599] text-[#050708] font-mono text-xs font-bold hover:bg-[#00c985] transition-colors disabled:opacity-50"
                      >
                        <Download size={14} />
                        <span>{isExportingCard ? "GENERATING PNG..." : "DOWNLOAD CARD (PNG)"}</span>
                      </button>

                      <button
                        onClick={handleDownloadQrOnly}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-white/20 text-white font-mono text-xs font-bold hover:border-white/40 hover:bg-white/5 transition-colors"
                      >
                        <QrCode size={14} />
                        <span>DOWNLOAD QR (PNG)</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-mono text-amber-400/80 flex items-center gap-1.5">
                      <AlertCircle size={14} />
                      <span>QR Issuance Pending Committee Approval</span>
                    </span>
                  )}
                </div>
              </div>

              {/* The Information Card UI Display */}
              <div className="border border-white/15 bg-[#080a0d] p-6 sm:p-10 relative overflow-hidden shadow-2xl">
                <div className="h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r from-[#00e599] via-[#18c8ed] to-[#9b7cff]" />

                <div className="flex flex-col lg:flex-row gap-8 justify-between">
                  {/* Left Column: Candidate & Academic Credentials */}
                  <div className="flex-1 space-y-6">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs tracking-widest uppercase text-[#00e599] font-bold">
                          IT CLUB RECRUITMENT 2026
                        </span>
                        <span className="text-xs text-white/40 font-mono" dir="rtl">
                          نادي تكنولوجيا المعلومات
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                        {application.full_name}
                      </h2>
                      <p className="text-xs text-white/60 font-mono mt-0.5" dir="rtl">
                        بطاقة المرشح الرسمية للمقابلة الشخصية وتأكيد العضوية
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-white/10">
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/40 tracking-wider block mb-1">
                          APPLICATION REFERENCE
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-bold text-[#00e599] tracking-wider">
                            {application.application_reference}
                          </span>
                          <button
                            onClick={copyRefCode}
                            className="p-1 text-white/40 hover:text-white transition-colors"
                            title="Copy Reference"
                          >
                            {copiedRef ? <Check size={12} className="text-[#00e599]" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/40 tracking-wider block mb-1">
                          COMMITTEE TRACK
                        </span>
                        <span className="text-sm font-bold text-[#18c8ed]">
                          {primaryMeta ? `${primaryMeta.abbreviation} — ${primaryMeta.name}` : application.primary_track}
                        </span>
                        {primaryMeta && (
                          <span className="text-xs text-white/40 block" dir="rtl">
                            {primaryMeta.arabicName}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/40 tracking-wider block mb-1">
                          ACADEMIC DEPARTMENT
                        </span>
                        <span className="text-xs text-white/80 font-medium">
                          {application.department}
                        </span>
                      </div>

                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/40 tracking-wider block mb-1">
                          ACADEMIC YEAR
                        </span>
                        <span className="text-xs text-white/80 font-medium">
                          {yearLabel}
                        </span>
                      </div>
                    </div>

                    {/* Interview Check-In Session Details */}
                    <div className="border border-white/10 bg-[#050708] p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-mono text-[#18c8ed] font-bold">
                        <Calendar size={14} />
                        <span>INTERVIEW CHECK-IN SESSION</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-white/70 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <Clock size={13} className="text-white/40 shrink-0" />
                          <span>Date: {application.interview_date || "Saturday, October 17, 2026"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={13} className="text-white/40 shrink-0" />
                          <span>Venue: {application.interview_location || "Faculty Evaluation Desk"}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-white/40 leading-relaxed font-sans">
                      Notice: Please present this credential card with QR code at the reception desk. Attendance will be recorded upon verification by committee heads.
                    </p>
                  </div>

                  {/* Right Column: QR Code Box */}
                  <div className="lg:w-72 flex flex-col items-center justify-center p-6 border border-white/10 bg-[#040608] shrink-0 text-center">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#00e599] font-bold mb-3 block">
                      ATTENDANCE QR CREDENTIAL
                    </span>

                    {qrInfo.eligible && qrInfo.qrDataUrl ? (
                      <div className="bg-white p-3 rounded shadow-lg mb-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrInfo.qrDataUrl}
                          alt="IT Club Interview QR Code"
                          width={200}
                          height={200}
                          className="w-48 h-48 block"
                        />
                      </div>
                    ) : (
                      <div className="w-48 h-48 border border-white/10 flex flex-col items-center justify-center text-center p-4 mb-3 bg-white/5">
                        <AlertCircle size={28} className="text-amber-400 mb-2" />
                        <span className="text-xs text-white/60 font-mono">
                          QR not available for current status
                        </span>
                      </div>
                    )}

                    <span className="text-xs text-white/70 block mb-1">
                      {qrInfo.status === "CHECKED_IN" ? (
                        <span className="text-[#00e599] font-bold">✓ CHECKED IN</span>
                      ) : (
                        "Scan for interview entry"
                      )}
                    </span>
                    <span className="font-mono text-[10px] text-white/30 block">
                      PROTOCOL: itc-interview-v1
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONAL INFORMATION */}
          {activeTab === "personal" && (
            <div className="border border-white/10 bg-[#080a0c] p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                <User size={18} className="text-[#00e599]" />
                <h2 className="text-base font-bold font-mono text-white uppercase tracking-wider">
                  Personal Information
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <span className="font-mono text-[11px] uppercase text-white/40 block mb-1">
                    FULL NAME
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {application.full_name}
                  </span>
                </div>

                <div>
                  <span className="font-mono text-[11px] uppercase text-white/40 block mb-1">
                    APPLICATION REFERENCE
                  </span>
                  <span className="font-mono text-sm font-bold text-[#00e599]">
                    {application.application_reference}
                  </span>
                </div>

                <div>
                  <span className="font-mono text-[11px] uppercase text-white/40 block mb-1">
                    ACADEMIC ID
                  </span>
                  <span className="font-mono text-sm text-white/90">
                    {application.academic_id}
                  </span>
                </div>

                <div>
                  <span className="font-mono text-[11px] uppercase text-white/40 block mb-1">
                    EGYPTIAN NATIONAL ID
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-white/90">
                      {showNationalId ? application.national_id : application.national_id_masked}
                    </span>
                    <button
                      onClick={() => setShowNationalId(!showNationalId)}
                      className="text-white/40 hover:text-white transition-colors"
                      title={showNationalId ? "Hide National ID" : "Show National ID"}
                    >
                      {showNationalId ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="font-mono text-[11px] uppercase text-white/40 block mb-1">
                    PRIMARY PHONE
                  </span>
                  <span className="font-mono text-sm text-white/90">
                    {application.phone}
                  </span>
                </div>

                <div>
                  <span className="font-mono text-[11px] uppercase text-white/40 block mb-1">
                    WHATSAPP NUMBER
                  </span>
                  <span className="font-mono text-sm text-white/90">
                    {application.whatsapp}
                  </span>
                </div>

                <div>
                  <span className="font-mono text-[11px] uppercase text-white/40 block mb-1">
                    UNIVERSITY EMAIL
                  </span>
                  <span className="font-mono text-sm text-white/90">
                    {application.university_email}
                  </span>
                </div>

                <div>
                  <span className="font-mono text-[11px] uppercase text-white/40 block mb-1">
                    GOOGLE / PERSONAL EMAIL
                  </span>
                  <span className="font-mono text-sm text-white/70">
                    {application.google_email || "Not provided"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACADEMIC INFORMATION */}
          {activeTab === "academic" && (
            <div className="border border-white/10 bg-[#080a0c] p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                <GraduationCap size={18} className="text-[#00e599]" />
                <h2 className="text-base font-bold font-mono text-white uppercase tracking-wider">
                  Academic Information
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <span className="font-mono text-[11px] uppercase text-white/40 block mb-1">
                    ACADEMIC YEAR
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {yearLabel}
                  </span>
                </div>

                <div>
                  <span className="font-mono text-[11px] uppercase text-white/40 block mb-1">
                    FACULTY / DEPARTMENT
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {application.department}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXPERIENCE & SKILLS */}
          {activeTab === "skills" && (
            <div className="border border-white/10 bg-[#080a0c] p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                <Briefcase size={18} className="text-[#00e599]" />
                <h2 className="text-base font-bold font-mono text-white uppercase tracking-wider">
                  Skills &amp; Experience
                </h2>
              </div>

              <div className="space-y-5">
                <div>
                  <span className="font-mono text-[11px] uppercase text-white/40 block mb-1">
                    EXPERIENCE LEVEL
                  </span>
                  <span className="inline-block px-2.5 py-1 text-xs font-mono border border-white/20 bg-white/5 text-white">
                    {application.experience_level}
                  </span>
                </div>

                <div>
                  <span className="font-mono text-[11px] uppercase text-white/40 block mb-1">
                    TECHNICAL SKILLS &amp; TOOLS
                  </span>
                  <p className="text-sm text-white/80 bg-[#050708] p-3 border border-white/5 whitespace-pre-wrap">
                    {application.skills || "None specified"}
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[11px] uppercase text-white/40 block mb-1">
                    PREVIOUS PROJECTS / COURSES
                  </span>
                  <p className="text-sm text-white/80 bg-[#050708] p-3 border border-white/5 whitespace-pre-wrap">
                    {application.experience_details || "None specified"}
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[11px] uppercase text-white/40 block mb-1">
                    VOLUNTEERING / STUDENT ACTIVITIES
                  </span>
                  <p className="text-sm text-white/80 bg-[#050708] p-3 border border-white/5 whitespace-pre-wrap">
                    {application.volunteer_experience || "None specified"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TRACK PREFERENCES & MOTIVATIONAL ANSWERS */}
          {activeTab === "tracks" && (
            <div className="border border-white/10 bg-[#080a0c] p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                <FileText size={18} className="text-[#00e599]" />
                <h2 className="text-base font-bold font-mono text-white uppercase tracking-wider">
                  Committee Preferences &amp; Submissions
                </h2>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border border-white/10 bg-[#050708]">
                    <span className="font-mono text-[10px] uppercase text-white/40 block mb-1">
                      PRIMARY PREFERENCE
                    </span>
                    <span className="text-sm font-bold text-[#00e599]">
                      {primaryMeta ? `${primaryMeta.abbreviation} — ${primaryMeta.name}` : application.primary_track}
                    </span>
                  </div>

                  <div className="p-4 border border-white/10 bg-[#050708]">
                    <span className="font-mono text-[10px] uppercase text-white/40 block mb-1">
                      SECONDARY PREFERENCE
                    </span>
                    <span className="text-sm font-bold text-white/80">
                      {secondaryMeta ? `${secondaryMeta.abbreviation} — ${secondaryMeta.name}` : application.secondary_track || "None"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-mono text-[11px] uppercase text-white/40 block mb-1">
                    MOTIVATION FOR JOINING IT CLUB
                  </span>
                  <p className="text-sm text-white/80 bg-[#050708] p-3 border border-white/5 whitespace-pre-wrap leading-relaxed">
                    {application.motivation}
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[11px] uppercase text-white/40 block mb-1">
                    LEARNING GOALS
                  </span>
                  <p className="text-sm text-white/80 bg-[#050708] p-3 border border-white/5 whitespace-pre-wrap leading-relaxed">
                    {application.learning_goal}
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[11px] uppercase text-white/40 block mb-1">
                    EXPECTED CONTRIBUTION
                  </span>
                  <p className="text-sm text-white/80 bg-[#050708] p-3 border border-white/5 whitespace-pre-wrap leading-relaxed">
                    {application.contribution || "None specified"}
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[11px] uppercase text-white/40 block mb-1">
                    WEEKLY AVAILABILITY
                  </span>
                  <p className="text-sm text-white/80 bg-[#050708] p-3 border border-white/5">
                    {application.availability || "None specified"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
