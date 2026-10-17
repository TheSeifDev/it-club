import { getServiceRoleClient } from "../auth/service-role.ts";
import type {
  RecordAuditEventInput,
  AuditLogFilters,
  PaginatedAuditEvents,
  AuditEventRecord,
  AuditStats,
} from "./types.ts";

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /cookie/i,
  /session/i,
  /api[-_]?key/i,
  /auth[-_]?key/i,
  /private[-_]?key/i,
  /token_hash/i,
  /email_body/i,
  /body_html/i,
  /body_text/i,
  /raw_payload/i,
];

const NATIONAL_ID_KEY_PATTERNS = [/national[-_]?id/i, /nid/i];

const TOKEN_KEY_PATTERNS = [/bearer/i, /access[-_]?token/i, /refresh[-_]?token/i, /raw[-_]?token/i];

/**
 * Recursively sanitizes metadata dictionaries to ensure sensitive PII,
 * credentials, and raw bearer tokens are never persisted in the audit trail.
 */
export function sanitizeAuditMetadata(
  input: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!input || typeof input !== "object") return {};

  const sanitized: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(input)) {
    // 1. Omit undefined
    if (val === undefined) continue;

    // 2. Sensitive credential keys
    if (SENSITIVE_KEY_PATTERNS.some((p) => p.test(key))) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    // 3. National ID keys
    if (NATIONAL_ID_KEY_PATTERNS.some((p) => p.test(key))) {
      if (typeof val === "string" && val.length >= 10) {
        sanitized[key] = `${val.slice(0, 4)}******${val.slice(-4)}`;
      } else {
        sanitized[key] = "[REDACTED_NATIONAL_ID]";
      }
      continue;
    }

    // 4. Token keys
    if (TOKEN_KEY_PATTERNS.some((p) => p.test(key))) {
      sanitized[key] = "[REDACTED_TOKEN]";
      continue;
    }

    // 5. String value inspection (e.g. raw QR token in arbitrary field)
    if (typeof val === "string") {
      if (val.startsWith("itc_qr_")) {
        sanitized[key] = `${val.slice(0, 10)}...[REDACTED]`;
        continue;
      }
      // Egyptian national ID pattern: 14 digits starting with 2 or 3
      if (/^[23]\d{13}$/.test(val)) {
        sanitized[key] = `${val.slice(0, 4)}******${val.slice(-4)}`;
        continue;
      }
      // Passwords or tokens in value
      if (val.length > 500) {
        sanitized[key] = `${val.slice(0, 500)}... [TRUNCATED]`;
        continue;
      }
      sanitized[key] = val;
      continue;
    }

    // 6. Nested objects
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      sanitized[key] = sanitizeAuditMetadata(val as Record<string, unknown>);
      continue;
    }

    // 7. Arrays
    if (Array.isArray(val)) {
      sanitized[key] = val.map((item) =>
        item !== null && typeof item === "object"
          ? sanitizeAuditMetadata(item as Record<string, unknown>)
          : typeof item === "string" && item.startsWith("itc_qr_")
          ? "[REDACTED_TOKEN]"
          : item
      );
      continue;
    }

    sanitized[key] = val;
  }

  return sanitized;
}

/**
 * Records an immutable audit log entry into public.audit_events.
 * Operates with service-role privileges so it never fails due to client RLS restrictions.
 * Always catches database write errors to prevent taking down business transactions.
 */
