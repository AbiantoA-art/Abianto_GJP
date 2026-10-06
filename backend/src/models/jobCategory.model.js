import pool from '../config/db.config.js';
import { CATEGORY_SEEDS } from '../config/categories.seed.js';
import { logger } from '../utils/logger.js';

/**
 * Job Category Entity Data Access Model
 * Implements parameterized queries for SQL safety.
 */
export class JobCategoryModel {
  /**
   * Retrieve all active job categories
   * @returns {Promise<Array>} Array of active category objects
   */
  static async getAllActive() {
    const query = `
      SELECT id, name, slug, description, status, created_at, updated_at
      FROM job_categories
      WHERE status = 'active'
      ORDER BY name ASC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  }

  /**
   * Find a category by primary ID
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const query = `
      SELECT id, name, slug, description, status, created_at, updated_at
      FROM job_categories
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find a category by slug
   * @param {string} slug
   * @returns {Promise<Object|null>}
   */
  static async findBySlug(slug) {
    const query = `
      SELECT id, name, slug, description, status, created_at, updated_at
      FROM job_categories
      WHERE slug = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [slug]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Create a new category
   * @param {Object} categoryData
   * @returns {Promise<Object>}
   */
  static async create({ name, slug, description = null, status = 'active' }) {
    const query = `
      INSERT INTO job_categories (name, slug, description, status)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [name.trim(), slug.trim().toLowerCase(), description, status]);
    return {
      id: result.insertId,
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description,
      status,
    };
  }

  /**
   * Count total categories in the database
   * @returns {Promise<number>}
   */
  static async count() {
    const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM job_categories');
    return rows[0].total || 0;
  }

  /**
   * Count active categories in the database
   * @returns {Promise<number>}
   */
  static async countActive() {
    const [rows] = await pool.execute("SELECT COUNT(*) AS total FROM job_categories WHERE status = 'active'");
    return rows[0].total || 0;
  }

  /**
   * Seed the default 24 government job categories idempotently.
   * Safe to run repeatedly without creating duplicates.
   * @param {Array} seeds Optional custom seeds array (defaults to CATEGORY_SEEDS)
   * @param {Object} executor Optional DB connection or pool
   * @returns {Promise<{ seeded: number, total: number }>}
   */
  static async seedCategories(seeds = CATEGORY_SEEDS, executor = pool) {
    const upsertSQL = `
      INSERT INTO job_categories (name, slug, description, status)
      VALUES (?, ?, ?, 'active')
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        status = VALUES(status)
    `;

    for (const item of seeds) {
      await executor.execute(upsertSQL, [
        item.name,
        item.slug,
        item.description || null,
      ]);
    }

    const [rows] = await executor.execute('SELECT COUNT(*) AS total FROM job_categories');
    const total = rows[0].total || 0;

    logger.info(`Job categories seeded/verified successfully. Total categories: ${total}`);
    return { seeded: seeds.length, total };
  }
}

export default JobCategoryModel;
