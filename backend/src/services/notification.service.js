import pool from '../config/db.config.js';
import NotificationModel from '../models/notification.model.js';
import UserModel from '../models/user.model.js';

class NotificationService {
  /**
   * Send notification to a single user
   */
  static async notifyUser(recipientId, data) {
    // Validate recipient existence
    const recipient = await UserModel.findById(recipientId);
    if (!recipient) {
      const error = new Error(`Recipient user with ID ${recipientId} does not exist.`);
      error.statusCode = 404;
      throw error;
    }

    const notificationData = {
      recipient_id: recipientId,
      sender_id: data.sender_id || null,
      type: data.type || 'system',
      title: data.title,
      message: data.message,
      priority: data.priority || 'normal',
      related_entity_type: data.related_entity_type || null,
      related_entity_id: data.related_entity_id || null,
      action_url: data.action_url || null,
      is_read: false,
      status: 'active',
    };

    const id = await NotificationModel.create(notificationData);
    return await NotificationModel.findById(id);
  }

  /**
   * Broadcast notifications to multiple candidates
   */
  static async notifyCandidates(data, candidateIds = null) {
    let targetIds = candidateIds;

    if (!targetIds || targetIds.length === 0) {
      // Fetch all active candidates
      const [rows] = await pool.query(
        "SELECT id FROM users WHERE role = 'candidate' AND status = 'active'"
      );
      targetIds = rows.map((r) => r.id);
    }

    if (targetIds.length === 0) return 0;

    const notifications = targetIds.map((cId) => ({
      recipient_id: cId,
      sender_id: data.sender_id || null,
      type: data.type || 'system',
      title: data.title,
      message: data.message,
      priority: data.priority || 'normal',
      related_entity_type: data.related_entity_type || null,
      related_entity_id: data.related_entity_id || null,
      action_url: data.action_url || null,
      is_read: false,
      status: 'active',
    }));

    return await NotificationModel.createBulk(notifications);
  }

  /**
   * Application submission notification (Phase 07 integration)
   */
  static async notifyApplicationSubmitted(candidateId, application, job) {
    try {
      const jobTitle = job?.title || 'Government Recruitment Vacancy';
      const appId = application?.application_id || application?.id;

      return await this.notifyUser(candidateId, {
        type: 'application_submitted',
        title: `Application Submitted — ${jobTitle}`,
        message: `Your application (${appId}) for the post of "${jobTitle}" at ${job?.organization || 'the Department'} has been submitted successfully and is under administrative review.`,
        priority: 'normal',
        related_entity_type: 'application',
        related_entity_id: application?.id,
        action_url: `/applications/${application?.id}`,
      });
    } catch (err) {
      console.error('Failed to dispatch application submission notification:', err.message);
    }
  }

  /**
   * Application status change notification (Phase 07 integration)
   */
  static async notifyApplicationStatus(candidateId, application, job, newStatus) {
    try {
      const jobTitle = job?.title || 'Government Recruitment Vacancy';
      const appId = application?.application_id || application?.id;
      const formattedStatus = (newStatus || '').replace(/_/g, ' ').toUpperCase();

      let priority = 'high';
      if (['shortlisted', 'selected'].includes(newStatus)) {
        priority = 'urgent';
      }

      return await this.notifyUser(candidateId, {
        type: 'application_status',
        title: `Application Status Update: ${formattedStatus}`,
        message: `Your application (${appId}) for "${jobTitle}" has been updated to "${formattedStatus}". Please visit your application dashboard for instructions and documents.`,
        priority,
        related_entity_type: 'application',
        related_entity_id: application?.id,
        action_url: `/applications/${application?.id}`,
      });
    } catch (err) {
      console.error('Failed to dispatch application status notification:', err.message);
    }
  }

  /**
   * New Job published notification (Phase 05/06 integration)
   */
  static async notifyNewJob(job) {
    try {
      if (!job || job.status !== 'published') return;

      const title = `New Vacancy Published: ${job.title}`;
      const vacanciesText = job.vacancies ? ` (${job.vacancies} vacancies)` : '';
      const deadlineText = job.last_date ? ` Deadline: ${new Date(job.last_date).toLocaleDateString('en-IN')}.` : '';
      const message = `Official recruitment notification for "${job.title}"${vacanciesText} at ${job.organization || 'Government Department'} is now open.${deadlineText}`;

      return await this.notifyCandidates({
        type: 'new_job',
        title,
        message,
        priority: 'normal',
        related_entity_type: 'job',
        related_entity_id: job.id,
        action_url: `/jobs/${job.id}`,
      });
    } catch (err) {
      console.error('Failed to dispatch new job notification:', err.message);
    }
  }

