import { Router } from 'express';
import NotificationController from '../controllers/notification.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// All notification routes require authenticated user
router.use(authenticateToken);

// GET /api/notifications/unread-count - Fetch unread count for badge
router.get('/unread-count', NotificationController.getUnreadCount);

// PATCH /api/notifications/read-all - Mark all as read for current user
router.patch('/read-all', NotificationController.markAllAsRead);

// GET /api/notifications - List paginated notifications for current user
router.get('/', NotificationController.listUserNotifications);

// GET /api/notifications/:id - Details of single notification (with ownership check)
router.get('/:id', NotificationController.getNotificationById);

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', NotificationController.markAsRead);

// PATCH /api/notifications/:id/archive - Archive notification
router.patch('/:id/archive', NotificationController.archiveNotification);

export default router;
