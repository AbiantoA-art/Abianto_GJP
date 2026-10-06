# Database Architecture & Schema - Government Job Portal

## Overview
This directory contains SQL schema specifications, database initialization scripts, and entity relationship documentation for the **Government Job Portal**.

## Database Technology
* **RDBMS**: MySQL (version 8.0+) / MariaDB compatible
* **Storage Engine**: InnoDB
* **Connection Driver**: `mysql2/promise` (Node.js connection pool)
* **Configuration**: Externalized via environment variables in `backend/.env`
* **Character Set & Collation**: `utf8mb4` / `utf8mb4_unicode_ci`

---

## Phase 03 Schema Implementation: Authentication & User Directory

### Table: `users`

| Column | Data Type | Attributes | Description |
|:---|:---|:---|:---|
| `id` | `INT` | AUTO_INCREMENT, PRIMARY KEY | Unique user identifier |
| `full_name` | `VARCHAR(150)` | NOT NULL | Full name of citizen or official |
| `email` | `VARCHAR(191)` | NOT NULL, UNIQUE | Official email address / login credential |
| `mobile_number` | `VARCHAR(20)` | NOT NULL | 10-digit mobile number for official alerts |
| `password_hash` | `VARCHAR(255)` | NOT NULL | Bcrypt salted & hashed password |
| `role` | `ENUM('candidate', 'admin')` | NOT NULL, DEFAULT `'candidate'` | System authorization role |
| `status` | `ENUM('active', 'disabled')` | NOT NULL, DEFAULT `'active'` | Account lifecycle status |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Account registration timestamp |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP ON UPDATE` | Last modification timestamp |

**Indexes on `users`:**
* `PRIMARY KEY (id)`
* `UNIQUE KEY uq_users_email (email)`
* `INDEX idx_users_role (role)`
* `INDEX idx_users_status (status)`

---

## Phase 04 Schema Implementation: Job Categories & Government Jobs

### Table: `job_categories`

| Column | Data Type | Attributes | Description |
|:---|:---|:---|:---|
| `id` | `INT` | AUTO_INCREMENT, PRIMARY KEY | Unique category identifier |
| `name` | `VARCHAR(150)` | NOT NULL, UNIQUE | Category title (e.g., UPSC, SSC, Banking) |
| `slug` | `VARCHAR(150)` | NOT NULL, UNIQUE | URL-friendly slug (e.g., `upsc`, `it-computer`) |
| `description` | `TEXT` | NULL | Detailed summary of category recruitment scope |
| `status` | `ENUM('active', 'inactive')` | NOT NULL, DEFAULT `'active'` | Category availability flag |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Category creation timestamp |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP ON UPDATE` | Last modification timestamp |

**Indexes on `job_categories`:**
* `PRIMARY KEY (id)`
* `UNIQUE KEY uq_job_categories_name (name)`
* `UNIQUE KEY uq_job_categories_slug (slug)`
* `INDEX idx_job_categories_status (status)`

---

### Table: `jobs`

| Column | Data Type | Attributes | Description |
|:---|:---|:---|:---|
| `id` | `INT` | AUTO_INCREMENT, PRIMARY KEY | Unique job notification identifier |
| `job_code` | `VARCHAR(100)` | NOT NULL, UNIQUE | Official government vacancy code |
| `title` | `VARCHAR(255)` | NOT NULL | Official designation / post name |
| `organization` | `VARCHAR(255)` | NOT NULL | Hiring commission / board / authority |
| `department` | `VARCHAR(255)` | NULL | Subordinate department / ministry |
| `category_id` | `INT` | NOT NULL, FOREIGN KEY | References `job_categories(id)` |
| `description` | `LONGTEXT` | NULL | Full official recruitment description |
| `vacancies` | `INT` | NOT NULL, DEFAULT `0` | Number of available posts |
| `qualification` | `TEXT` | NULL | Minimum educational criteria |
| `age_limit` | `VARCHAR(255)` | NULL | Prescribed age range and relaxations |
| `salary` | `VARCHAR(255)` | NULL | Pay scale / pay matrix level / CTC |
| `location` | `VARCHAR(255)` | NULL | Job posting location / jurisdiction |
| `experience` | `VARCHAR(255)` | NULL | Required years or type of experience |
| `application_fee` | `VARCHAR(255)` | NULL | Fee details and category exemptions |
| `opening_date` | `DATE` | NULL | Application commencement date |
| `last_date` | `DATE` | NULL | Deadline for application submission |
| `selection_process` | `TEXT` | NULL | Stages (Prelims, Mains, Interview, PET) |
| `required_documents` | `TEXT` | NULL | Mandatory certificates and credentials |
| `notification_url` | `VARCHAR(1000)` | NULL | Link to official gazette notification PDF |
| `apply_url` | `VARCHAR(1000)` | NULL | Direct link to official application portal |
| `status` | `ENUM('draft', 'published', 'closed', 'expired', 'archived')` | NOT NULL, DEFAULT `'draft'` | Job lifecycle status |
| `created_by` | `INT` | NOT NULL, FOREIGN KEY | References `users(id)` (admin creator) |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Record creation timestamp |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP ON UPDATE` | Last modification timestamp |

**Indexes on `jobs`:**
* `PRIMARY KEY (id)`
* `UNIQUE KEY uq_jobs_job_code (job_code)`
* `INDEX idx_jobs_category_id (category_id)`
* `INDEX idx_jobs_status (status)`
* `INDEX idx_jobs_last_date (last_date)`
* `INDEX idx_jobs_organization (organization)`
* `INDEX idx_jobs_location (location)`
* `INDEX idx_jobs_created_by (created_by)`

---

## Relational Architecture & Foreign Keys

```text
users (id)
  ▲
  │ created_by [ON DELETE RESTRICT ON UPDATE CASCADE]
  │
