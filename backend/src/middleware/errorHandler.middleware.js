import { logger } from '../utils/logger.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * Global Error Handler Middleware
 * Mask 500 error messages and suppress stack traces in production to prevent leaking sensitive internals.
 */
export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error details internally for troubleshooting
  logger.error(`[${req.method}] ${req.originalUrl} - Error: ${err.message}`, isProduction ? '' : err.stack);

  // In production, mask internal server error (500) messages to prevent leaking SQL or paths
  let safeMessage = err.message || 'Internal Server Error';
  if (isProduction && statusCode === 500) {
    safeMessage = 'An unexpected internal server error occurred. Please contact the administrator.';
  }

  // Never leak error stack details in production
  const errorDetails = isProduction ? null : { stack: err.stack };

  return sendError(res, safeMessage, statusCode, errorDetails);
};

export default errorHandler;
