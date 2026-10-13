import {
  TRACK_METADATA,
  ACADEMIC_YEAR_METADATA,
  isCommitteeTrack,
} from "../../admin/transitions.ts";
import type { CommitteeTrack, AcademicYear } from "../../admin/types.ts";

export interface RegistrationEmailData {
  fullName: string;
  referenceCode: string;
  primaryTrack: string;
  secondaryTrack?: string | null;
  academicYear: string;
  department: string;
  appBaseUrl: string;
}

/**
 * Escapes untrusted user input to prevent HTML injection in emails.
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderRegistrationReceiptEmail(data: RegistrationEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const safeFullName = escapeHtml(data.fullName);
  const safeReference = escapeHtml(data.referenceCode);
  const safeDepartment = escapeHtml(data.department);

  const primaryMeta = isCommitteeTrack(data.primaryTrack)
    ? TRACK_METADATA[data.primaryTrack as CommitteeTrack]
    : null;
  const primaryTrackLabel = primaryMeta
    ? `${primaryMeta.abbreviation} — ${primaryMeta.name} (${primaryMeta.arabicName})`
    : escapeHtml(data.primaryTrack);

  let secondaryTrackLabel = "None";
  if (data.secondaryTrack && isCommitteeTrack(data.secondaryTrack)) {
    const secMeta = TRACK_METADATA[data.secondaryTrack as CommitteeTrack];
    secondaryTrackLabel = `${secMeta.abbreviation} — ${secMeta.name} (${secMeta.arabicName})`;
  } else if (data.secondaryTrack) {
    secondaryTrackLabel = data.secondaryTrack;
  }

  const yearMeta =
    data.academicYear in ACADEMIC_YEAR_METADATA
      ? ACADEMIC_YEAR_METADATA[data.academicYear as AcademicYear]
      : data.academicYear;

  const safePrimaryTrackHtml = escapeHtml(primaryTrackLabel);
  const safeSecondaryTrackHtml = escapeHtml(secondaryTrackLabel);
  const safeYearHtml = escapeHtml(yearMeta);

  const subject = `IT Club Application Received — ${data.referenceCode}`;

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
                      Application Received
                    </h1>
                    <p style="margin: 0; font-size: 15px; color: #00e599; font-weight: 600;" dir="rtl">
                      تم استلام طلب الانضمام بنجاح
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 32px 24px 32px; font-size: 14px; line-height: 1.6; color: #b4bac2;">
              Dear <strong style="color: #ffffff;">${safeFullName}</strong>,<br /><br />
              Thank you for applying to IT Club. We have successfully registered your application in our system. Your details are now placed in the evaluation pipeline.
            </td>
          </tr>

          <!-- Reference Code Callout -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #040506; border: 1px solid #1f2b33; padding: 20px;">
                <tr>
                  <td align="center">
                    <span style="font-family: monospace; font-size: 10px; letter-spacing: 2.5px; color: #7e8b96; text-transform: uppercase; display: block; margin-bottom: 8px;">
                      APPLICATION REFERENCE CODE
                    </span>
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 26px; font-weight: bold; letter-spacing: 4px; color: #00e599; display: block; margin-bottom: 8px;">
                      ${safeReference}
                    </span>
                    <span style="font-family: monospace; font-size: 11px; color: #7e8b96;">
                      Save this code to check your status or for on-campus interview check-in.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Submission Details Table -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 13px;">
                <tr style="border-bottom: 1px solid #141b22;">
                  <td style="padding: 10px 0; color: #7e8b96; font-family: monospace; text-transform: uppercase; font-size: 11px; width: 40%;">STATUS</td>
                  <td style="padding: 10px 0; color: #00e599; font-weight: bold;">Pending Review (قيد المراجعة)</td>
                </tr>
                <tr style="border-bottom: 1px solid #141b22;">
                  <td style="padding: 10px 0; color: #7e8b96; font-family: monospace; text-transform: uppercase; font-size: 11px;">PRIMARY TRACK</td>
                  <td style="padding: 10px 0; color: #ffffff; font-weight: 500;">${safePrimaryTrackHtml}</td>
                </tr>
                <tr style="border-bottom: 1px solid #141b22;">
                  <td style="padding: 10px 0; color: #7e8b96; font-family: monospace; text-transform: uppercase; font-size: 11px;">SECONDARY TRACK</td>
                  <td style="padding: 10px 0; color: #ffffff; font-weight: 500;">${safeSecondaryTrackHtml}</td>
                </tr>
                <tr style="border-bottom: 1px solid #141b22;">
                  <td style="padding: 10px 0; color: #7e8b96; font-family: monospace; text-transform: uppercase; font-size: 11px;">ACADEMIC YEAR</td>
                  <td style="padding: 10px 0; color: #ffffff;">${safeYearHtml}</td>
                </tr>
                <tr style="border-bottom: 1px solid #141b22;">
                  <td style="padding: 10px 0; color: #7e8b96; font-family: monospace; text-transform: uppercase; font-size: 11px;">DEPARTMENT</td>
                  <td style="padding: 10px 0; color: #ffffff;">${safeDepartment}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Important Disclaimer Box -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #091210; border-left: 3px solid #00e599; padding: 16px;">
                <tr>
                  <td style="font-size: 12px; line-height: 1.6; color: #a2b0a9;">
                    <strong style="color: #00e599; text-transform: uppercase; font-family: monospace; font-size: 11px; letter-spacing: 1px; display: block; margin-bottom: 4px;">
                      IMPORTANT NOTICE
                    </strong>
                    Submitting this form confirms that your application has been received into the review queue. <strong>Submission does not imply acceptance.</strong> All candidates are thoroughly evaluated by committee heads, and shortlisted candidates will be invited for interview rounds.
                    <div style="margin-top: 6px;" dir="rtl">
                      تقديم هذا الطلب يعني وصوله إلى مرحلة المراجعة، ولا يعني القبول النهائي. سيتم التواصل مع المرشحين لإجراء المقابلات الشخصية.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Next Steps & Interview Info -->
          <tr>
            <td style="padding: 0 32px 28px 32px; font-size: 13px; line-height: 1.6; color: #b4bac2;">
              <strong style="color: #ffffff;">Next Steps:</strong><br />
              • Interviews for shortlisted candidates are scheduled on campus for <strong>October 17, 2026</strong>.<br />
              • Keep an eye on your university email and the official club portal for updates.
            </td>
          </tr>

          <!-- Call to Action -->
          <tr>
            <td align="center" style="padding: 0 32px 32px 32px;">
              <a href="${escapeHtml(data.appBaseUrl)}" target="_blank" style="display: inline-block; background-color: #00e599; color: #050708; font-family: monospace; font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 14px 28px; border: none;">
                VISIT IT CLUB PORTAL &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #141b22; background-color: #050708; font-size: 11px; color: #52606d; line-height: 1.5;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    IT Club Recruitment &bull; Building Egypt's next generation of tech leaders.<br />
                    This is an automated confirmation receipt. Please do not reply directly to this email.<br />
                    Portal: <a href="${escapeHtml(data.appBaseUrl)}" style="color: #00e599; text-decoration: none;">${escapeHtml(data.appBaseUrl)}</a>
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
IT CLUB RECRUITMENT 2026 — APPLICATION CONFIRMATION
=====================================================

Dear ${data.fullName},

Thank you for applying to IT Club. We have successfully registered your application in our system.

APPLICATION REFERENCE CODE:
>>> ${data.referenceCode} <<<
(Please save this reference code for future check-in and status verification)

SUBMISSION SUMMARY:
- Current Status: Pending Review (قيد المراجعة)
- Primary Track: ${primaryTrackLabel}
- Secondary Track: ${secondaryTrackLabel}
- Academic Year: ${yearMeta}
- Department: ${data.department}

IMPORTANT NOTICE:
Submitting this application places your submission into the review queue.
Submission does NOT imply acceptance. All candidates are evaluated by committee heads, and shortlisted applicants will be invited for interview rounds.

NEXT STEPS:
- On-campus interviews for shortlisted candidates: October 17, 2026.
- Check your university email and the official portal for status updates.

Official Portal: ${data.appBaseUrl}

-----------------------------------------------------
IT Club Recruitment. This is an automated email receipt.
`;

  return { subject, html, text };
}
