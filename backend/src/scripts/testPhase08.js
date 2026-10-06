import { runPhase08Verification } from '../../tests/testPhase08.js';

runPhase08Verification()
  .then(({ failedCount }) => {
    process.exit(failedCount > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error('Execution failure:', err);
    process.exit(1);
  });
