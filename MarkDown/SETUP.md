# Environment Setup Guide

## Backend Environment File

Create `backend/.env` file (copy from `backend/.env.example` if it exists, or create manually):

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://n2RevCon_db_user:n2RevCon@n2revcon.zfuuthy.mongodb.net/?appName=n2RevCon

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# CORS Origin
CORS_ORIGIN=http://localhost:5173
```

## Frontend Environment File

Create `frontend/.env` file (copy from `frontend/.env.example` if it exists, or create manually):

```env
# Frontend API URL
VITE_API_URL=http://localhost:5000/api
```

## Development Scripts

### Backend
```bash
cd backend
npm run server
# or
npm run dev
```

Both commands run `nodemon server.js` for development with auto-reload.

### Frontend
```bash
cd frontend
npm run dev
```

This runs Vite development server on `http://localhost:5173`

## Quick Start

1. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create .env file (see above)
   npm run server
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   # Create .env file (see above)
   npm run dev
   ```

## Notes

- Backend runs on port `5000` by default
- Frontend runs on port `5173` by default
- Make sure MongoDB Atlas connection string is correct in backend `.env`
- Change `JWT_SECRET` to a secure random string in production

