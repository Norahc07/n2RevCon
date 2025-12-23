# Brevo (Sendinblue) SMTP Setup Guide

Brevo is a great alternative to Gmail SMTP with better deliverability and a free tier that includes 300 emails per day.

## Step 1: Create Brevo Account

1. Go to https://www.brevo.com/
2. Sign up for a free account
3. Verify your email address

## Step 2: Get SMTP Credentials

1. Log in to your Brevo dashboard
2. Go to **Settings** → **SMTP & API**
3. Click on **SMTP** tab
4. You'll see your SMTP credentials:
   - **SMTP Server**: `smtp-relay.brevo.com` ⚠️ **MUST use this exact hostname**
   - **Port**: `587` (or `465` for SSL)
   - **Login**: Your SMTP login (e.g., `9ea7c1001@smtp-brevo.com`) - **NOT your email**
   - **Password**: Your SMTP password (click "Generate" if you don't have one) - **NOT the API key**

**⚠️ Important:**
- Use `smtp-relay.brevo.com` (NOT `smtp.brevo.com`)
- Use the SMTP Login shown (NOT your email address)
- Generate SMTP password if you don't have one (NOT the API key)

## Step 3: Configure in Render

Add these environment variables in your Render dashboard:

### ✅ Recommended Configuration (Port 2525 - Works Great on Render!)

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=9ea7c1001@smtp-brevo.com
SMTP_PASS=your-generated-smtp-password
EMAIL_FROM=ntworevcon@gmail.com
FRONTEND_URL=https://n2-rev-con.vercel.app/
```

**✅ Port 2525 is tested and confirmed working on Render!**

### Alternative Port Options:

**Option 2: Port 587**
```env
SMTP_PORT=587
SMTP_SECURE=false
```

**Option 3: Port 465**
```env
SMTP_PORT=465
SMTP_SECURE=true
```

### Important Notes:

1. **SMTP Password**: This is NOT your Brevo account password. You need to generate an SMTP password in the Brevo dashboard.

2. **EMAIL_FROM**: Must be a verified sender email in Brevo. To verify:
   - Go to **Settings** → **Senders & IP**
   - Click **Add a sender**
   - Enter your email and verify it

3. **Port Options**:
   - Port `2525` with `SMTP_SECURE=false` (✅ **Recommended for Render** - avoids timeout issues)
   - Port `587` with `SMTP_SECURE=false` (alternative)
   - Port `465` with `SMTP_SECURE=true` (alternative)

## Step 4: Test Email Sending

After configuring, restart your backend and test:

1. Register a new user
2. Check backend logs for: `✅ SMTP Server is ready to send emails`
3. Check your email inbox (and spam folder)

## Brevo Free Tier Limits

- **300 emails per day**
- **Unlimited contacts**
- **Email support**

## Troubleshooting

### "Authentication failed"
- Make sure you're using the SMTP password, not your account password
- Generate a new SMTP password in Brevo dashboard

### "Sender not verified"
- Verify your sender email in Brevo dashboard
- Make sure `EMAIL_FROM` matches a verified sender

### "Connection timeout" (ETIMEDOUT)
This is a common issue with Render. Try these solutions:

**Solution 1: Use Port 2525 (✅ Recommended - Tested and Working!)**
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=9ea7c1001@smtp-brevo.com
SMTP_PASS=your-generated-smtp-password
```
✅ **This configuration works great on Render and avoids timeout issues!**

**Solution 2: Use Port 465 with SSL**
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-brevo-email@example.com
SMTP_PASS=your-brevo-smtp-password
```

**Solution 3: Try Port 587**
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-brevo-email@example.com
SMTP_PASS=your-brevo-smtp-password
```

**Solution 3: Use Brevo API Instead of SMTP**
If SMTP continues to fail, consider using Brevo's API (requires code changes):
- More reliable than SMTP
- Better for production
- No port blocking issues

**Solution 4: Check Render Network Settings**
- Render may block outbound SMTP on port 587
- Port 465 (SSL) usually works better
- Contact Render support if ports are blocked

## Advantages of Brevo over Gmail

✅ Better deliverability  
✅ No "Less secure app" issues  
✅ Free tier with 300 emails/day  
✅ Better for production use  
✅ Email analytics and tracking  
✅ No need for app passwords  

