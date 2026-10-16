import { getServiceRoleClient } from "../auth/service-role.ts";
import type {
  ApplicationStatus,
  CommitteeTrack,
  DashboardMetrics,
  ApplicationFilters,
  PaginatedApplications,
  ApplicationListItem,
  ApplicationDetail,
  InvitationNotificationSummary,
} from "./types.ts";
import {
  COMMITTEE_TRACKS,
  VALID_STATUSES,
  isApplicationStatus,
  isValidStatusTransition,
  maskNationalId,
} from "./transitions.ts";

const ALLOWED_SORT_FIELDS = ["created_at", "full_name", "status", "primary_track"] as const;

/**
 * Computes dashboard recruitment metrics from the live database.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const serviceClient = getServiceRoleClient();
  const { data, error } = await serviceClient
    .from("applications")
    .select("status, primary_track, secondary_track, created_at");

  if (error) {
    throw new Error(`Failed to load recruitment metrics: ${error.message}`);
  }

  const byStatus: Record<ApplicationStatus, number> = {
    PENDING_REVIEW: 0,
    UNDER_REVIEW: 0,
    NEEDS_CORRECTION: 0,
    SHORTLISTED: 0,
    INTERVIEW_SCHEDULED: 0,
    INTERVIEWED: 0,
    ACCEPTED: 0,
    REJECTED: 0,
    WAITLISTED: 0,
  };

  const byPrimary: Record<CommitteeTrack, number> = {
    hr: 0,
    pr: 0,
    sm: 0,
    oc: 0,
    it: 0,
    rnd: 0,
  };

  const bySecondary: Record<CommitteeTrack, number> = {
    hr: 0,
    pr: 0,
    sm: 0,
    oc: 0,
    it: 0,
    rnd: 0,
  };

  const byCombined: Record<CommitteeTrack, number> = {
    hr: 0,
    pr: 0,
    sm: 0,
    oc: 0,
    it: 0,
    rnd: 0,
  };

  let totalPrimary = 0;
  let totalSecondary = 0;
  let recentCount24h = 0;
  const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;
  const submissionsByDate = new Map<string, number>();

  for (const row of data || []) {
    if (row.status && row.status in byStatus) {
      byStatus[row.status as ApplicationStatus] += 1;
    }
    if (row.primary_track && row.primary_track in byPrimary) {
      const pt = row.primary_track as CommitteeTrack;
      byPrimary[pt] += 1;
      byCombined[pt] += 1;
      totalPrimary += 1;
    }
    if (row.secondary_track && row.secondary_track in bySecondary) {
      const st = row.secondary_track as CommitteeTrack;
      bySecondary[st] += 1;
      byCombined[st] += 1;
      totalSecondary += 1;
    }
    if (row.created_at && new Date(row.created_at).getTime() >= cutoff24h) {
      recentCount24h += 1;
    }
    if (row.created_at) {
      const day = new Date(row.created_at).toISOString().slice(0, 10);
      submissionsByDate.set(day, (submissionsByDate.get(day) || 0) + 1);
    }
  }

  const today = new Date();
  const submissionsByDay = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (13 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      count: submissionsByDate.get(key) || 0,
    };
  });

  return {
    total: data?.length || 0,
    byStatus,
    byTrack: byPrimary,
    trackMetrics: {
      byPrimary,
      bySecondary,
      byCombined,
      totalPrimary,
      totalSecondary,
      totalSelections: totalPrimary + totalSecondary,
    },
    recentCount24h,
    submissionsByDay,
    pipeline: VALID_STATUSES.map((status) => ({
      status,
      count: byStatus[status],
    })),
  };
}

/** Latest persisted SMTP attempt; SENT means SMTP accepted, never mailbox delivery. */
export async function getLatestInvitationNotification(
  applicationId: string
): Promise<InvitationNotificationSummary | null> {
  const { data, error } = await getServiceRoleClient()
    .from("application_notifications")
    .select("notification_type, recipient_email, delivery_status, attempted_at, completed_at, attempt_count, provider_message_id, safe_error_category")
    .eq("application_id", applicationId)
    .in("notification_type", ["SHORTLISTED_INVITATION", "ACCEPTANCE_INVITATION"])
    .order("attempted_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to load invitation notification: ${error.message}`);
  return data as InvitationNotificationSummary | null;
}

/**
 * Lists applications with server-side pagination, search, filtering, and sorting.
 * Masks sensitive National IDs in the returned list.
 */
export async function listApplications(
  filters: ApplicationFilters = {}
): Promise<PaginatedApplications> {
  const serviceClient = getServiceRoleClient();

  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 10));
  const offset = (page - 1) * pageSize;

  let query = serviceClient
    .from("applications")
    .select(
      "id, application_reference, full_name, national_id, academic_id, university_email, academic_year, department, primary_track, secondary_track, experience_level, status, reviewed_by, reviewed_at, created_at, updated_at",
      { count: "exact" }
    );

  // Status Filter
  if (filters.status && filters.status !== "ALL" && isApplicationStatus(filters.status)) {
    query = query.eq("status", filters.status);
  }

  // Track Filter with primary / secondary / either preference scope
  if (filters.track && filters.track !== "ALL" && COMMITTEE_TRACKS.includes(filters.track as CommitteeTrack)) {
    const scope = filters.trackScope || "primary";
    if (scope === "secondary") {
      query = query.eq("secondary_track", filters.track);
    } else if (scope === "either") {
      query = query.or(`primary_track.eq.${filters.track},secondary_track.eq.${filters.track}`);
    } else {
      query = query.eq("primary_track", filters.track);
    }
  }

  // Submission Date Filter (YYYY-MM-DD from timeline click)
  if (filters.date && /^\d{4}-\d{2}-\d{2}$/.test(filters.date.trim())) {
    const cleanDate = filters.date.trim();
    const startOfDay = `${cleanDate}T00:00:00.000Z`;
    const endOfDay = `${cleanDate}T23:59:59.999Z`;
    query = query.gte("created_at", startOfDay).lte("created_at", endOfDay);
  }

  // Academic Year Filter
  if (filters.year && filters.year !== "ALL") {
    query = query.eq("academic_year", filters.year);
  }

  // Text Search Filter (Reference, Full Name, Student ID, Email)
  if (filters.search && filters.search.trim()) {
    const cleanSearch = filters.search.trim().replace(/[%_]/g, "\\$&");
    query = query.or(
      `application_reference.ilike.%${cleanSearch}%,full_name.ilike.%${cleanSearch}%,academic_id.ilike.%${cleanSearch}%,university_email.ilike.%${cleanSearch}%`
    );
  }

  // Safe Sort
  const requestedSort = filters.sortBy as (typeof ALLOWED_SORT_FIELDS)[number] | undefined;
  const sortBy = requestedSort && ALLOWED_SORT_FIELDS.includes(requestedSort)
    ? requestedSort
    : "created_at";
  const ascending = filters.sortOrder === "asc";
  query = query.order(sortBy, { ascending });

  // Range Pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to list applications: ${error.message}`);
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  type RawApplicationRow = Omit<ApplicationListItem, "national_id_masked"> & {
    national_id: string;
  };

  const applications: ApplicationListItem[] = ((data as unknown as RawApplicationRow[]) || []).map((row) => ({
    id: row.id,
    application_reference: row.application_reference,
    full_name: row.full_name,
    national_id_masked: maskNationalId(row.national_id),
    academic_id: row.academic_id,
    university_email: row.university_email,
    academic_year: row.academic_year,
    department: row.department,
    primary_track: row.primary_track,
    secondary_track: row.secondary_track,
    experience_level: row.experience_level,
    status: row.status,
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  return {
    applications,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Retrieves the full application details by UUID or reference code.
 */
export async function getApplicationById(
  idOrReference: string
): Promise<ApplicationDetail | null> {
  const serviceClient = getServiceRoleClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrReference);

  let query = serviceClient.from("applications").select("*");
  if (isUuid) {
    query = query.eq("id", idOrReference);
  } else {
    query = query.eq("application_reference", idOrReference.toUpperCase().trim());
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Failed to get application: ${error.message}`);
  }

  if (!data) return null;

  return {
    ...data,
    national_id_masked: maskNationalId(data.national_id),
  };
}

export interface UpdateStatusResult {
  success: boolean;
  code?: "INVALID_STATUS" | "NOT_FOUND" | "CONFLICT" | "INVALID_TRANSITION" | "DATABASE_ERROR";
  error?: string;
  application?: ApplicationDetail;
  previousStatus?: ApplicationStatus;
}

/**
 * Updates an applicant's status with transition validation, optimistic concurrency, and server attribution.
 */
export async function updateApplicationStatus(input: {
  id: string;
  nextStatus: string;
  reviewerNotes?: string;
  reviewerUserId: string;
  expectedCurrentStatus?: string;
  interviewDate?: string | null;
  interviewTime?: string | null;
  interviewLocation?: string | null;
}): Promise<UpdateStatusResult> {
  if (!isApplicationStatus(input.nextStatus)) {
    return {
      success: false,
      code: "INVALID_STATUS",
      error: `Invalid application status: '${input.nextStatus}'.`,
    };
  }

  const serviceClient = getServiceRoleClient();

  // 1. Fetch current application record
  const { data: current, error: fetchErr } = await serviceClient
    .from("applications")
    .select("id, status, reviewer_notes, application_reference, interview_date, interview_time, interview_location")
    .eq("id", input.id)
    .maybeSingle();

  if (fetchErr) {
    return {
      success: false,
      code: "DATABASE_ERROR",
      error: `Failed to verify application: ${fetchErr.message}`,
    };
  }

  if (!current) {
    return {
      success: false,
      code: "NOT_FOUND",
      error: "Application record not found.",
    };
  }

  // 2. Concurrency check (prevent duplicate or conflicting updates)
  if (
    input.expectedCurrentStatus &&
    input.expectedCurrentStatus !== current.status
  ) {
    return {
      success: false,
      code: "CONFLICT",
      error: `Application status was recently updated to '${current.status}' by another staff member. Please refresh the page.`,
    };
  }

  // 3. State transition rule check
  const currentStatus = current.status as ApplicationStatus;
  const targetStatus = input.nextStatus as ApplicationStatus;

  if (!isValidStatusTransition(currentStatus, targetStatus)) {
    return {
      success: false,
      code: "INVALID_TRANSITION",
      error: `Invalid transition: cannot advance application from '${currentStatus}' to '${targetStatus}'.`,
    };
  }

  // 4. Concurrency-safe, server-stamped update
  const now = new Date().toISOString();
  const updatePayload: Record<string, string | null> = {
    status: targetStatus,
    reviewed_by: input.reviewerUserId,
    reviewed_at: now,
    updated_at: now,
  };

  if (typeof input.reviewerNotes === "string") {
    updatePayload.reviewer_notes = input.reviewerNotes.trim();
  }

  if (typeof input.interviewDate !== "undefined") {
    updatePayload.interview_date = input.interviewDate ? input.interviewDate.trim() : null;
  }
  if (typeof input.interviewTime !== "undefined") {
    updatePayload.interview_time = input.interviewTime ? input.interviewTime.trim() : null;
  }
  if (typeof input.interviewLocation !== "undefined") {
    updatePayload.interview_location = input.interviewLocation ? input.interviewLocation.trim() : null;
  }

  const { data: updated, error: updateErr } = await serviceClient
    .from("applications")
    .update(updatePayload)
    .eq("id", input.id)
    .select()
    .single();

  if (updateErr) {
    return {
      success: false,
      code: "DATABASE_ERROR",
      error: `Failed to persist review decision: ${updateErr.message}`,
    };
  }

  return {
    success: true,
    previousStatus: currentStatus,
    application: {
      ...updated,
      national_id_masked: maskNationalId(updated.national_id),
    },
  };
}

/**
 * Updates internal reviewer notes without altering status.
 */
export async function saveReviewerNotes(input: {
  id: string;
  notes: string;
  reviewerUserId: string;
}): Promise<{ success: boolean; error?: string }> {
  const serviceClient = getServiceRoleClient();
  const now = new Date().toISOString();

  const { error } = await serviceClient
    .from("applications")
    .update({
      reviewer_notes: input.notes.trim(),
      updated_at: now,
    })
    .eq("id", input.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
