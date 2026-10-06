import pool from '../config/db.config.js';
import { formatDate } from './job.model.js';

/**
 * Application Entity Data Access Model
 * Manages government job applications and their lifecycle.
 */
export class ApplicationModel {
  /**
   * Create a new application record within a transaction connection
   * @param {Object} data
   * @param {import('mysql2/promise').PoolConnection} connection
   * @returns {Promise<Object>}
   */
  static async create(data, connection = null) {
    const executor = connection || pool;
    const appId =
      data.application_id ||
      `APP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const query = `
      INSERT INTO applications (
        application_id,
        job_id,
        candidate_id,
        full_name,
        email,
        mobile_number,
        date_of_birth,
        gender,
        address_line,
        city,
        district,
        state,
        pincode,
        highest_qualification,
        qualification_details,
        university_or_board,
        passing_year,
        percentage_or_cgpa,
        experience_status,
        experience_details,
        declaration_accepted,
        status,
        submitted_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', NOW())
    `;

    const params = [
      appId,
      data.job_id,
      data.candidate_id,
      data.full_name.trim(),
      data.email.toLowerCase().trim(),
      data.mobile_number.trim(),
      data.date_of_birth,
      data.gender,
      data.address_line.trim(),
      data.city.trim(),
      data.district.trim(),
      data.state.trim(),
      data.pincode.trim(),
      data.highest_qualification.trim(),
      data.qualification_details ? data.qualification_details.trim() : null,
      data.university_or_board.trim(),
      parseInt(data.passing_year, 10),
      String(data.percentage_or_cgpa).trim(),
      data.experience_status || 'fresher',
      data.experience_details ? data.experience_details.trim() : null,
      Boolean(data.declaration_accepted),
    ];

    const [result] = await executor.execute(query, params);

    return {
      id: result.insertId,
      application_id: appId,
      job_id: data.job_id,
      candidate_id: data.candidate_id,
      status: 'submitted',
    };
  }

  /**
   * Check if a candidate has already applied for a specific job
   * @param {number} jobId
   * @param {number} candidateId
   * @returns {Promise<Object|null>}
   */
  static async findByJobAndCandidate(jobId, candidateId) {
    const query = `
      SELECT id, application_id, job_id, candidate_id, status, submitted_at
      FROM applications
      WHERE job_id = ? AND candidate_id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [jobId, candidateId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find application by primary ID with joined job and candidate info
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const query = `
      SELECT
        a.id,
        a.application_id,
        a.job_id,
        a.candidate_id,
        a.full_name,
        a.email,
        a.mobile_number,
        a.date_of_birth,
        a.gender,
        a.address_line,
        a.city,
        a.district,
        a.state,
        a.pincode,
        a.highest_qualification,
        a.qualification_details,
        a.university_or_board,
        a.passing_year,
        a.percentage_or_cgpa,
        a.experience_status,
        a.experience_details,
        a.declaration_accepted,
        a.status,
        a.submitted_at,
        a.created_at,
        a.updated_at,
        j.job_code,
        j.title AS job_title,
        j.organization AS job_organization,
        j.department AS job_department,
        j.location AS job_location,
        j.last_date AS job_last_date,
        j.status AS job_status,
        u.full_name AS candidate_account_name,
        u.email AS candidate_account_email
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON a.candidate_id = u.id
      WHERE a.id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id]);
    if (!rows.length) return null;

    const row = rows[0];
    row.date_of_birth = formatDate(row.date_of_birth);
    row.job_last_date = formatDate(row.job_last_date);
    return row;
  }

  /**
   * Find application by human-readable application_id (e.g. APP-2026-XXXXXXXX)
   * @param {string} applicationId
   * @returns {Promise<Object|null>}
   */
  static async findByApplicationId(applicationId) {
    const query = `
      SELECT
        a.id,
        a.application_id,
        a.job_id,
        a.candidate_id,
        a.full_name,
        a.email,
        a.mobile_number,
        a.date_of_birth,
        a.gender,
        a.address_line,
        a.city,
        a.district,
        a.state,
        a.pincode,
        a.highest_qualification,
        a.qualification_details,
        a.university_or_board,
        a.passing_year,
        a.percentage_or_cgpa,
        a.experience_status,
        a.experience_details,
        a.declaration_accepted,
        a.status,
        a.submitted_at,
        a.created_at,
        a.updated_at,
        j.job_code,
        j.title AS job_title,
        j.organization AS job_organization,
        j.department AS job_department,
        j.location AS job_location,
        j.last_date AS job_last_date,
        j.status AS job_status
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.application_id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [applicationId.trim()]);
    if (!rows.length) return null;

    const row = rows[0];
    row.date_of_birth = formatDate(row.date_of_birth);
    row.job_last_date = formatDate(row.job_last_date);
    return row;
  }

  /**
   * Find applications submitted by a specific candidate
   * @param {number} candidateId
   * @param {Object} [options]
   * @param {number} [options.page]
   * @param {number} [options.limit]
   * @param {string} [options.status]
   * @returns {Promise<{ applications: Array, total: number, page: number, limit: number, totalPages: number }>}
   */
  static async findByCandidateId(candidateId, { page = 1, limit = 20, status = '' } = {}) {
    const validPage = Math.max(1, parseInt(page, 10) || 1);
    const validLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (validPage - 1) * validLimit;

    const conditions = ['a.candidate_id = ?'];
    const params = [candidateId];

    if (status && status.trim()) {
      conditions.push('a.status = ?');
      params.push(status.trim().toLowerCase());
    }

    const whereClause = conditions.join(' AND ');

    // Total count
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM applications a
      WHERE ${whereClause}
    `;
    const [countRows] = await pool.execute(countQuery, params);
    const total = countRows[0].total;

    // Fetch records
    const selectQuery = `
      SELECT
        a.id,
        a.application_id,
        a.job_id,
        a.candidate_id,
        a.full_name,
        a.email,
        a.mobile_number,
        a.status,
        a.submitted_at,
        a.created_at,
        j.job_code,
        j.title AS job_title,
        j.organization AS job_organization,
        j.department AS job_department,
        j.location AS job_location,
        j.last_date AS job_last_date
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE ${whereClause}
      ORDER BY a.submitted_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(selectQuery, [...params, validLimit, offset]);

    const applications = rows.map((r) => ({
      ...r,
      job_last_date: formatDate(r.job_last_date),
    }));

    return {
      applications,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit) || 1,
    };
  }

