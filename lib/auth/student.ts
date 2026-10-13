import { cookies } from "next/headers.js";
import type { User } from "@supabase/supabase-js";
import { createClient as createServerSupabaseClient } from "../../utils/supabase/server.ts";
import { getServiceRoleClient } from "./service-role.ts";
import type { ApplicationDetail } from "../admin/types.ts";
import { maskNationalId } from "../admin/transitions.ts";

export interface StudentContext {
  user: User;
  application: ApplicationDetail;
  activatedAt: string;
}

/**
 * Retrieves the authenticated student context by verifying the session
 * and the database-backed link in public.student_accounts and public.applications.
 * Does not trust client-supplied JWT claims or mutable metadata.
 */
export async function getCurrentStudent(): Promise<StudentContext | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerSupabaseClient(cookieStore);
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user || !user.email) {
      return null;
    }

    const serviceClient = getServiceRoleClient();

    // Query the mapping table to verify authorized linkage
    const { data: account, error: accountErr } = await serviceClient
      .from("student_accounts")
      .select("application_id, university_email, activated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (accountErr || !account) {
      return null;
    }

    // Verify the linked application is in ACCEPTED status
    const { data: app, error: appErr } = await serviceClient
      .from("applications")
      .select("*")
      .eq("id", account.application_id)
      .eq("status", "ACCEPTED")
      .maybeSingle();

    if (appErr || !app) {
      return null;
    }

    // Ensure university email matches between auth user and application
    if (app.university_email.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
      return null;
    }

    return {
      user,
      application: {
        ...app,
        national_id_masked: maskNationalId(app.national_id),
      },
      activatedAt: account.activated_at,
    };
  } catch {
    return null;
  }
}
