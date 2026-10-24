const nodemailer = require('nodemailer');
const { Resend } = require('resend');

let smtpTransporter = null;
let resendClient = null;

function getSmtpTransporter() {
  if (smtpTransporter) return smtpTransporter;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  smtpTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return smtpTransporter;
}

function getResendClient() {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.startsWith('re_your_')) {
    return null;
  }
  resendClient = new Resend(apiKey);
  return resendClient;
}

/**
 * Send a 6-digit verification code to the user's email address via SMTP (Gmail) or Resend fallback.
 */
async function sendOtpEmail({ email, name, code }) {
  const smtp = getSmtpTransporter();
  const resend = getResendClient();

  const fromEmail = process.env.SMTP_FROM || process.env.RESEND_FROM_EMAIL || `PolySafe <${process.env.SMTP_USER || 'no-reply@polysafe.app'}>`;
  const subject = `Your PolySafe Verification Code: ${code}`;
  const greeting = name ? `Hello ${name},` : 'Hello,';

  const textContent = `${greeting}\n\nYour PolySafe 6-digit verification code is: ${code}\n\nThis code expires in 10 minutes.\nIf you did not request this code, you can safely ignore this message.\n\n— The PolySafe Medical Safety Team`;

  const cleanCode = String(code || '').trim();
  const digits = cleanCode.split('').slice(0, 6);
  while (digits.length < 6) digits.push('-');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your PolySafe Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 36px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; border: 1px solid #cbd5e1; box-shadow: 0 16px 36px -10px rgba(15, 23, 42, 0.08); overflow: hidden;">
          
          <!-- Top Accent Line (Brand Sapphire to Warm Coral) -->
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #0284c7 0%, #0ea5e9 45%, #ff5c35 100%);"></td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td style="padding: 34px 32px 24px 32px; text-align: center; background-color: #ffffff;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto;">
                <tr>
                  <!-- Medical Cross Icon -->
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <div style="width: 40px; height: 40px; background: #0284c7; border-radius: 12px; text-align: center; line-height: 40px;">
                      <span style="color: #ffffff; font-size: 24px; font-weight: 900; line-height: 40px; display: block; font-family: sans-serif;">+</span>
                    </div>
                  </td>
                  <!-- Wordmark -->
                  <td style="vertical-align: middle; text-align: left;">
                    <div style="font-size: 24px; font-weight: 900; letter-spacing: -0.6px; color: #0f172a; line-height: 1.1;">
                      Poly<span style="color: #0284c7;">Safe</span><span style="display: inline-block; width: 6px; height: 6px; background-color: #ff5c35; border-radius: 50%; margin-left: 2px;"></span>
                    </div>
                    <div style="font-size: 10px; font-weight: 800; color: #64748b; letter-spacing: 1.4px; text-transform: uppercase; margin-top: 3px;">
                      AI Polypharmacy Interaction &amp; Safety Engine
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background-color: #f1f5f9;"></div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 28px 32px 24px 32px;">
              <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0; letter-spacing: -0.3px;">
                ${greeting}
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                Please enter the following 6-digit verification code to authenticate your PolySafe clinical account:
              </p>

              <!-- OTP Digit Tiles Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 24px 16px;">
                <tr>
                  <td align="center">
                    
                    <!-- 6 Digit Individual Tiles with 3-3 Split Dot -->
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto;">
                      <tr>
                        <td align="center" valign="middle" style="width: 40px; height: 50px; background-color: #ffffff; border: 2px solid #0284c7; border-radius: 10px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 26px; font-weight: 900; color: #0f172a; text-align: center; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.08);">
                          ${digits[0]}
                        </td>
                        <td style="width: 6px;"></td>
                        <td align="center" valign="middle" style="width: 40px; height: 50px; background-color: #ffffff; border: 2px solid #0284c7; border-radius: 10px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 26px; font-weight: 900; color: #0f172a; text-align: center; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.08);">
                          ${digits[1]}
                        </td>
                        <td style="width: 6px;"></td>
                        <td align="center" valign="middle" style="width: 40px; height: 50px; background-color: #ffffff; border: 2px solid #0284c7; border-radius: 10px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 26px; font-weight: 900; color: #0f172a; text-align: center; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.08);">
                          ${digits[2]}
                        </td>
                        <td align="center" valign="middle" style="width: 14px; color: #94a3b8; font-size: 20px; font-weight: 900; text-align: center;">
                          &middot;
                        </td>
                        <td align="center" valign="middle" style="width: 40px; height: 50px; background-color: #ffffff; border: 2px solid #0284c7; border-radius: 10px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 26px; font-weight: 900; color: #0f172a; text-align: center; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.08);">
                          ${digits[3]}
                        </td>
                        <td style="width: 6px;"></td>
                        <td align="center" valign="middle" style="width: 40px; height: 50px; background-color: #ffffff; border: 2px solid #0284c7; border-radius: 10px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 26px; font-weight: 900; color: #0f172a; text-align: center; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.08);">
                          ${digits[4]}
                        </td>
                        <td style="width: 6px;"></td>
                        <td align="center" valign="middle" style="width: 40px; height: 50px; background-color: #ffffff; border: 2px solid #0284c7; border-radius: 10px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 26px; font-weight: 900; color: #0f172a; text-align: center; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.08);">
                          ${digits[5]}
                        </td>
                      </tr>
                    </table>

                    <!-- Expiration & Copy Chip -->
                    <div style="margin-top: 16px;">
                      <span style="display: inline-block; background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px;">
                        Single-Use Passcode &bull; Valid for 10 minutes
                      </span>
                    </div>

                    <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
                      Copy code: <span style="font-family: 'SFMono-Regular', Consolas, Menlo, monospace; font-weight: 800; color: #0284c7; background-color: #e0f2fe; padding: 2px 8px; border-radius: 6px; user-select: all;">${cleanCode}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Details Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fff7ed; border-left: 4px solid #ff5c35; border-radius: 0 10px 10px 0; padding: 12px 16px; margin: 0 0 20px 0;">
                <tr>
                  <td style="font-size: 12px; line-height: 1.5; color: #9a3412;">
                    <strong style="color: #7c2d12;">Security Notice:</strong> Never share this verification code with anyone. PolySafe personnel will never ask for your verification code via call, SMS, or email.
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0;">
                If you did not initiate this authentication request, no further action is required and you may safely disregard this email.
              </p>
            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="font-size: 11px; line-height: 1.6; color: #94a3b8; margin: 0 0 6px 0; font-weight: 500;">
                PolySafe is an informational clinical decision support platform.<br/>
                WHO 5-Tier Interaction Sentinel &bull; Protected by 256-Bit TLS Security
              </p>
              <p style="font-size: 10px; color: #cbd5e1; margin: 0;">
                Automated security dispatch. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  // 1. Try SMTP (Gmail)
  if (smtp) {
    try {
      const info = await smtp.sendMail({
        from: fromEmail,
        to: email,
        subject,
        text: textContent,
        html: htmlContent,
      });
      console.log(`[nodemailer:smtp] Verification OTP email sent to ${email} (messageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId, provider: 'smtp' };
    } catch (error) {
      console.error('[nodemailer:smtp] Error sending email via SMTP:', error);
      // fallback to Resend or stub
    }
  }

  // 2. Try Resend fallback
  if (resend) {
    try {
      const response = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'PolySafe <onboarding@resend.dev>',
        to: email,
        subject,
        text: textContent,
        html: htmlContent,
      });
      console.log(`[resend] Email sent to ${email} (id: ${response?.data?.id || 'ok'})`);
      return { success: true, response, provider: 'resend' };
    } catch (error) {
      console.error('[resend] Email send error:', error);
    }
  }

  // 3. Fallback stub for local testing
  console.log(`\n========================================`);
  console.log(`[PolySafe OTP Email STUB] To: ${email} (${name || 'User'})`);
  console.log(`[PolySafe OTP Email STUB] Verification Code: ${code}`);
  console.log(`[PolySafe OTP Email STUB] Expires in 10 minutes`);
  console.log(`========================================\n`);
  return { success: true, stub: true };
}

module.exports = {
  sendOtpEmail,
};
