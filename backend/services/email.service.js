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
/**
 * Generate HTML email template for password reset (forgot password)
 */
const generatePasswordResetEmailTemplate = (userName, resetUrl) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const cleanFrontendUrl = frontendUrl.replace(/\/$/, '');
  const logoUrl = `${cleanFrontendUrl}/N2RevConLogo.png`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Password Reset Request - n2 RevCon</title>
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
        <!--[if mso]>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="160">
          <tr>
            <td style="text-align: center; padding: 16px; background: white; border-radius: 12px;">
              <span style="color: #DC2626; font-size: 24px; font-weight: 700;">n2 RevCon</span>
            </td>
          </tr>
        </table>
        <![endif]-->
        <!--[if !mso]><!-->
        <img 
          src="${logoUrl}" 
          alt="n2 RevCon Logo" 
          class="logo"
          width="160"
          height="auto"
          style="display: block; max-width: 160px; height: auto; border: none; outline: none;"
          title="n2 RevCon"
        />
        <!--<![endif]-->
      </div>
      <h1 class="system-name">n2 RevCon</h1>
    </div>
    
    <div class="email-body">
      <p class="greeting">Hello ${userName},</p>
      
      <p class="message">
        We received a request to reset your password for your n2 RevCon account. 
        To reset your password, please click the button below.
      </p>
      
      <div class="button-container">
        <a href="${resetUrl}" class="change-password-button">
          Reset Password
        </a>
      </div>
      
      <div class="link-section">
        <div class="link-label">If the button doesn't work, copy and paste this link:</div>
        <a href="${resetUrl}" class="link-url">${resetUrl}</a>
      </div>
      
      <div class="warning">
        <div class="warning-title">
          <span>⚠️</span>
          <span>Security Notice</span>
        </div>
        <p class="warning-text">
          This link will expire in 1 hour for your security. If you didn't request this password reset, 
          please ignore this email or contact support immediately. Your password will remain unchanged.
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
 * Generate HTML email template for password change (when logged in)
 */
const generatePasswordChangeEmailTemplate = (userName, changePasswordUrl) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const cleanFrontendUrl = frontendUrl.replace(/\/$/, '');
  const logoUrl = `${cleanFrontendUrl}/N2RevConLogo.png`;
  
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
        <!--[if mso]>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="160">
          <tr>
            <td style="text-align: center; padding: 16px; background: white; border-radius: 12px;">
              <span style="color: #DC2626; font-size: 24px; font-weight: 700;">n2 RevCon</span>
            </td>
          </tr>
        </table>
        <![endif]-->
        <!--[if !mso]><!-->
        <img 
          src="${logoUrl}" 
          alt="n2 RevCon Logo" 
          class="logo"
          width="160"
          height="auto"
          style="display: block; max-width: 160px; height: auto; border: none; outline: none;"
          title="n2 RevCon"
        />
        <!--<![endif]-->
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
    // Check if using Brevo API
    const usingBrevoAPI = BREVO_API_KEY !== undefined;
    
    // Check if transporter is in console mode
    const isConsoleMode = !usingBrevoAPI && transporter && transporter.sendMail && 
      transporter.sendMail.toString().includes('EMAIL WOULD BE SENT');

    const mailOptions = {
      from: `"n2 RevCon System" <${process.env.EMAIL_FROM || 'ntworevcon@gmail.com'}>`,
      to: to,
      subject: 'Password Reset Request - n2 RevCon',
      html: generatePasswordResetEmailTemplate(userName, resetUrl), // Use dedicated password reset template
    };

    console.log('📧 Attempting to send password reset email to:', to);
    if (usingBrevoAPI) {
      console.log('   Using Brevo API (HTTPS)');
    }
    
    const info = await transporter.sendMail(mailOptions);
    
    // In development, log the reset URL (especially for console mode)
    let previewUrl = null;
    let passwordChangeUrl = null;
    
    if (isConsoleMode) {
      console.log('✅ Email logged to console (Console Mode)');
      // Extract URL from console mode response
      if (info.passwordChangeUrl || info.resetUrl) {
        passwordChangeUrl = info.passwordChangeUrl || info.resetUrl;
        console.log('🔗 PASSWORD RESET URL (Copy this to test):');
        console.log('   ' + passwordChangeUrl);
        console.log('\n   ⚠️  This URL will expire in 1 hour');
      }
    } else if (info.apiMode) {
      console.log('✅ Password reset email sent via Brevo API!');
    } else if (process.env.NODE_ENV === 'development') {
      console.log('📧 Password reset email sent via SMTP!');
      // Only log preview URL if using Ethereal (getTestMessageUrl is only available for Ethereal)
      if (typeof nodemailer.getTestMessageUrl === 'function') {
        previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📬 Preview URL (Ethereal Email):', previewUrl);
          console.log('   Open this URL in your browser to view the email');
        }
      }
    } else {
      console.log('✅ Password reset email sent successfully!');
    }
    
    return { 
      success: true, 
      messageId: info.messageId, 
      previewUrl, 
      passwordChangeUrl: passwordChangeUrl || resetUrl,
      resetUrl: passwordChangeUrl || resetUrl,
      isConsoleMode: isConsoleMode,
      apiMode: info.apiMode || false
    };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
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
 * Generate HTML email template for email verification
 */
