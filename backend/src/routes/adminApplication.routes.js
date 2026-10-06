import { Router } from 'express';
import AdminApplicationController from '../controllers/adminApplication.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import {
  validateAdminApplicationsQuery,
  validateUpdateStatus,
} from '../middleware/applicationValidator.middleware.js';

const router = Router();

// Enforce admin-only authentication across all application management routes
router.use(authenticateToken);
router.use(requireRole('admin'));

// 1. Get application statistics
router.get('/stats', AdminApplicationController.getStats);

// 2. Download application document file
router.get('/documents/:docId/download', AdminApplicationController.downloadDocument);

// 3. List paginated applications with search and filters
router.get('/', validateAdminApplicationsQuery, AdminApplicationController.getApplications);

// 4. Get full application details by ID or application_id
router.get('/:id', AdminApplicationController.getApplicationById);

// 5. Get documents for a specific application
router.get('/:id/documents', AdminApplicationController.getApplicationDocuments);

// 6. Update application status (shortlist, reject, under_review, select)
router.patch('/:id/status', validateUpdateStatus, AdminApplicationController.updateStatus);

export default router;
