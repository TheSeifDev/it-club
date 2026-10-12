import {
  validateUniversityEmail,
  validatePersonalEmail,
  normalizeUniversityEmail,
} from "./university-email.ts";
import {
  validateEgyptianNationalId,
  normalizeNationalId,
} from "./national-id.ts";

export const ALLOWED_TRACKS = ["hr", "pr", "sm", "oc", "it", "rnd"] as const;
export type TrackId = (typeof ALLOWED_TRACKS)[number];

export const ALLOWED_YEARS = ["first", "second", "third", "fourth", "other"] as const;
export type AcademicYear = (typeof ALLOWED_YEARS)[number];

export const ALLOWED_LEVELS = ["new", "beginner", "computer_skills", "experienced"] as const;
export type ExperienceLevel = (typeof ALLOWED_LEVELS)[number];

export const ALLOWED_AVAILABILITY = ["weekdays", "weekends", "flexible", ""] as const;

export const PHONE_REGEX = /^[+()\d\s-]{8,25}$/;

export interface ValidatedRegistrationData {
  fullName: string;
  nationalId: string;
  academicId: string;
  phone: string;
  whatsapp: string;
  universityEmail: string;
  googleEmail: string | null;
  academicYear: AcademicYear;
  department: string;
  experienceLevel: ExperienceLevel;
  skills: string | null;
  experienceDetails: string | null;
  volunteerExperience: string | null;
  primaryTrack: TrackId;
  secondaryTrack: TrackId | null;
  motivation: string;
  learningGoal: string;
  contribution: string | null;
  availability: string | null;
  consent: true;
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  data?: ValidatedRegistrationData;
  isBot?: boolean;
}

function cleanString(val: unknown, maxLen = 2000): string {
  if (typeof val !== "string") return "";
  return val.trim().slice(0, maxLen);
}

/**
 * Validates the registration request body.
 * Strips and disallows any protected fields (e.g., status, reference, review metadata).
 */
