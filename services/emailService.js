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
 * Send waitlist welcome email
 * @param {string} email - Recipient email
 * @param {string} referralCode - User's unique referral code
 * @returns {Promise<boolean>} - Success status
 */
const sendWaitlistEmail = async (email, referralCode) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.warn('Email service not configured, skipping waitlist email');
    return false;
  }

  const referralLink = `https://codelearnn.com/?ref=${referralCode}`;
  const websiteUrl = 'https://codelearnn.com';
  const twitterUrl = 'https://x.com/ayushrathore_27';
  const linkedinUrl = 'https://www.linkedin.com/in/ayushrathore1';
  const unsubscribeLink = `${websiteUrl}/unsubscribe?email=${encodeURIComponent(email)}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"CodeLearnn" <noreply@codelearnn.com>',
    to: email,
    subject: "You're on the list! Welcome to CodeLearnn 🚀",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #e2e8f0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0f;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="100%" style="max-width: 600px; background: linear-gradient(135deg, #12121a 0%, #1a1a2e 100%); border-radius: 16px; border: 1px solid #2a2a3e;">
                <tr>
                  <td style="padding: 40px 32px;">
                    <!-- Logo -->
                    <div style="text-align: center; margin-bottom: 32px;">
                      <span style="font-size: 28px; font-weight: bold; color: #ffffff;">
                        <span style="color: #00d4ff;">&lt;</span>CodeLearnn<span style="color: #7c3aed;">/&gt;</span>
                      </span>
                    </div>
                    
                    <!-- Title -->
                    <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; text-align: left; margin: 0 0 24px 0;">
                      Hey there! 👋
                    </h1>
                    
                    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                      You just joined the CodeLearnn waitlist, and we couldn't be more excited to have you here.
                    </p>
                    
                    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                      You're officially on the list for early access when we launch in <strong>February 2026</strong>. But here's the best part: the first 500 students get <strong>lifetime free access to all PRO features</strong>.
                    </p>

                    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                      You're one step closer to ditching random tutorials and building real engineering skills that matter.
                    </p>
                    
                    <hr style="border: 0; border-top: 1px solid #2a2a3e; margin: 32px 0;" />
                    
                    <h2 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; letter-spacing: 0.05em;">
                      WHAT HAPPENS NEXT?
                    </h2>

                    <div style="margin-bottom: 24px;">
                      <h3 style="color: #00d4ff; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">1. We're building for you</h3>
                      <p style="color: #94a3b8; font-size: 15px; margin: 0 0 0 0;">We'll keep you updated as we add new learning paths, visualizations, and features.</p>
                    </div>

                    <div style="margin-bottom: 24px;">
                      <h3 style="color: #00d4ff; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">2. Early access in Feb 2026</h3>
                      <p style="color: #94a3b8; font-size: 15px; margin: 0 0 0 0;">You'll get an email with your personal access link before anyone else.</p>
                    </div>

                    <div style="margin-bottom: 32px;">
                      <h3 style="color: #00d4ff; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">3. Shape the product</h3>
                      <p style="color: #94a3b8; font-size: 15px; margin: 0 0 0 0;">Your feedback will help us build the best learning OS for engineering students.</p>
                    </div>

                    <hr style="border: 0; border-top: 1px solid #2a2a3e; margin: 32px 0;" />

                    <h2 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; letter-spacing: 0.05em;">
                      WANT TO SKIP THE LINE?
                    </h2>
                    
                    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                      Share CodeLearnn with 3 friends and get priority access when we launch.
                    </p>
                    
                    <div style="background-color: #1e1e2e; padding: 16px; border-radius: 8px; border: 1px solid #3a3a4e; text-align: center; margin-bottom: 32px;">
                      <a href="${referralLink}" style="color: #00d4ff; font-family: monospace; text-decoration: none; font-size: 14px; word-break: break-all;">
                        ${referralLink}
                      </a>
                    </div>
                    
                    <hr style="border: 0; border-top: 1px solid #2a2a3e; margin: 32px 0;" />
                    
                    <h2 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; letter-spacing: 0.05em;">
                      IN THE MEANTIME...
                    </h2>
                    
                    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                      We're not going to spam you with daily emails. But we will send you:
                    </p>
                    
                    <ul style="color: #94a3b8; font-size: 15px; line-height: 1.6; padding-left: 20px; type: disc;">
                      <li style="margin-bottom: 8px;">Sneak peeks at new features as we build them</li>
                      <li style="margin-bottom: 8px;">Free learning resources and career guides</li>
                      <li style="margin-bottom: 8px;">Your early access link when we launch (Feb 2026)</li>
                    </ul>

                    <hr style="border: 0; border-top: 1px solid #2a2a3e; margin: 32px 0;" />
                    
                    <h2 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; letter-spacing: 0.05em;">
                      HELP US BUILD WHAT YOU NEED
                    </h2>
                    
                    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                      We want to build CodeLearnn around YOUR needs. Mind answering one quick question?
                    </p>
                    
                    <p style="color: #ffffff; font-weight: 600; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; background-color: rgba(124, 58, 237, 0.1); padding: 16px; border-left: 3px solid #7c3aed; border-radius: 4px;">
                      What's your biggest struggle when learning to code right now?
                    </p>
                    
                    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                      Just reply to this email and let us know.
                    </p>
                    
                    <!-- Signature -->
                    <div style="margin-top: 40px;">
                      <p style="color: #ffffff; font-weight: 600; margin: 0 0 4px 0;">CodeLearnn</p>
                      <p style="color: #94a3b8; font-size: 14px; margin: 0;">The Learning Operating System for Engineering Students</p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 0 32px 32px 32px;">
                    <div style="border-top: 1px solid #2a2a3e; padding-top: 24px; text-align: center;">
                      <p style="margin-bottom: 16px;">
                        <a href="${websiteUrl}" style="color: #94a3b8; text-decoration: none; font-size: 13px; margin: 0 10px;">Website</a>
                        <a href="${twitterUrl}" style="color: #94a3b8; text-decoration: none; font-size: 13px; margin: 0 10px;">Twitter</a>
                        <a href="${linkedinUrl}" style="color: #94a3b8; text-decoration: none; font-size: 13px; margin: 0 10px;">LinkedIn</a>
                      </p>
                      <p style="color: #4a4a5a; font-size: 12px; margin: 0 0 8px 0;">
                        You're receiving this because you joined the CodeLearnn waitlist.
                      </p>
                      <a href="${unsubscribeLink}" style="color: #4a4a5a; font-size: 12px; text-decoration: underline;">Unsubscribe</a>
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
    text: `
      CodeLearnn - The Learning Operating System

      Hey there! 👋

      You just joined the CodeLearnn waitlist, and we couldn't be more excited to have you here.

      You're officially on the list for early access when we launch in February 2026. But here's the best part: the first 500 students get lifetime free access to all PRO features.

      You're one step closer to ditching random tutorials and building real engineering skills that matter.

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      WHAT HAPPENS NEXT?

      1. We're building for you
        We'll keep you updated as we add new learning paths, visualizations, and features.

      2. Early access in Feb 2026
        You'll get an email with your personal access link before anyone else.

      3. Shape the product
        Your feedback will help us build the best learning OS for engineering students.

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      WANT TO SKIP THE LINE?

      Share CodeLearnn with 3 friends and get priority access when we launch.

      Get your referral link: ${referralLink}

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      IN THE MEANTIME...

      We're not going to spam you with daily emails. But we will send you:

      - Sneak peeks at new features as we build them
      - Free learning resources and career guides  
      - Your early access link when we launch (Feb 2026)

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      HELP US BUILD WHAT YOU NEED

      We want to build CodeLearnn around YOUR needs. Mind answering one quick question?

      What's your biggest struggle when learning to code right now?

      Just reply to this email and let us know.

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      CodeLearnn
      The Learning Operating System for Engineering Students

      Website: ${websiteUrl}
      Twitter: ${twitterUrl}
      LinkedIn: ${linkedinUrl}

      You're receiving this because you joined the CodeLearnn waitlist.
      Unsubscribe: ${unsubscribeLink}
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️  Waitlist welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Waitlist email send error:', error);
    // Don't throw, just return false so waitlist signup doesn't fail
    return false;
  }
};

/**
 * Send admin notification for new waitlist signup
 * @param {string} userEmail - New user's email
 * @returns {Promise<boolean>} - Success status
 */
const sendAdminNotification = async (userEmail) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    return false;
  }

  const adminEmail = 'rathoreayush512@gmail.com';

  const mailOptions = {
    from: process.env.SMTP_FROM || '"CodeLearnn" <noreply@codelearnn.com>',
    to: adminEmail,
    subject: 'New Waitlist Signup! 🚀',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>New User Joined Waitlist</h2>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <hr />
        <p style="font-size: 12px; color: #666;">CodeLearnn Admin Notification</p>
      </div>
    `,
    text: `New User Joined Waitlist\n\nEmail: ${userEmail}\nTime: ${new Date().toLocaleString()}`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️  Admin notification sent for ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Admin notification error:', error);
    return false;
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
  sendWaitlistEmail,
  sendAdminNotification,
  generateOTP
};
