import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import revenueRoutes from './routes/revenue.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import billingRoutes from './routes/billing.routes.js';
import collectionRoutes from './routes/collection.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import exportRoutes from './routes/export.routes.js';
import companyRoutes from './routes/company.routes.js';

// Import notification service
import { checkNotifications } from './services/notification.service.js';

// Load environment variables
dotenv.config();

const app = express();

// Trust proxy for accurate IP addresses (only in production or behind proxy)
// In development, set to false to avoid rate limiting warnings
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

// CORS configuration - MUST be before rate limiting
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development' || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Apply CORS first, before any other middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Rate limiting - skip for OPTIONS requests
// Fix trust proxy warning by only trusting proxy in production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => req.method === 'OPTIONS', // Skip rate limiting for preflight requests
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'N2 RevCon API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      docs: 'API documentation available at /api/health'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'N2 RevCon API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/company', companyRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || '')
  .then(() => {
    console.log('✅ MongoDB Atlas connected');
    
    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Daily cron job for notifications (runs at 9 AM every day)
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily notification check...');
  try {
    await checkNotifications();
    console.log('Notification check completed');
  } catch (error) {
    console.error('Error in notification cron job:', error);
  }
});

export default app;

