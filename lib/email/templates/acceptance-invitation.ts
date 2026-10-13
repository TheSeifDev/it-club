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
  activationUrl: string;
  appBaseUrl: string;
}

export function renderAcceptanceInvitationEmail(data: AcceptanceEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const safeFullName = escapeHtml(data.fullName);
  const safeReference = escapeHtml(data.referenceCode);
  const safeActivationUrl = escapeHtml(data.activationUrl);
  const safeBaseUrl = escapeHtml(data.appBaseUrl);

  const primaryMeta = isCommitteeTrack(data.primaryTrack)
    ? TRACK_METADATA[data.primaryTrack as CommitteeTrack]
    : null;
  const primaryTrackLabel = primaryMeta
    ? `${primaryMeta.abbreviation} — ${primaryMeta.name} (${primaryMeta.arabicName})`
    : escapeHtml(data.primaryTrack);

  const subject = `Welcome to IT Club! Acceptance & Account Activation — ${data.referenceCode}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050708; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #050708; width: 100%;">
    <tr>
      <td align="center" style="padding: 30px 15px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #080a0c; border: 1px solid #1a2228; text-align: left;">
          
          <!-- Accent Gradient Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #00e599 0%, #18c8ed 50%, #9b7cff 100%); line-height: 4px; font-size: 0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-family: monospace; font-size: 11px; letter-spacing: 3px; color: #00e599; text-transform: uppercase; font-weight: bold;">
                      IT CLUB RECRUITMENT 2026
                    </span>
                    <h1 style="margin: 12px 0 6px 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      Congratulations! You&apos;re Accepted.
                    </h1>
                    <p style="margin: 0; font-size: 15px; color: #00e599; font-weight: 600;" dir="rtl">
                      مبروك! تم قبولك رسمياً في نادي تكنولوجيا المعلومات
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Congratulatory Message -->
          <tr>
            <td style="padding: 0 32px 24px 32px; font-size: 14px; line-height: 1.6; color: #b4bac2;">
              Dear <strong style="color: #ffffff;">${safeFullName}</strong>,<br /><br />
              Following the evaluation of your recruitment submission and technical review, the IT Club leadership and committee heads are delighted to offer you a position as an active member.
            </td>
          </tr>

          <!-- Accepted Track & Reference Callout -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #040506; border: 1px solid #1f2b33; padding: 20px;">
                <tr>
                  <td>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 13px;">
                      <tr style="border-bottom: 1px solid #141b22;">
                        <td style="padding: 8px 0; color: #7e8b96; font-family: monospace; text-transform: uppercase; font-size: 11px; width: 40%;">ACCEPTED TRACK</td>
                        <td style="padding: 8px 0; color: #00e599; font-weight: bold;">${escapeHtml(primaryTrackLabel)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #7e8b96; font-family: monospace; text-transform: uppercase; font-size: 11px;">APPLICATION REF</td>
                        <td style="padding: 8px 0; color: #ffffff; font-family: monospace; font-weight: bold; letter-spacing: 1px;">${safeReference}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Next Step: Account Activation -->
          <tr>
            <td style="padding: 0 32px 20px 32px; font-size: 14px; line-height: 1.6; color: #b4bac2;">
              To confirm your membership and access club resources, please activate your official student account.
              You will be prompted to verify your application reference code and choose a secure password.
            </td>
          </tr>

          <!-- Call to Action Button -->
          <tr>
            <td align="center" style="padding: 0 32px 28px 32px;">
              <a href="${safeActivationUrl}" target="_blank" style="display: inline-block; background-color: #00e599; color: #050708; font-family: monospace; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 15px 32px; border: none;">
                ACTIVATE STUDENT ACCOUNT &rarr;
              </a>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #091210; border-left: 3px solid #00e599; padding: 16px;">
                <tr>
                  <td style="font-size: 12px; line-height: 1.6; color: #a2b0a9;">
                    <strong style="color: #00e599; text-transform: uppercase; font-family: monospace; font-size: 11px; letter-spacing: 1px; display: block; margin-bottom: 4px;">
                      SECURITY &amp; EXPIRATION
                    </strong>
                    This activation link is personalized for your university email and expires in 24 hours. Do not share or forward this link. If your link expires, contact recruitment organizers to request a fresh activation invitation.
                    <div style="margin-top: 6px;" dir="rtl">
                      هذا الرابط مخصص لبريدك الجامعي وصالح لمدة 24 ساعة. يرجى عدم مشاركة الرابط مع أي شخص آخر.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Direct Link Fallback -->
          <tr>
            <td style="padding: 0 32px 28px 32px; font-size: 11px; line-height: 1.5; color: #52606d;">
              If the button above does not work, copy and paste this secure URL into your browser:<br />
              <a href="${safeActivationUrl}" style="color: #18c8ed; word-break: break-all;">${safeActivationUrl}</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #141b22; background-color: #050708; font-size: 11px; color: #52606d; line-height: 1.5;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    IT Club Recruitment &bull; Building Egypt&apos;s next generation of tech leaders.<br />
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

  const text = `=====================================================
IT CLUB RECRUITMENT 2026 — ACCEPTANCE & ACCOUNT ACTIVATION
=====================================================

Dear ${data.fullName},

Congratulations! We are delighted to inform you that your application has been ACCEPTED for:
Track: ${primaryTrackLabel}
Application Reference: ${data.referenceCode}

To confirm your spot and complete your onboarding, activate your official student account using the secure link below:

${data.activationUrl}

IMPORTANT INSTRUCTIONS:
- You will need to confirm your application reference code (${data.referenceCode}) and set a secure password.
- This activation link is personalized for your university email and is time-limited.
- Do not forward or share this link.

Portal: ${data.appBaseUrl}

-----------------------------------------------------
IT Club Recruitment. Automated notification.
`;

  return { subject, html, text };
}
