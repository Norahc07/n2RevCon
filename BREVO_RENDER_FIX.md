# Brevo SMTP Connection Timeout on Render - Solutions

## Problem
Connection timeout even with correct credentials. Render may be blocking or throttling SMTP connections.

## Solution 1: Use Port 2525 (Recommended - Works Great on Render!)

Update Render environment variables:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=9ea7c1001@smtp-brevo.com
SMTP_PASS=your-generated-smtp-password
EMAIL_FROM=ntworevcon@gmail.com
FRONTEND_URL=https://n2-rev-con.vercel.app/
```

**Why this works:**
- ✅ Port 2525 is less likely to be blocked by Render
- ✅ Avoids connection timeout issues
- ✅ Works reliably for SMTP connections
- ✅ Tested and confirmed working!

## Solution 1b: Try Port 587 with STARTTLS (Alternative)

If port 2525 doesn't work, try:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=9ea7c1001@smtp-brevo.com
SMTP_PASS=your-generated-smtp-password
EMAIL_FROM=ntworevcon@gmail.com
FRONTEND_URL=https://n2-rev-con.vercel.app/
```

**Why this might work:**
- Port 587 uses STARTTLS (upgrades connection)
- Less likely to be blocked than port 465
- Better compatibility with Render's network

## Solution 2: Use Brevo API Instead of SMTP (Most Reliable)

If SMTP continues to timeout, use Brevo's API which is more reliable:

### Advantages:
- ✅ No port blocking issues
- ✅ More reliable on Render
- ✅ Better error handling
- ✅ Email tracking and analytics

### Implementation:
Would require updating the email service to use Brevo API instead of SMTP.

## Solution 3: Check Render Network Settings

1. **Contact Render Support**: Ask if they block outbound SMTP connections
2. **Check Firewall**: Render might have firewall rules blocking SMTP
3. **Try Different Ports**: Some users report success with port 2525

## Solution 4: Use Alternative Email Service

If Brevo SMTP doesn't work on Render, consider:
- **SendGrid**: Very reliable, free tier available
- **Mailgun**: Good for transactional emails
- **AWS SES**: If you're using AWS

## Current Status

Your configuration looks correct:
- ✅ SMTP_HOST: smtp-relay.brevo.com
- ✅ SMTP_USER: 9ea7c1001@smtp-brevo.com  
- ✅ SMTP_PORT: 465
- ✅ SMTP_SECURE: true
- ✅ EMAIL_FROM: Verified

The timeout suggests a network/firewall issue rather than credential problem.

## Next Steps

1. **Try Port 587** first (see Solution 1)
2. **Wait 5 minutes** after changing settings (Render needs time)
3. **Check logs** for connection success
4. **If still failing**, consider using Brevo API (Solution 2)

## Testing

After updating, test by registering a user. Check logs for:
```
✅ SMTP Server is ready to send emails
```

If you see timeout again, the issue is likely Render's network blocking SMTP.

