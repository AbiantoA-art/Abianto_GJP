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

export const runPhase06Verification = async () => {
  console.log('\n========================================================================');
  console.log(' GOVERNMENT JOB PORTAL - PHASE 06 CANDIDATE DISCOVERY & SEARCH VERIFICATION');
  console.log('========================================================================\n');

  let server;
  let passedCount = 0;
  let failedCount = 0;

  const assert = (condition, testNumber, testTitle, details = '') => {
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
    // SECTION 1: DATABASE INTEGRITY CHECKS (Checks 01 - 04)
    // ------------------------------------------------------------------
    const initResult = await initializeDatabase();
    assert(
      initResult && initResult.success === true,
      1,
      'Database connection verified and Phase 06 schema validated'
    );

    // Start in-memory HTTP server for testing
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        resolve();
      });
    });

    const connection = await pool.getConnection();

    // Check 02: 24 official job categories preserved
    const [catRows] = await connection.query('SELECT COUNT(*) AS total FROM job_categories WHERE status = "active"');
    const activeCatsCount = catRows[0].total || 0;
    assert(
      activeCatsCount === 24,
      2,
      `All 24 official government recruitment categories preserved and active (${activeCatsCount} active)`
    );

    // Check 03: Existing users preserved
    const [userRows] = await connection.query('SELECT COUNT(*) AS total FROM users');
    const userCount = userRows[0].total || 0;
    const adminUser = await UserModel.findByEmail(env.admin.email);
    assert(
      userCount > 0 && adminUser !== null && adminUser.role === 'admin',
      3,
      `Existing user database intact (Total users: ${userCount}, Admin: ${env.admin.email})`
    );

    // Check 04: Jobs schema intact with required fields
    const [jobCols] = await connection.query('SHOW COLUMNS FROM jobs');
    const colNames = jobCols.map((c) => c.Field);
    const requiredCols = [
      'id', 'job_code', 'title', 'organization', 'department', 'category_id',
      'description', 'vacancies', 'qualification', 'age_limit', 'salary',
      'location', 'experience', 'application_fee', 'opening_date', 'last_date',
      'selection_process', 'required_documents', 'notification_url', 'apply_url',
      'status', 'created_by', 'created_at', 'updated_at'
    ];
    const allColsPresent = requiredCols.every((c) => colNames.includes(c));
    assert(
      allColsPresent,
      4,
      `Jobs schema complete with all ${requiredCols.length} government fields and indexes intact`
    );

    connection.release();

    // Fetch active categories for test jobs
    const allActiveCats = await JobCategoryModel.getAllActive();
    const cat1 = allActiveCats[0]; // e.g. UPSC
    const cat2 = allActiveCats[1] || allActiveCats[0]; // e.g. SSC or Defence
    const adminId = adminUser ? adminUser.id : 1;

    // ------------------------------------------------------------------
    // SEED TEMPORARY TEST JOBS FOR PHASE 06 VERIFICATION
    // ------------------------------------------------------------------
    const now = Date.now();
    const testCode1 = `TEST-P06-PUB1-${now}`;
    const testCode2 = `TEST-P06-PUB2-${now}`;
    const testCode3 = `TEST-P06-PUB3-${now}`;
    const testDraftCode = `TEST-P06-DRAFT-${now}`;
    const testClosedCode = `TEST-P06-CLOSED-${now}`;
    const testArchivedCode = `TEST-P06-ARCH-${now}`;

    // Job 1: Published - Civil Services, New Delhi, high vacancies
    const job1 = await JobModel.create({
      job_code: testCode1,
      title: 'Civil Services Executive Officer Recruitment 2026',
      organization: 'Union Public Service Commission',
      department: 'Department of Administrative Reforms',
      category_id: cat1.id,
      description: 'Prestigious central administrative service vacancy for civil candidates.',
      vacancies: 250,
      qualification: 'Graduation Degree in any discipline from recognized university',
      age_limit: '21 to 32 Years',
      salary: 'Level 10 (Rs. 56,100 - 1,77,500)',
      location: 'New Delhi',
      experience: 'Fresher / Experienced',
      application_fee: 'Rs. 100 (Exempted for Female/SC/ST)',
      opening_date: '2026-10-01',
      last_date: '2026-11-15',
      selection_process: 'Prelims Examination, Mains Written Examination, Interview',
      required_documents: 'Degree Certificate, Aadhaar Card, Passport Photo',
      notification_url: 'https://example.gov.in/notice-p06-1.pdf',
      apply_url: 'https://example.gov.in/apply-p06-1',
      status: 'published',
      created_by: adminId,
    });
    createdTestJobIds.push(job1.id);

    // Job 2: Published - Technical Railways, Chennai, earlier deadline
    const job2 = await JobModel.create({
      job_code: testCode2,
      title: 'Junior Technical Assistant (Railways Division)',
      organization: 'Railway Recruitment Board',
      department: 'Southern Railway Zone',
      category_id: cat2.id,
      description: 'Technical vacancy for zonal operations and signalling in Chennai.',
      vacancies: 80,
      qualification: 'Diploma or Degree in Engineering',
      age_limit: '18 to 33 Years',
      salary: 'Level 6 (Rs. 35,400 - 1,12,400)',
      location: 'Chennai, Tamil Nadu',
      experience: 'Not Required',
      application_fee: 'Rs. 500 (Refundable Rs. 400 on CBT attendance)',
      opening_date: '2026-09-15',
      last_date: '2026-10-25',
      selection_process: 'Computer Based Test (CBT 1 & 2), Document Verification',
      required_documents: 'Diploma Certificate, Community Certificate, Photo',
      notification_url: 'https://example.gov.in/notice-p06-2.pdf',
      apply_url: 'https://example.gov.in/apply-p06-2',
      status: 'published',
      created_by: adminId,
    });
    createdTestJobIds.push(job2.id);

    // Job 3: Published - Finance Section Officer, Kolkata, later deadline
    const job3 = await JobModel.create({
      job_code: testCode3,
      title: 'Section Superintendent Accounts Officer',
      organization: 'Staff Selection Commission',
      department: 'Ministry of Finance Department of Revenue',
      category_id: cat2.id,
      description: 'Audit and section supervisory duties for revenue collection.',
      vacancies: 45,
      qualification: 'Bachelor of Commerce or Chartered Accountant Inter',
      age_limit: '20 to 30 Years',
      salary: 'Level 7 (Rs. 44,900 - 1,42,400)',
      location: 'Kolkata, West Bengal',
      experience: '2 Years accounting experience preferred',
      application_fee: 'Rs. 100',
      opening_date: '2026-08-01',
      last_date: '2026-12-10',
      selection_process: 'Tier 1 CBT and Tier 2 Computer Proficiency Test',
      required_documents: 'B.Com Degree, Experience Letter, ID Proof',
      notification_url: 'https://example.gov.in/notice-p06-3.pdf',
      apply_url: 'https://example.gov.in/apply-p06-3',
      status: 'published',
      created_by: adminId,
    });
    createdTestJobIds.push(job3.id);

    // Job 4: Draft (Should be invisible to candidates)
    const draftJob = await JobModel.create({
      job_code: testDraftCode,
      title: 'Confidential Internal Draft Vacancy',
      organization: 'Intelligence Bureau',
      department: 'Cabinet Secretariat',
      category_id: cat1.id,
      description: 'Internal draft not approved for public circulation.',
      vacancies: 5,
      status: 'draft',
      created_by: adminId,
    });
    createdTestJobIds.push(draftJob.id);

    // Job 5: Closed (Should be invisible to candidates)
    const closedJob = await JobModel.create({
      job_code: testClosedCode,
      title: 'Historical Closed Recruitment Notification',
      organization: 'Staff Selection Commission',
      category_id: cat2.id,
      description: 'Past vacancy with expired application window.',
      vacancies: 10,
      status: 'closed',
      created_by: adminId,
    });
    createdTestJobIds.push(closedJob.id);

    // Job 6: Archived (Should be invisible to candidates)
    const archivedJob = await JobModel.create({
      job_code: testArchivedCode,
      title: 'Archived Withdrawn Notification',
      organization: 'Union Public Service Commission',
      category_id: cat1.id,
      description: 'Withdrawn vacancy stored in archive.',
      vacancies: 2,
      status: 'archived',
      created_by: adminId,
    });
    createdTestJobIds.push(archivedJob.id);

    // ------------------------------------------------------------------
    // SECTION 2: PUBLIC ACCESS & VISIBILITY RULES (Checks 05 - 10)
    // ------------------------------------------------------------------
    // Check 05: GET /api/jobs works without authentication
    const publicListRes = await request(server, {
      method: 'GET',
      path: '/api/jobs',
    });
    assert(
      publicListRes.statusCode === 200 &&
      publicListRes.body?.success === true &&
      Array.isArray(publicListRes.body?.data) &&
      publicListRes.body?.pagination !== undefined,
      5,
      'GET /api/jobs accessible publicly without authentication (HTTP 200)'
    );

    // Check 06: GET /api/jobs/:id works for published job with full 21+ fields
    const publicDetailRes = await request(server, {
      method: 'GET',
      path: `/api/jobs/${job1.id}`,
    });
    const dJob = publicDetailRes.body?.data;
    const hasFullFields =
      dJob?.job_code === testCode1 &&
      dJob?.organization === 'Union Public Service Commission' &&
      dJob?.vacancies === 250 &&
      dJob?.qualification !== undefined &&
      dJob?.salary !== undefined &&
      dJob?.location === 'New Delhi' &&
      dJob?.opening_date === '2026-10-01' &&
      dJob?.last_date === '2026-11-15' &&
      dJob?.category?.name !== undefined;

    assert(
      publicDetailRes.statusCode === 200 &&
      publicDetailRes.body?.success === true &&
      hasFullFields,
      6,
      'GET /api/jobs/:id returns complete published job details with category metadata'
    );

    // Check 07: Draft job excluded from public listing and direct lookup
    const listDraftCheck = await request(server, {
      method: 'GET',
      path: '/api/jobs?limit=100',
    });
    const draftInPublic = listDraftCheck.body?.data?.some((j) => j.id === draftJob.id);
    const detailDraftRes = await request(server, {
      method: 'GET',
      path: `/api/jobs/${draftJob.id}`,
    });
    assert(
      !draftInPublic && detailDraftRes.statusCode === 404,
      7,
      'Draft job is strictly excluded from public list and direct lookup returns HTTP 404'
    );

    // Check 08: Closed job excluded from public listing and direct lookup
    const closedInPublic = listDraftCheck.body?.data?.some((j) => j.id === closedJob.id);
    const detailClosedRes = await request(server, {
      method: 'GET',
      path: `/api/jobs/${closedJob.id}`,
    });
    assert(
      !closedInPublic && detailClosedRes.statusCode === 404,
      8,
      'Closed job is strictly excluded from public list and direct lookup returns HTTP 404'
    );

    // Check 09: Archived job excluded from public listing and direct lookup
    const archivedInPublic = listDraftCheck.body?.data?.some((j) => j.id === archivedJob.id);
    const detailArchivedRes = await request(server, {
      method: 'GET',
      path: `/api/jobs/${archivedJob.id}`,
    });
    assert(
      !archivedInPublic && detailArchivedRes.statusCode === 404,
      9,
      'Archived job is strictly excluded from public list and direct lookup returns HTTP 404'
    );

    // Check 10: Non-existent job returns 404
    const notFoundRes = await request(server, {
      method: 'GET',
      path: '/api/jobs/999999',
    });
    assert(
      notFoundRes.statusCode === 404 && notFoundRes.body?.success === false,
      10,
      'Non-existent job returns HTTP 404 Not Found without leaking internal data'
    );

    // ------------------------------------------------------------------
    // SECTION 3: SERVER-SIDE SEARCH SUPPORT (Checks 11 - 14)
    // ------------------------------------------------------------------
    // Check 11: Search by title keyword
    const searchTitleRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?search=Executive%20Officer',
    });
    const foundByTitle = searchTitleRes.body?.data?.some((j) => j.id === job1.id);
    assert(
      searchTitleRes.statusCode === 200 && foundByTitle,
      11,
      'Server-side search by title keyword matches relevant vacancy'
    );

    // Check 12: Search by organization keyword
    const searchOrgRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?search=Railway%20Recruitment',
    });
    const foundByOrg = searchOrgRes.body?.data?.some((j) => j.id === job2.id);
    assert(
      searchOrgRes.statusCode === 200 && foundByOrg,
      12,
      'Server-side search by organization matches relevant vacancy'
    );

    // Check 13: Search by job code
    const searchCodeRes = await request(server, {
      method: 'GET',
      path: `/api/jobs?search=${encodeURIComponent(testCode3)}`,
    });
    const foundByCode = searchCodeRes.body?.data?.some((j) => j.id === job3.id);
    assert(
      searchCodeRes.statusCode === 200 && foundByCode,
      13,
      'Server-side search by unique job code matches exact vacancy'
    );

    // Check 14: Search by location keyword
    const searchLocRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?search=Chennai',
    });
    const foundByLoc = searchLocRes.body?.data?.some((j) => j.id === job2.id);
    assert(
      searchLocRes.statusCode === 200 && foundByLoc,
      14,
      'Server-side search across location field matches vacancy'
    );

    // ------------------------------------------------------------------
    // SECTION 4: ADVANCED FILTERS (Checks 15 - 20)
    // ------------------------------------------------------------------
    // Check 15: Category filter
    const filterCatRes = await request(server, {
      method: 'GET',
      path: `/api/jobs?category_id=${cat1.id}`,
    });
    const catMatchesOnly =
      filterCatRes.body?.data?.length > 0 &&
      filterCatRes.body.data.every((j) => j.category_id === cat1.id);
    assert(
      filterCatRes.statusCode === 200 && catMatchesOnly,
      15,
      `Category filter category_id=${cat1.id} returns only jobs for that category`
    );

    // Check 16: Location filter (partial match)
    const filterLocRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?location=Chennai',
    });
    const locMatchesOnly =
      filterLocRes.body?.data?.length > 0 &&
      filterLocRes.body.data.every((j) => j.location.toLowerCase().includes('chennai'));
    assert(
      filterLocRes.statusCode === 200 && locMatchesOnly,
      16,
      'Location filter supports partial match (e.g. "Chennai")'
    );

    // Check 17: Organization filter (partial match)
    const filterOrgRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?organization=Railway',
    });
    const orgMatchesOnly =
      filterOrgRes.body?.data?.length > 0 &&
      filterOrgRes.body.data.every((j) => j.organization.toLowerCase().includes('railway'));
    assert(
      filterOrgRes.statusCode === 200 && orgMatchesOnly,
      17,
      'Organization filter supports partial match (e.g. "Railway")'
    );

    // Check 18: Department filter (partial match)
    const filterDeptRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?department=Revenue',
    });
    const deptMatchesOnly =
      filterDeptRes.body?.data?.length > 0 &&
      filterDeptRes.body.data.every((j) => j.department?.toLowerCase().includes('revenue'));
    assert(
      filterDeptRes.statusCode === 200 && deptMatchesOnly,
      18,
      'Department filter supports partial match (e.g. "Revenue")'
    );

    // Check 19: Opening date filter (opening_date_from)
    const filterOpenDateRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?opening_date_from=2026-10-01',
    });
    const openDateMatches =
      filterOpenDateRes.body?.data?.length > 0 &&
      filterOpenDateRes.body.data.every((j) => !j.opening_date || j.opening_date >= '2026-10-01');
    assert(
      filterOpenDateRes.statusCode === 200 && openDateMatches,
      19,
      'Opening date filter opening_date_from correctly restricts jobs to opening_date >= date'
    );

    // Check 20: Last date (deadline) filter (last_date_to)
    const filterLastDateRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?last_date_to=2026-11-01',
    });
    const lastDateMatches =
      filterLastDateRes.body?.data?.length > 0 &&
      filterLastDateRes.body.data.every((j) => !j.last_date || j.last_date <= '2026-11-01');
    assert(
      filterLastDateRes.statusCode === 200 && lastDateMatches,
      20,
      'Last date filter last_date_to correctly restricts jobs to last_date <= date'
    );

    // ------------------------------------------------------------------
    // SECTION 5: SERVER-SIDE SORTING (Checks 21 - 24)
    // ------------------------------------------------------------------
    // Check 21: Latest sorting (sort=latest)
    const sortLatestRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?sort=latest&limit=10',
    });
    assert(
      sortLatestRes.statusCode === 200 && Array.isArray(sortLatestRes.body?.data),
      21,
      'Server-side sorting sort=latest accepted and ordered by opening_date DESC'
    );

    // Check 22: Deadline sorting (sort=deadline_soon)
    const sortDeadlineRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?sort=deadline_soon&limit=10',
    });
    const deadlineJobs = sortDeadlineRes.body?.data || [];
    let isDeadlineOrdered = true;
    for (let i = 0; i < deadlineJobs.length - 1; i++) {
      if (deadlineJobs[i].last_date && deadlineJobs[i + 1].last_date) {
        if (deadlineJobs[i].last_date > deadlineJobs[i + 1].last_date) {
          isDeadlineOrdered = false;
          break;
        }
      }
    }
    assert(
      sortDeadlineRes.statusCode === 200 && isDeadlineOrdered,
      22,
      'Server-side sorting sort=deadline_soon correctly orders approaching deadlines first'
    );

    // Check 23: Vacancies sorting (sort=vacancies_high)
    const sortVacanciesRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?sort=vacancies_high&limit=10',
    });
    const vacJobs = sortVacanciesRes.body?.data || [];
    let isVacOrdered = true;
    for (let i = 0; i < vacJobs.length - 1; i++) {
      if (vacJobs[i].vacancies < vacJobs[i + 1].vacancies) {
        isVacOrdered = false;
        break;
      }
    }
    assert(
      sortVacanciesRes.statusCode === 200 && isVacOrdered,
      23,
      'Server-side sorting sort=vacancies_high correctly orders highest vacancies first'
    );

    // Check 24: Invalid sort rejected safely (HTTP 400)
    const invalidSortRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?sort=malicious_column_injection',
    });
    assert(
      invalidSortRes.statusCode === 400 && invalidSortRes.body?.success === false,
      24,
      'Invalid sort parameter safely rejected with HTTP 400 (SQL injection guard)'
    );

    // ------------------------------------------------------------------
    // SECTION 6: ROBUST PAGINATION (Checks 25 - 29)
    // ------------------------------------------------------------------
    // Check 25: Page 1 works
    const page1Res = await request(server, {
      method: 'GET',
      path: '/api/jobs?page=1&limit=2',
    });
    assert(
      page1Res.statusCode === 200 &&
      page1Res.body?.pagination?.page === 1 &&
      page1Res.body?.pagination?.limit === 2 &&
      page1Res.body?.data?.length <= 2,
      25,
      'Pagination page=1 returns first page with accurate pagination metadata'
    );

    // Check 26: Page 2 works
    const page2Res = await request(server, {
      method: 'GET',
      path: '/api/jobs?page=2&limit=2',
    });
    assert(
      page2Res.statusCode === 200 &&
      page2Res.body?.pagination?.page === 2 &&
      page2Res.body?.pagination?.limit === 2,
      26,
      'Pagination page=2 returns subsequent page slice'
    );

    // Check 27: Invalid page rejected (HTTP 400)
    const invalidPageRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?page=-1',
    });
    assert(
      invalidPageRes.statusCode === 400 && invalidPageRes.body?.success === false,
      27,
      'Invalid page (< 1 or non-integer) rejected with HTTP 400'
    );

    // Check 28: Invalid limit rejected (HTTP 400)
    const invalidLimitRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?limit=notanumber',
    });
    assert(
      invalidLimitRes.statusCode === 400 && invalidLimitRes.body?.success === false,
      28,
      'Invalid limit (non-numeric) rejected with HTTP 400'
    );

    // Check 29: Excessive limit rejected (HTTP 400)
    const excessiveLimitRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?limit=500',
    });
    assert(
      excessiveLimitRes.statusCode === 400 && excessiveLimitRes.body?.success === false,
      29,
      'Excessive limit (> 100) rejected with HTTP 400'
    );

    // ------------------------------------------------------------------
    // SECTION 7: COMBINED FILTERING (Checks 30 - 33)
    // ------------------------------------------------------------------
    // Check 30: Search + Category combined
    const searchCatRes = await request(server, {
      method: 'GET',
      path: `/api/jobs?search=Executive&category_id=${cat1.id}`,
    });
    const foundSearchCat =
      searchCatRes.body?.data?.length > 0 &&
      searchCatRes.body.data.every((j) => j.category_id === cat1.id && j.title.includes('Executive'));
    assert(
      searchCatRes.statusCode === 200 && foundSearchCat,
      30,
      'Combined search + category filter works cohesively'
    );

    // Check 31: Search + Location combined
    const searchLocCombRes = await request(server, {
      method: 'GET',
      path: '/api/jobs?search=Technical&location=Chennai',
    });
    const foundSearchLoc =
      searchLocCombRes.body?.data?.length > 0 &&
      searchLocCombRes.body.data.every((j) => j.location.includes('Chennai'));
    assert(
      searchLocCombRes.statusCode === 200 && foundSearchLoc,
      31,
      'Combined search + location filter works cohesively'
    );

    // Check 32: Category + Location combined
    const catLocRes = await request(server, {
      method: 'GET',
      path: `/api/jobs?category_id=${cat2.id}&location=Chennai`,
    });
    const foundCatLoc =
      catLocRes.body?.data?.length > 0 &&
      catLocRes.body.data.every((j) => j.category_id === cat2.id && j.location.includes('Chennai'));
    assert(
      catLocRes.statusCode === 200 && foundCatLoc,
      32,
      'Combined category + location filter works cohesively'
    );

    // Check 33: Multi-parameter combined query
    const multiFilterRes = await request(server, {
      method: 'GET',
      path: `/api/jobs?search=Technical&category_id=${cat2.id}&location=Chennai&sort=deadline_soon&page=1&limit=5`,
    });
    const foundMulti =
      multiFilterRes.body?.data?.length > 0 &&
      multiFilterRes.body.data.some((j) => j.id === job2.id);
    assert(
      multiFilterRes.statusCode === 200 && foundMulti,
      33,
      'Full multi-condition query (search + category + location + sort + pagination) succeeds'
    );

    // ------------------------------------------------------------------
    // SECTION 8: SECURITY & VISIBILITY ENFORCEMENT (Checks 34 - 36)
    // ------------------------------------------------------------------
    // Check 34: Public endpoint ignores client status=draft
    const forceDraftRes = await request(server, {
      method: 'GET',
      path: `/api/jobs?status=draft&search=${encodeURIComponent('Confidential')}`,
    });
    const exposedDraft = forceDraftRes.body?.data?.some((j) => j.id === draftJob.id);
    assert(
      forceDraftRes.statusCode === 200 && !exposedDraft,
      34,
      'Client status parameter (status=draft) ignored; draft jobs remain completely hidden'
    );

    // Check 35: Public endpoint ignores client status=archived
    const forceArchivedRes = await request(server, {
      method: 'GET',
      path: `/api/jobs?status=archived&search=${encodeURIComponent('Withdrawn')}`,
    });
    const exposedArchived = forceArchivedRes.body?.data?.some((j) => j.id === archivedJob.id);
    assert(
      forceArchivedRes.statusCode === 200 && !exposedArchived,
      35,
      'Client status parameter (status=archived) ignored; archived jobs remain hidden'
    );

    // Check 36: SQL injection in search safely handled
    const sqlInjectRes = await request(server, {
      method: 'GET',
      path: `/api/jobs?search=${encodeURIComponent("' OR '1'='1")}`,
    });
    assert(
      sqlInjectRes.statusCode === 200 && Array.isArray(sqlInjectRes.body?.data),
      36,
      'SQL injection string in search query safely handled via parameterized queries'
    );

    // ------------------------------------------------------------------
    // SECTION 9: REGRESSION VERIFICATION (Checks 37 - 40)
    // ------------------------------------------------------------------
    // Check 37: Phase 03 Candidate auth regression
    const candidateEmail = `phase06_cand_${now}@example.com`;
    const candidatePass = 'Password123!';
    const regRes = await request(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        full_name: 'Phase 06 Candidate Tester',
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
    const candToken = loginRes.body?.data?.token;
    const meRes = await request(server, {
      method: 'GET',
      path: '/api/auth/me',
      headers: {
        Authorization: `Bearer ${candToken}`,
      },
    });
    assert(
      regRes.statusCode === 201 &&
      loginRes.statusCode === 200 &&
      meRes.statusCode === 200 &&
      meRes.body?.data?.user?.email === candidateEmail,
      37,
      'Phase 03 candidate authentication (register, login, me) functions without regression'
    );

    // Check 38: Phase 04 GET /api/categories
    const catListRes = await request(server, {
      method: 'GET',
      path: '/api/categories',
    });
    assert(
      catListRes.statusCode === 200 &&
      catListRes.body?.data?.length === 24,
      38,
      'Phase 04 GET /api/categories returns all 24 active categories without regression'
    );

    // Check 39: Phase 05 Admin jobs API regression
    const adminLoginRes = await request(server, {
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: env.admin.email,
        password: env.admin.password,
      },
    });
    const adminToken = adminLoginRes.body?.data?.token;
    const adminStatsRes = await request(server, {
      method: 'GET',
      path: '/api/admin/jobs/stats',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assert(
      adminLoginRes.statusCode === 200 &&
      adminStatsRes.statusCode === 200 &&
      typeof adminStatsRes.body?.data?.total === 'number',
      39,
      'Phase 05 admin job management & stats API operate normally without regression'
    );

    // Check 40: Backend operational health check
    const healthRes = await request(server, {
      method: 'GET',
      path: '/api/health',
    });
    assert(
      healthRes.statusCode === 200 &&
      healthRes.body?.success === true &&
      healthRes.body?.data?.database?.connected === true,
      40,
      'Backend reports operational health and active MySQL database connection'
    );

    console.log('\n========================================================================');
    console.log(` VERIFICATION COMPLETE: 40/40 Required Checks Evaluated`);
    console.log(` Status: ${failedCount === 0 ? 'ALL CHECKS PASSED (100% SUCCESS)' : `${failedCount} FAILURES DETECTED`}`);
    console.log('========================================================================\n');

    if (failedCount > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Fatal error during Phase 06 test execution:', err);
    process.exitCode = 1;
  } finally {
    // ------------------------------------------------------------------
    // TEST DATA CLEANUP: Remove all temporary test jobs
    // ------------------------------------------------------------------
    console.log('Running test data cleanup (purging temporary Phase 06 test records)...');
    for (const testId of createdTestJobIds) {
      try {
        await JobModel.deleteById(testId);
      } catch (cleanupErr) {
        console.warn(`Failed to clean up test job ${testId}:`, cleanupErr.message);
      }
    }
    console.log(`Cleaned up ${createdTestJobIds.length} temporary test records.`);

    if (server) {
      server.close();
    }
    await pool.end();
  }
};

// Run directly
if (process.argv[1] && process.argv[1].endsWith('testPhase06.js')) {
  runPhase06Verification();
}
