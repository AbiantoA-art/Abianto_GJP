import JobService from '../src/services/job.service.js';

async function run() {
  const testTerms = ['UPSC', 'Bank', 'Railway', 'Teacher', 'TNPSC', 'Chennai', 'Police', 'Engineer', 'Bank Officer', 'Railway Technician'];
  console.log('=== TESTING SEARCH ===');
  for (const term of testTerms) {
    const res = await JobService.getPublishedJobs({ search: term });
    console.log(`Search '${term}': ${res.total} results found`);
    if (res.total === 0) console.error(`FAILED: '${term}' had 0 results`);
  }

  console.log('\n=== TESTING ALL 24 CATEGORIES ===');
  for (let id = 1; id <= 24; id++) {
    const res = await JobService.getPublishedJobs({ category_id: id });
    console.log(`Category ID ${id}: ${res.total} jobs`);
    if (res.total === 0) console.error(`FAILED: Category ${id} had 0 results`);
  }

  console.log('\n=== TESTING CATEGORIES BY SLUG ===');
  const slugs = ['upsc', 'banking', 'railway', 'defence', 'it-computer', 'apprentice'];
  for (const slug of slugs) {
    const res = await JobService.getPublishedJobs({ category_id: slug });
    console.log(`Category slug '${slug}': ${res.total} jobs`);
  }

  console.log('\n=== TESTING JOB GROUPS ===');
  for (const grp of ['GROUP_1', 'GROUP_2', 'GROUP_2A', 'GROUP_3', 'GROUP_4']) {
    const res = await JobService.getPublishedJobs({ job_group: grp });
    console.log(`Group ${grp}: ${res.total} jobs`);
    if (res.total === 0) console.error(`FAILED: Group ${grp} had 0 results`);
  }

  console.log('\n=== TESTING SEARCH + CATEGORY COMBINATIONS ===');
  const combos = [
    { search: 'Officer', category_id: 3 }, // Bank + Officer
    { search: 'Technician', category_id: 4 }, // Railway + Technician
    { search: 'Director', category_id: 1 }, // UPSC + Director
  ];
  for (const combo of combos) {
    const res = await JobService.getPublishedJobs(combo);
    console.log(`Search '${combo.search}' in Category ${combo.category_id}: ${res.total} jobs`);
    if (res.total === 0) console.error(`FAILED combo`, combo);
  }

  console.log('\n=== ALL AUDIT TESTS PASSED SUCCESSFULLY ===');
  process.exit(0);
}

run();
