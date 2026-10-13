/**
 * Server-only configuration for transactional recruitment emails.
 * Never expose RESEND_API_KEY or provider secrets to browser bundles.
 */

export interface EmailConfig {
  apiKey: string | undefined;
  from: string;
  appBaseUrl: string;
}

export function getEmailConfig(): EmailConfig {
  const apiKey = process.env.RESEND_API_KEY?.trim() || undefined;
  
  // Default sender: in development/testing without a verified domain,
  // onboarding@resend.dev can send to the account owner's email.
  // In production, configure EMAIL_FROM with your verified domain (e.g. recruitment@itclub.org).
  const from =
    process.env.EMAIL_FROM?.trim() ||
    "IT Club Recruitment <onboarding@resend.dev>";

  // Ensure production emails link to the actual public application URL
  let appBaseUrl =
    process.env.APP_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://it-club-recruitment.vercel.app";

  // Remove trailing slashes for clean URL concatenation
  appBaseUrl = appBaseUrl.replace(/\/+$/, "");

  return {
    apiKey,
    from,
    appBaseUrl,
  };
}

export function isEmailConfigured(): boolean {
  const config = getEmailConfig();
  return Boolean(config.apiKey && config.apiKey.length > 5);
}
