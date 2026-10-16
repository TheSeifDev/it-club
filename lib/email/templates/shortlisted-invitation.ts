import {
  TRACK_METADATA,
  isCommitteeTrack,
} from "../../admin/transitions.ts";
import type { CommitteeTrack } from "../../admin/types.ts";
import { escapeHtml } from "./registration-receipt.ts";

export interface ShortlistedEmailData {
  fullName: string;
  referenceCode: string;
  primaryTrack: string;
  activationUrl: string;
  appBaseUrl: string;
}

export function renderShortlistedInvitationEmail(data: ShortlistedEmailData): {
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

  const subject = `You've Been Shortlisted! IT Club Recruitment 2026 — ${data.referenceCode}`;

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
            <td style="height: 4px; background: linear-gradient(90deg, #9b7cff 0%, #18c8ed 50%, #00e599 100%); line-height: 4px; font-size: 0;">&nbsp;</td>
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
                          <span style="font-family: 'Montserrat', sans-serif; font-size: 11px; letter-spacing: 2.5px; color: #9b7cff; font-weight: 700; text-transform: uppercase; display: block; margin-top: 3px; line-height: 1.2;">
                            IT CLUB RECRUITMENT 2026
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: #1e1335; border: 1px solid #9b7cff; color: #c4b5fd; font-size: 10px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; padding: 4px 10px; border-radius: 4px;">
                      SHORTLISTED
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Main Heading -->
              <h1 style="margin: 24px 0 6px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; line-height: 1.3;">
                You&apos;ve Been Shortlisted for Interviews!
              </h1>
              
              <!-- Arabic Headline (Alexandria Font) -->
              <div dir="rtl" style="margin: 6px 0 0 0; font-family: 'Alexandria', Arial, sans-serif; font-size: 15px; color: #9b7cff; font-weight: 600; text-align: right;">
                تهانينا! تم ترشيحك لمرحلة المقابلات الشخصية بنادي تكنولوجيا المعلومات
              </div>
            </td>
          </tr>

          <!-- Notification Details Body -->
          <tr>
            <td class="body-pad" style="padding: 0 32px 32px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #e2e8f0;">
                Dear <strong style="color: #ffffff;">${safeFullName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                We are thrilled to let you know that your application for IT Club Recruitment 2026 has passed our initial screening. You have been approved to advance to the personal interview stage.
              </p>

              <!-- Arabic Greeting & Summary -->
              <div dir="rtl" style="margin: 0 0 24px 0; padding: 14px 18px; background-color: #0c1017; border-right: 3px solid #9b7cff; font-family: 'Alexandria', Arial, sans-serif; font-size: 13px; line-height: 1.7; color: #cbd5e1; text-align: right;">
                يسعدنا إبلاغك باجتياز مرحلة الفرز الأولي لطلب انضمامك. يرجى تفعيل حسابك الآن على بوابة الطالب لتعيين كلمة المرور الخاصة بك ومتابعة موعد مقابلتك الشخصية.
              </div>

              <!-- Application Reference Card -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; background-color: #0c1017; border: 1px solid #1a232f; border-radius: 6px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; font-weight: 700; padding-bottom: 6px;">
                          Application Reference
                        </td>
                      </tr>
                      <tr>
                        <td style="font-family: 'Courier New', Courier, monospace; font-size: 18px; font-weight: 800; color: #00e599; letter-spacing: 1px;">
                          ${safeReference}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; font-weight: 700; padding: 12px 0 6px 0;">
                          Shortlisted Track
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; font-weight: 700; color: #ffffff;">
                          ${primaryTrackLabel}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; font-weight: 700; padding: 12px 0 6px 0;">
                          Current Stage
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; font-weight: 600; color: #c4b5fd;">
                          Stage 2: Candidate Interview Preparation (Pending Schedule Confirmation)
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Next Steps Instructions -->
              <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">
                Required Next Step: Activate Your Student Account
              </h3>
              
              <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">
                To complete your interview onboarding, please activate your account on the IT Club Student Dashboard. You will set your own secure password and link your verified university email. Your interview appointment details and check-in QR pass will appear on your dashboard as soon as the committee finalizes the schedule.
              </p>

              <!-- Activation CTA Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${safeActivationUrl}" target="_blank" style="display: inline-block; background-color: #00e599; color: #050708; font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; text-decoration: none; padding: 14px 28px; border-radius: 4px; border: 1px solid #00e599;">
                      ACTIVATE STUDENT ACCOUNT &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security & Single-Use Notice -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; background-color: #0c1017; border-left: 3px solid #18c8ed; border-radius: 0 4px 4px 0;">
                <tr>
                  <td style="padding: 12px 16px;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #18c8ed; text-transform: uppercase; letter-spacing: 0.5px;">
                      Security Notice
                    </p>
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94a3b8;">
                      This activation link is personalized, single-use, and valid for 24 hours. Your application reference code (<strong style="color: #ffffff;">${safeReference}</strong>) is your permanent identifier and will never be used as your account password.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Fallback Direct URL -->
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">
                If the button above does not work, copy and paste this secure link directly into your browser:
              </p>
              <p style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #18c8ed; word-break: break-all; line-height: 1.4;">
                ${safeActivationUrl}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer-pad" style="padding: 24px 32px; background-color: #050708; border-top: 1px solid #17222c; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #94a3b8;">
                IT Club Recruitment &bull; Benha University
              </p>
              <p style="margin: 0 0 12px 0; font-size: 11px; color: #64748b;">
                Official Candidate Portal: <a href="${safeBaseUrl}" target="_blank" style="color: #00e599; text-decoration: none;">${safeBaseUrl}</a>
              </p>
              <p style="margin: 0; font-size: 10px; color: #475569; line-height: 1.5;">
                This transactional notification was generated automatically for your IT Club application. Being shortlisted confirms advancement to the interview stage and is distinct from final cohort acceptance. Please do not reply directly to this automated email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `IT CLUB RECRUITMENT 2026 — SHORTLISTED INVITATION
================================================================================

Congratulations, ${data.fullName}!

We are pleased to inform you that your application for IT Club Recruitment 2026 has been shortlisted for the personal interview stage.

Application Reference: ${data.referenceCode}
Shortlisted Track:     ${primaryTrackLabel}
Current Stage:         Stage 2: Candidate Interview Preparation

REQUIRED NEXT STEP:
Please activate your official Student Dashboard account using the secure link below to set your own password and prepare for your interview:

${data.activationUrl}

Note: This activation link is personalized, single-use, and valid for 24 hours. Your application reference code is your permanent identifier and will never be used as your account password.

Being shortlisted confirms advancement to the interview stage and is distinct from final cohort acceptance.

Official Portal: ${data.appBaseUrl}
IT Club Recruitment • Benha University
`;

  return { subject, html, text };
}
