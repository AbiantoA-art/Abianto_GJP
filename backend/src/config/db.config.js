import mysql from 'mysql2/promise';
import { env } from './env.config.js';
import { logger } from '../utils/logger.js';

/**
 * MySQL Connection Pool Configuration
 * Created in Phase 01 as database foundation.
 * Full schema implementation will be introduced in Phase 04.
 */
let pool = null;

try {
  pool = mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    waitForConnections: env.db.waitForConnections,
    connectionLimit: env.db.connectionLimit,
    queueLimit: env.db.queueLimit,
  });
} catch (error) {
  logger.error('Failed to initialize MySQL connection pool:', error.message);
}

/**
 * Verifies database connectivity.
 * Gracefully reports status without crashing the server during initial setup.
 */
export const testDbConnection = async (runMigration = false) => {
  if (!pool) {
    logger.warn('MySQL pool is not initialized. Database features will be unavailable until configured.');
    return { isConnected: false, message: 'Pool not initialized' };
  }

  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();

    // Run schema initialization only when explicitly requested (e.g. at server start)
    if (runMigration) {
      try {
        const { initializeDatabase } = await import('../scripts/initDb.js');
        await initializeDatabase();
      } catch (schemaErr) {
        logger.warn(`Schema check notice: ${schemaErr.message}`);
      }
    }

    return { isConnected: true, message: 'Database connection established' };
  } catch (error) {
    logger.warn(
      `MySQL connection check: Database currently unreachable (${error.code || error.message}). ` +
      `Phase 01 foundation ready; database schema will be finalized in Phase 04.`
    );
    return {
      isConnected: false,
      message: `Database unreachable: ${error.code || error.message}`,
    };
  }
};

export default pool;
