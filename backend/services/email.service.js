import nodemailer from 'nodemailer';

// Create reusable transporter object using SMTP transport
// For production, configure with actual SMTP settings (Gmail, SendGrid, etc.)
// For development, you can use Ethereal Email or Mailtrap for testing
const createTransporter = () => {
  // If SMTP credentials are provided in .env, use them
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  
  if (smtpHost && smtpUser && smtpPass) {
    console.log('📧 Using SMTP configuration:', smtpHost);
    console.log('   SMTP User:', smtpUser);
    console.log('   SMTP Port:', process.env.SMTP_PORT || 587);
    return nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }
  
  // Debug: Log what's missing
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 SMTP Configuration Check:');
    console.log('   SMTP_HOST:', smtpHost || 'NOT SET');
    console.log('   SMTP_USER:', smtpUser ? 'SET' : 'NOT SET');
    console.log('   SMTP_PASS:', smtpPass ? 'SET' : 'NOT SET');
  }

  // For development: Use Ethereal Email (creates a test account automatically)
  // This will log the email URL to console for viewing
  if (process.env.NODE_ENV === 'development' && process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
    console.log('📧 Using Ethereal Email for testing');
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS,
      },
    });
  }

  // Fallback: Use console logging in development (no real email sent)
  if (process.env.NODE_ENV === 'development') {
    console.warn('\n⚠️  WARNING: No SMTP configuration found. Emails will be logged to console only.');
    console.warn('   To send real emails, configure SMTP settings in .env file:');
    console.warn('   SMTP_HOST=smtp.gmail.com');
    console.warn('   SMTP_PORT=587');
    console.warn('   SMTP_USER=your-email@gmail.com');
    console.warn('   SMTP_PASS=your-app-password\n');
  }
  
  return {
    sendMail: async (options) => {
      // Extract password change URL from HTML
      const urlMatch = options.html.match(/href="([^"]+)"/);
      const passwordChangeUrl = urlMatch ? urlMatch[1] : null;
      
      console.log('\n📧 ===== EMAIL WOULD BE SENT (CONSOLE MODE) =====');
      console.log('From:', options.from);
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      if (passwordChangeUrl) {
        console.log('\n🔗 PASSWORD CHANGE URL (Copy this to test):');
        console.log('   ' + passwordChangeUrl);
        console.log('\n   ⚠️  This URL will expire in 1 hour');
      } else {
        console.log('Change Password URL: URL not found in HTML');
      }
      console.log('===============================================\n');
      return { 
        messageId: 'console-logged', 
        accepted: [options.to],
        passwordChangeUrl: passwordChangeUrl 
      };
    },
  };
};

// Initialize transporter on module load
const transporter = createTransporter();

/**
 * Generate HTML email template for password change
 */