jobs
  │
  │ category_id [ON DELETE RESTRICT ON UPDATE CASCADE]
  ▼
job_categories (id)
```

1. **Category Integrity (`fk_jobs_category`)**:
   * `jobs.category_id` references `job_categories.id`.
   * `ON DELETE RESTRICT`: Categories with active job records cannot be deleted, preventing orphaned vacancy records.
   * `ON UPDATE CASCADE`: Cascades any category identifier modifications.

2. **Audit & Creator Integrity (`fk_jobs_created_by`)**:
   * `jobs.created_by` references `users.id`.
   * `ON DELETE RESTRICT`: Ensures all government vacancy notifications preserve immutable administrative authorship records.
   * `ON UPDATE CASCADE`: Synchronizes user identifier modifications.

---

## Seed Data: 24 Government Job Categories

The initialization script populates 24 official recruitment categories idempotently:

| # | Name | Slug |
|:---:|:---|:---|
| 1 | UPSC | `upsc` |
| 2 | SSC | `ssc` |
| 3 | Banking | `banking` |
| 4 | Railway | `railway` |
| 5 | Defence | `defence` |
| 6 | Police | `police` |
| 7 | Teaching | `teaching` |
| 8 | Medical | `medical` |
| 9 | Engineering | `engineering` |
| 10 | IT / Computer | `it-computer` |
| 11 | Central Government | `central-government` |
| 12 | State Government | `state-government` |
| 13 | Tamil Nadu Government | `tamil-nadu-government` |
| 14 | Postal | `postal` |
| 15 | PSU | `psu` |
| 16 | Research | `research` |
| 17 | Court / Judiciary | `court-judiciary` |
| 18 | Forest Department | `forest-department` |
| 19 | Revenue Department | `revenue-department` |
| 20 | Electricity Board | `electricity-board` |
| 21 | Transport Department | `transport-department` |
| 22 | Municipal / Local Government | `municipal-local-government` |
| 23 | Apprentice | `apprentice` |
| 24 | Other Government Jobs | `other-government-jobs` |

---

## Database Management & Verification Commands

To apply migrations and seed categories:
```bash
cd backend
npm run init-db
```

To seed an initial official administrator:
```bash
cd backend
npm run seed:admin
```

To run automated Phase 05 job management verification tests:
```bash
cd backend
npm run test:phase05
```

To run automated Phase 04 verification tests:
```bash
cd backend
npm run test:phase04
```

To run Phase 03 authentication regression tests:
```bash
cd backend
npm run test:auth
```

---

## Phase 05 Lifecycle Status & Deletion Safety Rules

The `jobs` table uses the `status` column with values `draft`, `published`, `closed`, `expired`, and `archived`.
* **Safe Archiving (Non-destructive Delete)**: In compliance with government auditing standards and relational integrity for future candidate applications (Phase 06/08), HTTP `DELETE /api/admin/jobs/:id` operations execute an update statement:
  ```sql
  UPDATE jobs SET status = 'archived' WHERE id = ?;
  ```
  Physical `DELETE FROM jobs` is strictly forbidden in production business operations.

---

> [!NOTE]
> **Strict Phase 05 Boundaries**:
> Phase 05 exclusively provides the Administrative Job Management System. The following features belong to later development phases and are deferred:
> * Candidate application submission & tracking (Phase 06)
> * Study materials or document uploads (Phase 07)
> * Saved jobs and job alerts (Phase 08)
> * Candidate notification dispatch (Phase 08)

