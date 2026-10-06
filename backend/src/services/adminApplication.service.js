import ApplicationModel from '../models/application.model.js';
import ApplicationDocumentModel from '../models/applicationDocument.model.js';
import { isValidStatusTransition } from '../middleware/applicationValidator.middleware.js';
import NotificationService from './notification.service.js';

/**
 * Administrative Application Management Service
 */
export class AdminApplicationService {
  /**
   * Paginated list of applications with search and filters
   */
  static async listApplications(options = {}) {
    return await ApplicationModel.findAllAdmin(options);
  }

  /**
   * Aggregate application statistics for admin dashboard
   */
  static async getStats() {
    return await ApplicationModel.getStats();
  }

  /**
   * Retrieve full application details including candidate and documents
   */
  static async getApplicationById(idOrAppId) {
    let application = null;
    if (/^\d+$/.test(String(idOrAppId).trim())) {
      application = await ApplicationModel.findById(parseInt(idOrAppId, 10));
    } else {
      application = await ApplicationModel.findByApplicationId(String(idOrAppId).trim());
    }

    if (!application) {
      const err = new Error('Application not found.');
      err.statusCode = 404;
      throw err;
    }

    const documents = await ApplicationDocumentModel.findByApplicationId(application.id);

    return {
      ...application,
      documents,
    };
  }

  /**
   * Admin status update with lifecycle transition validation
   */
  static async updateStatus(id, newStatus) {
    const application = await ApplicationModel.findById(id);
    if (!application) {
      const err = new Error('Application not found.');
      err.statusCode = 404;
      throw err;
    }

    const currentStatus = application.status;

    if (!isValidStatusTransition(currentStatus, newStatus)) {
      const err = new Error(
        `Invalid status transition: Cannot transition application from '${currentStatus}' to '${newStatus}'.`
      );
      err.statusCode = 422;
      throw err;
    }

    await ApplicationModel.updateStatus(id, newStatus);

    const updated = await ApplicationModel.findById(id);

    // Dispatch status change notification asynchronously
    NotificationService.notifyApplicationStatus(
      updated.candidate_id,
      updated,
      { id: updated.job_id, title: updated.job_title, organization: updated.organization },
      newStatus
    ).catch((err) => console.error('Application status notification dispatch error:', err.message));

    return updated;
  }
}

export default AdminApplicationService;