const generatePasswordChangeEmailTemplate = (userName, changePasswordUrl) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const logoUrl = `${frontendUrl}/n2RevConLogo.png`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Change Request - n2 RevCon</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
      padding: 30px 20px;
      text-align: center;
    }
    .logo {
      max-width: 120px;
      height: auto;
      margin-bottom: 15px;
      background-color: white;
      padding: 10px;
      border-radius: 8px;
    }
    .system-name {
      color: #ffffff;
      font-size: 28px;
      font-weight: bold;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .email-body {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .change-password-button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .change-password-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(220, 38, 38, 0.4);
    }
    .link-text {
      font-size: 14px;
      color: #6b7280;
      margin-top: 20px;
      word-break: break-all;
    }
    .warning {
      background-color: #FEF3C7;
      border-left: 4px solid #F59E0B;
      padding: 15px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .warning-text {
      color: #92400E;
      font-size: 14px;
      margin: 0;
    }
    .email-footer {
      background-color: #f9fafb;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      font-size: 14px;
      color: #6b7280;
      margin: 5px 0;
    }
    .signature {
      margin-top: 20px;
      font-weight: 600;
      color: #1f2937;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <img src="${logoUrl}" alt="n2 RevCon Logo" class="logo" />
      <h1 class="system-name">n2 RevCon</h1>
    </div>
    
    <div class="email-body">
      <p class="greeting">Hello ${userName},</p>
      
      <p class="message">
        We received a request to change your password for your n2 RevCon account. 
        To proceed with the password change, please click the button below:
      </p>
      
      <div class="button-container">
        <a href="${changePasswordUrl}" class="change-password-button">
          Change Password
        </a>
      </div>
      
      <p class="link-text">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${changePasswordUrl}" style="color: #DC2626;">${changePasswordUrl}</a>
      </p>
      
      <div class="warning">
        <p class="warning-text">
          <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour for your security. 
          If you didn't request this password change, please ignore this email or contact support immediately.
        </p>
      </div>
      
      <p class="message">
        If you have any questions or concerns, please don't hesitate to contact us.
      </p>
    </div>
    
    <div class="email-footer">
      <p class="footer-text">This is an automated message from n2 RevCon System.</p>
      <p class="footer-text">Please do not reply to this email.</p>
      <p class="signature">Best regards,<br>System Admin<br>n2 RevCon</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Send password change verification email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.userName - User's full name
 * @param {string} options.changePasswordUrl - Password change URL with token
 */
export const sendPasswordChangeEmail = async ({ to, userName, changePasswordUrl }) => {
  try {
    const mailOptions = {
      from: `"n2 RevCon System" <${process.env.EMAIL_FROM || 'ntworevcon@gmail.com'}>`,
      to: to,
      subject: 'Password Change Request - n2 RevCon',
      html: generatePasswordChangeEmailTemplate(userName, changePasswordUrl),
    };

    const info = await transporter.sendMail(mailOptions);
    
    // In development with Ethereal, log the preview URL
    let previewUrl = null;
    let passwordChangeUrl = null;
    
    if (process.env.NODE_ENV === 'development' && info.messageId) {
      console.log('📧 Password change email sent!');
      // Only log preview URL if using Ethereal (getTestMessageUrl is only available for Ethereal)
      if (typeof nodemailer.getTestMessageUrl === 'function') {
        previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📬 Preview URL (Ethereal Email):', previewUrl);
          console.log('   Open this URL in your browser to view the email');
        }
      }
      
      // If using console mode, extract URL from result
      if (info.passwordChangeUrl) {
        passwordChangeUrl = info.passwordChangeUrl;
      }
    }
    
    return { success: true, messageId: info.messageId, previewUrl, passwordChangeUrl };
  } catch (error) {
    console.error('Error sending password change email:', error);
    throw error;
  }
};

/**
 * Send password reset email (for forgot password)
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.userName - User's full name
 * @param {string} options.resetUrl - Password reset URL with token
 */
export const sendPasswordResetEmail = async ({ to, userName, resetUrl }) => {
  try {
    const mailOptions = {
      from: `"n2 RevCon System" <${process.env.EMAIL_FROM || 'ntworevcon@gmail.com'}>`,
      to: to,
      subject: 'Password Reset Request - n2 RevCon',
      html: generatePasswordChangeEmailTemplate(userName, resetUrl), // Reuse same template
    };

    const info = await transporter.sendMail(mailOptions);
    
    // In development with Ethereal, log the preview URL
    let previewUrl = null;
    let passwordChangeUrl = null;
    
    if (process.env.NODE_ENV === 'development' && info.messageId) {
      console.log('📧 Password reset email sent!');
      // Only log preview URL if using Ethereal (getTestMessageUrl is only available for Ethereal)
      if (typeof nodemailer.getTestMessageUrl === 'function') {
        previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📬 Preview URL (Ethereal Email):', previewUrl);
          console.log('   Open this URL in your browser to view the email');
        }
      }
      
      // If using console mode, extract URL from result
      if (info.passwordChangeUrl) {
        passwordChangeUrl = info.passwordChangeUrl;
      }
    }
    
    return { success: true, messageId: info.messageId, previewUrl, passwordChangeUrl };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export default {
  sendPasswordChangeEmail,
  sendPasswordResetEmail,
};

