import AdminJobService from '../services/adminJob.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export class AdminJobController {
  /**
   * Retrieve paginated jobs for administrative console
   * GET /api/admin/jobs?page=1&limit=10
   */
  static async getJobs(req, res, next) {
    try {
      const { page, limit, status, search, category_id, job_group } = req.query;

      const result = await AdminJobService.getJobs({
        page,
        limit,
        status,
        search,
        category_id,
        job_group,
      });

      return sendSuccess(
        res,
        'Admin jobs retrieved successfully',
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
   * Retrieve aggregate job counts by lifecycle status
   * GET /api/admin/jobs/stats
   */
  static async getJobStats(req, res, next) {
    try {
      const stats = await AdminJobService.getJobStats();
      return sendSuccess(res, 'Job statistics retrieved successfully', stats, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve single job by ID (any status)
   * GET /api/admin/jobs/:id
   */
  static async getJobById(req, res, next) {
    try {
      const id = req.params.id;
      const job = await AdminJobService.getJobById(id);

      if (!job) {
        return sendError(res, 'Job not found', 404);
      }

      return sendSuccess(res, 'Job retrieved successfully', job, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new government job vacancy
   * POST /api/admin/jobs
   */
  static async createJob(req, res, next) {
    try {
      const adminUserId = req.user.id;
      const newJob = await AdminJobService.createJob(req.body, adminUserId);
      return sendSuccess(res, 'Job created successfully', newJob, 201);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Update an existing government job vacancy
   * PUT /api/admin/jobs/:id
   */
  static async updateJob(req, res, next) {
    try {
      const id = req.params.id;
      const updatedJob = await AdminJobService.updateJob(id, req.body);
      return sendSuccess(res, 'Job updated successfully', updatedJob, 200);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Update only the job status
   * PATCH /api/admin/jobs/:id/status
   */
  static async updateJobStatus(req, res, next) {
    try {
      const id = req.params.id;
      const { status } = req.body;
      const updatedJob = await AdminJobService.updateJobStatus(id, status);
      return sendSuccess(res, 'Job status updated successfully', updatedJob, 200);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Safely archive a job (non-destructive delete)
   * DELETE /api/admin/jobs/:id
   */
  static async archiveJob(req, res, next) {
    try {
      const id = req.params.id;
      const archivedJob = await AdminJobService.archiveJob(id);
      return sendSuccess(
        res,
        'Job archived successfully. Record preserved in archive status.',
        archivedJob,
        200
      );
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }
}

export default AdminJobController;
