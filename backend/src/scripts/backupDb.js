import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import pool from '../config/db.config.js';
import { env } from '../config/env.config.js';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Escape SQL value safely for dump output
 */
const escapeSqlValue = (val) => {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
  if (Buffer.isBuffer(val)) return `0x${val.toString('hex')}`;

  const str = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\0/g, '\\0');
  return `'${str}'`;
};

/**
 * Pure Node.js database dumper.
 * Generates standard SQL dump compatible with `mysql < backup.sql`.
 */
const dumpDatabaseViaNode = async (targetPath) => {
  const [tables] = await pool.query('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
  const tableNames = tables.map((t) => Object.values(t)[0]);

  let sqlContent = '';
  sqlContent += `-- ====================================================================\n`;
  sqlContent += `-- GOVERNMENT JOB PORTAL DATABASE BACKUP\n`;
  sqlContent += `-- Timestamp: ${new Date().toISOString()}\n`;
  sqlContent += `-- Database: ${env.db.database}\n`;
  sqlContent += `-- ====================================================================\n\n`;
  sqlContent += `SET FOREIGN_KEY_CHECKS = 0;\n`;
  sqlContent += `SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n`;
  sqlContent += `SET NAMES utf8mb4;\n\n`;

  for (const table of tableNames) {
    // 1. Get Create Table statement
    const [createResult] = await pool.query(`SHOW CREATE TABLE \`${table}\``);
    const createSql = createResult[0]['Create Table'];

    sqlContent += `--\n-- Table structure for table \`${table}\`\n--\n`;
    sqlContent += `DROP TABLE IF EXISTS \`${table}\`;\n`;
    sqlContent += `${createSql};\n\n`;

    // 2. Get Table Data
    const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
    if (rows.length > 0) {
      sqlContent += `--\n-- Dumping data for table \`${table}\` (${rows.length} rows)\n--\n`;
      const columns = Object.keys(rows[0]).map((col) => `\`${col}\``).join(', ');

      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const valueRows = batch.map(
          (row) => `(${Object.values(row).map(escapeSqlValue).join(', ')})`
        );
        sqlContent += `INSERT INTO \`${table}\` (${columns}) VALUES\n${valueRows.join(',\n')};\n`;
      }
      sqlContent += `\n`;
    }
  }

  sqlContent += `SET FOREIGN_KEY_CHECKS = 1;\n`;
  sqlContent += `-- End of dump\n`;

  fs.writeFileSync(targetPath, sqlContent, 'utf8');
};

/**
 * Non-destructive automated database backup utility.
 * Tries mysqldump first; falls back cleanly to built-in Node dumper.
 * NEVER overwrites existing backups; fails safely if errors occur.
 */
export const runDatabaseBackup = async (customFilename = null) => {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const backupDir = path.resolve(__dirname, '../../../backups');
  const filename = customFilename || `backup_${env.db.database}_${timestamp}.sql`;
  const targetPath = path.join(backupDir, filename);

  try {
    // 1. Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 2. Safeguard: Prevent overwriting
    if (fs.existsSync(targetPath)) {
      throw new Error(`Backup file already exists at ${targetPath}. Aborting to avoid overwrite.`);
    }

    logger.info(`Initiating database backup for database: [${env.db.database}]...`);
    logger.info(`Destination file: ${targetPath}`);

    // 3. Try mysqldump if available
    let usedMethod = 'mysqldump';
    const mysqldumpBin = process.env.MYSQLDUMP_PATH || 'mysqldump';
    const dumpCmd = `"${mysqldumpBin}" --host=${env.db.host} --port=${env.db.port} --user=${env.db.user} --single-transaction --quick --routines --triggers ${env.db.database}`;

    const envWithPassword = {
      ...process.env,
      MYSQL_PWD: env.db.password || '',
    };

    try {
      const { stdout } = await execAsync(dumpCmd, {
        env: envWithPassword,
        maxBuffer: 100 * 1024 * 1024,
      });
      fs.writeFileSync(targetPath, stdout, 'utf8');
    } catch (_cliErr) {
      // CLI mysqldump not in PATH - gracefully use Node.js dumper
      logger.info('mysqldump binary not detected in PATH; utilizing high-speed native Node.js SQL dumper...');
      usedMethod = 'native-node';
      await dumpDatabaseViaNode(targetPath);
    }

    const stats = fs.statSync(targetPath);
    logger.info(`========================================================================`);
    logger.info(`DATABASE BACKUP SUCCESSFUL (Engine: ${usedMethod})`);
    logger.info(`File: ${filename}`);
    logger.info(`Size: ${(stats.size / 1024).toFixed(2)} KB`);
    logger.info(`Path: ${targetPath}`);
    logger.info(`========================================================================`);

    return {
      success: true,
      filename,
      filePath: targetPath,
      sizeBytes: stats.size,
      method: usedMethod,
    };
  } catch (error) {
    logger.error(`Database backup failed: ${error.message}`);
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).size === 0) {
      fs.unlinkSync(targetPath);
    }
    return {
      success: false,
      error: error.message,
    };
  }
};

// If run directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runDatabaseBackup().then((res) => {
    if (!res.success) {
      process.exit(1);
    }
    process.exit(0);
  });
}

export default runDatabaseBackup;
