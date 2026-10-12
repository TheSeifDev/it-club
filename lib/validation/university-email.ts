/**
 * University Email Validator for IT Club Recruitment
 *
 * Requirements:
 * - Format: STUDENT_NUMBER@batechu.com
 * - Local part before @batechu.com must be DIGITS ONLY.
 * - Surrounding whitespace must be trimmed.
 * - Domain must be normalized to lowercase without altering the numeric student number.
 * - Field-specific messages without revealing existing student records.
 */

export const UNIVERSITY_DOMAIN = "batechu.com";
export const UNIVERSITY_EMAIL_REGEX = /^\d+@batechu\.com$/i;

export interface UniversityEmailValidationResult {
  isValid: boolean;
  error?: string;
  normalized?: string;
  studentId?: string;
}

/**
 * Normalizes a university email by trimming whitespace and lowercasing the domain.
 * Preserves the numeric student ID exactly.
 */
export function normalizeUniversityEmail(rawEmail: unknown): string {
  if (typeof rawEmail !== "string") return "";
  const trimmed = rawEmail.trim();
  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex === -1) {
    return trimmed.toLowerCase();
  }
  const localPart = trimmed.slice(0, atIndex);
  const domainPart = trimmed.slice(atIndex + 1).toLowerCase();
  return `${localPart}@${domainPart}`;
}

/**
 * Validates a student university email according to the strict rule:
 * STUDENT_NUMBER@batechu.com where STUDENT_NUMBER contains digits only.
 */
export function validateUniversityEmail(rawEmail: unknown): UniversityEmailValidationResult {
  if (typeof rawEmail !== "string" || !rawEmail.trim()) {
    return {
      isValid: false,
      error: "Enter your university email address.",
    };
  }

  const normalized = normalizeUniversityEmail(rawEmail);
  const parts = normalized.split("@");

  if (parts.length !== 2) {
    return {
      isValid: false,
      error: "University email must be in the format: <STUDENT_ID>@batechu.com",
    };
  }

  const [studentId, domain] = parts;

  // Domain verification (must be batechu.com exactly)
  if (domain !== UNIVERSITY_DOMAIN) {
    return {
      isValid: false,
      error: `University email domain must be @${UNIVERSITY_DOMAIN}. Please use your official university email.`,
    };
  }

  // Local part verification (digits only)
  if (!/^\d+$/.test(studentId)) {
    return {
      isValid: false,
      error: "Student ID in university email must contain numbers only before @batechu.com (e.g. 123456@batechu.com).",
    };
  }

  return {
    isValid: true,
    normalized,
    studentId,
  };
}

/**
 * Validates an optional personal email (e.g. Google/Gmail address).
 * Standard email format, trimmed and normalized.
 */
export function validatePersonalEmail(rawEmail: unknown): {
  isValid: boolean;
  error?: string;
  normalized?: string;
} {
  if (!rawEmail || typeof rawEmail !== "string" || !rawEmail.trim()) {
    return { isValid: true, normalized: "" };
  }

  const trimmed = rawEmail.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (trimmed.length > 254 || !emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: "Enter a valid email address or leave it empty.",
    };
  }

  return {
    isValid: true,
    normalized: trimmed,
  };
}
