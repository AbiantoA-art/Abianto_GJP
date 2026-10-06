import { Router } from 'express';
import AdminController from '../controllers/admin.controller.js';
import adminJobRoutes from './adminJob.routes.js';
import adminApplicationRoutes from './adminApplication.routes.js';
import adminStudyMaterialRoutes from './adminStudyMaterial.routes.js';
import adminNotificationRoutes from './adminNotification.routes.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Admin-only Protected Verification Endpoint
router.get('/test', authenticateToken, requireRole('admin'), AdminController.testAdmin);

// Admin-only Job Management Endpoints: /api/admin/jobs
router.use('/jobs', adminJobRoutes);

// Admin-only Application Management Endpoints: /api/admin/applications
router.use('/applications', adminApplicationRoutes);

// Admin-only Study Material & Syllabus Endpoints: /api/admin/materials
router.use('/materials', adminStudyMaterialRoutes);

// Admin-only Notification & Announcement Endpoints: /api/admin/notifications
router.use('/notifications', adminNotificationRoutes);

export default router;

