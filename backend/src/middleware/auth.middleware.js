import { verifyToken } from '../utils/token.utils.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * Middleware: Verify Bearer JWT Token
 * Protects routes requiring valid citizen/admin authentication.
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return sendError(res, 'Authentication required. No token provided.', 401);
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return sendError(res, 'Invalid authorization format. Format must be: Bearer <token>', 401);
  }

  const token = parts[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Authentication token has expired. Please sign in again.', 401);
    }
    return sendError(res, 'Invalid authentication token.', 401);
  }
};

/**
 * Middleware Factory: Enforce Role-Based Access Control
 * e.g., requireRole('admin') or requireRole('admin', 'candidate')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        'Access denied: You do not possess the required permissions to access this administrative resource.',
        403
      );
    }

    return next();
  };
};

/**
 * Optional Middleware: Extracts token if present without rejecting unauthenticated calls
 */
export const optionalAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    try {
      const decoded = verifyToken(parts[1]);
      req.user = decoded;
    } catch {
      // Ignore token failure for optional authentication
    }
  }
  next();
};
