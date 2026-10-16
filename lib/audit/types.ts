export type AuditAction =
  // Application actions
  | "APPLICATION_SUBMITTED"
  | "APPLICATION_STATUS_UPDATED"
  | "APPLICATION_REVIEW_NOTE_UPDATED"
  // Notification actions
  | "NOTIFICATION_ATTEMPTED"
  | "NOTIFICATION_DELIVERED"
  | "NOTIFICATION_FAILED"
  // Student account actions
  | "STUDENT_ACCOUNT_ACTIVATED"
  // Interview actions
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_QR_ISSUED"
  | "INTERVIEW_QR_REVOKED"
  | "INTERVIEW_CHECK_IN_SUCCESS"
  | "INTERVIEW_CHECK_IN_DUPLICATE"
  | "INTERVIEW_CANDIDATE_LOOKUP"
  | "INTERVIEW_EVALUATION_CREATED"
  | "INTERVIEW_EVALUATION_UPDATED"
  // Staff actions
  | "STAFF_ROLE_ASSIGNED"
  | "OWNER_BOOTSTRAP";

export type AuditEntityType =
  | "application"
  | "notification"
  | "student_account"
  | "interview_qr"
  | "staff_member"
  | "system"
  | "interview_evaluation";

export type AuditActorRole = "owner" | "admin" | "interviewer" | "student" | "applicant" | "system" | "anonymous";


export type AuditOutcome = "SUCCESS" | "FAILURE";

export interface AuditActor {
  id?: string | null;
  email?: string | null;
  role: AuditActorRole;
}

export interface AuditEventRecord {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: AuditActorRole;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string | null;
  entity_reference: string | null;
  previous_status: string | null;
  new_status: string | null;
  metadata: Record<string, unknown>;
  request_id: string | null;
  outcome: AuditOutcome;
  error_category: string | null;
  ip_address: string | null;
}

export interface RecordAuditEventInput {
  actor?: AuditActor;
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: AuditActorRole;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  entityReference?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  metadata?: Record<string, unknown>;
  requestId?: string | null;
  outcome: AuditOutcome;
  errorCategory?: string | null;
  ipAddress?: string | null;
}

export interface AuditLogFilters {
  page?: number | string;
  pageSize?: number | string;
  action?: string;
  entityType?: string;
  outcome?: string;
  actorRole?: string;
  search?: string;
  from?: string;
  to?: string;
}

export interface PaginatedAuditEvents {
  events: AuditEventRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuditStats {
  total: number;
  recent24h: number;
  successful: number;
  failed: number;
  byEntityType: Record<string, number>;
}
