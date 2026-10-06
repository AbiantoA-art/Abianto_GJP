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

export const runPhase05Verification = async () => {
  console.log('\n========================================================================');
  console.log(' GOVERNMENT JOB PORTAL - PHASE 05 AUTOMATED TECHNICAL VERIFICATION');
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

  const createdTestJobIds = [];

  try {
    // ------------------------------------------------------------------
    // Check 01: Database connection established & schema verified
    // ------------------------------------------------------------------
    const initResult = await initializeDatabase();
    assert(
      initResult && initResult.success === true,
      1,
      'Database connection established & Phase 05 database verified'
    );

    // Start in-memory HTTP server for testing
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        resolve();
      });
    });

    const connection = await pool.getConnection();

    // ------------------------------------------------------------------
    // Check 02: Existing users preserved in database
    // ------------------------------------------------------------------
    const [userRows] = await connection.query('SELECT COUNT(*) AS total FROM users');
    const userCount = userRows[0].total || 0;
    const adminUser = await UserModel.findByEmail(env.admin.email);
    assert(
      userCount > 0 && adminUser !== null && adminUser.role === 'admin',
      2,
      `Existing users preserved in database (Total users: ${userCount}, Admin: ${env.admin.email})`
    );

    // ------------------------------------------------------------------
    // Check 03: Existing categories preserved in database
    // ------------------------------------------------------------------
    const totalCategories = await JobCategoryModel.count();
    assert(
      totalCategories === 24,
      3,
      `Existing 24 government categories preserved in database (Count: ${totalCategories})`
    );

    connection.release();

    // ------------------------------------------------------------------
    // Check 04: Admin login works & issues valid JWT
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
    assert(
      adminLoginRes.statusCode === 200 &&
      adminLoginRes.body?.success === true &&
      adminLoginRes.body?.data?.user?.role === 'admin' &&
      !!adminToken,
      4,
      'Admin login succeeds with official credentials and issues admin JWT'
    );

    // ------------------------------------------------------------------
    // Check 05: Candidate login works & issues candidate JWT
    // ------------------------------------------------------------------
    const candidateEmail = `candidate_phase05_${Date.now()}@example.com`;
    const candidatePass = 'Password123!';

    const regCandidateRes = await request(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        full_name: 'Phase 05 Citizen Candidate',
        email: candidateEmail,
        mobile_number: '9876543210',
        password: candidatePass,
        confirm_password: candidatePass,
      },
    });

    const candidateLoginRes = await request(server, {
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: candidateEmail,
        password: candidatePass,
      },
    });

    const candidateToken = candidateLoginRes.body?.data?.token;
    assert(
      candidateLoginRes.statusCode === 200 &&
      candidateLoginRes.body?.success === true &&
      candidateLoginRes.body?.data?.user?.role === 'candidate' &&
      !!candidateToken,
      5,
      'Candidate login succeeds and issues candidate JWT'
    );

    // ------------------------------------------------------------------
    // Check 06: Admin token accepted on admin job management endpoint
    // ------------------------------------------------------------------
    const adminJobsRes = await request(server, {
      method: 'GET',
      path: '/api/admin/jobs?page=1&limit=10',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert(
      adminJobsRes.statusCode === 200 &&
      adminJobsRes.body?.success === true &&
      Array.isArray(adminJobsRes.body?.data) &&
      adminJobsRes.body?.pagination !== undefined,
      6,
      'Admin token accepted on GET /api/admin/jobs (HTTP 200)'
    );

    // ------------------------------------------------------------------
    // Check 07: Candidate token rejected with 403 on admin job endpoints
    // ------------------------------------------------------------------
    const candidateForbiddenGet = await request(server, {
      method: 'GET',
      path: '/api/admin/jobs',
      headers: {
        Authorization: `Bearer ${candidateToken}`,
      },
    });

    const candidateForbiddenPost = await request(server, {
      method: 'POST',
      path: '/api/admin/jobs',
      headers: {
        Authorization: `Bearer ${candidateToken}`,
      },
      body: {
        job_code: 'UNAUTH-001',
        title: 'Unauthorized Candidate Job',
        organization: 'Unauthorized Org',
        category_id: 1,
        description: 'Should be rejected',
        vacancies: 5,
      },
    });

    assert(
      candidateForbiddenGet.statusCode === 403 &&
      candidateForbiddenPost.statusCode === 403,
      7,
      'Candidate token strictly rejected with HTTP 403 Forbidden on all admin endpoints'
    );

    // ------------------------------------------------------------------
    // Check 08: Unauthenticated requests rejected with 401
    // ------------------------------------------------------------------
    const unauthGetRes = await request(server, {
      method: 'GET',
      path: '/api/admin/jobs',
    });

    const unauthPostRes = await request(server, {
      method: 'POST',
      path: '/api/admin/jobs',
      body: {},
    });

    assert(
      unauthGetRes.statusCode === 401 &&
      unauthPostRes.statusCode === 401,
      8,
      'Unauthenticated requests strictly rejected with HTTP 401 Unauthorized'
    );

    // Fetch active category for test jobs
    const categoriesList = await JobCategoryModel.getAllActive();
    const testCategory = categoriesList[0];
    const categoryId = testCategory.id;

    // ------------------------------------------------------------------
    // Check 09: Admin can create draft job with full government fields
    // ------------------------------------------------------------------
    const testJobCode1 = `TEST-PHASE05-${Date.now()}-001`;
    const createRes = await request(server, {
      method: 'POST',
      path: '/api/admin/jobs',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: {
        job_code: testJobCode1,
        title: 'Assistant Section Officer (Central Secretariat)',
        organization: 'Staff Selection Commission',
        department: 'Department of Personnel and Training',
        category_id: categoryId,
        description: 'Recruitment for Group B Gazetted Assistant Section Officers.',
        vacancies: 120,
        qualification: 'Bachelor Degree from recognized university',
        age_limit: '20 to 30 Years',
        salary: 'Level 7 (Rs. 44,900 - 1,42,400)',
        location: 'New Delhi',
        experience: 'Not Required',
        application_fee: 'Rs. 100 (Exempted for Women/SC/ST)',
        opening_date: '2026-10-01',
        last_date: '2026-10-31',
        selection_process: 'Tier 1 Computer Based Exam followed by Tier 2 Descriptive Exam',
        required_documents: 'Degree Certificate, Aadhaar Card, Category Certificate',
        notification_url: 'https://ssc.gov.in/notice-2026.pdf',
        apply_url: 'https://ssc.gov.in/apply',
        status: 'draft',
      },
    });

    const createdJob = createRes.body?.data;
    if (createdJob?.id) createdTestJobIds.push(createdJob.id);

    assert(
      createRes.statusCode === 201 &&
      createRes.body?.success === true &&
      createdJob?.job_code === testJobCode1 &&
      createdJob?.status === 'draft' &&
      createdJob?.created_by === adminUser.id,
      9,
      'Admin can create draft job with full government fields; creator auto-assigned (HTTP 201)'
    );

    // ------------------------------------------------------------------
    // Check 10: Job code uniqueness enforced (HTTP 409 Conflict)
    // ------------------------------------------------------------------
    const duplicateCodeRes = await request(server, {
      method: 'POST',
      path: '/api/admin/jobs',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: {
        job_code: testJobCode1, // Same code!
        title: 'Another Duplicate Job Title',
        organization: 'Test Commission',
        category_id: categoryId,
        description: 'Duplicate test',
        vacancies: 10,
        opening_date: '2026-10-01',
        last_date: '2026-10-31',
      },
    });

    assert(
      duplicateCodeRes.statusCode === 409 &&
      duplicateCodeRes.body?.success === false,
      10,
      'Job code uniqueness enforced; duplicate rejected with HTTP 409 Conflict'
    );

    // ------------------------------------------------------------------
    // Check 11: Invalid category rejected (HTTP 400)
    // ------------------------------------------------------------------
    const invalidCatRes = await request(server, {
      method: 'POST',
      path: '/api/admin/jobs',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: {
        job_code: `TEST-INVALID-CAT-${Date.now()}`,
        title: 'Job with Invalid Category',
        organization: 'Test Org',
        category_id: 999999, // Non-existent category
        description: 'Testing non-existent category ID',
        vacancies: 5,
      },
    });

    assert(
      invalidCatRes.statusCode === 400 &&
      invalidCatRes.body?.success === false,
      11,
      'Invalid / non-existent category reference rejected with HTTP 400'
    );

    // ------------------------------------------------------------------
    // Check 12: Invalid vacancies rejected (HTTP 400)
    // ------------------------------------------------------------------
    const invalidVacRes = await request(server, {
      method: 'POST',
      path: '/api/admin/jobs',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: {
        job_code: `TEST-INVALID-VAC-${Date.now()}`,
        title: 'Job with Invalid Vacancies',
        organization: 'Test Org',
        category_id: categoryId,
        description: 'Testing non-positive vacancies',
        vacancies: -5, // Invalid!
      },
    });

    assert(
      invalidVacRes.statusCode === 400 &&
      invalidVacRes.body?.success === false,
      12,
      'Invalid vacancies (<= 0 or non-integer) rejected with HTTP 400'
    );

    // ------------------------------------------------------------------
    // Check 13: Invalid dates rejected (last_date < opening_date -> HTTP 400)
    // ------------------------------------------------------------------
    const invalidDatesRes = await request(server, {
      method: 'POST',
      path: '/api/admin/jobs',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: {
        job_code: `TEST-INVALID-DATE-${Date.now()}`,
        title: 'Job with Inverted Dates',
        organization: 'Test Org',
        category_id: categoryId,
        description: 'Testing opening after last date',
        vacancies: 10,
        opening_date: '2026-11-15',
        last_date: '2026-10-01', // Earlier than opening!
      },
    });

    assert(
      invalidDatesRes.statusCode === 400 &&
      invalidDatesRes.body?.success === false,
      13,
      'Date validation rejects last_date earlier than opening_date with HTTP 400'
    );

    // ------------------------------------------------------------------
    // Check 14: Invalid status rejected (HTTP 400)
    // ------------------------------------------------------------------
    const invalidStatusRes = await request(server, {
      method: 'POST',
      path: '/api/admin/jobs',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: {
        job_code: `TEST-INVALID-STATUS-${Date.now()}`,
        title: 'Job with Bad Status',
        organization: 'Test Org',
        category_id: categoryId,
        description: 'Testing bad status enum',
        vacancies: 10,
        status: 'non_existent_status_123',
      },
    });

    assert(
      invalidStatusRes.statusCode === 400 &&
      invalidStatusRes.body?.success === false,
      14,
      'Invalid status enum value rejected with HTTP 400'
    );

    // ------------------------------------------------------------------
    // Check 15: Admin can retrieve created job by ID (GET /api/admin/jobs/:id)
    // ------------------------------------------------------------------
    const getJobRes = await request(server, {
      method: 'GET',
      path: `/api/admin/jobs/${createdJob.id}`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert(
      getJobRes.statusCode === 200 &&
      getJobRes.body?.success === true &&
      getJobRes.body?.data?.id === createdJob.id &&
      getJobRes.body?.data?.category?.name !== undefined &&
      getJobRes.body?.data?.creator?.email !== undefined,
      15,
      'Admin can retrieve created job with category and creator metadata (HTTP 200)'
    );

    // ------------------------------------------------------------------
    // Check 16: Admin can edit job (PUT /api/admin/jobs/:id)
    // ------------------------------------------------------------------
    const editRes = await request(server, {
      method: 'PUT',
      path: `/api/admin/jobs/${createdJob.id}`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: {
        title: 'Senior Section Officer (Updated Title)',
        vacancies: 150,
        location: 'Pan India',
      },
    });

    assert(
      editRes.statusCode === 200 &&
      editRes.body?.success === true &&
      editRes.body?.data?.title === 'Senior Section Officer (Updated Title)' &&
      editRes.body?.data?.vacancies === 150 &&
      editRes.body?.data?.location === 'Pan India' &&
      editRes.body?.data?.created_by === adminUser.id,
      16,
      'Admin can edit job fields while preserving id and created_by ownership (HTTP 200)'
    );

    // ------------------------------------------------------------------
    // Check 17: Admin can publish job (PATCH /api/admin/jobs/:id/status -> published)
    // ------------------------------------------------------------------
    const publishRes = await request(server, {
      method: 'PATCH',
      path: `/api/admin/jobs/${createdJob.id}/status`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: {
        status: 'published',
      },
    });

    assert(
      publishRes.statusCode === 200 &&
      publishRes.body?.success === true &&
      publishRes.body?.data?.status === 'published',
      17,
      'Admin can publish job via PATCH status transition (draft -> published) (HTTP 200)'
    );

    // ------------------------------------------------------------------
    // Check 18: Published job appears in public API (/api/jobs & /api/jobs/:id)
    // ------------------------------------------------------------------
    const publicListRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?page=1&limit=20',
    });

    const publicDetailRes = await request(server, {
      method: 'GET',
      path: `/api/jobs/${createdJob.id}`,
    });

    const foundInPublicList = publicListRes.body?.data?.some((j) => j.id === createdJob.id);
    assert(
      foundInPublicList &&
      publicDetailRes.statusCode === 200 &&
      publicDetailRes.body?.data?.id === createdJob.id,
      18,
      'Published job appears in public listing and is accessible via public detail endpoint'
    );

    // ------------------------------------------------------------------
    // Check 19: Draft job does not appear publicly
    // ------------------------------------------------------------------
    const testDraftCode = `TEST-DRAFT-${Date.now()}`;
    const createDraftRes = await request(server, {
      method: 'POST',
      path: '/api/admin/jobs',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: {
        job_code: testDraftCode,
        title: 'Hidden Draft Vacancy',
        organization: 'Confidential Ministry',
        category_id: categoryId,
        description: 'Internal draft not yet released to public.',
        vacancies: 1,
        status: 'draft',
      },
    });
    const draftJobId = createDraftRes.body?.data?.id;
    if (draftJobId) createdTestJobIds.push(draftJobId);

    const publicListDraftCheck = await request(server, {
      method: 'GET',
      path: '/api/jobs?page=1&limit=100',
    });
    const draftInPublic = publicListDraftCheck.body?.data?.some((j) => j.id === draftJobId);

    const publicDetailDraftCheck = await request(server, {
      method: 'GET',
      path: `/api/jobs/${draftJobId}`,
    });

    assert(
      !draftInPublic && publicDetailDraftCheck.statusCode === 404,
      19,
      'Draft job is strictly excluded from public listing and public detail returns HTTP 404'
    );

    // ------------------------------------------------------------------
    // Check 20: Admin can close job (published -> closed)
    // ------------------------------------------------------------------
    const closeRes = await request(server, {
      method: 'PATCH',
      path: `/api/admin/jobs/${createdJob.id}/status`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: {
        status: 'closed',
      },
    });

    const publicDetailClosedCheck = await request(server, {
      method: 'GET',
      path: `/api/jobs/${createdJob.id}`,
    });

    assert(
      closeRes.statusCode === 200 &&
      closeRes.body?.data?.status === 'closed' &&
      publicDetailClosedCheck.statusCode === 404,
      20,
      'Admin can close job; closed job is removed from public access'
    );

    // ------------------------------------------------------------------
    // Check 21: Admin can archive job (DELETE /api/admin/jobs/:id)
    // ------------------------------------------------------------------
    const archiveRes = await request(server, {
      method: 'DELETE',
      path: `/api/admin/jobs/${createdJob.id}`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert(
      archiveRes.statusCode === 200 &&
      archiveRes.body?.success === true &&
      archiveRes.body?.data?.status === 'archived',
      21,
      'Admin DELETE request safely archives job (status="archived") (HTTP 200)'
    );

    // ------------------------------------------------------------------
    // Check 22: Archived job does not appear publicly
    // ------------------------------------------------------------------
    const publicListArchiveCheck = await request(server, {
      method: 'GET',
      path: '/api/jobs?page=1&limit=100',
    });
    const archiveInPublic = publicListArchiveCheck.body?.data?.some((j) => j.id === createdJob.id);

    const publicDetailArchiveCheck = await request(server, {
      method: 'GET',
      path: `/api/jobs/${createdJob.id}`,
    });

    assert(
      !archiveInPublic && publicDetailArchiveCheck.statusCode === 404,
      22,
      'Archived job does not appear in public listing or public detail endpoint'
    );

    // ------------------------------------------------------------------
    // Check 23: Archived job remains in database (non-destructive)
    // ------------------------------------------------------------------
    const dbJobCheck = await JobModel.findById(createdJob.id);
    assert(
      dbJobCheck !== null && dbJobCheck.status === 'archived',
      23,
      'Archived job remains securely stored in database with status="archived" (non-destructive)'
    );

    // ------------------------------------------------------------------
    // Check 24: Admin job pagination works
    // ------------------------------------------------------------------
    const page1Res = await request(server, {
      method: 'GET',
      path: '/api/admin/jobs?page=1&limit=2',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const invalidPageRes = await request(server, {
      method: 'GET',
      path: '/api/admin/jobs?page=-1&limit=10',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert(
      page1Res.statusCode === 200 &&
      page1Res.body?.pagination?.page === 1 &&
      page1Res.body?.pagination?.limit === 2 &&
      invalidPageRes.statusCode === 400,
      24,
      'Admin job pagination returns paginated data and rejects invalid page bounds (HTTP 400)'
    );

    // ------------------------------------------------------------------
    // Check 25: Admin statistics/counts are correct
    // ------------------------------------------------------------------
    const statsRes = await request(server, {
      method: 'GET',
      path: '/api/admin/jobs/stats',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const stats = statsRes.body?.data;
    assert(
      statsRes.statusCode === 200 &&
      statsRes.body?.success === true &&
      typeof stats?.total === 'number' &&
      typeof stats?.draft === 'number' &&
      typeof stats?.published === 'number' &&
      typeof stats?.closed === 'number' &&
      typeof stats?.expired === 'number' &&
      typeof stats?.archived === 'number',
      25,
      `Admin statistics return accurate counts (Total: ${stats?.total}, Draft: ${stats?.draft}, Archived: ${stats?.archived})`
    );

    // ------------------------------------------------------------------
    // Check 26: Existing Phase 04 category API works (/api/categories)
    // ------------------------------------------------------------------
    const catRes = await request(server, {
      method: 'GET',
      path: '/api/categories',
    });

    assert(
      catRes.statusCode === 200 &&
      catRes.body?.success === true &&
      Array.isArray(catRes.body?.data) &&
      catRes.body.data.length === 24,
      26,
      'Existing Phase 04 GET /api/categories returns all 24 active categories (HTTP 200)'
    );

    // ------------------------------------------------------------------
    // Check 27: Existing public job API works (/api/jobs)
    // ------------------------------------------------------------------
    const pubJobsRes = await request(server, {
      method: 'GET',
      path: '/api/jobs',
    });

    assert(
      pubJobsRes.statusCode === 200 &&
      pubJobsRes.body?.success === true &&
      Array.isArray(pubJobsRes.body?.data) &&
      pubJobsRes.body?.pagination !== undefined,
      27,
      'Existing Phase 04 GET /api/jobs public endpoint functions without regression'
    );

    // ------------------------------------------------------------------
    // Check 28: Phase 03 authentication regression (me endpoint with token)
    // ------------------------------------------------------------------
    const meRes = await request(server, {
      method: 'GET',
      path: '/api/auth/me',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert(
      meRes.statusCode === 200 &&
      meRes.body?.data?.user?.email === env.admin.email,
      28,
      'Phase 03 session verification (GET /api/auth/me) functions without regression'
    );

    // ------------------------------------------------------------------
    // Check 29: Backend starts successfully and reports operational health
    // ------------------------------------------------------------------
    const healthRes = await request(server, {
      method: 'GET',
      path: '/api/health',
    });

    assert(
      healthRes.statusCode === 200 &&
      healthRes.body?.success === true &&
      healthRes.body?.data?.database?.connected === true,
      29,
      'Backend reports operational health and active MySQL database connection'
    );

    // ------------------------------------------------------------------
    // Check 30: Frontend production build succeeds
    // ------------------------------------------------------------------
    const frontendDistDir = path.resolve(__dirname, '../../../frontend/dist');
    const indexHtmlExists = fs.existsSync(path.join(frontendDistDir, 'index.html'));
    const assetsDir = path.join(frontendDistDir, 'assets');
    const assetsExist = fs.existsSync(assetsDir) && fs.readdirSync(assetsDir).length > 0;

    assert(
      indexHtmlExists && assetsExist,
      30,
      'Frontend production bundle intact with dist/index.html and generated assets'
    );

    console.log('\n========================================================================');
    console.log(` VERIFICATION COMPLETE: 30/30 Required Checks Evaluated`);
    console.log(` Status: ${failedCount === 0 ? 'ALL CHECKS PASSED (100% SUCCESS)' : `${failedCount} FAILURES DETECTED`}`);
    console.log('========================================================================\n');

    if (failedCount > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Fatal error during Phase 05 test execution:', err);
    process.exitCode = 1;
  } finally {
    // Clean up all temporary test jobs created during tests so real jobs table remains clean
    for (const testId of createdTestJobIds) {
      try {
        await JobModel.deleteById(testId);
      } catch (err) {
        console.error(`Failed to clean up test job ${testId}:`, err);
      }
    }
    if (server) {
      server.close();
    }
    await pool.end();
  }
};

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runPhase05Verification();
}
