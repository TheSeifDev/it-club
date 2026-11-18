import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers.js";
import { getPreviewCookieOptions, hasSupabasePublicConfig } from "./config.ts";

export class SupabaseConfigurationUnavailableError extends Error {
  constructor() {
    super("Supabase authentication configuration is unavailable.");
    this.name = "SupabaseConfigurationUnavailableError";
  }
}

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  if (!hasSupabasePublicConfig()) {
    throw new SupabaseConfigurationUnavailableError();
  }

  const previewCookieOptions = getPreviewCookieOptions();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: previewCookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...previewCookieOptions,
              })
            );
          } catch {
            // Server Components cannot mutate cookies. Proxy/Route Handlers
            // perform refresh writes when a response context is available.
          }
        },
      },
    }
  );
};
