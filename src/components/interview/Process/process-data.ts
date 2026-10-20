// ============================================================
// IT CLUB — Process Page Data
// Matches the reference image section structure:
//   5 editorial stages + timeline + tips + FAQ
// ============================================================

// ────────────────────────────────────────────────────────────
// 1. Five Main Process Stages
// ────────────────────────────────────────────────────────────

export interface ProcessStage {
  id: string;
  stepNumber: string;
  tag: string;
  title: string;
  arabicTitle: string;
  color: string;
  description: string;
  arabicDescription: string;
  ctaLabel?: string;
}

export const PROCESS_STAGES: ProcessStage[] = [
  {
    id: "application",
    stepNumber: "01",
    tag: "STEP ONE",
    title: "Submit Your Application",
    arabicTitle: "قدّم طلبك",
    color: "#00e599",
    description:
      "Begin your journey by filling out our application form. Share your background, interests, skills, and the track you're most passionate about. Don't worry if you're just starting — we value motivation and willingness to grow as much as experience.",
    arabicDescription: "ابدأ رحلتك بملء نموذج طلبنا",
    ctaLabel: "Register Now",
  },
  {
    id: "review",
    stepNumber: "02",
    tag: "STEP TWO",
    title: "Initial Review",
    arabicTitle: "المراجعة الأولية",
    color: "#18c8ed",
    description:
      "Our team carefully reviews every application to understand your interests, experiences, and potential. We make sure to give each application a fair chance.",
    arabicDescription: "يراجع فريقنا كل طلب بعناية",
  },
  {
    id: "interview",
    stepNumber: "03",
    tag: "STEP THREE",
    title: "Interview Stage",
    arabicTitle: "مرحلة المقابلة",
    color: "#eaff00",
    description:
      "If selected, you'll be invited to an interview on October 17, 2026. This is a friendly conversation to know you better, discuss your interests, and see how you contribute to the club.",
    arabicDescription: "إذا تم اختيارك، ستُدعى لمقابلة يوم 17 أكتوبر 2026",
  },
  {
    id: "decision",
    stepNumber: "04",
    tag: "STEP FOUR",
    title: "Final Decision",
    arabicTitle: "القرار النهائي",
    color: "#ff3ca7",
    description:
      "After the interview is completed, our team will carefully evaluate and make the final decision. You'll receive an email with your result.",
    arabicDescription: "بعد المقابلة، سيتخذ فريقنا القرار النهائي",
  },
  {
    id: "grow",
    stepNumber: "05",
    tag: "STEP FIVE",
    title: "Join & Grow",
    arabicTitle: "انضم وطوّر من نفسك",
    color: "#9b7cff",
    description:
      "Once accepted, you'll officially join IT Club and start an amazing journey filled with learning, collaboration, and real impact. This is just the beginning!",
    arabicDescription: "بمجرد قبولك، ستنضم رسمياً لنادي IT Club",
  },
];

// ────────────────────────────────────────────────────────────
// 2. Application Checklist (Stage 01 visual)
// ────────────────────────────────────────────────────────────

export interface ChecklistItem {
  label: string;
  icon: "user" | "book" | "star" | "target" | "check";
}

export const APPLICATION_CHECKLIST: ChecklistItem[] = [
  { label: "Personal Information", icon: "user" },
  { label: "Academic Information", icon: "book" },
  { label: "Experience & Skills", icon: "star" },
  { label: "Track Preference", icon: "target" },
  { label: "Review & Submit", icon: "check" },
];

// ────────────────────────────────────────────────────────────
// 3. Review Cards (Stage 02 visual)
// ────────────────────────────────────────────────────────────

export interface ReviewCard {
  icon: "check-square" | "heart" | "star" | "users";
  label: string;
  color: string;
}

export const REVIEW_CARDS: ReviewCard[] = [
  { icon: "check-square", label: "Complete Applications", color: "#18c8ed" },
  { icon: "heart", label: "Be Genuine", color: "#ff3ca7" },
  { icon: "star", label: "Show Your Passion", color: "#eaff00" },
  { icon: "users", label: "Equal Opportunity", color: "#00e599" },
];

// ────────────────────────────────────────────────────────────
// 4. Interview Cards (Stage 03 visual)
// ────────────────────────────────────────────────────────────

export interface InterviewCard {
  icon: "smile" | "compass" | "user-check";
  title: string;
  description: string;
  color: string;
}

export const INTERVIEW_CARDS: InterviewCard[] = [
  {
    icon: "smile",
    title: "Friendly Atmosphere",
    description: "A casual conversation set up to make you feel at ease.",
    color: "#eaff00",
  },
  {
    icon: "compass",
    title: "Track-Focused Discussion",
    description: "We'll talk about your interests within your chosen track.",
    color: "#18c8ed",
  },
  {
    icon: "user-check",
    title: "Be Yourself",
    description: "Show your personality and authentic enthusiasm.",
    color: "#ff3ca7",
  },
];

// ────────────────────────────────────────────────────────────
// 5. Decision Outcome Cards (Stage 04 visual)
// ────────────────────────────────────────────────────────────

