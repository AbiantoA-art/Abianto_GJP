import JobModel from '../models/job.model.js';

/**
 * Government Job Business Logic Service
 */
export class JobService {
  /**
   * Fetch paginated list of published government jobs with search and filters
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  static async getPublishedJobs(options = {}) {
    return await JobModel.findPublished(options);
  }

  /**
   * Fetch single published job details by ID
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  static async getPublishedJobById(id) {
    return await JobModel.findPublishedById(id);
  }
}

export default JobService;
