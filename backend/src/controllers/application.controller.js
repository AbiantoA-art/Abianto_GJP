import ApplicationService from '../services/application.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * Candidate Application Controller
 */
export class ApplicationController {
  /**
   * Submit a new job application
   * POST /api/applications
   */
  static async submitApplication(req, res, next) {
    try {
      const result = await ApplicationService.submitApplication({
        candidateId: req.user.id,
        userRole: req.user.role,
        applicationData: req.body,
        files: req.files,
      });

      return sendSuccess(res, 'Application submitted successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if candidate already applied for a job
   * GET /api/applications/check/:jobId
   */
  static async checkApplied(req, res, next) {
    try {
      const { jobId } = req.params;
      const status = await ApplicationService.checkAlreadyApplied(jobId, req.user.id);
      return sendSuccess(res, 'Application status checked', status, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all applications submitted by candidate
   * GET /api/applications
   */
  static async getMyApplications(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const result = await ApplicationService.getCandidateApplications(req.user.id, {
        page,
        limit,
        status,
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
   * Get single application details
   * GET /api/applications/:id
   */
  static async getApplicationById(req, res, next) {
    try {
      const { id } = req.params;
      const application = await ApplicationService.getCandidateApplicationById(id, req.user.id);
      return sendSuccess(res, 'Application details retrieved successfully', application, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get documents for an application
   * GET /api/applications/:id/documents
   */
  static async getApplicationDocuments(req, res, next) {
    try {
      const { id } = req.params;
      const documents = await ApplicationService.getApplicationDocuments(id, req.user.id);
      return sendSuccess(res, 'Application documents retrieved successfully', documents, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download / stream application summary
   * GET /api/applications/:id/download
   */
  static async downloadSummary(req, res, next) {
    try {
      const { id } = req.params;
      const application = await ApplicationService.getCandidateApplicationById(id, req.user.id);
      return sendSuccess(res, 'Application summary retrieved for download', application, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download document file
   * GET /api/applications/documents/:docId/download
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
   * Withdraw an application
   * PATCH /api/applications/:id/withdraw
   */
  static async withdrawApplication(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await ApplicationService.withdrawApplication(id, req.user.id);
      return sendSuccess(res, 'Application has been withdrawn successfully', updated, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default ApplicationController;
