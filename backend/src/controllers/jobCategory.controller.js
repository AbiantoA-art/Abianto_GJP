import JobCategoryService from '../services/jobCategory.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Job Category Controller
 * Handles public category discovery endpoints
 */
export class JobCategoryController {
  /**
   * Retrieve all active government job categories
   * GET /api/categories
   */
  static async getCategories(req, res, next) {
    try {
      const categories = await JobCategoryService.getActiveCategories();
      return sendSuccess(res, 'Categories retrieved successfully', categories, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default JobCategoryController;
