import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../app.js';
import pool from '../config/db.config.js';
import { env } from '../config/env.config.js';
import { initializeDatabase } from './initDb.js';
import JobModel from '../models/job.model.js';
import JobCategoryModel from '../models/jobCategory.model.js';
import UserModel from '../models/user.model.js';
import { CATEGORY_SEEDS } from '../config/categories.seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper for making HTTP requests against test server
const request = (server, { method, path, headers = {}, body = null }) => {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const port = addr.port;
    const postData = body ? JSON.stringify(body) : null;

    const reqHeaders = {
      Accept: 'application/json',
      ...headers,
    };

    if (postData) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        method,
        path,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = rawData ? JSON.parse(rawData) : null;
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: parsed,
              raw: rawData,
            });
          } catch {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: rawData,
              raw: rawData,
            });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

const runPhase04Verification = async () => {
  console.log('\n========================================================================');
  console.log(' GOVERNMENT JOB PORTAL - PHASE 04 AUTOMATED TECHNICAL VERIFICATION');
  console.log('========================================================================\n');

  let server;
  let testIndex = 0;
  let passedCount = 0;
  let failedCount = 0;

  const assert = (condition, testNumber, testTitle, details = '') => {
    testIndex++;
    if (condition) {
      passedCount++;
      console.log(`[PASS] Check ${String(testNumber).padStart(2, '0')}: ${testTitle}`);
    } else {
      failedCount++;
      console.error(`[FAIL] Check ${String(testNumber).padStart(2, '0')}: ${testTitle}`);
      if (details) console.error(`       Details: ${details}`);
    }
  };

  let tempDraftJobId = null;
  let tempPublishedJobId = null;

  try {
    // ------------------------------------------------------------------
    // Check 01: Database connection & migration execution
    // ------------------------------------------------------------------
    const initResult = await initializeDatabase();
    assert(
      initResult && initResult.success === true,
      1,
      'Database connection established & Phase 04 schema initialized'
    );

    // Start in-memory HTTP server for testing
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        resolve();
      });
    });

    const connection = await pool.getConnection();

    // ------------------------------------------------------------------
    // Check 02: job_categories table exists
    // ------------------------------------------------------------------
    const [catTable] = await connection.query("SHOW TABLES LIKE 'job_categories'");
    assert(
      catTable.length > 0,
      2,
      'Database table `job_categories` exists'
    );

    // ------------------------------------------------------------------
    // Check 03: jobs table exists
    // ------------------------------------------------------------------
    const [jobsTable] = await connection.query("SHOW TABLES LIKE 'jobs'");
    assert(
      jobsTable.length > 0,
      3,
      'Database table `jobs` exists'
    );

    // ------------------------------------------------------------------
    // Check 04: Required columns exist
    // ------------------------------------------------------------------
    const [catCols] = await connection.query('SHOW COLUMNS FROM job_categories');
    const catColNames = catCols.map((c) => c.Field);
    const requiredCatCols = ['id', 'name', 'slug', 'description', 'status', 'created_at', 'updated_at'];
    const allCatColsPresent = requiredCatCols.every((col) => catColNames.includes(col));

    const [jobCols] = await connection.query('SHOW COLUMNS FROM jobs');
    const jobColNames = jobCols.map((c) => c.Field);
    const requiredJobCols = [
      'id', 'job_code', 'title', 'organization', 'department', 'category_id',
      'description', 'vacancies', 'qualification', 'age_limit', 'salary',
      'location', 'experience', 'application_fee', 'opening_date', 'last_date',
      'selection_process', 'required_documents', 'notification_url', 'apply_url',
      'status', 'created_by', 'created_at', 'updated_at'
    ];
    const allJobColsPresent = requiredJobCols.every((col) => jobColNames.includes(col));

    assert(
      allCatColsPresent && allJobColsPresent,
      4,
      `All required columns exist in job_categories (${requiredCatCols.length}) and jobs (${requiredJobCols.length})`
    );

    // ------------------------------------------------------------------
    // Check 05: Category seed count is correct (24 categories)
    // ------------------------------------------------------------------
    const totalCategories = await JobCategoryModel.count();
    assert(
      totalCategories === 24,
      5,
      `Category seed count is exactly 24 (Detected: ${totalCategories})`
    );

    // ------------------------------------------------------------------
    // Check 06: Categories contain expected names
    // ------------------------------------------------------------------
    const [dbCategories] = await connection.query('SELECT name FROM job_categories');
    const dbCategoryNames = dbCategories.map((c) => c.name);
    const expectedNames = CATEGORY_SEEDS.map((s) => s.name);
    const allExpectedNamesFound = expectedNames.every((name) => dbCategoryNames.includes(name));

    assert(
      allExpectedNamesFound,
      6,
      'Categories table contains all 24 required government recruitment categories'
    );

    connection.release();

    // ------------------------------------------------------------------
    // Check 07: GET /api/categories works
    // ------------------------------------------------------------------
    const catRes = await request(server, {
      method: 'GET',
      path: '/api/categories',
    });

    assert(
      catRes.statusCode === 200 &&
      catRes.body?.success === true &&
      Array.isArray(catRes.body?.data) &&
      catRes.body.data.length === 24 &&
      catRes.body.data[0].slug !== undefined,
      7,
      'GET /api/categories returns active categories with status 200'
    );

    // ------------------------------------------------------------------
    // Check 08: GET /api/jobs works
    // ------------------------------------------------------------------
    const jobsRes = await request(server, {
      method: 'GET',
      path: '/api/jobs',
    });

    assert(
      jobsRes.statusCode === 200 &&
      jobsRes.body?.success === true &&
      Array.isArray(jobsRes.body?.data) &&
      jobsRes.body?.pagination !== undefined,
      8,
      'GET /api/jobs returns job listing structure with status 200'
    );

    // ------------------------------------------------------------------
    // Check 09: Pagination works & validates input
    // ------------------------------------------------------------------
    const pageRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?page=2&limit=5',
    });

    const invalidPageRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?page=-1&limit=10',
    });

    const invalidLimitRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?page=1&limit=500',
    });

    assert(
      pageRes.statusCode === 200 &&
      pageRes.body?.pagination?.page === 2 &&
      pageRes.body?.pagination?.limit === 5 &&
      invalidPageRes.statusCode === 400 &&
      invalidLimitRes.statusCode === 400,
      9,
      'Pagination handles custom page/limit and rejects invalid parameters (HTTP 400)'
    );

    // ------------------------------------------------------------------
    // Check 10: GET /api/jobs/:id returns 404 for invalid ID
    // ------------------------------------------------------------------
    const notFoundJobRes = await request(server, {
      method: 'GET',
      path: '/api/jobs/999999',
    });

    const invalidIdJobRes = await request(server, {
      method: 'GET',
      path: '/api/jobs/not-a-number',
    });

    assert(
      notFoundJobRes.statusCode === 404 &&
      notFoundJobRes.body?.success === false &&
      invalidIdJobRes.statusCode === 404 &&
      invalidIdJobRes.body?.success === false,
      10,
      'GET /api/jobs/:id returns HTTP 404 for non-existent and invalid IDs'
    );

    // Get an admin user ID and category ID to create temporary test jobs
    const adminUser = await UserModel.findByEmail(env.admin.email);
    const adminId = adminUser ? adminUser.id : 1;
    const firstCategory = await JobCategoryModel.findBySlug('upsc');
    const categoryId = firstCategory ? firstCategory.id : 1;

    // ------------------------------------------------------------------
    // Check 11: Draft jobs are not exposed publicly
    // ------------------------------------------------------------------
    const testDraftCode = `TEST-DRAFT-${Date.now()}`;
    const draftJob = await JobModel.create({
      job_code: testDraftCode,
      title: 'Temporary Test Draft Job - DO NOT PUBLISH',
      organization: 'Automated Test Organization',
      department: 'Quality Assurance Testing',
      category_id: categoryId,
      description: 'Internal draft job for automated testing.',
      vacancies: 1,
      status: 'draft',
      created_by: adminId,
    });
    tempDraftJobId = draftJob.id;

    const listWithDraftRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?page=1&limit=100',
    });
    const draftInListing = listWithDraftRes.body?.data?.some((j) => j.id === tempDraftJobId);

    const detailDraftRes = await request(server, {
      method: 'GET',
      path: `/api/jobs/${tempDraftJobId}`,
    });

    assert(
      !draftInListing && detailDraftRes.statusCode === 404,
      11,
      'Draft jobs are excluded from public listing and return 404 on direct lookup'
    );

    // Clean up draft job
    await JobModel.deleteById(tempDraftJobId);
    tempDraftJobId = null;

    // ------------------------------------------------------------------
    // Check 12: Published jobs can be retrieved with category info
    // ------------------------------------------------------------------
    const testPublishedCode = `TEST-PUB-${Date.now()}`;
    const publishedJob = await JobModel.create({
      job_code: testPublishedCode,
      title: 'Assistant Professor Recruitment 2026',
      organization: 'National University of Testing',
      department: 'Higher Education Department',
      category_id: categoryId,
      description: 'Full-time official vacancy for testing retrieval.',
      vacancies: 12,
      qualification: 'Master Degree with NET / SLET',
      age_limit: '21 to 35 years',
      salary: 'Level 10 (Rs. 57,700 - 1,82,400)',
      location: 'New Delhi',
      experience: 'Fresher / Experienced',
      application_fee: 'Rs. 500 (Exempted for SC/ST)',
      opening_date: '2026-10-01',
      last_date: '2026-11-15',
      selection_process: 'Written Examination followed by Interview',
      required_documents: 'Degree certificate, Aadhaar card, Photo',
      notification_url: 'https://example.gov.in/notifications/2026-01.pdf',
      apply_url: 'https://example.gov.in/apply',
      status: 'published',
      created_by: adminId,
    });
    tempPublishedJobId = publishedJob.id;

    const listPubRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?page=1&limit=10',
    });
    const pubInListing = listPubRes.body?.data?.some((j) => j.id === tempPublishedJobId);

    const detailPubRes = await request(server, {
      method: 'GET',
      path: `/api/jobs/${tempPublishedJobId}`,
    });

    const hasCategoryDetails =
      detailPubRes.body?.data?.category?.name !== undefined &&
      detailPubRes.body?.data?.category?.slug !== undefined;

    assert(
      pubInListing &&
      detailPubRes.statusCode === 200 &&
      detailPubRes.body?.success === true &&
      hasCategoryDetails,
      12,
      'Published jobs can be retrieved in public listing and by ID with joined category information'
    );

    // Clean up temporary published job
    await JobModel.deleteById(tempPublishedJobId);
    tempPublishedJobId = null;

    // ------------------------------------------------------------------
    // Check 13: Authentication APIs still work (Candidate registration/login/me)
    // ------------------------------------------------------------------
    const candidateEmail = `candidate_phase04_${Date.now()}@example.com`;
    const candidatePass = 'Password123!';

    const regRes = await request(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        full_name: 'Phase 04 Test Candidate',
        email: candidateEmail,
        mobile_number: '9876543210',
        password: candidatePass,
        confirm_password: candidatePass,
      },
    });

    const loginRes = await request(server, {
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: candidateEmail,
        password: candidatePass,
      },
    });

    const candidateToken = loginRes.body?.data?.token;

    const meRes = await request(server, {
      method: 'GET',
      path: '/api/auth/me',
      headers: {
        Authorization: `Bearer ${candidateToken}`,
      },
    });

    assert(
      regRes.statusCode === 201 &&
      loginRes.statusCode === 200 &&
      meRes.statusCode === 200 &&
      meRes.body?.data?.user?.email === candidateEmail,
      13,
      'Phase 03 candidate authentication (register, login, me) functions without regression'
    );

    // ------------------------------------------------------------------
    // Check 14: Admin authorization still works
    // ------------------------------------------------------------------
    const adminLoginRes = await request(server, {
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: env.admin.email,
        password: env.admin.password,
      },
    });

    const adminToken = adminLoginRes.body?.data?.token;

    const adminTestRes = await request(server, {
      method: 'GET',
      path: '/api/admin/test',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const candidateForbiddenRes = await request(server, {
      method: 'GET',
      path: '/api/admin/test',
      headers: {
        Authorization: `Bearer ${candidateToken}`,
      },
    });

    assert(
      adminLoginRes.statusCode === 200 &&
      adminTestRes.statusCode === 200 &&
      candidateForbiddenRes.statusCode === 403,
      14,
      'Admin login & role authorization guards (/api/admin/test) function without regression'
    );

    // ------------------------------------------------------------------
    // Check 15: Backend starts successfully & health endpoint reports DB connected
    // ------------------------------------------------------------------
    const healthRes = await request(server, {
      method: 'GET',
      path: '/api/health',
    });

    assert(
      healthRes.statusCode === 200 &&
      healthRes.body?.success === true &&
      healthRes.body?.data?.database?.connected === true,
      15,
      'Backend starts successfully and GET /api/health confirms database connectivity'
    );

    // ------------------------------------------------------------------
    // Check 16: Frontend build still succeeds
    // ------------------------------------------------------------------
    const frontendDistDir = path.resolve(__dirname, '../../../frontend/dist');
    const indexHtmlExists = fs.existsSync(path.join(frontendDistDir, 'index.html'));
    const assetsDir = path.join(frontendDistDir, 'assets');
    const assetsExist = fs.existsSync(assetsDir) && fs.readdirSync(assetsDir).length > 0;

    assert(
      indexHtmlExists && assetsExist,
      16,
      'Frontend production bundle intact with dist/index.html and generated assets'
    );

    console.log('\n========================================================================');
    console.log(` VERIFICATION COMPLETE: 16/16 Required Checks Evaluated`);
    console.log(` Status: ${failedCount === 0 ? 'ALL CHECKS PASSED (100% SUCCESS)' : `${failedCount} FAILURES DETECTED`}`);
    console.log('========================================================================\n');

    if (failedCount > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Fatal error during test execution:', err);
    process.exitCode = 1;
  } finally {
    // Ensure cleanup of any leftover temporary test records
    if (tempDraftJobId) {
      try {
        await JobModel.deleteById(tempDraftJobId);
      } catch {}
    }
    if (tempPublishedJobId) {
      try {
        await JobModel.deleteById(tempPublishedJobId);
      } catch {}
    }
    if (server) {
      server.close();
    }
    await pool.end();
  }
};

runPhase04Verification();
