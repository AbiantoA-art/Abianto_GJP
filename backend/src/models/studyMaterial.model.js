import pool from '../config/db.config.js';

class StudyMaterialModel {
  /**
   * Insert a new study material record
   * @param {Object} data
   * @param {Object} [connection]
   * @returns {Promise<number>} Inserted material ID
   */
  static async create(data, connection = null) {
    const executor = connection || pool;
    const query = `
      INSERT INTO study_materials (
        title,
        slug,
        description,
        subject,
        category_id,
        exam_group,
        exam_name,
        recruitment_body,
        year,
        language,
        material_type,
        source_url,
        is_official,
        file_original_name,
        file_stored_name,
        file_path,
        file_mime_type,
        file_size,
        status,
        uploaded_by,
        download_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await executor.query(query, [
      data.title,
      data.slug,
      data.description || null,
      data.subject,
      data.category_id,
      data.exam_group || null,
      data.exam_name || null,
      data.recruitment_body || null,
      data.year || null,
      data.language || 'ENGLISH',
      data.material_type || 'study_material',
      data.source_url || null,
      data.is_official !== undefined ? (data.is_official ? 1 : 0) : 1,
      data.file_original_name || null,
      data.file_stored_name || null,
      data.file_path || null,
      data.file_mime_type || 'application/pdf',
      data.file_size || 0,
      data.status || 'draft',
      data.uploaded_by,
      data.download_count || 0,
    ]);

    return result.insertId;
  }

  /**
   * Find study material by ID with category and user details
   * @param {number} id
   * @param {Object} [connection]
   * @returns {Promise<Object|null>}
   */
  static async findById(id, connection = null) {
    const executor = connection || pool;
    const query = `
      SELECT
        sm.id,
        sm.title,
        sm.slug,
        sm.description,
        sm.subject,
        sm.category_id,
        sm.exam_group,
        sm.exam_name,
        sm.recruitment_body,
        sm.year,
        sm.language,
        jc.name AS category_name,
        jc.slug AS category_slug,
        jc.status AS category_status,
        sm.material_type,
        sm.source_url,
        sm.is_official,
        sm.file_original_name,
        sm.file_stored_name,
        sm.file_path,
        sm.file_mime_type,
        sm.file_size,
        sm.status,
        sm.uploaded_by,
        u.full_name AS uploaded_by_name,
        u.email AS uploaded_by_email,
        sm.download_count,
        sm.created_at,
        sm.updated_at
      FROM study_materials sm
      LEFT JOIN job_categories jc ON sm.category_id = jc.id
      LEFT JOIN users u ON sm.uploaded_by = u.id
      WHERE sm.id = ?
      LIMIT 1
    `;

    const [rows] = await executor.query(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find study material by slug
   * @param {string} slug
   * @param {Object} [connection]
   * @returns {Promise<Object|null>}
   */
  static async findBySlug(slug, connection = null) {
    const executor = connection || pool;
    const query = `
      SELECT
        sm.id,
        sm.title,
        sm.slug,
        sm.description,
        sm.subject,
        sm.category_id,
        sm.exam_group,
        sm.exam_name,
        sm.recruitment_body,
        sm.year,
        sm.language,
        jc.name AS category_name,
        jc.slug AS category_slug,
        jc.status AS category_status,
        sm.material_type,
        sm.source_url,
        sm.is_official,
        sm.file_original_name,
        sm.file_stored_name,
        sm.file_path,
        sm.file_mime_type,
        sm.file_size,
        sm.status,
        sm.uploaded_by,
        u.full_name AS uploaded_by_name,
        u.email AS uploaded_by_email,
        sm.download_count,
        sm.created_at,
        sm.updated_at
      FROM study_materials sm
      LEFT JOIN job_categories jc ON sm.category_id = jc.id
      LEFT JOIN users u ON sm.uploaded_by = u.id
      WHERE sm.slug = ?
      LIMIT 1
    `;

    const [rows] = await executor.query(query, [slug]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Check if a slug already exists
   * @param {string} slug
   * @param {number} [excludeId]
   * @returns {Promise<boolean>}
   */
  static async slugExists(slug, excludeId = null) {
    let query = 'SELECT id FROM study_materials WHERE slug = ?';
    const params = [slug];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }

  /**
   * Query published materials for candidate/public discovery
   * Enforces status = 'published' and category status = 'active'
   */
  static async findPublished({
    page = 1,
    limit = 10,
    search = '',
    material_type = '',
    subject = '',
    category_id = null,
    exam_group = null,
    language = null,
    sort = 'latest',
  }) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (safePage - 1) * safeLimit;

    const whereClauses = [
      "sm.status = 'published'",
      "(jc.status = 'active' OR jc.id IS NULL)",
    ];
    const params = [];

    // Search across title, subject, description, exam_group, category name, exam_name, recruitment_body
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereClauses.push('(sm.title LIKE ? OR sm.subject LIKE ? OR sm.description LIKE ? OR sm.exam_group LIKE ? OR jc.name LIKE ? OR sm.exam_name LIKE ? OR sm.recruitment_body LIKE ?)');
      params.push(term, term, term, term, term, term, term);
    }

    // Filter by material_type
    const allowedTypes = ['study_material', 'syllabus', 'exam_pattern', 'question_paper', 'notification', 'answer_key', 'current_affairs', 'practice_material'];
    if (material_type && allowedTypes.includes(material_type)) {
      whereClauses.push('sm.material_type = ?');
      params.push(material_type);
    }

    // Filter by exam_group
    if (exam_group && ['GROUP_1', 'GROUP_2', 'GROUP_2A', 'GROUP_3', 'GROUP_4'].includes(exam_group)) {
      whereClauses.push('sm.exam_group = ?');
      params.push(exam_group);
    }

    // Filter by language
    if (language && ['TAMIL', 'ENGLISH', 'BILINGUAL'].includes(language)) {
      whereClauses.push('sm.language = ?');
      params.push(language);
    }

    // Filter by subject
    if (subject && subject.trim()) {
      whereClauses.push('sm.subject = ?');
      params.push(subject.trim());
    }

    // Filter by category_id
    if (category_id) {
      whereClauses.push('sm.category_id = ?');
      params.push(parseInt(category_id, 10));
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Whitelist sorting
    let orderSQL = 'ORDER BY sm.created_at DESC';
    switch (sort) {
      case 'oldest':
        orderSQL = 'ORDER BY sm.created_at ASC';
        break;
      case 'downloads_high':
        orderSQL = 'ORDER BY sm.download_count DESC, sm.created_at DESC';
        break;
      case 'downloads_low':
        orderSQL = 'ORDER BY sm.download_count ASC, sm.created_at DESC';
        break;
      case 'title_az':
        orderSQL = 'ORDER BY sm.title ASC';
        break;
      case 'title_za':
        orderSQL = 'ORDER BY sm.title DESC';
        break;
      case 'latest':
      default:
        orderSQL = 'ORDER BY sm.created_at DESC';
        break;
    }

    // Count total matching records
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM study_materials sm
      LEFT JOIN job_categories jc ON sm.category_id = jc.id
      ${whereSQL}
    `;
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0].total;

