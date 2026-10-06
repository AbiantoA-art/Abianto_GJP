import pool from '../config/db.config.js';
import { logger } from '../utils/logger.js';

export async function migrateSchemaPhase11() {
  logger.info('Starting Phase 11 safe database schema extension...');

  // 1. Add safe columns to study_materials if not already present
  const [smCols] = await pool.query('DESCRIBE study_materials');
  const smFields = smCols.map((c) => c.Field);

  if (!smFields.includes('exam_name')) {
    await pool.query('ALTER TABLE study_materials ADD COLUMN exam_name VARCHAR(150) NULL AFTER exam_group');
    logger.info('Added exam_name to study_materials');
  }

  if (!smFields.includes('recruitment_body')) {
    await pool.query('ALTER TABLE study_materials ADD COLUMN recruitment_body VARCHAR(150) NULL AFTER exam_name');
    logger.info('Added recruitment_body to study_materials');
  }

  if (!smFields.includes('year')) {
    await pool.query('ALTER TABLE study_materials ADD COLUMN year INT NULL AFTER recruitment_body');
    logger.info('Added year to study_materials');
  }

  // 2. Add safe columns to jobs if not already present
  const [jobCols] = await pool.query('DESCRIBE jobs');
  const jobFields = jobCols.map((c) => c.Field);

  if (!jobFields.includes('exam_name')) {
    await pool.query('ALTER TABLE jobs ADD COLUMN exam_name VARCHAR(150) NULL AFTER job_group');
    logger.info('Added exam_name to jobs');
  }

  if (!jobFields.includes('recruitment_body')) {
    await pool.query('ALTER TABLE jobs ADD COLUMN recruitment_body VARCHAR(150) NULL AFTER exam_name');
    logger.info('Added recruitment_body to jobs');
  }

  logger.info('Phase 11 schema migration successfully verified.');
  return true;
}

if (process.argv[1]?.includes('migrateSchemaPhase11.js')) {
  migrateSchemaPhase11()
    .then(() => {
      console.log('Migration complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration error:', err);
      process.exit(1);
    });
}
