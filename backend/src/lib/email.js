const { Resend } = require('resend');

let resendClient = null;

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
 * Send a 6-digit verification code to the user's email address via Resend.
 * If RESEND_API_KEY is not configured or in development mode, logs the OTP to console.
 */
async function sendOtpEmail({ email, name, code }) {
  const client = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'PolySafe <onboarding@resend.dev>';
  const subject = `Your PolySafe verification code: ${code}`;
  const greeting = name ? `Hello ${name},` : 'Hello,';
  
  const textContent = `${greeting}\n\nYour PolySafe verification code is: ${code}\n\nIt expires in 10 minutes.\nIf you did not request this code, you can safely ignore this email.\n\n— The PolySafe Team`;
  
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #FBF8F2; border: 1px solid #E7E1D3; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #2B6E5E; font-size: 26px; margin: 0; font-family: serif;">PolySafe</h1>
        <p style="color: #6B726C; font-size: 13px; margin: 4px 0 0;">AI Polypharmacy Risk & Medication Protection</p>
      </div>
      <div style="background: #FFFFFF; padding: 24px; border-radius: 12px; border: 1px solid #E7E1D3; text-align: center;">
        <p style="color: #232724; font-size: 15px; margin: 0 0 16px; text-align: left;">${greeting}</p>
        <p style="color: #232724; font-size: 14px; margin: 0 0 20px; text-align: left;">Use the following verification code to complete your sign-in to PolySafe:</p>
        <div style="display: inline-block; background: #E4F2E9; border: 2px solid #2B6E5E; border-radius: 12px; padding: 14px 28px; margin: 10px 0 20px;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #2B6E5E; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #6B726C; font-size: 12px; margin: 0;">This code expires in <strong>10 minutes</strong>. Never share this code with anyone.</p>
      </div>
      <p style="color: #9CA3AF; font-size: 11px; text-align: center; margin-top: 20px;">If you did not request this email, please ignore it.</p>
    </div>
  `;

  if (client) {
    try {
      const response = await client.emails.send({
        from: fromEmail,
        to: email,
        subject,
        text: textContent,
        html: htmlContent,
      });
      console.log(`[resend] Email sent to ${email} (id: ${response?.data?.id || 'ok'})`);
      return { success: true, response };
    } catch (error) {
      console.error('[resend] Email send error:', error);
      return { success: false, error };
    }
  } else {
    // Development / mock fallback
    console.log(`\n========================================`);
    console.log(`[PolySafe Resend OTP STUB] To: ${email} (${name || 'User'})`);
    console.log(`[PolySafe Resend OTP STUB] Verification Code: ${code}`);
    console.log(`[PolySafe Resend OTP STUB] Expires in 10 minutes`);
    console.log(`========================================\n`);
    return { success: true, stub: true };
  }
}

module.exports = {
  sendOtpEmail,
};
