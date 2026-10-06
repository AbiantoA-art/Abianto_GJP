import pool from '../config/db.config.js';

/**
 * Safely format MySQL DATE column as YYYY-MM-DD string without UTC timezone shift
 * @param {Date|string|null} val
 * @returns {string|null}
 */
export const formatDate = (val) => {
  if (!val) return null;
  if (typeof val === 'string') return val.split('T')[0];
  if (val instanceof Date) {
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(val);
};

/**
 * Government Job Entity Data Access Model
 * Implements parameterized queries for SQL safety.
 */
export class JobModel {
  /**
   * Find paginated published government jobs with search, filtering, and sorting
   * Strictly enforces status = 'published' and category status = 'active'
   * @param {Object} options
   * @param {number} options.page Page number (1-based)
   * @param {number} options.limit Number of items per page
   * @param {string} [options.search] Search keyword across title, org, dept, code, loc, qual, desc
   * @param {number} [options.category_id] Filter by job category ID
   * @param {string} [options.location] Filter by location (partial match)
   * @param {string} [options.organization] Filter by organization (partial match)
   * @param {string} [options.department] Filter by department (partial match)
   * @param {string} [options.opening_date_from] Filter opening_date >= date
   * @param {string} [options.opening_date_to] Filter opening_date <= date
   * @param {string} [options.last_date_from] Filter last_date >= date
   * @param {string} [options.last_date_to] Filter last_date <= date
   * @param {string} [options.sort] Sort option: 'latest', 'oldest', 'deadline_soon', 'deadline_latest', 'vacancies_high', 'vacancies_low'
   * @returns {Promise<{ jobs: Array, total: number, page: number, limit: number, totalPages: number }>}
   */
  static async findPublished({
    page = 1,
    limit = 10,
    search = '',
    category_id = null,
    job_group = null,
    location = '',
    organization = '',
    department = '',
    opening_date_from = null,
    opening_date_to = null,
    last_date_from = null,
    last_date_to = null,
    sort = 'latest',
  } = {}) {
    const validPage = Math.max(1, parseInt(page, 10) || 1);
    const validLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (validPage - 1) * validLimit;

    // Base conditions: candidate API strictly enforces published jobs and active categories
    const conditions = ["j.status = 'published'", "c.status = 'active'"];
    const params = [];

    // 1. Comprehensive multi-field, multi-token normalized search
    if (search && String(search).trim()) {
      const normalizedSearch = String(search).trim().replace(/\s+/g, ' ');
      const tokens = normalizedSearch.split(' ').filter(Boolean);

      const getStemTerms = (token) => {
        const lower = token.toLowerCase();
        const stems = [lower];
        if (lower.startsWith('teach')) stems.push('teach', 'teacher', 'teaching');
        if (lower.startsWith('bank')) stems.push('bank', 'banking');
        if (lower.startsWith('railway')) stems.push('railway', 'railways');
        if (lower.startsWith('engine')) stems.push('engineer', 'engineering');
        if (lower.startsWith('post')) stems.push('post', 'postal');
        if (lower.startsWith('police')) stems.push('police');
        if (lower.startsWith('defen')) stems.push('defence', 'defense');
        if (lower.startsWith('medic') || lower === 'doctor') stems.push('medic', 'medical', 'doctor', 'surgeon');
        if (lower.startsWith('electr')) stems.push('electr', 'electricity');
        if (lower.startsWith('forest')) stems.push('forest');
        if (lower.startsWith('court') || lower.startsWith('judic')) stems.push('court', 'judic', 'judiciary');
        if (lower.startsWith('apprentice')) stems.push('apprentice');
        if (lower.startsWith('tnpsc')) stems.push('tnpsc');
        if (lower.startsWith('upsc')) stems.push('upsc');
        if (lower.startsWith('ssc')) stems.push('ssc');
        return Array.from(new Set(stems));
      };

      if (tokens.length > 0) {
        tokens.forEach((token) => {
          const termPattern = `%${token}%`;
          const stems = getStemTerms(token);
          const subConditions = [
            'j.job_code LIKE ?',
            'j.title LIKE ?',
            'j.organization LIKE ?',
            'j.department LIKE ?',
            'j.location LIKE ?',
            'j.qualification LIKE ?',
            'j.description LIKE ?',
            'c.name LIKE ?',
            'c.slug LIKE ?',
            'j.job_group LIKE ?',
            'j.exam_name LIKE ?',
            'j.recruitment_body LIKE ?',
          ];
          const subParams = [
            termPattern, termPattern, termPattern, termPattern,
            termPattern, termPattern, termPattern, termPattern,
            termPattern, termPattern, termPattern, termPattern,
          ];

          for (const stem of stems) {
            if (stem !== token.toLowerCase()) {
              const stemPattern = `%${stem}%`;
              subConditions.push(
                'j.title LIKE ?',
                'c.name LIKE ?',
                'c.slug LIKE ?',
                'j.organization LIKE ?',
                'j.department LIKE ?',
                'j.qualification LIKE ?'
              );
              subParams.push(stemPattern, stemPattern, stemPattern, stemPattern, stemPattern, stemPattern);
            }
          }

          conditions.push(`(${subConditions.join(' OR ')})`);
          params.push(...subParams);
        });
      }
    }

    // 2. Category filter (supports numeric category_id or name/slug)
    if (category_id && String(category_id).trim() && String(category_id).trim().toLowerCase() !== 'all') {
      const catVal = String(category_id).trim();
      if (/^\d+$/.test(catVal)) {
        conditions.push('j.category_id = ?');
        params.push(parseInt(catVal, 10));
      } else {
        const catLower = catVal.toLowerCase();
        conditions.push('(LOWER(c.slug) = ? OR LOWER(c.name) = ?)');
        params.push(catLower, catLower);
      }
    }

    // 2b. Job Group filter (strictly maintains Group 2 and Group 2A separation)
    if (job_group && String(job_group).trim() && String(job_group).trim().toUpperCase() !== 'ALL') {
      conditions.push('j.job_group = ?');
      params.push(String(job_group).trim().toUpperCase());
    }

    // 3. Location filter (partial match)
    if (location && location.trim()) {
      conditions.push('j.location LIKE ?');
      params.push(`%${location.trim()}%`);
    }

    // 4. Organization filter (partial match)
    if (organization && organization.trim()) {
      conditions.push('j.organization LIKE ?');
      params.push(`%${organization.trim()}%`);
    }

    // 5. Department filter (partial match)
    if (department && department.trim()) {
      conditions.push('j.department LIKE ?');
      params.push(`%${department.trim()}%`);
    }

    // 6. Opening date range filters
    if (opening_date_from && opening_date_from.trim()) {
      conditions.push('j.opening_date >= ?');
      params.push(opening_date_from.trim());
    }
    if (opening_date_to && opening_date_to.trim()) {
      conditions.push('j.opening_date <= ?');
      params.push(opening_date_to.trim());
    }

    // 7. Last date (deadline) range filters
    if (last_date_from && last_date_from.trim()) {
      conditions.push('j.last_date >= ?');
      params.push(last_date_from.trim());
    }
    if (last_date_to && last_date_to.trim()) {
      conditions.push('j.last_date <= ?');
      params.push(last_date_to.trim());
    }

    const whereClause = conditions.join(' AND ');

    // 8. Sorting mapping with SQL injection guard
    let orderByClause = 'ORDER BY j.opening_date DESC, j.id DESC';
    switch (sort) {
      case 'oldest':
        orderByClause = 'ORDER BY j.opening_date ASC, j.id ASC';
        break;
      case 'deadline_soon':
        orderByClause = 'ORDER BY j.last_date ASC, j.id ASC';
        break;
      case 'deadline_latest':
        orderByClause = 'ORDER BY j.last_date DESC, j.id DESC';
        break;
      case 'vacancies_high':
        orderByClause = 'ORDER BY j.vacancies DESC, j.id DESC';
        break;
      case 'vacancies_low':
        orderByClause = 'ORDER BY j.vacancies ASC, j.id ASC';
        break;
      case 'latest':
      default:
        orderByClause = 'ORDER BY j.opening_date DESC, j.id DESC';
        break;
    }

    // 9. Count total matching published jobs
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM jobs j
      INNER JOIN job_categories c ON j.category_id = c.id
      WHERE ${whereClause}
    `;
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0]?.total || 0;
    const totalPages = total > 0 ? Math.ceil(total / validLimit) : 0;

    // 10. Query paginated matching published jobs
    const selectQuery = `
      SELECT 
        j.id,
        j.job_code,
        j.title,
        j.organization,
        j.department,
        j.category_id,
        j.job_group,
        j.exam_name,
        j.recruitment_body,
        c.name AS category_name,
        c.slug AS category_slug,
        j.description,
        j.vacancies,
        j.qualification,
        j.age_limit,
        j.salary,
        j.location,
        j.experience,
        j.application_fee,
        j.opening_date,
        j.last_date,
        j.selection_process,
        j.required_documents,
        j.notification_url,
        j.apply_url,
        j.status,
        j.created_at,
        j.updated_at
      FROM jobs j
      INNER JOIN job_categories c ON j.category_id = c.id
      WHERE ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(selectQuery, [...params, validLimit, offset]);

    // Format rows to include structured category object and ISO date strings
    const jobs = rows.map((row) => ({
      id: row.id,
      job_code: row.job_code,
      title: row.title,
      organization: row.organization,
      department: row.department,
      category_id: row.category_id,
      job_group: row.job_group || null,
      exam_name: row.exam_name || null,
      recruitment_body: row.recruitment_body || null,
      category: {
        id: row.category_id,
        name: row.category_name,
        slug: row.category_slug,
      },
      description: row.description,
      vacancies: row.vacancies,
      qualification: row.qualification,
      age_limit: row.age_limit,
      salary: row.salary,
      location: row.location,
      experience: row.experience,
      application_fee: row.application_fee,
      opening_date: formatDate(row.opening_date),
      last_date: formatDate(row.last_date),
      selection_process: row.selection_process,
      required_documents: row.required_documents,
      notification_url: row.notification_url,
      apply_url: row.apply_url,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return {
      jobs,
      total,
      page: validPage,
      limit: validLimit,
      totalPages,
    };
  }

  /**
   * Find a single published government job by primary ID
   * Excludes draft, closed, expired, or archived jobs from public lookup
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  static async findPublishedById(id) {
    const query = `
      SELECT 
        j.id,
        j.job_code,
        j.title,
        j.organization,
        j.department,
        j.category_id,
        j.job_group,
        j.exam_name,
        j.recruitment_body,
        c.name AS category_name,
        c.slug AS category_slug,
        c.description AS category_description,
        j.description,
        j.vacancies,
        j.qualification,
        j.age_limit,
        j.salary,
        j.location,
        j.experience,
        j.application_fee,
        j.opening_date,
        j.last_date,
        j.selection_process,
        j.required_documents,
        j.notification_url,
        j.apply_url,
        j.status,
        j.created_at,
        j.updated_at
      FROM jobs j
      INNER JOIN job_categories c ON j.category_id = c.id
      WHERE j.id = ? AND j.status = 'published' AND c.status = 'active'
      LIMIT 1
    `;

    const [rows] = await pool.execute(query, [id]);
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      job_code: row.job_code,
      title: row.title,
      organization: row.organization,
      department: row.department,
      category_id: row.category_id,
      job_group: row.job_group || null,
      exam_name: row.exam_name || null,
      recruitment_body: row.recruitment_body || null,
      category: {
        id: row.category_id,
        name: row.category_name,
        slug: row.category_slug,
        description: row.category_description,
      },
      description: row.description,
      vacancies: row.vacancies,
      qualification: row.qualification,
      age_limit: row.age_limit,
      salary: row.salary,
      location: row.location,
      experience: row.experience,
      application_fee: row.application_fee,
      opening_date: formatDate(row.opening_date),
      last_date: formatDate(row.last_date),
      selection_process: row.selection_process,
      required_documents: row.required_documents,
      notification_url: row.notification_url,
      apply_url: row.apply_url,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Find any job by ID (regardless of status - used internally or by admin)
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const query = `
      SELECT j.*, c.name AS category_name, c.slug AS category_slug
      FROM jobs j
      LEFT JOIN job_categories c ON j.category_id = c.id
      WHERE j.id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Create a new government job record
   * @param {Object} jobData
   * @returns {Promise<Object>}
   */
  static async create({
    job_code,
    title,
    organization,
    department = null,
    category_id,
    job_group = null,
    description = null,
    vacancies = 0,
    qualification = null,
    age_limit = null,
    salary = null,
    location = null,
    experience = null,
    application_fee = null,
    opening_date = null,
    last_date = null,
    selection_process = null,
    required_documents = null,
    notification_url = null,
    apply_url = null,
    status = 'draft',
    created_by,
  }) {
    const query = `
      INSERT INTO jobs (
        job_code, title, organization, department, category_id, job_group,
        description, vacancies, qualification, age_limit, salary,
        location, experience, application_fee, opening_date, last_date,
        selection_process, required_documents, notification_url, apply_url,
        status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      job_code,
      title,
      organization,
      department,
      category_id,
      job_group,
      description,
      vacancies,
      qualification,
      age_limit,
      salary,
      location,
      experience,
      application_fee,
      opening_date,
      last_date,
      selection_process,
      required_documents,
      notification_url,
      apply_url,
      status,
      created_by,
    ];

    const [result] = await pool.execute(query, params);
    return {
      id: result.insertId,
      job_code,
      title,
      organization,
      job_group,
      status,
    };
  }

  /**
   * Delete a job by primary ID (Used for automated test cleanup)
   * @param {number|string} id
   * @returns {Promise<boolean>}
   */
  static async deleteById(id) {
    const [result] = await pool.execute('DELETE FROM jobs WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * Count total jobs in the database
   * @returns {Promise<number>}
   */
  static async count() {
    const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM jobs');
    return rows[0].total || 0;
  }

  /**
   * Find job by unique job_code
   * @param {string} job_code
   * @returns {Promise<Object|null>}
   */
  static async findByJobCode(job_code) {
    const query = 'SELECT * FROM jobs WHERE job_code = ? LIMIT 1';
    const [rows] = await pool.execute(query, [job_code]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find paginated jobs for administrative console with optional status & search filtering
   * @param {Object} options
   * @param {number} options.page Page number (1-based)
   * @param {number} options.limit Number of items per page
   * @param {string} options.status Filter by status
   * @param {string} options.search Search keyword in title, organization, or job_code
   * @param {number} options.category_id Filter by category ID
   * @returns {Promise<{ jobs: Array, total: number, page: number, limit: number, totalPages: number }>}
   */
  static async findAllAdmin({ page = 1, limit = 10, status = '', search = '', category_id = null, job_group = null }) {
    const validPage = Math.max(1, parseInt(page, 10) || 1);
    const validLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (validPage - 1) * validLimit;

    const conditions = [];
    const params = [];

    if (status && ['draft', 'published', 'closed', 'expired', 'archived'].includes(status.toLowerCase())) {
      conditions.push('j.status = ?');
      params.push(status.toLowerCase());
    }

    if (category_id) {
      conditions.push('j.category_id = ?');
      params.push(parseInt(category_id, 10));
    }

    if (job_group && String(job_group).trim()) {
      conditions.push('j.job_group = ?');
      params.push(String(job_group).trim().toUpperCase());
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push('(j.title LIKE ? OR j.organization LIKE ? OR j.job_code LIKE ?)');
      params.push(term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 1. Get filtered total count
    const countQuery = `SELECT COUNT(*) AS total FROM jobs j ${whereClause}`;
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0].total || 0;
    const totalPages = total > 0 ? Math.ceil(total / validLimit) : 0;

    // 2. Query paginated results with category and creator details
    const selectQuery = `
      SELECT 
        j.id,
        j.job_code,
        j.title,
        j.organization,
        j.department,
        j.category_id,
        j.job_group,
        j.exam_name,
        j.recruitment_body,
        c.name AS category_name,
        c.slug AS category_slug,
        j.description,
        j.vacancies,
        j.qualification,
        j.age_limit,
        j.salary,
        j.location,
        j.experience,
        j.application_fee,
        j.opening_date,
        j.last_date,
        j.selection_process,
        j.required_documents,
        j.notification_url,
        j.apply_url,
        j.status,
        j.created_by,
        u.full_name AS creator_name,
        u.email AS creator_email,
        j.created_at,
        j.updated_at
      FROM jobs j
      LEFT JOIN job_categories c ON j.category_id = c.id
      LEFT JOIN users u ON j.created_by = u.id
      ${whereClause}
      ORDER BY j.created_at DESC, j.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(selectQuery, [...params, validLimit, offset]);

    const jobs = rows.map((row) => ({
      id: row.id,
      job_code: row.job_code,
      title: row.title,
      organization: row.organization,
      department: row.department,
      category_id: row.category_id,
      job_group: row.job_group || null,
      exam_name: row.exam_name || null,
      recruitment_body: row.recruitment_body || null,
      category: {
        id: row.category_id,
        name: row.category_name,
        slug: row.category_slug,
      },
      description: row.description,
      vacancies: row.vacancies,
      qualification: row.qualification,
      age_limit: row.age_limit,
      salary: row.salary,
      location: row.location,
      experience: row.experience,
      application_fee: row.application_fee,
      opening_date: formatDate(row.opening_date),
      last_date: formatDate(row.last_date),
      selection_process: row.selection_process,
      required_documents: row.required_documents,
      notification_url: row.notification_url,
      apply_url: row.apply_url,
      status: row.status,
      created_by: row.created_by,
      creator: {
        id: row.created_by,
        name: row.creator_name,
        email: row.creator_email,
      },
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return {
      jobs,
      total,
      page: validPage,
      limit: validLimit,
      totalPages,
    };
  }

  /**
   * Retrieve a single job by ID for administrative inspection (any status)
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  static async findAdminById(id) {
    const query = `
      SELECT 
        j.id,
        j.job_code,
        j.title,
        j.organization,
        j.department,
        j.category_id,
        j.job_group,
        j.exam_name,
        j.recruitment_body,
        c.name AS category_name,
        c.slug AS category_slug,
        c.description AS category_description,
        j.description,
        j.vacancies,
        j.qualification,
        j.age_limit,
        j.salary,
        j.location,
        j.experience,
        j.application_fee,
        j.opening_date,
        j.last_date,
        j.selection_process,
        j.required_documents,
        j.notification_url,
        j.apply_url,
        j.status,
        j.created_by,
        u.full_name AS creator_name,
        u.email AS creator_email,
        j.created_at,
        j.updated_at
      FROM jobs j
      LEFT JOIN job_categories c ON j.category_id = c.id
      LEFT JOIN users u ON j.created_by = u.id
      WHERE j.id = ?
      LIMIT 1
    `;

    const [rows] = await pool.execute(query, [id]);
    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      job_code: row.job_code,
      title: row.title,
      organization: row.organization,
      department: row.department,
      category_id: row.category_id,
      job_group: row.job_group || null,
      exam_name: row.exam_name || null,
      recruitment_body: row.recruitment_body || null,
      category: {
        id: row.category_id,
        name: row.category_name,
        slug: row.category_slug,
        description: row.category_description,
      },
      description: row.description,
      vacancies: row.vacancies,
      qualification: row.qualification,
      age_limit: row.age_limit,
      salary: row.salary,
      location: row.location,
      experience: row.experience,
      application_fee: row.application_fee,
      opening_date: formatDate(row.opening_date),
      last_date: formatDate(row.last_date),
      selection_process: row.selection_process,
      required_documents: row.required_documents,
      notification_url: row.notification_url,
      apply_url: row.apply_url,
      status: row.status,
      created_by: row.created_by,
      creator: {
        id: row.created_by,
        name: row.creator_name,
        email: row.creator_email,
      },
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Update an existing government job record
   * Preserves id, created_by, and created_at. Automatically updates updated_at.
   * @param {number|string} id
   * @param {Object} jobData
   * @returns {Promise<boolean>}
   */
  static async update(id, {
    job_code,
    title,
    organization,
    department = null,
    category_id,
    job_group = null,
    description = null,
    vacancies = 0,
    qualification = null,
    age_limit = null,
    salary = null,
    location = null,
    experience = null,
    application_fee = null,
    opening_date = null,
    last_date = null,
    selection_process = null,
    required_documents = null,
    notification_url = null,
    apply_url = null,
    status = 'draft',
  }) {
    const query = `
      UPDATE jobs SET
        job_code = ?,
        title = ?,
        organization = ?,
        department = ?,
        category_id = ?,
        job_group = ?,
        description = ?,
        vacancies = ?,
        qualification = ?,
        age_limit = ?,
        salary = ?,
        location = ?,
        experience = ?,
        application_fee = ?,
        opening_date = ?,
        last_date = ?,
        selection_process = ?,
        required_documents = ?,
        notification_url = ?,
        apply_url = ?,
        status = ?
      WHERE id = ?
    `;

    const params = [
      job_code,
      title,
      organization,
      department,
      category_id,
      job_group,
      description,
      vacancies,
      qualification,
      age_limit,
      salary,
      location,
      experience,
      application_fee,
      opening_date,
      last_date,
      selection_process,
      required_documents,
      notification_url,
      apply_url,
      status,
      id,
    ];

    const [result] = await pool.execute(query, params);
    return result.affectedRows > 0;
  }

  /**
   * Update only the status of a job
   * @param {number|string} id
   * @param {string} status
   * @returns {Promise<boolean>}
   */
  static async updateStatus(id, status) {
    const [result] = await pool.execute(
      'UPDATE jobs SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Non-destructively archive a job (Safe Delete)
   * @param {number|string} id
   * @returns {Promise<boolean>}
   */
  static async archive(id) {
    const [result] = await pool.execute(
      "UPDATE jobs SET status = 'archived' WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Get job counts by status for administrative metrics
   * @returns {Promise<{ total: number, draft: number, published: number, closed: number, expired: number, archived: number }>}
   */
  static async getStatistics() {
    const query = `
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) AS expired,
        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) AS archived
      FROM jobs
    `;
    const [rows] = await pool.execute(query);
    const row = rows[0] || {};
    return {
      total: Number(row.total) || 0,
      draft: Number(row.draft) || 0,
      published: Number(row.published) || 0,
      closed: Number(row.closed) || 0,
      expired: Number(row.expired) || 0,
      archived: Number(row.archived) || 0,
    };
  }
}

export default JobModel;
