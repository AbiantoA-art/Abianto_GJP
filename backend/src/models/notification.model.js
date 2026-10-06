import pool from '../config/db.config.js';

class NotificationModel {
  /**
   * Create a single notification record
   * @param {Object} data
   * @param {Object} [connection]
   * @returns {Promise<number>} Inserted notification ID
   */
  static async create(data, connection = null) {
    const executor = connection || pool;
    const query = `
      INSERT INTO notifications (
        recipient_id,
        sender_id,
        type,
        title,
        message,
        priority,
        related_entity_type,
        related_entity_id,
        action_url,
        is_read,
        read_at,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const isRead = Boolean(data.is_read);
    const readAt = isRead ? (data.read_at || new Date()) : null;

    const [result] = await executor.query(query, [
      data.recipient_id,
      data.sender_id || null,
      data.type || 'system',
      data.title,
      data.message,
      data.priority || 'normal',
      data.related_entity_type || null,
      data.related_entity_id || null,
      data.action_url || null,
      isRead,
      readAt,
      data.status || 'active',
    ]);

    return result.insertId;
  }

  /**
   * Bulk insert multiple notifications (e.g. For broadcasts or category alerts)
   * @param {Array<Object>} notifications
   * @param {Object} [connection]
   * @returns {Promise<number>} Count of inserted rows
   */
  static async createBulk(notifications, connection = null) {
    if (!notifications || notifications.length === 0) return 0;
    const executor = connection || pool;

    const query = `
      INSERT INTO notifications (
        recipient_id,
        sender_id,
        type,
        title,
        message,
        priority,
        related_entity_type,
        related_entity_id,
        action_url,
        is_read,
        status
      ) VALUES ?
    `;

    const values = notifications.map((n) => [
      n.recipient_id,
      n.sender_id || null,
      n.type || 'system',
      n.title,
      n.message,
      n.priority || 'normal',
      n.related_entity_type || null,
      n.related_entity_id || null,
      n.action_url || null,
      Boolean(n.is_read),
      n.status || 'active',
    ]);

    const [result] = await executor.query(query, [values]);
    return result.affectedRows;
  }

  /**
   * Find notification by ID
   * @param {number} id
   * @param {Object} [connection]
   * @returns {Promise<Object|null>}
   */
  static async findById(id, connection = null) {
    const executor = connection || pool;
    const query = `
      SELECT
        n.id,
        n.recipient_id,
        ru.full_name AS recipient_name,
        ru.email AS recipient_email,
        n.sender_id,
        su.full_name AS sender_name,
        su.email AS sender_email,
        n.type,
        n.title,
        n.message,
        n.priority,
        n.related_entity_type,
        n.related_entity_id,
        n.action_url,
        n.is_read,
        n.read_at,
        n.status,
        n.created_at,
        n.updated_at
      FROM notifications n
      LEFT JOIN users ru ON n.recipient_id = ru.id
      LEFT JOIN users su ON n.sender_id = su.id
      WHERE n.id = ?
      LIMIT 1
    `;

    const [rows] = await executor.query(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Retrieve paginated notifications for a specific recipient user
   */
  static async findByRecipient(
    recipientId,
    {
      page = 1,
      limit = 10,
      search = '',
      type = '',
      priority = '',
      is_read = undefined,
      status = 'active',
      sort = 'latest',
    }
  ) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (safePage - 1) * safeLimit;

    const whereClauses = ['n.recipient_id = ?'];
    const params = [recipientId];

    // Status filter (defaults to 'active' unless 'all' or 'archived' requested)
    if (status && status !== 'all') {
      whereClauses.push('n.status = ?');
      params.push(status);
    }

    // Read/Unread filter
    if (is_read !== undefined && is_read !== '' && is_read !== null) {
      const boolVal = is_read === 'true' || is_read === true || is_read === '1' || is_read === 1;
      whereClauses.push('n.is_read = ?');
      params.push(boolVal);
    }

    // Type filter
    if (type && type.trim()) {
      whereClauses.push('n.type = ?');
      params.push(type.trim());
    }

    // Priority filter
    if (priority && priority.trim()) {
      whereClauses.push('n.priority = ?');
      params.push(priority.trim());
    }

    // Search across title and message
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereClauses.push('(n.title LIKE ? OR n.message LIKE ?)');
      params.push(term, term);
    }

    const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

    // Whitelist sorting
    let orderSQL = 'ORDER BY n.created_at DESC';
    switch (sort) {
      case 'oldest':
        orderSQL = 'ORDER BY n.created_at ASC';
        break;
      case 'priority_high':
        orderSQL = `
          ORDER BY
            CASE n.priority
              WHEN 'urgent' THEN 1
              WHEN 'high' THEN 2
              WHEN 'normal' THEN 3
              WHEN 'low' THEN 4
              ELSE 5
            END ASC,
            n.created_at DESC
        `;
        break;
      case 'priority_low':
        orderSQL = `
          ORDER BY
            CASE n.priority
              WHEN 'low' THEN 1
              WHEN 'normal' THEN 2
              WHEN 'high' THEN 3
              WHEN 'urgent' THEN 4
              ELSE 5
            END ASC,
            n.created_at DESC
        `;
        break;
      case 'latest':
      default:
        orderSQL = 'ORDER BY n.created_at DESC';
        break;
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM notifications n
      ${whereSQL}
    `;
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0].total;

