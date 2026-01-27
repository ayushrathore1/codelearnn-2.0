const nodemailer = require('nodemailer');

// Create transporter with SMTP settings
const createTransporter = () => {
  // Check if SMTP is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  SMTP not configured. Email sending will fail.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

/**
 * Send OTP verification email
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<boolean>} - Success status
 */
const sendOTPEmail = async (email, otp) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || '"CodeLearnn" <noreply@codelearnn.com>',
    to: email,
    subject: 'Your CodeLearnn Login Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0f;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="100%" style="max-width: 480px; background: linear-gradient(135deg, #12121a 0%, #1a1a2e 100%); border-radius: 16px; border: 1px solid #2a2a3e;">
                <tr>
                  <td style="padding: 40px 32px;">
                    <!-- Logo -->
                    <div style="text-align: center; margin-bottom: 32px;">
                      <span style="font-size: 28px; font-weight: bold; color: #ffffff;">
                        <span style="color: #00d4ff;">&lt;</span>CodeLearnn<span style="color: #7c3aed;">/&gt;</span>
                      </span>
                    </div>
                    
                    <!-- Title -->
                    <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 16px 0;">
                      Your Verification Code
                    </h1>
                    
                    <p style="color: #a0a0b0; font-size: 15px; line-height: 1.6; text-align: center; margin: 0 0 32px 0;">
                      Enter this code to sign in to your CodeLearnn account. It expires in 10 minutes.
                    </p>
                    
                    <!-- OTP Code -->
                    <div style="background: linear-gradient(135deg, #1e1e2e 0%, #252538 100%); border: 1px solid #3a3a4e; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
                      <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #00d4ff;">
                        ${otp}
                      </span>
                    </div>
                    
                    <p style="color: #6b6b7b; font-size: 13px; line-height: 1.5; text-align: center; margin: 0;">
                      If you didn't request this code, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 0 32px 32px 32px;">
                    <div style="border-top: 1px solid #2a2a3e; padding-top: 24px; text-align: center;">
                      <p style="color: #4a4a5a; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} CodeLearnn. Learn like an engineer.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `Your CodeLearnn verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, you can safely ignore this email.`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️  OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  sendOTPEmail,
  generateOTP
};
