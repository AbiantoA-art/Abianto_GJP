import pool from '../config/db.config.js';
import { logger } from '../utils/logger.js';

export const migrateJobGroup = async () => {
  if (!pool) {
    throw new Error('Database pool not initialized.');
  }

  const connection = await pool.getConnection();
  try {
    const [cols] = await connection.query("SHOW COLUMNS FROM jobs LIKE 'job_group'");
    if (cols.length === 0) {
      logger.info("Adding 'job_group' column to 'jobs' table...");
      await connection.query(`
        ALTER TABLE jobs 
        ADD COLUMN job_group VARCHAR(20) NULL DEFAULT NULL AFTER category_id,
        ADD INDEX idx_jobs_job_group (job_group)
      `);
      logger.info("Successfully added 'job_group' column and index to 'jobs' table.");
    } else {
      logger.info("'job_group' column already exists in 'jobs' table.");
    }

    const [verify] = await connection.query("SHOW COLUMNS FROM jobs LIKE 'job_group'");
    logger.info("Verified column definition:", verify[0]);
    return { success: true, column: verify[0] };
  } catch (error) {
    logger.error('Failed to migrate job_group column:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

if (process.argv[1] && process.argv[1].endsWith('migrateJobGroup.js')) {
  migrateJobGroup()
    .then((res) => {
      console.log('Migration completed successfully:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
