import nodemailer, { type Transporter, type SentMessageInfo } from "nodemailer";
import { getEmailConfig, isEmailConfigured } from "./config.ts";

export type MailerSafeCategory =
  | "PROVIDER_NOT_CONFIGURED"
  | "INVALID_RECIPIENT"
  | "AUTHENTICATION_FAILED"
  | "CONNECTION_FAILED"
  | "RATE_LIMITED"
  | "REJECTED_RECIPIENT"
  | "PROVIDER_ERROR";

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
}

export interface MailerResult {
  success: boolean;
  messageId?: string;
  /** Whether Nodemailer reported that the SMTP server accepted this recipient. */
  acceptedRecipient?: boolean;
  safeCategory?: MailerSafeCategory;
  errorMessage?: string;
}

// Global cached transporter for connection reuse across requests in Node runtime
let cachedTransporter: Transporter<SentMessageInfo> | null = null;
let cachedConfigKey = "";

// Mock transporter hook for isolated unit/integration tests
let mockTransporter: Transporter<SentMessageInfo> | null = null;

export function setMockTransporter(
  transporter: Transporter<SentMessageInfo> | null
): void {
  mockTransporter = transporter;
}

export function isEmailProviderActive(): boolean {
  return isEmailConfigured() || Boolean(mockTransporter);
}

export function resetMailerTransporter(): void {
  cachedTransporter = null;
  cachedConfigKey = "";
  mockTransporter = null;
}

export function getTransporter(): Transporter<SentMessageInfo> | null {
  if (mockTransporter) {
    return mockTransporter;
  }

  const config = getEmailConfig();
  if (!config.gmailUser || !config.gmailAppPassword) {
    return null;
  }

  // Test runs opt into an in-memory transport through config/test.env. Keep
  // this after the configuration guard so missing-config tests remain honest.
  if (process.env.EMAIL_TRANSPORT === "mock") {
    return {
      sendMail: async (message: { to?: string | string[] }) => ({
        messageId: `<mock-${Date.now()}@itclub.test>`,
        accepted: [String(message.to)],
        rejected: [],
      }),
    } as unknown as Transporter<SentMessageInfo>;
  }

  const currentKey = `${config.smtpHost}:${config.smtpPort}:${config.secure}:${config.gmailUser}:${config.gmailAppPassword}`;

  if (cachedTransporter && cachedConfigKey === currentKey) {
    return cachedTransporter;
  }

  // Remove whitespace from app password if present (Google displays app passwords in 4x4 blocks)
  const cleanAppPassword = config.gmailAppPassword.replace(/\s+/g, "");

  cachedTransporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.secure, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: config.gmailUser,
      pass: cleanAppPassword,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  cachedConfigKey = currentKey;
  return cachedTransporter;
}