    // Fetch paginated records
    const dataQuery = `
      SELECT
        sm.id,
        sm.title,
        sm.slug,
        sm.description,
        sm.subject,
        sm.category_id,
        sm.exam_group,
        sm.exam_name,
        sm.recruitment_body,
        sm.year,
        sm.language,
        jc.name AS category_name,
        jc.slug AS category_slug,
        sm.material_type,
        sm.source_url,
        sm.is_official,
        sm.file_original_name,
        sm.file_mime_type,
        sm.file_size,
        sm.download_count,
        sm.created_at,
        sm.updated_at
      FROM study_materials sm
      LEFT JOIN job_categories jc ON sm.category_id = jc.id
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
   * Admin query: retrieve all materials including draft and archived
   */
  static async findAllAdmin({
    page = 1,
    limit = 10,
    search = '',
    material_type = '',
    subject = '',
    category_id = null,
    exam_group = null,
    language = null,
    status = '',
    sort = 'latest',
  }) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (safePage - 1) * safeLimit;

    const whereClauses = [];
    const params = [];

    // Search
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereClauses.push('(sm.title LIKE ? OR sm.subject LIKE ? OR sm.description LIKE ? OR sm.exam_group LIKE ? OR jc.name LIKE ? OR sm.exam_name LIKE ? OR sm.recruitment_body LIKE ?)');
      params.push(term, term, term, term, term, term, term);
    }

    // Material type
    const allowedTypes = ['study_material', 'syllabus', 'exam_pattern', 'question_paper', 'notification', 'answer_key', 'current_affairs', 'practice_material'];
    if (material_type && allowedTypes.includes(material_type)) {
      whereClauses.push('sm.material_type = ?');
      params.push(material_type);
    }

    // Exam group
    if (exam_group && ['GROUP_1', 'GROUP_2', 'GROUP_2A', 'GROUP_3', 'GROUP_4'].includes(exam_group)) {
      whereClauses.push('sm.exam_group = ?');
      params.push(exam_group);
    }

    // Language
    if (language && ['TAMIL', 'ENGLISH', 'BILINGUAL'].includes(language)) {
      whereClauses.push('sm.language = ?');
      params.push(language);
    }

    // Subject
    if (subject && subject.trim()) {
      whereClauses.push('sm.subject = ?');
      params.push(subject.trim());
    }

    // Category
    if (category_id) {
      whereClauses.push('sm.category_id = ?');
      params.push(parseInt(category_id, 10));
    }

    // Status filter
    if (status && ['draft', 'published', 'archived'].includes(status)) {
      whereClauses.push('sm.status = ?');
      params.push(status);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Whitelist sorting
    let orderSQL = 'ORDER BY sm.created_at DESC';
    switch (sort) {
      case 'oldest':
        orderSQL = 'ORDER BY sm.created_at ASC';
        break;
      case 'downloads_high':
        orderSQL = 'ORDER BY sm.download_count DESC, sm.created_at DESC';
        break;
      case 'downloads_low':
        orderSQL = 'ORDER BY sm.download_count ASC, sm.created_at DESC';
        break;
      case 'title_az':
        orderSQL = 'ORDER BY sm.title ASC';
        break;
      case 'title_za':
        orderSQL = 'ORDER BY sm.title DESC';
        break;
      case 'latest':
      default:
        orderSQL = 'ORDER BY sm.created_at DESC';
        break;
    }

    // Count
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM study_materials sm
      LEFT JOIN job_categories jc ON sm.category_id = jc.id
      ${whereSQL}
    `;
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0].total;

    // Fetch data
    const dataQuery = `
      SELECT
        sm.id,
        sm.title,
        sm.slug,
        sm.description,
        sm.subject,
        sm.category_id,
        sm.exam_group,
        sm.exam_name,
        sm.recruitment_body,
        sm.year,
        sm.language,
        jc.name AS category_name,
        jc.slug AS category_slug,
        jc.status AS category_status,
        sm.material_type,
        sm.source_url,
        sm.is_official,
        sm.file_original_name,
        sm.file_stored_name,
        sm.file_path,
        sm.file_mime_type,
        sm.file_size,
        sm.status,
        sm.uploaded_by,
        u.full_name AS uploaded_by_name,
        u.email AS uploaded_by_email,
        sm.download_count,
        sm.created_at,
        sm.updated_at
      FROM study_materials sm
      LEFT JOIN job_categories jc ON sm.category_id = jc.id
      LEFT JOIN users u ON sm.uploaded_by = u.id
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
   * Get administrative statistics for study materials & syllabus
   * @returns {Promise<Object>}
   */
  static async getStats() {
    const query = `
      SELECT
        COUNT(*) AS total_resources,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published_count,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft_count,
        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) AS archived_count,
        SUM(CASE WHEN material_type = 'study_material' THEN 1 ELSE 0 END) AS study_material_count,
        SUM(CASE WHEN material_type = 'syllabus' THEN 1 ELSE 0 END) AS syllabus_count,
        COALESCE(SUM(download_count), 0) AS total_downloads
      FROM study_materials
    `;

    const [rows] = await pool.query(query);
    const r = rows[0] || {};

    return {
      total: Number(r.total_resources) || 0,
      published: Number(r.published_count) || 0,
      draft: Number(r.draft_count) || 0,
      archived: Number(r.archived_count) || 0,
      studyMaterials: Number(r.study_material_count) || 0,
      syllabus: Number(r.syllabus_count) || 0,
      totalDownloads: Number(r.total_downloads) || 0,
    };
  }

  /**
   * Update study material metadata
   * @param {number} id
   * @param {Object} data
   * @param {Object} [connection]
   */
  static async update(id, data, connection = null) {
    const executor = connection || pool;
    const fields = [];
    const params = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      params.push(data.title);
    }
    if (data.slug !== undefined) {
      fields.push('slug = ?');
      params.push(data.slug);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      params.push(data.description);
    }
    if (data.subject !== undefined) {
      fields.push('subject = ?');
      params.push(data.subject);
    }
    if (data.category_id !== undefined) {
      fields.push('category_id = ?');
      params.push(data.category_id);
    }
    if (data.material_type !== undefined) {
      fields.push('material_type = ?');
      params.push(data.material_type);
    }
    if (data.exam_group !== undefined) {
      fields.push('exam_group = ?');
      params.push(data.exam_group);
    }
    if (data.exam_name !== undefined) {
      fields.push('exam_name = ?');
      params.push(data.exam_name);
    }
    if (data.recruitment_body !== undefined) {
      fields.push('recruitment_body = ?');
      params.push(data.recruitment_body);
    }
    if (data.year !== undefined) {
      fields.push('year = ?');
      params.push(data.year);
    }
    if (data.language !== undefined) {
      fields.push('language = ?');
      params.push(data.language);
    }
    if (data.source_url !== undefined) {
      fields.push('source_url = ?');
      params.push(data.source_url);
    }
    if (data.is_official !== undefined) {
      fields.push('is_official = ?');
      params.push(data.is_official ? 1 : 0);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      params.push(data.status);
    }

    if (fields.length === 0) return false;

    const query = `UPDATE study_materials SET ${fields.join(', ')} WHERE id = ?`;
    params.push(id);

    const [result] = await executor.query(query, params);
    return result.affectedRows > 0;
  }

  /**
   * Update status of material
   * @param {number} id
   * @param {string} status
   * @param {Object} [connection]
   */
  static async updateStatus(id, status, connection = null) {
    const executor = connection || pool;
    const query = 'UPDATE study_materials SET status = ? WHERE id = ?';
    const [result] = await executor.query(query, [status, id]);
    return result.affectedRows > 0;
  }

  /**
   * Update uploaded file metadata
   * @param {number} id
   * @param {Object} fileData
   * @param {Object} [connection]
   */
  static async updateFile(id, fileData, connection = null) {
    const executor = connection || pool;
    const query = `
      UPDATE study_materials
      SET
        file_original_name = ?,
        file_stored_name = ?,
        file_path = ?,
        file_mime_type = ?,
        file_size = ?
      WHERE id = ?
    `;

    const [result] = await executor.query(query, [
      fileData.file_original_name,
      fileData.file_stored_name,
      fileData.file_path,
      fileData.file_mime_type,
      fileData.file_size,
      id,
    ]);

    return result.affectedRows > 0;
  }

  /**
   * Increment download count atomically
   * @param {number} id
   * @param {Object} [connection]
   */
  static async incrementDownloadCount(id, connection = null) {
    const executor = connection || pool;
    const query = 'UPDATE study_materials SET download_count = download_count + 1 WHERE id = ?';
    const [result] = await executor.query(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Safe archive (soft delete)
   * @param {number} id
   * @param {Object} [connection]
   */
  static async archive(id, connection = null) {
    return this.updateStatus(id, 'archived', connection);
  }
}

export default StudyMaterialModel;
