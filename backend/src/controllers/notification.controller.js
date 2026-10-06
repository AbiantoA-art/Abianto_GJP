import NotificationService from '../services/notification.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Candidate & Authenticated User Notification Controller
 */
export class NotificationController {
  /**
   * GET /api/notifications
   * Retrieve paginated notifications for authenticated user
   */
  static async listUserNotifications(req, res, next) {
    try {
      const { page, limit, search, type, priority, is_read, status, sort } = req.query;

      const result = await NotificationService.getUserNotifications(req.user.id, {
        page,
        limit,
        search,
        type,
        priority,
        is_read,
        status,
        sort,
      });

      return sendSuccess(
        res,
        'Notifications retrieved successfully',
        result.data,
        200,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/unread-count
   * Return number of active unread notifications
   */
  static async getUnreadCount(req, res, next) {
    try {
      const unreadCount = await NotificationService.getUnreadCount(req.user.id);
      return sendSuccess(
        res,
        'Unread notification count retrieved',
        { unread_count: unreadCount },
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/:id
   * Retrieve notification details with strict ownership verification
   */
  static async getNotificationById(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await NotificationService.getNotificationDetails(id, req.user);
      return sendSuccess(res, 'Notification details retrieved successfully', notification, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Mark a single notification as read
   */
  static async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await NotificationService.markNotificationRead(id, req.user.id);
      return sendSuccess(res, 'Notification marked as read', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications of authenticated user as read
   */
  static async markAllAsRead(req, res, next) {
    try {
      const result = await NotificationService.markAllNotificationsRead(req.user.id);
      return sendSuccess(res, 'All notifications marked as read', result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/archive
   * Archive notification (soft delete)
   */
  static async archiveNotification(req, res, next) {
    try {
      const { id } = req.params;
      const result = await NotificationService.archiveNotification(id, req.user);
      return sendSuccess(res, 'Notification archived successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default NotificationController;