export function classifySmtpError(error: unknown): {
  safeCategory: MailerSafeCategory;
  safeMessage: string;
} {
  if (!(error instanceof Error)) {
    return {
      safeCategory: "PROVIDER_ERROR",
      safeMessage: "Unknown SMTP failure.",
    };
  }

  const err = error as Error & {
    code?: string;
    responseCode?: number;
    command?: string;
  };

  const code = err.code || "";
  const responseCode = err.responseCode || 0;
  const rawMsg = err.message || "";

  // 1. Authentication failures (e.g. 535 5.7.8 Username and Password not accepted, EAUTH)
  if (
    code === "EAUTH" ||
    responseCode === 534 ||
    responseCode === 535 ||
    /invalid credentials|username and password not accepted|badcredentials|authentication failed/i.test(
      rawMsg
    )
  ) {
    return {
      safeCategory: "AUTHENTICATION_FAILED",
      safeMessage:
        "Gmail SMTP authentication failed. Check GMAIL_USER and GMAIL_APP_PASSWORD.",
    };
  }

  // 2. Connection / Network failures (timeout, unreachable host, socket closed)
  if (
    code === "ESOCKET" ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    code === "ECONNRESET" ||
    /connection timeout|greeting timeout|socket hang up/i.test(rawMsg)
  ) {
    return {
      safeCategory: "CONNECTION_FAILED",
      safeMessage: "Unable to establish connection to smtp.gmail.com.",
    };
  }

  // 3. Rate limiting / Daily sending quota exceeded (e.g. 450, 452, 550 quota)
  if (
    responseCode === 450 ||
    responseCode === 452 ||
    /daily user sending limit|quota exceeded|too many messages|rate limit/i.test(
      rawMsg
    )
  ) {
    return {
      safeCategory: "RATE_LIMITED",
      safeMessage: "Gmail SMTP sending limit or quota exceeded.",
    };
  }

  // 4. Recipient rejection (e.g. 550 mailbox not found, 553 invalid recipient)
  if (
    responseCode === 550 ||
    responseCode === 551 ||
    responseCode === 553 ||
    /recipient address rejected|user unknown|mailbox not found/i.test(rawMsg)
  ) {
    return {
      safeCategory: "REJECTED_RECIPIENT",
      safeMessage: "Recipient address rejected by Gmail SMTP server.",
    };
  }

  return {
    safeCategory: "PROVIDER_ERROR",
    safeMessage: "SMTP dispatch failed with an unclassified provider error.",
  };
}

/**
 * Validates an email recipient address.
 */
export function isValidEmailAddress(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Sends an email message via Gmail SMTP with bounded retry on transient connection errors.
 * Never leaks passwords, recipient sensitive data, or tokens into logs.
 */
export async function sendMail(options: SendMailOptions): Promise<MailerResult> {
  const cleanRecipient = options.to?.trim().toLowerCase();

  // 1. Recipient validation
  if (!isValidEmailAddress(cleanRecipient)) {
    return {
      success: false,
      safeCategory: "INVALID_RECIPIENT",
      errorMessage: "Recipient email address is invalid.",
    };
  }

  // 2. Configuration check
  if (!isEmailConfigured() && !mockTransporter) {
    return {
      success: false,
      safeCategory: "PROVIDER_NOT_CONFIGURED",
      errorMessage:
        "Gmail SMTP credentials (GMAIL_USER, GMAIL_APP_PASSWORD) are not configured.",
    };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return {
      success: false,
      safeCategory: "PROVIDER_NOT_CONFIGURED",
      errorMessage: "Gmail SMTP transporter could not be initialized.",
    };
  }

  const config = getEmailConfig();
  const mailPayload = {
    from: options.from || config.from,
    to: cleanRecipient,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  // 3. Dispatch with bounded single retry for transient network errors only
  const maxAttempts = 2;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const info = await transporter.sendMail(mailPayload);
      const acceptedRecipient = Array.isArray(info?.accepted)
        ? info.accepted.some(
            (recipient) => recipient.toLowerCase() === cleanRecipient
          )
        : undefined;

      // Verify SMTP accepted the message
      if (info && Array.isArray(info.rejected) && info.rejected.length > 0) {
        return {
          success: false,
          acceptedRecipient: false,
          safeCategory: "REJECTED_RECIPIENT",
          errorMessage: "Recipient rejected by destination mail server.",
        };
      }

      if (info && info.messageId) {
        return {
          success: true,
          messageId: info.messageId,
          acceptedRecipient,
        };
      }

      // If messageId is missing, message was not confirmed accepted
      return {
        success: false,
        safeCategory: "PROVIDER_ERROR",
        errorMessage: "SMTP did not return an accepted message ID.",
      };
    } catch (err: unknown) {
      lastError = err;
      const { safeCategory } = classifySmtpError(err);

      // Only retry once on transient connection issues, never on auth or bad recipient
      if (attempt < maxAttempts && safeCategory === "CONNECTION_FAILED") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      break;
    }
  }

  const { safeCategory, safeMessage } = classifySmtpError(lastError);
  return {
    success: false,
    safeCategory,
    errorMessage: safeMessage,
  };
}
