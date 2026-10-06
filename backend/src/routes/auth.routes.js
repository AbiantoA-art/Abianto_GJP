import { Router } from 'express';
import AuthController from '../controllers/auth.controller.js';
import { validateRegister, validateLogin } from '../middleware/authValidator.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

import { authRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// Public Authentication Endpoints (Guarded with rate limiting)
router.post('/register', authRateLimiter, validateRegister, AuthController.register);
router.post('/login', authRateLimiter, validateLogin, AuthController.login);

// Protected Identity Verification Endpoint
router.get('/me', authenticateToken, AuthController.getMe);

export default router;
