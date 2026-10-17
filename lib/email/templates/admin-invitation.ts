import { escapeHtml } from "./registration-receipt.ts";

export interface AdminInvitationEmailData {
  recipientEmail: string;
  loginUrl: string;
  expiresInHours?: number;
  temporaryPassword?: string;
  role?: string;
}

export function renderAdminInvitationEmail(data: AdminInvitationEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const safeEmail = escapeHtml(data.recipientEmail);
  const safeLoginUrl = escapeHtml(data.loginUrl);
  const hours = data.expiresInHours || 24;
  const roleTitle = data.role ? escapeHtml(data.role) : "Admin";
  const tempPassword = data.temporaryPassword || "0123456789";

  const subject = "IT Club Staff Invitation — Administrator Access";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .header-pad { padding: 24px 20px 18px 20px !important; }
      .body-pad { padding: 0 20px 20px 20px !important; }
      .footer-pad { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #050708; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #050708; width: 100%;">
    <tr>
      <td align="center" style="padding: 30px 12px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-container" style="max-width: 600px; background-color: #080b0e; border: 1px solid #17222c; text-align: left; border-radius: 8px; overflow: hidden;">
          
          <!-- Accent Gradient Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #00e599 0%, #18c8ed 50%, #9b7cff 100%); line-height: 4px; font-size: 0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td class="header-pad" style="padding: 32px 36px 20px 36px; border-bottom: 1px solid #131c24;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #00e599; margin-bottom: 6px;">Staff Onboarding</span>
                    <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; line-height: 1.3;">Administrator Invitation</h1>
                  </td>
                  <td align="right" valign="top">
                    <span style="display: inline-block; padding: 4px 10px; background: rgba(0, 229, 153, 0.1); border: 1px solid rgba(0, 229, 153, 0.3); font-size: 11px; font-weight: 700; color: #00e599; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 4px;">Role: ${roleTitle}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="body-pad" style="padding: 28px 36px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Hello,
              </p>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                You have been invited by the IT Club Owner to join the administrative team for the <strong style="color: #ffffff;">IT Club Recruitment Platform</strong> with the account email <strong style="color: #00e599;">${safeEmail}</strong>.
              </p>

              <!-- Temporary Password Credential Box -->
              <div style="margin: 24px 0; padding: 20px; background-color: #0c1218; border: 1px solid #1e293b; border-radius: 6px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 8px;">
                  One-Time Temporary Password
                </div>
                <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 22px; font-weight: 800; color: #00e599; letter-spacing: 0.15em; padding: 12px 18px; background-color: #050708; border: 1px dashed #00e599; border-radius: 4px; display: inline-block;">
                  ${escapeHtml(tempPassword)}
                </div>
                <div style="margin-top: 10px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                  Valid for <strong>${hours} hours</strong>. You must change your temporary password immediately upon your first sign in.
                </div>
              </div>

              <!-- Login CTA Button -->
              <div style="margin: 28px 0; text-align: center;">
                <a href="${safeLoginUrl}" style="display: inline-block; background-color: #00e599; color: #050708; padding: 14px 34px; font-size: 13px; font-weight: 800; text-decoration: none; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 4px;">
                  Sign In to Staff Portal &rarr;
                </a>
              </div>

              <!-- Security Policy Box -->
              <div style="margin-top: 24px; padding: 14px 16px; background-color: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; border-radius: 0 4px 4px 0;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #fca5a5;">
                  <strong>Security Policy:</strong> You must change your temporary password immediately upon your first sign in. Administrative dashboard pages are locked until this mandatory update is completed. This credential expires in <strong>${hours} hours</strong>.
                </p>
              </div>

              <!-- Direct URL Fallback -->
              <div style="margin-top: 20px; font-size: 11px; color: #64748b; line-height: 1.5;">
                Direct login link: <a href="${safeLoginUrl}" style="color: #18c8ed; text-decoration: none; word-break: break-all;">${safeLoginUrl}</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer-pad" style="padding: 24px 36px; background-color: #050708; border-top: 1px solid #131c24; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.5;">
                IT Club &bull; Borg Al Arab Technological University (BATU)<br />
                This is an automated administrative notification. Do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `IT CLUB — ADMINISTRATOR INVITATION
=======================================

Hello,

You have been invited by the IT Club Owner to join the administrative team for the IT Club Recruitment Platform.

Account Email:      ${data.recipientEmail}
Assigned Role:      ${data.role || "Administrator"}
Login Portal:       ${data.loginUrl}
Temporary Password: ${tempPassword}
Credential Expiry:  ${hours} hours

MANDATORY SECURITY NOTICE:
- You must change your temporary password immediately upon your first sign in.
- Administrative dashboard features remain locked until your password is updated.
- This temporary credential expires in ${hours} hours.

IT Club • Borg Al Arab Technological University (BATU)
`;

  return { subject, html, text };
}
