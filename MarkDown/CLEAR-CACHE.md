# Clear Cache Instructions

If you're seeing an old project running on localhost:5173, follow these steps:

## Quick Fix

### Option 1: Kill the Process and Restart
```bash
# Windows PowerShell
netstat -ano | findstr :5173
# Note the PID, then:
taskkill /F /PID <PID_NUMBER>

# Then restart
cd frontend
npm run dev
```

### Option 2: Use Clean Dev Script
```bash
cd frontend
npm run dev:clean
```

### Option 3: Manual Cache Clear
```bash
cd frontend
npm run clean
npm run dev
```

## Clear Browser Cache

After clearing the server cache, also clear your browser cache:

### Chrome/Edge:
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Or use `Ctrl + F5` for hard refresh

### Firefox:
1. Press `Ctrl + Shift + Delete`
2. Select "Cache"
3. Click "Clear Now"
4. Or use `Ctrl + F5` for hard refresh

## Clear Service Worker Cache (PWA)

If you have the PWA installed:
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Service Workers"
4. Click "Unregister"
5. Click "Clear storage" → "Clear site data"

## Alternative: Use Different Port

If port 5173 keeps having issues, you can change it in `frontend/vite.config.js`:

```js
server: {
  port: 3000, // or any other port
  // ...
}
```

Then update `frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

And update `backend/.env`:
```
CORS_ORIGIN=http://localhost:3000
```

