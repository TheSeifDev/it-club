export type StaffRole = "owner" | "admin" | "interviewer";

export interface StaffMember {
  user_id: string;
  role: StaffRole;
  created_at: string;
  created_by: string | null;
}

export function isStaffRole(val: unknown): val is StaffRole {
  return val === "owner" || val === "admin" || val === "interviewer";
}

