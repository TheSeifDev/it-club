export type StaffRole = "owner" | "admin" | "interviewer";

/**
 * Canonical committee identifiers that match public.applications.primary_track.
 * These are the only valid values for staff_members.committee.
 */
export type CommitteeTrack = "hr" | "pr" | "sm" | "oc" | "it" | "rnd";

export const VALID_COMMITTEE_TRACKS: readonly CommitteeTrack[] = [
  "hr",
  "pr",
  "sm",
  "oc",
  "it",
  "rnd",
] as const;

export function isCommitteeTrack(val: unknown): val is CommitteeTrack {
  return (
    typeof val === "string" &&
    VALID_COMMITTEE_TRACKS.includes(val as CommitteeTrack)
  );
}

export interface StaffMember {
  user_id: string;
  role: StaffRole;
  /**
   * Authoritative committee assignment for this staff member.
   * - Owner: null (unrestricted access to all committees)
   * - Admin/Interviewer: must be a valid CommitteeTrack value
   * - null for non-owner staff means NO committee is assigned — deny-by-default.
   */
  committee?: CommitteeTrack | null;
  email?: string | null;
  created_at: string;
  created_by: string | null;
  password_change_required?: boolean;
  temporary_password_issued_at?: string | null;
  temporary_password_expires_at?: string | null;
  password_changed_at?: string | null;
}

export function isStaffRole(val: unknown): val is StaffRole {
  return val === "owner" || val === "admin" || val === "interviewer";
}
