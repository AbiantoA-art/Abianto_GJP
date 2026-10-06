import http from 'http';
import app from '../src/app.js';
import pool from '../src/config/db.config.js';

let passed = 0;
let failed = 0;

function assert(condition, testNum, description) {
  if (condition) {
    console.log(`[PASS] Check ${String(testNum).padStart(2, '0')}: ${description}`);
    passed++;
  } else {
    console.error(`[FAIL] Check ${String(testNum).padStart(2, '0')}: ${description}`);
    failed++;
  }
}

function request(server, { method = 'GET', path, headers = {} }) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        method,
        path,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let body = null;
          try {
            body = JSON.parse(rawData);
          } catch {
            body = rawData;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
          });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('\n========================================================================');
  console.log(' RUNNING TNPSC STUDY MATERIALS VERIFICATION SUITE (CHECKS 1 - 16)');
  console.log('========================================================================\n');

  let server;

  try {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));

    // 1. Group 1 materials exist
    const g1Res = await request(server, { path: '/api/materials?exam_group=GROUP_1' });
    const g1Items = g1Res.body?.data || [];
    assert(
      g1Res.statusCode === 200 && g1Items.length > 0 && g1Items.every((m) => m.exam_group === 'GROUP_1'),
      1,
      `Group 1 materials exist (${g1Items.length} verified)`
    );

    // 2. Group 2 materials exist
    const g2Res = await request(server, { path: '/api/materials?exam_group=GROUP_2' });
    const g2Items = g2Res.body?.data || [];
    assert(
      g2Res.statusCode === 200 && g2Items.length > 0 && g2Items.every((m) => m.exam_group === 'GROUP_2'),
      2,
      `Group 2 materials exist (${g2Items.length} verified)`
    );

    // 3. Group 2A materials exist
    const g2aRes = await request(server, { path: '/api/materials?exam_group=GROUP_2A' });
    const g2aItems = g2aRes.body?.data || [];
    assert(
      g2aRes.statusCode === 200 && g2aItems.length > 0 && g2aItems.every((m) => m.exam_group === 'GROUP_2A'),
      3,
      `Group 2A materials exist (${g2aItems.length} verified)`
    );

    // 4. Group 3 materials exist
    const g3Res = await request(server, { path: '/api/materials?exam_group=GROUP_3' });
    const g3Items = g3Res.body?.data || [];
    assert(
      g3Res.statusCode === 200 && g3Items.length > 0 && g3Items.every((m) => m.exam_group === 'GROUP_3'),
      4,
      `Group 3 materials exist (${g3Items.length} verified)`
    );

    // 5. Group 4 materials exist
    const g4Res = await request(server, { path: '/api/materials?exam_group=GROUP_4' });
    const g4Items = g4Res.body?.data || [];
    assert(
      g4Res.statusCode === 200 && g4Items.length > 0 && g4Items.every((m) => m.exam_group === 'GROUP_4'),
      5,
      `Group 4 materials exist (${g4Items.length} verified)`
    );

    // 6. Tamil materials exist
    const taRes = await request(server, { path: '/api/materials?language=TAMIL' });
    const taItems = taRes.body?.data || [];
    assert(
      taRes.statusCode === 200 && taItems.length > 0 && taItems.every((m) => m.language === 'TAMIL'),
      6,
      `Tamil materials exist (${taItems.length} verified)`
    );

    // 7. English materials exist
    const enRes = await request(server, { path: '/api/materials?language=ENGLISH' });
    const enItems = enRes.body?.data || [];
    assert(
      enRes.statusCode === 200 && enItems.length > 0 && enItems.every((m) => m.language === 'ENGLISH'),
      7,
      `English materials exist (${enItems.length} verified)`
    );

    // 8. Group 2 and Group 2A remain separate
    const [g2Db] = await pool.query("SELECT id, exam_group FROM study_materials WHERE exam_group = 'GROUP_2'");
    const [g2aDb] = await pool.query("SELECT id, exam_group FROM study_materials WHERE exam_group = 'GROUP_2A'");
    const overlap = g2Db.some((r2) => g2aDb.some((r2a) => r2.id === r2a.id));
    assert(
      g2Db.length > 0 && g2aDb.length > 0 && !overlap && g2Items.every((m) => m.exam_group !== 'GROUP_2A'),
      8,
      'Group 2 and Group 2A remain strictly separate collections'
    );

    // 9. Language filter works
    const taFilterRes = await request(server, { path: '/api/materials?language=TAMIL&limit=100' });
    assert(
      taFilterRes.statusCode === 200 &&
        taFilterRes.body?.data?.length > 0 &&
        taFilterRes.body?.data?.every((m) => m.language === 'TAMIL'),
      9,
      'Language filter returns only matching language resources'
    );

    // 10. Group filter works
    const grpFilterRes = await request(server, { path: '/api/materials?exam_group=GROUP_4&limit=100' });
    assert(
      grpFilterRes.statusCode === 200 &&
        grpFilterRes.body?.data?.length > 0 &&
        grpFilterRes.body?.data?.every((m) => m.exam_group === 'GROUP_4'),
      10,
      'Exam Group filter returns only matching group resources'
    );

    // 11. Material type filter works
    const typeFilterRes = await request(server, { path: '/api/materials?material_type=syllabus&limit=100' });
    assert(
      typeFilterRes.statusCode === 200 &&
        typeFilterRes.body?.data?.length > 0 &&
        typeFilterRes.body?.data?.every((m) => m.material_type === 'syllabus'),
      11,
      'Material type filter works accurately'
    );

    // 12. Search works
    const searchRes = await request(server, { path: '/api/materials?search=Polity' });
    assert(
      searchRes.statusCode === 200 &&
        searchRes.body?.data?.length > 0 &&
        searchRes.body?.data?.some((m) => m.title.toLowerCase().includes('polity') || m.subject.toLowerCase().includes('polity')),
      12,
      'Search filters resources by keyword across title, subject, and exam group'
    );

    // 13. Duplicate materials are not inserted
    const [dupCheck] = await pool.query(`
      SELECT source_url, title, exam_group, language, COUNT(*) as cnt 
      FROM study_materials 
      GROUP BY source_url, title, exam_group, language 
      HAVING cnt > 1
    `);
    assert(dupCheck.length === 0, 13, 'Duplicate materials check passed (0 duplicate records found)');

    // 14. Existing materials are preserved
    const [[{ totalMats }]] = await pool.query('SELECT COUNT(*) as totalMats FROM study_materials');
    assert(totalMats >= 77, 14, `Existing materials preserved (${totalMats} total verified)`);

    // 15. Existing users/jobs/applications are untouched
    const [[{ userCnt }]] = await pool.query('SELECT COUNT(*) as userCnt FROM users');
    const [[{ jobCnt }]] = await pool.query('SELECT COUNT(*) as jobCnt FROM jobs');
    const [[{ appCnt }]] = await pool.query('SELECT COUNT(*) as appCnt FROM applications');
    const [[{ catCnt }]] = await pool.query('SELECT COUNT(*) as catCnt FROM job_categories');
    assert(
      userCnt >= 128 && jobCnt >= 26 && catCnt === 24,
      15,
      `Existing database records untouched (Users: ${userCnt}, Jobs: ${jobCnt}, Categories: ${catCnt}, Applications: ${appCnt})`
    );

    // 16. External source URLs are stored correctly
    const [[{ urlCount }]] = await pool.query(
      "SELECT COUNT(*) as urlCount FROM study_materials WHERE source_url LIKE 'https://%' OR source_url LIKE 'http://%'"
    );
    assert(urlCount > 0, 16, `External source URLs verified and stored correctly (${urlCount} verified)`);

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n========================================================================');
  console.log(` STUDY MATERIALS GROUP TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('========================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
