/**
 * ==============================================================================
 * GOVERNMENT JOB PORTAL — JOB GROUP FILTER & METADATA TEST SUITE
 * ==============================================================================
 * 
 * Verifies all 16 requirements specified in the user prompt:
 *  1. All Groups returns all published jobs
 *  2. Group 1 filter works (job_group=GROUP_1)
 *  3. Group 2 filter works (job_group=GROUP_2)
 *  4. Group 2A filter works (job_group=GROUP_2A)
 *  5. Group 3 filter works (job_group=GROUP_3)
 *  6. Group 4 filter works (job_group=GROUP_4)
 *  7. Group 2 and Group 2A remain strictly separate
 *  8. Group filter works together with existing category filter
 *  9. Group filter works together with location filter
 *  10. Invalid group value is handled safely (400 Bad Request)
 *  11. Existing job search still works
 *  12. Existing filters still work
 *  13. Existing public job visibility rules remain intact
 *  14. Existing admin job creation with job_group works
 *  15. Existing admin job editing with job_group works
 *  16. Existing database records remain intact
 */

import http from 'http';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import pool from '../src/config/db.config.js';
import { env } from '../src/config/env.config.js';

// HTTP Helper
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
          status: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

const runSuite = async () => {
  console.log('\n================================================================');
  console.log('🚀 RUNNING JOB GROUP FILTER TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, desc) => {
    if (condition) {
      console.log(`  ✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${desc}`);
      failed++;
    }
  };

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  // Generate Admin JWT for admin tests
  const adminToken = jwt.sign(
    { id: 1, email: 'admin@tn.gov.in', role: 'admin' },
    env.jwt.secret,
    { expiresIn: '1h' }
  );

  let testJobIds = [];

  try {
    // 0. Verify Database Integrity before tests
    const [userRows] = await pool.query('SELECT COUNT(*) as cnt FROM users');
    const [catRows] = await pool.query('SELECT COUNT(*) as cnt FROM job_categories');
    const [initialJobRows] = await pool.query('SELECT COUNT(*) as cnt FROM jobs');
    
    assert(userRows[0].cnt >= 1, `Users table has existing records (${userRows[0].cnt} users intact)`);
    assert(catRows[0].cnt === 24, `Job categories intact with exactly 24 official categories (found ${catRows[0].cnt})`);
    assert(initialJobRows[0].cnt >= 1, `Existing jobs intact (found ${initialJobRows[0].cnt} jobs)`);

    // Fetch category ID 1 for test fixtures
    const [categoryList] = await pool.query('SELECT id, name FROM job_categories LIMIT 2');
    const catId1 = categoryList[0].id;
    const catId2 = categoryList.length > 1 ? categoryList[1].id : catId1;

    // Create 5 test jobs for each group + 1 ungrouped
    const groupTypes = ['GROUP_1', 'GROUP_2', 'GROUP_2A', 'GROUP_3', 'GROUP_4'];
    
    for (let i = 0; i < groupTypes.length; i++) {
      const grp = groupTypes[i];
      const createRes = await request(
        server,
        {
          path: '/api/admin/jobs',
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        },
        {
          job_code: `TEST-GRP-${grp}-${Date.now()}-${i}`,
          title: `Test Exam Recruitment for ${grp}`,
          organization: 'Tamil Nadu Public Service Commission',
          department: grp === 'GROUP_4' ? 'Forest Department' : 'Revenue Administration',
          category_id: i % 2 === 0 ? catId1 : catId2,
          job_group: grp,
          vacancies: 50 + i * 10,
          location: grp === 'GROUP_2' ? 'Chennai' : 'Madurai',
          qualification: 'Degree from recognized university',
          description: `Detailed recruitment description for official test ${grp}`,
          status: 'published',
        }
      );
      assert(createRes.status === 201 && createRes.body.success, `Created test published job for ${grp}`);
      if (createRes.body.data?.id) {
        testJobIds.push(createRes.body.data.id);
      }
    }

    // Create 1 draft job with GROUP_1 to ensure public visibility rules
    const draftRes = await request(
      server,
      {
        path: '/api/admin/jobs',
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      {
        job_code: `TEST-DRAFT-GRP1-${Date.now()}`,
        title: 'Draft Unapproved Recruitment Group 1',
        organization: 'TNPSC Internal',
        category_id: catId1,
        job_group: 'GROUP_1',
        vacancies: 10,
        description: 'Draft description for unapproved vacancy',
        status: 'draft',
      }
    );
    if (draftRes.body.data?.id) {
      testJobIds.push(draftRes.body.data.id);
    }
    assert(draftRes.status === 201, 'Created draft job with GROUP_1');

    // 1. All Groups returns all published jobs
    const allGroupsRes = await request(server, { path: '/api/jobs' });
    assert(allGroupsRes.status === 200 && allGroupsRes.body.success, 'GET /api/jobs returns HTTP 200');
    const allJobs = allGroupsRes.body.data || [];
    assert(allJobs.length > 0, `All groups query returns all published jobs (${allJobs.length} returned)`);
    // Ensure draft job is NOT in public all jobs
    const hasDraftJob = allJobs.some(j => j.id === draftRes.body.data.id);
    assert(!hasDraftJob, 'Draft jobs are NOT exposed on public /api/jobs');

    // Also test explicitly passing job_group=ALL or empty
    const allParamRes = await request(server, { path: '/api/jobs?job_group=ALL' });
    assert(allParamRes.status === 200 && allParamRes.body.data.length === allJobs.length, 'job_group=ALL returns same count as no filter');

    // 2. Group 1 filter works
    const grp1Res = await request(server, { path: '/api/jobs?job_group=GROUP_1' });
    assert(grp1Res.status === 200 && grp1Res.body.success, 'GET /api/jobs?job_group=GROUP_1 returns HTTP 200');
    const grp1Jobs = grp1Res.body.data || [];
    assert(grp1Jobs.length > 0, 'Group 1 filter returns published jobs');
    assert(grp1Jobs.every(j => j.job_group === 'GROUP_1'), 'Every job in Group 1 result has job_group = "GROUP_1"');

    // 3. Group 2 filter works
    const grp2Res = await request(server, { path: '/api/jobs?job_group=GROUP_2' });
    assert(grp2Res.status === 200, 'GET /api/jobs?job_group=GROUP_2 returns HTTP 200');
    const grp2Jobs = grp2Res.body.data || [];
    assert(grp2Jobs.length > 0 && grp2Jobs.every(j => j.job_group === 'GROUP_2'), 'Group 2 filter returns only GROUP_2 jobs');

    // 4. Group 2A filter works
    const grp2aRes = await request(server, { path: '/api/jobs?job_group=GROUP_2A' });
    assert(grp2aRes.status === 200, 'GET /api/jobs?job_group=GROUP_2A returns HTTP 200');
    const grp2aJobs = grp2aRes.body.data || [];
    assert(grp2aJobs.length > 0 && grp2aJobs.every(j => j.job_group === 'GROUP_2A'), 'Group 2A filter returns only GROUP_2A jobs');

    // 5. Group 3 filter works
    const grp3Res = await request(server, { path: '/api/jobs?job_group=GROUP_3' });
    assert(grp3Res.status === 200, 'GET /api/jobs?job_group=GROUP_3 returns HTTP 200');
    const grp3Jobs = grp3Res.body.data || [];
    assert(grp3Jobs.length > 0 && grp3Jobs.every(j => j.job_group === 'GROUP_3'), 'Group 3 filter returns only GROUP_3 jobs');

    // 6. Group 4 filter works
    const grp4Res = await request(server, { path: '/api/jobs?job_group=GROUP_4' });
    assert(grp4Res.status === 200, 'GET /api/jobs?job_group=GROUP_4 returns HTTP 200');
    const grp4Jobs = grp4Res.body.data || [];
    assert(grp4Jobs.length > 0 && grp4Jobs.every(j => j.job_group === 'GROUP_4'), 'Group 4 filter returns only GROUP_4 jobs');

    // 7. Group 2 and Group 2A remain strictly separate
    const grp2Ids = grp2Jobs.map(j => j.id);
    const grp2aIds = grp2aJobs.map(j => j.id);
    const overlap = grp2Ids.filter(id => grp2aIds.includes(id));
    assert(overlap.length === 0, 'Group 2 and Group 2A are strictly distinct with 0 ID overlap');

    // 8. Group filter works together with existing category filter
    const grpCategoryRes = await request(server, { path: `/api/jobs?job_group=GROUP_1&category_id=${catId1}` });
    assert(grpCategoryRes.status === 200, 'Combined Group 1 + category_id returns HTTP 200');
    const grpCatJobs = grpCategoryRes.body.data || [];
    assert(grpCatJobs.length > 0 && grpCatJobs.every(j => j.job_group === 'GROUP_1' && (j.category?.id === catId1 || j.category_id === catId1)), 'Jobs match both GROUP_1 and category_id');

    // 9. Group filter works together with location filter
    const grpLocationRes = await request(server, { path: '/api/jobs?job_group=GROUP_2&location=Chennai' });
    assert(grpLocationRes.status === 200, 'Combined Group 2 + location=Chennai returns HTTP 200');
    const grpLocJobs = grpLocationRes.body.data || [];
    assert(grpLocJobs.length > 0 && grpLocJobs.every(j => j.job_group === 'GROUP_2' && j.location.includes('Chennai')), 'Jobs match both GROUP_2 and location=Chennai');

    // 10. Invalid group value is handled safely
    const invalidRes = await request(server, { path: '/api/jobs?job_group=GROUP_99' });
    assert(invalidRes.status === 400 && invalidRes.body.success === false, 'Invalid job_group returns HTTP 400 Bad Request');
    assert(invalidRes.body.message.includes('Invalid job_group'), 'Error message identifies invalid job_group value');

    // SQL Injection guard check
    const sqliRes = await request(server, { path: "/api/jobs?job_group=' OR '1'='1" });
    assert(sqliRes.status === 400 && sqliRes.body.success === false, 'SQL injection in job_group safely rejected with HTTP 400');

    // 11. Existing job search still works
    const searchRes = await request(server, { path: '/api/jobs?search=Recruitment' });
    assert(searchRes.status === 200 && searchRes.body.data.length > 0, 'Existing keyword search works properly');

    // 12. Combined search + job_group filter
    const searchGroupRes = await request(server, { path: '/api/jobs?search=Recruitment&job_group=GROUP_4' });
    assert(searchGroupRes.status === 200 && searchGroupRes.body.data.every(j => j.job_group === 'GROUP_4'), 'Combined search and job_group works properly');

    // 13. Public job details by ID includes job_group
    const publishedGrp1JobId = testJobIds[0];
    const detailRes = await request(server, { path: `/api/jobs/${publishedGrp1JobId}` });
    assert(detailRes.status === 200 && detailRes.body.data.job_group === 'GROUP_1', 'Single job details includes job_group="GROUP_1"');

    // 14. Existing admin job editing with job_group
    const editRes = await request(
      server,
      {
        path: `/api/admin/jobs/${publishedGrp1JobId}`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      {
        title: 'Updated Test Title Group 1 to Group 2A',
        organization: 'Tamil Nadu Public Service Commission',
        category_id: catId1,
        job_group: 'GROUP_2A',
        vacancies: 75,
        status: 'published',
      }
    );
    assert(editRes.status === 200 && editRes.body.data.job_group === 'GROUP_2A', 'Admin can update job_group to GROUP_2A');

    // Verify it now appears under GROUP_2A and NOT GROUP_1
    const verifyGrp2a = await request(server, { path: `/api/jobs/${publishedGrp1JobId}` });
    assert(verifyGrp2a.body.data.job_group === 'GROUP_2A', 'Updated job_group reflected on public job details');

    // 15. Admin can set job_group back to null / none
    const clearGrpRes = await request(
      server,
      {
        path: `/api/admin/jobs/${publishedGrp1JobId}`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      {
        title: 'Cleared Group Job Title',
        organization: 'Tamil Nadu Public Service Commission',
        category_id: catId1,
        job_group: null,
        vacancies: 75,
        status: 'published',
      }
    );
    assert(clearGrpRes.status === 200 && clearGrpRes.body.data.job_group === null, 'Admin can set job_group to null / None');

    // 16. Existing database records remain intact
    // Clean up only our created test fixtures
    if (testJobIds.length > 0) {
      await pool.query('DELETE FROM jobs WHERE id IN (?)', [testJobIds]);
    }
    const [finalUserRows] = await pool.query('SELECT COUNT(*) as cnt FROM users');
    const [finalCatRows] = await pool.query('SELECT COUNT(*) as cnt FROM job_categories');
    const [finalJobRows] = await pool.query('SELECT COUNT(*) as cnt FROM jobs');

    assert(finalUserRows[0].cnt === userRows[0].cnt, `All users preserved (${finalUserRows[0].cnt} users)`);
    assert(finalCatRows[0].cnt === 24, 'All 24 job categories preserved');
    assert(finalJobRows[0].cnt === initialJobRows[0].cnt, `Original jobs preserved (${finalJobRows[0].cnt} jobs)`);

  } finally {
    server.close();
    await pool.end();
  }

  console.log('\n================================================================');
  console.log(`SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
};

runSuite().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
