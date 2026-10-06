import app from './src/app.js';
import { env } from './src/config/env.config.js';
import { testDbConnection } from './src/config/db.config.js';
import { logger } from './src/utils/logger.js';

const PORT = env.port;

const startServer = async () => {
  try {
    const server = app.listen(PORT, async () => {
      logger.info(`===================================================`);
      logger.info(`  GOVERNMENT JOB PORTAL - BACKEND SERVER           `);
      logger.info(`  Phase: 06 (Candidate Discovery, Search & Filters) `);
      logger.info(`  Environment: ${env.nodeEnv}                      `);
      logger.info(`  Listening on: http://localhost:${PORT}           `);
      logger.info(`  Health Endpoint: http://localhost:${PORT}/api/health`);
      logger.info(`===================================================`);

      // Check database connection foundation status
      await testDbConnection();
    });

    // Graceful shutdown handling
    const shutdown = (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Global unhandled error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

startServer();
