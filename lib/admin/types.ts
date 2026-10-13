export type ApplicationStatus =
  | "PENDING_REVIEW"
  | "UNDER_REVIEW"
  | "NEEDS_CORRECTION"
  | "SHORTLISTED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEWED"
  | "ACCEPTED"
  | "REJECTED"
  | "WAITLISTED";

export type CommitteeTrack = "hr" | "pr" | "sm" | "oc" | "it" | "rnd";

export type AcademicYear = "first" | "second" | "third" | "fourth" | "other";

export type ExperienceLevel = "new" | "beginner" | "computer_skills" | "experienced";

export interface ApplicationListItem {
  id: string;
  application_reference: string;
  full_name: string;
  national_id_masked: string;
  academic_id: string;
  university_email: string;
  academic_year: AcademicYear;
  department: string;
  primary_track: CommitteeTrack;
  secondary_track: CommitteeTrack | null;
  experience_level: ExperienceLevel;
  status: ApplicationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationDetail {
  id: string;
  application_reference: string;
  full_name: string;
  national_id: string;
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
  reviewer_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  interview_date?: string | null;
  interview_time?: string | null;
  interview_location?: string | null;
  consented_at: string;
  created_at: string;
  updated_at: string;
}

export interface TrackDistributionMetrics {
  byPrimary: Record<CommitteeTrack, number>;
  bySecondary: Record<CommitteeTrack, number>;
  byCombined: Record<CommitteeTrack, number>;
  totalPrimary: number;
  totalSecondary: number;
  totalSelections: number;
}

export interface DashboardMetrics {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  byTrack: Record<CommitteeTrack, number>;
  trackMetrics: TrackDistributionMetrics;
  recentCount24h: number;
  submissionsByDay: Array<{
    date: string;
    count: number;
  }>;
  pipeline: Array<{
    status: ApplicationStatus;
    count: number;
  }>;
}

export interface ApplicationFilters {
  search?: string;
  status?: ApplicationStatus | "ALL";
  track?: CommitteeTrack | "ALL";
  trackScope?: "primary" | "secondary" | "either";
  year?: AcademicYear | "ALL";
  date?: string;
  sortBy?: "created_at" | "full_name" | "status" | "primary_track";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface PaginatedApplications {
  applications: ApplicationListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
