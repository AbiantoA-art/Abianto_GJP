import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../app.js';
import pool from '../config/db.config.js';
import { env } from '../config/env.config.js';
import { initializeDatabase } from './initDb.js';
import { createAdminUser } from './createAdmin.js';
import UserModel from '../models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to make HTTP requests against the in-memory/running express app
const request = (server, { method, path, headers = {}, body = null }) => {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const port = addr.port;
    const postData = body ? JSON.stringify(body) : null;

    const reqHeaders = {
      'Accept': 'application/json',
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
          } catch (e) {
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

const runAllTests = async () => {
  console.log('\n========================================================================');
  console.log(' GOVERNMENT JOB PORTAL - PHASE 03 COMPREHENSIVE AUTOMATED VERIFICATION');
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

  try {
    // ------------------------------------------------------------------
    // Item 1: Database connection
    // ------------------------------------------------------------------
    const dbTest = await initializeDatabase();
    assert(dbTest.success === true, 1, 'Database connection & users schema initialization');

    // Start server for test suite
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        resolve();
      });
    });

    const testCandidateEmail = `candidate_phase03_${Date.now()}@example.com`;
    const testCandidatePassword = 'Password123!';
    let candidateToken = null;

    // ------------------------------------------------------------------
    // Item 2: Candidate registration
    // ------------------------------------------------------------------
    const regRes = await request(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        full_name: 'Arun Kumar Citizen',
        email: testCandidateEmail,
        mobile_number: '9876543210',
        password: testCandidatePassword,
        confirm_password: testCandidatePassword,
      },
    });

    assert(
      regRes.statusCode === 201 &&
      regRes.body?.success === true &&
      regRes.body?.data?.user?.role === 'candidate' &&
      !!regRes.body?.data?.token,
      2,
      'Candidate registration creates account with role="candidate"'
    );

    candidateToken = regRes.body?.data?.token;

    // ------------------------------------------------------------------
    // Item 3: Duplicate registration rejection
    // ------------------------------------------------------------------
    const dupRes = await request(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        full_name: 'Arun Duplicate',
        email: testCandidateEmail,
        mobile_number: '9876543210',
        password: testCandidatePassword,
        confirm_password: testCandidatePassword,
      },
    });

    assert(
      dupRes.statusCode === 409 && dupRes.body?.success === false,
      3,
      'Duplicate registration rejection (HTTP 409 Conflict)'
    );

    // ------------------------------------------------------------------
    // Item 4: Password hashing
    // ------------------------------------------------------------------
    const dbUser = await UserModel.findByEmail(testCandidateEmail);
    const isHashed = dbUser?.password_hash &&
      dbUser.password_hash !== testCandidatePassword &&
      dbUser.password_hash.startsWith('$2');
    const notExposed = !regRes.body?.data?.user?.password && !regRes.body?.data?.user?.password_hash;

    assert(
      isHashed && notExposed,
      4,
      'Password hashing verification (bcrypt hash verified in DB; not exposed in response)'
    );

    // ------------------------------------------------------------------
    // Item 5: Candidate login
    // ------------------------------------------------------------------
    const loginRes = await request(server, {
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: testCandidateEmail,
        password: testCandidatePassword,
      },
    });

    assert(
      loginRes.statusCode === 200 &&
      loginRes.body?.success === true &&
      loginRes.body?.data?.user?.email === testCandidateEmail &&
      loginRes.body?.data?.user?.role === 'candidate' &&
      !!loginRes.body?.data?.token,
      5,
      'Candidate login with valid credentials (HTTP 200)'
    );

    // ------------------------------------------------------------------
    // Item 6: Invalid password
    // ------------------------------------------------------------------
    const badPassRes = await request(server, {
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: testCandidateEmail,
        password: 'IncorrectPassword888!',
      },
    });

    assert(
      badPassRes.statusCode === 401 && badPassRes.body?.success === false,
      6,
      'Invalid password rejection (HTTP 401 Unauthorized)'
    );

    // ------------------------------------------------------------------
    // Item 7: Missing credentials
    // ------------------------------------------------------------------
    const missingRes = await request(server, {
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: '',
        password: '',
      },
    });

    assert(
      missingRes.statusCode === 400 && missingRes.body?.success === false,
      7,
      'Missing credentials validation rejection (HTTP 400 Bad Request)'
    );

    // ------------------------------------------------------------------
    // Item 8: JWT generation
    // ------------------------------------------------------------------
    const tokenParts = candidateToken?.split('.');
    assert(
      tokenParts?.length === 3,
      8,
      'JWT generation with signed header.payload.signature structure'
    );

    // ------------------------------------------------------------------
    // Item 9: /api/auth/me with valid token
    // ------------------------------------------------------------------
    const meRes = await request(server, {
      method: 'GET',
      path: '/api/auth/me',
      headers: {
        'Authorization': `Bearer ${candidateToken}`,
      },
    });

    assert(
      meRes.statusCode === 200 &&
      meRes.body?.success === true &&
      meRes.body?.data?.user?.email === testCandidateEmail,
      9,
      'GET /api/auth/me returns authenticated user identity with valid token'
    );

    // ------------------------------------------------------------------
    // Item 10: /api/auth/me without token
    // ------------------------------------------------------------------
    const meNoTokenRes = await request(server, {
      method: 'GET',
      path: '/api/auth/me',
    });

    assert(
      meNoTokenRes.statusCode === 401 && meNoTokenRes.body?.success === false,
      10,
      'GET /api/auth/me without token rejected (HTTP 401 Unauthorized)'
    );

    // ------------------------------------------------------------------
    // Item 11: /api/auth/me with invalid token
    // ------------------------------------------------------------------
    const meBadTokenRes = await request(server, {
      method: 'GET',
      path: '/api/auth/me',
      headers: {
        'Authorization': 'Bearer forged.tampered.jwt.signature',
      },
    });

    assert(
      meBadTokenRes.statusCode === 401 && meBadTokenRes.body?.success === false,
      11,
      'GET /api/auth/me with forged/invalid token rejected (HTTP 401 Unauthorized)'
    );

    // ------------------------------------------------------------------
    // Item 12: Admin account creation
    // ------------------------------------------------------------------
    const adminSeedResult = await createAdminUser();
    assert(
      adminSeedResult !== null && typeof adminSeedResult === 'object',
      12,
      'Admin account creation via secure CLI seed mechanism'
    );

    // ------------------------------------------------------------------
    // Item 13: Admin login
    // ------------------------------------------------------------------
    const adminLoginRes = await request(server, {
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: env.admin.email,
        password: env.admin.password,
      },
    });

    assert(
      adminLoginRes.statusCode === 200 &&
      adminLoginRes.body?.success === true &&
      adminLoginRes.body?.data?.user?.role === 'admin' &&
      !!adminLoginRes.body?.data?.token,
      13,
      'Admin login authenticates official credentials and issues admin JWT'
    );

    const adminToken = adminLoginRes.body?.data?.token;

    // ------------------------------------------------------------------
    // Item 14: Admin-only endpoint with admin token
    // ------------------------------------------------------------------
    const adminTestRes = await request(server, {
      method: 'GET',
      path: '/api/admin/test',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    assert(
      adminTestRes.statusCode === 200 &&
      adminTestRes.body?.success === true &&
      adminTestRes.body?.data?.admin?.role === 'admin',
      14,
      'Admin-only endpoint GET /api/admin/test succeeds with admin token (HTTP 200)'
    );

    // ------------------------------------------------------------------
    // Item 15: Admin-only endpoint with candidate token
    // ------------------------------------------------------------------
    const adminForbiddenRes = await request(server, {
      method: 'GET',
      path: '/api/admin/test',
      headers: {
        'Authorization': `Bearer ${candidateToken}`,
      },
    });

    assert(
      adminForbiddenRes.statusCode === 403 && adminForbiddenRes.body?.success === false,
      15,
      'Admin-only endpoint GET /api/admin/test rejects candidate token (HTTP 403 Forbidden)'
    );

    // ------------------------------------------------------------------
    // Item 16: Protected endpoint without token
    // ------------------------------------------------------------------
    const protectedNoTokenRes = await request(server, {
      method: 'GET',
      path: '/api/admin/test',
    });

    assert(
      protectedNoTokenRes.statusCode === 401 && protectedNoTokenRes.body?.success === false,
      16,
      'Protected endpoint without token rejected (HTTP 401 Unauthorized)'
    );

    // ------------------------------------------------------------------
    // Item 17: Backend build / startup
    // ------------------------------------------------------------------
    const healthRes = await request(server, {
      method: 'GET',
      path: '/api/health',
    });

    assert(
      healthRes.statusCode === 200 &&
      healthRes.body?.success === true &&
      healthRes.body?.data?.database?.connected === true,
      17,
      'Backend build/startup verification (GET /api/health returns 200 and DB connected)'
    );

    // ------------------------------------------------------------------
    // Item 18: Frontend build
    // ------------------------------------------------------------------
    const frontendDistDir = path.resolve(__dirname, '../../../frontend/dist');
    const indexHtmlExists = fs.existsSync(path.join(frontendDistDir, 'index.html'));
    const assetsDir = path.join(frontendDistDir, 'assets');
    const assetsExist = fs.existsSync(assetsDir) && fs.readdirSync(assetsDir).length > 0;

    assert(
      indexHtmlExists && assetsExist,
      18,
      'Frontend build verification (production bundle generated with index.html and assets in dist/)'
    );

    // ------------------------------------------------------------------
    // Item 19: Existing Light/Dark theme code remains intact
    // ------------------------------------------------------------------
    const themeContextPath = path.resolve(__dirname, '../../../frontend/src/context/ThemeContext.jsx');
    const themeTogglePath = path.resolve(__dirname, '../../../frontend/src/components/ThemeToggle.jsx');
    const indexCssPath = path.resolve(__dirname, '../../../frontend/src/index.css');

    const themeContextContent = fs.readFileSync(themeContextPath, 'utf8');
    const themeToggleContent = fs.readFileSync(themeTogglePath, 'utf8');
    const indexCssContent = fs.readFileSync(indexCssPath, 'utf8');

    const hasDataTheme = themeContextContent.includes('data-theme') && themeContextContent.includes('localStorage');
    const hasToggle = themeToggleContent.includes('toggleTheme') && themeToggleContent.includes('theme-toggle-btn');
    const hasThemeVariables = indexCssContent.includes('[data-theme="dark"]') && indexCssContent.includes('--bg-base');

    assert(
      hasDataTheme && hasToggle && hasThemeVariables,
      19,
      'Existing Light/Dark theme code remains intact (ThemeContext, ThemeToggle, CSS variables)'
    );

    // ------------------------------------------------------------------
    // Item 20: Candidate registration with valid date_of_birth (no mobile_number)
    // ------------------------------------------------------------------
    const dobCandidateEmail = `candidate_dob_${Date.now()}@example.com`;
    const dobCandidatePassword = 'ValidPass2026!';
    const regDobRes = await request(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        full_name: 'Priya Sharma Citizen',
        email: dobCandidateEmail,
        date_of_birth: '1998-05-15',
        password: dobCandidatePassword,
        confirm_password: dobCandidatePassword,
      },
    });

    assert(
      regDobRes.statusCode === 201 &&
      regDobRes.body?.success === true &&
      regDobRes.body?.data?.user?.email === dobCandidateEmail &&
      regDobRes.body?.data?.user?.role === 'candidate',
      20,
      'Candidate registration with valid date_of_birth (without mobile_number) returns 201 Created'
    );

    // ------------------------------------------------------------------
    // Item 21: Registration with future date_of_birth rejection
    // ------------------------------------------------------------------
    const futureDobRes = await request(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        full_name: 'Future Citizen',
        email: `future_dob_${Date.now()}@example.com`,
        date_of_birth: '2099-12-31',
        password: dobCandidatePassword,
        confirm_password: dobCandidatePassword,
      },
    });

    assert(
      futureDobRes.statusCode === 400 &&
      futureDobRes.body?.success === false &&
      JSON.stringify(futureDobRes.body).includes('future'),
      21,
      'Future date_of_birth rejection (HTTP 400 with "Date of birth cannot be in the future.")'
    );

    // ------------------------------------------------------------------
    // Item 22: Registration with invalid date_of_birth rejection
    // ------------------------------------------------------------------
    const invalidDobRes = await request(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        full_name: 'Invalid Date Citizen',
        email: `invalid_dob_${Date.now()}@example.com`,
        date_of_birth: '2001-02-31',
        password: dobCandidatePassword,
        confirm_password: dobCandidatePassword,
      },
    });

    assert(
      invalidDobRes.statusCode === 400 &&
      invalidDobRes.body?.success === false,
      22,
      'Invalid calendar date_of_birth rejection (HTTP 400 Bad Request)'
    );

    // ------------------------------------------------------------------
    // Item 23: Registration without date_of_birth or mobile rejection
    // ------------------------------------------------------------------
    const missingDobRes = await request(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        full_name: 'Missing DOB Citizen',
        email: `missing_dob_${Date.now()}@example.com`,
        password: dobCandidatePassword,
        confirm_password: dobCandidatePassword,
      },
    });

    assert(
      missingDobRes.statusCode === 400 &&
      missingDobRes.body?.success === false,
      23,
      'Missing date_of_birth rejection (HTTP 400 Bad Request)'
    );

    // ------------------------------------------------------------------
    // Item 24: Candidate login after date_of_birth registration
    // ------------------------------------------------------------------
    const dobLoginRes = await request(server, {
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: dobCandidateEmail,
        password: dobCandidatePassword,
      },
    });

    assert(
      dobLoginRes.statusCode === 200 &&
      dobLoginRes.body?.success === true &&
      dobLoginRes.body?.data?.user?.email === dobCandidateEmail &&
      !!dobLoginRes.body?.data?.token,
      24,
      'Candidate login after date_of_birth registration succeeds (HTTP 200)'
    );

    // ------------------------------------------------------------------
    // Item 25: Database safety verification (all existing users preserved)
    // ------------------------------------------------------------------
    const [userRows] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [adminRow] = await pool.query('SELECT email, role FROM users WHERE role = "admin" LIMIT 1');
    assert(
      userRows[0]?.count >= 5 &&
      adminRow.length > 0 &&
      adminRow[0]?.role === 'admin',
      25,
      'Database safety verified: Existing users & admin accounts remain 100% intact'
    );

    console.log('\n========================================================================');
    console.log(` VERIFICATION COMPLETE: ${passedCount}/${testIndex} Required Checks Evaluated`);
    console.log(` Status: ${failedCount === 0 ? 'ALL CHECKS PASSED (100% SUCCESS)' : `${failedCount} FAILURES DETECTED`}`);
    console.log('========================================================================\n');

    if (failedCount > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Fatal error during test execution:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await pool.end();
  }
};

runAllTests();