export function validateRegistrationPayload(payload: unknown): SchemaValidationResult {
  const errors: Record<string, string> = {};

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      isValid: false,
      errors: { _general: "Invalid submission payload format." },
    };
  }

  const record = payload as Record<string, unknown>;

  // Automated scraper / bot trap check
  const botTrap = record.hp_confirm || record.fax || record.bot_trap;
  if (typeof botTrap === "string" && botTrap.trim().length > 0) {
    return {
      isValid: false,
      errors: { _general: "Automated submission detected." },
      isBot: true,
    };
  }

  // 1. Full Name
  const fullName = cleanString(record.fullName, 160);
  if (!fullName || fullName.length < 3) {
    errors.fullName = "Please enter your full name (at least 3 characters).";
  } else if (fullName.length > 120) {
    errors.fullName = "Full name cannot exceed 120 characters.";
  }

  // 2. Egyptian National ID
  const nationalIdValidation = validateEgyptianNationalId(record.nationalId);
  if (!nationalIdValidation.isValid) {
    errors.nationalId = nationalIdValidation.error || "Enter a valid 14-digit Egyptian National ID.";
  }
  const nationalId = normalizeNationalId(record.nationalId);

  // 3. Academic ID
  const academicId = cleanString(record.academicId, 60);
  if (!academicId) {
    errors.academicId = "Academic student ID is required.";
  } else if (academicId.length < 2) {
    errors.academicId = "Academic student ID must be at least 2 characters.";
  }

  // 4. University Email (<STUDENT_NUMBER>@batechu.com)
  const uniEmailValidation = validateUniversityEmail(record.universityEmail);
  if (!uniEmailValidation.isValid) {
    errors.universityEmail = uniEmailValidation.error || "Enter a valid university email.";
  }
  const universityEmail = normalizeUniversityEmail(record.universityEmail);

  // 5. Google / Personal Email (Optional)
  const personalEmailValidation = validatePersonalEmail(record.googleEmail);
  if (!personalEmailValidation.isValid) {
    errors.googleEmail = personalEmailValidation.error || "Enter a valid email.";
  }
  const googleEmail = personalEmailValidation.normalized || null;

  // 6. Phone Numbers
  const phone = cleanString(record.phone, 30);
  if (!phone || !PHONE_REGEX.test(phone)) {
    errors.phone = "Enter a valid primary telephone number (8–25 digits/symbols).";
  }

  const rawWhatsapp = record.whatsappSame ? record.phone : (record.whatsapp || record.phone);
  const whatsapp = cleanString(rawWhatsapp, 30);
  if (!whatsapp || !PHONE_REGEX.test(whatsapp)) {
    errors.whatsapp = "Enter a valid WhatsApp number (8–25 digits/symbols).";
  }

  // 7. Academic Year
  const academicYear = cleanString(record.year, 20) as AcademicYear;
  if (!ALLOWED_YEARS.includes(academicYear)) {
    errors.year = "Please choose a valid academic year from the list.";
  }

  // 8. Department
  const department = cleanString(record.department, 120);
  if (!department || department.length < 2) {
    errors.department = "Department name is required.";
  }

  // 9. Experience Level
  const experienceLevel = cleanString(record.experienceLevel, 40) as ExperienceLevel;
  if (!ALLOWED_LEVELS.includes(experienceLevel)) {
    errors.experienceLevel = "Please select your current experience level.";
  }

  // 10. Skills (conditional on experienceLevel)
  const skills = cleanString(record.skills, 2500);
  if (experienceLevel && experienceLevel !== "new" && !skills) {
    errors.skills = "Please describe the skills or tools you currently use.";
  }

  const experienceDetails = cleanString(record.experienceDetails, 3000) || null;
  const volunteerExperience = cleanString(record.volunteerExperience, 3000) || null;

  // 11. Primary & Secondary Track Preferences
  const primaryTrack = cleanString(record.primaryTrack, 10).toLowerCase() as TrackId;
  if (!ALLOWED_TRACKS.includes(primaryTrack)) {
    errors.primaryTrack = "Select a valid first track preference.";
  }

  const rawSecTrack = cleanString(record.secondaryTrack, 10).toLowerCase();
  let secondaryTrack: TrackId | null = null;
  if (rawSecTrack) {
    if (!ALLOWED_TRACKS.includes(rawSecTrack as TrackId)) {
      errors.secondaryTrack = "Select a valid second track preference.";
    } else if (rawSecTrack === primaryTrack) {
      errors.secondaryTrack = "Second track preference must differ from the first.";
    } else {
      secondaryTrack = rawSecTrack as TrackId;
    }
  }

  // 12. Motivation & Goals
  const motivation = cleanString(record.motivation, 3500);
  if (motivation.length < 20) {
    errors.motivation = "Please write at least 20 characters explaining why you want to join.";
  }

  const learningGoal = cleanString(record.learningGoal, 3000);
  if (learningGoal.length < 10) {
    errors.learningGoal = "Please write at least 10 characters detailing what you want to learn.";
  }

  const contribution = cleanString(record.contribution, 3000) || null;

  // 13. Availability
  const rawAvailability = cleanString(record.availability, 30);
  const availability = ALLOWED_AVAILABILITY.includes(rawAvailability as (typeof ALLOWED_AVAILABILITY)[number])
    ? (rawAvailability || null)
    : null;

  // 14. Consent
  if (record.consent !== true) {
    errors.consent = "You must confirm that your entered information is accurate.";
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: {},
    data: {
      fullName,
      nationalId,
      academicId,
      phone,
      whatsapp,
      universityEmail,
      googleEmail,
      academicYear,
      department,
      experienceLevel,
      skills: skills || null,
      experienceDetails,
      volunteerExperience,
      primaryTrack,
      secondaryTrack,
      motivation,
      learningGoal,
      contribution,
      availability,
      consent: true,
    },
  };
}
