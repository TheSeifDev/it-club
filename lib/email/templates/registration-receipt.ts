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
  academicId?: string | null;
  universityEmail?: string | null;
  googleEmail?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  experienceLevel?: string | null;
  skills?: string | null;
  experienceDetails?: string | null;
  volunteerExperience?: string | null;
  motivation?: string | null;
  learningGoal?: string | null;
  contribution?: string | null;
  availability?: string | null;
  appBaseUrl: string;
}

/**
 * Escapes untrusted user input to prevent HTML injection in emails.
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  new: "New to tech (مبتدئ تماماً)",
  beginner: "Beginner with fundamentals (معرفة أولية بالأساسيات)",
  computer_skills: "Good technical skills (مهارات تقنية جيدة)",
  experienced: "Experienced with hands-on projects (خبرة عملية ومشاريع)",
};

export function renderRegistrationReceiptEmail(data: RegistrationEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const safeFullName = escapeHtml(data.fullName);
  const safeReference = escapeHtml(data.referenceCode);
  const safeDepartment = escapeHtml(data.department);
  const safeBaseUrl = escapeHtml(data.appBaseUrl);

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

  // Optional student-submitted fields (safely escaped)
  const safeAcademicId = data.academicId ? escapeHtml(data.academicId) : null;
  const safeUniversityEmail = data.universityEmail ? escapeHtml(data.universityEmail) : null;
  const safeGoogleEmail = data.googleEmail ? escapeHtml(data.googleEmail) : null;
  const safePhone = data.phone ? escapeHtml(data.phone) : null;
  const safeWhatsapp = data.whatsapp ? escapeHtml(data.whatsapp) : null;
  const experienceLabel = data.experienceLevel && EXPERIENCE_LEVEL_LABELS[data.experienceLevel]
    ? EXPERIENCE_LEVEL_LABELS[data.experienceLevel]
    : data.experienceLevel ? escapeHtml(data.experienceLevel) : null;
  const safeSkills = data.skills ? escapeHtml(data.skills) : null;
  const safeExperienceDetails = data.experienceDetails ? escapeHtml(data.experienceDetails) : null;
  const safeVolunteerExperience = data.volunteerExperience ? escapeHtml(data.volunteerExperience) : null;
  const safeMotivation = data.motivation ? escapeHtml(data.motivation) : null;
  const safeLearningGoal = data.learningGoal ? escapeHtml(data.learningGoal) : null;
  const safeContribution = data.contribution ? escapeHtml(data.contribution) : null;
  const safeAvailability = data.availability ? escapeHtml(data.availability) : null;

  const subject = `IT Club Application Received — ${data.referenceCode}`;

  // Build summary rows dynamically for optional fields to avoid undefined / empty clutter
  const summaryRows: Array<{ label: string; value: string; isCode?: boolean }> = [
    { label: "STATUS", value: "Pending Review (في انتظار المراجعة)" },
    { label: "APPLICATION REF", value: safeReference, isCode: true },
    { label: "FULL NAME", value: safeFullName },
    { label: "PRIMARY TRACK", value: safePrimaryTrackHtml },
    { label: "SECONDARY TRACK", value: safeSecondaryTrackHtml },
    { label: "ACADEMIC YEAR", value: safeYearHtml },
    { label: "DEPARTMENT", value: safeDepartment },
  ];

  if (safeAcademicId) {
    summaryRows.push({ label: "STUDENT ID", value: safeAcademicId, isCode: true });
  }
  if (safeUniversityEmail) {
    summaryRows.push({ label: "UNIVERSITY EMAIL", value: safeUniversityEmail });
  }
  if (safeGoogleEmail) {
    summaryRows.push({ label: "PERSONAL EMAIL", value: safeGoogleEmail });
  }
  if (safePhone) {
    summaryRows.push({ label: "PHONE NUMBER", value: safePhone });
  }
  if (safeWhatsapp) {
    summaryRows.push({ label: "WHATSAPP", value: safeWhatsapp });
  }
  if (experienceLabel) {
    summaryRows.push({ label: "EXPERIENCE LEVEL", value: experienceLabel });
  }
  if (safeAvailability) {
    summaryRows.push({ label: "AVAILABILITY", value: safeAvailability });
  }

  const tableRowsHtml = summaryRows
    .map(
      (row, idx) => `
      <tr style="border-bottom: 1px solid #141f27;">
        <td style="padding: 10px 0; color: #7e8b96; font-family: 'Montserrat', monospace, sans-serif; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; width: 38%; vertical-align: top;">
          ${row.label}
        </td>
        <td style="padding: 10px 0; color: ${idx === 0 ? "#00e599" : "#f3f4f6"}; font-weight: ${idx === 0 || row.isCode ? "bold" : "500"}; ${row.isCode ? "font-family: 'Courier New', Courier, monospace; letter-spacing: 1px;" : ""}">
          ${row.value}
        </td>
      </tr>`
    )
    .join("");

  // Optional text block sections for motivation, learning goals, skills
  const qualitativeSectionsHtml = [
    safeSkills
      ? `
      <tr>
        <td style="padding: 0 32px 16px 32px;">
          <div style="background-color: #040608; border: 1px solid #151f28; padding: 14px 18px; border-radius: 4px;">
            <span style="display: block; font-family: 'Montserrat', monospace, sans-serif; font-size: 10px; letter-spacing: 2px; color: #18c8ed; text-transform: uppercase; font-weight: bold; margin-bottom: 6px;">
              SKILLS &amp; TOOLS
            </span>
            <span style="font-size: 13px; color: #d1d5db; line-height: 1.5; white-space: pre-wrap;">${safeSkills}</span>
          </div>
        </td>
      </tr>`
      : "",
    safeExperienceDetails
      ? `
      <tr>
        <td style="padding: 0 32px 16px 32px;">
          <div style="background-color: #040608; border: 1px solid #151f28; padding: 14px 18px; border-radius: 4px;">
            <span style="display: block; font-family: 'Montserrat', monospace, sans-serif; font-size: 10px; letter-spacing: 2px; color: #18c8ed; text-transform: uppercase; font-weight: bold; margin-bottom: 6px;">
              PROJECTS &amp; TECHNICAL EXPERIENCE
            </span>
            <span style="font-size: 13px; color: #d1d5db; line-height: 1.5; white-space: pre-wrap;">${safeExperienceDetails}</span>
          </div>
        </td>
      </tr>`
      : "",
    safeVolunteerExperience
      ? `
      <tr>
        <td style="padding: 0 32px 16px 32px;">
          <div style="background-color: #040608; border: 1px solid #151f28; padding: 14px 18px; border-radius: 4px;">
            <span style="display: block; font-family: 'Montserrat', monospace, sans-serif; font-size: 10px; letter-spacing: 2px; color: #18c8ed; text-transform: uppercase; font-weight: bold; margin-bottom: 6px;">
              PREVIOUS VOLUNTEERING
            </span>
            <span style="font-size: 13px; color: #d1d5db; line-height: 1.5; white-space: pre-wrap;">${safeVolunteerExperience}</span>
          </div>
        </td>
      </tr>`
      : "",
    safeMotivation
      ? `
      <tr>
        <td style="padding: 0 32px 16px 32px;">
          <div style="background-color: #040608; border: 1px solid #151f28; padding: 14px 18px; border-radius: 4px;">
            <span style="display: block; font-family: 'Montserrat', monospace, sans-serif; font-size: 10px; letter-spacing: 2px; color: #00e599; text-transform: uppercase; font-weight: bold; margin-bottom: 6px;">
              MOTIVATION &amp; REASON FOR JOINING
            </span>
            <span style="font-size: 13px; color: #d1d5db; line-height: 1.5; white-space: pre-wrap;">${safeMotivation}</span>
          </div>
        </td>
      </tr>`
      : "",
    safeLearningGoal
      ? `
      <tr>
        <td style="padding: 0 32px 16px 32px;">
          <div style="background-color: #040608; border: 1px solid #151f28; padding: 14px 18px; border-radius: 4px;">
            <span style="display: block; font-family: 'Montserrat', monospace, sans-serif; font-size: 10px; letter-spacing: 2px; color: #00e599; text-transform: uppercase; font-weight: bold; margin-bottom: 6px;">
              LEARNING GOAL
            </span>
            <span style="font-size: 13px; color: #d1d5db; line-height: 1.5; white-space: pre-wrap;">${safeLearningGoal}</span>
          </div>
        </td>
      </tr>`
      : "",
    safeContribution
      ? `
      <tr>
        <td style="padding: 0 32px 16px 32px;">
          <div style="background-color: #040608; border: 1px solid #151f28; padding: 14px 18px; border-radius: 4px;">
            <span style="display: block; font-family: 'Montserrat', monospace, sans-serif; font-size: 10px; letter-spacing: 2px; color: #9b7cff; text-transform: uppercase; font-weight: bold; margin-bottom: 6px;">
              EXPECTED CONTRIBUTION
            </span>
            <span style="font-size: 13px; color: #d1d5db; line-height: 1.5; white-space: pre-wrap;">${safeContribution}</span>
          </div>
        </td>
      </tr>`
      : "",
  ]
    .filter(Boolean)
    .join("");

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
                    <span style="display: inline-block; background-color: #072218; border: 1px solid #00e599; color: #00e599; font-size: 10px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; padding: 4px 10px; border-radius: 4px;">
                      RECEIVED
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Main Heading -->
              <h1 style="margin: 24px 0 6px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; line-height: 1.3;">
                Your IT Club application has been received.
              </h1>
              
              <!-- Arabic Headline (Alexandria Font) -->
              <div dir="rtl" style="margin: 6px 0 0 0; font-family: 'Alexandria', Arial, sans-serif; font-size: 15px; color: #00e599; font-weight: 600; text-align: right;">
                تم استلام طلب الانضمام بنجاح
              </div>
            </td>
          </tr>

          <!-- Student Greeting & Context -->
          <tr>
            <td class="body-pad" style="padding: 0 32px 24px 32px; font-size: 14px; line-height: 1.6; color: #b4bac2;">
              Dear <strong style="color: #ffffff;">${safeFullName}</strong>,<br /><br />
              Thank you for applying to join IT Club. Your recruitment application has been successfully saved into our database. It has now entered the evaluation queue for committee review.
              
              <!-- Concise Arabic Note -->
              <div dir="rtl" style="margin-top: 12px; padding: 12px 16px; background-color: #051610; border-right: 3px solid #00e599; font-family: 'Alexandria', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #86efac; text-align: right; border-radius: 0 4px 4px 0;">
                مرحباً بك! تم تسجيل بياناتك بنجاح في منظومة توظيف النادي. سيتم مراجعة طلبك بواسطة رؤساء اللجان المختصة لاختيار المرشحين لمرحلة المقابلات الشخصية.
              </div>
            </td>
          </tr>

          <!-- Reference Code Callout Box -->
          <tr>
            <td class="body-pad" style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #040608; border: 1px solid #1b2834; padding: 22px; border-radius: 6px; text-align: center;">
                <tr>
                  <td>
                    <span style="font-family: 'Montserrat', monospace, sans-serif; font-size: 10px; letter-spacing: 2.5px; color: #7e8b96; text-transform: uppercase; display: block; margin-bottom: 6px; font-weight: 600;">
                      APPLICATION REFERENCE CODE
                    </span>
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #00e599; display: block; margin-bottom: 6px;">
                      ${safeReference}
                    </span>
                    <span style="font-size: 11px; color: #9ca3af; line-height: 1.4; display: block;">
                      Please save this official reference code. You will use it for status verification and on-campus attendance desk check-in.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Summary Header -->
          <tr>
            <td style="padding: 0 32px 10px 32px;">
              <span style="font-family: 'Montserrat', monospace, sans-serif; font-size: 11px; letter-spacing: 2px; color: #18c8ed; text-transform: uppercase; font-weight: bold; display: block;">
                APPLICATION DETAILS SUMMARY
              </span>
            </td>
          </tr>

          <!-- Submitted Information Table -->
          <tr>
            <td class="body-pad" style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 13px;">
                ${tableRowsHtml}
              </table>
            </td>
          </tr>

          <!-- Qualitative Sections (Skills, Motivation, Learning Goals) -->
          ${qualitativeSectionsHtml}

          <!-- Important Policy / Notice Box -->
          <tr>
            <td class="body-pad" style="padding: 8px 32px 24px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #091210; border-left: 3px solid #00e599; padding: 16px; border-radius: 0 4px 4px 0;">
                <tr>
                  <td style="font-size: 12px; line-height: 1.6; color: #a2b0a9;">
                    <strong style="color: #00e599; text-transform: uppercase; font-family: 'Montserrat', monospace, sans-serif; font-size: 11px; letter-spacing: 1px; display: block; margin-bottom: 4px;">
                      IMPORTANT NOTICE
                    </strong>
                    Submitting this form confirms that your application has been received into the review queue. <strong>Submission does not imply acceptance.</strong> All candidates are thoroughly evaluated by committee heads, and shortlisted candidates will be invited for interview rounds.
                    <div dir="rtl" style="margin-top: 8px; font-family: 'Alexandria', Arial, sans-serif; color: #86efac; text-align: right;">
                      تقديم هذا الطلب يعني وصوله إلى مرحلة المراجعة، ولا يعني القبول النهائي. سيتم التواصل مع المرشحين لإجراء المقابلات الشخصية.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Next Steps & Interview Info -->
          <tr>
            <td class="body-pad" style="padding: 0 32px 24px 32px; font-size: 13px; line-height: 1.6; color: #b4bac2;">
              <strong style="color: #ffffff;">Next Steps:</strong><br />
              • On-campus interviews for shortlisted candidates are scheduled for <strong>October 17, 2026</strong>.<br />
              • Monitor your university email and the official club portal for status updates.<br />
              • If shortlisted, your digital interview QR pass will become accessible on the portal.
            </td>
          </tr>

          <!-- Portal Call to Action Button -->
          <tr>
            <td align="center" style="padding: 0 32px 32px 32px;">
              <a href="${safeBaseUrl}" target="_blank" style="display: inline-block; background-color: #00e599; color: #050708; font-family: 'Montserrat', monospace, sans-serif; font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 14px 28px; border-radius: 4px;">
                VISIT IT CLUB PORTAL &rarr;
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
                    This is an automated confirmation receipt. For official inquiries, visit our portal or contact the recruitment committee.<br />
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

  // Build comprehensive, clean plain-text version
  const textSummaryList: string[] = [
    `Current Status: Pending Review (قيد المراجعة)`,
    `Application Reference: ${data.referenceCode}`,
    `Full Name: ${data.fullName}`,
    `Primary Track: ${primaryTrackLabel}`,
    `Secondary Track: ${secondaryTrackLabel}`,
    `Academic Year: ${yearMeta}`,
    `Department: ${data.department}`,
  ];

  if (data.academicId) textSummaryList.push(`Academic ID: ${data.academicId}`);
  if (data.universityEmail) textSummaryList.push(`University Email: ${data.universityEmail}`);
  if (data.googleEmail) textSummaryList.push(`Personal Email: ${data.googleEmail}`);
  if (data.phone) textSummaryList.push(`Phone: ${data.phone}`);
  if (data.whatsapp) textSummaryList.push(`WhatsApp: ${data.whatsapp}`);
  if (data.experienceLevel) {
    textSummaryList.push(`Experience Level: ${EXPERIENCE_LEVEL_LABELS[data.experienceLevel] || data.experienceLevel}`);
  }
  if (data.availability) textSummaryList.push(`Availability: ${data.availability}`);

  const qualitativeText = [
    data.skills ? `\nSKILLS & TOOLS:\n${data.skills}` : "",
    data.experienceDetails ? `\nPROJECTS & EXPERIENCE:\n${data.experienceDetails}` : "",
    data.volunteerExperience ? `\nVOLUNTEERING:\n${data.volunteerExperience}` : "",
    data.motivation ? `\nMOTIVATION:\n${data.motivation}` : "",
    data.learningGoal ? `\nLEARNING GOAL:\n${data.learningGoal}` : "",
    data.contribution ? `\nEXPECTED CONTRIBUTION:\n${data.contribution}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const text = `=====================================================
IT CLUB RECRUITMENT 2026 — APPLICATION CONFIRMATION
=====================================================

Dear ${data.fullName},

Thank you for applying to IT Club. We have successfully registered your application in our system. Your application has entered our review queue.

APPLICATION REFERENCE CODE:
>>> ${data.referenceCode} <<<
(Please save this reference code for future check-in and status verification)

SUBMISSION SUMMARY:
${textSummaryList.map((line) => `- ${line}`).join("\n")}
${qualitativeText}

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
