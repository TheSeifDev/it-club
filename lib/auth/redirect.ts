const INTERNAL_ORIGIN = "https://itclub.invalid";
const INTERVIEW_PREFIX = "/interview";
const STUDENT_LOGIN_PATH = "/student/login";
const STUDENT_ACTIVATION_PATH = "/student/activate";

function isAllowedInternalPath(pathname: string): boolean {
  return (
    pathname === INTERVIEW_PREFIX ||
    pathname.startsWith(`${INTERVIEW_PREFIX}/`) ||
    pathname === STUDENT_LOGIN_PATH
  );
}

function safeFallback(fallback: string): string {
  try {
    const url = new URL(fallback, INTERNAL_ORIGIN);
    return url.origin === INTERNAL_ORIGIN && isAllowedInternalPath(url.pathname)
      ? `${url.pathname}${url.search}`
      : INTERVIEW_PREFIX;
  } catch {
    return INTERVIEW_PREFIX;
  }
}

/**
 * Restricts staff redirect destinations to interview operations (plus the
 * student-login exit used by sign-out). `/admin` is only a destination in the
 * separate owner-only content login flow.
 */
export function sanitizeRedirectPath(
  rawPath: string | null | undefined,
  defaultFallback = INTERVIEW_PREFIX
): string {
  const fallback = safeFallback(defaultFallback);
  if (typeof rawPath !== "string" || !rawPath || rawPath !== rawPath.trim()) {
    return fallback;
  }
  if (
    !rawPath.startsWith("/") ||
    rawPath.startsWith("//") ||
    rawPath.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(rawPath) ||
    /%(?:2f|5c)/i.test(rawPath) ||
    rawPath.includes("#")
  ) {
    return fallback;
  }

  try {
    const url = new URL(rawPath, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN || !isAllowedInternalPath(url.pathname)) {
      return fallback;
    }

    // Reject dot-segment and encoded traversal forms rather than relying on
    // URL normalization to decide which route the browser or server receives.
    const decodedPath = decodeURIComponent(url.pathname);
    if (
      decodedPath.includes("\\") ||
      decodedPath.split("/").some((segment) => segment === "." || segment === "..")
    ) {
      return fallback;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}

export type StaffLoginMode = "interview" | "content";

/**
 * CMS login has a fixed destination. It ignores `next` and returns `/admin`
 * only after the caller has verified the role from the server-backed staff row.
 */
export function getStaffLoginDestination(input: {
  mode?: StaffLoginMode;
  verifiedRole: string | null | undefined;
  next?: string | null;
}): string | null {
  if (input.mode === "content") {
    return input.verifiedRole === "owner" ? "/admin" : null;
  }
  return sanitizeRedirectPath(input.next, INTERVIEW_PREFIX);
}

function sanitizeInterviewPath(rawPath: string | null | undefined): string {
  const safePath = sanitizeRedirectPath(rawPath, INTERVIEW_PREFIX);
  return safePath === INTERVIEW_PREFIX || safePath.startsWith(`${INTERVIEW_PREFIX}/`)
    ? safePath
    : INTERVIEW_PREFIX;
}

/**
 * Builds the post-password-change destination from a verified staff role.
 * Only a DB-verified owner may retain the CMS return path; all other paths are
 * constrained to interview operations by the same sanitizer used at login.
 */
export function getStaffPasswordChangeUrl(input: {
  verifiedRole: string;
  returnTo?: string | null;
  error?: string | null;
}): string {
  let next: string | null = null;
  if (input.returnTo === "/admin" && input.verifiedRole === "owner") {
    next = "/admin";
  } else if (input.returnTo) {
    next = sanitizeInterviewPath(input.returnTo);
  }

  const query = new URLSearchParams();
  if (next) query.set("next", next);
  if (input.error) query.set("error", input.error);
  const suffix = query.toString();
  return `/interview/change-password${suffix ? `?${suffix}` : ""}`;
}

/** Resolve the final destination after the password update has succeeded. */
export function getStaffPostPasswordChangeDestination(input: {
  verifiedRole: string;
  returnTo?: string | null;
}): string {
  if (input.returnTo === "/admin") {
    return input.verifiedRole === "owner" ? "/admin" : INTERVIEW_PREFIX;
  }
  return sanitizeInterviewPath(input.returnTo);
}

/**
 * Auth confirmation callbacks always keep student flows on the student
 * activation route. A recovery callback is redirected to staff password change
 * only when the callback handler has verified a staff role from the DB.
 */
export function getAuthConfirmationDestination(input: {
  verificationType: string | null;
  verifiedStaffRole?: string | null;
  studentNext?: string | null;
}): string {
  if (
    input.verificationType === "recovery" &&
    (input.verifiedStaffRole === "owner" ||
      input.verifiedStaffRole === "admin" ||
      input.verifiedStaffRole === "interviewer")
  ) {
    return getStaffPasswordChangeUrl({
      verifiedRole: input.verifiedStaffRole,
      returnTo: input.verifiedStaffRole === "owner" ? "/admin" : null,
    });
  }

  if (input.studentNext === STUDENT_ACTIVATION_PATH) {
    return STUDENT_ACTIVATION_PATH;
  }
  return STUDENT_ACTIVATION_PATH;
}