const generateEmailVerificationTemplate = (userName, verificationUrl) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  // Fix logo path - use correct filename with capital N and remove trailing slash
  const cleanFrontendUrl = frontendUrl.replace(/\/$/, '');
  // Ensure the logo URL is absolute and publicly accessible
  const logoUrl = `${cleanFrontendUrl}/N2RevConLogo.png`;
  
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
      background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
      margin: 0;
      padding: 40px 20px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-wrapper {
      max-width: 640px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
    }
    .email-header {
      background: linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #991B1B 100%);
      padding: 48px 32px 40px;
      text-align: center;
      position: relative;
    }
    .header-pattern {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 0.1;
      background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0);
      background-size: 24px 24px;
    }
    .logo-container {
      display: inline-block;
      background-color: #ffffff;
      padding: 16px;
      border-radius: 16px;
      margin-bottom: 24px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      position: relative;
      z-index: 1;
    }
    .logo {
      max-width: 160px;
      height: auto;
      display: block;
      border: none;
      outline: none;
    }
    /* Fallback for when image doesn't load */
    .logo-container:has(img[src=""])::before,
    .logo-container img[src=""] {
      content: "n2 RevCon";
      display: block;
      color: #DC2626;
      font-size: 24px;
      font-weight: 700;
      text-align: center;
      padding: 20px;
    }
    .system-name {
      color: #ffffff;
      font-size: 36px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.8px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      position: relative;
      z-index: 1;
    }
    .email-body {
      padding: 56px 48px;
    }
    .greeting {
      font-size: 24px;
      color: #111827;
      margin-bottom: 16px;
      font-weight: 700;
      line-height: 1.3;
    }
    .message {
      font-size: 17px;
      color: #4b5563;
      margin-bottom: 40px;
      line-height: 1.7;
    }
    .button-container {
      text-align: center;
      margin: 48px 0;
    }
    .verify-button {
      display: inline-block;
      padding: 18px 48px;
      background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 17px;
      box-shadow: 0 6px 20px rgba(220, 38, 38, 0.35), 0 2px 8px rgba(220, 38, 38, 0.2);
      transition: all 0.3s ease;
      letter-spacing: 0.3px;
    }
    .verify-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 28px rgba(220, 38, 38, 0.45), 0 4px 12px rgba(220, 38, 38, 0.25);
      background: linear-gradient(135deg, #B91C1C 0%, #991B1B 100%);
    }
    .info-box {
      background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
      border: 2px solid #BAE6FD;
      border-radius: 12px;
      padding: 28px;
      margin: 40px 0;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
    }
    .info-title {
      color: #1E40AF;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .info-title-icon {
      font-size: 22px;
    }
    .info-list {
      color: #1E3A8A;
      font-size: 15px;
      margin: 0;
      padding-left: 0;
      list-style: none;
      line-height: 1.8;
    }
    .info-list li {
      margin-bottom: 12px;
      padding-left: 32px;
      position: relative;
    }
    .info-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #3B82F6;
      font-weight: bold;
      font-size: 18px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #DBEAFE;
      border-radius: 50%;
    }
    .info-list li:last-child {
      margin-bottom: 0;
    }
    .link-section {
      background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
      padding: 24px;
      border-radius: 12px;
      margin: 40px 0;
      border: 1px solid #E5E7EB;
    }
    .link-label {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .link-url {
      font-size: 13px;
      color: #DC2626;
      word-break: break-all;
      text-decoration: none;
      font-family: 'Courier New', monospace;
      background: #ffffff;
      padding: 12px;
      border-radius: 8px;
      display: block;
      border: 1px solid #E5E7EB;
    }
    .link-url:hover {
      color: #B91C1C;
      background: #FEF2F2;
    }
    .expiry-notice {
      font-size: 14px;
      color: #6b7280;
      margin-top: 32px;
      padding-top: 32px;
      border-top: 2px solid #E5E7EB;
      text-align: center;
      font-style: italic;
    }
    .expiry-notice-icon {
      display: inline-block;
      margin-right: 6px;
    }
    .email-footer {
      background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
      padding: 32px 48px;
      text-align: center;
      border-top: 2px solid #E5E7EB;
    }
    .footer-text {
      font-size: 13px;
      color: #6b7280;
      margin: 6px 0;
      line-height: 1.6;
    }
    .footer-brand {
      font-weight: 600;
      color: #DC2626;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 20px 12px;
      }
      .email-body {
        padding: 40px 28px;
      }
      .email-header {
        padding: 36px 24px 32px;
      }
      .system-name {
        font-size: 28px;
      }
      .greeting {
        font-size: 22px;
      }
      .message {
        font-size: 16px;
      }
      .verify-button {
        padding: 16px 36px;
        font-size: 16px;
        width: 100%;
        max-width: 280px;
      }
      .info-box {
        padding: 24px 20px;
      }
      .link-section {
        padding: 20px;
      }
      .email-footer {
        padding: 28px 24px;
      }
    }
  </style>
