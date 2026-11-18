export type SupabaseEnvironment = Record<string, string | undefined>;

export function hasSupabasePublicConfig(
  env: SupabaseEnvironment = process.env
): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  );
}

export function hasSupabaseServiceRoleConfig(
  env: SupabaseEnvironment = process.env
): boolean {
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_KEY ||
    env.SUPABASE_SECRET_KEY;
  return Boolean(url?.trim() && serviceKey?.trim());
}

export function getPreviewCookieOptions(
  previewMode = process.env.NEXT_PUBLIC_PREVIEW_MODE === "true"
): { sameSite: "none"; secure: true } | Record<string, never> {
  return previewMode ? { sameSite: "none", secure: true } : {};
}
