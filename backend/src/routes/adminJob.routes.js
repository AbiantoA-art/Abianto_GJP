import { Router } from 'express';
import AdminJobController from '../controllers/adminJob.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import {
  validateAdminJobsQuery,
  validateAdminJobId,
  validateCreateJob,
  validateUpdateJob,
  validateStatusPatch,
} from '../middleware/adminJobValidator.middleware.js';

const router = Router();

// Enforce Admin Authentication & Role Boundary across all routes in this router
router.use(authenticateToken, requireRole('admin'));

/**
 * @route   GET /api/admin/jobs
 * @desc    Get paginated jobs for admin console with optional status/search filters
 * @access  Private (Admin Only)
 */
router.get('/', validateAdminJobsQuery, AdminJobController.getJobs);

/**
 * @route   GET /api/admin/jobs/stats
 * @desc    Get aggregate job counts by status (total, draft, published, closed, expired, archived)
 * @access  Private (Admin Only)
 */
router.get('/stats', AdminJobController.getJobStats);

/**
 * @route   GET /api/admin/jobs/:id
 * @desc    Get single job details regardless of status
 * @access  Private (Admin Only)
 */
router.get('/:id', validateAdminJobId, AdminJobController.getJobById);

/**
 * @route   POST /api/admin/jobs
 * @desc    Create a new government job vacancy
 * @access  Private (Admin Only)
 */
router.post('/', validateCreateJob, AdminJobController.createJob);

/**
 * @route   PUT /api/admin/jobs/:id
 * @desc    Update an existing government job
 * @access  Private (Admin Only)
 */
router.put('/:id', validateAdminJobId, validateUpdateJob, AdminJobController.updateJob);

/**
 * @route   PATCH /api/admin/jobs/:id/status
 * @desc    Update only the lifecycle status of a job
 * @access  Private (Admin Only)
 */
router.patch('/:id/status', validateAdminJobId, validateStatusPatch, AdminJobController.updateJobStatus);

/**
 * @route   DELETE /api/admin/jobs/:id
 * @desc    Safely archive a job (status = 'archived', non-destructive)
 * @access  Private (Admin Only)
 */
router.delete('/:id', validateAdminJobId, AdminJobController.archiveJob);

export default router;
