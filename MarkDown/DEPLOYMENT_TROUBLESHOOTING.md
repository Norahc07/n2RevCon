# Deployment Troubleshooting Guide

## 🔴 Common Issues and Solutions

### Issue 1: ERR_TIMED_OUT

**Symptoms:**
- Frontend can't connect to backend
- Requests timeout after 30+ seconds
- "Registration failed" or "Network error"

**Causes & Solutions:**

#### 1. Render Free Tier Sleeping
- **Problem:** Render free tier services sleep after 15 minutes of inactivity
- **Solution:** 
  - First request takes ~30 seconds to wake up the service
  - This is normal for free tier
  - Consider upgrading to paid tier for always-on service
  - Or use a service like UptimeRobot to ping your service every 5 minutes

#### 2. MongoDB Connection Timeout
- **Problem:** MongoDB Atlas not whitelisting Render IPs
- **Solution:**
  1. Go to MongoDB Atlas → Network Access
  2. Add IP Address: `0.0.0.0/0` (Allow from anywhere)
  3. Wait 1-2 minutes for changes to apply
  4. Check Render logs for MongoDB connection status

#### 3. CORS Issues
- **Problem:** Frontend blocked by CORS
- **Solution:**
  - ✅ Already fixed in latest code
  - CORS now allows all `*.vercel.app` and `*.onrender.com` domains
  - Set `CORS_ORIGIN` in Render environment variables if needed

### Issue 2: PWA Icon 404

**Symptoms:**
- Browser console shows: `icon-192x192.png 404`
- Manifest warning about missing icon

**Solution:**
- ✅ Already fixed in code (uses `n2RevConLogo.png`)
- **Action Required:** Redeploy frontend on Vercel
  - The changes are committed but Vercel needs to rebuild
  - Go to Vercel → Deployments → Redeploy

### Issue 3: Register Route 404

**Symptoms:**
- `n2revcon.onrender.com/auth/register` returns 404
- Should be `/api/auth/register`

**Solution:**
- **Set Environment Variable in Vercel:**
  ```
  VITE_API_URL=https://n2revcon.onrender.com/api
  ```
- This tells the frontend to use the correct API base URL
- Redeploy frontend after setting the variable

## ✅ Deployment Checklist

### Backend (Render)

- [ ] MongoDB Atlas IP whitelist: `0.0.0.0/0`
- [ ] Environment variables set:
  - [ ] `MONGODB_URI`
  - [ ] `NODE_ENV=production`
  - [ ] `CORS_ORIGIN=https://n2-rev-con.vercel.app`
  - [ ] `JWT_SECRET`
  - [ ] `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
- [ ] Service is running (check Render dashboard)
- [ ] Health check works: `https://n2revcon.onrender.com/api/health`

### Frontend (Vercel)

- [ ] Environment variable set: `VITE_API_URL=https://n2revcon.onrender.com/api`
- [ ] Frontend rebuilt with latest code
- [ ] PWA icons fixed (manifest.json updated)
- [ ] Test registration/login

## 🔍 Debugging Steps

### 1. Check Backend Health
```bash
curl https://n2revcon.onrender.com/api/health
```

Should return:
```json
{
  "status": "OK",
  "message": "N2 RevCon API is running",
  "timestamp": "...",
  "environment": "production"
}
```

### 2. Check Backend Logs
- Go to Render Dashboard → Your Service → Logs
- Look for:
  - MongoDB connection status
  - CORS errors
  - Request logs

### 3. Test API Endpoint
```bash
curl -X POST https://n2revcon.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"test123"}'
```

### 4. Check Frontend Network Tab
- Open browser DevTools → Network tab
- Try to register
- Check:
  - Request URL (should be `/api/auth/register`)
  - Response status
  - CORS headers

## 🚀 Quick Fixes

### If Backend is Sleeping:
1. Wait 30 seconds after first request
2. Or ping the health endpoint to wake it up
3. Consider upgrading Render plan

### If CORS Error:
1. Check Render logs for CORS messages
2. Verify `CORS_ORIGIN` environment variable
3. Latest code should auto-allow Vercel domains

### If MongoDB Connection Fails:
1. Verify IP whitelist in MongoDB Atlas
2. Check `MONGODB_URI` in Render environment
3. Check Render logs for connection errors

## 📞 Still Having Issues?

1. Check Render service status
2. Check MongoDB Atlas cluster status
3. Review Render deployment logs
4. Review browser console for errors
5. Verify all environment variables are set correctly

