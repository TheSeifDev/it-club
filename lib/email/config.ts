/**
 * Server-only configuration for direct Gmail SMTP email dispatch.
 * Never expose GMAIL_APP_PASSWORD, credentials, or secrets to browser bundles.
 */

export interface EmailConfig {
  gmailUser: string | undefined;
  gmailAppPassword: string | undefined;
  smtpHost: string;
  smtpPort: number;
  secure: boolean;
  from: string;
  appBaseUrl: string;
}

export function getEmailConfig(): EmailConfig {
  const gmailUser = process.env.GMAIL_USER?.trim() || undefined;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.trim() || undefined;

  const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const rawPort = parseInt(process.env.SMTP_PORT?.trim() || "465", 10);
  const smtpPort = Number.isInteger(rawPort) && rawPort > 0 ? rawPort : 465;
  // Port 465 uses SSL/TLS (secure: true); port 587 uses STARTTLS (secure: false)
  const secure = smtpPort === 465;

  // Use configured EMAIL_FROM or default to legitimate Gmail sender alias
  let from = process.env.EMAIL_FROM?.trim();
  if (!from) {
    from = gmailUser
      ? `IT Club Recruitment <${gmailUser}>`
      : "IT Club Recruitment <seif.tanjiro@gmail.com>";
  }

  // Ensure production emails link to the actual verified application URL
  let appBaseUrl =
    process.env.APP_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://dev.itclub.one";

  appBaseUrl = appBaseUrl.replace(/\/+$/, "");

  return {
    gmailUser,
    gmailAppPassword,
    smtpHost,
    smtpPort,
    secure,
    from,
    appBaseUrl,
  };
}

/**
 * Validates the presence of required credentials without leaking values.
 * Truthfully identifies placeholder values as unconfigured to prevent false delivery claims.
 */
export function isEmailConfigured(): boolean {
  const config = getEmailConfig();
  if (!config.gmailUser || !config.gmailAppPassword) {
    return false;
  }

  const cleanAppPassword = config.gmailAppPassword.replace(/\s+/g, "");
  if (
    cleanAppPassword === "SET_THIS_IN_VERCEL_ENVIRONMENT_VARIABLES" ||
    cleanAppPassword === "your-16-character-app-password" ||
    cleanAppPassword.startsWith("your_") ||
    cleanAppPassword.length < 8
  ) {
    return false;
  }

  return config.gmailUser.includes("@");
}
