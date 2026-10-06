import JobModel from '../models/job.model.js';
import JobCategoryModel from '../models/jobCategory.model.js';
import NotificationService from './notification.service.js';

/**
 * Valid Job Status Transitions State Machine
 */
const VALID_STATUS_TRANSITIONS = {
  draft: ['draft', 'published', 'archived'],
  published: ['published', 'draft', 'closed', 'expired', 'archived'],
  closed: ['closed', 'published', 'archived'],
  expired: ['expired', 'archived'],
  archived: ['archived'], // Terminal archive state; cannot directly return to published
};

export class AdminJobService {
  /**
   * Retrieve paginated jobs for administrative console
   * @param {Object} options
   */
  static async getJobs({ page = 1, limit = 10, status = '', search = '', category_id = null, job_group = null }) {
    return await JobModel.findAllAdmin({ page, limit, status, search, category_id, job_group });
  }

  /**
   * Retrieve aggregate job statistics by lifecycle status
   */
  static async getJobStats() {
    return await JobModel.getStatistics();
  }

  /**
   * Retrieve single job by ID regardless of status
   * @param {number|string} id
   */
  static async getJobById(id) {
    return await JobModel.findAdminById(id);
  }

  /**
   * Create a new government job vacancy
   * @param {Object} jobData
   * @param {number} adminUserId
   */
  static async createJob(jobData, adminUserId) {
    const {
      job_code,
      title,
      organization,
      department,
      category_id,
      job_group,
      description,
      vacancies,
      qualification,
      age_limit,
      salary,
      location,
      experience,
      application_fee,
      opening_date,
      last_date,
      selection_process,
      required_documents,
      notification_url,
      apply_url,
      status = 'draft',
    } = jobData;

    // 1. Verify category exists in database
    const category = await JobCategoryModel.findById(category_id);
    if (!category) {
      const error = new Error(`Job category with ID ${category_id} does not exist.`);
      error.statusCode = 400;
      throw error;
    }

    // 2. Verify uniqueness of job_code (HTTP 409 Conflict)
    const existingJob = await JobModel.findByJobCode(job_code.trim());
    if (existingJob) {
      const error = new Error(`Job code '${job_code.trim()}' is already in use. Job codes must be unique.`);
      error.statusCode = 409;
      throw error;
    }

    // 3. Create job with authenticated admin ID as creator
    const createdSummary = await JobModel.create({
      job_code: job_code.trim(),
      title: title.trim(),
      organization: organization.trim(),
      department: department ? department.trim() : null,
      category_id: parseInt(category_id, 10),
      job_group: job_group ? job_group.trim() : null,
      description: description ? description.trim() : null,
      vacancies: parseInt(vacancies, 10) || 0,
      qualification: qualification ? qualification.trim() : null,
      age_limit: age_limit ? age_limit.trim() : null,
      salary: salary ? salary.trim() : null,
      location: location ? location.trim() : null,
      experience: experience ? experience.trim() : null,
      application_fee: application_fee ? application_fee.trim() : null,
      opening_date: opening_date || null,
      last_date: last_date || null,
      selection_process: selection_process ? selection_process.trim() : null,
      required_documents: required_documents ? required_documents.trim() : null,
      notification_url: notification_url ? notification_url.trim() : null,
      apply_url: apply_url ? apply_url.trim() : null,
      status: status || 'draft',
      created_by: adminUserId,
    });

    // Return the full newly created job object
    const createdJob = await JobModel.findAdminById(createdSummary.id);
    if (createdJob && createdJob.status === 'published') {
      NotificationService.notifyNewJob(createdJob).catch((err) =>
        console.error('New job notification dispatch error:', err.message)
      );
    }
    return createdJob;
  }

