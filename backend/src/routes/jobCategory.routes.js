import { Router } from 'express';
import JobCategoryController from '../controllers/jobCategory.controller.js';

const router = Router();

/**
 * @route   GET /api/categories
 * @desc    Get all active job categories
 * @access  Public
 */
router.get('/', JobCategoryController.getCategories);

export default router;
