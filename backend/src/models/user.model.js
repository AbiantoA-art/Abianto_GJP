import pool from '../config/db.config.js';

/**
 * User Entity Data Access Model
 * Implements parameterized queries for SQL safety.
 */
export class UserModel {
  /**
   * Create a new user record (Candidate or Admin)
   * @param {Object} userData
   * @returns {Promise<Object>} Created user record without password_hash
   */
  static async create({ full_name, email, date_of_birth = null, mobile_number = null, password_hash, role = 'candidate', status = 'active' }) {
    const normalizedEmail = email.toLowerCase().trim();
    const query = `
      INSERT INTO users (full_name, email, date_of_birth, mobile_number, password_hash, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      full_name.trim(),
      normalizedEmail,
      date_of_birth || null,
      mobile_number ? mobile_number.trim() : null,
      password_hash,
      role,
      status,
    ];

    const [result] = await pool.execute(query, params);

    return {
      id: result.insertId,
      full_name: full_name.trim(),
      email: normalizedEmail,
      date_of_birth: date_of_birth || null,
      mobile_number: mobile_number ? mobile_number.trim() : null,
      role,
      status,
    };
  }

  /**
   * Find user by email (includes password_hash for credential verification)
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  static async findByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const query = `
      SELECT id, full_name, email, date_of_birth, mobile_number, password_hash, role, status, created_at, updated_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [normalizedEmail]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find user by primary ID (safe - excludes password_hash)
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const query = `
      SELECT id, full_name, email, date_of_birth, mobile_number, role, status, created_at, updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Check if an email address already exists
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  static async emailExists(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const query = `SELECT id FROM users WHERE email = ? LIMIT 1`;
    const [rows] = await pool.execute(query, [normalizedEmail]);
    return rows.length > 0;
  }

  /**
   * Count total registered users
   * @returns {Promise<number>}
   */
  static async count() {
    const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM users');
    return rows[0].total || 0;
  }
}

export default UserModel;
