/**
 * Egyptian National ID Structural Validator
 *
 * The Egyptian National Identification Number is a 14-digit number:
 * - Digit 1: Century of birth (2 = 1900-1999, 3 = 2000-2099)
 * - Digits 2-3: Birth Year (YY)
 * - Digits 4-5: Birth Month (MM, 01-12)
 * - Digits 6-7: Birth Day (DD, 01-31, respecting monthly lengths and leap years)
 * - Digits 8-9: Governorate / Origin code according to the Egyptian Civil Status Organization
 * - Digits 10-13: Birth sequence number on that date in that governorate (digit 13 indicates gender: odd = male, even = female)
 * - Digit 14: Verification / check digit
 *
 * NOTE ON VERIFICATION BOUNDARY:
 * This validator provides comprehensive structural validation. It verifies that the ID adheres
 * strictly to Egyptian legal specifications (century indicator, verified calendar date, leap year,
 * registered governorate code, digit length). Official identity verification (proving that an ID
 * corresponds to a living individual registered with the Ministry of Interior) requires authorized
 * access to the Egyptian Civil Status Organization (قطاع مصلحة الأحوال المدنية), which is not queryable
 * by public client applications.
 */

export interface EgyptianNationalIdValidationResult {
  isValid: boolean;
  error?: string;
  normalized?: string;
  details?: {
    century: number;
    birthDate: Date;
    birthYear: number;
    birthMonth: number;
    birthDay: number;
    governorateCode: string;
    governorateName: string;
    gender: "male" | "female";
    sequenceNumber: string;
    checkDigit: string;
  };
}

/**
 * Verified governorate codes used by the Egyptian Ministry of Interior / Civil Registry.
 */
export const EGYPTIAN_GOVERNORATES: Record<string, string> = {
  "01": "Cairo (القاهرة)",
  "02": "Alexandria (الإسكندرية)",
  "03": "Port Said (بورسعيد)",
  "04": "Suez (السويس)",
  "11": "Damietta (دمياط)",
  "12": "Dakahlia (الدقهلية)",
  "13": "Ash Sharqia (الشرقية)",
  "14": "Al Qalyubia (القليوبية)",
  "15": "Kafr El Sheikh (كفر الشيخ)",
  "16": "Gharbia (الغربية)",
  "17": "Menofia (المنوفية)",
  "18": "Beheira (البحيرة)",
  "19": "Ismailia (الإسماعيلية)",
  "21": "Giza (الجيزة)",
  "22": "Beni Suef (بني سويف)",
  "23": "Faiyum (الفيوم)",
  "24": "Minya (المنيا)",
  "25": "Asyut (أسيوط)",
  "26": "Sohag (سوهاج)",
  "27": "Qena (قنا)",
  "28": "Aswan (أسوان)",
  "29": "Luxor (الأقصر)",
  "31": "Red Sea (البحر الأحمر)",
  "32": "New Valley (الوادي الجديد)",
  "33": "Matrouh (مطروح)",
  "34": "North Sinai (شمال سيناء)",
  "35": "South Sinai (جنوب سيناء)",
  "88": "Born Abroad (مواليد خارج الجمهورية)",
};

/**
 * Checks if a given year is a Gregorian leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Returns the number of days in a given calendar month, respecting leap years.
 */
export function getDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 0;
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  return 31;
}

/**
 * Normalizes National ID input by stripping whitespace and non-digit characters.
 */
export function normalizeNationalId(rawId: unknown): string {
  if (typeof rawId !== "string") return "";
  return rawId.trim().replace(/\D/g, "");
}

/**
 * Masks a 14-digit Egyptian National ID for sensitive display (e.g. "•••• •••• •••• 1234").
 */
export function maskNationalId(rawId: unknown): string {
  const normalized = normalizeNationalId(rawId);
  if (normalized.length !== 14) return "•••• •••• •••• ••••";
  return `•••• •••• •••• ${normalized.slice(-4)}`;
}

