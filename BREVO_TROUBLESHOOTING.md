# Brevo Connection Timeout Troubleshooting

## Problem: ETIMEDOUT Error

If you're seeing `Connection timeout` errors, Render may be blocking SMTP connections. Here are solutions:

## Solution 1: Use Port 465 with SSL (Most Reliable)

Update your Render environment variables:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-brevo-email@example.com
SMTP_PASS=your-brevo-smtp-password
EMAIL_FROM=your-verified-sender-email@example.com
```

**Why this works:**
- Port 465 uses SSL/TLS encryption
- Less likely to be blocked by firewalls
- More reliable connection

## Solution 2: Try Alternative Brevo SMTP Server

Sometimes the relay server has issues. Try:

```env
SMTP_HOST=smtp.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
```

Or:

```env
SMTP_HOST=smtp.brevo.com
SMTP_PORT=465
SMTP_SECURE=true
```

## Solution 3: Verify Brevo SMTP Settings

1. Log in to Brevo dashboard
2. Go to **Settings** → **SMTP & API**
3. Check the **SMTP** tab
4. Make sure you're using:
   - Correct SMTP server (should be `smtp-relay.brevo.com` or `smtp.brevo.com`)
   - Correct port (587 or 465)
   - SMTP password (not account password)

## Solution 4: Check Render Logs

After updating settings, check Render logs for:

**Success:**
```
✅ SMTP Server is ready to send emails
   📬 Brevo SMTP connection verified successfully
```

**Still failing:**
- Check error code and message
- Try different port/secure combination
- Contact Brevo support if credentials are correct

## Solution 5: Test Connection Locally First

Before deploying to Render, test locally:

1. Add SMTP settings to your local `.env`
2. Run backend locally
3. Check if connection works
4. If it works locally but not on Render, it's a Render network issue

## Solution 6: Use Brevo API Instead (Advanced)

If SMTP continues to fail, consider using Brevo's API:
- More reliable
- No port blocking issues
- Requires code changes

## Quick Fix Checklist

- [ ] Try port 465 with `SMTP_SECURE=true`
- [ ] Verify SMTP password is correct (not account password)
- [ ] Verify sender email in Brevo dashboard
- [ ] Check Render logs for detailed error
- [ ] Try alternative SMTP host (`smtp.brevo.com`)
- [ ] Restart Render service after changes

## Still Not Working?

1. **Check Brevo Status**: https://status.brevo.com/
2. **Contact Brevo Support**: They can verify your SMTP settings
3. **Contact Render Support**: Ask about SMTP port restrictions
4. **Consider Alternative**: SendGrid, Mailgun, or AWS SES

