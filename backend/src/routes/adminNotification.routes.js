import { Router } from 'express';
import AdminNotificationController from '../controllers/adminNotification.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Enforce admin-only access across all admin notification endpoints
router.use(authenticateToken, requireRole('admin'));

// GET /api/admin/notifications/stats - Aggregate stats
router.get('/stats', AdminNotificationController.getStats);

// POST /api/admin/notifications/trigger-deadlines - Trigger deadline alert evaluation
router.post('/trigger-deadlines', AdminNotificationController.triggerDeadlines);

// GET /api/admin/notifications - List all platform notifications
router.get('/', AdminNotificationController.listAllNotifications);

// POST /api/admin/notifications - Broadcast or targeted announcement
router.post('/', AdminNotificationController.createAnnouncement);

// PATCH /api/admin/notifications/:id/archive - Archive notification
router.patch('/:id/archive', AdminNotificationController.archiveNotification);

export default router;
