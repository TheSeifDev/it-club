"use client";

import { useState, useRef } from "react";
import styles from "./RegisterEditorial.module.css";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  Copy,
  CheckCheck,
  GraduationCap,
  LoaderCircle,
  LockKeyhole,
  Shield,
  UserRound,
  Wrench,
  AlertCircle,
  Calendar,
  ChevronDown,
  Mail,
  Clock,
} from "lucide-react";

import {
  validateUniversityEmail,
  normalizeUniversityEmail,
  validatePersonalEmail,
} from "@/lib/validation/university-email";
import {
  validateEgyptianNationalId,
  maskNationalId,
} from "@/lib/validation/national-id";

type FormValues = {
  fullName: string;
  nationalId: string;
  academicId: string;
  phone: string;
  whatsapp: string;
  whatsappSame: boolean;
  universityEmail: string;
  googleEmail: string;
  year: string;
  department: string;
  experienceLevel: string;
  skills: string;
  experienceDetails: string;
  volunteerExperience: string;
  primaryTrack: string;
  secondaryTrack: string;
  motivation: string;
  learningGoal: string;
  contribution: string;
  availability: string;
  consent: boolean;
};

const initialValues: FormValues = {
  fullName: "",
  nationalId: "",
  academicId: "",
  phone: "",
  whatsapp: "",
  whatsappSame: true,
  universityEmail: "",
  googleEmail: "",
  year: "",
  department: "",
  experienceLevel: "",
  skills: "",
  experienceDetails: "",
  volunteerExperience: "",
  primaryTrack: "",
  secondaryTrack: "",
  motivation: "",
  learningGoal: "",
  contribution: "",
  availability: "",
  consent: false,
};

const tracks = [
  {
    id: "hr",
    tag: "TRACK 01",
    title: "Human Resources",
    ar: "الموارد البشرية",
    color: "#35d98a",
    description: "People, recruitment, internal culture, and member development.",
  },
  {
    id: "pr",
    tag: "TRACK 02",
    title: "Public Relations",
    ar: "العلاقات العامة",
    color: "#ff3ca7",
    description: "Partnerships, speaker communication, external sponsors, and relations.",
  },
  {
    id: "sm",
    tag: "TRACK 03",
    title: "Social Media",
    ar: "التواصل الاجتماعي",
    color: "#eaff00",
    description: "Content creation, visual storytelling, campaigns, and digital branding.",
  },
  {
    id: "oc",
    tag: "TRACK 04",
    title: "Organizing Committee",
    ar: "اللجنة التنظيمية",
    color: "#ffab18",
    description: "Event logistics, venue operations, crowd flow, and attendee experience.",
  },
  {
    id: "it",
    tag: "TRACK 05",
    title: "Information Technology",
    ar: "تكنولوجيا المعلومات",
    color: "#18c8ed",
    description: "Software engineering, web apps, infrastructure, systems, and tech bootcamps.",
  },
  {
    id: "rnd",
    tag: "TRACK 06",
    title: "Research & Development",
    ar: "البحث والتطوير",
    color: "#9b7cff",
    description: "Emerging tech, technical research, competitive hackathons, and prototyping.",
  },
];

const steps = [
  { number: "01", title: "Personal", ar: "البيانات الشخصية", icon: UserRound },
  { number: "02", title: "Academic", ar: "المرحلة الدراسية", icon: GraduationCap },
  { number: "03", title: "Experience", ar: "المستوى والمهارات", icon: Wrench },
  { number: "04", title: "Interests", ar: "اللجان والاهتمامات", icon: CircleHelp },
  { number: "05", title: "Review", ar: "المراجعة والتأكيد", icon: ClipboardCheck },
];

const controlBase =
  "w-full rounded-lg bg-[#f1f2f0] border border-[#dfe2df] px-4 py-3.5 text-sm text-[#171c1b] placeholder:text-[#69716d] focus:border-[#087969] focus:bg-[#fcfcfa] focus:outline-none transition-all duration-200";
const inputClass = `${controlBase} h-12`;
const selectClass = `${controlBase} h-12 appearance-none cursor-pointer pr-10`;
const textareaClass = `${controlBase} min-h-32 resize-y leading-relaxed`;

function Field({
  id,
  label,
  arabicLabel,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  arabicLabel?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="block min-w-0">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label htmlFor={id} className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.16em] uppercase text-[#171c1b]/80">
            {label}
            {required ? <span className="ml-1 text-[#087969] font-mono font-bold">*</span> : null}
          </label>
          {arabicLabel ? (
            <span className="arabic text-xs sm:text-[13px] text-[#171c1b]/70 font-medium tracking-normal">
              ({arabicLabel})
            </span>
          ) : null}
        </div>
        {!required && (
          <span className="font-mono text-[9px] tracking-wider uppercase text-[#171c1b]/55">
            Optional
          </span>
        )}
      </div>
      {children}
      {hint ? <span className="mt-2 block text-xs leading-relaxed text-[#171c1b]/60">{hint}</span> : null}
    </div>
  );
}

function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <span role="alert" className="mt-2 flex items-center gap-1.5 font-mono text-xs tracking-wide text-rose-700">
      <AlertCircle size={13} className="shrink-0" />
      {children}
    </span>
  );
}

function StepHeading({
  title,
  subtitle,
  ar,
  stepNumber,
}: {
  title: string;
  subtitle: string;
  ar: string;
  stepNumber: string;
}) {
  return (
    <div className="relative mb-8 pb-6 border-b border-[#171c1b]/[0.08]">
      <div className="pointer-events-none absolute right-0 top-0 select-none font-black text-6xl sm:text-7xl leading-none text-[#171c1b]/[0.04]">
        {stepNumber}
      </div>
      <p className="font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-[#087969] mb-1.5">
        STEP {stepNumber} · {subtitle}
      </p>
      <h2 className="text-2xl sm:text-3xl font-black tracking-[-0.03em] text-[#171c1b]">
        {title}
      </h2>
      <p className="arabic mt-2.5 text-sm sm:text-base text-[#171c1b]/75 leading-[1.85] font-medium tracking-normal" dir="rtl">
        {ar}
      </p>
    </div>
  );
}

