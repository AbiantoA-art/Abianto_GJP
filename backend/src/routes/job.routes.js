import { Router } from 'express';
import JobController from '../controllers/job.controller.js';
import { validateJobsQuery, validateJobId } from '../middleware/jobValidator.middleware.js';

const router = Router();

/**
 * @route   GET /api/jobs
 * @desc    Get published government jobs with pagination
 * @access  Public
 */
router.get('/', validateJobsQuery, JobController.getJobs);

/**
 * @route   GET /api/jobs/:id
 * @desc    Get single published government job by ID
 * @access  Public
 */
router.get('/:id', validateJobId, JobController.getJobById);

export default router;
