import { getEmailConfig, isEmailConfigured } from "./config.ts";
import { classifySmtpError, getTransporter, sendMail } from "./mailer.ts";

export interface SmtpSelfTestResult {
  authenticationSucceeded: boolean;
  smtpAccepted: boolean;
  safeErrorCategory?: string;
  providerMessageId?: string;
  sender?: string;
  recipient?: string;
}

/**
 * Server-only operator diagnostic. It sends to the configured Gmail
 * mailbox itself by default, or an explicitly provided operator diagnostic recipient.
 */
export async function runSmtpSelfTest(targetRecipient?: string): Promise<SmtpSelfTestResult> {
  const config = getEmailConfig();
  const recipient = (targetRecipient || config.gmailUser)?.trim().toLowerCase();
  const sender = config.from;

  if (!recipient || !isEmailConfigured()) {
    return {
      authenticationSucceeded: false,
      smtpAccepted: false,
      safeErrorCategory: "PROVIDER_NOT_CONFIGURED",
      sender,
      recipient,
    };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return {
      authenticationSucceeded: false,
      smtpAccepted: false,
      safeErrorCategory: "PROVIDER_NOT_CONFIGURED",
      sender,
      recipient,
    };
  }

  try {
    await transporter.verify();
  } catch (error) {
    return {
      authenticationSucceeded: false,
      smtpAccepted: false,
      safeErrorCategory: classifySmtpError(error).safeCategory,
      sender,
      recipient,
    };
  }

  const result = await sendMail({
    from: sender,
    to: recipient,
    subject: "IT Club Recruitment — Gmail SMTP self-test",
    text: "IT Club Recruitment SMTP self-test. No student action is required.",
    html: "<p><strong>IT Club Recruitment</strong></p><p>Gmail SMTP self-test. No student action is required.</p>",
  });

  return {
    authenticationSucceeded: true,
    smtpAccepted: result.success && result.acceptedRecipient !== false,
    safeErrorCategory: result.success ? undefined : result.safeCategory,
    providerMessageId: result.messageId,
    sender,
    recipient,
  };
}
