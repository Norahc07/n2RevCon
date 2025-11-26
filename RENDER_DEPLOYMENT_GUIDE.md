# Render Deployment Guide for n2RevCon

## 🔴 Current Issue: MongoDB Atlas IP Whitelist

The deployment is failing because Render's IP addresses are not whitelisted in MongoDB Atlas.

## ✅ Solution Steps

### Step 1: Whitelist Render IPs in MongoDB Atlas

1. **Go to MongoDB Atlas Dashboard:**
   - Visit: https://cloud.mongodb.com/
   - Log in to your account
   - Select your cluster: `n2RevCon`

2. **Navigate to Network Access:**
   - Click on **"Network Access"** in the left sidebar
   - Click **"Add IP Address"** button

3. **Add Render IP Addresses:**
   - Option 1 (Recommended for Production): Add `0.0.0.0/0` to allow all IPs
     - Click "Add IP Address"
     - Select "Allow Access from Anywhere"
     - Click "Confirm"
     - ⚠️ **Note:** This is less secure but works for all cloud providers
   
   - Option 2 (More Secure): Add specific Render IP ranges
     - Render uses dynamic IPs, so you may need to check Render's documentation
     - For now, use `0.0.0.0/0` and restrict later if needed

4. **Wait for Changes:**
   - MongoDB Atlas may take 1-2 minutes to apply changes
   - The status should show "Active"

### Step 2: Configure Environment Variables in Render

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com/
   - Select your service

2. **Navigate to Environment:**
   - Click on **"Environment"** in the left sidebar
   - Add/Update these environment variables:

#### Required Environment Variables:

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://n2RevCon_db_user:n2RevCon@n2revcon.zfuuthy.mongodb.net/?appName=n2RevCon

# Server Configuration
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://your-frontend-url.onrender.com

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ntworevcon@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=administrator@n2RevCon.com
```

#### Important Notes:

- **PORT**: Render automatically sets `PORT` environment variable. Your code should use `process.env.PORT || 5000`
- **CORS_ORIGIN**: Set this to your frontend URL on Render (if deploying frontend separately)
- **JWT_SECRET**: Generate a strong random string for production
- **SMTP_PASS**: Use Gmail App Password, not your regular Gmail password

### Step 3: Verify Server Configuration

Make sure your `server.js` uses the PORT from environment:

```javascript
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### Step 4: Update CORS Configuration

In `backend/server.js`, make sure CORS allows your Render frontend URL:

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CORS_ORIGIN,
  'https://your-frontend.onrender.com' // Add your Render frontend URL
].filter(Boolean);
```

## 🚀 Deployment Checklist

- [ ] MongoDB Atlas IP whitelist configured (0.0.0.0/0 or specific IPs)
- [ ] All environment variables set in Render
- [ ] MONGODB_URI is correct and includes password
- [ ] PORT is set (Render sets this automatically)
- [ ] CORS_ORIGIN points to your frontend URL
- [ ] JWT_SECRET is set and secure
- [ ] SMTP credentials are correct
- [ ] Server listens on 0.0.0.0 (not just localhost)

## 🔍 Troubleshooting

### Issue: "Could not connect to any servers"
- **Solution**: Whitelist `0.0.0.0/0` in MongoDB Atlas Network Access

### Issue: "No open ports detected"
- **Solution**: Make sure server listens on `0.0.0.0` and uses `process.env.PORT`

### Issue: CORS errors
- **Solution**: Add your frontend URL to `CORS_ORIGIN` environment variable

### Issue: Authentication errors
- **Solution**: Verify JWT_SECRET is set in environment variables

## 📝 Quick Fix Commands

After whitelisting IPs in MongoDB Atlas, Render should automatically redeploy. If not:

1. Go to Render Dashboard
2. Click "Manual Deploy" → "Deploy latest commit"
3. Monitor the logs for connection success

## 🔐 Security Recommendations

1. **MongoDB Atlas:**
   - Use specific IP ranges instead of 0.0.0.0/0 if possible
   - Enable MongoDB Atlas authentication
   - Use strong database passwords

2. **Environment Variables:**
   - Never commit `.env` files to Git
   - Use Render's secure environment variable storage
   - Rotate secrets regularly

3. **CORS:**
   - Only allow specific frontend URLs
   - Don't use wildcards in production

## 📞 Support

If issues persist:
1. Check Render deployment logs
2. Check MongoDB Atlas connection logs
3. Verify all environment variables are set correctly
4. Ensure MongoDB Atlas cluster is running

