import pool from '../config/db.config.js';
import { logger } from '../utils/logger.js';
import { CATEGORY_SEEDS } from '../config/categories.seed.js';

/**
 * Phase 04 Database Migration & Initialization
 * Creates job_categories and jobs tables with foreign keys and indexes.
 * Preserves existing users table and Phase 03 data.
 * Seeds 24 standard government job categories idempotently.
 */
export const initializeDatabase = async () => {
  if (!pool) {
    throw new Error('Database connection pool is not initialized.');
  }

  const connection = await pool.getConnection();
  try {
    logger.info('Running database migration / schema initialization (Phase 04)...');

    // 1. Verify / Create `users` table (Phase 03 preservation)
    const createUsersTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(191) NOT NULL,
        date_of_birth DATE NULL,
        mobile_number VARCHAR(20) NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('candidate', 'admin') NOT NULL DEFAULT 'candidate',
        status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT uq_users_email UNIQUE (email),
        INDEX idx_users_role (role),
        INDEX idx_users_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createUsersTableSQL);

    // Safe migration check for date_of_birth
    const [dobCol] = await connection.query("SHOW COLUMNS FROM users LIKE 'date_of_birth'");
    if (dobCol.length === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN date_of_birth DATE NULL AFTER email");
      logger.info('Database migration: Added date_of_birth column to users table.');
    }
    // Ensure mobile_number is nullable
    await connection.query("ALTER TABLE users MODIFY COLUMN mobile_number VARCHAR(20) NULL");
    logger.info('Database schema verified: `users` table is ready.');

    // 2. Create `job_categories` table
    const createJobCategoriesTableSQL = `
      CREATE TABLE IF NOT EXISTS job_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(150) NOT NULL,
        description TEXT DEFAULT NULL,
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT uq_job_categories_name UNIQUE (name),
        CONSTRAINT uq_job_categories_slug UNIQUE (slug),
        INDEX idx_job_categories_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createJobCategoriesTableSQL);
    logger.info('Database schema verified: `job_categories` table is ready.');

    // 3. Inspect existing `jobs` table structure if present
    const [tables] = await connection.query("SHOW TABLES LIKE 'jobs'");
    if (tables.length > 0) {
      const [columns] = await connection.query("SHOW COLUMNS FROM jobs LIKE 'job_code'");
      if (columns.length === 0) {
        logger.warn('Legacy prototype jobs table detected without Phase 04 schema. Upgrading table...');
        await connection.query('DROP TABLE jobs');
      }
    }

    // 4. Create `jobs` table with relational integrity and indexes
    const createJobsTableSQL = `
      CREATE TABLE IF NOT EXISTS jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        job_code VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        organization VARCHAR(255) NOT NULL,
        department VARCHAR(255) DEFAULT NULL,
        category_id INT NOT NULL,
        job_group VARCHAR(20) DEFAULT NULL,
        description LONGTEXT DEFAULT NULL,
        vacancies INT NOT NULL DEFAULT 0,
        qualification TEXT DEFAULT NULL,
        age_limit VARCHAR(255) DEFAULT NULL,
        salary VARCHAR(255) DEFAULT NULL,
        location VARCHAR(255) DEFAULT NULL,
        experience VARCHAR(255) DEFAULT NULL,
        application_fee VARCHAR(255) DEFAULT NULL,
        opening_date DATE DEFAULT NULL,
        last_date DATE DEFAULT NULL,
        selection_process TEXT DEFAULT NULL,
        required_documents TEXT DEFAULT NULL,
        notification_url VARCHAR(1000) DEFAULT NULL,
        apply_url VARCHAR(1000) DEFAULT NULL,
        status ENUM('draft', 'published', 'closed', 'expired', 'archived') NOT NULL DEFAULT 'draft',
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT uq_jobs_job_code UNIQUE (job_code),
        CONSTRAINT fk_jobs_category FOREIGN KEY (category_id) REFERENCES job_categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_jobs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        INDEX idx_jobs_category_id (category_id),
        INDEX idx_jobs_job_group (job_group),
        INDEX idx_jobs_status (status),
        INDEX idx_jobs_opening_date (opening_date),
        INDEX idx_jobs_last_date (last_date),
        INDEX idx_jobs_organization (organization),
        INDEX idx_jobs_location (location),
        INDEX idx_jobs_created_by (created_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createJobsTableSQL);

    // Safe migration check for job_group column
    const [jobGroupCol] = await connection.query("SHOW COLUMNS FROM jobs LIKE 'job_group'");
    if (jobGroupCol.length === 0) {
      await connection.query("ALTER TABLE jobs ADD COLUMN job_group VARCHAR(20) NULL DEFAULT NULL AFTER category_id, ADD INDEX idx_jobs_job_group (job_group)");
      logger.info('Database migration: Added job_group column to jobs table.');
    }
    logger.info('Database schema verified: `jobs` table is ready with relational constraints.');

    // 5. Create `applications` table (Phase 07)
    const createApplicationsTableSQL = `
      CREATE TABLE IF NOT EXISTS applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_id VARCHAR(50) NOT NULL,
        job_id INT NOT NULL,
        candidate_id INT NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(191) NOT NULL,
        mobile_number VARCHAR(20) NOT NULL,
        date_of_birth DATE NOT NULL,
        gender ENUM('male', 'female', 'transgender', 'other') NOT NULL,
        address_line TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        district VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        highest_qualification VARCHAR(100) NOT NULL,
        qualification_details TEXT DEFAULT NULL,
        university_or_board VARCHAR(200) NOT NULL,
        passing_year INT NOT NULL,
        percentage_or_cgpa VARCHAR(20) NOT NULL,
        experience_status ENUM('fresher', 'experienced') NOT NULL DEFAULT 'fresher',
        experience_details TEXT DEFAULT NULL,
        declaration_accepted BOOLEAN NOT NULL DEFAULT FALSE,
        status ENUM('submitted', 'under_review', 'shortlisted', 'rejected', 'selected', 'withdrawn') NOT NULL DEFAULT 'submitted',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT uq_applications_app_id UNIQUE (application_id),
        CONSTRAINT uq_applications_job_candidate UNIQUE (job_id, candidate_id),
        CONSTRAINT fk_applications_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_applications_candidate FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        INDEX idx_applications_app_id (application_id),
        INDEX idx_applications_job_id (job_id),
        INDEX idx_applications_candidate_id (candidate_id),
        INDEX idx_applications_status (status),
        INDEX idx_applications_submitted_at (submitted_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createApplicationsTableSQL);
    logger.info('Database schema verified: `applications` table is ready.');

    // 6. Create `application_documents` table (Phase 07)
    const createApplicationDocumentsTableSQL = `
      CREATE TABLE IF NOT EXISTS application_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_id INT NOT NULL,
        document_type ENUM('resume', 'photograph', 'certificate', 'other') NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        stored_filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_app_docs_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_app_docs_application_id (application_id),
        INDEX idx_app_docs_type (document_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createApplicationDocumentsTableSQL);
    logger.info('Database schema verified: `application_documents` table is ready.');

    // 7. Create `study_materials` table (Phase 08 + TNPSC Enhancements)
    const createStudyMaterialsTableSQL = `
      CREATE TABLE IF NOT EXISTS study_materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        subject VARCHAR(150) NOT NULL,
        category_id INT NOT NULL,
        exam_group VARCHAR(20) NULL DEFAULT NULL,
        language VARCHAR(20) NOT NULL DEFAULT 'ENGLISH',
        material_type ENUM(
          'study_material',
          'syllabus',
          'exam_pattern',
          'question_paper',
          'notification',
          'answer_key',
          'current_affairs',
          'practice_material'
        ) NOT NULL DEFAULT 'study_material',
        source_url VARCHAR(1000) NULL DEFAULT NULL,
        is_official BOOLEAN NOT NULL DEFAULT 1,
        file_original_name VARCHAR(255) NULL DEFAULT NULL,
        file_stored_name VARCHAR(255) NULL DEFAULT NULL,
        file_path VARCHAR(500) NULL DEFAULT NULL,
        file_mime_type VARCHAR(100) NULL DEFAULT 'application/pdf',
        file_size INT NULL DEFAULT 0,
        status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
        uploaded_by INT NOT NULL,
        download_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT uq_study_materials_slug UNIQUE (slug),
        CONSTRAINT fk_study_materials_category FOREIGN KEY (category_id) REFERENCES job_categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_study_materials_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        INDEX idx_study_materials_category_id (category_id),
        INDEX idx_study_materials_exam_group (exam_group),
        INDEX idx_study_materials_language (language),
        INDEX idx_study_materials_material_type (material_type),
        INDEX idx_study_materials_status (status),
        INDEX idx_study_materials_subject (subject),
        INDEX idx_study_materials_created_at (created_at),
        INDEX idx_study_materials_uploaded_by (uploaded_by),
        INDEX idx_study_materials_download_count (download_count)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createStudyMaterialsTableSQL);

    // Safe migration check for pre-existing study_materials tables
    const [matCols] = await connection.query('SHOW COLUMNS FROM study_materials');
    const matColSet = new Set(matCols.map((c) => c.Field));
    if (!matColSet.has('exam_group')) {
      await connection.query('ALTER TABLE study_materials ADD COLUMN exam_group VARCHAR(20) NULL DEFAULT NULL AFTER category_id, ADD INDEX idx_study_materials_exam_group (exam_group)');
    }
    if (!matColSet.has('language')) {
      await connection.query("ALTER TABLE study_materials ADD COLUMN language VARCHAR(20) NOT NULL DEFAULT 'ENGLISH' AFTER exam_group, ADD INDEX idx_study_materials_language (language)");
    }
    if (!matColSet.has('source_url')) {
      await connection.query('ALTER TABLE study_materials ADD COLUMN source_url VARCHAR(1000) NULL DEFAULT NULL AFTER material_type');
    }
    if (!matColSet.has('is_official')) {
      await connection.query('ALTER TABLE study_materials ADD COLUMN is_official BOOLEAN NOT NULL DEFAULT 1 AFTER source_url');
    }

    logger.info('Database schema verified: `study_materials` table is ready.');

    // 8. Create `notifications` table (Phase 09)
    const createNotificationsTableSQL = `
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient_id INT NOT NULL,
        sender_id INT DEFAULT NULL,
        type ENUM(
          'system',
          'announcement',
          'new_job',
          'application_submitted',
          'application_status',
          'study_material',
          'syllabus',
          'deadline',
          'reminder'
        ) NOT NULL DEFAULT 'system',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        priority ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
        related_entity_type VARCHAR(50) DEFAULT NULL,
        related_entity_id INT DEFAULT NULL,
        action_url VARCHAR(500) DEFAULT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        read_at TIMESTAMP NULL DEFAULT NULL,
        status ENUM('active', 'archived') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_notifications_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_notifications_recipient_id (recipient_id),
        INDEX idx_notifications_recipient_read (recipient_id, is_read),
        INDEX idx_notifications_recipient_created (recipient_id, created_at),
        INDEX idx_notifications_type (type),
        INDEX idx_notifications_priority (priority),
        INDEX idx_notifications_status (status),
        INDEX idx_notifications_entity (related_entity_type, related_entity_id),
        INDEX idx_notifications_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createNotificationsTableSQL);
    logger.info('Database schema verified: `notifications` table is ready.');

    // 9. Seed Category Data Idempotently
    logger.info('Seeding official government job categories...');
    const upsertCategorySQL = `
      INSERT INTO job_categories (name, slug, description, status)
      VALUES (?, ?, ?, 'active')
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        status = VALUES(status);
    `;

    for (const cat of CATEGORY_SEEDS) {
      await connection.query(upsertCategorySQL, [cat.name, cat.slug, cat.description]);
    }

    const [countRows] = await connection.query('SELECT COUNT(*) AS total FROM job_categories');
    const totalCategories = countRows[0].total;
    logger.info(`Database initialization completed: ${totalCategories} job categories verified.`);

    return {
      success: true,
      message: 'Database schema and category seeds initialized successfully',
      categoriesCount: totalCategories,
    };
  } catch (error) {
    logger.error('Failed to initialize database schema:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

// If executed directly from command line: node src/scripts/initDb.js
if (process.argv[1] && process.argv[1].endsWith('initDb.js')) {
  initializeDatabase()
    .then((result) => {
      logger.info('Database initialization completed successfully:', result);
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Database initialization failed:', err);
      process.exit(1);
    });
}
