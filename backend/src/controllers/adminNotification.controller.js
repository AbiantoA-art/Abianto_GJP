import NotificationService from '../services/notification.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Administrative Notification & Announcement Controller
 */
export class AdminNotificationController {
  /**
   * GET /api/admin/notifications
   * List platform-wide notifications with administrative filters and search
   */
  static async listAllNotifications(req, res, next) {
    try {
      const { page, limit, search, recipient_id, type, priority, status, sort } = req.query;

      const result = await NotificationService.getAdminNotifications({
        page,
        limit,
        search,
        recipient_id,
        type,
        priority,
        status,
        sort,
      });

      return sendSuccess(
        res,
        'Admin notifications retrieved successfully',
        result.data,
        200,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/notifications/stats
   * Retrieve aggregate notification metrics across the portal
   */
  static async getStats(req, res, next) {
    try {
      const stats = await NotificationService.getAdminStats();
      return sendSuccess(res, 'Notification statistics retrieved successfully', stats, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/notifications
   * Broadcast or target an administrative announcement
   */
  static async createAnnouncement(req, res, next) {
    try {
      const result = await NotificationService.createAnnouncement(req.user.id, req.body);
      return sendSuccess(res, 'Announcement published successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/notifications/:id/archive
   * Archive a notification administratively
   */
  static async archiveNotification(req, res, next) {
    try {
      const { id } = req.params;
      const result = await NotificationService.archiveNotification(id, req.user);
      return sendSuccess(res, 'Notification archived by administrator', result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/notifications/trigger-deadlines
   * Administrative trigger to evaluate approaching deadlines and dispatch alerts
   */
  static async triggerDeadlines(req, res, next) {
    try {
      const count = await NotificationService.checkAndDispatchDeadlineAlerts();
      return sendSuccess(
        res,
        `Deadline check completed. ${count} alert(s) dispatched.`,
        { dispatched_count: count },
        200
      );
    } catch (error) {
      next(error);
    }
  }
}

export default AdminNotificationController;
