/**
 * ==============================================================================
 * GOVERNMENT JOB PORTAL — STUDY MATERIALS MIGRATION SCRIPT
 * ==============================================================================
 * Safe, idempotent migration to add:
 *  - exam_group (GROUP_1, GROUP_2, GROUP_2A, GROUP_3, GROUP_4)
 *  - language (TAMIL, ENGLISH, BILINGUAL)
 *  - source_url (Official web/PDF URL)
 *  - is_official (Boolean flag)
 *  - expands material_type to support syllabus, exam_pattern, question_paper, etc.
 *  - allows nullable file columns for external resources
 * 
 * Preserves all existing tables, rows, constraints, and foreign keys.
 */

import pool from '../config/db.config.js';

export const runStudyMaterialsMigration = async () => {
  console.log('--- Checking study_materials table schema ---');
  const connection = await pool.getConnection();

  try {
    const [cols] = await connection.query('SHOW COLUMNS FROM study_materials');
    const colMap = new Map(cols.map((c) => [c.Field, c]));

    // 1. Add exam_group if missing
    if (!colMap.has('exam_group')) {
      console.log('Adding exam_group column to study_materials...');
      await connection.query(`
        ALTER TABLE study_materials
        ADD COLUMN exam_group VARCHAR(20) NULL DEFAULT NULL AFTER category_id,
        ADD INDEX idx_study_materials_exam_group (exam_group)
      `);
      console.log('✓ Added exam_group column and index');
    } else {
      console.log('✓ exam_group column already exists');
    }

    // 2. Add language if missing
    if (!colMap.has('language')) {
      console.log('Adding language column to study_materials...');
      await connection.query(`
        ALTER TABLE study_materials
        ADD COLUMN language VARCHAR(20) NOT NULL DEFAULT 'ENGLISH' AFTER exam_group,
        ADD INDEX idx_study_materials_language (language)
      `);
      console.log('✓ Added language column and index');
    } else {
      console.log('✓ language column already exists');
    }

    // 3. Add source_url if missing
    if (!colMap.has('source_url')) {
      console.log('Adding source_url column to study_materials...');
      await connection.query(`
        ALTER TABLE study_materials
        ADD COLUMN source_url VARCHAR(1000) NULL DEFAULT NULL AFTER material_type
      `);
      console.log('✓ Added source_url column');
    } else {
      console.log('✓ source_url column already exists');
    }

    // 4. Add is_official if missing
    if (!colMap.has('is_official')) {
      console.log('Adding is_official column to study_materials...');
      await connection.query(`
        ALTER TABLE study_materials
        ADD COLUMN is_official BOOLEAN NOT NULL DEFAULT 1 AFTER source_url
      `);
      console.log('✓ Added is_official column');
    } else {
      console.log('✓ is_official column already exists');
    }

    // 5. Expand material_type ENUM
    console.log('Updating material_type ENUM to support all required types...');
    await connection.query(`
      ALTER TABLE study_materials
      MODIFY COLUMN material_type ENUM(
        'study_material',
        'syllabus',
        'exam_pattern',
        'question_paper',
        'notification',
        'answer_key',
        'current_affairs',
        'practice_material'
      ) NOT NULL DEFAULT 'study_material'
    `);
    console.log('✓ material_type ENUM updated');

    // 6. Make file metadata nullable for external-only or hybrid resources
    await connection.query(`
      ALTER TABLE study_materials
      MODIFY COLUMN file_original_name VARCHAR(255) NULL DEFAULT NULL,
      MODIFY COLUMN file_stored_name VARCHAR(255) NULL DEFAULT NULL,
      MODIFY COLUMN file_path VARCHAR(500) NULL DEFAULT NULL,
      MODIFY COLUMN file_mime_type VARCHAR(100) NULL DEFAULT 'application/pdf',
      MODIFY COLUMN file_size INT NULL DEFAULT 0
    `);
    console.log('✓ file columns modified to allow NULL for external official resources');

    console.log('--- study_materials migration completed successfully ---');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Execute if run directly
if (process.argv[1]?.endsWith('migrateStudyMaterials.js')) {
  runStudyMaterialsMigration()
    .then(() => {
      console.log('Migration finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
