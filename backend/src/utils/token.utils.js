import jwt from 'jsonwebtoken';
import { env } from '../config/env.config.js';

/**
 * Generate a signed JWT for an authenticated user.
 * Payload only contains non-sensitive identity & authorization fields.
 *
 * @param {Object} user - User record { id, role, email, full_name }
 * @returns {string} Signed JWT string
 */
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.full_name,
  };

  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
};

/**
 * Verify a given JWT token against the configured secret.
 *
 * @param {string} token - Bearer JWT string
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyToken = (token) => {
  return jwt.verify(token, env.jwt.secret);
};
