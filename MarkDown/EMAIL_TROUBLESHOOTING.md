# Email Troubleshooting Guide

## Why Password Change Email is Not Working

The password change email feature requires SMTP (email server) configuration. If emails are not being sent, check the following:

### 1. Check Your .env File

Make sure your `backend/.env` file has SMTP configuration:

```env
# Email Configuration
EMAIL_FROM=administrator@n2RevCon.com

# SMTP Configuration (REQUIRED for sending real emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2. Current Status

**If SMTP is NOT configured:**
- Emails are logged to console only (not actually sent)
- Check backend console for email details
- You'll see a warning: "⚠️ WARNING: No SMTP configuration found"

**If SMTP IS configured:**
- Emails should be sent to the user's registered email
- Check backend console for success/error messages

### 3. How to Configure SMTP

#### Option A: Gmail (Easiest)

1. Go to: https://myaccount.google.com/apppasswords
2. Generate an App Password for "Mail"
3. Update `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
EMAIL_FROM=administrator@n2RevCon.com
```

#### Option B: Mailtrap (For Testing)

1. Sign up at: https://mailtrap.io/
2. Get SMTP credentials from your inbox
3. Update `.env`:
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
EMAIL_FROM=administrator@n2RevCon.com
```

### 4. Testing Email Configuration

After updating `.env`:

1. **Restart the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Request a password change** in the application

3. **Check backend console** for:
   - ✅ "Using SMTP configuration: smtp.gmail.com" (if configured)
   - ✅ "Password change email sent successfully to: user@email.com"
   - ❌ Error messages if something is wrong

4. **Check your email inbox** (or Mailtrap inbox if using Mailtrap)

### 5. Common Issues

#### Issue: "Authentication failed"
- **Solution:** Make sure you're using an App Password (not your regular password) for Gmail
- **Solution:** Check SMTP_USER and SMTP_PASS are correct

#### Issue: "Connection timeout"
- **Solution:** Check if port 587 is blocked by firewall
- **Solution:** Try port 465 with `SMTP_SECURE=true`

#### Issue: "Email not received"
- **Solution:** Check spam/junk folder
- **Solution:** Verify the email address is correct
- **Solution:** Check backend console for error messages

#### Issue: "No SMTP configuration found"
- **Solution:** Add SMTP settings to `.env` file
- **Solution:** Restart backend server after updating `.env`

### 6. Development Mode (No SMTP)

If you don't configure SMTP, the system will:
- Log email details to console
- Show the password change URL in the response
- NOT actually send emails

**To test without SMTP:**
1. Request password change
2. Check backend console for the password change URL
3. Copy the URL and use it directly

### 7. Verify Configuration

Check if SMTP is working:

1. Look at backend console when requesting password change
2. You should see:
   - `📧 Using SMTP configuration: smtp.gmail.com` (if configured)
   - `✅ Password change email sent successfully to: user@email.com`

3. If you see warnings or errors, check:
   - `.env` file has correct SMTP settings
   - Backend server was restarted after updating `.env`
   - SMTP credentials are valid

### 8. Quick Test

Run this in your backend console to test email:

```javascript
// This will show what email configuration is being used
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not set');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
```

### Need Help?

1. Check backend console for error messages
2. Verify `.env` file has all required SMTP settings
3. Test SMTP credentials using an email testing tool
4. See `SMTP_SETUP_GUIDE.md` for detailed setup instructions