</head>
  <body>
  <div class="email-wrapper">
    <div class="email-header">
      <div class="header-pattern"></div>
      <div class="logo-container">
        <!--[if mso]>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="160">
          <tr>
            <td style="text-align: center; padding: 16px;">
              <span style="color: #DC2626; font-size: 24px; font-weight: 700;">n2 RevCon</span>
            </td>
          </tr>
        </table>
        <![endif]-->
        <!--[if !mso]><!-->
        <img 
          src="${logoUrl}" 
          alt="n2 RevCon Logo" 
          class="logo"
          width="160"
          height="auto"
          style="display: block; max-width: 160px; height: auto; border: none; outline: none;"
          title="n2 RevCon"
        />
        <!--<![endif]-->
      </div>
      <h1 class="system-name">n2 RevCon</h1>
    </div>
    
    <div class="email-body">
      <p class="greeting">Hello ${userName},</p>
      
      <p class="message">
        Thank you for registering with <strong>n2 RevCon</strong>! To complete your registration and secure your account, please verify your email address by clicking the button below.
      </p>
      
      <div class="button-container">
        <a href="${verificationUrl}" class="verify-button">
          Verify Email Address
        </a>
      </div>
      
      <div class="info-box">
        <div class="info-title">
          <span class="info-title-icon">📋</span>
          <span>What Happens Next?</span>
        </div>
        <ul class="info-list">
          <li>Click the button above to verify your email address</li>
          <li>An administrator will review your account</li>
          <li>You'll receive an approval email when your account is ready</li>
          <li>Then you can log in and start using the system</li>
        </ul>
      </div>
      
      <div class="link-section">
        <div class="link-label">Alternative Method</div>
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 12px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <a href="${verificationUrl}" class="link-url">${verificationUrl}</a>
      </div>
      
      <p class="expiry-notice">
        <span class="expiry-notice-icon">⏰</span>
        This verification link will expire in 24 hours. If you didn't create an account, please ignore this email.
      </p>
    </div>
    
    <div class="email-footer">
      <p class="footer-text">This is an automated message from <span class="footer-brand">n2 RevCon</span> System.</p>
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
  const cleanFrontendUrl = frontendUrl.replace(/\/$/, '');
  const logoUrl = `${cleanFrontendUrl}/N2RevConLogo.png`;
  const loginUrl = `${cleanFrontendUrl}/login`;
  
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
        <!--[if mso]>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="160">
          <tr>
            <td style="text-align: center; padding: 16px; background: white; border-radius: 12px;">
              <span style="color: #DC2626; font-size: 24px; font-weight: 700;">n2 RevCon</span>
            </td>
          </tr>
        </table>
        <![endif]-->
        <!--[if !mso]><!-->
        <img 
          src="${logoUrl}" 
          alt="n2 RevCon Logo" 
          class="logo"
          width="160"
          height="auto"
          style="display: block; max-width: 160px; height: auto; border: none; outline: none;"
          title="n2 RevCon"
        />
        <!--<![endif]-->
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
  const cleanFrontendUrl = frontendUrl.replace(/\/$/, '');
  const logoUrl = `${cleanFrontendUrl}/N2RevConLogo.png`;
  
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
        <!--[if mso]>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="160">
          <tr>
            <td style="text-align: center; padding: 16px; background: white; border-radius: 12px;">
              <span style="color: #DC2626; font-size: 24px; font-weight: 700;">n2 RevCon</span>
            </td>
          </tr>
        </table>
        <![endif]-->
        <!--[if !mso]><!-->
        <img 
          src="${logoUrl}" 
          alt="n2 RevCon Logo" 
          class="logo"
          width="160"
          height="auto"
          style="display: block; max-width: 160px; height: auto; border: none; outline: none;"
          title="n2 RevCon"
        />
        <!--<![endif]-->
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

