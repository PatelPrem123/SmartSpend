import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import recurringRoutes from './routes/recurringRoutes.js';
import importRoutes from './routes/importRoutes.js';
import goalRoutes from './routes/goalRoutes.js';

export const app = express();

// Security HTTP Headers
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  })
);

// Body and Cookie Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiter for Standard API endpoints
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes',
  },
  skip: () => env.NODE_ENV === 'test',
});

app.use('/api', globalLimiter);

// Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'SmartSpend FinTech API Gateway',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
  });
});

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SmartSpend Personal Finance & Wealth Platform API',
    health: '/api/v1/health',
    version: 'v1.0.0',
  });
});

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/accounts', accountRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/budgets', budgetRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/recurring', recurringRoutes);
app.use('/api/v1/imports', importRoutes);
app.use('/api/v1/goals', goalRoutes);

app.use(notFound);
app.use(errorHandler);
