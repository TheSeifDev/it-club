import { getServiceRoleClient } from "../auth/service-role.ts";
import type {
  ApplicationStatus,
  CommitteeTrack,
  DashboardMetrics,
  ApplicationFilters,
  PaginatedApplications,
  ApplicationListItem,
  ApplicationDetail,
} from "./types.ts";
import {
  COMMITTEE_TRACKS,
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
    .select("status, primary_track, created_at");

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

  const byTrack: Record<CommitteeTrack, number> = {
    hr: 0,
    pr: 0,
    sm: 0,
    oc: 0,
    it: 0,
    rnd: 0,
  };

  let recentCount24h = 0;
  const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;

  for (const row of data || []) {
    if (row.status && row.status in byStatus) {
      byStatus[row.status as ApplicationStatus] += 1;
    }
    if (row.primary_track && row.primary_track in byTrack) {
      byTrack[row.primary_track as CommitteeTrack] += 1;
    }
    if (row.created_at && new Date(row.created_at).getTime() >= cutoff24h) {
      recentCount24h += 1;
    }
  }

  return {
    total: data?.length || 0,
    byStatus,
    byTrack,
    recentCount24h,
  };
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

  // Track Filter
  if (filters.track && filters.track !== "ALL" && COMMITTEE_TRACKS.includes(filters.track as CommitteeTrack)) {
    query = query.eq("primary_track", filters.track);
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
    .select("id, status, reviewer_notes, application_reference")
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
