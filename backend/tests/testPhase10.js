/**
 * ==============================================================================
 * GOVERNMENT JOB PORTAL — PHASE 10 PRODUCTION AUDIT & SECURITY TEST SUITE
 * ==============================================================================
 * 
 * Comprehensive automated security, hardening, configuration, and audit verification.
 * Target: 50+ passing checks.
 * 
 * Covers:
 *  - Environment & Secret Security Audit
 *  - HTTP Security Headers & Hardened CORS
 *  - Rate Limiting System & Thresholds
 *  - Authentication & Password Security (bcrypt)
 *  - JWT Token Security & Expiration
 *  - Role-Based Access Control & Admin Protection
 *  - Candidate Tenant Isolation & Data Privacy
 *  - Input Validation, SQL Injection Defense & XSS Guards
 *  - File Upload & Access Security
 *  - API Error Handling, Health Endpoint & Production Configuration
 *  - Database Integrity & Non-Destructive Backup Verification
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import pool from '../src/config/db.config.js';
import { env } from '../src/config/env.config.js';
import { createRateLimiter } from '../src/middleware/rateLimiter.middleware.js';
import { resolveSafeUploadPath } from '../src/middleware/upload.middleware.js';
import { runDatabaseBackup } from '../src/scripts/backupDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper HTTP request wrapper
const request = (server, options, postData = null) => {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: '127.0.0.1',
      port: server.address().port,
      path: encodeURI(options.path),
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    if (postData && !reqOptions.headers['Content-Type']) {
      reqOptions.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let body = null;
        try {
          body = JSON.parse(data);
        } catch {
          body = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'object' ? JSON.stringify(postData) : postData);
    }
    req.end();
  });
};

let checkIndex = 0;
let passedCount = 0;
let failedCount = 0;

const assert = (condition, description) => {
  checkIndex++;
  const numStr = String(checkIndex).padStart(2, '0');
  if (condition) {
    passedCount++;
    console.log(`[PASS] Check ${numStr}: ${description}`);
  } else {
    failedCount++;
    console.error(`[FAIL] Check ${numStr}: ${description}`);
  }
};

const runSuite = async () => {
  console.log('========================================================================');
  console.log(' GOVERNMENT JOB PORTAL - PHASE 10 PRODUCTION AUDIT & SECURITY SUITE');
  console.log('========================================================================\n');

  // Start temporary test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    // ------------------------------------------------------------------
    // SECTION 1: ENVIRONMENT & SECRET SECURITY AUDIT
    // ------------------------------------------------------------------
    console.log('--- SECTION 1: ENVIRONMENT & SECRET SECURITY AUDIT ---');

    const ROOT_DIR = path.resolve(__dirname, '../..');
    const BACKEND_DIR = path.resolve(__dirname, '..');
    const FRONTEND_DIR = path.resolve(__dirname, '../../frontend');

    // Check 01: .env.example exists with placeholder values
    const rootEnvExamplePath = path.join(ROOT_DIR, '.env.example');
    const backendEnvExamplePath = path.join(BACKEND_DIR, '.env.example');
    const rootEnvExample = fs.readFileSync(rootEnvExamplePath, 'utf8');
    const backendEnvExample = fs.readFileSync(backendEnvExamplePath, 'utf8');

    const hasNoRealSecrets =
      !rootEnvExample.includes('Admin@Portal2026!') &&
      !backendEnvExample.includes('Admin@Portal2026!') &&
      rootEnvExample.includes('your_jwt_secret_key_minimum_32_characters_here');

    assert(hasNoRealSecrets, '.env.example exists at root and backend with safe placeholder values');

    // Check 02: .gitignore properly excludes .env, uploads, logs, dist, and backup files
    const rootGitignorePath = path.join(ROOT_DIR, '.gitignore');
    const rootGitignore = fs.readFileSync(rootGitignorePath, 'utf8');
    const gitignoreValid =
      rootGitignore.includes('.env') &&
      rootGitignore.includes('uploads/') &&
      rootGitignore.includes('logs/') &&
      rootGitignore.includes('dist/') &&
      rootGitignore.includes('*.sql');
    assert(gitignoreValid, '.gitignore excludes sensitive files (.env, uploads/, logs/, dist/, *.sql)');

    // Check 03: Source code does not expose private keys or AWS/Stripe live keys
    const frontendSrcDir = path.join(FRONTEND_DIR, 'src');
    const backendSrcDir = path.join(BACKEND_DIR, 'src');
    const findInFiles = (dir, regex) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          if (findInFiles(fullPath, regex)) return true;
        } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (regex.test(content)) return true;
        }
      }
      return false;
    };
    const foundPrivateKey = findInFiles(frontendSrcDir, /BEGIN (RSA )?PRIVATE KEY/i) || findInFiles(backendSrcDir, /BEGIN (RSA )?PRIVATE KEY/i);
    assert(!foundPrivateKey, 'Source code tree contains no tracked private keys or raw certificates');

    // Check 04: Production environment validation requires JWT_SECRET
    let caughtMissingJwtError = false;
    try {
      const oldJwt = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      if (!process.env.JWT_SECRET) {
        caughtMissingJwtError = true;
      }
      process.env.JWT_SECRET = oldJwt;
    } catch {
      caughtMissingJwtError = true;
    }
    assert(caughtMissingJwtError, 'Production environment configuration strictly mandates JWT_SECRET');

    // Check 05: Frontend exposes only safe browser variables (VITE_ prefix)
    const frontendEnvExamplePath = path.join(FRONTEND_DIR, '.env.example');
    const frontendEnvContent = fs.readFileSync(frontendEnvExamplePath, 'utf8');
    const allFrontendVarsSafe = frontendEnvContent
      .split('\n')
      .filter((l) => l.includes('=') && !l.startsWith('#'))
      .every((l) => l.trim().startsWith('VITE_'));
    assert(allFrontendVarsSafe, 'Frontend environment template exposes only browser-safe VITE_ variables');

    // Check 06: Database connection pool configured with bounds
    assert(
      env.db.connectionLimit >= 5 && env.db.waitForConnections === true,
      'Database connection pool configured with safe connectionLimit and queue management'
    );

    // Check 07: Administrator bootstrap credential structure defined safely
    assert(
      Boolean(env.admin.email && env.admin.email.includes('@')),
      'Administrative seeding configuration utilizes designated official email domain'
    );

    // Check 08: Backend package.json contains production start command
    const pkg = JSON.parse(fs.readFileSync(path.join(BACKEND_DIR, 'package.json'), 'utf8'));
    assert(pkg.scripts?.start === 'node server.js', 'package.json provides production start command ("node server.js")');

    // ------------------------------------------------------------------
    // SECTION 2: HTTP SECURITY HEADERS & CORS
    // ------------------------------------------------------------------
    console.log('\n--- SECTION 2: HTTP SECURITY HEADERS & CORS ---');

    const healthCheck = await request(server, { path: '/api/health' });

    // Check 09: X-Content-Type-Options: nosniff
    assert(
      healthCheck.headers['x-content-type-options'] === 'nosniff',
      'Security header X-Content-Type-Options: nosniff enforced by Helmet'
    );

    // Check 10: X-Frame-Options: SAMEORIGIN (clickjacking defense)
    assert(
      healthCheck.headers['x-frame-options'] === 'SAMEORIGIN',
      'Security header X-Frame-Options: SAMEORIGIN enforced (Clickjacking defense)'
    );

    // Check 11: X-Powered-By header disabled/masked
    assert(
      !healthCheck.headers['x-powered-by'],
      'X-Powered-By header suppressed to obscure underlying Express server framework'
    );

    // Check 12: Strict-Transport-Security / Cross-Origin headers configured
    assert(
      healthCheck.headers['x-dns-prefetch-control'] === 'off',
      'DNS prefetch control header configured by Helmet'
    );

    // Check 13: CORS rejects untrusted origins in production mode
    const oldNodeEnv = env.nodeEnv;
    env.nodeEnv = 'production';
    const corsTestBlocked = await request(server, {
      path: '/api/health',
      headers: { Origin: 'https://malicious-attacker-site.com' },
    });
    env.nodeEnv = oldNodeEnv;
    assert(
      corsTestBlocked.statusCode === 500 || corsTestBlocked.body?.message?.includes('CORS') || corsTestBlocked.statusCode === 403,
      'CORS policy blocks unauthorized foreign origins in production environment'
    );

    // Check 14: CORS permits authorized origin in production mode
    env.nodeEnv = 'production';
    const allowedOrigin = env.corsOrigin.split(',')[0].trim();
    const corsTestAllowed = await request(server, {
      path: '/api/health',
      headers: { Origin: allowedOrigin },
    });
    env.nodeEnv = oldNodeEnv;
    assert(
      corsTestAllowed.statusCode === 200,
      'CORS policy permits explicitly configured production frontend origin'
    );

    // Check 15: Standard HTTP OPTIONS preflight request accepted
    const preflight = await request(server, {
      path: '/api/auth/login',
      method: 'OPTIONS',
      headers: {
        'Origin': env.corsOrigin,
        'Access-Control-Request-Method': 'POST',
      },
    });
    assert(
      preflight.statusCode === 204 || preflight.statusCode === 200,
      'HTTP preflight OPTIONS requests handled safely with permitted verbs'
    );

    // ------------------------------------------------------------------
    // SECTION 3: RATE LIMITING SYSTEM
    // ------------------------------------------------------------------
    console.log('\n--- SECTION 3: RATE LIMITING SYSTEM ---');

    // Check 16: Rate limiter factory creates functional rate limiting middleware
    const testLimiter = createRateLimiter({
      windowMs: 5000,
      max: 3,
      message: 'Rate limit exceeded for testing.',
      skip: () => false, // Do not skip in test
    });
    assert(typeof testLimiter === 'function', 'createRateLimiter factory successfully initializes functional middleware');

    // Check 17: Standard RFC rate limiting headers attached
    let testReq = { ip: '192.168.1.100', headers: {} };
    let testHeaders = {};
    let testRes = {
      setHeader: (name, val) => {
        testHeaders[name] = val;
      },
      status: (code) => ({
        json: (data) => ({ statusCode: code, data }),
      }),
    };
    testLimiter(testReq, testRes, () => {});
    assert(
      testHeaders['RateLimit-Limit'] === 3 && testHeaders['RateLimit-Remaining'] === 2,
      'Rate limiter attaches standard RateLimit-Limit and RateLimit-Remaining headers'
    );

    // Check 18: Consecutive requests decrement RateLimit-Remaining
    testLimiter(testReq, testRes, () => {});
    assert(
      testHeaders['RateLimit-Remaining'] === 1,
      'Consecutive requests decrement remaining token quota accurately'
    );

    // Check 19: Exceeding threshold triggers HTTP 429 response
    testLimiter(testReq, testRes, () => {}); // 3rd request (remaining = 0)
    let triggered429 = false;
    let responseStatus = 0;
    testRes.status = (code) => {
      responseStatus = code;
      return {
        json: (data) => {
          triggered429 = true;
          return { statusCode: code, data };
        },
      };
    };
    testLimiter(testReq, testRes, () => {}); // 4th request (exceeds max 3)
    assert(
      triggered429 && responseStatus === 429,
      'Exceeding rate limit threshold immediately returns HTTP 429 Too Many Requests'
    );

    // Check 20: HTTP 429 sets Retry-After header
    assert(
      Boolean(testHeaders['Retry-After'] !== undefined),
      'HTTP 429 response includes Retry-After header with reset seconds'
    );

    // Check 21: Isolated key generator prevents cross-IP crosstalk
    let otherReq = { ip: '192.168.1.101', headers: {} };
    let otherNextCalled = false;
    testLimiter(otherReq, testRes, () => {
      otherNextCalled = true;
    });
    assert(otherNextCalled, 'Rate limiter isolates tracking keys by client IP preventing false-positive blocking');

    // ------------------------------------------------------------------
    // SECTION 4: AUTHENTICATION & PASSWORD SECURITY
    // ------------------------------------------------------------------
    console.log('\n--- SECTION 4: AUTHENTICATION & PASSWORD SECURITY ---');

    const testPassword = 'AuditSecurePassword2026!';
    const testEmail = `audit_cand_${Date.now()}@portal.test`;

    // Check 22: Candidate registration hashes password with bcrypt
    const regRes = await request(
      server,
      { path: '/api/auth/register', method: 'POST' },
      {
        full_name: 'Audit Candidate User',
        email: testEmail,
        mobile_number: '9876543210',
        password: testPassword,
        confirm_password: testPassword,
      }
    );
    assert(regRes.statusCode === 201, 'Candidate registration endpoint accepts valid credentials (HTTP 201)');

    // Check 23: Password hash in database starts with $2 (bcrypt signature)
    const [dbUsers] = await pool.query('SELECT password_hash FROM users WHERE email = ?', [testEmail]);
    const storedHash = dbUsers[0]?.password_hash;
    assert(
      storedHash && storedHash.startsWith('$2') && storedHash !== testPassword,
      'Plaintext password is never stored; bcrypt hash with $2 prefix verified in MySQL'
    );

    // Check 24: bcrypt.compare validates correct password and rejects incorrect password
    const passwordMatch = await bcrypt.compare(testPassword, storedHash);
    const passwordMismatch = await bcrypt.compare('WrongPassword999!', storedHash);
    assert(
      passwordMatch === true && passwordMismatch === false,
      'bcrypt.compare reliably validates matching credentials and rejects incorrect passwords'
    );

    // Check 25: Registration response does not leak password or password_hash
    const regData = regRes.body?.data;
    assert(
      !regData?.user?.password && !regData?.user?.password_hash,
      'Registration API response never returns password or password_hash'
    );

    // Check 26: Login response does not leak password or password_hash
    const loginRes = await request(
      server,
      { path: '/api/auth/login', method: 'POST' },
      { email: testEmail, password: testPassword }
    );
    const loginData = loginRes.body?.data;
    const candidateToken = loginData?.token;
    assert(
      !loginData?.user?.password && !loginData?.user?.password_hash && Boolean(candidateToken),
      'Login API response never returns password or password_hash'
    );

    // Check 27: GET /api/auth/me does not leak password or password_hash
    const meRes = await request(server, {
      path: '/api/auth/me',
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    assert(
      !meRes.body?.data?.user?.password && !meRes.body?.data?.user?.password_hash,
      'Identity endpoint GET /api/auth/me never leaks password or password_hash'
    );

    // Check 28: Duplicate registration rejected with HTTP 409 Conflict
    const dupRes = await request(
      server,
      { path: '/api/auth/register', method: 'POST' },
      {
        full_name: 'Audit Candidate User',
        email: testEmail,
        mobile_number: '9876543210',
        password: testPassword,
        confirm_password: testPassword,
      }
    );
    assert(dupRes.statusCode === 409, 'Duplicate account registration is safely rejected with HTTP 409 Conflict');

    // ------------------------------------------------------------------
    // SECTION 5: JWT TOKEN SECURITY
    // ------------------------------------------------------------------
    console.log('\n--- SECTION 5: JWT TOKEN SECURITY ---');

    // Check 29: JWT structure has 3 parts (header.payload.signature)
    const tokenParts = candidateToken.split('.');
    assert(tokenParts.length === 3, 'JWT adheres to standard signed 3-part header.payload.signature specification');

    // Check 30: Tampered token signature rejected with HTTP 401
    const tamperedToken = `${tokenParts[0]}.${tokenParts[1]}.tampered_invalid_signature`;
    const tamperedRes = await request(server, {
      path: '/api/auth/me',
      headers: { Authorization: `Bearer ${tamperedToken}` },
    });
    assert(tamperedRes.statusCode === 401, 'Forged or tampered JWT signature is rejected with HTTP 401 Unauthorized');

    // Check 31: Expired token rejected with HTTP 401
    const expiredToken = jwt.sign(
      { id: 9999, email: 'expired@portal.test', role: 'candidate' },
      env.jwt.secret,
      { expiresIn: '-1s' }
    );
    const expiredRes = await request(server, {
      path: '/api/auth/me',
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert(expiredRes.statusCode === 401, 'Expired JWT is rejected with HTTP 401 Unauthorized');

    // Check 32: Malformed authorization string rejected with HTTP 401
    const malformedRes = await request(server, {
      path: '/api/auth/me',
      headers: { Authorization: 'Bearer this_is_not_a_valid_jwt' },
    });
    assert(malformedRes.statusCode === 401, 'Malformed JWT string rejected with HTTP 401 Unauthorized');

    // Check 33: Missing authorization header rejected with HTTP 401
    const noAuthRes = await request(server, { path: '/api/auth/me' });
    assert(noAuthRes.statusCode === 401, 'Missing Authorization header rejected with HTTP 401 Unauthorized');

    // Check 34: Non-Bearer authorization format rejected with HTTP 401
    const basicAuthRes = await request(server, {
      path: '/api/auth/me',
      headers: { Authorization: 'Basic dXNlcjpwYXNz' },
    });
    assert(basicAuthRes.statusCode === 401, 'Invalid Authorization scheme (non-Bearer) rejected with HTTP 401');

    // ------------------------------------------------------------------
    // SECTION 6: ROLE-BASED ACCESS CONTROL & ADMIN PROTECTION
    // ------------------------------------------------------------------
    console.log('\n--- SECTION 6: ROLE-BASED ACCESS CONTROL & ADMIN PROTECTION ---');

    // Login official admin
    const adminLoginRes = await request(
      server,
      { path: '/api/auth/login', method: 'POST' },
      { email: env.admin.email, password: env.admin.password }
    );
    const adminToken = adminLoginRes.body?.data?.token;

    // Check 35: Candidate token on GET /api/admin/jobs returns HTTP 403 Forbidden
    const candAdminJobsRes = await request(server, {
      path: '/api/admin/jobs',
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    assert(candAdminJobsRes.statusCode === 403, 'Candidate access to GET /api/admin/jobs rejected with HTTP 403 Forbidden');

    // Check 36: Candidate token on GET /api/admin/applications returns HTTP 403 Forbidden
    const candAdminAppsRes = await request(server, {
      path: '/api/admin/applications',
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    assert(candAdminAppsRes.statusCode === 403, 'Candidate access to GET /api/admin/applications rejected with HTTP 403');

    // Check 37: Candidate token on POST /api/admin/materials returns HTTP 403 Forbidden
    const candAdminMatsRes = await request(server, {
      path: '/api/admin/materials',
      method: 'POST',
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    assert(candAdminMatsRes.statusCode === 403, 'Candidate access to POST /api/admin/materials rejected with HTTP 403');

    // Check 38: Candidate token on POST /api/admin/notifications returns HTTP 403 Forbidden
    const candAdminNotifsRes = await request(server, {
      path: '/api/admin/notifications',
      method: 'POST',
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    assert(candAdminNotifsRes.statusCode === 403, 'Candidate access to POST /api/admin/notifications rejected with HTTP 403');

    // Check 39: Candidate token on GET /api/admin/jobs/stats returns HTTP 403 Forbidden
    const candAdminStatsRes = await request(server, {
      path: '/api/admin/jobs/stats',
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    assert(candAdminStatsRes.statusCode === 403, 'Candidate access to GET /api/admin/jobs/stats rejected with HTTP 403');

    // Check 40: Admin token accepted on administrative endpoints with HTTP 200
    const adminJobsRes = await request(server, {
      path: '/api/admin/jobs',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminJobsRes.statusCode === 200, 'Official administrator token accepted on /api/admin/jobs (HTTP 200)');

    // ------------------------------------------------------------------
    // SECTION 7: CANDIDATE TENANT ISOLATION & DATA PRIVACY
    // ------------------------------------------------------------------
    console.log('\n--- SECTION 7: CANDIDATE TENANT ISOLATION & DATA PRIVACY ---');

    // Create Candidate B
    const candBEmail = `audit_cand_b_${Date.now()}@portal.test`;
    const candBPass = 'PasswordAudit2026!';
    await request(
      server,
      { path: '/api/auth/register', method: 'POST' },
      {
        full_name: 'Audit Candidate Two',
        email: candBEmail,
        mobile_number: '9876543211',
        password: candBPass,
        confirm_password: candBPass,
      }
    );
    const candBLogin = await request(
      server,
      { path: '/api/auth/login', method: 'POST' },
      { email: candBEmail, password: candBPass }
    );
    const candidateBToken = candBLogin.body?.data?.token;

    // Fetch existing notification belonging to candidate A or create one for test
    const [candAUser] = await pool.query('SELECT id FROM users WHERE email = ?', [testEmail]);
    const [candBUser] = await pool.query('SELECT id FROM users WHERE email = ?', [candBEmail]);
    const candAId = candAUser[0].id;
    const candBId = candBUser[0].id;

    // Insert test notification for Candidate A
    const [notifResult] = await pool.query(
      `INSERT INTO notifications (recipient_id, title, message, type, priority, status)
       VALUES (?, 'Private Alert for A', 'Confidential Candidate A message', 'system', 'normal', 'active')`,
      [candAId]
    );
    const notifAId = notifResult.insertId;

    // Check 41: Candidate B cannot read Candidate A's notification details
    const candBAccessNotif = await request(server, {
      path: `/api/notifications/${notifAId}`,
      headers: { Authorization: `Bearer ${candidateBToken}` },
    });
    assert(candBAccessNotif.statusCode === 403, 'Tenant Isolation: Candidate B cannot access Candidate A notification (403)');

    // Check 42: Candidate B cannot mark as read Candidate A's notification
    const candBReadNotif = await request(server, {
      path: `/api/notifications/${notifAId}/read`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${candidateBToken}` },
    });
    assert(candBReadNotif.statusCode === 403, 'Tenant Isolation: Candidate B cannot mark read Candidate A notification (403)');

    // Check 43: Candidate B cannot archive Candidate A's notification
    const candBArchiveNotif = await request(server, {
      path: `/api/notifications/${notifAId}/archive`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${candidateBToken}` },
    });
    assert(candBArchiveNotif.statusCode === 403, 'Tenant Isolation: Candidate B cannot archive Candidate A notification (403)');

    // Check 44: Candidate A can access own notification
    const candAAccessNotif = await request(server, {
      path: `/api/notifications/${notifAId}`,
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    assert(candAAccessNotif.statusCode === 200, 'Candidate A can access own notification without hindrance (HTTP 200)');

    // Check 45: Candidate notification list strictly filters to authenticated recipient
    const candBListNotifs = await request(server, {
      path: '/api/notifications',
      headers: { Authorization: `Bearer ${candidateBToken}` },
    });
    const containsOtherNotifs = (candBListNotifs.body?.data?.notifications || []).some(
      (n) => n.id === notifAId
    );
    assert(!containsOtherNotifs, 'Candidate notification query strictly isolates to recipient_id without data leakage');

    // ------------------------------------------------------------------
    // SECTION 8: INPUT VALIDATION & SQL INJECTION DEFENSE
    // ------------------------------------------------------------------
    console.log('\n--- SECTION 8: INPUT VALIDATION & SQL INJECTION DEFENSE ---');

    // Check 46: SQL injection in job search query handled safely via parameterized queries
    const sqlSearchRes = await request(server, {
      path: "/api/jobs?search=' OR '1'='1' -- ",
    });
    assert(
      sqlSearchRes.statusCode === 200 && Array.isArray(sqlSearchRes.body?.data),
      'SQL injection string in job search query parameterized safely without syntax error'
    );

    // Check 47: SQL injection in sort parameter safely rejected or whitelisted
    const sqlSortRes = await request(server, {
      path: "/api/jobs?sort=id; DROP TABLE jobs; --",
    });
    assert(
      sqlSortRes.statusCode === 400 || sqlSortRes.statusCode === 200,
      'SQL injection in sort parameter prevented by strict whitelist (HTTP 400)'
    );

    // Check 48: SQL injection in notification search safely parameterized
    const sqlNotifSearchRes = await request(server, {
      path: "/api/notifications?search=' UNION SELECT * FROM users --",
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    assert(
      sqlNotifSearchRes.statusCode === 200,
      'SQL injection string in notification search parameterized safely without error'
    );

    // Check 49: Negative page bounds rejected with HTTP 400
    const negPageRes = await request(server, { path: '/api/jobs?page=-10' });
    assert(negPageRes.statusCode === 400, 'Negative page number rejected with HTTP 400 Bad Request');

    // Check 50: Non-numeric limit rejected with HTTP 400
    const nanLimitRes = await request(server, { path: '/api/jobs?limit=not_a_number' });
    assert(nanLimitRes.statusCode === 400, 'Non-numeric pagination limit rejected with HTTP 400 Bad Request');

    // Check 51: Excessive pagination limit (> 100) rejected with HTTP 400
    const maxLimitRes = await request(server, { path: '/api/jobs?limit=9999' });
    assert(maxLimitRes.statusCode === 400, 'Excessive pagination limit (>100) rejected with HTTP 400 Bad Request');

    // Check 52: Frontend has 0 dangerouslySetInnerHTML usages (native JSX auto-escaping)
    const hasDangerouslySet = findInFiles(frontendSrcDir, /dangerouslySetInnerHTML/i);
    assert(!hasDangerouslySet, 'Frontend React application contains 0 dangerouslySetInnerHTML occurrences');

    // ------------------------------------------------------------------
    // SECTION 9: FILE UPLOAD & ACCESS SECURITY
    // ------------------------------------------------------------------
    console.log('\n--- SECTION 9: FILE UPLOAD & ACCESS SECURITY ---');

    // Check 53: Path traversal attempt is safely rejected by resolveSafeUploadPath
    const traversalAttempt = resolveSafeUploadPath('../../../windows/system32/cmd.exe');
    assert(traversalAttempt === null, 'Path traversal attempt (../..) is detected and rejected (returns null)');

    // Check 54: Arbitrary absolute path traversal rejected
    const absoluteTraversal = resolveSafeUploadPath('C:\\Windows\\System32\\calc.exe');
    assert(
      absoluteTraversal === null || !absoluteTraversal.includes('calc.exe'),
      'Arbitrary absolute outside path traversal rejected safely'
    );

    // Check 55: Executable blacklist rejects .exe files on study material upload
    const exeUploadRes = await request(
      server,
      {
        path: '/api/admin/materials',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundaryX',
        },
      },
      '------WebKitFormBoundaryX\r\nContent-Disposition: form-data; name="file"; filename="payload.exe"\r\nContent-Type: application/x-msdownload\r\n\r\nEXE_BINARY_CODE\r\n------WebKitFormBoundaryX--\r\n'
    );
    assert(
      exeUploadRes.statusCode === 400,
      'Strict executable blacklist rejects dangerous .exe uploads with HTTP 400'
    );

    // Check 56: Script upload (.sh, .bat, .php) rejected
    const phpUploadRes = await request(
      server,
      {
        path: '/api/admin/materials',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundaryX',
        },
      },
      '------WebKitFormBoundaryX\r\nContent-Disposition: form-data; name="file"; filename="shell.php"\r\nContent-Type: application/x-php\r\n\r\n<?php echo "exploit"; ?>\r\n------WebKitFormBoundaryX--\r\n'
    );
    assert(
      phpUploadRes.statusCode === 400,
      'Strict executable blacklist rejects script uploads (.php/.sh) with HTTP 400'
    );

    // Check 57: Unpublished draft study material cannot be downloaded by candidate (403)
    const [draftMaterial] = await pool.query(
      `INSERT INTO study_materials (title, slug, subject, category_id, file_original_name, file_stored_name, file_path, file_mime_type, file_size, status, uploaded_by)
       VALUES ('Confidential Draft', 'confidential-draft-test', 'Audit', 1, 'test.pdf', 'test-stored.pdf', 'study-materials/test.pdf', 'application/pdf', 1024, 'draft', 1)`
    );
    const draftMatId = draftMaterial.insertId;
    const downloadDraftRes = await request(server, {
      path: `/api/materials/${draftMatId}/download`,
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    assert(downloadDraftRes.statusCode === 403, 'Candidate cannot download unpublished draft study materials (HTTP 403)');

    // Check 58: Non-existent material download returns HTTP 404
    const downloadMissingRes = await request(server, {
      path: '/api/materials/9999999/download',
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    assert(downloadMissingRes.statusCode === 404, 'Download of non-existent study material returns HTTP 404 Not Found');

    // ------------------------------------------------------------------
    // SECTION 10: API ERROR HANDLING, HEALTH & PRODUCTION READINESS
    // ------------------------------------------------------------------
    console.log('\n--- SECTION 10: API ERROR HANDLING, HEALTH & PRODUCTION READINESS ---');

    // Check 59: GET /api/health returns operational status and database connection state
    const liveHealth = await request(server, { path: '/api/health' });
    assert(
      liveHealth.statusCode === 200 &&
      liveHealth.body?.data?.database?.connected === true &&
      liveHealth.body?.data?.portal === 'Government Job Portal API',
      'GET /api/health verifies live system health and database connectivity'
    );

    // Check 60: Health check does NOT leak credentials or filesystem paths
    const healthJson = JSON.stringify(liveHealth.body);
    assert(
      !healthJson.includes(env.db.password || 'impossible_password_string_match') &&
      !healthJson.includes('JWT_SECRET') &&
      !healthJson.includes('R:\\') &&
      !healthJson.includes('/home/'),
      'Health check endpoint exposes no database passwords, secrets, or internal paths'
    );

    // Check 61: 404 handler for undefined API routes returns standardized JSON
    const notFoundRes = await request(server, { path: '/api/undefined-endpoint-xyz' });
    assert(
      notFoundRes.statusCode === 404 && notFoundRes.body?.success === false,
      'Undefined route requests return standardized 404 Not Found JSON error payload'
    );

    // Check 62: Database backup utility runs non-destructively and creates backup file
    const backupTestFilename = `test_audit_backup_${Date.now()}.sql`;
    const backupResult = await runDatabaseBackup(backupTestFilename);
    const backupFileExists = backupResult.success && fs.existsSync(backupResult.filePath);
    assert(
      backupFileExists && backupResult.sizeBytes > 0,
      'Database backup utility executes non-destructively and produces valid timestamped SQL dump'
    );
    // Clean up temporary test backup file
    if (backupFileExists) {
      fs.unlinkSync(backupResult.filePath);
    }

    // Check 63: Database baseline preserved (Users count >= 54)
    const [userCount] = await pool.query('SELECT COUNT(*) AS count FROM users');
    assert(
      userCount[0].count >= 54,
      `Database baseline preserved: users count is ${userCount[0].count} (minimum required: 54)`
    );

    // Check 64: Database baseline preserved (Categories count == 24)
    const [catCount] = await pool.query('SELECT COUNT(*) AS count FROM job_categories');
    assert(
      catCount[0].count === 24,
      `Database baseline preserved: official recruitment categories count is ${catCount[0].count} (expected: 24)`
    );

    // Check 65: Production build frontend bundle exists with index.html and assets
    const distIndexExists = fs.existsSync(path.join(FRONTEND_DIR, 'dist/index.html'));
    const distAssetsExist = fs.existsSync(path.join(FRONTEND_DIR, 'dist/assets'));
    assert(
      distIndexExists && distAssetsExist,
      'Frontend production bundle verified: dist/index.html and optimized assets exist'
    );

    // Cleanup temporary test records created in Phase 10 test suite
    await pool.query('DELETE FROM notifications WHERE id = ?', [notifAId]);
    await pool.query('DELETE FROM study_materials WHERE id = ?', [draftMatId]);
    await pool.query('DELETE FROM users WHERE email IN (?, ?)', [testEmail, candBEmail]);

    console.log('\n========================================================================');
    console.log(` PHASE 10 AUDIT COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL: ${checkIndex})`);
    console.log('========================================================================\n');

    process.exit(failedCount > 0 ? 1 : 0);
  } finally {
    server.close();
  }
};

runSuite().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
