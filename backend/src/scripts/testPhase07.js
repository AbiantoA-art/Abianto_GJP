import { runPhase07Verification } from '../../tests/testPhase07.js';
import pool from '../config/db.config.js';

runPhase07Verification()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Unhandled Phase 07 verification error:', err);
    process.exit(1);
  });
