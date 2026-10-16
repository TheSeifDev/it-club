export type StaffRole = "owner" | "admin" | "interviewer";

export interface StaffMember {
  user_id: string;
  role: StaffRole;
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

