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

  const htmlContent = `
    <div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #e0e5ec; border-radius: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #5B21B6; font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">PolySafe</h1>
        <p style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 6px 0 0;">AI Polypharmacy Interaction & Safety Engine</p>
      </div>

      <div style="background: #e0e5ec; padding: 28px 24px; border-radius: 20px; box-shadow: 6px 6px 14px #babecc, -6px -6px 14px #ffffff; text-align: center; border: 1px solid rgba(255,255,255,0.7);">
        <p style="color: #1e293b; font-size: 16px; font-weight: 700; margin: 0 0 12px; text-align: left;">${greeting}</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 24px; text-align: left;">
          Please enter the following 6-digit verification code to authenticate your PolySafe account:
        </p>

        <div style="display: inline-block; background: #e0e5ec; border-radius: 16px; padding: 16px 36px; margin: 8px 0 24px; box-shadow: inset 4px 4px 8px #babecc, inset -4px -4px 8px #ffffff; border: 1px solid rgba(255,255,255,0.5);">
          <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #5B21B6; font-family: 'Courier New', Courier, monospace;">${code}</span>
        </div>

        <p style="color: #64748b; font-size: 12px; margin: 0; font-weight: 500;">
          ⏱ This code will expire in <strong style="color: #1e293b;">10 minutes</strong>. Never share this code with anyone.
        </p>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">
          PolySafe is an informational clinical decision support platform.<br/>
          If you didn't initiate this request, no action is needed.
        </p>
      </div>
    </div>
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
      console.log(`[nodemailer:smtp] ✅ Verification OTP email sent to ${email} (messageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId, provider: 'smtp' };
    } catch (error) {
      console.error('[nodemailer:smtp] ❌ Error sending email via SMTP:', error);
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
      console.log(`[resend] ✅ Email sent to ${email} (id: ${response?.data?.id || 'ok'})`);
      return { success: true, response, provider: 'resend' };
    } catch (error) {
      console.error('[resend] ❌ Email send error:', error);
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
