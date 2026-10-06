import { sendError } from '../utils/apiResponse.js';

/**
 * In-memory sliding window rate limiter implementation.
 * Zero external dependencies, self-cleaning, and production-ready.
 */
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000, // 15 minutes default
  max = 100, // Max requests per window
  message = 'Too many requests. Please try again later.',
  keyGenerator = (req) => req.ip || req.connection.remoteAddress || 'unknown_ip',
  skip = (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
} = {}) => {
  const store = new Map();

  // Periodic cleanup of stale entries every 5 minutes to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, Math.min(windowMs, 5 * 60 * 1000));

  // Ensure interval does not prevent Node process termination
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();
    let record = store.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    // Standard RFC rate limiting headers
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return sendError(res, message, 429);
    }

    next();
  };
};

// General API rate limiter (100 requests per 15 minutes)
export const apiRateLimiter = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: 'Too many requests to the Government Job Portal API. Please wait a few minutes before retrying.',
});

// Authentication rate limiter for login and registration (20 requests per 15 minutes)
export const authRateLimiter = createRateLimiter({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS || '20', 10),
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const email = req.body && req.body.email ? String(req.body.email).toLowerCase().trim() : '';
    return `${ip}:${email}`;
  },
});

// Sensitive file operations rate limiter (50 operations per 15 minutes)
export const fileRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Document request rate limit exceeded. Please try again shortly.',
});

export default {
  createRateLimiter,
  apiRateLimiter,
  authRateLimiter,
  fileRateLimiter,
};
