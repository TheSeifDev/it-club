"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  GraduationCap,
  LoaderCircle,
  LockKeyhole,
  UserRound,
  Wrench,
} from "lucide-react";

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
  { id: "hr", title: "Human Resources", ar: "الموارد البشرية", color: "#35d98a", description: "People, recruitment, culture and team development." },
  { id: "pr", title: "Public Relations", ar: "العلاقات العامة", color: "#ff3ca7", description: "Partnerships, communication and external relations." },
  { id: "sm", title: "Social Media", ar: "التواصل الاجتماعي", color: "#eaff00", description: "Content, visual storytelling and digital presence." },
  { id: "oc", title: "Organizing Committee", ar: "اللجنة التنظيمية", color: "#ffab18", description: "Events, logistics and attendee experience." },
  { id: "it", title: "Information Technology", ar: "تكنولوجيا المعلومات", color: "#18c8ed", description: "Software, systems, infrastructure and technical learning." },
  { id: "rnd", title: "Research & Development", ar: "البحث والتطوير", color: "#9b7cff", description: "Research, experiments, emerging technologies and prototypes." },
];

const steps = [
  { title: "Personal", ar: "بياناتك", icon: UserRound },
  { title: "Academic", ar: "الدراسة", icon: GraduationCap },
  { title: "Experience", ar: "مستواك", icon: Wrench },
  { title: "Interests", ar: "اهتماماتك", icon: CircleHelp },
  { title: "Review", ar: "المراجعة", icon: ClipboardCheck },
];

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 flex flex-wrap items-center gap-2 text-sm font-medium text-white/90">
        {label}
        {required ? <span className="text-emerald-400">*</span> : <span className="text-[10px] font-normal text-white/35">Optional</span>}
      </span>
      {children}
      {hint ? <span className="mt-2 block text-xs leading-5 text-white/40">{hint}</span> : null}
    </label>
  );
}

const controlClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/10";
const selectClass = `${controlClass} appearance-none`;
const textareaClass = `${controlClass} min-h-28 resize-y`;

