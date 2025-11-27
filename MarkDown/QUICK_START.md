# Quick Start Guide - MongoDB Atlas Connection

## ✅ System is Already Configured!

Your login and signup pages are **already connected** to MongoDB Atlas. Here's how to verify and use it:

## Step 1: Verify Environment Files

### Backend .env File
Check if `backend/.env` exists. If not, create it with:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://n2RevCon_db_user:n2RevCon@n2revcon.zfuuthy.mongodb.net/?appName=n2RevCon
JWT_SECRET=your_super_secret_jwt_key_change_in_production_min_32_chars
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

### Frontend .env File
Check if `frontend/.env` exists. If not, create it with:

```env
VITE_API_URL=http://localhost:5000/api
```

## Step 2: Start the Backend Server

```bash
cd backend
npm run server
```

**Expected Output:**
```
✅ MongoDB Atlas connected
🚀 Server running on port 5000
```

If you see an error, check:
- MongoDB Atlas connection string is correct
- Network Access allows your IP (or 0.0.0.0/0 for development)
- Database user credentials are correct

## Step 3: Start the Frontend Server

In a new terminal:

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

## Step 4: Test Registration

1. Go to: `http://localhost:5173/signup`
2. Fill in the form:
   - First Name: Your First Name
   - Last Name: Your Last Name
   - Company Email: your.email@example.com
   - Password: (at least 6 characters with letters and numbers)
   - Confirm Password: (same as password)
3. Click **Sign Up**
4. If successful, you'll be redirected to the dashboard

## Step 5: Test Login

1. Go to: `http://localhost:5173/login`
2. Enter the email and password you registered
3. Click **Sign In**
4. If successful, you'll be redirected to the dashboard

## How It Works

### Registration Process:
1. User submits signup form → Frontend sends data to `/api/auth/register`
2. Backend validates input → Checks if email exists in MongoDB
3. If new user → Password is hashed → User saved to MongoDB `users` collection
4. JWT token generated → Sent to frontend → Stored in localStorage
5. User redirected to dashboard

### Login Process:
1. User submits login form → Frontend sends credentials to `/api/auth/login`
2. Backend finds user by email in MongoDB
3. Password verified → JWT token generated
4. Token sent to frontend → Stored in localStorage
5. User redirected to dashboard

### Authentication Check:
- On page load, frontend checks for token in localStorage
- If token exists → Validates with backend `/api/auth/me`
- If valid → User data loaded → Protected routes accessible
- If invalid → Token removed → User redirected to login

## Verify in MongoDB Atlas

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Click **Browse Collections**
3. Find your database (usually `test` or your database name)
4. Click on `users` collection
5. You should see registered users with:
   - firstName, lastName, email
   - hashed password (not visible, stored securely)
   - role (admin or encoder)
   - timestamps

## Troubleshooting

### ❌ "MongoDB connection error"
**Fix:**
- Verify connection string in `backend/.env`
- Check MongoDB Atlas Network Access (allow your IP)
- Verify database user password is correct
- Ensure cluster is running (not paused)

### ❌ "User already exists"
**Fix:** Email is already registered. Use login page or different email.

### ❌ "Invalid credentials"
**Fix:**
- Check email and password are correct
- Verify user exists in MongoDB Atlas
- Check backend console for errors

### ❌ CORS Error
**Fix:**
- Verify `CORS_ORIGIN` in `backend/.env` matches frontend URL
- Check backend server is running
- Restart both servers

## Current Configuration

Your system is configured with:
- ✅ MongoDB Atlas connection string
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ User registration endpoint
- ✅ User login endpoint
- ✅ Token validation
- ✅ Protected routes

## Next Steps

1. **Test the connection** by registering a new user
2. **Check MongoDB Atlas** to verify user was created
3. **Test login** with the registered credentials
4. **Verify authentication** by accessing protected routes

## Security Notes

- Passwords are automatically hashed before saving to database
- JWT tokens expire after 7 days (configurable)
- Tokens are stored in browser localStorage
- API routes are protected with authentication middleware
- Rate limiting is enabled (100 requests per 15 minutes)

Your login and signup system is ready to use! 🚀