  /**
   * Admin: Find paginated applications with search, status, job, and date filtering
   * @param {Object} options
   * @returns {Promise<{ applications: Array, total: number, page: number, limit: number, totalPages: number }>}
   */
  static async findAllAdmin({
    page = 1,
    limit = 10,
    search = '',
    status = '',
    job_id = null,
    candidate_id = null,
    date_from = null,
    date_to = null,
  } = {}) {
    const validPage = Math.max(1, parseInt(page, 10) || 1);
    const validLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (validPage - 1) * validLimit;

    const conditions = [];
    const params = [];

    // Search across application_id, candidate name, candidate email, phone, job title, job code, org
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(
        '(a.application_id LIKE ? OR a.full_name LIKE ? OR a.email LIKE ? OR a.mobile_number LIKE ? OR j.title LIKE ? OR j.job_code LIKE ? OR j.organization LIKE ?)'
      );
      params.push(term, term, term, term, term, term, term);
    }

    // Status filter
    if (status && status.trim()) {
      conditions.push('a.status = ?');
      params.push(status.trim().toLowerCase());
    }

    // Job ID filter
    if (job_id) {
      conditions.push('a.job_id = ?');
      params.push(parseInt(job_id, 10));
    }

    // Candidate ID filter
    if (candidate_id) {
      conditions.push('a.candidate_id = ?');
      params.push(parseInt(candidate_id, 10));
    }

    // Date range filter on submitted_at
    if (date_from && date_from.trim()) {
      conditions.push('DATE(a.submitted_at) >= ?');
      params.push(date_from.trim());
    }

    if (date_to && date_to.trim()) {
      conditions.push('DATE(a.submitted_at) <= ?');
      params.push(date_to.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON a.candidate_id = u.id
      ${whereClause}
    `;
    const [countRows] = await pool.execute(countQuery, params);
    const total = countRows[0].total;

    const selectQuery = `
      SELECT
        a.id,
        a.application_id,
        a.job_id,
        a.candidate_id,
        a.full_name,
        a.email,
        a.mobile_number,
        a.status,
        a.submitted_at,
        a.created_at,
        a.updated_at,
        j.job_code,
        j.title AS job_title,
        j.organization AS job_organization,
        j.department AS job_department,
        j.location AS job_location,
        u.full_name AS candidate_name,
        u.email AS candidate_email
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON a.candidate_id = u.id
      ${whereClause}
      ORDER BY a.submitted_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(selectQuery, [...params, validLimit, offset]);

    return {
      applications: rows,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit) || 1,
    };
  }

  /**
   * Aggregate statistics for administrative dashboard
   * @returns {Promise<Object>}
   */
  static async getStats() {
    const query = `
      SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) AS submitted,
        COUNT(CASE WHEN status = 'under_review' THEN 1 END) AS under_review,
        COUNT(CASE WHEN status = 'shortlisted' THEN 1 END) AS shortlisted,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected,
        COUNT(CASE WHEN status = 'selected' THEN 1 END) AS selected,
        COUNT(CASE WHEN status = 'withdrawn' THEN 1 END) AS withdrawn
      FROM applications
    `;
    const [rows] = await pool.execute(query);
    const r = rows[0];
    return {
      total: Number(r.total || 0),
      submitted: Number(r.submitted || 0),
      under_review: Number(r.under_review || 0),
      shortlisted: Number(r.shortlisted || 0),
      rejected: Number(r.rejected || 0),
      selected: Number(r.selected || 0),
      withdrawn: Number(r.withdrawn || 0),
    };
  }

  /**
   * Update application status by admin
   * @param {number} id
   * @param {string} newStatus
   * @returns {Promise<boolean>}
   */
  static async updateStatus(id, newStatus) {
    const query = `
      UPDATE applications
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [newStatus, id]);
    return result.affectedRows > 0;
  }

  /**
   * Candidate withdrawal: update status to 'withdrawn' ensuring ownership
   * @param {number} id
   * @param {number} candidateId
   * @returns {Promise<boolean>}
   */
  static async withdraw(id, candidateId) {
    const query = `
      UPDATE applications
      SET status = 'withdrawn', updated_at = NOW()
      WHERE id = ? AND candidate_id = ?
    `;
    const [result] = await pool.execute(query, [id, candidateId]);
    return result.affectedRows > 0;
  }
}

export default ApplicationModel;
