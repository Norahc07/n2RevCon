# Brevo API Setup Guide - Solution for Render SMTP Blocking

## Problem
Render is blocking SMTP connections (ports 465/587), causing connection timeouts. **Brevo API uses HTTPS (port 443)** which is never blocked.

## Solution: Use Brevo API Instead of SMTP

### Step 1: Get Your Brevo API Key

1. Log in to your Brevo dashboard
2. Go to **Settings** → **SMTP & API**
3. Click on **API keys** tab
4. Click **Generate a new API key**
5. Give it a name (e.g., "n2RevCon Production")
6. Copy the API key (starts with `xsmtpsib-...`)

**⚠️ Important:** This is different from SMTP password. The API key is what you need.

### Step 2: Update Render Environment Variables

Add this to your Render environment variables:

```env
BREVO_API_KEY=your-brevo-api-key-here
EMAIL_FROM=ntworevcon@gmail.com
FRONTEND_URL=https://n2-rev-con.vercel.app/
```

**You can REMOVE these SMTP variables** (they're not needed with API):
- ~~SMTP_HOST~~
- ~~SMTP_PORT~~
- ~~SMTP_SECURE~~
- ~~SMTP_USER~~
- ~~SMTP_PASS~~

### Step 3: Verify Sender Email

Make sure `EMAIL_FROM` is verified in Brevo:
1. Go to **Settings** → **Senders & IP**
2. Verify `ntworevcon@gmail.com` is listed and verified

### Step 4: Restart Render Service

After adding `BREVO_API_KEY`, restart your Render service.

### Step 5: Check Logs

You should see:
```
📧 Using Brevo API (more reliable than SMTP on Render)
   ✅ Uses HTTPS - no port blocking issues
✅ Brevo API connection verified successfully
```

Instead of:
```
❌ SMTP Connection Error: Connection timeout
```

## Advantages of Brevo API

✅ **No port blocking** - Uses HTTPS (port 443)  
✅ **More reliable** - Better for production  
✅ **Faster** - No SMTP handshake delays  
✅ **Better error handling** - Clear API error messages  
✅ **Email tracking** - Built-in analytics  
✅ **Works on Render** - No network restrictions  

## Testing

1. Register a new user
2. Check Render logs - should see "✅ Email verification sent via Brevo API!"
3. Check your email inbox (and spam folder)
4. Email should arrive within seconds

## Troubleshooting

### "Invalid API key"
- Make sure you copied the full API key
- Check for extra spaces in Render environment variable
- Regenerate API key if needed

### "Sender not verified"
- Verify sender email in Brevo dashboard
- Make sure `EMAIL_FROM` matches verified sender

### Still not working?
- Check Render logs for specific error messages
- Verify API key is correct
- Make sure sender email is verified in Brevo

## Next Steps

1. Copy your API key from Brevo dashboard
2. Add it to Render as `BREVO_API_KEY` environment variable
3. Remove SMTP variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
4. Restart your Render service
5. Check logs to verify API connection

