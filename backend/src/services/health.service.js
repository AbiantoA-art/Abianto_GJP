import { testDbConnection } from '../config/db.config.js';
import { env } from '../config/env.config.js';

/**
 * Health Service
 * Provides status, system diagnostics, and database health metrics.
 * Safe for production: does not leak credentials or internal paths.
 */
export const checkHealth = async () => {
  const dbStatus = await testDbConnection(false);

  return {
    portal: 'Government Job Portal API',
    phase: 'Phase 10 - Production Ready',
    status: dbStatus.isConnected ? 'online' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
    database: {
      type: 'MySQL',
      configured: Boolean(env.db.host && env.db.database),
      connected: dbStatus.isConnected,
      details: dbStatus.isConnected ? 'Database connection established' : 'Database unreachable',
    },
    version: '1.0.0',
  };
};

export default { checkHealth };
