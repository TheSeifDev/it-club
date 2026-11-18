import type { ApplicationStatus, AcademicYear, ExperienceLevel, CommitteeTrack } from "../admin/types.ts";
import { maskNationalId } from "../validation/national-id.ts";

export interface StudentApplicationView {
  id: string;
  application_reference: string;
  full_name: string;
  national_id_masked: string;
  academic_id: string;
  phone: string;
  whatsapp: string;
  university_email: string;
  google_email: string | null;
  academic_year: AcademicYear;
  department: string;
  experience_level: ExperienceLevel;
  skills: string | null;
  experience_details: string | null;
  volunteer_experience: string | null;
  primary_track: CommitteeTrack;
  secondary_track: CommitteeTrack | null;
  motivation: string;
  learning_goal: string;
  contribution: string | null;
  availability: string | null;
  status: ApplicationStatus;
  interview_date: string | null;
  interview_time: string | null;
  interview_location: string | null;
  activated_at: string | null;
  consented_at: string;
  created_at: string;
}

const APPLICATION_STATUSES = [
  "PENDING_REVIEW",
  "UNDER_REVIEW",
  "NEEDS_CORRECTION",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEWED",
  "ACCEPTED",
  "REJECTED",
  "WAITLISTED",
] as const satisfies readonly ApplicationStatus[];
const ACADEMIC_YEARS = ["first", "second", "third", "fourth", "other"] as const satisfies readonly AcademicYear[];
const EXPERIENCE_LEVELS = ["new", "beginner", "computer_skills", "experienced"] as const satisfies readonly ExperienceLevel[];
const COMMITTEE_TRACKS = ["hr", "pr", "sm", "oc", "it", "rnd"] as const satisfies readonly CommitteeTrack[];

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? value as T
    : fallback;
}

function nullableEnumValue<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? value as T
    : null;
}

/**
 * Explicitly projects only the student's own portal fields. The raw national ID
 * is used transiently to create a masked display value; it and all review fields
 * are omitted from the returned DTO even if present on the source row.
 */
export function projectStudentApplication(record: Record<string, unknown>): StudentApplicationView {
  return {
    id: stringValue(record.id),
    application_reference: stringValue(record.application_reference),
    full_name: stringValue(record.full_name),
    national_id_masked: maskNationalId(record.national_id),
    academic_id: stringValue(record.academic_id),
    phone: stringValue(record.phone),
    whatsapp: stringValue(record.whatsapp),
    university_email: stringValue(record.university_email),
    google_email: nullableString(record.google_email),
    academic_year: enumValue(record.academic_year, ACADEMIC_YEARS, "other"),
    department: stringValue(record.department),
    experience_level: enumValue(record.experience_level, EXPERIENCE_LEVELS, "new"),
    skills: nullableString(record.skills),
    experience_details: nullableString(record.experience_details),
    volunteer_experience: nullableString(record.volunteer_experience),
    primary_track: enumValue(record.primary_track, COMMITTEE_TRACKS, "hr"),
    secondary_track: nullableEnumValue(record.secondary_track, COMMITTEE_TRACKS),
    motivation: stringValue(record.motivation),
    learning_goal: stringValue(record.learning_goal),
    contribution: nullableString(record.contribution),
    availability: nullableString(record.availability),
    status: enumValue(record.status, APPLICATION_STATUSES, "PENDING_REVIEW"),
    interview_date: nullableString(record.interview_date),
    interview_time: nullableString(record.interview_time),
    interview_location: nullableString(record.interview_location),
    activated_at: nullableString(record.activated_at),
    consented_at: stringValue(record.consented_at),
    created_at: stringValue(record.created_at),
  };
}
