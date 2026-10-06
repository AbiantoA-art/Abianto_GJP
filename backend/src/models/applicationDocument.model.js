import pool from '../config/db.config.js';

/**
 * Application Document Entity Data Access Model
 * Manages candidate uploaded files attached to applications.
 */
export class ApplicationDocumentModel {
  /**
   * Create document record within an optional transaction connection
   * @param {Object} docData
   * @param {import('mysql2/promise').PoolConnection} [connection]
   * @returns {Promise<Object>}
   */
  static async create(
    {
      application_id,
      document_type,
      original_filename,
      stored_filename,
      file_path,
      mime_type,
      file_size,
    },
    connection = null
  ) {
    const executor = connection || pool;
    const query = `
      INSERT INTO application_documents (
        application_id,
        document_type,
        original_filename,
        stored_filename,
        file_path,
        mime_type,
        file_size
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      application_id,
      document_type,
      original_filename,
      stored_filename,
      file_path,
      mime_type,
      file_size,
    ];

    const [result] = await executor.execute(query, params);

    return {
      id: result.insertId,
      application_id,
      document_type,
      original_filename,
      stored_filename,
      file_path,
      mime_type,
      file_size,
    };
  }

  /**
   * Find all documents for a specific application
   * @param {number} applicationId Primary ID of the application
   * @returns {Promise<Array>}
   */
  static async findByApplicationId(applicationId) {
    const query = `
      SELECT
        id,
        application_id,
        document_type,
        original_filename,
        stored_filename,
        file_path,
        mime_type,
        file_size,
        created_at
      FROM application_documents
      WHERE application_id = ?
      ORDER BY id ASC
    `;
    const [rows] = await pool.execute(query, [applicationId]);
    return rows;
  }

  /**
   * Find document by primary ID, including parent application ownership info
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const query = `
      SELECT
        d.id,
        d.application_id,
        d.document_type,
        d.original_filename,
        d.stored_filename,
        d.file_path,
        d.mime_type,
        d.file_size,
        d.created_at,
        a.candidate_id,
        a.application_id AS application_number,
        a.status AS application_status
      FROM application_documents d
      JOIN applications a ON d.application_id = a.id
      WHERE d.id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Delete document by ID (if needed for rollback or cleanup)
   * @param {number} id
   * @param {import('mysql2/promise').PoolConnection} [connection]
   */
  static async deleteById(id, connection = null) {
    const executor = connection || pool;
    const query = 'DELETE FROM application_documents WHERE id = ?';
    await executor.execute(query, [id]);
  }
}

export default ApplicationDocumentModel;