  /**
   * Update an existing government job
   * @param {number|string} id
   * @param {Object} updateData
   */
  static async updateJob(id, updateData) {
    const existingJob = await JobModel.findAdminById(id);
    if (!existingJob) {
      const error = new Error('Job not found.');
      error.statusCode = 404;
      throw error;
    }

    const {
      job_code,
      title,
      organization,
      department,
      category_id,
      job_group,
      description,
      vacancies,
      qualification,
      age_limit,
      salary,
      location,
      experience,
      application_fee,
      opening_date,
      last_date,
      selection_process,
      required_documents,
      notification_url,
      apply_url,
      status,
    } = updateData;

    // 1. Verify category if provided
    const targetCategoryId = category_id !== undefined ? category_id : existingJob.category_id;
    const category = await JobCategoryModel.findById(targetCategoryId);
    if (!category) {
      const error = new Error(`Job category with ID ${targetCategoryId} does not exist.`);
      error.statusCode = 400;
      throw error;
    }

    // 2. Verify job_code uniqueness if changed
    const targetJobCode = job_code !== undefined ? job_code.trim() : existingJob.job_code;
    if (targetJobCode.toLowerCase() !== existingJob.job_code.toLowerCase()) {
      const duplicateJob = await JobModel.findByJobCode(targetJobCode);
      if (duplicateJob && duplicateJob.id !== existingJob.id) {
        const error = new Error(`Job code '${targetJobCode}' is already in use by another job.`);
        error.statusCode = 409;
        throw error;
      }
    }

    // 3. Verify status transition if status is being updated
    const targetStatus = status !== undefined ? status.toLowerCase() : existingJob.status;
    if (targetStatus !== existingJob.status) {
      const allowed = VALID_STATUS_TRANSITIONS[existingJob.status] || [];
      if (!allowed.includes(targetStatus)) {
        const error = new Error(
          `Invalid status transition from '${existingJob.status}' to '${targetStatus}'.`
        );
        error.statusCode = 400;
        throw error;
      }
    }

    const targetJobGroup = job_group !== undefined ? (job_group ? job_group.trim() : null) : existingJob.job_group;

    // 4. Perform update (preserves id, created_by, created_at)
    await JobModel.update(id, {
      job_code: targetJobCode,
      title: title !== undefined ? title.trim() : existingJob.title,
      organization: organization !== undefined ? organization.trim() : existingJob.organization,
      department: department !== undefined ? (department ? department.trim() : null) : existingJob.department,
      category_id: parseInt(targetCategoryId, 10),
      job_group: targetJobGroup,
      description: description !== undefined ? (description ? description.trim() : null) : existingJob.description,
      vacancies: vacancies !== undefined ? parseInt(vacancies, 10) : existingJob.vacancies,
      qualification: qualification !== undefined ? (qualification ? qualification.trim() : null) : existingJob.qualification,
      age_limit: age_limit !== undefined ? (age_limit ? age_limit.trim() : null) : existingJob.age_limit,
      salary: salary !== undefined ? (salary ? salary.trim() : null) : existingJob.salary,
      location: location !== undefined ? (location ? location.trim() : null) : existingJob.location,
      experience: experience !== undefined ? (experience ? experience.trim() : null) : existingJob.experience,
      application_fee: application_fee !== undefined ? (application_fee ? application_fee.trim() : null) : existingJob.application_fee,
      opening_date: opening_date !== undefined ? opening_date : existingJob.opening_date,
      last_date: last_date !== undefined ? last_date : existingJob.last_date,
      selection_process: selection_process !== undefined ? (selection_process ? selection_process.trim() : null) : existingJob.selection_process,
      required_documents: required_documents !== undefined ? (required_documents ? required_documents.trim() : null) : existingJob.required_documents,
      notification_url: notification_url !== undefined ? (notification_url ? notification_url.trim() : null) : existingJob.notification_url,
      apply_url: apply_url !== undefined ? (apply_url ? apply_url.trim() : null) : existingJob.apply_url,
      status: targetStatus,
    });

    const updatedJob = await JobModel.findAdminById(id);
    if (updatedJob && updatedJob.status === 'published' && existingJob.status !== 'published') {
      NotificationService.notifyNewJob(updatedJob).catch((err) =>
        console.error('New job notification dispatch error:', err.message)
      );
    }
    return updatedJob;
  }

  /**
   * Update only job status with state machine transition validation
   * @param {number|string} id
   * @param {string} newStatus
   */
  static async updateJobStatus(id, newStatus) {
    const existingJob = await JobModel.findAdminById(id);
    if (!existingJob) {
      const error = new Error('Job not found.');
      error.statusCode = 404;
      throw error;
    }

    const currentStatus = existingJob.status;
    const normalizedNewStatus = String(newStatus || '').toLowerCase();

    // Check transition rules
    const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(normalizedNewStatus)) {
      const error = new Error(
        `Invalid status transition from '${currentStatus}' to '${normalizedNewStatus}'.`
      );
      error.statusCode = 400;
      throw error;
    }

    await JobModel.updateStatus(id, normalizedNewStatus);
    const updatedJob = await JobModel.findAdminById(id);
    if (normalizedNewStatus === 'published' && currentStatus !== 'published') {
      NotificationService.notifyNewJob(updatedJob).catch((err) =>
        console.error('New job notification dispatch error:', err.message)
      );
    }
    return updatedJob;
  }

  /**
   * Non-destructively archive a job (Safe Delete)
   * Updates status to 'archived' without deleting the database record.
   * @param {number|string} id
   */
  static async archiveJob(id) {
    const existingJob = await JobModel.findAdminById(id);
    if (!existingJob) {
      const error = new Error('Job not found.');
      error.statusCode = 404;
      throw error;
    }

    await JobModel.archive(id);
    return await JobModel.findAdminById(id);
  }
}

export default AdminJobService;
