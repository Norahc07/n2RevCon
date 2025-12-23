# Email Setup Guide - Why Emails Aren't Being Sent

## Problem
If you're not receiving emails, it's likely because **SMTP is not configured**. The email service falls back to "console mode" which only logs emails to the backend console - it doesn't actually send them.

## How to Check

### 1. Check Backend Console
When you register a user, look at your backend console. You should see one of these messages:

**If SMTP is NOT configured:**
```
⚠️  WARNING: No SMTP configuration found. Emails will be logged to console only.
📧 ===== EMAIL WOULD BE SENT (CONSOLE MODE) =====
🔗 EMAIL VERIFICATION URL (Copy this to test):
```

**If SMTP IS configured:**
```
📧 Using SMTP configuration: smtp.gmail.com
   SMTP User: your-email@gmail.com
```

### 2. Check Environment Variables
Make sure your `.env` file has these variables:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=http://localhost:5173
```

## Solution: Configure SMTP

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App Passwords
   - Generate a password for "Mail"
   - Copy the 16-character password

3. **Add to `.env` file**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
EMAIL_FROM=your-email@gmail.com
FRONTEND_URL=http://localhost:5173
```

4. **Restart your backend server**

### Option 2: SendGrid (Recommended for Production)

1. Sign up at https://sendgrid.com
2. Create an API key
3. Add to `.env`:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=https://your-frontend-url.com
```

### Option 3: Mailgun

1. Sign up at https://mailgun.com
2. Get SMTP credentials from dashboard
3. Add to `.env`:
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
EMAIL_FROM=noreply@yourdomain.com
```

## Testing

### In Development (Console Mode)
If SMTP is not configured, you can still test by:
1. Register a user
2. Check backend console for verification URL
3. Copy the URL and paste it in your browser
4. This will verify the email without actually sending it

### With SMTP Configured
1. Register a user
2. Check your email inbox (and spam folder)
3. Click the verification link
4. Wait for admin approval

## Troubleshooting

### Emails Still Not Sending?

1. **Check backend console for errors**
   - Look for error messages when registering
   - Check if SMTP connection is successful

2. **Verify SMTP credentials**
   - Test with a simple email client first
   - Make sure app password is correct (for Gmail)

3. **Check firewall/network**
   - Some networks block SMTP ports
   - Try port 465 with `SMTP_SECURE=true`

4. **Check spam folder**
   - Emails might be going to spam
   - Add sender to contacts

5. **Verify FRONTEND_URL**
   - Make sure it matches your frontend URL
   - Verification links won't work if URL is wrong

## Quick Test

After configuring SMTP, restart your backend and register a test user. You should see:
```
📧 Using SMTP configuration: smtp.gmail.com
✅ Email verification sent to: test@example.com
```

Instead of:
```
⚠️  EMAIL SERVICE IS IN CONSOLE MODE
```

## Need Help?

If emails still aren't sending:
1. Check backend console logs
2. Verify `.env` file is loaded (restart server)
3. Test SMTP credentials with a simple email client
4. Check email service provider status

