import crypto from 'crypto';
import pool from '../config/db.config.js';
import ApplicationModel from '../models/application.model.js';
import ApplicationDocumentModel from '../models/applicationDocument.model.js';
import JobModel, { formatDate } from '../models/job.model.js';
import NotificationService from './notification.service.js';
import {
  storeApplicationFiles,
  cleanupUploadedFiles,
  resolveSafeUploadPath,
} from '../middleware/upload.middleware.js';
import fs from 'fs';

/**
 * Candidate Application Service
 * Orchestrates business logic, transaction safety, and document storage
 */
export class ApplicationService {
  /**
   * Submit a new government job application
   */
  static async submitApplication({ candidateId, userRole, applicationData, files }) {
    // 1. Role enforcement
    if (userRole !== 'candidate') {
      if (files) cleanupUploadedFiles(files);
      const err = new Error('Access denied: Only candidates may submit job applications.');
      err.statusCode = 403;
      throw err;
    }

    const jobId = parseInt(applicationData.job_id, 10);

    // 2. Validate Job exists
    const job = await JobModel.findById(jobId);
    if (!job) {
      if (files) cleanupUploadedFiles(files);
      const err = new Error('The specified government job does not exist.');
      err.statusCode = 404;
      throw err;
    }

    // 3. Validate Job status is published
    if (job.status !== 'published') {
      if (files) cleanupUploadedFiles(files);
      const err = new Error(
        `Cannot apply: This job is currently in '${job.status}' status and is not accepting applications.`
      );
      err.statusCode = 400;
      throw err;
    }

    // 4. Validate Category is active
    if (job.category_id) {
      const [catRows] = await pool.execute(
        'SELECT id, status FROM job_categories WHERE id = ?',
        [job.category_id]
      );
      if (!catRows.length || catRows[0].status !== 'active') {
        if (files) cleanupUploadedFiles(files);
        const err = new Error('Applications for this job category are currently disabled.');
        err.statusCode = 400;
        throw err;
      }
    }

    // 5. Validate Application Deadline (last_date)
    if (job.last_date) {
      const lastDateStr = formatDate(job.last_date);
      const todayStr = new Date().toISOString().split('T')[0];
      if (lastDateStr < todayStr) {
        if (files) cleanupUploadedFiles(files);
        const err = new Error('The application deadline for this job has expired.');
        err.statusCode = 400;
        throw err;
      }
    }

    // 6. Check for duplicate application
    const existing = await ApplicationModel.findByJobAndCandidate(jobId, candidateId);
    if (existing) {
      if (files) cleanupUploadedFiles(files);
      const err = new Error('You have already applied for this job.');
      err.statusCode = 409;
      throw err;
    }

    // 7. Generate Collision-Safe Deterministic Application ID: APP-2026-XXXXXXXX
    const currentYear = new Date().getFullYear();
    const hexSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    const applicationId = `APP-${currentYear}-${hexSuffix}`;

    // 8. Atomic Database Transaction
    const connection = await pool.getConnection();
    let storedPermanentPath = null;

    try {
      await connection.beginTransaction();

      const created = await ApplicationModel.create(
        {
          ...applicationData,
          application_id: applicationId,
          job_id: jobId,
          candidate_id: candidateId,
        },
        connection
      );

      // Store files permanently in backend/uploads/applications/{applicationId}/
      const storedDocs = await storeApplicationFiles(files, applicationId);
      storedPermanentPath = `applications/${applicationId}`;

      // Insert document records within the same transaction
      for (const doc of storedDocs) {
        await ApplicationDocumentModel.create(
          {
            ...doc,
            application_id: created.id,
          },
          connection
        );
      }

      await connection.commit();

      // Dispatch application submission notification asynchronously
      NotificationService.notifyApplicationSubmitted(
        candidateId,
        { id: created.id, application_id: applicationId },
        job
      ).catch((err) => console.error('Application notification dispatch error:', err.message));

      return {
        id: created.id,
        application_id: applicationId,
        job_id: jobId,
        status: 'submitted',
      };
    } catch (dbErr) {
      await connection.rollback();

      // Clean up permanent application files if stored
      if (storedPermanentPath) {
        cleanupUploadedFiles(storedPermanentPath);
      }
      // Clean up any remaining temp files
      if (files) {
        cleanupUploadedFiles(files);
      }

      if (dbErr.code === 'ER_DUP_ENTRY') {
        const err = new Error('You have already applied for this job.');
        err.statusCode = 409;
        throw err;
      }

      throw dbErr;
    } finally {
      connection.release();
    }
  }

  /**
   * Check if candidate has already applied to a job
   */
  static async checkAlreadyApplied(jobId, candidateId) {
    const existing = await ApplicationModel.findByJobAndCandidate(jobId, candidateId);
    return {
      applied: Boolean(existing),
      application_id: existing ? existing.application_id : null,
      id: existing ? existing.id : null,
      status: existing ? existing.status : null,
    };
  }

  /**
   * Get all applications submitted by candidate
   */
  static async getCandidateApplications(candidateId, options = {}) {
    return await ApplicationModel.findByCandidateId(candidateId, options);
  }

  /**
   * Get single application details owned by candidate
   */
  static async getCandidateApplicationById(idOrAppId, candidateId) {
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

    // Ownership check: must belong to the requesting candidate
    if (application.candidate_id !== candidateId) {
      const err = new Error('Access denied: You are not authorized to view this application.');
      err.statusCode = 403;
      throw err;
    }

    // Attach documents
    const documents = await ApplicationDocumentModel.findByApplicationId(application.id);

    return {
      ...application,
      documents,
    };
  }

  /**
   * Get documents for candidate's application
   */
  static async getApplicationDocuments(idOrAppId, candidateId) {
    const app = await this.getCandidateApplicationById(idOrAppId, candidateId);
    return app.documents || [];
  }

  /**
   * Candidate withdrawal of eligible application
   */
  static async withdrawApplication(idOrAppId, candidateId) {
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

    if (application.candidate_id !== candidateId) {
      const err = new Error('Access denied: You are not authorized to withdraw this application.');
      err.statusCode = 403;
      throw err;
    }

    // Allowed withdrawal statuses: only 'submitted' or 'under_review'
    if (!['submitted', 'under_review'].includes(application.status)) {
      const err = new Error(
        `Application cannot be withdrawn because it is currently in '${application.status}' status.`
      );
      err.statusCode = 400;
      throw err;
    }

    await ApplicationModel.withdraw(application.id, candidateId);

    const updated = await ApplicationModel.findById(application.id);
    return updated;
  }

  /**
   * Secure document download authorization check and file locator
   */
  static async getDocumentFile(documentId, user) {
    const doc = await ApplicationDocumentModel.findById(documentId);
    if (!doc) {
      const err = new Error('Document not found.');
      err.statusCode = 404;
      throw err;
    }

    // Authorization: User must be admin or the candidate who owns the application
    if (user.role !== 'admin' && doc.candidate_id !== user.id) {
      const err = new Error('Access denied: You are not authorized to download this document.');
      err.statusCode = 403;
      throw err;
    }

    const absolutePath = resolveSafeUploadPath(doc.file_path);
    if (!absolutePath || !fs.existsSync(absolutePath)) {
      const err = new Error('Document file could not be found on storage.');
      err.statusCode = 404;
      throw err;
    }

    return {
      filePath: absolutePath,
      originalFilename: doc.original_filename,
      mimeType: doc.mime_type,
      fileSize: doc.file_size,
    };
  }
}

export default ApplicationService;
