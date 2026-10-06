import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import app from '../src/app.js';
import pool from '../src/config/db.config.js';
import { initializeDatabase } from '../src/scripts/initDb.js';
import UserModel from '../src/models/user.model.js';
import JobModel from '../src/models/job.model.js';
import JobCategoryModel from '../src/models/jobCategory.model.js';
import ApplicationModel from '../src/models/application.model.js';
import ApplicationDocumentModel from '../src/models/applicationDocument.model.js';
import { env } from '../src/config/env.config.js';

// Native HTTP JSON request helper
const request = (server, { method, path: reqPath, headers = {}, body = null }) => {
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
        path: reqPath,
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

// Native Multipart/form-data request helper
const requestMultipart = (server, { method = 'POST', path: reqPath, headers = {}, fields = {}, files = [] }) => {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const port = addr.port;
    const boundary = '----WebKitFormBoundary' + crypto.randomBytes(16).toString('hex');
    const chunks = [];

    // Add textual form fields
    for (const [key, val] of Object.entries(fields)) {
      chunks.push(
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`)
      );
    }

    // Add file attachments
    for (const file of files) {
      chunks.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${file.name}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`
        )
      );
      chunks.push(file.buffer);
      chunks.push(Buffer.from('\r\n'));
    }

    chunks.push(Buffer.from(`--${boundary}--\r\n`));
    const fullBody = Buffer.concat(chunks);

    const reqHeaders = {
      Accept: 'application/json',
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': fullBody.length,
      ...headers,
    };

    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        method,
        path: reqPath,
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
    req.write(fullBody);
    req.end();
  });
};

