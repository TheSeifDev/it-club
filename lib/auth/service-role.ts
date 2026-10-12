import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a dedicated server-only Supabase client with service-role privileges.
 * This client does NOT inherit SSR cookies or user sessions and MUST NEVER
 * be exposed to client-side components.
 */
export function getServiceRoleClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Service role configuration missing: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in environment."
    );
  }

  return createSupabaseClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        "x-application-source": "it-club-staff-auth",
      },
    },
  });
}
