import JobService from '../services/job.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * Government Job Controller
 * Handles public job listing and detail endpoints
 */
export class JobController {
  /**
   * Retrieve published jobs with search, filtering, sorting, and pagination
   * GET /api/jobs?page=1&limit=10&search=...&category_id=...&location=...
   */
  static async getJobs(req, res, next) {
    try {
      const {
        page,
        limit,
        location,
        organization,
        department,
        opening_date_from,
        opening_date_to,
        last_date_from,
        last_date_to,
        sort,
      } = req.query;

      const search = req.query.search || req.query.q || '';
      const category_id = req.query.category_id || req.query.category || req.query.cat || null;
      const job_group = req.query.job_group || null;

      const result = await JobService.getPublishedJobs({
        page,
        limit,
        search,
        category_id,
        job_group,
        location,
        organization,
        department,
        opening_date_from,
        opening_date_to,
        last_date_from,
        last_date_to,
        sort,
      });

      return sendSuccess(
        res,
        'Jobs retrieved successfully',
        result.jobs,
        200,
        {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve details of a single published government job by ID
   * GET /api/jobs/:id
   */
  static async getJobById(req, res, next) {
    try {
      const id = req.params.id;
      const job = await JobService.getPublishedJobById(id);

      if (!job) {
        return sendError(res, 'Job not found', 404);
      }

      return sendSuccess(res, 'Job retrieved successfully', job, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default JobController;
