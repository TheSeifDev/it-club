import {
  TRACK_METADATA,
  isCommitteeTrack,
} from "../../admin/transitions.ts";
import type { CommitteeTrack } from "../../admin/types.ts";
import { escapeHtml } from "./registration-receipt.ts";

export interface AcceptanceEmailData {
  fullName: string;
  referenceCode: string;
  primaryTrack: string;
  activationUrl?: string;
  loginUrl?: string;
  temporaryPassword?: string;
  expiresInHours?: number;
  appBaseUrl: string;
  authEmail?: string;
}

export function renderAcceptanceInvitationEmail(data: AcceptanceEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const safeFullName = escapeHtml(data.fullName);
  const safeReference = escapeHtml(data.referenceCode);
  const safeActivationUrl = data.activationUrl ? escapeHtml(data.activationUrl) : "";
  const safeBaseUrl = escapeHtml(data.appBaseUrl);
  const loginUrl = data.loginUrl || `${data.appBaseUrl}/student/login`;
  const safeLoginUrl = escapeHtml(loginUrl);
  const safeAuthEmail = data.authEmail ? escapeHtml(data.authEmail) : "";
  const hours = data.expiresInHours || 24;

  const primaryMeta = isCommitteeTrack(data.primaryTrack)
    ? TRACK_METADATA[data.primaryTrack as CommitteeTrack]
    : null;
  const primaryTrackLabel = primaryMeta
    ? `${primaryMeta.abbreviation} — ${primaryMeta.name} (${primaryMeta.arabicName})`
    : escapeHtml(data.primaryTrack);

  const subject = `Welcome to IT Club! Acceptance & Account Activation — ${data.referenceCode}`;

  const ctaUrl = data.temporaryPassword ? safeLoginUrl : (safeActivationUrl || safeLoginUrl);
  const ctaLabel = data.temporaryPassword ? "SIGN IN TO STUDENT PORTAL &rarr;" : "ACTIVATE STUDENT ACCOUNT &rarr;";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Alexandria:wght@400;600;700&family=Montserrat:wght@400;500;600;700;800&display=swap');
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .header-pad { padding: 24px 20px 18px 20px !important; }
      .body-pad { padding: 0 20px 20px 20px !important; }
      .footer-pad { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #050708; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #050708; width: 100%;">
    <tr>
      <td align="center" style="padding: 30px 12px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-container" style="max-width: 600px; background-color: #080b0e; border: 1px solid #17222c; text-align: left; border-radius: 8px; overflow: hidden;">
          
          <!-- Accent Gradient Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #00e599 0%, #18c8ed 50%, #9b7cff 100%); line-height: 4px; font-size: 0;">&nbsp;</td>
          </tr>

          <!-- Official Brand Header -->
          <tr>
            <td class="header-pad" style="padding: 32px 32px 20px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 14px;">
                          <img src="${safeBaseUrl}/logo.png" alt="IT Club" width="46" height="46" style="display: block; border: 0; outline: none; width: 46px; height: 46px; border-radius: 8px;" />
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-family: 'Montserrat', sans-serif; font-size: 16px; font-weight: 800; letter-spacing: 1.5px; color: #ffffff; text-transform: uppercase; display: block; line-height: 1.2;">
                            IT CLUB
                          </span>
                          <span style="font-family: 'Montserrat', sans-serif; font-size: 11px; letter-spacing: 2.5px; color: #00e599; font-weight: 700; text-transform: uppercase; display: block; margin-top: 3px; line-height: 1.2;">
                            IT CLUB RECRUITMENT 2026
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: #072518; border: 1px solid #00e599; color: #00e599; font-size: 10px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; padding: 4px 10px; border-radius: 4px;">
                      ACCEPTED
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Main Heading -->
              <h1 style="margin: 24px 0 6px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; line-height: 1.3;">
                Congratulations! You&apos;re Accepted.
              </h1>
              
              <!-- Arabic Headline (Alexandria Font) -->
              <div dir="rtl" style="margin: 6px 0 0 0; font-family: 'Alexandria', Arial, sans-serif; font-size: 15px; color: #00e599; font-weight: 600; text-align: right;">
                مبروك! تم قبولك رسمياً في نادي تكنولوجيا المعلومات
              </div>
            </td>
          </tr>

          <!-- Congratulatory Message -->
          <tr>
            <td class="body-pad" style="padding: 0 32px 24px 32px; font-size: 14px; line-height: 1.6; color: #b4bac2;">
              Dear <strong style="color: #ffffff;">${safeFullName}</strong>,<br /><br />
              Following the evaluation of your recruitment submission and technical review, the IT Club leadership and committee heads are delighted to offer you a position as an active member for the 2026 season.
            </td>
          </tr>

          <!-- Accepted Track & Reference Callout -->
          <tr>
            <td class="body-pad" style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #040608; border: 1px solid #1b2834; padding: 20px; border-radius: 6px;">
                <tr>
                  <td>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 13px;">
                      <tr style="border-bottom: 1px solid #141f27;">
                        <td style="padding: 8px 0; color: #7e8b96; font-family: 'Montserrat', monospace, sans-serif; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; width: 38%;">
                          ACCEPTED TRACK
                        </td>
                        <td style="padding: 8px 0; color: #00e599; font-weight: bold;">
                          ${escapeHtml(primaryTrackLabel)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #7e8b96; font-family: 'Montserrat', monospace, sans-serif; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">
                          APPLICATION REF
                        </td>
                        <td style="padding: 8px 0; color: #ffffff; font-family: 'Courier New', Courier, monospace; font-weight: bold; letter-spacing: 1.5px;">
                          ${safeReference}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Temporary Credential Box (if provided) -->
          ${data.temporaryPassword ? `
          <tr>
            <td class="body-pad" style="padding: 0 32px 24px 32px;">
              <div style="background-color: #040608; border: 1px solid #1b2834; padding: 20px; border-radius: 6px;">
                <span style="font-family: 'Montserrat', monospace, sans-serif; font-size: 10px; letter-spacing: 2px; color: #18c8ed; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 8px;">
                  STUDENT PORTAL LOGIN CREDENTIALS
                </span>
                <p style="margin: 0 0 12px 0; font-size: 13px; color: #cbd5e1; line-height: 1.5;">
                  Sign in using your official university email ${safeAuthEmail ? `(<strong style="color: #00e599;">${safeAuthEmail}</strong>)` : "(e.g. 2024XXXX@batechu.com)"} and your one-time temporary credential:
                </p>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 800; color: #00e599; letter-spacing: 2px; padding: 12px 18px; background-color: #080b0e; border: 1px dashed #00e599; border-radius: 4px; display: inline-block;">
                  ${escapeHtml(data.temporaryPassword)}
                </div>
                <div style="margin-top: 12px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                  Valid for <strong>${hours} hours</strong>. You must change your temporary credential immediately upon your first sign in.
                </div>
              </div>
            </td>
          </tr>` : ""}

          <!-- Next Step: Account Activation Header -->
          <tr>
            <td class="body-pad" style="padding: 0 32px 20px 32px; font-size: 14px; line-height: 1.6; color: #b4bac2;">
              <strong style="color: #ffffff; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">ACTIVATE STUDENT ACCOUNT &amp; ACCESS DASHBOARD</strong><br />
              To confirm your membership and access internal club resources, workshops, and cohort onboarding, please sign in to the IT Club Student Dashboard.
              Confirm your application reference code (<strong style="color: #00e599; font-family: monospace;">${safeReference}</strong>) and proceed.
            </td>
          </tr>

          <!-- Call to Action Button -->
          <tr>
            <td align="center" style="padding: 0 32px 28px 32px;">
              <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: #00e599; color: #050708; font-family: 'Montserrat', monospace, sans-serif; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 15px 32px; border-radius: 4px;">
                ${ctaLabel}
              </a>
            </td>
          </tr>

          <!-- Security & Expiration Notice -->
          <tr>
            <td class="body-pad" style="padding: 0 32px 28px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #091210; border-left: 3px solid #00e599; padding: 16px; border-radius: 0 4px 4px 0;">
                <tr>
                  <td style="font-size: 12px; line-height: 1.6; color: #a2b0a9;">
                    <strong style="color: #00e599; text-transform: uppercase; font-family: 'Montserrat', monospace, sans-serif; font-size: 11px; letter-spacing: 1px; display: block; margin-bottom: 4px;">
                      SECURITY &amp; EXPIRATION
                    </strong>
                    This credential is personalized for your university email and expires in 24 hours. Do not share or forward this notice. First sign-in requires an immediate password update.
                    <div dir="rtl" style="margin-top: 8px; font-family: 'Alexandria', Arial, sans-serif; color: #86efac; text-align: right;">
                      هذه البيانات مخصصة لبريدك الجامعي وصالحة لمدة 24 ساعة. يرجى تغيير كلمة المرور عند أول تسجيل دخول للحفاظ على أمان حسابك.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Direct Link Fallback (if activationUrl is present) -->
          ${safeActivationUrl ? `
          <tr>
            <td class="body-pad" style="padding: 0 32px 28px 32px; font-size: 11px; line-height: 1.5; color: #6b7280;">
              Alternatively, you can activate your account directly using this link:<br />
              <a href="${safeActivationUrl}" style="color: #18c8ed; word-break: break-all; text-decoration: none;">${safeActivationUrl}</a>
            </td>
          </tr>` : ""}

          <!-- Footer -->
          <tr>
            <td class="footer-pad" style="padding: 24px 32px; border-top: 1px solid #141f27; background-color: #050708; font-size: 11px; color: #6b7280; line-height: 1.6;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <strong style="color: #9ca3af;">IT Club Recruitment</strong> &bull; Building Egypt&apos;s next generation of tech leaders.<br />
                    Portal: <a href="${safeBaseUrl}" style="color: #00e599; text-decoration: none;">${safeBaseUrl}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textCredSection = data.temporaryPassword
    ? `
STUDENT PORTAL LOGIN CREDENTIALS:
Portal URL:         ${loginUrl}
Temporary Password: ${data.temporaryPassword}
Credential Expiry:  Valid for ${hours} hours

MANDATORY FIRST-LOGIN REQUIREMENT:
You must change this temporary password immediately upon your first sign in.
`
    : `
ACTIVATE STUDENT ACCOUNT:
${data.activationUrl || loginUrl}
`;

  const text = `=====================================================
IT CLUB RECRUITMENT 2026 — ACCEPTANCE & ACCOUNT ACTIVATION
=====================================================

Dear ${data.fullName},

Congratulations! We are delighted to inform you that your application has been ACCEPTED for:
Track: ${primaryTrackLabel}
Application Reference: ${data.referenceCode}

${textCredSection}
IMPORTANT INSTRUCTIONS:
- You will need to confirm your application reference code (${data.referenceCode}).
- This notification is personalized for your university email and expires in 24 hours.
- Do not forward or share these credentials.

Portal: ${data.appBaseUrl}
Student Login: ${loginUrl}
${data.activationUrl ? `Direct Activation Link: ${data.activationUrl}\n` : ""}
-----------------------------------------------------
IT Club Recruitment. Automated notification.
`;

  return { subject, html, text };
}