export interface OutcomeCard {
  icon: "check-circle" | "clock" | "x-circle";
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

export const OUTCOME_CARDS: OutcomeCard[] = [
  {
    icon: "check-circle",
    title: "Accepted",
    description: "Congratulations! You're now officially part of IT Club.",
    color: "#00e599",
    bgColor: "rgba(0,229,153,0.08)",
  },
  {
    icon: "clock",
    title: "Waitlisted",
    description: "You may be considered if a position opens up.",
    color: "#eaff00",
    bgColor: "rgba(234,255,0,0.06)",
  },
  {
    icon: "x-circle",
    title: "Not Accepted",
    description: "Keep grinding. Register again next recruitment round.",
    color: "#ff3ca7",
    bgColor: "rgba(255,60,167,0.06)",
  },
];

// ────────────────────────────────────────────────────────────
// 6. Join & Grow Feature Labels (Stage 05 visual)
// ────────────────────────────────────────────────────────────

export interface GrowFeature {
  label: string;
  icon: "layers" | "users" | "zap" | "globe";
  color: string;
}

export const GROW_FEATURES: GrowFeature[] = [
  { label: "Work on real projects", icon: "layers", color: "#00e599" },
  { label: "Be part of a community", icon: "users", color: "#18c8ed" },
  { label: "Gain your skills", icon: "zap", color: "#eaff00" },
  { label: "Create an impact", icon: "globe", color: "#ff3ca7" },
];

// ────────────────────────────────────────────────────────────
// 7. Key Dates Timeline
// ────────────────────────────────────────────────────────────

export interface TimelineDate {
  id: string;
  label: string;
  dateRange: string;
  icon: "calendar" | "file-text" | "search" | "message-circle" | "award";
  color: string;
}

export const KEY_DATES: TimelineDate[] = [
  {
    id: "open",
    label: "Applications Open",
    dateRange: "Oct 1, 2026",
    icon: "calendar",
    color: "#00e599",
  },
  {
    id: "close",
    label: "Applications Close",
    dateRange: "Oct 14, 2026",
    icon: "file-text",
    color: "#ff3ca7",
  },
  {
    id: "initial-review",
    label: "Initial Review",
    dateRange: "Oct 15 – 16, 2026",
    icon: "search",
    color: "#eaff00",
  },
  {
    id: "interviews",
    label: "Interviews",
    dateRange: "Oct 17, 2026",
    icon: "message-circle",
    color: "#18c8ed",
  },
  {
    id: "results",
    label: "Final Results",
    dateRange: "Oct 20, 2026",
    icon: "award",
    color: "#ff3ca7",
  },
];

// ────────────────────────────────────────────────────────────
// 8. Helpful Tips
// ────────────────────────────────────────────────────────────

export interface TipCard {
  icon: "shield" | "file-text" | "heart" | "check-circle";
  title: string;
  description: string;
  color: string;
}

export const HELPFUL_TIPS: TipCard[] = [
  {
    icon: "shield",
    title: "Be Honest",
    description: "Share your real experience and interests.",
    color: "#00e599",
  },
  {
    icon: "file-text",
    title: "Be Specific",
    description: "Provide clear details about your skills and experiences.",
    color: "#eaff00",
  },
  {
    icon: "heart",
    title: "Show Motivation",
    description: "Tell us why you want to join and what you hope to achieve.",
    color: "#ff3ca7",
  },
  {
    icon: "check-circle",
    title: "Proofread",
    description: "Review your application before submitting.",
    color: "#00e599",
  },
];

// ────────────────────────────────────────────────────────────
// 9. FAQ Items
// ────────────────────────────────────────────────────────────

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const PROCESS_FAQS: FAQItem[] = [
  {
    id: "multiple-tracks",
    question: "Can I Register to more than one track?",
    answer:
      "You can Register to one primary track per application cycle. However, as a member you'll collaborate with people across all tracks regularly.",
  },
  {
    id: "know-result",
    question: "How will I know the result?",
    answer:
      "You'll receive an official email notification at each stage of the process. Final decisions are communicated within 48–72 hours after your interview.",
  },
  {
    id: "prior-experience",
    question: "Do I need previous experience to Register?",
    answer:
      "No prior experience is required for most tracks. We value passion, curiosity, and willingness to learn over existing technical skills.",
  },
  {
    id: "edit-application",
    question: "Can I edit my application after submitting?",
    answer:
      "Once submitted, applications cannot be edited. Make sure to review all your information carefully before submitting.",
  },
  {
    id: "how-long",
    question: "How long does the application process take?",
    answer:
      "The full process typically takes 3–6 weeks from application open to final results. Check the Key Dates section for specific timelines.",
  },
  {
    id: "interview-format",
    question: "What's the interview like?",
    answer:
      "The interview is a friendly, conversational session with track leaders. It's designed to learn about you — your interests, goals, and how you'd contribute to the team.",
  },
  {
    id: "when-interviews",
    question: "When will the interviews be held?",
    answer:
      "Interviews will be held on October 17, 2026 (17 Oct). Selected applicants will receive an official invitation with their assigned time slot.",
  },
  {
    id: "contact",
    question: "Who can I contact if I have more questions?",
    answer:
      "Reach out through our official social media channels or email contact@itclub.one. Our team is happy to help with any questions.",
  },
];
