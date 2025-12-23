# n2 RevCon - Company Monitoring System

A full-stack Progressive Web App (PWA) built with the MERN stack for internal company monitoring and project management.

## Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS, React Router
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT
- **PWA**: Service Worker + Web Manifest
- **Charts**: Recharts

## Project Structure

```
n2revCon-PWA/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://n2RevCon_db_user:n2RevCon@n2revcon.zfuuthy.mongodb.net/?appName=n2RevCon
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
```

4. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Install Tailwind CSS (if not already installed):
```bash
npm install -D tailwindcss@3
npx tailwindcss init
```

4. Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

5. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Features

### Core Modules

- **Authentication**: JWT-based authentication with role-based access (Admin, Encoder)
- **Dashboard**: Charts and summaries with year filtering
- **Projects**: Full CRUD operations with 5-step wizard
- **Revenue & Costs**: Manual input and tracking
- **Billing & Collections**: Invoice and payment management
- **Notifications**: Date-based and status-based alerts
- **Excel Export**: Multiple export options with ExcelJS
- **Settings**: User profile, account settings, and system settings

### PWA Features

- Offline-first behavior
- Service Worker for caching
- Installable on desktop and mobile
- Web Manifest configuration

### Security

- JWT token validation
- Password hashing with bcrypt
- Protected API routes
- Rate limiting
- Input sanitization
- CORS configuration

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Revenue & Expenses
- `GET /api/revenue` - Get all revenue records
- `POST /api/revenue` - Create revenue record
- `GET /api/expenses` - Get all expense records
- `POST /api/expenses` - Create expense record

### Billing & Collections
- `GET /api/billing` - Get all billing records
- `POST /api/billing` - Create billing record
- `GET /api/collections` - Get all collection records
- `POST /api/collections` - Create collection record

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard summary data

### Export
- `GET /api/export/project/:id` - Export project report
- `GET /api/export/revenue-costs` - Export revenue vs costs
- `GET /api/export/billing-collections` - Export billing & collections
- `GET /api/export/summary` - Export system summary

## Notification System

The system automatically generates notifications for:
- Projects ending in 3, 2, and 1 days
- Projects past end date not marked completed
- Billed but unpaid invoices
- Completed projects without billing records

Notifications are checked daily via cron job at 9 AM.

## Building for Production

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

## PWA Icons

For the PWA to work properly, you need to add icon files to `frontend/public/`:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)

You can generate these icons using online tools (like https://realfavicongenerator.net/) or image editing software. The icons should represent the n2 RevCon branding with a red, white, and black color scheme.

**Note**: The Vite PWA plugin will automatically generate and register the service worker. The service worker uses Workbox for caching strategies.

## Notes

- The MongoDB connection string is already configured in the `.env.example` file
- Make sure to change the `JWT_SECRET` in production
- The service worker will automatically cache API responses for offline use
- IndexedDB is used for offline data storage and sync

## License

ISC

## Push to Github Process

- git add/status
- git commit ""
- git remote -v
- git remote set-url origin https://[YOUR_TOKEN]@github.com/Norahc07/n2RevCon.git && git push origin main

**Note:** Replace `[YOUR_TOKEN]` with your GitHub Personal Access Token. Never commit tokens to the repository.