export default function RegisterFlow() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [applicationReference, setApplicationReference] = useState("");

  const setValue = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setSubmitError("");
  };

  function validateStep(targetStep: number) {
    const nextErrors: Record<string, string> = {};
    if (targetStep === 0) {
      if (values.fullName.trim().length < 3) nextErrors.fullName = "Enter your full name.";
      if (!/^\d{14}$/.test(values.nationalId)) nextErrors.nationalId = "The national ID must contain 14 digits.";
      if (!values.academicId.trim()) nextErrors.academicId = "Enter your academic ID.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.universityEmail.trim())) nextErrors.universityEmail = "Enter a valid university email.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.googleEmail.trim()) && values.googleEmail.trim()) nextErrors.googleEmail = "Enter a valid Google email or leave it empty.";
      if (!/^[+()\d\s-]{8,20}$/.test(values.phone.trim())) nextErrors.phone = "Enter a valid phone number.";
      if (!values.whatsappSame && !/^[+()\d\s-]{8,20}$/.test(values.whatsapp.trim())) nextErrors.whatsapp = "Enter a valid WhatsApp number.";
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previousStep() {
    setStep((current) => Math.max(current - 1, 0));
    setErrors({});
    setSubmitError("");
  }

  async function submitApplication() {
    if (![0, 1, 2, 3].every((index) => validateStep(index))) {
      const firstInvalid = [0, 1, 2, 3].find((index) => {
        const probe: Record<string, string> = {};
        if (index === 0) {
          if (values.fullName.trim().length < 3) probe.fullName = "x";
          if (!/^\d{14}$/.test(values.nationalId)) probe.nationalId = "x";
          if (!values.academicId.trim()) probe.academicId = "x";
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.universityEmail.trim())) probe.universityEmail = "x";
          if (values.googleEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.googleEmail.trim())) probe.googleEmail = "x";
          if (!/^[+()\d\s-]{8,20}$/.test(values.phone.trim())) probe.phone = "x";
          if (!values.whatsappSame && !/^[+()\d\s-]{8,20}$/.test(values.whatsapp.trim())) probe.whatsapp = "x";
        }
        if (index === 1 && (!values.year || values.department.trim().length < 2)) probe.academic = "x";
        if (index === 2 && (!values.experienceLevel || (values.experienceLevel !== "new" && !values.skills.trim()))) probe.experience = "x";
        if (index === 3 && (!values.primaryTrack || values.motivation.trim().length < 20 || values.learningGoal.trim().length < 10 || !values.consent || (values.secondaryTrack && values.secondaryTrack === values.primaryTrack))) probe.interests = "x";
        return Object.keys(probe).length > 0;
      });
      setStep(firstInvalid ?? 0);
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          whatsapp: values.whatsappSame ? values.phone : values.whatsapp,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setSubmitError(result.error || "We could not submit your application. Please try again.");
        return;
      }
      setApplicationReference(result.reference);
    } catch {
      setSubmitError("Connection problem. Check your internet and try again. Your form is still here.");
    } finally {
      setSubmitting(false);
    }
  }

  if (applicationReference) {
    return (
      <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-emerald-400/20 bg-[#0d1211]">
        <div className="border-b border-white/10 p-7 text-center sm:p-10">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
            <CheckCircle2 size={30} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">Application received</p>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">You’re officially in the review queue.</h2>
          <p className="arabic mt-4 text-sm leading-7 text-white/60" dir="rtl">
            استلمنا طلبك. كل الطلبات بتبدأ في حالة انتظار المراجعة، ومش معنى الإرسال إن القبول تم.
          </p>
        </div>
        <div className="space-y-4 p-6 sm:p-8">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-xs text-white/45">Your application reference</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="break-all font-mono text-xl font-semibold tracking-wider text-emerald-300">{applicationReference}</p>
              <button type="button" onClick={() => navigator.clipboard?.writeText(applicationReference)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5">Copy</button>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-white/[0.035] p-4">
            <LockKeyhole className="mt-0.5 shrink-0 text-emerald-400" size={18} />
            <div>
              <p className="text-sm font-medium">Status: Pending review</p>
              <p className="mt-1 text-xs leading-5 text-white/50">The Owner and authorized Admins will review your details. If you are shortlisted, interview details and your attendance QR will be issued later.</p>
            </div>
          </div>
          <Link href="/" className="flex w-full items-center justify-center rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-emerald-300">
            Back to IT Club
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d1011] shadow-[0_30px_100px_rgba(0,0,0,0.28)]">
      <div className="border-b border-white/10 px-5 py-5 sm:px-8 sm:py-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="text-xs text-white/45">APPLICATION FORM</span>
          <span className="text-xs font-medium text-emerald-300">STEP {step + 1} OF {steps.length}</span>
        </div>
        <div className="mb-6 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-emerald-400 transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
        <div className="grid grid-cols-5 gap-2">
          {steps.map((item, index) => {
            const Icon = item.icon;
            const active = index === step;
            const done = index < step;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => index < step && setStep(index)}
                disabled={index >= step}
                className={`flex min-w-0 flex-col items-center gap-2 rounded-xl px-1 py-2 text-center transition ${active ? "text-emerald-300" : done ? "cursor-pointer text-white/65 hover:bg-white/5" : "text-white/30"}`}
                aria-current={active ? "step" : undefined}
              >
                <span className={`flex size-9 items-center justify-center rounded-xl border ${active ? "border-emerald-400/50 bg-emerald-400/10" : done ? "border-white/15 bg-white/5" : "border-white/10"}`}>
                  {done ? <Check size={16} /> : <Icon size={16} />}
                </span>
                <span className="hidden text-[11px] font-medium sm:block">{item.title}</span>
                <span className="arabic text-[10px] sm:hidden">{item.ar}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5 sm:p-8">
        {step === 0 && (
          <section>
            <StepHeading title="Let’s get to know you." subtitle="Personal information" ar="بياناتك الأساسية — اكتب بيانات صحيحة عشان نقدر نراجع طلبك." />
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Full name" required>
                  <input className={controlClass} autoComplete="name" value={values.fullName} onChange={(e) => setValue("fullName", e.target.value)} placeholder="Your full name as registered at university" />
                  <ErrorText>{errors.fullName}</ErrorText>
                </Field>
              </div>
              <Field label="National ID" required hint="14 digits. This is sensitive information and is only for authorized recruitment review.">
                <input className={controlClass} inputMode="numeric" autoComplete="off" maxLength={14} value={values.nationalId} onChange={(e) => setValue("nationalId", e.target.value.replace(/\D/g, "").slice(0, 14))} placeholder="14-digit national ID" />
                <ErrorText>{errors.nationalId}</ErrorText>
              </Field>
              <Field label="Academic ID" required>
                <input className={controlClass} autoComplete="off" value={values.academicId} onChange={(e) => setValue("academicId", e.target.value)} placeholder="University student ID" />
                <ErrorText>{errors.academicId}</ErrorText>
              </Field>
              <Field label="Phone number" required>
                <input className={controlClass} type="tel" autoComplete="tel" value={values.phone} onChange={(e) => setValue("phone", e.target.value)} placeholder="+20 ..." />
                <ErrorText>{errors.phone}</ErrorText>
              </Field>
              <Field label="WhatsApp number" required hint="Use the same number or enter a different one.">
                <input className={controlClass} type="tel" autoComplete="tel" disabled={values.whatsappSame} value={values.whatsappSame ? values.phone : values.whatsapp} onChange={(e) => setValue("whatsapp", e.target.value)} placeholder="+20 ..." />
                <span className="mt-3 flex items-center gap-2 text-xs text-white/60">
                  <input type="checkbox" className="accent-emerald-400" checked={values.whatsappSame} onChange={(e) => setValue("whatsappSame", e.target.checked)} />
                  WhatsApp is the same as my phone
                </span>
                <ErrorText>{errors.whatsapp}</ErrorText>
              </Field>
              <Field label="University email" required>
                <input className={controlClass} type="email" autoComplete="email" value={values.universityEmail} onChange={(e) => setValue("universityEmail", e.target.value)} placeholder="name@university.edu" />
                <ErrorText>{errors.universityEmail}</ErrorText>
              </Field>
              <Field label="Google / Gmail email" hint="Optional if it is the same as your university email.">
                <input className={controlClass} type="email" value={values.googleEmail} onChange={(e) => setValue("googleEmail", e.target.value)} placeholder="name@gmail.com" />
                <ErrorText>{errors.googleEmail}</ErrorText>
              </Field>
            </div>
          </section>
        )}

        {step === 1 && (
          <section>
            <StepHeading title="Your academic background." subtitle="Academic information" ar="معلومات الدراسة بتساعدنا نفهم ظروفك ونرتب المقابلات بشكل مناسب." />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Academic year" required>
                <select className={selectClass} value={values.year} onChange={(e) => setValue("year", e.target.value)}>
                  <option value="" className="bg-[#0d1011]">Choose your year</option>
                  <option value="first" className="bg-[#0d1011]">First year</option>
                  <option value="second" className="bg-[#0d1011]">Second year</option>
                  <option value="third" className="bg-[#0d1011]">Third year</option>
                  <option value="fourth" className="bg-[#0d1011]">Fourth year</option>
                  <option value="other" className="bg-[#0d1011]">Other / not listed</option>
                </select>
                <ErrorText>{errors.year}</ErrorText>
              </Field>
              <Field label="Department" required hint="Write your official department name.">
                <input className={controlClass} value={values.department} onChange={(e) => setValue("department", e.target.value)} placeholder="e.g. Information Technology" />
                <ErrorText>{errors.department}</ErrorText>
              </Field>
              <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <p className="text-sm font-medium">What happens after submission?</p>
                <p className="arabic mt-2 text-sm leading-7 text-white/55" dir="rtl">الطلب هيفضل Pending لحد ما الـ Owner أو Admin مخوّل يراجع بياناتك. مش مطلوب منك ترفع صورة دلوقتي.</p>
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <StepHeading title="Every journey has a starting point." subtitle="Experience & skills" ar="مش بنقيّمك على إنك تعرف كل حاجة. اختار مستواك الحقيقي عشان نعرف نوجّهك صح." />
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-white/90">Which option describes you best? <span className="text-emerald-400">*</span></legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: "new", title: "I’m completely new", ar: "لسه ببدأ من الصفر", desc: "I’m curious and ready to learn." },
                  { value: "beginner", title: "I know a little IT", ar: "عندي أساسيات بسيطة", desc: "I’ve started learning and practicing." },
                  { value: "computer_skills", title: "I’m good with computer tools", ar: "بعرف أستخدم برامج وأدوات", desc: "Software, productivity, design or other tools." },
                  { value: "experienced", title: "I have experience", ar: "عندي خبرة أو مشاريع", desc: "I’ve built, designed, researched or organized something." },
                ].map((option) => (
                  <button key={option.value} type="button" onClick={() => setValue("experienceLevel", option.value)} className={`rounded-2xl border p-4 text-left transition ${values.experienceLevel === option.value ? "border-emerald-400/60 bg-emerald-400/[0.08]" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold">{option.title}</span>
                      <span className={`mt-0.5 size-4 rounded-full border ${values.experienceLevel === option.value ? "border-emerald-300 bg-emerald-300 ring-4 ring-emerald-300/10" : "border-white/25"}`} />
                    </span>
                    <span className="arabic mt-2 block text-xs text-white/65" dir="rtl">{option.ar}</span>
                    <span className="mt-2 block text-xs leading-5 text-white/40">{option.desc}</span>
                  </button>
                ))}
              </div>
              <ErrorText>{errors.experienceLevel}</ErrorText>
            </fieldset>
            {values.experienceLevel && values.experienceLevel !== "new" && (
              <div className="mt-6 grid gap-5">
                <Field label="What skills do you have so far?" required hint="Beginner-level skills are completely fine.">
                  <textarea className={textareaClass} value={values.skills} onChange={(e) => setValue("skills", e.target.value)} placeholder="e.g. HTML basics, Canva, Python basics, communication, video editing..." />
                  <ErrorText>{errors.skills}</ErrorText>
                </Field>
                <Field label="Projects, courses or tools you have tried" hint="Optional. You can include a link if you have one.">
                  <textarea className={textareaClass} value={values.experienceDetails} onChange={(e) => setValue("experienceDetails", e.target.value)} placeholder="Tell us about anything you have tried or built." />
                </Field>
              </div>
            )}
            <div className="mt-5">
              <Field label="Previous volunteering or student activities" hint="Optional. If this is your first experience, you can leave it empty.">
                <textarea className={textareaClass} value={values.volunteerExperience} onChange={(e) => setValue("volunteerExperience", e.target.value)} placeholder="Any clubs, events, volunteering or teamwork experience..." />
              </Field>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <StepHeading title="Find the track that fits your curiosity." subtitle="Track preferences & motivation" ar="اختار المجال اللي متحمس تتعلمه. مش لازم تكون خبير في اللجنة اللي هتختارها." />
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-white/90">First preference <span className="text-emerald-400">*</span></legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {tracks.map((track) => (
                  <button key={track.id} type="button" onClick={() => { setValue("primaryTrack", track.id); if (values.secondaryTrack === track.id) setValue("secondaryTrack", ""); }} className={`rounded-2xl border p-4 text-left transition ${values.primaryTrack === track.id ? "border-white/25 bg-white/[0.06]" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                    <span className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold" style={{ color: track.color }}>{track.title}</span>
                      <span className={`flex size-5 items-center justify-center rounded-full border ${values.primaryTrack === track.id ? "border-emerald-300 bg-emerald-300 text-black" : "border-white/20"}`}>{values.primaryTrack === track.id ? <Check size={12} /> : null}</span>
                    </span>
                    <span className="arabic block text-xs text-white/70" dir="rtl">{track.ar}</span>
                    <span className="mt-2 block text-xs leading-5 text-white/45">{track.description}</span>
                  </button>
                ))}
              </div>
              <ErrorText>{errors.primaryTrack}</ErrorText>
            </fieldset>
            <div className="mt-5">
              <Field label="Second preference" hint="Optional. Choose a different track if you are open to another committee.">
                <select className={selectClass} value={values.secondaryTrack} onChange={(e) => setValue("secondaryTrack", e.target.value)}>
                  <option value="" className="bg-[#0d1011]">No second preference</option>
                  {tracks.filter((track) => track.id !== values.primaryTrack).map((track) => <option key={track.id} value={track.id} className="bg-[#0d1011]">{track.title} — {track.ar}</option>)}
                </select>
                <ErrorText>{errors.secondaryTrack}</ErrorText>
              </Field>
            </div>
            <div className="mt-5 grid gap-5">
              <Field label="Why do you want to join IT Club?" required hint="Tell us what genuinely interests you. Minimum 20 characters.">
                <textarea className={textareaClass} value={values.motivation} onChange={(e) => setValue("motivation", e.target.value)} placeholder="What made you want to apply?" />
                <ErrorText>{errors.motivation}</ErrorText>
              </Field>
              <Field label="What do you want to learn or improve?" required>
                <textarea className={textareaClass} value={values.learningGoal} onChange={(e) => setValue("learningGoal", e.target.value)} placeholder="What would you like to be able to do by the end of your journey?" />
                <ErrorText>{errors.learningGoal}</ErrorText>
              </Field>
              <Field label="How would you like to contribute?" hint="Optional. Ideas, interests or ways you would like to help.">
                <textarea className={textareaClass} value={values.contribution} onChange={(e) => setValue("contribution", e.target.value)} placeholder="Anything you would like to bring to the club..." />
              </Field>
              <Field label="Availability" hint="Optional — helps us plan activities and interviews.">
                <select className={selectClass} value={values.availability} onChange={(e) => setValue("availability", e.target.value)}>
                  <option value="" className="bg-[#0d1011]">Select availability</option>
                  <option value="weekdays" className="bg-[#0d1011]">Mostly weekdays</option>
                  <option value="weekends" className="bg-[#0d1011]">Mostly weekends</option>
                  <option value="flexible" className="bg-[#0d1011]">Flexible</option>
                </select>
              </Field>
              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <input type="checkbox" className="mt-1 accent-emerald-400" checked={values.consent} onChange={(e) => setValue("consent", e.target.checked)} />
                <span className="text-xs leading-6 text-white/60">I confirm that the information I entered is accurate, and I understand that my application will remain pending until it is reviewed by authorized IT Club staff. <span className="text-emerald-400">*</span></span>
              </label>
              <ErrorText>{errors.consent}</ErrorText>
            </div>
          </section>
        )}

        {step === 4 && (
          <section>
            <StepHeading title="Review before you send." subtitle="Final review" ar="راجع بياناتك براحتك. تقدر ترجع لأي خطوة وتعدّلها قبل الإرسال." />
            <div className="space-y-4">
              <ReviewSection title="Personal information" onEdit={() => setStep(0)} items={[
                ["Full name", values.fullName],
                ["National ID", values.nationalId ? `••••••••••${values.nationalId.slice(-4)}` : ""],
                ["Academic ID", values.academicId],
                ["Phone", values.phone],
                ["WhatsApp", values.whatsappSame ? values.phone : values.whatsapp],
                ["University email", values.universityEmail],
                ["Google email", values.googleEmail || "Not provided"],
              ]} />
              <ReviewSection title="Academic information" onEdit={() => setStep(1)} items={[
                ["Year", values.year],
                ["Department", values.department],
              ]} />
              <ReviewSection title="Experience & skills" onEdit={() => setStep(2)} items={[
                ["Current level", ({ new: "Completely new", beginner: "Beginner in IT", computer_skills: "Computer tools", experienced: "Experienced" } as Record<string, string>)[values.experienceLevel] || ""],
                ["Skills", values.skills || "Not provided"],
                ["Experience", values.experienceDetails || "Not provided"],
                ["Volunteering", values.volunteerExperience || "Not provided"],
              ]} />
              <ReviewSection title="Track preferences" onEdit={() => setStep(3)} items={[
                ["First preference", tracks.find((track) => track.id === values.primaryTrack)?.title || ""],
                ["Second preference", tracks.find((track) => track.id === values.secondaryTrack)?.title || "Not provided"],
                ["Motivation", values.motivation],
                ["Learning goal", values.learningGoal],
                ["Contribution", values.contribution || "Not provided"],
              ]} />
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4">
                <LockKeyhole size={18} className="mt-0.5 shrink-0 text-emerald-300" />
                <p className="text-xs leading-6 text-white/60">Your application will be submitted as <strong className="text-white">Pending Review</strong>. Submission does not mean acceptance. Your interview QR is generated only after an authorized reviewer schedules your interview.</p>
              </div>
            </div>
          </section>
        )}

        {submitError ? (
          <div role="alert" className="mt-6 rounded-xl border border-red-400/25 bg-red-400/[0.06] p-4 text-sm text-red-200">{submitError}</div>
        ) : null}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={previousStep} disabled={step === 0 || submitting} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3.5 text-sm font-medium text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30">
            <ArrowLeft size={16} /> Back
          </button>
          {step < steps.length - 1 ? (
            <button type="button" onClick={nextStep} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300">
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={submitApplication} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60">
              {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {submitting ? "Submitting application..." : "Submit application"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepHeading({ title, subtitle, ar }: { title: string; subtitle: string; ar: string }) {
  return (
    <div className="mb-7">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">{subtitle}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      <p className="arabic mt-3 text-sm leading-7 text-white/50" dir="rtl">{ar}</p>
    </div>
  );
}

function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <span role="alert" className="mt-2 block text-xs text-rose-300">{children}</span>;
}

function ReviewSection({ title, items, onEdit }: { title: string; items: [string, string][]; onEdit: () => void }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <button type="button" onClick={onEdit} className="text-xs font-medium text-emerald-300 hover:text-emerald-200">Edit</button>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-[11px] text-white/40">{label}</dt>
            <dd className="mt-1 break-words text-sm text-white/80">{value || "Not provided"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
