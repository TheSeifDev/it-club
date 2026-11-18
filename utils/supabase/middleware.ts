import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getPreviewCookieOptions, hasSupabasePublicConfig } from "./config.ts";

export const createClient = async (request: NextRequest) => {
  // Without configured Supabase credentials, leave the user logged out and let
  // server-side guards present their normal sign-in/configuration state.
  if (!hasSupabasePublicConfig()) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });
  const previewCookieOptions = getPreviewCookieOptions();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: previewCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              ...previewCookieOptions,
            })
          );
        },
      },
    }
  );

  // Refresh auth tokens when required. Authorization remains in route/page guards.
  await supabase.auth.getUser();
  return supabaseResponse;
};