export const runPhase07Verification = async () => {
  console.log('\n========================================================================');
  console.log(' GOVERNMENT JOB PORTAL - PHASE 07 CANDIDATE APPLICATION ENGINE TESTS');
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
  const createdAppIds = [];
  let candidate1Token = null;
  let candidate1Id = null;
  let candidate2Token = null;
  let candidate2Id = null;
  let adminToken = null;
  let publishedJobId = null;
  let categoryId = null;

  try {
    // ------------------------------------------------------------------
    // STEP 0: START TEST SERVER & ENSURE DB TABLES
    // ------------------------------------------------------------------
    await initializeDatabase();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    console.log(`[INIT] Automated test server running on 127.0.0.1:${port}\n`);

    // ------------------------------------------------------------------
    // SECTION 1: AUTHENTICATION PREPARATION (Checks 01 - 03)
    // ------------------------------------------------------------------
    console.log('--- SECTION 1: CANDIDATE & ADMIN AUTHENTICATION ---');

    // Register Candidate 1
    const cand1Email = `test.cand1.${Date.now()}@portal.gov.in`;
    const cand1Reg = await request(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        full_name: 'Priya Sharma Candidate',
        email: cand1Email,
        mobile_number: '9876543211',
        password: 'Password@123',
        confirm_password: 'Password@123',
      },
    });
    assert(cand1Reg.statusCode === 201 && cand1Reg.body?.data?.token, 1, 'Candidate 1 registered and issued JWT token');
    candidate1Token = cand1Reg.body?.data?.token;
    candidate1Id = cand1Reg.body?.data?.user?.id;

    // Register Candidate 2
    const cand2Email = `test.cand2.${Date.now()}@portal.gov.in`;
    const cand2Reg = await request(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        full_name: 'Amit Verma Candidate',
        email: cand2Email,
        mobile_number: '9876543212',
        password: 'Password@123',
        confirm_password: 'Password@123',
      },
    });
    assert(cand2Reg.statusCode === 201 && cand2Reg.body?.data?.token, 2, 'Candidate 2 registered and issued JWT token');
    candidate2Token = cand2Reg.body?.data?.token;
    candidate2Id = cand2Reg.body?.data?.user?.id;

    // Admin login
    const adminLogin = await request(server, {
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: env.admin.email,
        password: env.admin.password,
      },
    });
    assert(adminLogin.statusCode === 200 && adminLogin.body?.data?.token, 3, 'Official Admin logged in successfully');
    adminToken = adminLogin.body?.data?.token;

    // ------------------------------------------------------------------
    // SECTION 2: DATABASE SCHEMA & CONSTRAINTS (Checks 04 - 07)
    // ------------------------------------------------------------------
    console.log('\n--- SECTION 2: DATABASE SCHEMA & INTEGRITY CONSTRAINTS ---');

    const [appCols] = await pool.query("SHOW COLUMNS FROM applications LIKE 'application_id'");
    assert(appCols.length > 0, 4, '`applications` table exists with `application_id` column');

    const [docCols] = await pool.query("SHOW COLUMNS FROM application_documents LIKE 'document_type'");
    assert(docCols.length > 0, 5, '`application_documents` table exists with `document_type` column');

    const [uqJobCandidate] = await pool.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'applications' 
        AND CONSTRAINT_NAME = 'uq_applications_job_candidate'
    `);
    assert(uqJobCandidate.length > 0, 6, 'Duplicate application prevention: `uq_applications_job_candidate` exists');

    const [uqAppId] = await pool.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'applications' 
        AND CONSTRAINT_NAME = 'uq_applications_app_id'
    `);
    assert(uqAppId.length > 0, 7, 'Application ID uniqueness: `uq_applications_app_id` constraint exists');

    // ------------------------------------------------------------------
    // SECTION 3: TEST VACANCIES PREPARATION (Checks 08)
    // ------------------------------------------------------------------
    console.log('\n--- SECTION 3: RECRUITMENT VACANCY SETUP ---');

    const [categories] = await pool.query("SELECT id FROM job_categories WHERE status = 'active' LIMIT 1");
    categoryId = categories[0]?.id || 1;

    // Create a published test job with future deadline (e.g. 2027-12-31)
    const pubJob = await JobModel.create({
      job_code: `TEST-P07-PUB-${Date.now()}`,
      title: 'Senior Officer Recruitment Phase 07',
      organization: 'Ministry of Digital Governance',
      department: 'Central IT Department',
      category_id: categoryId,
      description: 'Comprehensive officer position requiring candidate application testing.',
      vacancies: 25,
      qualification: 'B.Tech or MCA from recognized university',
      age_limit: '21 to 35 Years',
      salary: 'Level 10 (Rs. 56,100 - Rs. 1,77,500)',
      location: 'New Delhi',
      experience: '2 Years',
      application_fee: 'Rs. 250',
      opening_date: '2026-01-01',
      last_date: '2027-12-31',
      status: 'published',
      created_by: 1,
    });
    publishedJobId = pubJob.id;
    createdTestJobIds.push(publishedJobId);
    assert(publishedJobId > 0, 8, 'Published recruitment vacancy created with future deadline');

    // ------------------------------------------------------------------
    // SECTION 4: CANDIDATE APPLICATION SUBMISSION & VALIDATION (Checks 09 - 25)
    // ------------------------------------------------------------------
    console.log('\n--- SECTION 4: CANDIDATE APPLICATION ATOMIC SUBMISSION ---');

    // Mock binary buffers
    const dummyPdfBuffer = Buffer.from('%PDF-1.4\n%mock resume document content for test\n%%EOF');
    const dummyJpgBuffer = Buffer.from('\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB\x00C\x00mock photo\xFF\xD9');

    // Valid Application Submission by Candidate 1
    const validSubmitRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/applications',
      headers: {
        Authorization: `Bearer ${candidate1Token}`,
      },
      fields: {
        job_id: publishedJobId,
        full_name: 'Priya Sharma',
        email: cand1Email,
        mobile_number: '9876543211',
        date_of_birth: '1998-05-15',
        gender: 'female',
        address_line: 'House No. 12, Civil Lines',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302001',
        highest_qualification: 'Graduate',
        qualification_details: 'B.Tech Information Technology',
        university_or_board: 'Rajasthan Technical University',
        passing_year: '2020',
        percentage_or_cgpa: '84.5%',
        experience_status: 'experienced',
        experience_details: '3 years IT software experience',
        declaration_accepted: 'true',
      },
      files: [
        {
          name: 'resume',
          filename: 'priya_sharma_resume.pdf',
          contentType: 'application/pdf',
          buffer: dummyPdfBuffer,
        },
        {
          name: 'photograph',
          filename: 'priya_photo.jpg',
          contentType: 'image/jpeg',
          buffer: dummyJpgBuffer,
        },
      ],
    });

    assert(validSubmitRes.statusCode === 201, 9, 'Candidate 1 can create valid application (HTTP 201)');
    assert(validSubmitRes.body?.success === true, 10, 'Application response has success: true');

    const createdAppId = validSubmitRes.body?.data?.id;
    const humanAppId = validSubmitRes.body?.data?.application_id;
    if (createdAppId) createdAppIds.push(createdAppId);

    assert(
      typeof humanAppId === 'string' && /^APP-202[0-9]-[A-F0-9]{8}$/.test(humanAppId),
      11,
      `Deterministic Application ID generated properly: ${humanAppId}`
    );

    assert(
      validSubmitRes.body?.data?.status === 'submitted',
      12,
      "Default lifecycle status is 'submitted'"
    );

    // Verify stored application in database
    const dbApp = await ApplicationModel.findById(createdAppId);
    assert(
      dbApp &&
        dbApp.full_name === 'Priya Sharma' &&
        dbApp.email === cand1Email &&
        dbApp.highest_qualification === 'Graduate' &&
        dbApp.declaration_accepted === 1,
      13,
      'Application data stored correctly in MySQL `applications` table'
    );

    // Verify stored documents in database
    const dbDocs = await ApplicationDocumentModel.findByApplicationId(createdAppId);
    assert(
      dbDocs.length === 2 &&
        dbDocs.some((d) => d.document_type === 'resume') &&
        dbDocs.some((d) => d.document_type === 'photograph'),
      14,
      'Documents records created in `application_documents` table'
    );

    // Verify files exist in filesystem
    const resumeDoc = dbDocs.find((d) => d.document_type === 'resume');
    const photoDoc = dbDocs.find((d) => d.document_type === 'photograph');
    const resumeOnDisk = resumeDoc && fs.existsSync(path.resolve(process.cwd(), 'uploads', resumeDoc.file_path));
    const photoOnDisk = photoDoc && fs.existsSync(path.resolve(process.cwd(), 'uploads', photoDoc.file_path));
    assert(resumeOnDisk && photoOnDisk, 15, 'Uploaded resume & photograph safely stored in filesystem under uploads/applications/');

    // Candidate 1 retrieves own applications list
    const myAppsRes = await request(server, {
      method: 'GET',
      path: '/api/applications',
      headers: { Authorization: `Bearer ${candidate1Token}` },
    });
    assert(
      myAppsRes.statusCode === 200 && Array.isArray(myAppsRes.body?.data) && myAppsRes.body?.data.length >= 1,
      16,
      "Candidate can retrieve own applications list (GET /api/applications)"
    );

    assert(
      myAppsRes.body?.data[0]?.job_title === 'Senior Officer Recruitment Phase 07',
      17,
      'Applications list contains joined job information (title, organization, code)'
    );

    // Candidate 1 retrieves single application details
    const singleAppRes = await request(server, {
      method: 'GET',
      path: `/api/applications/${createdAppId}`,
      headers: { Authorization: `Bearer ${candidate1Token}` },
    });
    assert(
      singleAppRes.statusCode === 200 && singleAppRes.body?.data?.application_id === humanAppId,
      18,
      'Candidate can retrieve single application details by ID'
    );

    assert(
      Array.isArray(singleAppRes.body?.data?.documents) && singleAppRes.body?.data?.documents.length === 2,
      19,
      'Application details response includes attached documents metadata'
    );

    // Candidate 2 attempts to retrieve Candidate 1's application -> 403 Forbidden
    const cand2ForbiddenRes = await request(server, {
      method: 'GET',
      path: `/api/applications/${createdAppId}`,
      headers: { Authorization: `Bearer ${candidate2Token}` },
    });
    assert(
      cand2ForbiddenRes.statusCode === 403,
      20,
      "Candidate cannot access another candidate's application (HTTP 403 Forbidden)"
    );

    // Duplicate Application Prevention: Candidate 1 tries to apply again to the same job
    const duplicateAppRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/applications',
      headers: { Authorization: `Bearer ${candidate1Token}` },
      fields: {
        job_id: publishedJobId,
        full_name: 'Priya Sharma Second Attempt',
        email: cand1Email,
        mobile_number: '9876543211',
        date_of_birth: '1998-05-15',
        gender: 'female',
        address_line: 'Civil Lines',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302001',
        highest_qualification: 'Graduate',
        university_or_board: 'RTU',
        passing_year: '2020',
        percentage_or_cgpa: '84.5%',
        declaration_accepted: 'true',
      },
      files: [
        { name: 'resume', filename: 'resume.pdf', contentType: 'application/pdf', buffer: dummyPdfBuffer },
        { name: 'photograph', filename: 'photo.jpg', contentType: 'image/jpeg', buffer: dummyJpgBuffer },
      ],
    });
    assert(
      duplicateAppRes.statusCode === 409,
      21,
      'Duplicate application submission rejected with HTTP 409 Conflict'
    );

    assert(
      duplicateAppRes.body?.message?.includes('already applied'),
      22,
      'Duplicate rejection message clearly states "You have already applied for this job."'
    );

    // Check application status endpoint for candidate 1
    const checkAppliedRes1 = await request(server, {
      method: 'GET',
      path: `/api/applications/check/${publishedJobId}`,
      headers: { Authorization: `Bearer ${candidate1Token}` },
    });
    assert(
      checkAppliedRes1.statusCode === 200 && checkAppliedRes1.body?.data?.applied === true,
      23,
      'Check status endpoint correctly returns applied = true for Candidate 1'
    );

    // Check application status endpoint for candidate 2 (who hasn't applied)
    const checkAppliedRes2 = await request(server, {
      method: 'GET',
      path: `/api/applications/check/${publishedJobId}`,
      headers: { Authorization: `Bearer ${candidate2Token}` },
    });
    assert(
      checkAppliedRes2.statusCode === 200 && checkAppliedRes2.body?.data?.applied === false,
      24,
      'Check status endpoint correctly returns applied = false for Candidate 2'
    );

    // Unauthenticated request to candidate application endpoint
    const unauthAppRes = await request(server, {
      method: 'GET',
      path: '/api/applications',
    });
    assert(
      unauthAppRes.statusCode === 401,
      25,
      'Unauthenticated request to candidate applications rejected with HTTP 401'
    );

    // ------------------------------------------------------------------
    // SECTION 5: JOB ELIGIBILITY & DEADLINE CHECKS (Checks 26 - 32)
    // ------------------------------------------------------------------
    console.log('\n--- SECTION 5: JOB ELIGIBILITY & DEADLINE ENFORCEMENT ---');

    // Admin role attempts to submit candidate application
    const adminSubmitRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/applications',
      headers: { Authorization: `Bearer ${adminToken}` },
      fields: {
        job_id: publishedJobId,
        full_name: 'Admin Citizen Test',
        email: 'admin@recruitment.gov.in',
        mobile_number: '9876543299',
        date_of_birth: '1990-01-01',
        gender: 'male',
        address_line: 'Ministry Quarters',
        city: 'Delhi',
        district: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        highest_qualification: 'Graduate',
        university_or_board: 'DU',
        passing_year: '2012',
        percentage_or_cgpa: '75%',
        declaration_accepted: 'true',
      },
      files: [
        { name: 'resume', filename: 'resume.pdf', contentType: 'application/pdf', buffer: dummyPdfBuffer },
        { name: 'photograph', filename: 'photo.jpg', contentType: 'image/jpeg', buffer: dummyJpgBuffer },
      ],
    });
    assert(
      adminSubmitRes.statusCode === 403,
      26,
      'Admin role rejected from submitting candidate applications (HTTP 403 Forbidden)'
    );

    // Create a DRAFT job -> Attempt candidate application
    const draftJob = await JobModel.create({
      job_code: `TEST-P07-DRAFT-${Date.now()}`,
      title: 'Draft Vacancy Not Yet Published',
      organization: 'Department of Personnel',
      category_id: categoryId,
      vacancies: 5,
      last_date: '2027-12-31',
      status: 'draft',
      created_by: 1,
    });
    createdTestJobIds.push(draftJob.id);

    const draftApplyRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/applications',
      headers: { Authorization: `Bearer ${candidate2Token}` },
      fields: {
        job_id: draftJob.id,
        full_name: 'Amit Verma',
        email: cand2Email,
        mobile_number: '9876543212',
        date_of_birth: '1995-02-10',
        gender: 'male',
        address_line: 'Model Town',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302017',
        highest_qualification: 'Graduate',
        university_or_board: 'RU',
        passing_year: '2017',
        percentage_or_cgpa: '72%',
        declaration_accepted: 'true',
      },
      files: [
        { name: 'resume', filename: 'resume.pdf', contentType: 'application/pdf', buffer: dummyPdfBuffer },
        { name: 'photograph', filename: 'photo.jpg', contentType: 'image/jpeg', buffer: dummyJpgBuffer },
      ],
    });
    assert(
      draftApplyRes.statusCode === 400,
      27,
      'Draft job cannot receive applications (HTTP 400 Bad Request)'
    );

    // Create a CLOSED job -> Attempt candidate application
    const closedJob = await JobModel.create({
      job_code: `TEST-P07-CLOSED-${Date.now()}`,
      title: 'Closed Recruitment Cycle',
      organization: 'Department of Revenue',
      category_id: categoryId,
      vacancies: 2,
      last_date: '2027-12-31',
      status: 'closed',
      created_by: 1,
    });
    createdTestJobIds.push(closedJob.id);

    const closedApplyRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/applications',
      headers: { Authorization: `Bearer ${candidate2Token}` },
      fields: {
        job_id: closedJob.id,
        full_name: 'Amit Verma',
        email: cand2Email,
        mobile_number: '9876543212',
        date_of_birth: '1995-02-10',
        gender: 'male',
        address_line: 'Model Town',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302017',
        highest_qualification: 'Graduate',
        university_or_board: 'RU',
        passing_year: '2017',
        percentage_or_cgpa: '72%',
        declaration_accepted: 'true',
      },
      files: [
        { name: 'resume', filename: 'resume.pdf', contentType: 'application/pdf', buffer: dummyPdfBuffer },
        { name: 'photograph', filename: 'photo.jpg', contentType: 'image/jpeg', buffer: dummyJpgBuffer },
      ],
    });
    assert(
      closedApplyRes.statusCode === 400,
      28,
      'Closed job cannot receive applications (HTTP 400 Bad Request)'
    );

    // Create an EXPIRED deadline job (e.g. 2025-01-01)
    const expiredJob = await JobModel.create({
      job_code: `TEST-P07-EXPIRED-${Date.now()}`,
      title: 'Expired Deadline Vacancy',
      organization: 'Department of Mines',
      category_id: categoryId,
      vacancies: 10,
      opening_date: '2024-01-01',
      last_date: '2025-01-01',
      status: 'published',
      created_by: 1,
    });
    createdTestJobIds.push(expiredJob.id);

    const expiredApplyRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/applications',
      headers: { Authorization: `Bearer ${candidate2Token}` },
      fields: {
        job_id: expiredJob.id,
        full_name: 'Amit Verma',
        email: cand2Email,
        mobile_number: '9876543212',
        date_of_birth: '1995-02-10',
        gender: 'male',
        address_line: 'Model Town',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302017',
        highest_qualification: 'Graduate',
        university_or_board: 'RU',
        passing_year: '2017',
        percentage_or_cgpa: '72%',
        declaration_accepted: 'true',
      },
      files: [
        { name: 'resume', filename: 'resume.pdf', contentType: 'application/pdf', buffer: dummyPdfBuffer },
        { name: 'photograph', filename: 'photo.jpg', contentType: 'image/jpeg', buffer: dummyJpgBuffer },
      ],
    });
    assert(
      expiredApplyRes.statusCode === 400 && expiredApplyRes.body?.message?.includes('expired'),
      29,
      'Application deadline enforcement: Expired job application rejected (HTTP 400)'
    );

    // Create an ARCHIVED job
    const archivedJob = await JobModel.create({
      job_code: `TEST-P07-ARCHIVED-${Date.now()}`,
      title: 'Archived Government Job',
      organization: 'Central Public Works',
      category_id: categoryId,
      vacancies: 1,
      last_date: '2027-12-31',
      status: 'archived',
      created_by: 1,
    });
    createdTestJobIds.push(archivedJob.id);

    const archivedApplyRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/applications',
      headers: { Authorization: `Bearer ${candidate2Token}` },
      fields: {
        job_id: archivedJob.id,
        full_name: 'Amit Verma',
        email: cand2Email,
        mobile_number: '9876543212',
        date_of_birth: '1995-02-10',
        gender: 'male',
        address_line: 'Model Town',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302017',
        highest_qualification: 'Graduate',
        university_or_board: 'RU',
        passing_year: '2017',
        percentage_or_cgpa: '72%',
        declaration_accepted: 'true',
      },
      files: [
        { name: 'resume', filename: 'resume.pdf', contentType: 'application/pdf', buffer: dummyPdfBuffer },
        { name: 'photograph', filename: 'photo.jpg', contentType: 'image/jpeg', buffer: dummyJpgBuffer },
      ],
    });
    assert(
      archivedApplyRes.statusCode === 400,
      30,
      'Archived job cannot receive applications (HTTP 400 Bad Request)'
    );

    // Non-existent job ID
    const nonExistentApplyRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/applications',
      headers: { Authorization: `Bearer ${candidate2Token}` },
      fields: {
        job_id: 9999999,
        full_name: 'Amit Verma',
        email: cand2Email,
        mobile_number: '9876543212',
        date_of_birth: '1995-02-10',
        gender: 'male',
        address_line: 'Model Town',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302017',
        highest_qualification: 'Graduate',
        university_or_board: 'RU',
        passing_year: '2017',
        percentage_or_cgpa: '72%',
        declaration_accepted: 'true',
      },
      files: [
        { name: 'resume', filename: 'resume.pdf', contentType: 'application/pdf', buffer: dummyPdfBuffer },
        { name: 'photograph', filename: 'photo.jpg', contentType: 'image/jpeg', buffer: dummyJpgBuffer },
      ],
    });
    assert(
      nonExistentApplyRes.statusCode === 404,
      31,
      'Non-existent job rejected with HTTP 404 Not Found'
    );

    // ------------------------------------------------------------------
    // SECTION 6: FORM FIELDS & FILE VALIDATION (Checks 32 - 42)
    // ------------------------------------------------------------------
    console.log('\n--- SECTION 6: VALIDATION & SECURITY CHECKS ---');

    // Missing declaration acceptance
    const noDeclRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/applications',
      headers: { Authorization: `Bearer ${candidate2Token}` },
      fields: {
        job_id: publishedJobId,
        full_name: 'Amit Verma',
        email: cand2Email,
        mobile_number: '9876543212',
        date_of_birth: '1995-02-10',
        gender: 'male',
        address_line: 'Model Town',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302017',
        highest_qualification: 'Graduate',
        university_or_board: 'RU',
        passing_year: '2017',
        percentage_or_cgpa: '72%',
        declaration_accepted: 'false', // missing/false declaration
      },
      files: [
        { name: 'resume', filename: 'resume.pdf', contentType: 'application/pdf', buffer: dummyPdfBuffer },
        { name: 'photograph', filename: 'photo.jpg', contentType: 'image/jpeg', buffer: dummyJpgBuffer },
      ],
    });
    assert(
      noDeclRes.statusCode === 422,
      32,
      'Missing or unaccepted declaration rejected with HTTP 422'
    );

    // Invalid Email format
    const badEmailRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/applications',
      headers: { Authorization: `Bearer ${candidate2Token}` },
      fields: {
        job_id: publishedJobId,
        full_name: 'Amit Verma',
        email: 'not-an-email',
        mobile_number: '9876543212',
        date_of_birth: '1995-02-10',
        gender: 'male',
        address_line: 'Model Town',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302017',
        highest_qualification: 'Graduate',
        university_or_board: 'RU',
        passing_year: '2017',
        percentage_or_cgpa: '72%',
        declaration_accepted: 'true',
      },
      files: [
        { name: 'resume', filename: 'resume.pdf', contentType: 'application/pdf', buffer: dummyPdfBuffer },
        { name: 'photograph', filename: 'photo.jpg', contentType: 'image/jpeg', buffer: dummyJpgBuffer },
      ],
    });
    assert(
      badEmailRes.statusCode === 422,
      33,
      'Malformed email address rejected with HTTP 422'
    );

    // Future date of birth
    const futureDobRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/applications',
      headers: { Authorization: `Bearer ${candidate2Token}` },
      fields: {
        job_id: publishedJobId,
        full_name: 'Amit Verma',
        email: cand2Email,
        mobile_number: '9876543212',
        date_of_birth: '2099-01-01',
        gender: 'male',
        address_line: 'Model Town',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302017',
        highest_qualification: 'Graduate',
        university_or_board: 'RU',
        passing_year: '2017',
        percentage_or_cgpa: '72%',
        declaration_accepted: 'true',
      },
      files: [
        { name: 'resume', filename: 'resume.pdf', contentType: 'application/pdf', buffer: dummyPdfBuffer },
        { name: 'photograph', filename: 'photo.jpg', contentType: 'image/jpeg', buffer: dummyJpgBuffer },
      ],
    });
    assert(
      futureDobRes.statusCode === 422,
      34,
      'Future date of birth rejected with HTTP 422'
    );

    // Invalid gender
    const badGenderRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/applications',
      headers: { Authorization: `Bearer ${candidate2Token}` },
      fields: {
        job_id: publishedJobId,
        full_name: 'Amit Verma',
        email: cand2Email,
        mobile_number: '9876543212',
        date_of_birth: '1995-02-10',
        gender: 'alien',
        address_line: 'Model Town',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302017',
        highest_qualification: 'Graduate',
        university_or_board: 'RU',
        passing_year: '2017',
        percentage_or_cgpa: '72%',
        declaration_accepted: 'true',
      },
      files: [
        { name: 'resume', filename: 'resume.pdf', contentType: 'application/pdf', buffer: dummyPdfBuffer },
        { name: 'photograph', filename: 'photo.jpg', contentType: 'image/jpeg', buffer: dummyJpgBuffer },
      ],
    });
    assert(
      badGenderRes.statusCode === 422,
      35,
      'Invalid gender option rejected with HTTP 422'
    );

    // Missing resume file
    const noResumeRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/applications',
      headers: { Authorization: `Bearer ${candidate2Token}` },
      fields: {
        job_id: publishedJobId,
        full_name: 'Amit Verma',
        email: cand2Email,
        mobile_number: '9876543212',
        date_of_birth: '1995-02-10',
        gender: 'male',
        address_line: 'Model Town',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302017',
        highest_qualification: 'Graduate',
        university_or_board: 'RU',
        passing_year: '2017',
        percentage_or_cgpa: '72%',
        declaration_accepted: 'true',
      },
      files: [
        { name: 'photograph', filename: 'photo.jpg', contentType: 'image/jpeg', buffer: dummyJpgBuffer },
      ],
    });
    assert(
      noResumeRes.statusCode === 422,
      36,
      'Missing resume document rejected with HTTP 422'
    );

    // Missing photo file
    const noPhotoRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/applications',
      headers: { Authorization: `Bearer ${candidate2Token}` },
      fields: {
        job_id: publishedJobId,
        full_name: 'Amit Verma',
        email: cand2Email,
        mobile_number: '9876543212',
        date_of_birth: '1995-02-10',
        gender: 'male',
        address_line: 'Model Town',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302017',
        highest_qualification: 'Graduate',
        university_or_board: 'RU',
        passing_year: '2017',
        percentage_or_cgpa: '72%',
        declaration_accepted: 'true',
      },
      files: [
        { name: 'resume', filename: 'resume.pdf', contentType: 'application/pdf', buffer: dummyPdfBuffer },
      ],
    });
    assert(
      noPhotoRes.statusCode === 422,
      37,
      'Missing candidate photograph rejected with HTTP 422'
    );

    // Dangerous/Executable file upload rejection (.exe / .sh)
    const dangerousExeRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/applications',
      headers: { Authorization: `Bearer ${candidate2Token}` },
      fields: {
        job_id: publishedJobId,
        full_name: 'Amit Verma',
        email: cand2Email,
        mobile_number: '9876543212',
        date_of_birth: '1995-02-10',
        gender: 'male',
        address_line: 'Model Town',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302017',
        highest_qualification: 'Graduate',
        university_or_board: 'RU',
        passing_year: '2017',
        percentage_or_cgpa: '72%',
        declaration_accepted: 'true',
      },
      files: [
        {
          name: 'resume',
          filename: 'malicious_payload.exe',
          contentType: 'application/x-msdownload',
          buffer: Buffer.from('MZ\x90\x00\x03mock binary'),
        },
        { name: 'photograph', filename: 'photo.jpg', contentType: 'image/jpeg', buffer: dummyJpgBuffer },
      ],
    });
    assert(
      dangerousExeRes.statusCode === 400 && dangerousExeRes.body?.message?.includes('prohibited'),
      38,
      'Strict executable blacklist: .exe upload rejected immediately with HTTP 400'
    );

    // Oversized photograph rejection (> 2 MB)
    const oversizedPhotoBuffer = Buffer.alloc(2.5 * 1024 * 1024, 0xaa);
    const oversizedPhotoRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/applications',
      headers: { Authorization: `Bearer ${candidate2Token}` },
      fields: {
        job_id: publishedJobId,
        full_name: 'Amit Verma',
        email: cand2Email,
        mobile_number: '9876543212',
        date_of_birth: '1995-02-10',
        gender: 'male',
        address_line: 'Model Town',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302017',
        highest_qualification: 'Graduate',
        university_or_board: 'RU',
        passing_year: '2017',
        percentage_or_cgpa: '72%',
        declaration_accepted: 'true',
      },
      files: [
        { name: 'resume', filename: 'resume.pdf', contentType: 'application/pdf', buffer: dummyPdfBuffer },
        { name: 'photograph', filename: 'huge_photo.jpg', contentType: 'image/jpeg', buffer: oversizedPhotoBuffer },
      ],
    });
    assert(
      oversizedPhotoRes.statusCode === 400 && oversizedPhotoRes.body?.message?.includes('exceeds'),
      39,
      'Oversized photograph (> 2 MB) rejected with HTTP 400'
    );

    // Valid submission by Candidate 2 including optional certificate
    const cand2ValidRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/applications',
      headers: { Authorization: `Bearer ${candidate2Token}` },
      fields: {
        job_id: publishedJobId,
        full_name: 'Amit Verma',
        email: cand2Email,
        mobile_number: '9876543212',
        date_of_birth: '1995-02-10',
        gender: 'male',
        address_line: 'House 44, Model Town',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302017',
        highest_qualification: 'Post Graduate',
        qualification_details: 'M.Sc Information Systems',
        university_or_board: 'University of Rajasthan',
        passing_year: '2018',
        percentage_or_cgpa: '76.8%',
        experience_status: 'fresher',
        declaration_accepted: 'true',
      },
      files: [
        { name: 'resume', filename: 'amit_verma_cv.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from('mock docx content') },
        { name: 'photograph', filename: 'amit_photo.png', contentType: 'image/png', buffer: Buffer.from('\x89PNG\r\n\x1a\nmock png') },
        { name: 'certificate', filename: 'category_cert.pdf', contentType: 'application/pdf', buffer: dummyPdfBuffer },
      ],
    });
    assert(
      cand2ValidRes.statusCode === 201,
      40,
      'Candidate 2 application with resume, photo, and certificate created successfully'
    );
    const cand2AppId = cand2ValidRes.body?.data?.id;
    if (cand2AppId) createdAppIds.push(cand2AppId);

    // Candidate 1 downloads own document
    const cand1DocId = resumeDoc.id;
    const downloadDocRes = await request(server, {
      method: 'GET',
      path: `/api/applications/documents/${cand1DocId}/download`,
      headers: { Authorization: `Bearer ${candidate1Token}` },
    });
    assert(
      downloadDocRes.statusCode === 200,
      41,
      'Candidate 1 can download own application document (HTTP 200)'
    );

    // Candidate 2 attempts to download Candidate 1's document -> 403 Forbidden
    const cand2DocForbidden = await request(server, {
      method: 'GET',
      path: `/api/applications/documents/${cand1DocId}/download`,
      headers: { Authorization: `Bearer ${candidate2Token}` },
    });
    assert(
      cand2DocForbidden.statusCode === 403,
      42,
      "Candidate 2 cannot access Candidate 1's document (HTTP 403 Forbidden)"
    );

    // ------------------------------------------------------------------
    // SECTION 7: CANDIDATE APPLICATION WITHDRAWAL (Checks 43 - 45)
    // ------------------------------------------------------------------
    console.log('\n--- SECTION 7: CANDIDATE APPLICATION WITHDRAWAL LIFECYCLE ---');

    // Candidate 2 withdraws application while in 'submitted' status
    const withdrawRes = await request(server, {
      method: 'PATCH',
      path: `/api/applications/${cand2AppId}/withdraw`,
      headers: { Authorization: `Bearer ${candidate2Token}` },
    });
    assert(
      withdrawRes.statusCode === 200 && withdrawRes.body?.data?.status === 'withdrawn',
      43,
      "Candidate 2 successfully withdrew application (status -> 'withdrawn')"
    );

    // Candidate 2 attempts to withdraw again -> rejected (already withdrawn)
    const repeatWithdrawRes = await request(server, {
      method: 'PATCH',
      path: `/api/applications/${cand2AppId}/withdraw`,
      headers: { Authorization: `Bearer ${candidate2Token}` },
    });
    assert(
      repeatWithdrawRes.statusCode === 400,
      44,
      'Withdrawn application cannot be withdrawn again (HTTP 400 Bad Request)'
    );

    // Candidate 1 attempts to withdraw Candidate 2's application -> 403 Forbidden
    const crossWithdrawRes = await request(server, {
      method: 'PATCH',
      path: `/api/applications/${cand2AppId}/withdraw`,
      headers: { Authorization: `Bearer ${candidate1Token}` },
    });
    assert(
      crossWithdrawRes.statusCode === 403,
      45,
      "Candidate cannot withdraw another candidate's application (HTTP 403 Forbidden)"
    );

    // ------------------------------------------------------------------
    // SECTION 8: ADMIN APPLICATION MANAGEMENT (Checks 46 - 57)
    // ------------------------------------------------------------------
    console.log('\n--- SECTION 8: ADMIN APPLICATIONS MANAGEMENT & SCRUTINY ---');

    // Admin lists applications
    const adminListRes = await request(server, {
      method: 'GET',
      path: '/api/admin/applications',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminListRes.statusCode === 200 && Array.isArray(adminListRes.body?.data) && adminListRes.body?.data.length >= 2,
      46,
      'Admin can list all applications (GET /api/admin/applications)'
    );

    // Admin application stats
    const adminStatsRes = await request(server, {
      method: 'GET',
      path: '/api/admin/applications/stats',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminStatsRes.statusCode === 200 &&
        adminStatsRes.body?.data?.total >= 2 &&
        adminStatsRes.body?.data?.submitted >= 1 &&
        adminStatsRes.body?.data?.withdrawn >= 1,
      47,
      'Admin statistics endpoint reports accurate totals and status counts'
    );

    // Admin searches applications by candidate name
    const adminSearchRes = await request(server, {
      method: 'GET',
      path: '/api/admin/applications?search=Priya',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminSearchRes.statusCode === 200 &&
        adminSearchRes.body?.data.some((a) => a.full_name.includes('Priya')),
      48,
      'Admin application keyword search works properly'
    );

    // Admin filters applications by status 'withdrawn'
    const adminFilterRes = await request(server, {
      method: 'GET',
      path: '/api/admin/applications?status=withdrawn',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminFilterRes.statusCode === 200 &&
        adminFilterRes.body?.data.every((a) => a.status === 'withdrawn'),
      49,
      'Admin status filter strictly isolates target lifecycle status'
    );

    // Admin views single application details
    const adminViewApp = await request(server, {
      method: 'GET',
      path: `/api/admin/applications/${createdAppId}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminViewApp.statusCode === 200 && adminViewApp.body?.data?.application_id === humanAppId,
      50,
      'Admin can view complete application record with candidate details'
    );

    // Admin can download candidate document
    const adminDocDownload = await request(server, {
      method: 'GET',
      path: `/api/admin/applications/documents/${cand1DocId}/download`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminDocDownload.statusCode === 200,
      51,
      'Admin can securely download candidate documents'
    );

    // Admin lifecycle update: submitted -> under_review
    const statusUnderReview = await request(server, {
      method: 'PATCH',
      path: `/api/admin/applications/${createdAppId}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'under_review' },
    });
    assert(
      statusUnderReview.statusCode === 200 && statusUnderReview.body?.data?.status === 'under_review',
      52,
      "Admin status transition: 'submitted' -> 'under_review' valid"
    );

    // Admin lifecycle update: under_review -> shortlisted
    const statusShortlist = await request(server, {
      method: 'PATCH',
      path: `/api/admin/applications/${createdAppId}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'shortlisted' },
    });
    assert(
      statusShortlist.statusCode === 200 && statusShortlist.body?.data?.status === 'shortlisted',
      53,
      "Admin status transition: 'under_review' -> 'shortlisted' valid"
    );

    // Admin lifecycle update: shortlisted -> selected
    const statusSelect = await request(server, {
      method: 'PATCH',
      path: `/api/admin/applications/${createdAppId}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'selected' },
    });
    assert(
      statusSelect.statusCode === 200 && statusSelect.body?.data?.status === 'selected',
      54,
      "Admin status transition: 'shortlisted' -> 'selected' valid"
    );

    // Invalid lifecycle transition: terminal 'selected' status cannot be transitioned back to 'submitted'
    const invalidTrans = await request(server, {
      method: 'PATCH',
      path: `/api/admin/applications/${createdAppId}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'submitted' },
    });
    assert(
      invalidTrans.statusCode === 422,
      55,
      "Invalid lifecycle transition ('selected' -> 'submitted') rejected with HTTP 422"
    );

    // Candidate cannot call admin applications endpoint
    const candAdminForbidden = await request(server, {
      method: 'GET',
      path: '/api/admin/applications',
      headers: { Authorization: `Bearer ${candidate1Token}` },
    });
    assert(
      candAdminForbidden.statusCode === 403,
      56,
      'Candidate is forbidden from accessing administrative application console (HTTP 403)'
    );

    // Candidate cannot change application status via admin endpoint
    const candStatusForbidden = await request(server, {
      method: 'PATCH',
      path: `/api/admin/applications/${createdAppId}/status`,
      headers: { Authorization: `Bearer ${candidate1Token}` },
      body: { status: 'selected' },
    });
    assert(
      candStatusForbidden.statusCode === 403,
      57,
      'Candidate cannot change application status via admin API (HTTP 403)'
    );

    // ------------------------------------------------------------------
    // SECTION 9: SECURITY, SENSITIVE FIELDS & ATOMICITY (Checks 58 - 60)
    // ------------------------------------------------------------------
    console.log('\n--- SECTION 9: DATA PRIVACY & PRIVILEGE CHECKS ---');

    // Password hashes must never be exposed
    const adminDetailsJson = JSON.stringify(adminViewApp.body);
    assert(
      !adminDetailsJson.includes('password_hash') && !adminDetailsJson.includes('$2a$'),
      58,
      'Security: Application and candidate responses never expose password hashes'
    );

    // Summary download endpoint
    const summaryRes = await request(server, {
      method: 'GET',
      path: `/api/applications/${createdAppId}/download`,
      headers: { Authorization: `Bearer ${candidate1Token}` },
    });
    assert(
      summaryRes.statusCode === 200 && summaryRes.body?.data?.application_id === humanAppId,
      59,
      'Candidate summary download endpoint functions correctly'
    );

    // Admin pagination parameters
    const paginatedRes = await request(server, {
      method: 'GET',
      path: '/api/admin/applications?page=1&limit=1',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      paginatedRes.statusCode === 200 && paginatedRes.body?.pagination?.limit === 1,
      60,
      'Admin application pagination controls work as expected'
    );

  } catch (error) {
    console.error('[CRITICAL TEST ERROR]:', error);
    failedCount++;
  } finally {
    // ------------------------------------------------------------------
    // TEARDOWN: CLEAN UP ONLY PHASE 07 TEST ARTIFACTS
    // ------------------------------------------------------------------
    console.log('\n--- TEARDOWN: CLEANING UP TEST ARTIFACTS ---');

    try {
      for (const appId of createdAppIds) {
        // Query human app ID for folder deletion
        const [rows] = await pool.query('SELECT application_id FROM applications WHERE id = ?', [appId]);
        if (rows.length && rows[0].application_id) {
          const appFolder = path.resolve(process.cwd(), 'uploads', 'applications', rows[0].application_id);
          if (fs.existsSync(appFolder)) {
            fs.rmSync(appFolder, { recursive: true, force: true });
          }
        }
        await pool.query('DELETE FROM applications WHERE id = ?', [appId]);
      }

      for (const jobId of createdTestJobIds) {
        await pool.query('DELETE FROM jobs WHERE id = ?', [jobId]);
      }

      if (candidate1Id) {
        await pool.query('DELETE FROM users WHERE id = ?', [candidate1Id]);
      }
      if (candidate2Id) {
        await pool.query('DELETE FROM users WHERE id = ?', [candidate2Id]);
      }
      console.log('[CLEANUP] Phase 07 temporary test entities safely removed.');
    } catch (cleanupErr) {
      console.error('[CLEANUP ERROR]:', cleanupErr.message);
    }

    if (server) {
      server.close();
    }
  }

  console.log('\n========================================================================');
  console.log(` PHASE 07 VERIFICATION COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('========================================================================\n');

  if (failedCount > 0) {
    process.exitCode = 1;
  }
  return { passedCount, failedCount };
};

// Direct invocation
if (process.argv[1] && process.argv[1].endsWith('testPhase07.js')) {
  runPhase07Verification()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Unhandled verification error:', err);
      process.exit(1);
    });
}
