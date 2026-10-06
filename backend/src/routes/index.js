import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import jobCategoryRoutes from './jobCategory.routes.js';
import jobRoutes from './job.routes.js';
import applicationRoutes from './application.routes.js';
import studyMaterialRoutes from './studyMaterial.routes.js';
import notificationRoutes from './notification.routes.js';

const apiRouter = Router();

// Mount Health Check endpoint: /api/health
apiRouter.use('/health', healthRoutes);

// Mount Authentication endpoints: /api/auth
apiRouter.use('/auth', authRoutes);

// Mount Administrative endpoints: /api/admin
apiRouter.use('/admin', adminRoutes);

// Mount Job Categories endpoints: /api/categories
apiRouter.use('/categories', jobCategoryRoutes);

// Mount Jobs endpoints: /api/jobs
apiRouter.use('/jobs', jobRoutes);

// Mount Candidate Applications endpoints: /api/applications
apiRouter.use('/applications', applicationRoutes);

// Mount Study Materials & Syllabus endpoints: /api/materials
apiRouter.use('/materials', studyMaterialRoutes);

// Mount Notifications endpoints: /api/notifications
apiRouter.use('/notifications', notificationRoutes);

export default apiRouter;

