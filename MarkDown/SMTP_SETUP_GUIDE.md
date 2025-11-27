# SMTP Setup Guide - How to Get SMTP User and Password

## Overview
To send emails from your application, you need SMTP (Simple Mail Transfer Protocol) credentials. Here are the most common options:

---

## Option 1: Gmail (Easiest for Development)

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled

### Step 2: Generate App Password
1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter "N2 RevCon" as the name
5. Click **Generate**
6. **Copy the 16-character password** (you'll see it only once!)

### Step 3: Configure in `.env`
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # The 16-character app password (remove spaces)
```

**Note:** Use your Gmail address as `SMTP_USER` and the generated app password as `SMTP_PASS`

---

## Option 2: Outlook/Hotmail

### Step 1: Enable App Password
1. Go to [Microsoft Account Security](https://account.microsoft.com/security)
2. Enable **Two-step verification**
3. Go to **Security** → **Advanced security options**
4. Click **Create a new app password**
5. Name it "N2 RevCon" and generate
6. Copy the password

### Step 2: Configure in `.env`
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-app-password
```

---

## Option 3: Yahoo Mail

### Step 1: Generate App Password
1. Go to [Yahoo Account Security](https://login.yahoo.com/account/security)
2. Enable **Two-step verification**
3. Go to **Generate app password**
4. Select "Mail" and generate
5. Copy the password

### Step 2: Configure in `.env`
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

---

## Option 4: Professional Email Service (Recommended for Production)

### SendGrid (Free Tier: 100 emails/day)

1. **Sign up** at [SendGrid](https://sendgrid.com/)
2. **Verify your account** via email
3. **Create API Key:**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name it "N2 RevCon"
   - Select "Full Access" or "Mail Send" permissions
   - Copy the API key (shown only once!)

4. **Configure in `.env`:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Note:** `SMTP_USER` is always `apikey` for SendGrid, and `SMTP_PASS` is your API key.

---

### Mailgun (Free Tier: 5,000 emails/month)

1. **Sign up** at [Mailgun](https://www.mailgun.com/)
2. **Verify your account**
3. **Get SMTP credentials:**
   - Go to Sending → Domain Settings
   - Find "SMTP credentials" section
   - Copy username and password

4. **Configure in `.env`:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

---

## Option 5: Development/Testing (No Real Emails)

### Ethereal Email (Free Testing Service)

1. **Go to** [Ethereal Email](https://ethereal.email/)
2. **Click "Create Account"**
3. **Copy the credentials** shown:
   - Username
   - Password
   - SMTP host: `smtp.ethereal.email`
   - Port: `587`

4. **Configure in `.env`:**
```env
ETHEREAL_USER=your-ethereal-username
ETHEREAL_PASS=your-ethereal-password
```

**Note:** Emails sent via Ethereal are not actually delivered - they're stored for testing. You'll get a preview URL in the console.

---

### Mailtrap (Free Testing Service)

1. **Sign up** at [Mailtrap](https://mailtrap.io/)
2. **Go to Inboxes** → **My Inbox**
3. **Select "SMTP Settings"**
4. **Copy credentials:**
   - Host: `sandbox.smtp.mailtrap.io`
   - Port: `2525` or `587`
   - Username and Password

5. **Configure in `.env`:**
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
```

**Note:** Mailtrap also doesn't send real emails - perfect for testing!

---

## Quick Setup for Gmail (Recommended for Quick Start)

### Complete Steps:

1. **Go to:** https://myaccount.google.com/apppasswords
2. **Sign in** with your Gmail account
3. **Select:**
   - App: **Mail**
   - Device: **Other (Custom name)**
   - Name: **N2 RevCon**
4. **Click Generate**
5. **Copy the 16-character password** (format: `abcd efgh ijkl mnop`)
6. **Update your `backend/.env` file:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop  # Remove spaces from the generated password
EMAIL_FROM=administrator@n2RevCon.com
```

7. **Restart your backend server:**
```bash
cd backend
npm run dev
```

---

## Testing Your SMTP Configuration

After setting up SMTP, test it by:

1. **Request a password change** in your application
2. **Check the backend console** for email sending status
3. **Check your email inbox** (or Mailtrap/Ethereal inbox for testing services)

---

## Troubleshooting

### Gmail Issues:
- **"Less secure app access" error:** Use App Password instead (see Option 1)
- **"Authentication failed":** Make sure you're using App Password, not your regular password
- **"Connection timeout":** Check firewall settings, try port 465 with `SMTP_SECURE=true`

### General Issues:
- **Connection refused:** Check if port 587 or 465 is blocked by firewall
- **Authentication failed:** Verify username and password are correct
- **Emails not sending:** Check backend console for error messages

---

## Security Best Practices

1. **Never commit `.env` file** to Git
2. **Use App Passwords** instead of your main account password
3. **Rotate passwords** regularly
4. **Use environment-specific credentials** (different for dev/prod)
5. **For production:** Use professional email services (SendGrid, Mailgun)

---

## Recommended Setup by Environment

### Development:
- **Gmail with App Password** (easiest)
- **Mailtrap** (best for testing)
- **Ethereal Email** (quick testing)

### Production:
- **SendGrid** (free tier: 100/day)
- **Mailgun** (free tier: 5,000/month)
- **AWS SES** (very cheap, requires AWS account)

---

## Need Help?

If you're having trouble:
1. Check the backend console for error messages
2. Verify all SMTP settings in `.env` are correct
3. Test SMTP connection using online tools like [Mail Tester](https://www.mail-tester.com/)
4. Check your email provider's documentation for SMTP settings

