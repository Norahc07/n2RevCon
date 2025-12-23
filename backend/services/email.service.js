import nodemailer from 'nodemailer';

// Brevo API configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY?.trim();
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Send email using Brevo API (more reliable than SMTP on Render)
 */
const sendEmailViaBrevoAPI = async ({ to, subject, html, from }) => {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  try {
    // Extract email from "Name <email>" format
    const fromEmail = from?.match(/<(.+)>/)?.[1] || from || process.env.EMAIL_FROM || 'ntworevcon@gmail.com';
    
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: 'n2 RevCon System',
          email: fromEmail,
        },
        to: [
          {
            email: to,
          },
        ],
        subject: subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Brevo API error: ${response.status} - ${errorData.message || response.statusText}`
      );
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messageId,
      apiMode: true,
    };
  } catch (error) {
    console.error('Brevo API Error:', error);
    throw error;
  }
};

// Create reusable transporter object using SMTP transport
// For production, configure with actual SMTP settings (Gmail, SendGrid, etc.)
// For development, you can use Ethereal Email or Mailtrap for testing
const createTransporter = () => {
  // Check if Brevo API key is available (preferred over SMTP on Render)
  if (BREVO_API_KEY) {
    console.log('📧 Using Brevo API (more reliable than SMTP on Render)');
    console.log('   ✅ Uses HTTPS - no port blocking issues');
    return {
      sendMail: async (options) => {
        return await sendEmailViaBrevoAPI({
          to: options.to,
          subject: options.subject,
          html: options.html,
          from: options.from,
        });
      },
      verify: async (callback) => {
        // Test API connection
        try {
          const testResponse = await fetch('https://api.brevo.com/v3/account', {
            headers: {
              'Accept': 'application/json',
              'api-key': BREVO_API_KEY,
            },
          });
          if (testResponse.ok) {
            callback(null, true);
          } else {
            callback(new Error('Brevo API key is invalid'), false);
          }
        } catch (error) {
          callback(error, false);
        }
      },
    };
  }

  // If SMTP credentials are provided in .env, use them
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  
  if (smtpHost && smtpUser && smtpPass) {
    console.log('📧 Using SMTP configuration:', smtpHost);
    console.log('   SMTP User:', smtpUser);
    console.log('   SMTP Port:', process.env.SMTP_PORT || 587);
    console.log('   SMTP Secure:', process.env.SMTP_SECURE === 'true');
    
    // Detect email service provider for better configuration
    const isBrevo = smtpHost.includes('brevo.com') || smtpHost.includes('sendinblue.com');
    const isGmail = smtpHost.includes('gmail.com');
    
    if (isBrevo) {
      console.log('   📬 Using Brevo (Sendinblue) SMTP');
    } else if (isGmail) {
      console.log('   📬 Using Gmail SMTP');
    }
    
    const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    
    // For Brevo, increase timeout and add retry logic
    const transporterConfig = {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      // Increase timeouts for Brevo and Render
      connectionTimeout: isBrevo ? 60000 : 10000, // 60 seconds for Brevo on Render
      greetingTimeout: isBrevo ? 60000 : 10000,
      socketTimeout: isBrevo ? 60000 : 10000,
      // Enable debug for troubleshooting
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development',
      // Additional options for better compatibility
      tls: {
        // Do not fail on invalid certificates (useful for some providers)
        rejectUnauthorized: false,
        // For Brevo, allow older TLS versions if needed
        minVersion: 'TLSv1.2',
        // Additional TLS options for better connection
        ciphers: 'SSLv3'
      },
      // Pool connections for better reliability
      pool: true,
      maxConnections: 1,
      maxMessages: 3
    };
    
    // For Brevo on port 465, ensure secure connection
    if (isBrevo && smtpPort === 465) {
      transporterConfig.secure = true;
      transporterConfig.requireTLS = false;
      transporterConfig.tls = {
        ...transporterConfig.tls,
        rejectUnauthorized: false
      };
    }
    
    // For Brevo on port 587, use STARTTLS
    if (isBrevo && smtpPort === 587) {
      transporterConfig.secure = false;
      transporterConfig.requireTLS = true;
    }
    
    const transporter = nodemailer.createTransport(transporterConfig);
    
    // Verify connection on startup (async, don't block)
    transporter.verify(function (error, success) {
      if (error) {
        console.error('❌ SMTP Connection Error:', error.message);
        console.error('   Error Code:', error.code);
        console.error('   Command:', error.command);
        if (isBrevo) {
          console.error('   💡 Brevo Troubleshooting:');
          if (error.code === 'ENOTFOUND' || error.message.includes('getaddrinfo')) {
            console.error('      ⚠️  DNS Error: Check SMTP_HOST is correct');
            console.error('      ✅ Should be: smtp-relay.brevo.com');
            console.error('      ❌ NOT: smtp.brevo.com');
          }
          console.error('      • Use SMTP password (NOT API key)');
          console.error('      • Use SMTP login from dashboard (NOT your email)');
          console.error('      • Verify sender email in Brevo dashboard');
          console.error('      • Try port 465 with SMTP_SECURE=true if 587 fails');
        } else if (isGmail) {
          console.error('   💡 Gmail Tip: Make sure you\'re using App Password, not regular password');
          console.error('   💡 Enable 2-Factor Authentication and generate App Password');
        }
        console.error('   Check your SMTP credentials and network connection');
      } else {
        console.log('✅ SMTP Server is ready to send emails');
        if (isBrevo) {
          console.log('   📬 Brevo SMTP connection verified successfully');
        }
      }
    });
    
    return transporter;
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
      // Extract URLs from HTML (password change, verification, etc.)
      const urlMatches = options.html.match(/href="([^"]+)"/g);
      const urls = urlMatches ? urlMatches.map(match => match.replace(/href="|"/g, '')) : [];
      const verificationUrl = urls.find(url => url.includes('/verify-email/'));
      const resetUrl = urls.find(url => url.includes('/reset-password/'));
      const changePasswordUrl = urls.find(url => url.includes('/change-password/'));
      const loginUrl = urls.find(url => url.includes('/login'));
      
      console.log('\n📧 ===== EMAIL WOULD BE SENT (CONSOLE MODE) =====');
      console.log('From:', options.from);
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      
      if (verificationUrl) {
        console.log('\n🔗 EMAIL VERIFICATION URL (Copy this to test):');
        console.log('   ' + verificationUrl);
        console.log('\n   ⚠️  This URL will expire in 24 hours');
      } else if (resetUrl) {
        console.log('\n🔗 PASSWORD RESET URL (Copy this to test):');
        console.log('   ' + resetUrl);
        console.log('\n   ⚠️  This URL will expire in 1 hour');
      } else if (changePasswordUrl) {
        console.log('\n🔗 PASSWORD CHANGE URL (Copy this to test):');
        console.log('   ' + changePasswordUrl);
        console.log('\n   ⚠️  This URL will expire in 1 hour');
      } else if (urls.length > 0) {
        console.log('\n🔗 URLS FOUND IN EMAIL:');
        urls.forEach(url => console.log('   ' + url));
      } else {
        console.log('\n⚠️  No URLs found in email HTML');
      }
      console.log('===============================================\n');
      
      return { 
        messageId: 'console-logged', 
        accepted: [options.to],
        passwordChangeUrl: changePasswordUrl || resetUrl,
        verificationUrl: verificationUrl,
        resetUrl: resetUrl
      };
    },
  };
};

// Initialize transporter on module load
const transporter = createTransporter();

// Log transporter status on startup
console.log('\n📧 Email Service Status:');
if (transporter && transporter.sendMail && transporter.sendMail.toString().includes('EMAIL WOULD BE SENT')) {
  console.log('   ⚠️  Running in CONSOLE MODE - Emails will NOT be sent');
  console.log('   📝 Emails will be logged to console only');
  console.log('   🔧 To send real emails, configure SMTP in .env file\n');
} else if (transporter && transporter.transport) {
  console.log('   ✅ Using SMTP transport - Emails will be sent');
} else {
  console.log('   ⚠️  Transporter status unknown');
}

/**
 * Generate HTML email template for password change
 */
const generatePasswordChangeEmailTemplate = (userName, changePasswordUrl) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const logoUrl = `${frontendUrl}/N2RevConLogo.png`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Password Change Request - n2 RevCon</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
      margin: 0;
      padding: 20px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06);
    }
    .email-header {
      background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
    }
    .logo-container {
      display: inline-block;
      background-color: #ffffff;
      padding: 12px;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .logo {
      max-width: 140px;
      height: auto;
      display: block;
    }
    .system-name {
      color: #ffffff;
      font-size: 32px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .email-body {
      padding: 48px 40px;
    }
    .greeting {
      font-size: 20px;
      color: #111827;
      margin-bottom: 24px;
      font-weight: 600;
    }
    .message {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 32px;
      line-height: 1.75;
    }
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    .change-password-button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .change-password-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5);
    }
    .link-section {
      background-color: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 32px 0;
      border: 1px solid #e5e7eb;
    }
    .link-label {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .link-url {
      font-size: 13px;
      color: #DC2626;
      word-break: break-all;
      text-decoration: none;
    }
    .link-url:hover {
      text-decoration: underline;
    }
    .warning {
      background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
      border-left: 4px solid #F59E0B;
      padding: 20px;
      margin: 32px 0;
      border-radius: 8px;
    }
    .warning-title {
      color: #92400E;
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .warning-text {
      color: #92400E;
      font-size: 14px;
      margin: 0;
      line-height: 1.6;
    }
    .email-footer {
      background-color: #f9fafb;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      font-size: 13px;
      color: #6b7280;
      margin: 4px 0;
      line-height: 1.6;
    }
    .signature {
      margin-top: 20px;
      font-weight: 600;
      color: #1f2937;
      font-size: 14px;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px;
      }
      .email-body {
        padding: 32px 24px;
      }
      .email-header {
        padding: 30px 20px;
      }
      .system-name {
        font-size: 26px;
      }
      .change-password-button {
        padding: 14px 32px;
        font-size: 15px;
      }
      .email-footer {
        padding: 24px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <div class="logo-container">
        <img src="${logoUrl}" alt="n2 RevCon Logo" class="logo" />
      </div>
      <h1 class="system-name">n2 RevCon</h1>
    </div>
    
    <div class="email-body">
      <p class="greeting">Hello ${userName},</p>
      
      <p class="message">
        We received a request to change your password for your n2 RevCon account. 
        To proceed with the password change, please click the button below.
      </p>
      
      <div class="button-container">
        <a href="${changePasswordUrl}" class="change-password-button">
          Change Password
        </a>
      </div>
      
      <div class="link-section">
        <div class="link-label">If the button doesn't work, copy and paste this link:</div>
        <a href="${changePasswordUrl}" class="link-url">${changePasswordUrl}</a>
      </div>
      
      <div class="warning">
        <div class="warning-title">
          <span>⚠️</span>
          <span>Security Notice</span>
        </div>
        <p class="warning-text">
          This link will expire in 1 hour for your security. If you didn't request this password change, 
          please ignore this email or contact support immediately.
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

/**
 * Generate HTML email template for email verification
 */
const generateEmailVerificationTemplate = (userName, verificationUrl) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  // Fix logo path - use correct filename with capital N
  const logoUrl = `${frontendUrl}/N2RevConLogo.png`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Verify Your Email - n2 RevCon</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
      margin: 0;
      padding: 20px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06);
    }
    .email-header {
      background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
    }
    .logo-container {
      display: inline-block;
      background-color: #ffffff;
      padding: 12px;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .logo {
      max-width: 140px;
      height: auto;
      display: block;
    }
    .system-name {
      color: #ffffff;
      font-size: 32px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .email-body {
      padding: 48px 40px;
    }
    .greeting {
      font-size: 20px;
      color: #111827;
      margin-bottom: 24px;
      font-weight: 600;
    }
    .message {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 32px;
      line-height: 1.75;
    }
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    .verify-button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .verify-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5);
    }
    .info-box {
      background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
      border-left: 4px solid #3B82F6;
      padding: 20px;
      margin: 32px 0;
      border-radius: 8px;
    }
    .info-title {
      color: #1E40AF;
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .info-list {
      color: #1E40AF;
      font-size: 14px;
      margin: 0;
      padding-left: 0;
      list-style: none;
    }
    .info-list li {
      margin-bottom: 8px;
      padding-left: 24px;
      position: relative;
    }
    .info-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #3B82F6;
      font-weight: bold;
    }
    .info-list li:last-child {
      margin-bottom: 0;
    }
    .link-section {
      background-color: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 32px 0;
      border: 1px solid #e5e7eb;
    }
    .link-label {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .link-url {
      font-size: 13px;
      color: #DC2626;
      word-break: break-all;
      text-decoration: none;
    }
    .link-url:hover {
      text-decoration: underline;
    }
    .expiry-notice {
      font-size: 14px;
      color: #6b7280;
      font-style: italic;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
    .email-footer {
      background-color: #f9fafb;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      font-size: 13px;
      color: #6b7280;
      margin: 4px 0;
      line-height: 1.6;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px;
      }
      .email-body {
        padding: 32px 24px;
      }
      .email-header {
        padding: 30px 20px;
      }
      .system-name {
        font-size: 26px;
      }
      .verify-button {
        padding: 14px 32px;
        font-size: 15px;
      }
      .email-footer {
        padding: 24px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <div class="logo-container">
        <img src="${logoUrl}" alt="n2 RevCon Logo" class="logo" />
      </div>
      <h1 class="system-name">n2 RevCon</h1>
    </div>
    
    <div class="email-body">
      <p class="greeting">Hello ${userName},</p>
      
      <p class="message">
        Thank you for registering with n2 RevCon! To complete your registration, 
        please verify your email address by clicking the button below.
      </p>
      
      <div class="button-container">
        <a href="${verificationUrl}" class="verify-button">
          Verify Email Address
        </a>
      </div>
      
      <div class="info-box">
        <div class="info-title">
          <span>📋</span>
          <span>Next Steps</span>
        </div>
        <ul class="info-list">
          <li>Verify your email address using the button above</li>
          <li>Wait for administrator approval</li>
          <li>You'll receive an email once your account is approved</li>
        </ul>
      </div>
      
      <div class="link-section">
        <div class="link-label">If the button doesn't work, copy and paste this link:</div>
        <a href="${verificationUrl}" class="link-url">${verificationUrl}</a>
      </div>
      
      <p class="expiry-notice">
        This verification link will expire in 24 hours. If you didn't create an account, please ignore this email.
      </p>
    </div>
    
    <div class="email-footer">
      <p class="footer-text">This is an automated message from n2 RevCon System.</p>
      <p class="footer-text">Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generate HTML email template for account approval
 */
const generateAccountApprovalTemplate = (userName) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const logoUrl = `${frontendUrl}/N2RevConLogo.png`;
  const loginUrl = `${frontendUrl}/login`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Account Approved - n2 RevCon</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
      margin: 0;
      padding: 20px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06);
    }
    .email-header {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
    }
    .logo-container {
      display: inline-block;
      background-color: #ffffff;
      padding: 12px;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .logo {
      max-width: 140px;
      height: auto;
      display: block;
    }
    .system-name {
      color: #ffffff;
      font-size: 32px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .email-body {
      padding: 48px 40px;
    }
    .greeting {
      font-size: 20px;
      color: #111827;
      margin-bottom: 24px;
      font-weight: 600;
    }
    .message {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 32px;
      line-height: 1.75;
    }
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    .login-button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .login-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
    }
    .success-box {
      background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
      border-left: 4px solid #10B981;
      padding: 20px;
      margin: 32px 0;
      border-radius: 8px;
    }
    .success-title {
      color: #065F46;
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .success-text {
      color: #065F46;
      font-size: 14px;
      margin: 0;
      line-height: 1.6;
    }
    .email-footer {
      background-color: #f9fafb;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      font-size: 13px;
      color: #6b7280;
      margin: 4px 0;
      line-height: 1.6;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px;
      }
      .email-body {
        padding: 32px 24px;
      }
      .email-header {
        padding: 30px 20px;
      }
      .system-name {
        font-size: 26px;
      }
      .login-button {
        padding: 14px 32px;
        font-size: 15px;
      }
      .email-footer {
        padding: 24px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <div class="logo-container">
        <img src="${logoUrl}" alt="n2 RevCon Logo" class="logo" />
      </div>
      <h1 class="system-name">n2 RevCon</h1>
    </div>
    
    <div class="email-body">
      <p class="greeting">Hello ${userName},</p>
      
      <div class="success-box">
        <div class="success-title">
          <span>✅</span>
          <span>Great News!</span>
        </div>
        <p class="success-text">
          Your account has been approved by an administrator. You can now log in to n2 RevCon!
        </p>
      </div>
      
      <div class="button-container">
        <a href="${loginUrl}" class="login-button">
          Log In to n2 RevCon
        </a>
      </div>
      
      <p class="message">
        If you have any questions, please don't hesitate to contact support.
      </p>
    </div>
    
    <div class="email-footer">
      <p class="footer-text">This is an automated message from n2 RevCon System.</p>
      <p class="footer-text">Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generate HTML email template for account rejection
 */
const generateAccountRejectionTemplate = (userName, reason) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const logoUrl = `${frontendUrl}/N2RevConLogo.png`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Account Registration Update - n2 RevCon</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
      margin: 0;
      padding: 20px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06);
    }
    .email-header {
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
    }
    .logo-container {
      display: inline-block;
      background-color: #ffffff;
      padding: 12px;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .logo {
      max-width: 140px;
      height: auto;
      display: block;
    }
    .system-name {
      color: #ffffff;
      font-size: 32px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .email-body {
      padding: 48px 40px;
    }
    .greeting {
      font-size: 20px;
      color: #111827;
      margin-bottom: 24px;
      font-weight: 600;
    }
    .message {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 32px;
      line-height: 1.75;
    }
    .rejection-box {
      background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
      border-left: 4px solid #EF4444;
      padding: 20px;
      margin: 32px 0;
      border-radius: 8px;
    }
    .rejection-title {
      color: #991B1B;
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .rejection-text {
      color: #991B1B;
      font-size: 14px;
      margin: 0;
      line-height: 1.6;
    }
    .reason-box {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      padding: 16px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .reason-label {
      font-size: 14px;
      color: #6b7280;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .reason-text {
      font-size: 14px;
      color: #374151;
      line-height: 1.6;
    }
    .email-footer {
      background-color: #f9fafb;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      font-size: 13px;
      color: #6b7280;
      margin: 4px 0;
      line-height: 1.6;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px;
      }
      .email-body {
        padding: 32px 24px;
      }
      .email-header {
        padding: 30px 20px;
      }
      .system-name {
        font-size: 26px;
      }
      .email-footer {
        padding: 24px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <div class="logo-container">
        <img src="${logoUrl}" alt="n2 RevCon Logo" class="logo" />
      </div>
      <h1 class="system-name">n2 RevCon</h1>
    </div>
    
    <div class="email-body">
      <p class="greeting">Hello ${userName},</p>
      
      <div class="rejection-box">
        <div class="rejection-title">
          <span>📋</span>
          <span>Account Registration Update</span>
        </div>
        <p class="rejection-text">
          We regret to inform you that your account registration has been reviewed and not approved at this time.
        </p>
      </div>
      
      ${reason ? `
      <div class="reason-box">
        <div class="reason-label">Reason:</div>
        <div class="reason-text">${reason}</div>
      </div>
      ` : ''}
      
      <p class="message">
        If you believe this is an error or have questions, please contact our support team for assistance.
      </p>
    </div>
    
    <div class="email-footer">
      <p class="footer-text">This is an automated message from n2 RevCon System.</p>
      <p class="footer-text">Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Send email verification email
 */
export const sendEmailVerificationEmail = async ({ to, userName, verificationUrl }) => {
  try {
    // Check if using Brevo API
    const usingBrevoAPI = BREVO_API_KEY !== undefined;
    
    // Check if transporter is in console mode
    const isConsoleMode = !usingBrevoAPI && transporter && transporter.sendMail && 
      transporter.sendMail.toString().includes('EMAIL WOULD BE SENT');
    
    if (isConsoleMode) {
      console.log('\n⚠️  EMAIL SERVICE IS IN CONSOLE MODE');
      console.log('   No SMTP configuration found - email will NOT be sent');
      console.log('   Check backend console for verification URL\n');
    }

    const mailOptions = {
      from: `"n2 RevCon System" <${process.env.EMAIL_FROM || 'ntworevcon@gmail.com'}>`,
      to: to,
      subject: 'Verify Your Email - n2 RevCon',
      html: generateEmailVerificationTemplate(userName, verificationUrl),
    };

    console.log('📧 Attempting to send verification email to:', to);
    if (usingBrevoAPI) {
      console.log('   Using Brevo API (HTTPS - no port blocking)');
    }
    
    const info = await transporter.sendMail(mailOptions);
    
    // In development, log the verification URL (especially for console mode)
    let previewUrl = null;
    let extractedVerificationUrl = null;
    
    if (isConsoleMode) {
      console.log('✅ Email logged to console (Console Mode)');
      // Extract URL from console mode response
      if (info.verificationUrl) {
        extractedVerificationUrl = info.verificationUrl;
        console.log('🔗 VERIFICATION URL (Copy this to verify email):');
        console.log('   ' + extractedVerificationUrl);
      }
    } else if (info.apiMode) {
      console.log('✅ Email verification sent via Brevo API!');
    } else if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email verification sent via SMTP!');
      
      // If using Ethereal, get preview URL
      if (typeof nodemailer.getTestMessageUrl === 'function') {
        previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📬 Preview URL (Ethereal Email):', previewUrl);
          console.log('   Open this URL in your browser to view the email');
        }
      }
    } else {
      console.log('✅ Email verification sent successfully!');
    }
    
    return { 
      success: true, 
      messageId: info.messageId,
      previewUrl,
      verificationUrl: extractedVerificationUrl || verificationUrl,
      isConsoleMode: isConsoleMode
    };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Send account approval email
 */
export const sendAccountApprovalEmail = async ({ to, userName }) => {
  try {
    const mailOptions = {
      from: `"n2 RevCon System" <${process.env.EMAIL_FROM || 'ntworevcon@gmail.com'}>`,
      to: to,
      subject: 'Account Approved - n2 RevCon',
      html: generateAccountApprovalTemplate(userName),
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Account approval email sent!');
      if (typeof nodemailer.getTestMessageUrl === 'function') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📬 Preview URL:', previewUrl);
        }
      }
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending approval email:', error);
    throw error;
  }
};

/**
 * Send account rejection email
 */
export const sendAccountRejectionEmail = async ({ to, userName, reason }) => {
  try {
    const mailOptions = {
      from: `"n2 RevCon System" <${process.env.EMAIL_FROM || 'ntworevcon@gmail.com'}>`,
      to: to,
      subject: 'Account Registration Update - n2 RevCon',
      html: generateAccountRejectionTemplate(userName, reason),
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Account rejection email sent!');
      if (typeof nodemailer.getTestMessageUrl === 'function') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📬 Preview URL:', previewUrl);
        }
      }
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending rejection email:', error);
    throw error;
  }
};

export default {
  sendPasswordChangeEmail,
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
  sendAccountApprovalEmail,
  sendAccountRejectionEmail,
};