export default function RegisterFlow() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [submitError, setSubmitError] = useState("");
  const [applicationReference, setApplicationReference] = useState("");
  const [emailDelivery, setEmailDelivery] = useState<{ status: string; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const setValue = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setSubmitError("");
  };

  const handleCopy = () => {
    if (!applicationReference) return;
    navigator.clipboard?.writeText(applicationReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  function validateStep(targetStep: number) {
    const nextErrors: Record<string, string> = {};
    if (targetStep === 0) {
      if (values.fullName.trim().length < 3) {
        nextErrors.fullName = "Enter your full name (at least 3 characters).";
      }

      const nidValidation = validateEgyptianNationalId(values.nationalId);
      if (!nidValidation.isValid) {
        nextErrors.nationalId = nidValidation.error || "Enter a valid 14-digit Egyptian National ID.";
      }

      if (!values.academicId.trim()) {
        nextErrors.academicId = "Enter your university academic ID.";
      }

      const emailValidation = validateUniversityEmail(values.universityEmail);
      if (!emailValidation.isValid) {
        nextErrors.universityEmail = emailValidation.error || "Enter a valid university email (<student_number>@batechu.com).";
      }

      const googleValidation = validatePersonalEmail(values.googleEmail);
      if (!googleValidation.isValid) {
        nextErrors.googleEmail = googleValidation.error || "Enter a valid Google email or leave it empty.";
      }

      if (!/^[+()\d\s-]{8,25}$/.test(values.phone.trim())) {
        nextErrors.phone = "Enter a valid phone number.";
      }

      const whatsappValue = values.whatsappSame ? values.phone.trim() : values.whatsapp.trim();
      if (!/^[+()\d\s-]{8,25}$/.test(whatsappValue)) {
        nextErrors.whatsapp = "Enter a valid WhatsApp number.";
      }
    }
    if (targetStep === 1) {
      if (!values.year) nextErrors.year = "Choose your academic year.";
      if (values.department.trim().length < 2) nextErrors.department = "Enter your department.";
    }
    if (targetStep === 2) {
      if (!values.experienceLevel) nextErrors.experienceLevel = "Choose the option closest to your current level.";
      if (values.experienceLevel !== "new" && !values.skills.trim()) nextErrors.skills = "Tell us about the skills you currently have. Beginner skills are welcome.";
    }
    if (targetStep === 3) {
      if (!values.primaryTrack) nextErrors.primaryTrack = "Choose the committee you are most interested in.";
      if (values.secondaryTrack && values.secondaryTrack === values.primaryTrack) nextErrors.secondaryTrack = "Choose a different second preference.";
      if (values.motivation.trim().length < 20) nextErrors.motivation = "Write at least 20 characters so we can understand your motivation.";
      if (values.learningGoal.trim().length < 10) nextErrors.learningGoal = "Tell us what you want to learn.";
      if (!values.consent) nextErrors.consent = "Please confirm that your information is accurate.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function nextStep() {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  function previousStep() {
    setStep((current) => Math.max(current - 1, 0));
    setErrors({});
    setSubmitError("");
    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  async function submitApplication() {
    if (![0, 1, 2, 3].every((index) => validateStep(index))) {
      const firstInvalid = [0, 1, 2, 3].find((index) => {
        const probe: Record<string, string> = {};
        if (index === 0) {
          if (values.fullName.trim().length < 3) probe.fullName = "x";
          if (!validateEgyptianNationalId(values.nationalId).isValid) probe.nationalId = "x";
          if (!values.academicId.trim()) probe.academicId = "x";
          if (!validateUniversityEmail(values.universityEmail).isValid) probe.universityEmail = "x";
          if (values.googleEmail.trim() && !validatePersonalEmail(values.googleEmail).isValid) probe.googleEmail = "x";
          if (!/^[+()\d\s-]{8,25}$/.test(values.phone.trim())) probe.phone = "x";
          if (!values.whatsappSame && !/^[+()\d\s-]{8,25}$/.test(values.whatsapp.trim())) probe.whatsapp = "x";
        }
        if (index === 1 && (!values.year || values.department.trim().length < 2)) probe.academic = "x";
        if (index === 2 && (!values.experienceLevel || (values.experienceLevel !== "new" && !values.skills.trim()))) probe.experience = "x";
        if (index === 3 && (!values.primaryTrack || values.motivation.trim().length < 20 || values.learningGoal.trim().length < 10 || !values.consent || (values.secondaryTrack && values.secondaryTrack === values.primaryTrack))) probe.interests = "x";
        return Object.keys(probe).length > 0;
      });
      setStep(firstInvalid ?? 0);
      return;
    }

    if (isSubmittingRef.current || submitting) return;
    isSubmittingRef.current = true;

    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: values.fullName,
          nationalId: values.nationalId,
          academicId: values.academicId,
          phone: values.phone,
          whatsapp: values.whatsappSame ? values.phone : values.whatsapp,
          universityEmail: normalizeUniversityEmail(values.universityEmail),
          googleEmail: values.googleEmail || undefined,
          year: values.year,
          department: values.department,
          experienceLevel: values.experienceLevel,
          skills: values.skills || undefined,
          experienceDetails: values.experienceDetails || undefined,
          volunteerExperience: values.volunteerExperience || undefined,
          primaryTrack: values.primaryTrack,
          secondaryTrack: values.secondaryTrack || undefined,
          motivation: values.motivation,
          learningGoal: values.learningGoal,
          contribution: values.contribution || undefined,
          availability: values.availability || undefined,
          consent: values.consent,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.errors && typeof result.errors === "object") {
          setErrors(result.errors);
          const errorKeys = Object.keys(result.errors);
          if (errorKeys.some((k) => ["fullName", "nationalId", "academicId", "phone", "whatsapp", "universityEmail", "googleEmail"].includes(k))) {
            setStep(0);
          } else if (errorKeys.some((k) => ["year", "department"].includes(k))) {
            setStep(1);
          } else if (errorKeys.some((k) => ["experienceLevel", "skills"].includes(k))) {
            setStep(2);
          } else if (errorKeys.some((k) => ["primaryTrack", "secondaryTrack", "motivation", "learningGoal", "consent"].includes(k))) {
            setStep(3);
          }
        }
        setSubmitError(result.error || "We could not submit your application. Please check your details and try again.");
        return;
      }
      setApplicationReference(result.reference);
      if (result.emailDelivery) {
        setEmailDelivery(result.emailDelivery);
      }
      window.scrollTo({ top: 120, behavior: "smooth" });
    } catch {
      setSubmitError("Connection problem. Check your internet connection and try again. Your entered data is preserved.");
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  }

  // ────────────────────────────────────────────────────────────
  // Success Confirmation View
  // ────────────────────────────────────────────────────────────
  if (applicationReference) {
    return (
      <div className={`${styles.flow} relative overflow-hidden border border-[#171c1b]/[0.08] bg-[#fcfcfa]`}>
        {/* Subtle top accent gradient line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#28cdb7] via-[#28cdb7] to-[#087969]" />

        <div className="p-8 sm:p-12 md:p-16">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center border-2 border-[#28cdb7] bg-[#28cdb7]/10 shadow-[0_0_30px_rgba(40,205,183,0.3)] mb-6">
              <CheckCircle2 size={36} className="text-[#087969]" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              <span className="font-mono text-xs font-bold tracking-[0.24em] uppercase text-[#087969]">
                APPLICATION RECEIVED
              </span>
              <span className="text-[#087969]/40">·</span>
              <span className="arabic text-sm font-semibold text-[#087969] tracking-normal">
                تم استلام الطلب
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] text-[#171c1b]">
              You&apos;re officially in the queue.
            </h2>

            <p className="arabic mt-4 text-base sm:text-lg leading-[1.9] text-[#171c1b]/80 max-w-xl font-medium tracking-normal" dir="rtl">
              تم تسجيل طلبك بنجاح. كل الطلبات بتبدأ في حالة انتظار المراجعة، ومش معنى الإرسال إن القبول تم. سيتم مراجعة الطلب من قِبل رؤساء اللجان.
            </p>
          </div>

          {/* Reference Number Box */}
          <div className="mt-10 mx-auto max-w-xl bg-[#eceeed] border border-[#171c1b]/[0.08] p-6 sm:p-8">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#171c1b]/60">
                APPLICATION REFERENCE CODE
              </span>
              <span className="font-mono text-[10px] tracking-widest text-[#087969]">
                CONFIDENTIAL
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 bg-[#171c1b]/[0.02] border border-[#171c1b]/[0.06] p-4">
              <span className="font-mono text-2xl sm:text-3xl font-bold tracking-widest text-[#087969] tabular-nums break-all select-all">
                {applicationReference}
              </span>

              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 border border-[#171c1b]/15 bg-[#171c1b]/[0.035] hover:bg-[#171c1b]/[0.05] text-xs font-mono tracking-wider uppercase text-[#171c1b] transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCheck size={14} className="text-[#087969]" />
                    <span className="text-[#087969]">COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>COPY</span>
                  </>
                )}
              </button>
            </div>

            <p className="mt-3 text-xs text-[#171c1b]/60 leading-relaxed font-mono">
              Save this reference code. You may need it to verify your status or during on-campus interview check-in.
            </p>
          </div>

          {/* Email Confirmation Status Card */}
          <div className="mt-6 mx-auto max-w-xl">
            {emailDelivery?.status === "sent" ? (
              <div className="border border-[#28cdb7]/30 bg-[#28cdb7]/5 p-4 sm:p-5 flex items-start gap-3.5">
                <div className="w-8 h-8 flex items-center justify-center shrink-0 border border-[#28cdb7]/30 bg-[#28cdb7]/10 text-[#087969]">
                  <Mail size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#087969] font-bold">
                      CONFIRMATION RECEIPT DISPATCHED
                    </p>
                    <span className="text-[10px] text-[#087969]/50 font-mono">· Sent</span>
                  </div>
                  <p className="text-xs text-[#171c1b]/90 mt-1 leading-relaxed">
                    An official registration receipt containing your reference code and submission details has been sent to your university email.
                  </p>
                </div>
              </div>
            ) : (
              <div className="border border-[#171c1b]/[0.08] bg-[#171c1b]/[0.02] p-4 sm:p-5 flex items-start gap-3.5">
                <div className="w-8 h-8 flex items-center justify-center shrink-0 border border-[#171c1b]/15 bg-[#171c1b]/[0.03] text-[#171c1b]/70">
                  <Clock size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#171c1b]/75 font-bold">
                      CONFIRMATION RECEIPT QUEUED
                    </p>
                    <span className="text-[10px] text-[#171c1b]/55 font-mono">· Secured</span>
                  </div>
                  <p className="text-xs text-[#171c1b]/70 mt-1 leading-relaxed">
                    Your application is securely stored and registered. Email receipt delivery is queued or delayed—please save your reference code above.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status & Next Steps Timeline Card */}
          <div className="mt-8 mx-auto max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#eceeed] border border-[#171c1b]/[0.08] p-5 flex items-start gap-3.5">
              <div className="w-8 h-8 flex items-center justify-center shrink-0 border border-[#171c1b]/15 bg-[#171c1b]/[0.02] text-[#087969]">
                <LockKeyhole size={16} />
              </div>
              <div>
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#171c1b]/60">STATUS</p>
                <p className="text-sm font-bold text-[#171c1b] mt-0.5">Pending Review</p>
                <p className="text-xs text-[#171c1b]/65 mt-1 leading-relaxed">
                  The Owner and committee heads evaluate every application thoroughly.
                </p>
              </div>
            </div>

            <div className="bg-[#eceeed] border border-[#171c1b]/[0.08] p-5 flex items-start gap-3.5">
              <div className="w-8 h-8 flex items-center justify-center shrink-0 border border-[#171c1b]/15 bg-[#171c1b]/[0.02] text-[#087969]">
                <Calendar size={16} />
              </div>
              <div>
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#171c1b]/60">NEXT STEPS</p>
                <p className="text-sm font-bold text-[#171c1b] mt-0.5">Interview details will be communicated to shortlisted applicants.</p>
                <p className="text-xs text-[#171c1b]/65 mt-1 leading-relaxed">
                  Your reference confirms receipt; it is not an admission decision.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Action */}
          <div className="mt-10 mx-auto max-w-xl flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/"
              className="w-full sm:flex-1 h-13 inline-flex items-center justify-center gap-2.5 bg-[#28cdb7] text-[#171c1b] text-xs font-mono font-bold tracking-[0.18em] uppercase hover:bg-[#eceeed] transition-all duration-300"
            >
              RETURN TO HOMEPAGE <ArrowRight size={15} />
            </Link>

            <Link
              href="/tracks"
              className="w-full sm:w-auto h-13 px-6 inline-flex items-center justify-center gap-2 border border-[#171c1b]/15 bg-transparent text-xs font-mono font-bold tracking-[0.18em] uppercase text-[#171c1b]/90 hover:border-[#171c1b]/25 hover:bg-[#171c1b]/[0.04] hover:text-[#087969] transition-colors"
            >
              EXPLORE TRACKS
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // Main Multi-Step Form Layout
  // ────────────────────────────────────────────────────────────
  return (
    <div className={`${styles.flow} relative border border-[#171c1b]/[0.08] bg-[#fcfcfa]`}>
      {/* Top Emerald Ambient Gradient Line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#28cdb7] to-transparent opacity-60" />

      {/* ── Progress & Stepper Bar ── */}
      <div className="border-b border-[#171c1b]/[0.08] bg-[#eceeed]">
        {/* Mobile Header Bar */}
        <div className="md:hidden px-5 py-4 flex items-center justify-between border-b border-[#171c1b]/[0.06]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#087969]">
              {steps[step].number}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#171c1b]">
              {steps[step].title}
            </span>
            <span className="arabic text-xs text-[#171c1b]/65 font-medium tracking-normal">
              ({steps[step].ar})
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#171c1b]/60 tracking-widest">
            STEP {step + 1} / {steps.length}
          </span>
        </div>

        {/* Mobile Progress Line */}
        <div className="md:hidden h-1 w-full bg-[#171c1b]/[0.04] overflow-hidden">
          <div
            className="h-full bg-[#28cdb7] transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Desktop 5-Milestone Stepper Tabs */}
        <div className="hidden md:grid grid-cols-5 divide-x divide-[#171c1b]/[0.08]">
          {steps.map((item, index) => {
            const active = index === step;
            const done = index < step;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => index < step && setStep(index)}
                disabled={index >= step}
                className={`relative px-4 py-4 text-left transition-colors duration-200 select-none ${
                  active
                    ? "bg-[#f1f2f0]"
                    : done
                    ? "cursor-pointer hover:bg-[#171c1b]/[0.02]"
                    : "opacity-40 cursor-not-allowed"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {/* Active Top Highlight Line */}
                {active && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#28cdb7] shadow-[0_0_12px_#28cdb7]" />
                )}

                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 flex items-center justify-center shrink-0 border text-xs font-mono font-bold transition-colors ${
                      active
                        ? "border-[#28cdb7] text-[#087969] bg-[#28cdb7]/10"
                        : done
                        ? "border-[#28cdb7]/60 text-[#087969] bg-[#28cdb7]/5"
                        : "border-[#171c1b]/15 text-[#171c1b]/60"
                    }`}
                  >
                    {done ? <Check size={13} strokeWidth={2.5} /> : item.number}
                  </span>

                  <div className="min-w-0">
                    <p
                      className={`text-xs font-bold tracking-wide uppercase truncate ${
                        active ? "text-[#171c1b]" : done ? "text-[#171c1b]/90" : "text-[#171c1b]/60"
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="arabic text-xs sm:text-[13px] text-[#171c1b]/70 truncate leading-tight mt-0.5 font-medium tracking-normal">
                      {item.ar}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Form Step Content Body ── */}
      <div className="p-6 sm:p-10 lg:p-12">
        {/* STEP 0: PERSONAL INFORMATION */}
        {step === 0 && (
          <section aria-labelledby="step-0-title">
            <StepHeading
              stepNumber="01"
              subtitle="PERSONAL IDENTITY"
              title="Let's get to know you."
              ar="بياناتك الأساسية — اكتب بيانات صحيحة لضمان التواصل معك بخصوص المقابلة."
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Full Name" arabicLabel="الاسم بالكامل" required id="full-name">
                  <input id="full-name"
                    className={inputClass}
                    autoComplete="name"
                    value={values.fullName}
                    onChange={(e) => setValue("fullName", e.target.value)}
                    placeholder="Your full name as registered at university"
                  />
                  <ErrorText>{errors.fullName}</ErrorText>
                </Field>
              </div>

              <Field
                label="National ID"
                arabicLabel="الرقم القومي"
                required
                hint="14 digits. Verified structurally and masked on review screens. Stored securely."
               id="national-id">
                <input id="national-id"
                  className={inputClass}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={14}
                  value={values.nationalId}
                  onChange={(e) =>
                    setValue("nationalId", e.target.value.replace(/\D/g, "").slice(0, 14))
                  }
                  placeholder="14-digit national ID (e.g. 302...)"
                />
                <ErrorText>{errors.nationalId}</ErrorText>
              </Field>

              <Field label="Academic ID" arabicLabel="رقم الجلوس / الكود الجامعي" required id="academic-id">
                <input id="academic-id"
                  className={inputClass}
                  autoComplete="off"
                  value={values.academicId}
                  onChange={(e) => setValue("academicId", e.target.value)}
                  placeholder="University student ID / code"
                />
                <ErrorText>{errors.academicId}</ErrorText>
              </Field>

              <Field label="Phone Number" arabicLabel="رقم الهاتف" required id="phone-number">
                <input id="phone-number"
                  className={inputClass}
                  type="tel"
                  autoComplete="tel"
                  value={values.phone}
                  onChange={(e) => setValue("phone", e.target.value)}
                  placeholder="+20 1..."
                />
                <ErrorText>{errors.phone}</ErrorText>
              </Field>

              <Field
                label="WhatsApp Number"
                arabicLabel="رقم الواتساب"
                required
                hint="We will contact you via WhatsApp with interview schedules and updates."
               id="whatsapp-number">
                <input id="whatsapp-number"
                  className={inputClass}
                  type="tel"
                  autoComplete="tel"
                  disabled={values.whatsappSame}
                  value={values.whatsappSame ? values.phone : values.whatsapp}
                  onChange={(e) => setValue("whatsapp", e.target.value)}
                  placeholder="+20 1..."
                />
                <label className="mt-2.5 flex items-center gap-2.5 text-xs text-[#171c1b]/75 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="accent-[#087969] h-3.5 w-3.5 rounded-none"
                    checked={values.whatsappSame}
                    onChange={(e) => setValue("whatsappSame", e.target.checked)}
                  />
                  <span>WhatsApp number is the same as phone</span>
                </label>
                <ErrorText>{errors.whatsapp}</ErrorText>
              </Field>

              <Field
                label="University Email"
                arabicLabel="البريد الجامعي"
                required
                id="university-email"
                hint="Format: <student_id>@batechu.com (digits only before @batechu.com)."
              >
                <input id="university-email"
                  className={inputClass}
                  type="email"
                  autoComplete="email"
                  value={values.universityEmail}
                  onChange={(e) => setValue("universityEmail", e.target.value)}
                  placeholder="123456@batechu.com"
                />
                <ErrorText>{errors.universityEmail}</ErrorText>
              </Field>

              <Field
                label="Personal / Google Email"
                arabicLabel="البريد الشخصي"
                hint="Alternative email in case of university inbox delivery issues."
               id="personal-email">
                <input id="personal-email"
                  className={inputClass}
                  type="email"
                  value={values.googleEmail}
                  onChange={(e) => setValue("googleEmail", e.target.value)}
                  placeholder="name@gmail.com"
                />
                <ErrorText>{errors.googleEmail}</ErrorText>
              </Field>
            </div>

            {/* Privacy Shield Info Card */}
            <div className="mt-8 border border-[#171c1b]/[0.08] bg-[#eceeed] p-4 sm:p-5 flex items-start gap-3.5">
              <Shield size={18} className="shrink-0 text-[#087969] mt-0.5" />
              <div className="text-xs text-[#171c1b]/70 leading-relaxed font-sans">
                <strong className="text-[#171c1b] font-medium block mb-0.5">
                  Privacy & Data Safeguards
                </strong>
                All entered data is protected and kept private. It is used strictly for recruitment coordination and is accessible only by authorized IT Club management.
              </div>
            </div>
          </section>
        )}

        {/* STEP 1: ACADEMIC BACKGROUND */}
        {step === 1 && (
          <section aria-labelledby="step-1-title">
            <StepHeading
              stepNumber="02"
              subtitle="ACADEMIC BACKGROUND"
              title="Your studies at BATU."
              ar="معلومات الدراسة بتساعدنا نفهم ظروفك ونرتب المقابلات وأوقات الأنشطة بشكل ملائم."
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Academic Year" arabicLabel="الفرقة الدراسية" required id="academic-year">
                <div className="relative">
                  <select id="academic-year"
                    className={selectClass}
                    value={values.year}
                    onChange={(e) => setValue("year", e.target.value)}
                  >
                    <option value="" className="bg-[#eceeed]">
                      Select your academic year
                    </option>
                    <option value="first" className="bg-[#eceeed]">
                      First Year — الفرقة الأولى
                    </option>
                    <option value="second" className="bg-[#eceeed]">
                      Second Year — الفرقة الثانية
                    </option>
                    <option value="third" className="bg-[#eceeed]">
                      Third Year — الفرقة الثالثة
                    </option>
                    <option value="fourth" className="bg-[#eceeed]">
                      Fourth Year — الفرقة الرابعة
                    </option>
                    <option value="other" className="bg-[#eceeed]">
                      Other / Not listed — أخرى
                    </option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#171c1b]/60"
                  />
                </div>
                <ErrorText>{errors.year}</ErrorText>
              </Field>

              <Field
                label="Department / Program"
                arabicLabel="القسم / التخصص"
                required
                hint="Write your official university department."
               id="department">
                <input id="department"
                  className={inputClass}
                  value={values.department}
                  onChange={(e) => setValue("department", e.target.value)}
                  placeholder="e.g. Information Technology / Mechatronics"
                />
                <ErrorText>{errors.department}</ErrorText>
              </Field>

              {/* Recruitment Stage Explainer Card */}
              <div className="sm:col-span-2 border border-[#171c1b]/[0.08] bg-[#eceeed] p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-[#28cdb7]" />
                  <p className="font-mono text-xs font-bold tracking-widest uppercase text-[#087969]">
                    SELECTION PROCESS CLARIFICATION
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-[#171c1b]/80 leading-relaxed">
                  Upon completing this form, your application status becomes{" "}
                  <span className="text-[#087969] font-mono font-bold">PENDING REVIEW</span>.
                  Our committee leads will review all candidate profiles. Interview details will be communicated to shortlisted applicants.
                </p>
                <p className="arabic text-xs sm:text-sm text-[#171c1b]/70 mt-2 leading-[1.8] font-medium tracking-normal" dir="rtl">
                  بعد إرسال الطلب، بيكون طلبك في مرحلة المراجعة. سيتم إبلاغ المتقدمين الذين يتم اختيارهم بتفاصيل المقابلة.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* STEP 2: EXPERIENCE & SKILLS */}
        {step === 2 && (
          <section aria-labelledby="step-2-title">
            <StepHeading
              stepNumber="03"
              subtitle="EXPERIENCE & SKILLS"
              title="Where are you starting from?"
              ar="مش بنقيّمك على إنك تعرف كل حاجة. اختار مستواك الحقيقي عشان نعرف نوجّهك صح ونساعدك تطوّر من نفسك."
            />

            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.16em] uppercase text-[#171c1b]/80">
                    WHICH OPTION BEST DESCRIBES YOUR CURRENT LEVEL?
                    <span className="ml-1 text-[#087969] font-mono font-bold">*</span>
                  </span>
                  <span className="arabic text-xs sm:text-[13px] text-[#171c1b]/65 font-medium tracking-normal">
                    (مستواك الحالي)
                  </span>
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                {[
                  {
                    value: "new",
                    tag: "LEVEL 01",
                    title: "I'm completely new",
                    ar: "لسه ببدأ من الصفر",
                    desc: "Curious, motivated, and eager to learn everything from the beginning.",
                  },
                  {
                    value: "beginner",
                    tag: "LEVEL 02",
                    title: "I have IT basics",
                    ar: "عندي أساسيات بسيطة",
                    desc: "Started learning concepts, programming, or computer fundamentals.",
                  },
                  {
                    value: "computer_skills",
                    tag: "LEVEL 03",
                    title: "Proficient with digital tools",
                    ar: "بعرف أستخدم برامج وأدوات رقمية",
                    desc: "Design, video, productivity software, systems, or technical tools.",
                  },
                  {
                    value: "experienced",
                    tag: "LEVEL 04",
                    title: "I have hands-on experience",
                    ar: "عندي خبرة أو مشاريع سابقة",
                    desc: "Built software, created media, organized events, or led research.",
                  },
                ].map((option) => {
                  const selected = values.experienceLevel === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setValue("experienceLevel", option.value)}
                      className={`relative p-5 text-left border transition-all duration-200 select-none ${
                        selected
                          ? "border-[#28cdb7] bg-[#28cdb7]/[0.06] shadow-[0_0_20px_rgba(40,205,183,0.1)]"
                          : "border-[#171c1b]/[0.08] bg-[#eceeed] hover:border-[#171c1b]/20 hover:bg-[#171c1b]/[0.02]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span
                          className={`font-mono text-[10px] tracking-widest font-bold uppercase ${
                            selected ? "text-[#087969]" : "text-[#171c1b]/60"
                          }`}
                        >
                          {option.tag}
                        </span>

                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            selected
                              ? "border-[#28cdb7] bg-[#28cdb7]"
                              : "border-[#171c1b]/25"
                          }`}
                        >
                          {selected && <div className="w-1.5 h-1.5 rounded-full bg-[#eceeed]" />}
                        </div>
                      </div>

                      <p className="text-sm font-bold text-[#171c1b]">{option.title}</p>
                      <p className="arabic text-xs sm:text-sm text-[#171c1b]/80 mt-1 font-medium tracking-normal leading-normal" dir="rtl">
                        {option.ar}
                      </p>
                      <p className="text-xs text-[#171c1b]/60 mt-2 leading-relaxed">{option.desc}</p>
                    </button>
                  );
                })}
              </div>
              <ErrorText>{errors.experienceLevel}</ErrorText>
            </div>

            {/* Conditional Skills Inputs */}
            {values.experienceLevel && values.experienceLevel !== "new" && (
              <div className="mt-8 space-y-6 pt-6 border-t border-[#171c1b]/[0.08]">
                <Field
                  label="Skills and tools you currently use"
                  arabicLabel="المهارات والأدوات الحالية"
                  required
                  hint="Beginner-level skills are totally welcome (e.g. C++, Python, Figma, Canva, Excel, Hardware, Video Editing...)."
                 id="skills">
                  <textarea id="skills"
                    className={textareaClass}
                    value={values.skills}
                    onChange={(e) => setValue("skills", e.target.value)}
                    placeholder="List the tools, programming languages, or practical skills you have..."
                  />
                  <ErrorText>{errors.skills}</ErrorText>
                </Field>

                <Field
                  label="Projects, courses, or portfolio links"
                  arabicLabel="مشاريع أو دورات تدريبية سابقة"
                  hint="Optional. Share GitHub, Behance, Drive, or describe any practical work you attempted."
                 id="experience-details">
                  <textarea id="experience-details"
                    className={textareaClass}
                    value={values.experienceDetails}
                    onChange={(e) => setValue("experienceDetails", e.target.value)}
                    placeholder="Describe any coursework, projects, workshops, or paste relevant links..."
                  />
                </Field>
              </div>
            )}

            {/* Volunteering Input (always visible) */}
            <div className="mt-8 pt-6 border-t border-[#171c1b]/[0.08]">
              <Field
                label="Previous student activities or volunteering"
                arabicLabel="أنشطة طلابية أو أعمال تطوعية"
                hint="Optional. If this is your first student activity, that's completely fine — leave it empty."
               id="volunteer-experience">
                <textarea id="volunteer-experience"
                  className={textareaClass}
                  value={values.volunteerExperience}
                  onChange={(e) => setValue("volunteerExperience", e.target.value)}
                  placeholder="Any previous university clubs, charity initiatives, organizing teams, or collaborative work..."
                />
              </Field>
            </div>
          </section>
        )}

        {/* STEP 3: TRACK PREFERENCES & MOTIVATION */}
        {step === 3 && (
          <section aria-labelledby="step-3-title">
            <StepHeading
              stepNumber="04"
              subtitle="COMMITTEE PREFERENCE"
              title="Find the track that fits your passion."
              ar="اختار المجال اللي متحمس تشارك وتتعلم فيه. مش مطلوب تكون محترف في التراك عشان تقدم."
            />

            {/* 6 Track Selection Cards */}
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.16em] uppercase text-[#171c1b]/80">
                    FIRST TRACK PREFERENCE
                    <span className="ml-1 text-[#087969] font-mono font-bold">*</span>
                  </span>
                  <span className="arabic text-xs sm:text-[13px] text-[#171c1b]/65 font-medium tracking-normal">
                    (الرغبة الأولى)
                  </span>
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {tracks.map((track) => {
                  const selected = values.primaryTrack === track.id;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => {
                        setValue("primaryTrack", track.id);
                        if (values.secondaryTrack === track.id) {
                          setValue("secondaryTrack", "");
                        }
                      }}
                      className={`relative p-5 text-left border transition-all duration-200 select-none ${
                        selected
                          ? "border-opacity-100 bg-[#171c1b]/[0.035]"
                          : "border-[#171c1b]/[0.08] bg-[#eceeed] hover:border-[#171c1b]/20 hover:bg-[#171c1b]/[0.02]"
                      }`}
                      style={{
                        borderColor: selected ? track.color : undefined,
                        boxShadow: selected ? `0 0 20px ${track.color}25` : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="font-mono text-[10px] tracking-widest font-bold uppercase"
                          style={{ color: track.color }}
                        >
                          {track.tag}
                        </span>

                        <div
                          className="w-5 h-5 rounded-full border flex items-center justify-center transition-colors"
                          style={{
                            borderColor: selected ? track.color : "rgba(255,255,255,0.2)",
                            backgroundColor: selected ? track.color : "transparent",
                          }}
                        >
                          {selected && <Check size={12} className="text-[#171c1b] stroke-[3]" />}
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-[#171c1b] mb-0.5">{track.title}</h3>
                      <p
                        className="arabic text-xs sm:text-sm font-semibold mb-2 tracking-normal leading-normal"
                        style={{ color: `${track.color}EE` }}
                        dir="rtl"
                      >
                        {track.ar}
                      </p>
                      <p className="text-xs text-[#171c1b]/65 leading-relaxed">{track.description}</p>
                    </button>
                  );
                })}
              </div>
              <ErrorText>{errors.primaryTrack}</ErrorText>
            </div>

            {/* Secondary Track Dropdown */}
            <div className="mt-8 pt-6 border-t border-[#171c1b]/[0.08]">
              <Field
                label="Second Track Preference"
                arabicLabel="الرغبة الثانية"
                hint="Optional. Choose a secondary track if you are open to joining another committee."
               id="secondary-track">
                <div className="relative">
                  <select id="secondary-track"
                    className={selectClass}
                    value={values.secondaryTrack}
                    onChange={(e) => setValue("secondaryTrack", e.target.value)}
                  >
                    <option value="" className="bg-[#eceeed]">
                      No second preference (لا يوجد رغبة ثانية)
                    </option>
                    {tracks
                      .filter((track) => track.id !== values.primaryTrack)
                      .map((track) => (
                        <option key={track.id} value={track.id} className="bg-[#eceeed]">
                          {track.title} — {track.ar}
                        </option>
                      ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#171c1b]/60"
                  />
                </div>
                <ErrorText>{errors.secondaryTrack}</ErrorText>
              </Field>
            </div>

            {/* Motivation & Learning Goals */}
            <div className="mt-8 space-y-6 pt-6 border-t border-[#171c1b]/[0.08]">
              <Field
                label="Why do you want to join IT Club?"
                arabicLabel="لماذا تريد الانضمام للنادي؟"
                required
                hint="Tell us what genuinely interests you. Minimum 20 characters."
               id="motivation">
                <textarea id="motivation"
                  className={textareaClass}
                  value={values.motivation}
                  onChange={(e) => setValue("motivation", e.target.value)}
                  placeholder="Share what drew you to IT Club, your passion, and what you want to experience..."
                />
                <ErrorText>{errors.motivation}</ErrorText>
              </Field>

              <Field
                label="What do you want to learn or achieve?"
                arabicLabel="ما هي أهدافك التعليمية؟"
                required
                hint="What skills or outcomes would you like to achieve through your involvement with IT Club?"
               id="learning-goal">
                <textarea id="learning-goal"
                  className={textareaClass}
                  value={values.learningGoal}
                  onChange={(e) => setValue("learningGoal", e.target.value)}
                  placeholder="Describe the technical or interpersonal abilities you wish to master..."
                />
                <ErrorText>{errors.learningGoal}</ErrorText>
              </Field>

              <Field
                label="How would you like to contribute?"
                arabicLabel="كيف تود أن تساهم؟"
                hint="Optional. Any specific ideas, initiatives, or enthusiasm you bring to the team."
               id="contribution">
                <textarea id="contribution"
                  className={textareaClass}
                  value={values.contribution}
                  onChange={(e) => setValue("contribution", e.target.value)}
                  placeholder="Any thoughts on how you can add value to your committee..."
                />
              </Field>

              <Field
                label="Weekly Availability"
                arabicLabel="أوقات التفرغ"
                hint="Optional — assists our committee leads in scheduling onboarding sessions and tasks."
               id="availability">
                <div className="relative">
                  <select id="availability"
                    className={selectClass}
                    value={values.availability}
                    onChange={(e) => setValue("availability", e.target.value)}
                  >
                    <option value="" className="bg-[#eceeed]">
                      Select your general availability
                    </option>
                    <option value="weekdays" className="bg-[#eceeed]">
                      Mostly weekdays (أيام الأسبوع الدراسية)
                    </option>
                    <option value="weekends" className="bg-[#eceeed]">
                      Mostly weekends (عطلة نهاية الأسبوع)
                    </option>
                    <option value="flexible" className="bg-[#eceeed]">
                      Flexible / Adaptable (مرن ومتاح)
                    </option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#171c1b]/60"
                  />
                </div>
              </Field>

              {/* Legal & Authenticity Consent Checkbox */}
              <div className="border border-[#171c1b]/[0.08] bg-[#eceeed] p-5">
                <label className="flex items-start gap-3.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="accent-[#087969] h-4 w-4 rounded-none mt-0.5 shrink-0"
                    checked={values.consent}
                    onChange={(e) => setValue("consent", e.target.checked)}
                  />
                  <div className="text-xs text-[#171c1b]/80 leading-relaxed font-sans">
                    I confirm that all entered details are accurate and true. I understand that submitting this application places my profile into <strong className="text-[#087969]">PENDING REVIEW</strong>. Interview details will be communicated to shortlisted applicants.
                    <span className="text-[#087969] font-mono font-bold ml-1">*</span>
                  </div>
                </label>
                <ErrorText>{errors.consent}</ErrorText>
              </div>
            </div>
          </section>
        )}

        {/* STEP 4: REVIEW & CONFIRM */}
        {step === 4 && (
          <section aria-labelledby="step-4-title">
            <StepHeading
              stepNumber="05"
              subtitle="FINAL REVIEW"
              title="Review before submitting."
              ar="راجع بياناتك بدقة قبل الإرسال النهائي. تقدر ترجع لأي قسم وتعدله بضغطة واحدة."
            />

            <div className="space-y-6">
              {/* Category 1: Personal Identity */}
              <ReviewSection
                category="01 · PERSONAL IDENTITY"
                title="Personal Information"
                onEdit={() => setStep(0)}
                items={[
                  ["Full Name", values.fullName],
                  [
                    "National ID",
                    values.nationalId
                      ? maskNationalId(values.nationalId)
                      : "Not entered",
                  ],
                  ["Academic ID", values.academicId],
                  ["Phone Number", values.phone],
                  [
                    "WhatsApp Number",
                    values.whatsappSame ? `${values.phone} (Same as phone)` : values.whatsapp,
                  ],
                  ["University Email", values.universityEmail],
                  ["Google / Personal Email", values.googleEmail || "Not provided"],
                ]}
              />

              {/* Category 2: Academic Background */}
              <ReviewSection
                category="02 · ACADEMIC BACKGROUND"
                title="Academic Information"
                onEdit={() => setStep(1)}
                items={[
                  [
                    "Academic Year",
                    (
                      {
                        first: "First Year (الفرقة الأولى)",
                        second: "Second Year (الفرقة الثانية)",
                        third: "Third Year (الفرقة الثالثة)",
                        fourth: "Fourth Year (الفرقة الرابعة)",
                        other: "Other / Not listed",
                      } as Record<string, string>
                    )[values.year] || values.year,
                  ],
                  ["Department / Major", values.department],
                ]}
              />

              {/* Category 3: Experience & Skills */}
              <ReviewSection
                category="03 · EXPERIENCE & SKILLS"
                title="Experience Profile"
                onEdit={() => setStep(2)}
                items={[
                  [
                    "Current Level",
                    (
                      {
                        new: "Level 01 — Completely new (من الصفر)",
                        beginner: "Level 02 — Basic IT knowledge (أساسيات)",
                        computer_skills: "Level 03 — Digital & computer tools (أدوات وبرامج)",
                        experienced: "Level 04 — Hands-on experience (خبرة ومشاريع)",
                      } as Record<string, string>
                    )[values.experienceLevel] || values.experienceLevel,
                  ],
                  ["Skills & Tools", values.skills || "Not provided (Beginner track)"],
                  ["Projects / Courses", values.experienceDetails || "Not provided"],
                  ["Volunteering Experience", values.volunteerExperience || "Not provided"],
                ]}
              />

              {/* Category 4: Committee Preferences */}
              <ReviewSection
                category="04 · COMMITTEE PREFERENCES"
                title="Track & Goals"
                onEdit={() => setStep(3)}
                items={[
                  [
                    "First Preference",
                    tracks.find((t) => t.id === values.primaryTrack)?.title
                      ? `${tracks.find((t) => t.id === values.primaryTrack)?.title} (${
                          tracks.find((t) => t.id === values.primaryTrack)?.ar
                        })`
                      : "Not selected",
                  ],
                  [
                    "Second Preference",
                    tracks.find((t) => t.id === values.secondaryTrack)?.title
                      ? `${tracks.find((t) => t.id === values.secondaryTrack)?.title} (${
                          tracks.find((t) => t.id === values.secondaryTrack)?.ar
                        })`
                      : "No second preference",
                  ],
                  ["Motivation", values.motivation],
                  ["Learning Goal", values.learningGoal],
                  ["Contribution", values.contribution || "Not provided"],
                  [
                    "Availability",
                    (
                      {
                        weekdays: "Mostly weekdays",
                        weekends: "Mostly weekends",
                        flexible: "Flexible / Adaptable",
                      } as Record<string, string>
                    )[values.availability] || "Not specified",
                  ],
                ]}
              />

              {/* Submission Notice Banner */}
              <div className="border border-[#28cdb7]/30 bg-[#28cdb7]/[0.04] p-5 flex items-start gap-3.5">
                <LockKeyhole size={18} className="text-[#087969] shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-[#171c1b]/80">
                  Submitting this application registers your profile as{" "}
                  <strong className="text-[#171c1b] font-bold">Pending Review</strong>.
                  Submission does not guarantee acceptance. Interview details will be communicated to shortlisted applicants.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Global Submission Error Banner */}
        {submitError ? (
          <div
            role="alert"
            className="mt-8 border border-rose-700/25 bg-rose-100 p-4 text-xs font-mono text-rose-800 flex items-start gap-3"
          >
            <AlertCircle size={16} className="shrink-0 text-rose-700 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider">Submission Error</p>
              <p className="mt-1 leading-relaxed">{submitError}</p>
            </div>
          </div>
        ) : null}

        {/* ── Action Buttons Footer Bar ── */}
        <div className="mt-10 pt-6 border-t border-[#171c1b]/[0.08] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            type="button"
            onClick={previousStep}
            disabled={step === 0 || submitting}
            className="inline-flex h-12 items-center justify-center gap-2.5 border border-[#171c1b]/15 bg-[#171c1b]/[0.02] px-6 text-xs font-mono font-bold tracking-[0.16em] uppercase text-[#171c1b]/80 hover:border-[#171c1b]/25 hover:bg-[#171c1b]/[0.04] hover:text-[#087969] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed select-none"
          >
            <ArrowLeft size={15} />
            BACK
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex h-12 items-center justify-center gap-2.5 bg-[#28cdb7] px-8 text-xs font-mono font-bold tracking-[0.18em] uppercase text-[#171c1b] hover:bg-[#eceeed] hover:shadow-[0_0_18px_rgba(8,121,105,0.16)] transition-all duration-300 select-none"
            >
              CONTINUE <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submitApplication}
              disabled={submitting}
              className="inline-flex h-12 items-center justify-center gap-2.5 bg-[#28cdb7] px-8 text-xs font-mono font-bold tracking-[0.18em] uppercase text-[#171c1b] hover:bg-[#eceeed] transition-all duration-300 disabled:cursor-wait disabled:opacity-60 select-none shadow-[0_0_24px_rgba(40,205,183,0.3)]"
            >
              {submitting ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  <span>SUBMITTING APPLICATION...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>SUBMIT APPLICATION</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Review Section Card Helper
// ────────────────────────────────────────────────────────────
function ReviewSection({
  category,
  title,
  items,
  onEdit,
}: {
  category: string;
  title: string;
  items: [string, string][];
  onEdit: () => void;
}) {
  return (
    <div className="border border-[#171c1b]/[0.08] bg-[#eceeed] p-5 sm:p-6">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#171c1b]/[0.06]">
        <div>
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#087969]">
            {category}
          </span>
          <h3 className="text-sm font-bold text-[#171c1b] tracking-wide mt-0.5">{title}</h3>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="font-mono text-[10px] font-bold tracking-widest uppercase text-[#087969] hover:text-[#087969] transition-colors border border-[#28cdb7]/30 hover:border-[#171c1b]/20 px-3 py-1 bg-[#28cdb7]/5 hover:bg-[#171c1b]/[0.05]"
        >
          EDIT
        </button>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="font-mono text-[10px] tracking-wider uppercase text-[#171c1b]/60">
              {label}
            </dt>
            <dd className="mt-1 text-xs sm:text-sm text-[#171c1b]/95 leading-relaxed break-words font-medium">
              {value || <span className="text-[#171c1b]/55 italic font-sans">Not provided</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
