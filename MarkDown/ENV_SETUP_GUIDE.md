# Environment Variables Setup Guide

## Backend `.env` File

Create a file named `.env` in the `backend/` folder with the following content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://n2RevCon_db_user:n2RevCon@n2revcon.zfuuthy.mongodb.net/?appName=n2RevCon

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Frontend URL (for email links and redirects)
FRONTEND_URL=http://localhost:5173

# Email Configuration
# Sender email address (Line 23-24 area)
EMAIL_FROM=administrator@n2RevCon.com

# SMTP Configuration (for production - Gmail, SendGrid, etc.)
# Uncomment and fill these if you want to send real emails
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password

# Ethereal Email (for development/testing)
# Optional: Create account at https://ethereal.email
# ETHEREAL_USER=your-ethereal-user@ethereal.email
# ETHEREAL_PASS=your-ethereal-password
```

## Frontend `.env` File

Create a file named `.env` in the `frontend/` folder with the following content:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000/api
```

## How to Create `.env` Files

### Option 1: Using Command Line (PowerShell)

**Backend:**
```powershell
cd backend
@"
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://n2RevCon_db_user:n2RevCon@n2revcon.zfuuthy.mongodb.net/?appName=n2RevCon
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
EMAIL_FROM=administrator@n2RevCon.com
"@ | Out-File -FilePath .env -Encoding utf8
```

**Frontend:**
```powershell
cd frontend
"VITE_API_URL=http://localhost:5000/api" | Out-File -FilePath .env -Encoding utf8
```

### Option 2: Using Text Editor

1. Navigate to `backend/` folder
2. Create a new file named `.env` (no extension)
3. Copy and paste the backend `.env` content above
4. Save the file

5. Navigate to `frontend/` folder
6. Create a new file named `.env` (no extension)
7. Copy and paste the frontend `.env` content above
8. Save the file

### Option 3: Using VS Code

1. Open the project in VS Code
2. In `backend/` folder, create new file: `.env`
3. Paste the backend content
4. In `frontend/` folder, create new file: `.env`
5. Paste the frontend content

## Important Notes

- **Never commit `.env` files to Git** - They contain sensitive information
- **Change `JWT_SECRET`** - Use a strong, random string in production
- **Email Configuration** - Lines 23-24 area refers to `EMAIL_FROM` which should be `administrator@n2RevCon.com`
- **SMTP Settings** - Only needed if you want to send real emails (not required for development)

## Verification

After creating the `.env` files:

1. **Backend**: Restart the server (`npm run dev` in backend folder)
2. **Frontend**: Restart the dev server (`npm run dev` in frontend folder)

The servers should now connect properly!

