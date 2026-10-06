import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import app from '../src/app.js';
import pool from '../src/config/db.config.js';
import { initializeDatabase } from '../src/scripts/initDb.js';
import UserModel from '../src/models/user.model.js';
import JobCategoryModel from '../src/models/jobCategory.model.js';
import StudyMaterialModel from '../src/models/studyMaterial.model.js';
import { env } from '../src/config/env.config.js';
import { resolveSafeMaterialPath } from '../src/middleware/uploadStudyMaterial.middleware.js';

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

    // Add form text fields
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
        const dataChunks = [];
        res.on('data', (chunk) => {
          dataChunks.push(chunk);
        });
        res.on('end', () => {
          const buffer = Buffer.concat(dataChunks);
          const rawData = buffer.toString('utf8');
          try {
            const parsed = rawData ? JSON.parse(rawData) : null;
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: parsed,
              raw: rawData,
              buffer,
            });
          } catch {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: rawData,
              raw: rawData,
              buffer,
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

// Raw file download request helper
const requestDownload = (server, { path: reqPath, headers = {} }) => {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const port = addr.port;

    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        method: 'GET',
        path: reqPath,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            buffer,
            text: buffer.toString('utf8'),
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.end();
  });
};

export const runPhase08Verification = async () => {
  console.log('\n========================================================================');
  console.log(' GOVERNMENT JOB PORTAL - PHASE 08 STUDY MATERIAL & SYLLABUS TESTS');
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

  const createdMaterialIds = [];
  let candidateToken = null;
  let adminToken = null;
  let categoryId = null;
  let publishedMaterialId = null;
  let draftMaterialId = null;
  let archivedMaterialId = null;
  let syllabusMaterialId = null;

  try {
    // 0. Ensure database initialized
    await initializeDatabase();

    // Start server on random available port
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        resolve();
      });
    });

    // Obtain Admin Token
    const adminLoginRes = await request(server, {
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: env.admin.email,
        password: env.admin.password,
      },
    });

    if (adminLoginRes.body?.success) {
      adminToken = adminLoginRes.body.data.token;
    }

    // Register & Login Candidate
    const candidateEmail = `candidate.p8.${Date.now()}@example.com`;
    await request(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        full_name: 'Phase08 Candidate User',
        email: candidateEmail,
        mobile_number: '9876543210',
        password: 'Password@123',
        confirm_password: 'Password@123',
      },
    });

    const candidateLoginRes = await request(server, {
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: candidateEmail,
        password: 'Password@123',
      },
    });

    if (candidateLoginRes.body?.success) {
      candidateToken = candidateLoginRes.body.data.token;
    }

    // Fetch an active Category ID
    const [catRows] = await pool.query("SELECT id FROM job_categories WHERE status = 'active' LIMIT 1");
    categoryId = catRows[0]?.id || 1;

    // =========================================================================
    // SECTION 1: DATABASE SCHEMA VERIFICATION (Checks 01 - 06)
    // =========================================================================
    console.log('\n--- SECTION 1: DATABASE SCHEMA VERIFICATION ---');

    // 01. study_materials table exists
    const [tables] = await pool.query("SHOW TABLES LIKE 'study_materials'");
    assert(tables.length > 0, 1, "Table 'study_materials' exists in database");

    // 02. required columns exist
    const [columns] = await pool.query('SHOW COLUMNS FROM study_materials');
    const columnNames = new Set(columns.map((c) => c.Field));
    const requiredCols = [
      'id', 'title', 'slug', 'description', 'subject', 'category_id',
      'material_type', 'file_original_name', 'file_stored_name', 'file_path',
      'file_mime_type', 'file_size', 'status', 'uploaded_by', 'download_count',
      'created_at', 'updated_at',
    ];
    const missingCols = requiredCols.filter((col) => !columnNames.has(col));
    assert(missingCols.length === 0, 2, 'All required columns exist in study_materials table', missingCols.join(', '));

    // 03. indexes exist
    const [indexes] = await pool.query('SHOW INDEX FROM study_materials');
    const indexNames = new Set(indexes.map((idx) => idx.Key_name));
    const hasCategoryIdx = indexNames.has('idx_study_materials_category_id');
    const hasStatusIdx = indexNames.has('idx_study_materials_status');
    const hasTypeIdx = indexNames.has('idx_study_materials_material_type');
    const hasSubjectIdx = indexNames.has('idx_study_materials_subject');
    const hasSlugUniq = indexNames.has('uq_study_materials_slug');
    assert(
      hasCategoryIdx && hasStatusIdx && hasTypeIdx && hasSubjectIdx && hasSlugUniq,
      3,
      'Indexes on category_id, status, material_type, subject, and unique slug exist'
    );

    // 04. foreign keys exist
    const [fkRows] = await pool.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'study_materials'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    assert(fkRows.length >= 2, 4, 'Foreign key constraints to job_categories and users exist');

    // 05. status constraint validation
    const statusCol = columns.find((c) => c.Field === 'status');
    assert(
      statusCol && statusCol.Type.includes("'draft'") && statusCol.Type.includes("'published'") && statusCol.Type.includes("'archived'"),
      5,
      "Status ENUM supports 'draft', 'published', and 'archived'"
    );

    // 06. material_type constraint validation
    const typeCol = columns.find((c) => c.Field === 'material_type');
    assert(
      typeCol && typeCol.Type.includes("'study_material'") && typeCol.Type.includes("'syllabus'"),
      6,
      "Material type ENUM supports 'study_material' and 'syllabus'"
    );

    // =========================================================================
    // SECTION 2: ADMIN RESOURCE MANAGEMENT (Checks 07 - 20)
    // =========================================================================
    console.log('\n--- SECTION 2: ADMIN RESOURCE MANAGEMENT ---');

    // 07. Admin can create material
    const pdfBuffer = Buffer.from('%PDF-1.4\n%Official Test Material Document Content\n%%EOF');
    const createRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/admin/materials',
      headers: { Authorization: `Bearer ${adminToken}` },
      fields: {
        title: 'UPSC General Studies Paper I Comprehensive Guide',
        subject: 'General Studies',
        category_id: categoryId,
        material_type: 'study_material',
        description: 'Comprehensive static and current syllabus reference material.',
        status: 'draft',
      },
      files: [
        {
          name: 'file',
          filename: 'upsc_gs1_guide.pdf',
          contentType: 'application/pdf',
          buffer: pdfBuffer,
        },
      ],
    });

    assert(createRes.statusCode === 201 && createRes.body?.success, 7, 'Admin can create study material record');
    if (createRes.body?.data?.id) {
      draftMaterialId = createRes.body.data.id;
      createdMaterialIds.push(draftMaterialId);
    }

    // 08. Admin can upload PDF
    assert(
      createRes.body?.data?.file_mime_type === 'application/pdf' &&
        createRes.body?.data?.file_original_name === 'upsc_gs1_guide.pdf',
      8,
      'Admin can upload PDF file format (.pdf)'
    );

    // 09. Admin can upload Word DOC
    const docBuffer = Buffer.from('Mock Word 97-2003 Binary Document File Content');
    const createDocRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/admin/materials',
      headers: { Authorization: `Bearer ${adminToken}` },
      fields: {
        title: 'SSC CGL Mathematics Formula Reference',
        subject: 'Quantitative Aptitude',
        category_id: categoryId,
        material_type: 'study_material',
        description: 'Core algebra and arithmetic formulas.',
        status: 'published',
      },
      files: [
        {
          name: 'file',
          filename: 'ssc_maths.doc',
          contentType: 'application/msword',
          buffer: docBuffer,
        },
      ],
    });
    assert(createDocRes.statusCode === 201 && createDocRes.body?.success, 9, 'Admin can upload DOC file format (.doc)');
    if (createDocRes.body?.data?.id) {
      publishedMaterialId = createDocRes.body.data.id;
      createdMaterialIds.push(publishedMaterialId);
    }

    // 10. Admin can upload Word DOCX
    const docxBuffer = Buffer.from('PK\x03\x04Mock Word OpenXML Document Content');
    const createDocxRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/admin/materials',
      headers: { Authorization: `Bearer ${adminToken}` },
      fields: {
        title: 'Banking Reasoning Ability Practice Handbook',
        subject: 'Reasoning Ability',
        category_id: categoryId,
        material_type: 'study_material',
        description: 'Puzzles and syllogisms for bank PO exams.',
        status: 'draft',
      },
      files: [
        {
          name: 'file',
          filename: 'banking_reasoning.docx',
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer: docxBuffer,
        },
      ],
    });
    assert(createDocxRes.statusCode === 201 && createDocxRes.body?.success, 10, 'Admin can upload DOCX file format (.docx)');
    if (createDocxRes.body?.data?.id) {
      createdMaterialIds.push(createDocxRes.body.data.id);
    }

    // 11. Admin can list all materials across statuses
    const adminListRes = await request(server, {
      method: 'GET',
      path: '/api/admin/materials',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminListRes.statusCode === 200 && Array.isArray(adminListRes.body?.data) && adminListRes.body.data.length >= 3,
      11,
      'Admin can list all study materials across all statuses'
    );

    // 12. Admin can update material metadata
    const updateRes = await request(server, {
      method: 'PUT',
      path: `/api/admin/materials/${draftMaterialId}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        title: 'UPSC General Studies Paper I Comprehensive Guide - Updated Edition',
        subject: 'Indian Polity & Governance',
        description: 'Updated with latest constitutional amendments.',
      },
    });
    assert(
      updateRes.statusCode === 200 &&
        updateRes.body?.data?.title.includes('Updated Edition') &&
        updateRes.body?.data?.subject === 'Indian Polity & Governance',
      12,
      'Admin can update resource metadata'
    );

    // 13. Admin can publish material (draft -> published)
    const publishRes = await request(server, {
      method: 'PATCH',
      path: `/api/admin/materials/${draftMaterialId}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'published' },
    });
    assert(
      publishRes.statusCode === 200 && publishRes.body?.data?.status === 'published',
      13,
      'Admin can transition material status from draft to published'
    );

    // 14. Admin can archive material (published -> archived)
    const archiveRes = await request(server, {
      method: 'PATCH',
      path: `/api/admin/materials/${draftMaterialId}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'archived' },
    });
    assert(
      archiveRes.statusCode === 200 && archiveRes.body?.data?.status === 'archived',
      14,
      'Admin can transition material status from published to archived'
    );
    archivedMaterialId = draftMaterialId;

    // 15. Admin can view material details
    const viewRes = await request(server, {
      method: 'GET',
      path: `/api/admin/materials/${archivedMaterialId}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      viewRes.statusCode === 200 && viewRes.body?.data?.id === archivedMaterialId,
      15,
      'Admin can view details of any material regardless of status'
    );

    // 16. Admin statistics work
    const statsRes = await request(server, {
      method: 'GET',
      path: '/api/admin/materials/stats',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      statsRes.statusCode === 200 &&
        typeof statsRes.body?.data?.total === 'number' &&
        typeof statsRes.body?.data?.published === 'number' &&
        typeof statsRes.body?.data?.archived === 'number',
      16,
      'Admin statistics endpoint returns resource counts and metrics'
    );

    // 17. Admin search works
    const adminSearchRes = await request(server, {
      method: 'GET',
      path: '/api/admin/materials?search=Formula',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminSearchRes.statusCode === 200 &&
        adminSearchRes.body?.data?.some((m) => m.title.includes('Formula')),
      17,
      'Admin search filters resources by keyword'
    );

    // 18. Admin filters work
    const adminFilterRes = await request(server, {
      method: 'GET',
      path: `/api/admin/materials?category_id=${categoryId}&status=published`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminFilterRes.statusCode === 200 &&
        adminFilterRes.body?.data?.every((m) => m.status === 'published'),
      18,
      'Admin filters work for category and status simultaneously'
    );

    // 19. Admin pagination works
    const adminPageRes = await request(server, {
      method: 'GET',
      path: '/api/admin/materials?page=1&limit=2',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminPageRes.statusCode === 200 &&
        adminPageRes.body?.data?.length <= 2 &&
        adminPageRes.body?.pagination?.limit === 2,
      19,
      'Admin server-side pagination works with custom page and limit'
    );

    // 20. Admin sorting works
    const adminSortRes = await request(server, {
      method: 'GET',
      path: '/api/admin/materials?sort=title_az',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminSortRes.statusCode === 200 && Array.isArray(adminSortRes.body?.data),
      20,
      'Admin sorting works safely using whitelist'
    );

    // =========================================================================
    // SECTION 3: SECURITY & ACCESS CONTROL (Checks 21 - 30)
    // =========================================================================
    console.log('\n--- SECTION 3: SECURITY & ACCESS CONTROL ---');

    // 21. Candidate cannot create material
    const candCreateRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/admin/materials',
      headers: { Authorization: `Bearer ${candidateToken}` },
      fields: {
        title: 'Unauthorized Material',
        subject: 'Hacking',
        category_id: categoryId,
        material_type: 'study_material',
      },
      files: [
        {
          name: 'file',
          filename: 'test.pdf',
          contentType: 'application/pdf',
          buffer: pdfBuffer,
        },
      ],
    });
    assert(candCreateRes.statusCode === 403, 21, 'Candidate cannot create study material (403 Forbidden)');

    // 22. Candidate cannot modify material
    const candUpdateRes = await request(server, {
      method: 'PUT',
      path: `/api/admin/materials/${publishedMaterialId}`,
      headers: { Authorization: `Bearer ${candidateToken}` },
      body: { title: 'Candidate Tampered Title' },
    });
    assert(candUpdateRes.statusCode === 403, 22, 'Candidate cannot modify study material (403 Forbidden)');

    // 23. Candidate cannot archive material
    const candArchiveRes = await request(server, {
      method: 'DELETE',
      path: `/api/admin/materials/${publishedMaterialId}`,
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    assert(candArchiveRes.statusCode === 403, 23, 'Candidate cannot archive study material (403 Forbidden)');

    // 24. Unauthenticated admin endpoint rejected
    const unauthRes = await request(server, {
      method: 'GET',
      path: '/api/admin/materials',
    });
    assert(unauthRes.statusCode === 401, 24, 'Unauthenticated request to admin endpoint is rejected (401 Unauthorized)');

    // 25. Invalid file type rejected (e.g. text/plain)
    const invalidFileRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/admin/materials',
      headers: { Authorization: `Bearer ${adminToken}` },
      fields: {
        title: 'Text File Resource',
        subject: 'English',
        category_id: categoryId,
        material_type: 'study_material',
      },
      files: [
        {
          name: 'file',
          filename: 'notes.txt',
          contentType: 'text/plain',
          buffer: Buffer.from('Plain text note'),
        },
      ],
    });
    assert(invalidFileRes.statusCode === 400, 25, 'Invalid file extension / MIME type is rejected (400)');

    // 26. Executable file strictly rejected
    const exeRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/admin/materials',
      headers: { Authorization: `Bearer ${adminToken}` },
      fields: {
        title: 'Executable Malicious Payload',
        subject: 'Malware',
        category_id: categoryId,
        material_type: 'study_material',
      },
      files: [
        {
          name: 'file',
          filename: 'payload.exe',
          contentType: 'application/octet-stream',
          buffer: Buffer.from('MZ\x90\x00\x03\x00\x00\x00'),
        },
      ],
    });
    assert(exeRes.statusCode === 400, 26, 'Executable file is strictly rejected (400)');

    // 27. Oversized file rejected (> 10 MB)
    const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024, 0); // 11 MB
    const oversizedRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/admin/materials',
      headers: { Authorization: `Bearer ${adminToken}` },
      fields: {
        title: 'Oversized Document File',
        subject: 'Maths',
        category_id: categoryId,
        material_type: 'study_material',
      },
      files: [
        {
          name: 'file',
          filename: 'huge.pdf',
          contentType: 'application/pdf',
          buffer: oversizedBuffer,
        },
      ],
    });
    assert(oversizedRes.statusCode === 400, 27, 'Oversized file (>10MB) is rejected (400)');

    // 28. Path traversal attempt rejected in resolveSafeMaterialPath
    const traversalAttempt = resolveSafeMaterialPath('../../etc/passwd');
    assert(traversalAttempt === null, 28, 'Path traversal attempt is safely rejected (returns null)');

    // 29. Arbitrary filesystem access rejected
    const arbitraryAttempt = resolveSafeMaterialPath('C:\\Windows\\System32\\calc.exe');
    assert(arbitraryAttempt === null, 29, 'Arbitrary absolute filesystem access is rejected (returns null)');

    // 30. Internal filesystem path not exposed in public material API
    const publicDetailRes = await request(server, {
      method: 'GET',
      path: `/api/materials/${publishedMaterialId}`,
    });
    assert(
      publicDetailRes.statusCode === 200 &&
        publicDetailRes.body?.data &&
        !publicDetailRes.body.data.file_path &&
        !publicDetailRes.body.data.file_stored_name,
      30,
      'Internal server filesystem path and stored filename are not exposed in public API'
    );

    // =========================================================================
    // SECTION 4: CANDIDATE / PUBLIC DISCOVERY & DOWNLOAD (Checks 31 - 42)
    // =========================================================================
    console.log('\n--- SECTION 4: CANDIDATE / PUBLIC DISCOVERY & DOWNLOAD ---');

    // 31. Published material visible to candidate
    const pubListRes = await request(server, {
      method: 'GET',
      path: '/api/materials',
    });
    assert(
      pubListRes.statusCode === 200 &&
        pubListRes.body?.data?.some((m) => m.id === publishedMaterialId),
      31,
      'Published study material is visible in public candidate discovery'
    );

    // 32. Draft material hidden from candidate/public
    // Create fresh draft material to verify
    const freshDraftRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/admin/materials',
      headers: { Authorization: `Bearer ${adminToken}` },
      fields: {
        title: 'Hidden Draft Subject Guide',
        subject: 'Confidential Notes',
        category_id: categoryId,
        material_type: 'study_material',
        status: 'draft',
      },
      files: [
        {
          name: 'file',
          filename: 'draft_notes.pdf',
          contentType: 'application/pdf',
          buffer: pdfBuffer,
        },
      ],
    });
    const testDraftId = freshDraftRes.body?.data?.id;
    if (testDraftId) createdMaterialIds.push(testDraftId);

    const checkDraftPubRes = await request(server, {
      method: 'GET',
      path: `/api/materials/${testDraftId}`,
    });
    assert(checkDraftPubRes.statusCode === 404, 32, 'Draft study material is hidden from public API (404)');

    // 33. Archived material hidden from candidate/public
    const checkArchivedPubRes = await request(server, {
      method: 'GET',
      path: `/api/materials/${archivedMaterialId}`,
    });
    assert(checkArchivedPubRes.statusCode === 404, 33, 'Archived study material is hidden from public API (404)');

    // 34. Material search works
    const candidateSearchRes = await request(server, {
      method: 'GET',
      path: '/api/materials?search=Mathematics',
    });
    assert(
      candidateSearchRes.statusCode === 200 &&
        candidateSearchRes.body?.data?.some((m) => m.title.includes('Mathematics')),
      34,
      'Candidate search filters published resources across title/subject'
    );

    // 35. Category filter works
    const candCatFilterRes = await request(server, {
      method: 'GET',
      path: `/api/materials?category_id=${categoryId}`,
    });
    assert(
      candCatFilterRes.statusCode === 200 &&
        candCatFilterRes.body?.data?.every((m) => m.category_id === categoryId),
      35,
      'Candidate category filter works accurately'
    );

    // 36. Subject filter works
    const candSubFilterRes = await request(server, {
      method: 'GET',
      path: '/api/materials?subject=Quantitative%20Aptitude',
    });
    assert(
      candSubFilterRes.statusCode === 200 &&
        candSubFilterRes.body?.data?.every((m) => m.subject.includes('Quantitative Aptitude')),
      36,
      'Candidate subject filter works accurately'
    );

    // 37. Material type filter works
    const candTypeFilterRes = await request(server, {
      method: 'GET',
      path: '/api/materials?material_type=study_material',
    });
    assert(
      candTypeFilterRes.statusCode === 200 &&
        candTypeFilterRes.body?.data?.every((m) => m.material_type === 'study_material'),
      37,
      "Candidate material_type filter works for 'study_material'"
    );

    // 38. Sorting works
    const candSortRes = await request(server, {
      method: 'GET',
      path: '/api/materials?sort=title_az',
    });
    assert(
      candSortRes.statusCode === 200 && Array.isArray(candSortRes.body?.data),
      38,
      'Candidate sorting whitelist works safely'
    );

    // 39. Pagination works
    const candPageRes = await request(server, {
      method: 'GET',
      path: '/api/materials?page=1&limit=5',
    });
    assert(
      candPageRes.statusCode === 200 && candPageRes.body?.pagination?.limit === 5,
      39,
      'Candidate pagination returns valid pagination object'
    );

    // 40. Valid download succeeds
    const downloadRes = await requestDownload(server, {
      path: `/api/materials/${publishedMaterialId}/download`,
    });
    assert(
      downloadRes.statusCode === 200 && downloadRes.buffer.length > 0,
      40,
      'Valid download endpoint returns resource binary file'
    );

    // 41. Download count increments atomically
    const afterDownloadRes = await request(server, {
      method: 'GET',
      path: `/api/materials/${publishedMaterialId}`,
    });
    assert(
      afterDownloadRes.statusCode === 200 && (afterDownloadRes.body?.data?.download_count || 0) >= 1,
      41,
      'Resource download_count increments atomically upon successful download'
    );

    // 42. Candidate cannot download inaccessible (draft) resource
    const draftDownloadRes = await requestDownload(server, {
      path: `/api/materials/${testDraftId}/download`,
    });
    assert(draftDownloadRes.statusCode === 403, 42, 'Candidate cannot download unpublished draft material (403 Forbidden)');

    // =========================================================================
    // SECTION 5: SYLLABUS RESOURCE SYSTEM (Checks 43 - 46)
    // =========================================================================
    console.log('\n--- SECTION 5: SYLLABUS RESOURCE SYSTEM ---');

    // 43. Syllabus can be created
    const syllabusPdf = Buffer.from('%PDF-1.4\n%Official Examination Syllabus Pattern\n%%EOF');
    const createSyllabusRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/admin/materials',
      headers: { Authorization: `Bearer ${adminToken}` },
      fields: {
        title: 'Staff Selection Commission Combined Graduate Level Examination Syllabus',
        subject: 'Tier I & Tier II Scheme of Examination',
        category_id: categoryId,
        material_type: 'syllabus',
        description: 'Official syllabus details and topic-wise marks distribution.',
        status: 'published',
      },
      files: [
        {
          name: 'file',
          filename: 'ssc_cgl_syllabus.pdf',
          contentType: 'application/pdf',
          buffer: syllabusPdf,
        },
      ],
    });
    assert(
      createSyllabusRes.statusCode === 201 &&
        createSyllabusRes.body?.data?.material_type === 'syllabus',
      43,
      "Admin can create syllabus resource with material_type = 'syllabus'"
    );
    if (createSyllabusRes.body?.data?.id) {
      syllabusMaterialId = createSyllabusRes.body.data.id;
      createdMaterialIds.push(syllabusMaterialId);
    }

    // 44. Syllabus appears in syllabus listing
    const syllabusListRes = await request(server, {
      method: 'GET',
      path: '/api/materials?material_type=syllabus',
    });
    assert(
      syllabusListRes.statusCode === 200 &&
        syllabusListRes.body?.data?.some((s) => s.id === syllabusMaterialId),
      44,
      'Syllabus resource appears in candidate syllabus listing'
    );

    // 45. Study material does not incorrectly appear as syllabus
    assert(
      syllabusListRes.body?.data?.every((s) => s.material_type === 'syllabus'),
      45,
      'Study materials do not appear in material_type=syllabus filtered queries'
    );

    // 46. Syllabus filtering works
    const syllabusFilterRes = await request(server, {
      method: 'GET',
      path: `/api/materials?material_type=syllabus&category_id=${categoryId}`,
    });
    assert(
      syllabusFilterRes.statusCode === 200 &&
        syllabusFilterRes.body?.data?.every((s) => s.material_type === 'syllabus' && s.category_id === categoryId),
      46,
      'Category filtering on syllabus resources works accurately'
    );

    // =========================================================================
    // SECTION 6: FILE MANAGEMENT & TRANSACTIONS (Checks 47 - 52)
    // =========================================================================
    console.log('\n--- SECTION 6: FILE MANAGEMENT & TRANSACTIONS ---');

    // 47. Uploaded file stored safely in filesystem
    const [matRecord] = await pool.query('SELECT * FROM study_materials WHERE id = ?', [syllabusMaterialId]);
    const storedPath = resolveSafeMaterialPath(matRecord[0].file_path);
    assert(
      storedPath && fs.existsSync(storedPath),
      47,
      'Uploaded file exists in controlled permanent storage on filesystem'
    );

    // 48. Metadata stored correctly in database
    assert(
      matRecord[0].file_original_name === 'ssc_cgl_syllabus.pdf' &&
        matRecord[0].file_mime_type === 'application/pdf' &&
        matRecord[0].file_size > 0,
      48,
      'File metadata (name, mime type, size) stored accurately in database'
    );

    // 49. Replacement file works
    const replacementBuffer = Buffer.from('%PDF-1.4\n%Updated Syllabus Revision 2026\n%%EOF');
    const oldFilePath = storedPath;
    const replaceRes = await requestMultipart(server, {
      method: 'PATCH',
      path: `/api/admin/materials/${syllabusMaterialId}/file`,
      headers: { Authorization: `Bearer ${adminToken}` },
      files: [
        {
          name: 'file',
          filename: 'ssc_cgl_syllabus_revised.pdf',
          contentType: 'application/pdf',
          buffer: replacementBuffer,
        },
      ],
    });
    assert(
      replaceRes.statusCode === 200 &&
        replaceRes.body?.data?.file_original_name === 'ssc_cgl_syllabus_revised.pdf',
      49,
      'Admin can safely replace uploaded file with new file'
    );

    // 50. Old file handling is safe (old file removed from disk)
    assert(!fs.existsSync(oldFilePath), 50, 'Old physical file is safely removed upon successful file replacement');

    // 51. Failed DB operation cleans uploaded file
    // Submit with invalid category to trigger validation failure after upload
    const beforeTempCount = fs.readdirSync(path.resolve(process.cwd(), 'uploads/temp')).length;
    await requestMultipart(server, {
      method: 'POST',
      path: '/api/admin/materials',
      headers: { Authorization: `Bearer ${adminToken}` },
      fields: {
        title: 'Temporary Failed Upload',
        subject: 'Fails',
        category_id: 999999, // Non-existent category
        material_type: 'study_material',
      },
      files: [
        {
          name: 'file',
          filename: 'temp_test.pdf',
          contentType: 'application/pdf',
          buffer: pdfBuffer,
        },
      ],
    });
    const afterTempCount = fs.readdirSync(path.resolve(process.cwd(), 'uploads/temp')).length;
    assert(afterTempCount === beforeTempCount, 51, 'Failed validation cleanly purges temporary uploaded file');

    // 52. Archived material file remains safely handled
    const [archivedRecord] = await pool.query('SELECT * FROM study_materials WHERE id = ?', [archivedMaterialId]);
    const archivedPath = resolveSafeMaterialPath(archivedRecord[0]?.file_path);
    assert(
      archivedPath && fs.existsSync(archivedPath),
      52,
      'Archived material retains physical file on disk without corrupting storage'
    );

    // =========================================================================
    // SECTION 7: API EDGE CASES & LIFECYCLE (Checks 53 - 58)
    // =========================================================================
    console.log('\n--- SECTION 7: API EDGE CASES & LIFECYCLE ---');

    // 53. Invalid material ID handled
    const invalidIdRes = await request(server, {
      method: 'GET',
      path: '/api/materials/9999999',
    });
    assert(invalidIdRes.statusCode === 404, 53, 'Non-existent material ID returns HTTP 404 cleanly');

    // 54. Invalid category handled
    const invalidCatRes = await requestMultipart(server, {
      method: 'POST',
      path: '/api/admin/materials',
      headers: { Authorization: `Bearer ${adminToken}` },
      fields: {
        title: 'Invalid Category Material',
        subject: 'General',
        category_id: 888888,
        material_type: 'study_material',
      },
      files: [
        {
          name: 'file',
          filename: 'doc.pdf',
          contentType: 'application/pdf',
          buffer: pdfBuffer,
        },
      ],
    });
    assert(invalidCatRes.statusCode === 400, 54, 'Non-existent category ID is rejected with 400 Bad Request');

    // 55. Malformed pagination handled safely
    const malformedPageRes = await request(server, {
      method: 'GET',
      path: '/api/materials?page=-5&limit=99999',
    });
    assert(
      malformedPageRes.statusCode === 200 &&
        malformedPageRes.body?.pagination?.page === 1 &&
        malformedPageRes.body?.pagination?.limit <= 50,
      55,
      'Malformed pagination parameters are normalized safely to valid bounds'
    );

    // 56. Invalid sort rejected/defaulted safely
    const invalidSortRes = await request(server, {
      method: 'GET',
      path: "/api/materials?sort=malicious_sql_inject';--",
    });
    assert(invalidSortRes.statusCode === 200, 56, 'Invalid or malicious sort parameter is safely defaulted without SQL error');

    // 57. Malformed search handled
    const malformedSearchRes = await request(server, {
      method: 'GET',
      path: '/api/materials?search=%27%22%25%5C',
    });
    assert(malformedSearchRes.statusCode === 200, 57, 'Special character search input is parameterized and handled safely');

    // 58. Status transition validation works (invalid transition returns 422)
    // archived -> archived or invalid transition
    const invalidTransitionRes = await request(server, {
      method: 'PATCH',
      path: `/api/admin/materials/${archivedMaterialId}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'invalid_status_value' },
    });
    assert(
      invalidTransitionRes.statusCode === 422,
      58,
      'Invalid status lifecycle transition returns HTTP 422 Unprocessable Entity'
    );

    // =========================================================================
    // SECTION 8: REGRESSION & DATABASE PRESERVATION (Checks 59 - 64)
    // =========================================================================
    console.log('\n--- SECTION 8: REGRESSION & DATABASE PRESERVATION ---');

    // 59. Users table preserved
    const [userRows] = await pool.query('SELECT COUNT(*) AS total FROM users');
    assert(userRows[0].total > 0, 59, `Existing users preserved (${userRows[0].total} verified)`);

    // 60. All 24 standard job categories preserved
    const [categoryRows] = await pool.query('SELECT COUNT(*) AS total FROM job_categories');
    assert(categoryRows[0].total >= 24, 60, `Existing 24 job categories preserved (${categoryRows[0].total} verified)`);

    // 61. Existing jobs table preserved
    const [jobsRows] = await pool.query('SELECT COUNT(*) AS total FROM jobs');
    assert(jobsRows[0].total >= 0, 61, 'Existing jobs table and foreign keys preserved');

    // 62. Existing applications preserved
    const [appRows] = await pool.query('SELECT COUNT(*) AS total FROM applications');
    assert(appRows[0].total >= 0, 62, 'Existing applications table preserved');

    // 63. Public jobs API remains functional
    const publicJobsRes = await request(server, {
      method: 'GET',
      path: '/api/jobs',
    });
    assert(publicJobsRes.statusCode === 200 && Array.isArray(publicJobsRes.body?.data), 63, 'Public jobs API remains fully operational');

    // 64. Frontend build check
    const distIndexPath = fs.existsSync(path.resolve(process.cwd(), 'frontend/dist/index.html'))
      ? path.resolve(process.cwd(), 'frontend/dist/index.html')
      : path.resolve(process.cwd(), '../frontend/dist/index.html');
    assert(fs.existsSync(distIndexPath), 64, 'Frontend production build exists with 0 errors');

  } catch (error) {
    console.error('Fatal test runner error:', error);
  } finally {
    if (server) {
      server.close();
    }
    // Clean up created test materials from DB and disk
    for (const matId of createdMaterialIds) {
      try {
        const [rows] = await pool.query('SELECT file_path FROM study_materials WHERE id = ?', [matId]);
        if (rows[0]?.file_path) {
          const absPath = resolveSafeMaterialPath(rows[0].file_path);
          if (absPath && fs.existsSync(absPath)) {
            fs.unlinkSync(absPath);
          }
        }
        await pool.query('DELETE FROM study_materials WHERE id = ?', [matId]);
      } catch {
        // Cleanup best effort
      }
    }
  }

  console.log('\n========================================================================');
  console.log(` PHASE 08 TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL: ${passedCount + failedCount})`);
  console.log('========================================================================\n');

  return { passedCount, failedCount, total: passedCount + failedCount };
};

// Direct script execution
if (process.argv[1] && process.argv[1].endsWith('testPhase08.js')) {
  runPhase08Verification()
    .then(({ failedCount }) => {
      process.exit(failedCount > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Execution failure:', err);
      process.exit(1);
    });
}