    // Data query
    const dataQuery = `
      SELECT
        n.id,
        n.recipient_id,
        n.sender_id,
        su.full_name AS sender_name,
        n.type,
        n.title,
        n.message,
        n.priority,
        n.related_entity_type,
        n.related_entity_id,
        n.action_url,
        n.is_read,
        n.read_at,
        n.status,
        n.created_at,
        n.updated_at
      FROM notifications n
      LEFT JOIN users su ON n.sender_id = su.id
      ${whereSQL}
      ${orderSQL}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataQuery, [...params, safeLimit, offset]);

    return {
      data: rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }

  /**
   * Count unread active notifications for a recipient
   * @param {number} recipientId
   * @returns {Promise<number>}
   */
  static async countUnread(recipientId) {
    const query = `
      SELECT COUNT(*) AS unread_count
      FROM notifications
      WHERE recipient_id = ?
        AND is_read = FALSE
        AND status = 'active'
    `;
    const [rows] = await pool.query(query, [recipientId]);
    return Number(rows[0]?.unread_count) || 0;
  }

  /**
   * Mark a single notification as read
   * @param {number} id
   * @param {number} recipientId
   * @returns {Promise<boolean>}
   */
  static async markAsRead(id, recipientId) {
    const query = `
      UPDATE notifications
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND recipient_id = ?
    `;
    const [result] = await pool.query(query, [id, recipientId]);
    return result.affectedRows > 0;
  }

  /**
   * Mark all unread notifications for a recipient as read
   * @param {number} recipientId
   * @returns {Promise<number>} Number of marked notifications
   */
  static async markAllAsRead(recipientId) {
    const query = `
      UPDATE notifications
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE recipient_id = ? AND is_read = FALSE AND status = 'active'
    `;
    const [result] = await pool.query(query, [recipientId]);
    return result.affectedRows;
  }

  /**
   * Archive a notification (soft delete)
   * @param {number} id
   * @param {number} [recipientId] Optional recipient check for ownership
   * @returns {Promise<boolean>}
   */
  static async archive(id, recipientId = null) {
    let query = "UPDATE notifications SET status = 'archived' WHERE id = ?";
    const params = [id];

    if (recipientId) {
      query += ' AND recipient_id = ?';
      params.push(recipientId);
    }

    const [result] = await pool.query(query, params);
    return result.affectedRows > 0;
  }

  /**
   * Admin query: retrieve all notifications across the platform
   */
  static async findAllAdmin({
    page = 1,
    limit = 10,
    search = '',
    recipient_id = null,
    type = '',
    priority = '',
    status = '',
    sort = 'latest',
  }) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (safePage - 1) * safeLimit;

    const whereClauses = [];
    const params = [];

    if (recipient_id) {
      whereClauses.push('n.recipient_id = ?');
      params.push(parseInt(recipient_id, 10));
    }

    if (status && status !== 'all') {
      whereClauses.push('n.status = ?');
      params.push(status);
    }

    if (type && type.trim()) {
      whereClauses.push('n.type = ?');
      params.push(type.trim());
    }

    if (priority && priority.trim()) {
      whereClauses.push('n.priority = ?');
      params.push(priority.trim());
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereClauses.push('(n.title LIKE ? OR n.message LIKE ? OR ru.full_name LIKE ? OR ru.email LIKE ?)');
      params.push(term, term, term, term);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let orderSQL = 'ORDER BY n.created_at DESC';
    switch (sort) {
      case 'oldest':
        orderSQL = 'ORDER BY n.created_at ASC';
        break;
      case 'priority_high':
        orderSQL = `
          ORDER BY
            CASE n.priority
              WHEN 'urgent' THEN 1
              WHEN 'high' THEN 2
              WHEN 'normal' THEN 3
              WHEN 'low' THEN 4
              ELSE 5
            END ASC,
            n.created_at DESC
        `;
        break;
      case 'latest':
      default:
        orderSQL = 'ORDER BY n.created_at DESC';
        break;
    }

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM notifications n
      LEFT JOIN users ru ON n.recipient_id = ru.id
      ${whereSQL}
    `;
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0].total;

    const dataQuery = `
      SELECT
        n.id,
        n.recipient_id,
        ru.full_name AS recipient_name,
        ru.email AS recipient_email,
        n.sender_id,
        su.full_name AS sender_name,
        n.type,
        n.title,
        n.message,
        n.priority,
        n.related_entity_type,
        n.related_entity_id,
        n.action_url,
        n.is_read,
        n.read_at,
        n.status,
        n.created_at,
        n.updated_at
      FROM notifications n
      LEFT JOIN users ru ON n.recipient_id = ru.id
      LEFT JOIN users su ON n.sender_id = su.id
      ${whereSQL}
      ${orderSQL}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataQuery, [...params, safeLimit, offset]);

    return {
      data: rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }

  /**
   * Get administrative statistics for system notifications
   */
  static async getStats() {
    const query = `
      SELECT
        COUNT(*) AS total_notifications,
        SUM(CASE WHEN is_read = FALSE AND status = 'active' THEN 1 ELSE 0 END) AS unread_count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) AS archived_count,
        SUM(CASE WHEN type = 'announcement' THEN 1 ELSE 0 END) AS announcement_count,
        SUM(CASE WHEN type = 'application_status' THEN 1 ELSE 0 END) AS application_status_count,
        SUM(CASE WHEN type = 'new_job' THEN 1 ELSE 0 END) AS new_job_count,
        SUM(CASE WHEN type = 'deadline' THEN 1 ELSE 0 END) AS deadline_count,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) AS urgent_count
      FROM notifications
    `;

    const [rows] = await pool.query(query);
    const r = rows[0] || {};

    return {
      total: Number(r.total_notifications) || 0,
      unread: Number(r.unread_count) || 0,
      active: Number(r.active_count) || 0,
      archived: Number(r.archived_count) || 0,
      announcements: Number(r.announcement_count) || 0,
      applicationStatus: Number(r.application_status_count) || 0,
      newJobs: Number(r.new_job_count) || 0,
      deadlines: Number(r.deadline_count) || 0,
      urgent: Number(r.urgent_count) || 0,
    };
  }

  /**
   * Check if a deadline alert was already sent for a specific candidate, job, and interval (idempotency guard)
   */
  static async existsDeadlineNotification(recipientId, jobId, intervalTag) {
    const query = `
      SELECT id
      FROM notifications
      WHERE recipient_id = ?
        AND related_entity_type = 'job'
        AND related_entity_id = ?
        AND type = 'deadline'
        AND message LIKE ?
      LIMIT 1
    `;
    const [rows] = await pool.query(query, [recipientId, jobId, `%[Deadline Alert: ${intervalTag}]%`]);
    return rows.length > 0;
  }
}

export default NotificationModel;
