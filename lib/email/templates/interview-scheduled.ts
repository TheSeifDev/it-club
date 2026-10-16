import {
  TRACK_METADATA,
  isCommitteeTrack,
} from "../../admin/transitions.ts";
import type { CommitteeTrack } from "../../admin/types.ts";
import { escapeHtml } from "./registration-receipt.ts";

export interface InterviewScheduledEmailData {
  fullName: string;
  referenceCode: string;
  primaryTrack: string;
  interviewDate: string;
  interviewTime?: string | null;
  interviewLocation?: string | null;
  isRescheduled?: boolean;
  appBaseUrl: string;
}

export function renderInterviewScheduledEmail(data: InterviewScheduledEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const safeFullName = escapeHtml(data.fullName);
  const safeReference = escapeHtml(data.referenceCode);
  const safeDate = escapeHtml(data.interviewDate);
  const safeTime = data.interviewTime ? escapeHtml(data.interviewTime) : "As scheduled";
  const safeLocation = data.interviewLocation
    ? escapeHtml(data.interviewLocation)
    : "IT Club On-Campus Interview Desk";
  const safeBaseUrl = escapeHtml(data.appBaseUrl);

  const primaryMeta = isCommitteeTrack(data.primaryTrack)
    ? TRACK_METADATA[data.primaryTrack as CommitteeTrack]
    : null;
  const primaryTrackLabel = primaryMeta
    ? `${primaryMeta.abbreviation} — ${primaryMeta.name} (${primaryMeta.arabicName})`
    : escapeHtml(data.primaryTrack);

  const isRescheduled = Boolean(data.isRescheduled);

  const subject = isRescheduled
    ? `IT Club Interview Rescheduled — ${data.referenceCode}`
    : `IT Club Interview Scheduled — ${data.referenceCode}`;

  const headingEn = isRescheduled
    ? "Your Interview Has Been Rescheduled"
    : "Your On-Campus Interview Is Scheduled";

  const headingAr = isRescheduled
    ? "تم تحديث موعد المقابلة الشخصية"
    : "تم تحديد موعد المقابلة الشخصية الخاصة بك";

  const statusBadgeLabel = isRescheduled ? "RESCHEDULED" : "SCHEDULED";

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
                          <span style="font-family: 'Montserrat', sans-serif; font-size: 11px; letter-spacing: 2.5px; color: #18c8ed; font-weight: 700; text-transform: uppercase; display: block; margin-top: 3px; line-height: 1.2;">
                            IT CLUB RECRUITMENT 2026
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: #052028; border: 1px solid #18c8ed; color: #18c8ed; font-size: 10px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; padding: 4px 10px; border-radius: 4px;">
                      ${statusBadgeLabel}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Main Heading -->
              <h1 style="margin: 24px 0 6px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; line-height: 1.3;">
                ${headingEn}
              </h1>
              
              <!-- Arabic Headline (Alexandria Font) -->
              <div dir="rtl" style="margin: 6px 0 0 0; font-family: 'Alexandria', Arial, sans-serif; font-size: 15px; color: #18c8ed; font-weight: 600; text-align: right;">
                ${headingAr}
              </div>
            </td>
          </tr>

          <!-- Greeting & Context -->
          <tr>
            <td class="body-pad" style="padding: 0 32px 24px 32px; font-size: 14px; line-height: 1.6; color: #b4bac2;">
              Dear <strong style="color: #ffffff;">${safeFullName}</strong>,<br /><br />
              ${
                isRescheduled
                  ? "Please note that your on-campus interview schedule has been updated by the recruitment committee. Your confirmed appointment details are shown below:"
                  : "We are pleased to inform you that following initial screening, you have been shortlisted for an on-campus personal interview with our committee leads. Your confirmed appointment details are below:"
              }
            </td>
          </tr>

          <!-- Confirmed Schedule Callout Card -->
          <tr>
            <td class="body-pad" style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #040608; border: 1px solid #1b2834; padding: 22px; border-radius: 6px;">
                <tr>
                  <td>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 13px;">
                      <tr style="border-bottom: 1px solid #141f27;">
                        <td style="padding: 10px 0; color: #7e8b96; font-family: 'Montserrat', monospace, sans-serif; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; width: 38%;">
                          INTERVIEW DATE
                        </td>
                        <td style="padding: 10px 0; color: #18c8ed; font-weight: bold; font-size: 14px;">
                          ${safeDate}
                        </td>
                      </tr>
                      <tr style="border-bottom: 1px solid #141f27;">
                        <td style="padding: 10px 0; color: #7e8b96; font-family: 'Montserrat', monospace, sans-serif; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">
                          CONFIRMED TIME
                        </td>
                        <td style="padding: 10px 0; color: #ffffff; font-weight: 600;">
                          ${safeTime}
                        </td>
                      </tr>
                      <tr style="border-bottom: 1px solid #141f27;">
                        <td style="padding: 10px 0; color: #7e8b96; font-family: 'Montserrat', monospace, sans-serif; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">
                          CAMPUS LOCATION
                        </td>
                        <td style="padding: 10px 0; color: #ffffff; font-weight: 500;">
                          ${safeLocation}
                        </td>
                      </tr>
                      <tr style="border-bottom: 1px solid #141f27;">
                        <td style="padding: 10px 0; color: #7e8b96; font-family: 'Montserrat', monospace, sans-serif; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">
                          COMMITTEE TRACK
                        </td>
                        <td style="padding: 10px 0; color: #00e599; font-weight: 600;">
                          ${escapeHtml(primaryTrackLabel)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #7e8b96; font-family: 'Montserrat', monospace, sans-serif; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">
                          APPLICATION REF
                        </td>
                        <td style="padding: 10px 0; color: #ffffff; font-family: 'Courier New', Courier, monospace; font-weight: bold; letter-spacing: 1.5px;">
                          ${safeReference}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Practical Instructions for Arrival -->
          <tr>
            <td class="body-pad" style="padding: 0 32px 20px 32px;">
              <div style="background-color: #040608; border-left: 3px solid #18c8ed; padding: 18px; border-radius: 0 6px 6px 0;">
                <span style="display: block; font-family: 'Montserrat', monospace, sans-serif; font-size: 11px; letter-spacing: 1.5px; color: #18c8ed; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">
                  PRACTICAL ARRIVAL INSTRUCTIONS
                </span>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.7; color: #d1d5db;">
                  <li><strong>Arrival Time:</strong> Please arrive 15 minutes before your scheduled interview slot.</li>
                  <li><strong>Student QR Card:</strong> Have your digital QR card ready on your mobile phone or printed from the Student Portal.</li>
                  <li><strong>Station 1 (Check-In Desk):</strong> Present your QR code to staff at the attendance desk to verify check-in before entering the interview area.</li>
                  <li><strong>Station 2 (Interview Room):</strong> Proceed to your assigned committee table where interviewers will scan your verified QR to open your profile.</li>
                </ol>
                <div dir="rtl" style="margin-top: 10px; font-family: 'Alexandria', Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #7dd3fc; text-align: right;">
                  يرجى الحضور قبل الموعد بـ 15 دقيقة وتجهيز بطاقة QR الخاصة بك من بوابة الطلاب لإتمام تسجيل الحضور في المحطة الأولى.
                </div>
              </div>
            </td>
          </tr>

          <!-- Call to Action Button: View QR Card -->
          <tr>
            <td align="center" style="padding: 10px 32px 28px 32px;">
              <a href="${safeBaseUrl}/student" target="_blank" style="display: inline-block; background-color: #18c8ed; color: #050708; font-family: 'Montserrat', monospace, sans-serif; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 15px 32px; border-radius: 4px;">
                VIEW YOUR INTERVIEW QR PASS &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer-pad" style="padding: 24px 32px; border-top: 1px solid #141f27; background-color: #050708; font-size: 11px; color: #6b7280; line-height: 1.6;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <strong style="color: #9ca3af;">IT Club Recruitment</strong> &bull; Building Egypt&apos;s next generation of tech leaders.<br />
                    Student Portal: <a href="${safeBaseUrl}/student" style="color: #18c8ed; text-decoration: none;">${safeBaseUrl}/student</a>
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
IT CLUB RECRUITMENT 2026 — ${isRescheduled ? "INTERVIEW RESCHEDULED" : "INTERVIEW SCHEDULED"}
=====================================================

Dear ${data.fullName},

${
  isRescheduled
    ? "Please note that your on-campus interview schedule has been updated by the recruitment committee."
    : "We are pleased to inform you that you have been shortlisted for an on-campus personal interview with IT Club."
}

CONFIRMED APPOINTMENT DETAILS:
- Date: ${data.interviewDate}
- Time: ${data.interviewTime || "As scheduled"}
- Location: ${data.interviewLocation || "IT Club On-Campus Interview Desk"}
- Track: ${primaryTrackLabel}
- Application Reference: ${data.referenceCode}

PRACTICAL INSTRUCTIONS:
1. Please arrive 15 minutes before your scheduled interview slot.
2. Have your digital Interview QR Card ready on your phone from the Student Portal.
3. Check in at Station 1 (Attendance Desk) upon arrival.
4. Proceed to Station 2 (Interview Room) when called.

Access your digital QR card at:
${data.appBaseUrl}/student

-----------------------------------------------------
IT Club Recruitment. Automated notification.
`;

  return { subject, html, text };
}