  /**
   * Study material published notification (Phase 08 integration)
   */
  static async notifyStudyMaterial(material) {
    try {
      if (!material || material.status !== 'published') return;

      const title = `New Study Material: ${material.title}`;
      const message = `Official study guide "${material.title}" for ${material.subject || 'competitive exams'} is now available in the Resource Repository.`;

      return await this.notifyCandidates({
        type: 'study_material',
        title,
        message,
        priority: 'normal',
        related_entity_type: 'study_material',
        related_entity_id: material.id,
        action_url: `/study-materials/${material.id}`,
      });
    } catch (err) {
      console.error('Failed to dispatch study material notification:', err.message);
    }
  }

  /**
   * Syllabus published notification (Phase 08 integration)
   */
  static async notifySyllabus(material) {
    try {
      if (!material || material.status !== 'published') return;

      const title = `New Examination Syllabus: ${material.title}`;
      const message = `The official examination pattern & curriculum for "${material.title}" has been published.`;

      return await this.notifyCandidates({
        type: 'syllabus',
        title,
        message,
        priority: 'normal',
        related_entity_type: 'syllabus',
        related_entity_id: material.id,
        action_url: `/study-materials/${material.id}`,
      });
    } catch (err) {
      console.error('Failed to dispatch syllabus notification:', err.message);
    }
  }

  /**
   * Check and dispatch deadline alerts (7d, 3d, 1d) with idempotency
   */
  static async checkAndDispatchDeadlineAlerts() {
    const intervals = [
      { days: 7, tag: '7d', priority: 'normal' },
      { days: 3, tag: '3d', priority: 'high' },
      { days: 1, tag: '1d', priority: 'urgent' },
    ];

    let totalDispatched = 0;

    for (const { days, tag, priority } of intervals) {
      // Find published jobs closing in exactly `days` days
      const query = `
        SELECT j.id, j.title, j.organization, DATE_FORMAT(j.last_date, '%Y-%m-%d') AS last_date
        FROM jobs j
        WHERE j.status = 'published'
          AND DATE(j.last_date) = DATE_ADD(CURDATE(), INTERVAL ? DAY)
      `;
      const [jobs] = await pool.query(query, [days]);

      for (const job of jobs) {
        // Find candidates who started an application or all active candidates
        const [candidateRows] = await pool.query(
          "SELECT id FROM users WHERE role = 'candidate' AND status = 'active'"
        );

        for (const cand of candidateRows) {
          // Check idempotency: avoid sending duplicate alert for the same job and interval tag
          const exists = await NotificationModel.existsDeadlineNotification(cand.id, job.id, tag);
          if (!exists) {
            await NotificationModel.create({
              recipient_id: cand.id,
              type: 'deadline',
              title: `Application Deadline Alert: ${job.title} (${days} Day${days > 1 ? 's' : ''} Left)`,
              message: `Reminder: The deadline for submitting applications for "${job.title}" at ${job.organization} closes on ${job.last_date}. Please complete your application before the portal closes. [Deadline Alert: ${tag}]`,
              priority,
              related_entity_type: 'job',
              related_entity_id: job.id,
              action_url: `/jobs/${job.id}`,
              is_read: false,
              status: 'active',
            });
            totalDispatched++;
          }
        }
      }
    }

    return totalDispatched;
  }

