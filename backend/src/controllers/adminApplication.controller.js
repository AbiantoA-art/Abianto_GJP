import AdminApplicationService from '../services/adminApplication.service.js';
import ApplicationService from '../services/application.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Administrative Application Management Controller
 */
export class AdminApplicationController {
  /**
   * Get all applications with search, filters, pagination
   * GET /api/admin/applications
   */
  static async getApplications(req, res, next) {
    try {
      const {
        page,
        limit,
        search,
        status,
        job_id,
        candidate_id,
        date_from,
        date_to,
      } = req.query;

      const result = await AdminApplicationService.listApplications({
        page,
        limit,
        search,
        status,
        job_id,
        candidate_id,
        date_from,
        date_to,
      });

      return sendSuccess(
        res,
        'Applications retrieved successfully',
        result.applications,
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
   * Get application statistics
   * GET /api/admin/applications/stats
   */
  static async getStats(req, res, next) {
    try {
      const stats = await AdminApplicationService.getStats();
      return sendSuccess(res, 'Application statistics retrieved successfully', stats, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get complete application details
   * GET /api/admin/applications/:id
   */
  static async getApplicationById(req, res, next) {
    try {
      const { id } = req.params;
      const application = await AdminApplicationService.getApplicationById(id);
      return sendSuccess(res, 'Application details retrieved successfully', application, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get documents for an application
   * GET /api/admin/applications/:id/documents
   */
  static async getApplicationDocuments(req, res, next) {
    try {
      const { id } = req.params;
      const application = await AdminApplicationService.getApplicationById(id);
      return sendSuccess(res, 'Application documents retrieved successfully', application.documents, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download uploaded document securely
   * GET /api/admin/applications/documents/:docId/download
   */
  static async downloadDocument(req, res, next) {
    try {
      const { docId } = req.params;
      const doc = await ApplicationService.getDocumentFile(docId, req.user);
      return res.download(doc.filePath, doc.originalFilename);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update application status
   * PATCH /api/admin/applications/:id/status
   */
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await AdminApplicationService.updateStatus(id, status);
      return sendSuccess(res, 'Application status updated successfully', updated, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default AdminApplicationController;
