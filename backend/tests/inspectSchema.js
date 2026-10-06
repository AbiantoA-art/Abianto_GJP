import pool from '../src/config/db.config.js';

async function inspect() {
  const [tables] = await pool.query('SHOW TABLES');
  console.log('Tables:', tables);
  for (const t of ['users', 'applications']) {
    try {
      const [cols] = await pool.query(`DESCRIBE ${t}`);
      console.log(`=== ${t} COLUMNS ===`, cols.map(c => `${c.Field} (${c.Type}, Null:${c.Null})`));
      const [count] = await pool.query(`SELECT COUNT(*) as cnt FROM ${t}`);
      console.log(`Count in ${t}:`, count[0].cnt);
    } catch(e) {
      console.log(`Error describing ${t}:`, e.message);
    }
  }
  process.exit(0);
}

inspect();