export async function recordAuditEvent(
  input: RecordAuditEventInput
): Promise<{ success: boolean; eventId?: string; id?: string; error?: string }> {
  try {
    const serviceClient = getServiceRoleClient();

    const sanitizedMetadata = sanitizeAuditMetadata(input.metadata || {});

    const rawActorId = input.actor?.id ?? input.actorId ?? null;
    const isActorUuid =
      typeof rawActorId === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawActorId);
    const actorId = isActorUuid ? rawActorId : null;
    const actorEmail = input.actor?.email ?? input.actorEmail ?? null;
    const actorRole = input.actor?.role ?? input.actorRole ?? "system";

    const { data, error } = await serviceClient
      .from("audit_events")
      .insert({
        actor_id: actorId,
        actor_email: actorEmail,
        actor_role: actorRole,
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId || null,
        entity_reference: input.entityReference || null,
        previous_status: input.previousStatus || null,
        new_status: input.newStatus || null,
        metadata: sanitizedMetadata,
        request_id: input.requestId || null,
        outcome: input.outcome,
        error_category: input.errorCategory || null,
        ip_address: input.ipAddress || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[audit] Failed to write audit event:", error.message, {
        action: input.action,
        entityType: input.entityType,
      });
      return { success: false, error: error.message };
    }

    return { success: true, eventId: data.id, id: data.id };
  } catch (err) {
    console.error("[audit] Unexpected exception recording audit event:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Queries audit events with server-side pagination, structured filters, and safe search.
 * Strictly bounded: max 100 records per page.
 */
export async function queryAuditLogs(
  filters: AuditLogFilters = {}
): Promise<PaginatedAuditEvents> {
  const serviceClient = getServiceRoleClient();

  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 20));
  const offset = (page - 1) * pageSize;

  let query = serviceClient
    .from("audit_events")
    .select(
      "id, created_at, actor_id, actor_email, actor_role, action, entity_type, entity_id, entity_reference, previous_status, new_status, metadata, request_id, outcome, error_category, ip_address",
      { count: "exact" }
    );

  // 1. Filter by Action
  if (filters.action && filters.action !== "ALL") {
    query = query.eq("action", filters.action);
  }

  // 2. Filter by Entity Type
  if (filters.entityType && filters.entityType !== "ALL") {
    query = query.eq("entity_type", filters.entityType);
  }

  // 3. Filter by Outcome
  if (filters.outcome && filters.outcome !== "ALL") {
    query = query.eq("outcome", filters.outcome);
  }

  // 4. Filter by Actor Role
  if (filters.actorRole && filters.actorRole !== "ALL") {
    query = query.eq("actor_role", filters.actorRole);
  }

  // 4b. Filter by Actor ID
  if (filters.actorId && filters.actorId.trim() && filters.actorId !== "ALL") {
    query = query.eq("actor_id", filters.actorId.trim());
  }

  // 5. Date Range Filters
  if (filters.from) {
    query = query.gte("created_at", filters.from);
  }
  if (filters.to) {
    query = query.lte("created_at", filters.to);
  }

  // 6. Free text Search (reference, actor email, or entity ID)
  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim();
    query = query.or(
      `entity_reference.ilike.%${term}%,actor_email.ilike.%${term}%,entity_id.eq.${term}`
    );
  }

  // Order descending by creation time
  query = query.order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("[audit] Query error:", error.message);
    throw new Error(`Failed to query audit events: ${error.message}`);
  }

  const totalCount = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    events: (data || []) as AuditEventRecord[],
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Retrieves aggregate audit log statistics for owner analytics.
 */
export async function getAuditStats(): Promise<AuditStats> {
  const serviceClient = getServiceRoleClient();

  const { data, error } = await serviceClient
    .from("audit_events")
    .select("created_at, outcome, entity_type");

  if (error) {
    console.error("[audit] Stats query error:", error.message);
    return {
      total: 0,
      recent24h: 0,
      successful: 0,
      failed: 0,
      byEntityType: {},
    };
  }

  const rows = data || [];
  const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;

  let successful = 0;
  let failed = 0;
  let recent24h = 0;
  const byEntityType: Record<string, number> = {};

  for (const row of rows) {
    if (row.outcome === "SUCCESS") successful++;
    else if (row.outcome === "FAILURE") failed++;

    if (row.created_at && new Date(row.created_at).getTime() >= cutoff24h) {
      recent24h++;
    }

    if (row.entity_type) {
      byEntityType[row.entity_type] = (byEntityType[row.entity_type] || 0) + 1;
    }
  }

  return {
    total: rows.length,
    recent24h,
    successful,
    failed,
    byEntityType,
  };
}
