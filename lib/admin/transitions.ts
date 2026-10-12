import type { ApplicationStatus, CommitteeTrack, AcademicYear } from "./types.ts";

export const VALID_STATUSES: readonly ApplicationStatus[] = [
  "PENDING_REVIEW",
  "UNDER_REVIEW",
  "NEEDS_CORRECTION",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEWED",
  "ACCEPTED",
  "REJECTED",
  "WAITLISTED",
] as const;

export function isApplicationStatus(val: unknown): val is ApplicationStatus {
  return typeof val === "string" && VALID_STATUSES.includes(val as ApplicationStatus);
}

export const COMMITTEE_TRACKS: readonly CommitteeTrack[] = [
  "hr",
  "pr",
  "sm",
  "oc",
  "it",
  "rnd",
] as const;

export function isCommitteeTrack(val: unknown): val is CommitteeTrack {
  return typeof val === "string" && COMMITTEE_TRACKS.includes(val as CommitteeTrack);
}

export const STATUS_METADATA: Record<
  ApplicationStatus,
  {
    label: string;
    arabicLabel: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    dotClass: string;
    description: string;
  }
> = {
  PENDING_REVIEW: {
    label: "Pending Review",
    arabicLabel: "في انتظار المراجعة",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
    textClass: "text-amber-400",
    dotClass: "bg-amber-400",
    description: "New submission awaiting initial review by committee heads.",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    arabicLabel: "قيد المراجعة",
    bgClass: "bg-sky-500/10",
    borderClass: "border-sky-500/30",
    textClass: "text-sky-400",
    dotClass: "bg-sky-400",
    description: "Currently being assessed by an authorized reviewer.",
  },
  NEEDS_CORRECTION: {
    label: "Needs Correction",
    arabicLabel: "بحاجة لتعديل",
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-500/30",
    textClass: "text-orange-400",
    dotClass: "bg-orange-400",
    description: "Applicant has missing or invalid information requiring clarification.",
  },
  SHORTLISTED: {
    label: "Shortlisted",
    arabicLabel: "مرشح للمقابلة",
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/30",
    textClass: "text-purple-400",
    dotClass: "bg-purple-400",
    description: "Passed initial screening; approved to advance to interview stage.",
  },
  INTERVIEW_SCHEDULED: {
    label: "Interview Scheduled",
    arabicLabel: "مقابلة مجدولة",
    bgClass: "bg-teal-500/10",
    borderClass: "border-teal-500/30",
    textClass: "text-teal-400",
    dotClass: "bg-teal-400",
    description: "Scheduled for interview on October 17, 2026.",
  },
  INTERVIEWED: {
    label: "Interviewed",
    arabicLabel: "تمت المقابلة",
    bgClass: "bg-indigo-500/10",
    borderClass: "border-indigo-500/30",
    textClass: "text-indigo-400",
    dotClass: "bg-indigo-400",
    description: "Personal interview completed; pending committee final deliberation.",
  },
  ACCEPTED: {
    label: "Accepted",
    arabicLabel: "مقبول",
    bgClass: "bg-[#00e599]/10",
    borderClass: "border-[#00e599]/40",
    textClass: "text-[#00e599]",
    dotClass: "bg-[#00e599]",
    description: "Formally accepted into the IT Club recruitment cohort.",
  },
  REJECTED: {
    label: "Rejected",
    arabicLabel: "غير مقبول",
    bgClass: "bg-rose-500/10",
    borderClass: "border-rose-500/30",
    textClass: "text-rose-400",
    dotClass: "bg-rose-400",
    description: "Application did not meet committee criteria for this recruitment round.",
  },
  WAITLISTED: {
    label: "Waitlisted",
    arabicLabel: "قائمة الانتظار",
    bgClass: "bg-zinc-500/15",
    borderClass: "border-zinc-500/30",
    textClass: "text-zinc-300",
    dotClass: "bg-zinc-400",
    description: "Placed on the reserve list if additional seats open up.",
  },
};

export const TRACK_METADATA: Record<
  CommitteeTrack,
  {
    name: string;
    arabicName: string;
    abbreviation: string;
    color: string;
  }
> = {
  it: {
    name: "Information Technology",
    arabicName: "تكنولوجيا المعلومات",
    abbreviation: "IT",
    color: "#00e599",
  },
  rnd: {
    name: "Research & Development",
    arabicName: "البحث والتطوير",
    abbreviation: "R&D",
    color: "#18c8ed",
  },
  oc: {
    name: "Organizing Committee",
    arabicName: "اللجنة التنظيمية",
    abbreviation: "OC",
    color: "#eaff00",
  },
  sm: {
    name: "Social Media",
    arabicName: "التواصل الاجتماعي",
    abbreviation: "SM",
    color: "#ff3ca7",
  },
  pr: {
    name: "Public Relations",
    arabicName: "العلاقات العامة",
    abbreviation: "PR",
    color: "#9b7cff",
  },
  hr: {
    name: "Human Resources",
    arabicName: "الموارد البشرية",
    abbreviation: "HR",
    color: "#ff914d",
  },
};

export const ACADEMIC_YEAR_METADATA: Record<AcademicYear, string> = {
  first: "1st Year (فرقة أولى)",
  second: "2nd Year (فرقة ثانية)",
  third: "3rd Year (فرقة ثالثة)",
  fourth: "4th Year (فرقة رابعة)",
  other: "Other / Postgraduate",
};

/**
 * Strict transition map defining valid state machine flows for applications.
 * Prohibits arbitrary jumps between disjoint states.
 */
export const VALID_STATUS_TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  PENDING_REVIEW: ["UNDER_REVIEW", "NEEDS_CORRECTION", "SHORTLISTED", "REJECTED", "WAITLISTED"],
  UNDER_REVIEW: ["SHORTLISTED", "NEEDS_CORRECTION", "ACCEPTED", "REJECTED", "WAITLISTED"],
  NEEDS_CORRECTION: ["UNDER_REVIEW", "PENDING_REVIEW", "REJECTED"],
  SHORTLISTED: ["INTERVIEW_SCHEDULED", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "WAITLISTED"],
  INTERVIEW_SCHEDULED: ["INTERVIEWED", "SHORTLISTED", "ACCEPTED", "REJECTED", "WAITLISTED"],
  INTERVIEWED: ["ACCEPTED", "REJECTED", "WAITLISTED", "UNDER_REVIEW"],
  WAITLISTED: ["SHORTLISTED", "ACCEPTED", "REJECTED", "UNDER_REVIEW"],
  ACCEPTED: ["UNDER_REVIEW", "WAITLISTED"], // Reversible only by authorized staff for corrections
  REJECTED: ["UNDER_REVIEW", "WAITLISTED"], // Reversible only by authorized staff for appeals
};

export function isValidStatusTransition(
  currentStatus: ApplicationStatus,
  nextStatus: ApplicationStatus
): boolean {
  if (currentStatus === nextStatus) return false;
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(nextStatus) : false;
}

/**
 * Masks an Egyptian National ID for privacy preservation in administrative lists.
 * Preserves century, year, and day prefix while masking the final serial numbers.
 */
export function maskNationalId(nationalId: string): string {
  if (!nationalId || nationalId.length < 14) return "**************";
  return `${nationalId.slice(0, 8)}******`;
}
