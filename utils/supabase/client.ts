import { createBrowserClient } from "@supabase/ssr";
import { getPreviewCookieOptions, hasSupabasePublicConfig } from "./config.ts";

export const createClient = () => {
  if (!hasSupabasePublicConfig()) {
    throw new Error("Staff authentication is unavailable: Supabase is not configured.");
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookieOptions: getPreviewCookieOptions() }
  );
};
