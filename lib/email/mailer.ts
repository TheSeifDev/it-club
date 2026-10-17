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

export type EmailDeliveryState =
  | "CONFIG_ERROR"
  | "CONNECTION_ERROR"
  | "AUTH_ERROR"
  | "RECIPIENT_REJECTED"
  | "PROVIDER_REJECTED"
  | "ACCEPTED_BY_PROVIDER"
  | "DELIVERY_CONFIRMED";

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
}

export interface MailerResult {
  success: boolean;
  status: EmailDeliveryState;
  messageId?: string;
  response?: string;
  accepted: string[];
  rejected: string[];
  /** Whether Nodemailer reported that the SMTP server accepted this recipient. */
  acceptedRecipient: boolean;
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

  // Refuse mock transport unless in test environment
  if (process.env.EMAIL_TRANSPORT === "mock") {
    if (process.env.NODE_ENV !== "test") {
      throw new Error(
        "EMAIL_TRANSPORT=mock is strictly prohibited outside NODE_ENV=test."
      );
    }
    return {
      sendMail: async (message: { to?: string | string[] }) => {
        const toStr = String(message.to || "");
        return {
          messageId: `<mock-${Date.now()}@itclub.test>`,
          accepted: [toStr],
          rejected: [],
          response: "250 Mock transport accepted (test only)",
          envelope: { from: "mock@itclub.test", to: [toStr] },
        };
      },
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

export function maskEmail(email: string): string {
  if (!email || typeof email !== "string") return "[invalid-email]";
  const trimmed = email.trim();
  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex <= 0 || atIndex === trimmed.length - 1) return "[invalid-email]";
  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  const maskedLocal =
    local.length <= 2
      ? `${local[0]}*`
      : `${local.slice(0, 2)}***${local.slice(-1)}`;
  return `${maskedLocal}@${domain}`;
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
      status: "RECIPIENT_REJECTED",
      accepted: [],
      rejected: [cleanRecipient || "invalid"],
      acceptedRecipient: false,
      safeCategory: "INVALID_RECIPIENT",
      errorMessage: "Recipient email address is invalid.",
    };
  }

  // 2. Configuration check
  if (!isEmailConfigured() && !mockTransporter) {
    return {
      success: false,
      status: "CONFIG_ERROR",
      accepted: [],
      rejected: [],
      acceptedRecipient: false,
      safeCategory: "PROVIDER_NOT_CONFIGURED",
      errorMessage:
        "Gmail SMTP credentials (GMAIL_USER, GMAIL_APP_PASSWORD) are not configured.",
    };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return {
      success: false,
      status: "CONFIG_ERROR",
      accepted: [],
      rejected: [],
      acceptedRecipient: false,
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
      const acceptedList = Array.isArray(info?.accepted)
        ? info.accepted.map(String)
        : [];
      const rejectedList = Array.isArray(info?.rejected)
        ? info.rejected.map(String)
        : [];
      const acceptedRecipient = acceptedList.some(
        (recipient) => recipient.toLowerCase() === cleanRecipient
      );

      // Secret-safe diagnostic logging
      console.log(
        `[mailer:dispatch] recipient=${maskEmail(cleanRecipient)} ` +
        `envelopeFrom=${maskEmail(String(info?.envelope?.from || config.from))} ` +
        `accepted=[${acceptedList.map(maskEmail).join(", ")}] ` +
        `rejected=[${rejectedList.map(maskEmail).join(", ")}] ` +
        `response=${JSON.stringify(info?.response || "")} ` +
        `messageId=${info?.messageId || "none"}`
      );

      // Verify SMTP accepted the message
      if (rejectedList.some((r) => r.toLowerCase() === cleanRecipient) || rejectedList.length > 0) {
        return {
          success: false,
          status: "RECIPIENT_REJECTED",
          messageId: info?.messageId,
          response: typeof info?.response === "string" ? info.response : undefined,
          accepted: acceptedList,
          rejected: rejectedList,
          acceptedRecipient: false,
          safeCategory: "REJECTED_RECIPIENT",
          errorMessage: "Recipient rejected by destination mail server.",
        };
      }

      // Treat "recipient not in accepted[]" as failure
      if (!acceptedRecipient) {
        return {
          success: false,
          status: "RECIPIENT_REJECTED",
          messageId: info?.messageId,
          response: typeof info?.response === "string" ? info.response : undefined,
          accepted: acceptedList,
          rejected: rejectedList,
          acceptedRecipient: false,
          safeCategory: "REJECTED_RECIPIENT",
          errorMessage: "Recipient was not accepted by mail provider.",
        };
      }

      if (info && info.messageId) {
        return {
          success: true,
          status: "ACCEPTED_BY_PROVIDER",
          messageId: info.messageId,
          response: typeof info.response === "string" ? info.response : undefined,
          accepted: acceptedList,
          rejected: rejectedList,
          acceptedRecipient: true,
        };
      }

      // If messageId is missing, message was not confirmed accepted
      return {
        success: false,
        status: "PROVIDER_REJECTED",
        response: typeof info?.response === "string" ? info.response : undefined,
        accepted: acceptedList,
        rejected: rejectedList,
        acceptedRecipient: false,
        safeCategory: "PROVIDER_ERROR",
        errorMessage: "SMTP did not return an accepted message ID.",
      };
    } catch (err: unknown) {
      lastError = err;
      const { safeCategory } = classifySmtpError(err);
      const errObj = err as { code?: string; responseCode?: number; command?: string };

      console.error(
        `[mailer:error] recipient=${maskEmail(cleanRecipient)} ` +
        `attempt=${attempt}/${maxAttempts} ` +
        `code=${errObj?.code || "none"} ` +
        `responseCode=${errObj?.responseCode || "none"} ` +
        `command=${errObj?.command || "none"} ` +
        `safeCategory=${safeCategory}`
      );

      // Only retry once on transient connection issues, never on auth or bad recipient
      if (attempt < maxAttempts && safeCategory === "CONNECTION_FAILED") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      break;
    }
  }

  const { safeCategory, safeMessage } = classifySmtpError(lastError);
  let status: EmailDeliveryState = "PROVIDER_REJECTED";
  if (safeCategory === "AUTHENTICATION_FAILED") {
    status = "AUTH_ERROR";
  } else if (safeCategory === "CONNECTION_FAILED") {
    status = "CONNECTION_ERROR";
  } else if (safeCategory === "REJECTED_RECIPIENT") {
    status = "RECIPIENT_REJECTED";
  }

  return {
    success: false,
    status,
    accepted: [],
    rejected: [cleanRecipient],
    acceptedRecipient: false,
    safeCategory,
    errorMessage: safeMessage,
  };
}
