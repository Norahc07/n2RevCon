# Quick Fix for Brevo SMTP Connection

## Current Error
```
getaddrinfo ENOTFOUND smtp.brevo.com
```

## Problem
You're using the wrong SMTP hostname. Based on your Brevo dashboard, use `smtp-relay.brevo.com`.

## Solution: Update Render Environment Variables

Update these in your Render dashboard:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=9ea7c1001@smtp-brevo.com
SMTP_PASS=your-generated-smtp-password
EMAIL_FROM=ntworevcon@gmail.com
FRONTEND_URL=https://n2-rev-con.vercel.app/
```

## Important Notes:

1. **SMTP_HOST**: Must be `smtp-relay.brevo.com` (from your dashboard)
2. **SMTP_USER**: Use `9ea7c1001@smtp-brevo.com` (the login shown in your dashboard)
3. **SMTP_PASS**: You need to generate an SMTP password:
   - Go to Brevo dashboard → Settings → SMTP & API → SMTP tab
   - Click "Generate" next to Password
   - Copy the generated password
   - **DO NOT use the API key** - that's different!

## Steps:

1. **Get SMTP Password**:
   - In Brevo dashboard, go to Settings → SMTP & API → SMTP tab
   - Click "Generate" button next to Password field
   - Copy the generated password

2. **Update Render Environment Variables**:
   - Use the exact values shown above
   - Replace `your-generated-smtp-password` with the password you just generated

3. **Restart Render Service**

4. **Check Logs** - You should see:
   ```
   ✅ SMTP Server is ready to send emails
   📬 Brevo SMTP connection verified successfully
   ```

## If Port 587 Still Doesn't Work

Try port 465 with SSL:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=9ea7c1001@smtp-brevo.com
SMTP_PASS=your-generated-smtp-password
EMAIL_FROM=ntworevcon@gmail.com
```

