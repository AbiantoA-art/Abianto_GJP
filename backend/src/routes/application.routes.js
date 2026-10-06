import { Router } from 'express';
import ApplicationController from '../controllers/application.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { uploadApplicationDocuments } from '../middleware/upload.middleware.js';
import { validateCreateApplication } from '../middleware/applicationValidator.middleware.js';
import { fileRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// All candidate application routes require valid citizen authentication
router.use(authenticateToken);

// 1. Submit Application
router.post(
  '/',
  uploadApplicationDocuments,
  validateCreateApplication,
  ApplicationController.submitApplication
);

// 2. Check if candidate already applied for a specific job
router.get('/check/:jobId', ApplicationController.checkApplied);

// 3. List candidate's own submitted applications
router.get('/', ApplicationController.getMyApplications);

// 4. Download / stream single document file
router.get('/documents/:docId/download', fileRateLimiter, ApplicationController.downloadDocument);

// 5. Get details of a single application owned by candidate
router.get('/:id', ApplicationController.getApplicationById);

// 6. Get documents metadata list for an application
router.get('/:id/documents', ApplicationController.getApplicationDocuments);

// 7. Get printable / downloadable application summary
router.get('/:id/download', fileRateLimiter, ApplicationController.downloadSummary);

// 8. Withdraw an eligible application
router.patch('/:id/withdraw', ApplicationController.withdrawApplication);

export default router;