  /**
   * Create administrative announcement
   */
  static async createAnnouncement(adminUserId, data) {
    const { title, message, priority = 'high', scope = 'all', category_id, candidate_id, action_url } = data;

    if (!title || !title.trim()) {
      const err = new Error('Announcement title is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!message || !message.trim()) {
      const err = new Error('Announcement message is required.');
      err.statusCode = 400;
      throw err;
    }

    let recipientIds = [];

    if (scope === 'single' && candidate_id) {
      const user = await UserModel.findById(candidate_id);
      if (!user) {
        const err = new Error(`Recipient candidate with ID ${candidate_id} not found.`);
        err.statusCode = 404;
        throw err;
      }
      recipientIds = [candidate_id];
    } else if (scope === 'category' && category_id) {
      // Find candidates who have applied for jobs in this category or interested candidates
      const [appCandidates] = await pool.query(
        `SELECT DISTINCT a.candidate_id AS id
         FROM applications a
         JOIN jobs j ON a.job_id = j.id
         WHERE j.category_id = ?`,
        [category_id]
      );
      if (appCandidates.length > 0) {
        recipientIds = appCandidates.map((r) => r.id);
      } else {
        const [allCandidates] = await pool.query(
          "SELECT id FROM users WHERE role = 'candidate' AND status = 'active'"
        );
        recipientIds = allCandidates.map((r) => r.id);
      }
    } else {
      // Scope === 'all'
      const [allCandidates] = await pool.query(
        "SELECT id FROM users WHERE role = 'candidate' AND status = 'active'"
      );
      recipientIds = allCandidates.map((r) => r.id);
    }

    if (recipientIds.length === 0) {
      return { count: 0, message: 'No eligible recipients found for announcement.' };
    }

    const notifications = recipientIds.map((id) => ({
      recipient_id: id,
      sender_id: adminUserId,
      type: 'announcement',
      title: title.trim(),
      message: message.trim(),
      priority,
      related_entity_type: null,
      related_entity_id: null,
      action_url: action_url || null,
      is_read: false,
      status: 'active',
    }));

    const insertedCount = await NotificationModel.createBulk(notifications);
    return {
      count: insertedCount,
      title: title.trim(),
      priority,
      scope,
    };
  }

  /**
   * Candidate / User: List notifications
   */
  static async getUserNotifications(userId, query) {
    return await NotificationModel.findByRecipient(userId, query);
  }

  /**
   * Candidate / User: Get single notification details (with strict ownership)
   */
  static async getNotificationDetails(notificationId, user) {
    const notification = await NotificationModel.findById(notificationId);
    if (!notification) {
      const err = new Error('Notification not found.');
      err.statusCode = 404;
      throw err;
    }

    const isRecipient = notification.recipient_id === user.id;
    const isAdmin = user.role === 'admin';

    if (!isRecipient && !isAdmin) {
      const err = new Error('Access denied: You are not authorized to view this notification.');
      err.statusCode = 403;
      throw err;
    }

    return notification;
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId) {
    return await NotificationModel.countUnread(userId);
  }

  /**
   * Mark single notification as read
   */
  static async markNotificationRead(notificationId, userId) {
    const notification = await NotificationModel.findById(notificationId);
    if (!notification) {
      const err = new Error('Notification not found.');
      err.statusCode = 404;
      throw err;
    }

    if (notification.recipient_id !== userId) {
      const err = new Error('Access denied: You can only mark your own notifications as read.');
      err.statusCode = 403;
      throw err;
    }

    await NotificationModel.markAsRead(notificationId, userId);
    return await NotificationModel.findById(notificationId);
  }

  /**
   * Mark all unread notifications for a user as read
   */
  static async markAllNotificationsRead(userId) {
    const affected = await NotificationModel.markAllAsRead(userId);
    return { markedCount: affected };
  }

  /**
   * Archive notification (soft delete)
   */
  static async archiveNotification(notificationId, user) {
    const notification = await NotificationModel.findById(notificationId);
    if (!notification) {
      const err = new Error('Notification not found.');
      err.statusCode = 404;
      throw err;
    }

    const isRecipient = notification.recipient_id === user.id;
    const isAdmin = user.role === 'admin';

    if (!isRecipient && !isAdmin) {
      const err = new Error('Access denied: You can only archive your own notifications.');
      err.statusCode = 403;
      throw err;
    }

    await NotificationModel.archive(notificationId);
    return await NotificationModel.findById(notificationId);
  }

  /**
   * Admin: List all platform notifications
   */
  static async getAdminNotifications(query) {
    return await NotificationModel.findAllAdmin(query);
  }

  /**
   * Admin: Get notification metrics
   */
  static async getAdminStats() {
    return await NotificationModel.getStats();
  }
}

export default NotificationService;
