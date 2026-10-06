import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.config.js';
import apiRouter from './routes/index.js';
import { apiRateLimiter } from './middleware/rateLimiter.middleware.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration (Strict in production, flexible in development)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman, server tests)
      if (!origin) return callback(null, true);

      // In production, strictly enforce configured origin(s)
      if (env.nodeEnv === 'production') {
        const allowedOrigins = env.corsOrigin.split(',').map((o) => o.trim());
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Blocked by CORS policy: Origin not allowed in production'));
      }

      // In development / test, allow configured origin and local development hosts
      if (
        origin === env.corsOrigin ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Test-Rate-Limit'],
  })
);

// HTTP request logging
if (env.nodeEnv !== 'test') {
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
}

// Request parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    portal: 'Government Job Portal API Server',
    phase: 'Phase 10 - Production Ready',
    status: 'operational',
    healthCheck: '/api/health',
    auth: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me',
    },
    admin: {
      test: 'GET /api/admin/test',
      jobs: 'GET /api/admin/jobs',
      jobStats: 'GET /api/admin/jobs/stats',
      applications: 'GET /api/admin/applications',
      applicationStats: 'GET /api/admin/applications/stats',
      materials: 'GET /api/admin/materials',
      materialStats: 'GET /api/admin/materials/stats',
      notifications: 'GET /api/admin/notifications',
      notificationStats: 'GET /api/admin/notifications/stats',
    },
    categories: {
      list: 'GET /api/categories',
    },
    jobs: {
      list: 'GET /api/jobs',
      details: 'GET /api/jobs/:id',
    },
    applications: {
      submit: 'POST /api/applications',
      myApplications: 'GET /api/applications',
      details: 'GET /api/applications/:id',
      check: 'GET /api/applications/check/:jobId',
      withdraw: 'PATCH /api/applications/:id/withdraw',
    },
    materials: {
      list: 'GET /api/materials',
      details: 'GET /api/materials/:id',
      download: 'GET /api/materials/:id/download',
    },
    notifications: {
      list: 'GET /api/notifications',
      unreadCount: 'GET /api/notifications/unread-count',
      details: 'GET /api/notifications/:id',
      markRead: 'PATCH /api/notifications/:id/read',
      markAllRead: 'PATCH /api/notifications/read-all',
      archive: 'PATCH /api/notifications/:id/archive',
    },
    timestamp: new Date().toISOString(),
  });
});

// Mount Main API Routes with rate limiting protection
app.use('/api', apiRateLimiter, apiRouter);

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