/**
 * Performs structural validation on an Egyptian National ID string.
 */
export function validateEgyptianNationalId(
  rawId: unknown,
  options?: {
    minAge?: number;
    maxAge?: number;
    referenceDate?: Date;
  }
): EgyptianNationalIdValidationResult {
  if (typeof rawId !== "string" || !rawId.trim()) {
    return {
      isValid: false,
      error: "Enter your 14-digit national ID.",
    };
  }

  const id = normalizeNationalId(rawId);

  // 1. Length and numeric format check
  if (id.length !== 14) {
    return {
      isValid: false,
      error: `National ID must be exactly 14 digits (received ${id.length} digits).`,
    };
  }

  // 2. Century indicator verification
  // Digit 1: '2' for 1900-1999, '3' for 2000-2099
  const centuryDigit = id[0];
  if (centuryDigit !== "2" && centuryDigit !== "3") {
    return {
      isValid: false,
      error: "First digit of National ID must be 2 (born 1900–1999) or 3 (born 2000–2099).",
    };
  }

  const centuryPrefix = centuryDigit === "2" ? 1900 : 2000;
  const yearSuffix = parseInt(id.slice(1, 3), 10);
  const birthYear = centuryPrefix + yearSuffix;

  // 3. Month verification (01 - 12)
  const birthMonth = parseInt(id.slice(3, 5), 10);
  if (birthMonth < 1 || birthMonth > 12) {
    return {
      isValid: false,
      error: `Invalid birth month (${id.slice(3, 5)}) encoded in National ID. Must be between 01 and 12.`,
    };
  }

  // 4. Day verification with leap-year handling (01 - 31)
  const birthDay = parseInt(id.slice(5, 7), 10);
  const maxDays = getDaysInMonth(birthYear, birthMonth);
  if (birthDay < 1 || birthDay > maxDays) {
    if (birthMonth === 2 && birthDay === 29 && !isLeapYear(birthYear)) {
      return {
        isValid: false,
        error: `February 29 is invalid for year ${birthYear} because it is not a leap year.`,
      };
    }
    return {
      isValid: false,
      error: `Invalid birth day (${id.slice(5, 7)}) for month ${birthMonth}/${birthYear}. Maximum days allowed is ${maxDays}.`,
    };
  }

  // 5. Date of birth chronologic plausibility
  const birthDate = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay));
  const refDate = options?.referenceDate || new Date();

  if (birthDate.getTime() > refDate.getTime()) {
    return {
      isValid: false,
      error: "Date of birth in National ID cannot be in the future.",
    };
  }

  // Check age constraints (for university applicants)
  const minAge = options?.minAge ?? 15;
  const maxAge = options?.maxAge ?? 100;
  const approxAgeYears = (refDate.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  if (approxAgeYears < minAge) {
    return {
      isValid: false,
      error: `Applicant must be at least ${minAge} years old to register.`,
    };
  }

  if (approxAgeYears > maxAge) {
    return {
      isValid: false,
      error: "Birth year in National ID is outside valid applicant age range.",
    };
  }

  // 6. Governorate code verification
  const govCode = id.slice(7, 9);
  const govName = EGYPTIAN_GOVERNORATES[govCode];
  if (!govName) {
    return {
      isValid: false,
      error: `Invalid Egyptian governorate code (${govCode}) in National ID. Must be a recognized Egyptian civil registry code.`,
    };
  }

  // 7. Sequence & Gender check
  const sequenceNumber = id.slice(9, 13);
  const genderDigit = parseInt(id[12], 10);
  const gender: "male" | "female" = genderDigit % 2 === 1 ? "male" : "female";
  const checkDigit = id[13];

  return {
    isValid: true,
    normalized: id,
    details: {
      century: centuryPrefix,
      birthDate,
      birthYear,
      birthMonth,
      birthDay,
      governorateCode: govCode,
      governorateName: govName,
      gender,
      sequenceNumber,
      checkDigit,
    },
  };
}
