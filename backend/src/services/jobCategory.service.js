import JobCategoryModel from '../models/jobCategory.model.js';

/**
 * Job Category Business Logic Service
 */
export class JobCategoryService {
  /**
   * Fetch all active job categories
   * @returns {Promise<Array>}
   */
  static async getActiveCategories() {
    return await JobCategoryModel.getAllActive();
  }

  /**
   * Fetch category by ID
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  static async getCategoryById(id) {
    return await JobCategoryModel.findById(id);
  }

  /**
   * Fetch category by slug
   * @param {string} slug
   * @returns {Promise<Object|null>}
   */
  static async getCategoryBySlug(slug) {
    return await JobCategoryModel.findBySlug(slug);
  }
}

export default JobCategoryService;
