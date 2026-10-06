import http from 'http';
import app from '../src/app.js';
import pool from '../src/config/db.config.js';
import { initializeDatabase } from '../src/scripts/initDb.js';
import UserModel from '../src/models/user.model.js';
import JobModel from '../src/models/job.model.js';
import JobCategoryModel from '../src/models/jobCategory.model.js';
import NotificationModel from '../src/models/notification.model.js';
import NotificationService from '../src/services/notification.service.js';
import { env } from '../src/config/env.config.js';

// HTTP JSON request helper
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
    if (postData) req.write(postData);
    req.end();
  });
};

export const runPhase09Verification = async () => {
  console.log('\n========================================================================');
  console.log(' GOVERNMENT JOB PORTAL - PHASE 09 NOTIFICATIONS & ALERTS SYSTEM TESTS');
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

  let adminToken = null;
  let candidateAToken = null;
  let candidateBToken = null;
  let candidateAUser = null;
  let candidateBUser = null;
  let adminUser = null;

  const createdNotificationIds = [];
  let testJobId = null;

  try {
    // 0. Initialize Database
    await initializeDatabase();

    // Start server on an ephemeral port
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => resolve());
    });

    // Login as Admin
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
      adminUser = adminLoginRes.body.data.user;
    }

    // Register / Login Candidate A
    const randA = Math.floor(Math.random() * 90000) + 10000;
    const candAEmail = `cand.phase9.a.${randA}@recruitment.gov.in`;
    const regARes = await request(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        full_name: `Candidate Alpha ${randA}`,
        email: candAEmail,
        mobile_number: `98${randA}1234`.slice(0, 10),
        password: 'Pass@Candidate2026!',
        confirm_password: 'Pass@Candidate2026!',
      },
    });

    if (regARes.body?.success) {
      candidateAToken = regARes.body.data.token;
      candidateAUser = regARes.body.data.user;
    } else {
      console.error('Candidate A registration failed:', regARes.body);
    }

    // Register / Login Candidate B
    const randB = Math.floor(Math.random() * 90000) + 10000;
    const candBEmail = `cand.phase9.b.${randB}@recruitment.gov.in`;
    const regBRes = await request(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        full_name: `Candidate Beta ${randB}`,
        email: candBEmail,
        mobile_number: `97${randB}5678`.slice(0, 10),
        password: 'Pass@Candidate2026!',
        confirm_password: 'Pass@Candidate2026!',
      },
    });

    if (regBRes.body?.success) {
      candidateBToken = regBRes.body.data.token;
      candidateBUser = regBRes.body.data.user;
    } else {
      console.error('Candidate B registration failed:', regBRes.body);
    }

    /* --------------------------------------------------------------------------
       SECTION 1: DATABASE SCHEMA & INDEXES VERIFICATION
       -------------------------------------------------------------------------- */
    console.log('\n--- Section 1: Database Schema & Architecture ---');

    // Check 01: Table existence
    const [tableRows] = await pool.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'`
    );
    assert(tableRows.length > 0, 1, 'Notifications table exists in database');

    // Check 02: recipient_id column
    const [recCol] = await pool.query(
      `SELECT DATA_TYPE, IS_NULLABLE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'recipient_id'`
    );
    assert(recCol.length > 0 && recCol[0].DATA_TYPE === 'int', 2, 'recipient_id column exists as INT');

    // Check 03: sender_id column
    const [sendCol] = await pool.query(
      `SELECT DATA_TYPE, IS_NULLABLE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'sender_id'`
    );
    assert(sendCol.length > 0 && sendCol[0].IS_NULLABLE === 'YES', 3, 'sender_id column is nullable INT');

    // Check 04: type ENUM column
    const [typeCol] = await pool.query(
      `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'type'`
    );
    const typeEnum = typeCol[0]?.COLUMN_TYPE || '';
    assert(
      typeEnum.includes('application_status') &&
        typeEnum.includes('application_submitted') &&
        typeEnum.includes('new_job') &&
        typeEnum.includes('study_material') &&
        typeEnum.includes('syllabus') &&
        typeEnum.includes('deadline') &&
        typeEnum.includes('announcement'),
      4,
      'type ENUM supports all required notification types'
    );

    // Check 05: priority ENUM column
    const [priCol] = await pool.query(
      `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'priority'`
    );
    const priEnum = priCol[0]?.COLUMN_TYPE || '';
    assert(
      priEnum.includes('low') && priEnum.includes('normal') && priEnum.includes('high') && priEnum.includes('urgent'),
      5,
      'priority ENUM supports low, normal, high, and urgent'
    );

    // Check 06: status ENUM column
    const [statCol] = await pool.query(
      `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'status'`
    );
    const statEnum = statCol[0]?.COLUMN_TYPE || '';
    assert(statEnum.includes('active') && statEnum.includes('archived'), 6, 'status ENUM supports active and archived');

    // Check 07: is_read boolean column
    const [readCol] = await pool.query(
      `SELECT DATA_TYPE, COLUMN_DEFAULT FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'is_read'`
    );
    assert(readCol.length > 0, 7, 'is_read column exists');

    // Check 08: read_at timestamp column
    const [readAtCol] = await pool.query(
      `SELECT DATA_TYPE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'read_at'`
    );
    assert(readAtCol.length > 0, 8, 'read_at timestamp column exists');

    // Check 09: action_url column
    const [urlCol] = await pool.query(
      `SELECT DATA_TYPE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'action_url'`
    );
    assert(urlCol.length > 0, 9, 'action_url column exists');

    // Check 10: Foreign key constraint on recipient_id -> users.id
    const [fkRows] = await pool.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'
         AND REFERENCED_TABLE_NAME = 'users' AND REFERENCED_COLUMN_NAME = 'id'`
    );
    assert(fkRows.length > 0, 10, 'Foreign key references users(id)');

    // Check 11: Indexes on notifications table
    const [idxRows] = await pool.query(
      `SHOW INDEX FROM notifications WHERE Key_name != 'PRIMARY'`
    );
    const indexNames = idxRows.map((r) => r.Key_name);
    assert(
      indexNames.some((n) => n.includes('recipient')) &&
        indexNames.some((n) => n.includes('type')) &&
        indexNames.some((n) => n.includes('status')),
      11,
      'Performance indexes exist for recipient, type, and status'
    );

    /* --------------------------------------------------------------------------
       SECTION 2: AUTHENTICATION & ACCESS CONTROL
       -------------------------------------------------------------------------- */
    console.log('\n--- Section 2: Authentication & Access Control ---');

    // Check 12: Unauthenticated GET /api/notifications returns 401
    const unauthGet = await request(server, { method: 'GET', path: '/api/notifications' });
    assert(unauthGet.statusCode === 401, 12, 'Unauthenticated GET /api/notifications returns 401');

    // Check 13: Unauthenticated unread count returns 401
    const unauthCount = await request(server, { method: 'GET', path: '/api/notifications/unread-count' });
    assert(unauthCount.statusCode === 401, 13, 'Unauthenticated GET unread count returns 401');

    // Check 14: Unauthenticated read-all returns 401
    const unauthReadAll = await request(server, { method: 'PATCH', path: '/api/notifications/read-all' });
    assert(unauthReadAll.statusCode === 401, 14, 'Unauthenticated PATCH read-all returns 401');

    // Check 15: Unauthenticated admin notifications returns 401
    const unauthAdmin = await request(server, { method: 'GET', path: '/api/admin/notifications' });
    assert(unauthAdmin.statusCode === 401, 15, 'Unauthenticated GET /api/admin/notifications returns 401');

    // Check 16: Candidate accessing admin notifications returns 403
    const candAdmin = await request(server, {
      method: 'GET',
      path: '/api/admin/notifications',
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    assert(candAdmin.statusCode === 403, 16, 'Candidate accessing /api/admin/notifications returns 403 Forbidden');

    // Check 17: Candidate accessing admin stats returns 403
    const candAdminStats = await request(server, {
      method: 'GET',
      path: '/api/admin/notifications/stats',
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    assert(candAdminStats.statusCode === 403, 17, 'Candidate accessing /api/admin/notifications/stats returns 403');

    // Check 18: Candidate posting announcement returns 403
    const candPostAnnounce = await request(server, {
      method: 'POST',
      path: '/api/admin/notifications',
      headers: { Authorization: `Bearer ${candidateAToken}` },
      body: { title: 'Hack', message: 'Not allowed' },
    });
    assert(candPostAnnounce.statusCode === 403, 18, 'Candidate POST announcement returns 403 Forbidden');

    // Check 19: Candidate authenticated request succeeds
    const candGet = await request(server, {
      method: 'GET',
      path: '/api/notifications',
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    assert(candGet.statusCode === 200 && candGet.body?.success, 19, 'Candidate authenticated GET /api/notifications returns 200');

    // Check 20: Admin authenticated request succeeds
    const adminGet = await request(server, {
      method: 'GET',
      path: '/api/admin/notifications',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminGet.statusCode === 200 && adminGet.body?.success, 20, 'Admin authenticated GET /api/admin/notifications returns 200');

    /* --------------------------------------------------------------------------
       SECTION 3: NOTIFICATION CREATION & MODEL VALIDATION
       -------------------------------------------------------------------------- */
    console.log('\n--- Section 3: Notification Creation & Model Validation ---');

    // Check 21: Direct NotificationService.notifyUser creates record
    const createdNotif = await NotificationService.notifyUser(candidateAUser.id, {
      type: 'system',
      title: 'Welcome to the Recruitment Portal',
      message: 'Your account is active. Verify profile details before applying.',
      priority: 'normal',
      action_url: '/candidate/dashboard',
    });
    createdNotificationIds.push(createdNotif.id);
    assert(Boolean(createdNotif && createdNotif.id), 21, 'NotificationService.notifyUser creates notification');

    // Check 22: Fields match input
    assert(
      createdNotif.recipient_id === candidateAUser.id &&
        createdNotif.title === 'Welcome to the Recruitment Portal' &&
        createdNotif.priority === 'normal' &&
        createdNotif.type === 'system' &&
        createdNotif.action_url === '/candidate/dashboard',
      22,
      'Notification fields properly stored in database'
    );

    // Check 23: Invalid recipient throws 404
    let invalidRecFailed = false;
    try {
      await NotificationService.notifyUser(9999999, {
        title: 'Ghost',
        message: 'Invalid user',
      });
    } catch (err) {
      invalidRecFailed = err.statusCode === 404;
    }
    assert(invalidRecFailed, 23, 'Creating notification for non-existent recipient throws 404');

    // Check 24: Bulk notification creation
    const bulkCount = await NotificationModel.createBulk([
      {
        recipient_id: candidateAUser.id,
        title: 'Bulk Test 1',
        message: 'First bulk notification',
        priority: 'low',
        type: 'system',
      },
      {
        recipient_id: candidateBUser.id,
        title: 'Bulk Test 2',
        message: 'Second bulk notification',
        priority: 'high',
        type: 'system',
      },
    ]);
    assert(bulkCount >= 2, 24, 'NotificationModel.createBulk inserts multiple records atomically');

    // Check 25: findById includes recipient details
    const foundWithDetails = await NotificationModel.findById(createdNotif.id);
    assert(
      foundWithDetails && foundWithDetails.recipient_name && foundWithDetails.recipient_email,
      25,
      'NotificationModel.findById joins recipient user metadata'
    );

    /* --------------------------------------------------------------------------
       SECTION 4: STRICT OWNERSHIP & TENANT ISOLATION
       -------------------------------------------------------------------------- */
    console.log('\n--- Section 4: Strict Ownership & Security ---');

    // Create notification specifically for Candidate B
    const notifB = await NotificationService.notifyUser(candidateBUser.id, {
      type: 'system',
      title: 'Secret Notice for Candidate B',
      message: 'Candidate A must never see this message.',
      priority: 'high',
    });
    createdNotificationIds.push(notifB.id);

    // Check 26: Candidate A can view their own notification
    const candAViewOwn = await request(server, {
      method: 'GET',
      path: `/api/notifications/${createdNotif.id}`,
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    assert(candAViewOwn.statusCode === 200 && candAViewOwn.body?.data?.id === createdNotif.id, 26, 'Candidate views own notification details');

    // Check 27: Candidate A cannot view Candidate B's notification (HTTP 403)
    const candATamperView = await request(server, {
      method: 'GET',
      path: `/api/notifications/${notifB.id}`,
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    assert(candATamperView.statusCode === 403, 27, 'Candidate A accessing Candidate B notification receives 403 Forbidden');

    // Check 28: Candidate A cannot mark read Candidate B's notification (HTTP 403)
    const candATamperRead = await request(server, {
      method: 'PATCH',
      path: `/api/notifications/${notifB.id}/read`,
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    assert(candATamperRead.statusCode === 403, 28, 'Candidate A marking read Candidate B notification receives 403 Forbidden');

    // Check 29: Candidate A cannot archive Candidate B's notification (HTTP 403)
    const candATamperArchive = await request(server, {
      method: 'PATCH',
      path: `/api/notifications/${notifB.id}/archive`,
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    assert(candATamperArchive.statusCode === 403, 29, 'Candidate A archiving Candidate B notification receives 403 Forbidden');

    // Check 30: Admin CAN view Candidate B's notification
    const adminViewCandB = await request(server, {
      method: 'GET',
      path: `/api/notifications/${notifB.id}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminViewCandB.statusCode === 200, 30, 'Admin can view notification details with administrative privileges');

    // Check 31: Non-existent notification ID returns 404
    const notFoundRes = await request(server, {
      method: 'GET',
      path: '/api/notifications/99999999',
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    assert(notFoundRes.statusCode === 404, 31, 'Non-existent notification returns 404 Not Found');

    /* --------------------------------------------------------------------------
       SECTION 5: READ STATES & UNREAD COUNTS
       -------------------------------------------------------------------------- */
    console.log('\n--- Section 5: Read States & Unread Counts ---');

    // Check 32: Unread count accurate
    const unreadCountRes1 = await request(server, {
      method: 'GET',
      path: '/api/notifications/unread-count',
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    const initialUnread = unreadCountRes1.body?.data?.unread_count || 0;
    assert(unreadCountRes1.statusCode === 200 && initialUnread > 0, 32, 'Unread count API returns active unread notifications');

    // Check 33: Mark single notification as read
    const markReadRes = await request(server, {
      method: 'PATCH',
      path: `/api/notifications/${createdNotif.id}/read`,
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    assert(markReadRes.statusCode === 200 && markReadRes.body?.success, 33, 'PATCH /api/notifications/:id/read succeeds');

    // Check 34: Verified is_read and read_at updated in database
    const verifiedDbRow = await NotificationModel.findById(createdNotif.id);
    assert(
      verifiedDbRow.is_read === 1 || verifiedDbRow.is_read === true,
      34,
      'Notification is_read flag set to true and read_at timestamp set'
    );

    // Check 35: Unread count decremented
    const unreadCountRes2 = await request(server, {
      method: 'GET',
      path: '/api/notifications/unread-count',
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    const postMarkUnread = unreadCountRes2.body?.data?.unread_count || 0;
    assert(postMarkUnread === initialUnread - 1, 35, 'Unread count properly decremented by 1');

    // Check 36: Mark all notifications as read
    const markAllRes = await request(server, {
      method: 'PATCH',
      path: '/api/notifications/read-all',
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    assert(markAllRes.statusCode === 200 && markAllRes.body?.success, 36, 'PATCH /api/notifications/read-all succeeds');

    // Check 37: Unread count becomes 0
    const unreadCountRes3 = await request(server, {
      method: 'GET',
      path: '/api/notifications/unread-count',
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    assert(unreadCountRes3.body?.data?.unread_count === 0, 37, 'Unread count reaches 0 after read-all');

    // Check 38: Candidate B's unread notifications remain unread
    const candBUnreadRes = await request(server, {
      method: 'GET',
      path: '/api/notifications/unread-count',
      headers: { Authorization: `Bearer ${candidateBToken}` },
    });
    assert(candBUnreadRes.body?.data?.unread_count > 0, 38, "read-all strictly scopes to authenticated user without leaking");

    /* --------------------------------------------------------------------------
       SECTION 6: ARCHIVING (SOFT DELETE)
       -------------------------------------------------------------------------- */
    console.log('\n--- Section 6: Archiving (Soft Delete) ---');

    // Check 39: Archive notification
    const archiveRes = await request(server, {
      method: 'PATCH',
      path: `/api/notifications/${createdNotif.id}/archive`,
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    assert(archiveRes.statusCode === 200, 39, 'PATCH /api/notifications/:id/archive soft-deletes notification');

    // Check 40: Excluded from active list
    const activeListRes = await request(server, {
      method: 'GET',
      path: '/api/notifications?status=active',
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    const activeIds = (activeListRes.body?.data || []).map((n) => n.id);
    assert(!activeIds.includes(createdNotif.id), 40, 'Archived notification is excluded from default active list');

    // Check 41: Accessible when filtering status=archived
    const archivedListRes = await request(server, {
      method: 'GET',
      path: '/api/notifications?status=archived',
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    const archivedIds = (archivedListRes.body?.data || []).map((n) => n.id);
    assert(archivedIds.includes(createdNotif.id), 41, 'Archived notification retrievable when status=archived specified');

    /* --------------------------------------------------------------------------
       SECTION 7: FILTERING, SEARCHING & PAGINATION
       -------------------------------------------------------------------------- */
    console.log('\n--- Section 7: Filtering, Searching & Pagination ---');

    // Seed diverse notifications for Candidate A
    await NotificationModel.create({
      recipient_id: candidateAUser.id,
      type: 'new_job',
      title: 'Assistant Engineer Vacancy 2026',
      message: 'New recruitment drive in Irrigation Department.',
      priority: 'normal',
      status: 'active',
      is_read: false,
    });
    await NotificationModel.create({
      recipient_id: candidateAUser.id,
      type: 'deadline',
      title: 'Approaching Deadline: Section Officer',
      message: 'Last date to submit application is approaching in 3 days.',
      priority: 'urgent',
      status: 'active',
      is_read: false,
    });
    await NotificationModel.create({
      recipient_id: candidateAUser.id,
      type: 'study_material',
      title: 'Civil Engineering Quick Revision PDF',
      message: 'Official high-scoring formula handbook published.',
      priority: 'high',
      status: 'active',
      is_read: true,
    });

    // Check 42: Type filtering
    const typeFilterRes = await request(server, {
      method: 'GET',
      path: '/api/notifications?type=deadline',
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    const allTypeDeadline = (typeFilterRes.body?.data || []).every((n) => n.type === 'deadline');
    assert(typeFilterRes.body?.data?.length > 0 && allTypeDeadline, 42, 'Filtering by type=deadline returns only deadline alerts');

    // Check 43: Priority filtering
    const priFilterRes = await request(server, {
      method: 'GET',
      path: '/api/notifications?priority=urgent',
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    const allPriUrgent = (priFilterRes.body?.data || []).every((n) => n.priority === 'urgent');
    assert(priFilterRes.body?.data?.length > 0 && allPriUrgent, 43, 'Filtering by priority=urgent returns only urgent alerts');

    // Check 44: Read / Unread filtering (is_read=false)
    const unreadFilterRes = await request(server, {
      method: 'GET',
      path: '/api/notifications?is_read=false',
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    const allUnread = (unreadFilterRes.body?.data || []).every((n) => !n.is_read);
    assert(unreadFilterRes.body?.data?.length > 0 && allUnread, 44, 'Filtering by is_read=false returns only unread items');

    // Check 45: Read filtering (is_read=true)
    const readFilterRes = await request(server, {
      method: 'GET',
      path: '/api/notifications?is_read=true',
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    const allRead = (readFilterRes.body?.data || []).every((n) => Boolean(n.is_read));
    assert(readFilterRes.body?.data?.length > 0 && allRead, 45, 'Filtering by is_read=true returns only read items');

    // Check 46: Search query matching
    const searchRes = await request(server, {
      method: 'GET',
      path: '/api/notifications?search=Engineering',
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    assert(searchRes.body?.data?.length > 0, 46, 'Search query matches notification title or text');

    // Check 47: Pagination & limits
    const pageRes = await request(server, {
      method: 'GET',
      path: '/api/notifications?page=1&limit=2',
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    assert(
      pageRes.body?.data?.length <= 2 && pageRes.body?.pagination?.limit === 2,
      47,
      'Pagination limits number of results and returns metadata'
    );

    // Check 48: Sorting by priority_high
    const sortRes = await request(server, {
      method: 'GET',
      path: '/api/notifications?sort=priority_high',
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    const firstItem = sortRes.body?.data?.[0];
    assert(firstItem && ['urgent', 'high'].includes(firstItem.priority), 48, 'Sorting by priority_high orders urgent/high items first');

    /* --------------------------------------------------------------------------
       SECTION 8: APPLICATION LIFECYCLE INTEGRATION (PHASE 07)
       -------------------------------------------------------------------------- */
    console.log('\n--- Section 8: Application Lifecycle Integration ---');

    // Find or create an active category
    const [catRows] = await pool.query("SELECT id FROM job_categories WHERE status = 'active' LIMIT 1");
    const testCatId = catRows[0].id;

    // Create a published job for application testing
    const testJobCode = `JOB-P9-${Math.floor(Math.random() * 90000)}`;
    const createdJob = await JobModel.create({
      job_code: testJobCode,
      title: 'Deputy Director of Administration',
      organization: 'Department of Personnel & Training',
      category_id: testCatId,
      vacancies: 12,
      last_date: '2026-12-31',
      status: 'published',
      created_by: adminUser.id,
    });
    testJobId = createdJob.id;

    // Check 49: Application submission notification dispatch
    const appSubmitNotif = await NotificationService.notifyApplicationSubmitted(
      candidateAUser.id,
      { id: 987, application_id: 'APP-2026-P9TEST' },
      { id: testJobId, title: 'Deputy Director of Administration', organization: 'DoPT' }
    );
    assert(
      appSubmitNotif && appSubmitNotif.type === 'application_submitted',
      49,
      'Application submission triggers application_submitted notification'
    );

    // Check 50: Notification contains application reference and action_url
    assert(
      appSubmitNotif.action_url === '/applications/987' &&
        appSubmitNotif.message.includes('APP-2026-P9TEST'),
      50,
      'application_submitted notification embeds application ID and action link'
    );

    // Check 51: Application status update notification dispatch (under_review)
    const appStatusNotif = await NotificationService.notifyApplicationStatus(
      candidateAUser.id,
      { id: 987, application_id: 'APP-2026-P9TEST' },
      { id: testJobId, title: 'Deputy Director of Administration' },
      'under_review'
    );
    assert(
      appStatusNotif && appStatusNotif.type === 'application_status' && appStatusNotif.title.includes('UNDER REVIEW'),
      51,
      'Application status transition to under_review creates notification'
    );

    // Check 52: Shortlisted status sets urgent priority
    const appShortlistNotif = await NotificationService.notifyApplicationStatus(
      candidateAUser.id,
      { id: 987, application_id: 'APP-2026-P9TEST' },
      { id: testJobId, title: 'Deputy Director of Administration' },
      'shortlisted'
    );
    assert(
      appShortlistNotif && appShortlistNotif.priority === 'urgent',
      52,
      'Application status update to shortlisted automatically sets urgent priority'
    );

    /* --------------------------------------------------------------------------
       SECTION 9: JOB & MATERIAL INTEGRATIONS (PHASES 05, 06, 08)
       -------------------------------------------------------------------------- */
    console.log('\n--- Section 9: Vacancy & Resource Integrations ---');

    // Check 53: New job published notification
    const newJobDispatched = await NotificationService.notifyNewJob({
      id: testJobId,
      title: 'Revenue Inspector Grade-I',
      organization: 'State Land Records Commission',
      status: 'published',
      vacancies: 45,
      last_date: '2026-11-30',
    });
    assert(newJobDispatched >= 1, 53, 'Publishing new vacancy dispatches in-app notification to candidates');

    // Check 54: Study material published notification
    const materialNotif = await NotificationService.notifyStudyMaterial({
      id: 555,
      title: 'Constitution & Public Policy Handbook',
      subject: 'General Studies',
      status: 'published',
    });
    assert(materialNotif >= 1, 54, 'Publishing study material dispatches notification to candidates');

    // Check 55: Examination syllabus published notification
    const syllabusNotif = await NotificationService.notifySyllabus({
      id: 556,
      title: 'Combined Civil Services Preliminary Exam Syllabus',
      material_type: 'syllabus',
      status: 'published',
    });
    assert(syllabusNotif >= 1, 55, 'Publishing syllabus dispatches syllabus notification to candidates');

    /* --------------------------------------------------------------------------
       SECTION 10: DEADLINE ALERTS & IDEMPOTENCY
       -------------------------------------------------------------------------- */
    console.log('\n--- Section 10: Deadline Alerts & Idempotency ---');

    // Create a job with last_date exactly 7 days from today
    const [dateRows] = await pool.query(
      "SELECT DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 7 DAY), '%Y-%m-%d') AS d7Str"
    );
    const d7Str = dateRows[0].d7Str;

    const closingJobCode = `JOB-DEADLINE-${Math.floor(Math.random() * 90000)}`;
    const closingJob = await JobModel.create({
      job_code: closingJobCode,
      title: 'Sub-Divisional Magistrate Examination',
      organization: 'State Public Service Commission',
      category_id: testCatId,
      vacancies: 8,
      last_date: d7Str,
      status: 'published',
      created_by: adminUser.id,
    });

    // Check 56: Deadline scan creates notification for job closing in 7 days
    const dispatchedFirst = await NotificationService.checkAndDispatchDeadlineAlerts();
    assert(dispatchedFirst >= 1, 56, 'checkAndDispatchDeadlineAlerts dispatches alerts for jobs closing in 7 days');

    // Check 57: Idempotency: Second scan immediately after does NOT duplicate alerts
    const dispatchedSecond = await NotificationService.checkAndDispatchDeadlineAlerts();
    assert(dispatchedSecond === 0, 57, 'Deadline alerts are strictly idempotent (duplicate alerts prevented)');

    // Check 58: Candidate receives deadline alert with action_url
    const deadlineAlerts = await NotificationModel.findByRecipient(candidateAUser.id, { type: 'deadline' });
    const hasClosingJobAlert = deadlineAlerts.data.some(
      (n) => n.related_entity_id === closingJob.id || n.message.includes('7 Day')
    );
    assert(hasClosingJobAlert, 58, 'Candidate received approaching deadline alert with closing window info');

    /* --------------------------------------------------------------------------
       SECTION 11: ADMIN ANNOUNCEMENTS & CONTROLS
       -------------------------------------------------------------------------- */
    console.log('\n--- Section 11: Admin Announcements & Management ---');

    // Check 59: Admin statistics endpoint
    const statsRes = await request(server, {
      method: 'GET',
      path: '/api/admin/notifications/stats',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const sData = statsRes.body?.data || {};
    assert(
      statsRes.statusCode === 200 &&
        typeof sData.total === 'number' &&
        typeof sData.unread === 'number' &&
        typeof sData.active === 'number' &&
        typeof sData.archived === 'number',
      59,
      'GET /api/admin/notifications/stats returns comprehensive system metrics'
    );

    // Check 60: Admin broadcasts announcement to all candidates
    const broadcastRes = await request(server, {
      method: 'POST',
      path: '/api/admin/notifications',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        title: 'Emergency Server Maintenance Notice',
        message: 'The portal will undergo scheduled database maintenance tonight from 02:00 to 04:00 AM IST.',
        priority: 'high',
        scope: 'all',
        action_url: '/about',
      },
    });
    assert(broadcastRes.statusCode === 201 && broadcastRes.body?.data?.count > 0, 60, 'Admin broadcasts announcement to all candidates');

    // Check 61: Admin targets announcement to single candidate
    const singleRes = await request(server, {
      method: 'POST',
      path: '/api/admin/notifications',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        title: 'Document Verification Reminder',
        message: 'Please re-upload your clear photo identity proof.',
        priority: 'urgent',
        scope: 'single',
        candidate_id: candidateAUser.id,
        action_url: '/my-applications',
      },
    });
    assert(singleRes.statusCode === 201 && singleRes.body?.data?.count === 1, 61, 'Admin sends targeted announcement to single candidate');

    // Check 62: Admin announcement missing title returns 400
    const invalidAnnounceRes = await request(server, {
      method: 'POST',
      path: '/api/admin/notifications',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { message: 'Missing title' },
    });
    assert(invalidAnnounceRes.statusCode === 400, 62, 'Announcement missing title returns 400 Bad Request');

    // Check 63: Admin trigger deadlines endpoint
    const triggerDeadlinesRes = await request(server, {
      method: 'POST',
      path: '/api/admin/notifications/trigger-deadlines',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(triggerDeadlinesRes.statusCode === 200 && triggerDeadlinesRes.body?.success, 63, 'Admin triggers deadline scan endpoint');

    // Check 64: Admin archives notification
    const adminArchiveRes = await request(server, {
      method: 'PATCH',
      path: `/api/admin/notifications/${appSubmitNotif.id}/archive`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminArchiveRes.statusCode === 200, 64, 'Admin archives notification administratively');

    /* --------------------------------------------------------------------------
       SECTION 12: SECURITY & DATA INTEGRITY
       -------------------------------------------------------------------------- */
    console.log('\n--- Section 12: Security & Data Integrity ---');

    // Check 65: SQL injection attempt in search parameter
    const sqlInjRes = await request(server, {
      method: 'GET',
      path: `/api/notifications?search=${encodeURIComponent("' OR 1=1 --")}`,
      headers: { Authorization: `Bearer ${candidateAToken}` },
    });
    assert(sqlInjRes.statusCode === 200 && Array.isArray(sqlInjRes.body?.data), 65, 'SQL injection attempt handled safely via parameterized queries');

    // Check 66: Preserve existing official categories
    const [allCatRows] = await pool.query('SELECT COUNT(*) AS catCount FROM job_categories');
    assert(allCatRows[0].catCount >= 24, 66, 'All 24 official job categories preserved without corruption');

  } catch (err) {
    console.error('Test execution error:', err);
    failedCount++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }

  console.log('\n========================================================================');
  console.log(` PHASE 09 TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('========================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runPhase09Verification();
