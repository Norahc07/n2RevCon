# MongoDB Atlas Database Setup Guide

This guide will help you connect the Login and Sign Up pages to MongoDB Atlas.

## Prerequisites

1. MongoDB Atlas account (free tier available)
2. Node.js installed
3. Backend and Frontend dependencies installed

## Step 1: MongoDB Atlas Setup

### 1.1 Create/Verify MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign in or create an account
3. Create a new cluster (or use existing)
4. Wait for cluster to finish provisioning

### 1.2 Configure Database Access

1. Go to **Database Access** in the left sidebar
2. Click **Add New Database User**
3. Set authentication method to **Password**
4. Create username: `n2RevCon_db_user`
5. Create password: `n2RevCon` (or your preferred password)
6. Set user privileges to **Read and write to any database**
7. Click **Add User**

### 1.3 Configure Network Access

1. Go to **Network Access** in the left sidebar
2. Click **Add IP Address**
3. For development, click **Allow Access from Anywhere** (0.0.0.0/0)
   - ⚠️ **Note**: For production, restrict to specific IPs
4. Click **Confirm**

### 1.4 Get Connection String

1. Go to **Database** in the left sidebar
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with your database name (optional, defaults to 'test')

**Example Connection String:**
```
mongodb+srv://n2RevCon_db_user:n2RevCon@n2revcon.zfuuthy.mongodb.net/?appName=n2RevCon
```

## Step 2: Backend Environment Setup

### 2.1 Create Backend .env File

Navigate to the `backend` folder and create a `.env` file:

```bash
cd backend
```

Create `.env` file with the following content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://n2RevCon_db_user:n2RevCon@n2revcon.zfuuthy.mongodb.net/?appName=n2RevCon

# JWT Secret (Change this to a random string in production!)
JWT_SECRET=your_super_secret_jwt_key_change_in_production_min_32_chars
JWT_EXPIRE=7d

# CORS Origin (Frontend URL)
CORS_ORIGIN=http://localhost:5173

# Frontend URL (for password reset emails)
FRONTEND_URL=http://localhost:5173
```

**Important:**
- Replace `MONGODB_URI` with your actual MongoDB Atlas connection string
- Change `JWT_SECRET` to a secure random string (at least 32 characters)
- Update `CORS_ORIGIN` if your frontend runs on a different port

### 2.2 Generate Secure JWT Secret

You can generate a secure JWT secret using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `JWT_SECRET`.

## Step 3: Frontend Environment Setup

### 3.1 Create Frontend .env File

Navigate to the `frontend` folder and create a `.env` file:

```bash
cd frontend
```

Create `.env` file with the following content:

```env
# Frontend API URL
VITE_API_URL=http://localhost:5000/api
```

**Note:** If your backend runs on a different port, update this URL accordingly.

## Step 4: Install Dependencies

### 4.1 Backend Dependencies

```bash
cd backend
npm install
```

### 4.2 Frontend Dependencies

```bash
cd frontend
npm install
```

## Step 5: Start the Application

### 5.1 Start Backend Server

Open a terminal and run:

```bash
cd backend
npm run server
```

You should see:
```
✅ MongoDB Atlas connected
🚀 Server running on port 5000
```

### 5.2 Start Frontend Development Server

Open another terminal and run:

```bash
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

## Step 6: Test the Connection

### 6.1 Test Backend Connection

1. Open browser and go to: `http://localhost:5000/api/health`
2. You should see: `{"status":"OK","message":"N2 RevCon API is running"}`

### 6.2 Test User Registration

1. Go to: `http://localhost:5173/signup`
2. Fill in the registration form:
   - First Name: Test
   - Last Name: User
   - Company Email: test@example.com
   - Password: test123456
   - Confirm Password: test123456
3. Click **Sign Up**
4. If successful, you should be redirected to the dashboard

### 6.3 Test User Login

1. Go to: `http://localhost:5173/login`
2. Enter the credentials you just created
3. Click **Sign In**
4. If successful, you should be redirected to the dashboard

### 6.4 Verify in MongoDB Atlas

1. Go to MongoDB Atlas Dashboard
2. Click **Browse Collections**
3. You should see a database (usually `test` or your specified database name)
4. You should see a `users` collection
5. Click on `users` to see your registered user

## Step 7: How It Works

### 7.1 Registration Flow

1. User fills out signup form
2. Frontend sends POST request to `/api/auth/register`
3. Backend validates input
4. Backend checks if email already exists in MongoDB
5. If new user, password is hashed with bcrypt
6. User document is saved to MongoDB `users` collection
7. JWT token is generated and sent to frontend
8. Frontend stores token in localStorage
9. User is redirected to dashboard

### 7.2 Login Flow

1. User enters email and password
2. Frontend sends POST request to `/api/auth/login`
3. Backend finds user by email in MongoDB
4. Backend compares password with hashed password
5. If valid, JWT token is generated
6. Token is sent to frontend
7. Frontend stores token in localStorage
8. User is redirected to dashboard

### 7.3 Authentication Check

1. On page load, frontend checks for token in localStorage
2. If token exists, sends GET request to `/api/auth/me`
3. Backend validates token
4. Backend returns user data
5. Frontend sets user in AuthContext
6. Protected routes are accessible

## Troubleshooting

### Issue: "MongoDB connection error"

**Solutions:**
1. Check your MongoDB Atlas connection string
2. Verify your database user password is correct
3. Check Network Access in MongoDB Atlas (allow your IP)
4. Verify cluster is running (not paused)

### Issue: "User already exists"

**Solution:** This means the email is already registered. Try a different email or use the login page.

### Issue: "Invalid credentials"

**Solutions:**
1. Verify email and password are correct
2. Check if user exists in MongoDB Atlas
3. Verify password was hashed correctly during registration

### Issue: CORS Error

**Solutions:**
1. Check `CORS_ORIGIN` in backend `.env` matches frontend URL
2. Verify backend server is running
3. Check browser console for specific CORS error

### Issue: "JWT_SECRET is not defined"

**Solution:** Make sure `JWT_SECRET` is set in backend `.env` file

## Security Best Practices

1. **Never commit `.env` files to Git** (already in `.gitignore`)
2. **Use strong JWT_SECRET** (at least 32 random characters)
3. **Restrict MongoDB Network Access** in production
4. **Use environment-specific variables** for production
5. **Enable MongoDB Atlas encryption** for production
6. **Regularly rotate JWT secrets** in production

## Production Deployment

When deploying to production:

1. Update `MONGODB_URI` with production database
2. Set `NODE_ENV=production`
3. Use strong, unique `JWT_SECRET`
4. Update `CORS_ORIGIN` to production frontend URL
5. Update `FRONTEND_URL` for password reset emails
6. Restrict MongoDB Network Access to production server IPs
7. Enable MongoDB Atlas backup and monitoring

## Quick Setup Script

You can use the provided PowerShell script to generate `.env` files:

```powershell
.\setup-env.ps1
```

Or manually create the files as described above.

## Need Help?

If you encounter issues:
1. Check backend console for error messages
2. Check browser console (F12) for frontend errors
3. Verify MongoDB Atlas cluster is running
4. Check Network Access settings in MongoDB Atlas
5. Verify all environment variables are set correctly

