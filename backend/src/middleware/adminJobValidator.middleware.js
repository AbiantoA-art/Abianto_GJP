import { sendError } from '../utils/apiResponse.js';

const VALID_STATUSES = ['draft', 'published', 'closed', 'expired', 'archived'];
export const ALLOWED_JOB_GROUPS = ['GROUP_1', 'GROUP_2', 'GROUP_2A', 'GROUP_3', 'GROUP_4'];

/**
 * Validates query parameters for GET /api/admin/jobs
 */
export const validateAdminJobsQuery = (req, res, next) => {
  const { page, limit, status, job_group } = req.query;

  // Validate 'page'
  if (page !== undefined && page !== null && page !== '') {
    const rawPage = String(page).trim();
    if (!/^\d+$/.test(rawPage) || parseInt(rawPage, 10) < 1) {
      return sendError(
        res,
        'Invalid page parameter. Page must be a positive integer greater than or equal to 1.',
        400
      );
    }
    req.query.page = parseInt(rawPage, 10);
  } else {
    req.query.page = 1;
  }

  // Validate 'limit'
  if (limit !== undefined && limit !== null && limit !== '') {
    const rawLimit = String(limit).trim();
    if (!/^\d+$/.test(rawLimit) || parseInt(rawLimit, 10) < 1 || parseInt(rawLimit, 10) > 100) {
      return sendError(
        res,
        'Invalid limit parameter. Limit must be an integer between 1 and 100.',
        400
      );
    }
    req.query.limit = parseInt(rawLimit, 10);
  } else {
    req.query.limit = 10;
  }

  // Validate 'status' if provided
  if (status !== undefined && status !== null && status !== '') {
    const rawStatus = String(status).trim().toLowerCase();
    if (!VALID_STATUSES.includes(rawStatus)) {
      return sendError(
        res,
        `Invalid status filter. Status must be one of: ${VALID_STATUSES.join(', ')}`,
        400
      );
    }
    req.query.status = rawStatus;
  }

  // Validate 'job_group' if provided
  if (job_group !== undefined && job_group !== null && String(job_group).trim() !== '') {
    const rawGroup = String(job_group).trim().toUpperCase();
    if (rawGroup === 'ALL' || rawGroup === 'ALL_GROUPS') {
      delete req.query.job_group;
    } else if (!ALLOWED_JOB_GROUPS.includes(rawGroup)) {
      return sendError(
        res,
        `Invalid job_group filter. Allowed values are: ${ALLOWED_JOB_GROUPS.join(', ')}`,
        400
      );
    } else {
      req.query.job_group = rawGroup;
    }
  }

  next();
};

/**
 * Validates administrative job ID parameter
 */
export const validateAdminJobId = (req, res, next) => {
  const rawId = String(req.params.id || '').trim();

  if (!/^\d+$/.test(rawId) || parseInt(rawId, 10) <= 0) {
    return sendError(res, 'Job not found', 404);
  }

  req.params.id = parseInt(rawId, 10);
  next();
};

/**
 * Helper to validate URL format
 */
const isValidUrl = (string) => {
  if (!string) return true;
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Helper to validate date string format (YYYY-MM-DD or ISO)
 */
const isValidDateString = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
};

/**
 * Validates job creation request body (POST /api/admin/jobs)
 */
export const validateCreateJob = (req, res, next) => {
  const {
    job_code,
    title,
    organization,
    category_id,
    job_group,
    description,
    vacancies,
    qualification,
    age_limit,
    salary,
    location,
    opening_date,
    last_date,
    notification_url,
    apply_url,
    status,
  } = req.body;

  const errors = [];

  // job_code validation
  if (!job_code || typeof job_code !== 'string' || !job_code.trim()) {
    errors.push('Job code is required.');
  } else if (job_code.trim().length > 100) {
    errors.push('Job code cannot exceed 100 characters.');
  }

  // title validation
  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Job title is required.');
  } else if (title.trim().length > 255) {
    errors.push('Job title cannot exceed 255 characters.');
  }

  // organization validation
  if (!organization || typeof organization !== 'string' || !organization.trim()) {
    errors.push('Organization is required.');
  } else if (organization.trim().length > 255) {
    errors.push('Organization name cannot exceed 255 characters.');
  }

  // category_id validation
  if (category_id === undefined || category_id === null || category_id === '') {
    errors.push('Category ID is required.');
  } else {
    const catIdNum = Number(category_id);
    if (!Number.isInteger(catIdNum) || catIdNum <= 0) {
      errors.push('Category ID must be a positive integer referencing an existing category.');
    }
  }

  // job_group validation (optional: null, empty string, or valid group)
  if (job_group !== undefined && job_group !== null && String(job_group).trim() !== '') {
    const rawGroup = String(job_group).trim().toUpperCase();
    if (!ALLOWED_JOB_GROUPS.includes(rawGroup)) {
      errors.push(`Job group must be one of: ${ALLOWED_JOB_GROUPS.join(', ')}`);
    } else {
      req.body.job_group = rawGroup;
    }
  } else {
    req.body.job_group = null;
  }

  // description validation
  if (!description || typeof description !== 'string' || !description.trim()) {
    errors.push('Description is required.');
  }

  // vacancies validation: integer > 0
  if (vacancies === undefined || vacancies === null || vacancies === '') {
    errors.push('Number of vacancies is required.');
  } else {
    const vacNum = Number(vacancies);
    if (!Number.isInteger(vacNum) || vacNum <= 0) {
      errors.push('Vacancies must be a positive integer greater than 0.');
    }
  }

  // opening_date & last_date validation
  let parsedOpening = null;
  let parsedLast = null;

  if (opening_date) {
    if (!isValidDateString(opening_date)) {
      errors.push('Opening date must be a valid date.');
    } else {
      parsedOpening = new Date(opening_date);
    }
  }

  if (last_date) {
    if (!isValidDateString(last_date)) {
      errors.push('Last date must be a valid date.');
    } else {
      parsedLast = new Date(last_date);
    }
  }

  if (parsedOpening && parsedLast && parsedLast < parsedOpening) {
    errors.push('Last date cannot be earlier than opening date.');
  }

  // URL validations
  if (notification_url && !isValidUrl(notification_url)) {
    errors.push('Notification URL must be a valid HTTP/HTTPS URL.');
  }

  if (apply_url && !isValidUrl(apply_url)) {
    errors.push('Apply URL must be a valid HTTP/HTTPS URL.');
  }

  // status validation
  if (status !== undefined && status !== null && status !== '') {
    const rawStatus = String(status).trim().toLowerCase();
    if (!VALID_STATUSES.includes(rawStatus)) {
      errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    return sendError(res, errors[0], 400, errors);
  }

  next();
};

/**
 * Validates job update request body (PUT /api/admin/jobs/:id)
 */
export const validateUpdateJob = (req, res, next) => {
  const {
    job_code,
    title,
    organization,
    category_id,
    job_group,
    description,
    vacancies,
    opening_date,
    last_date,
    notification_url,
    apply_url,
    status,
  } = req.body;

  const errors = [];

  // job_code validation if provided
  if (job_code !== undefined) {
    if (typeof job_code !== 'string' || !job_code.trim()) {
      errors.push('Job code cannot be empty.');
    } else if (job_code.trim().length > 100) {
      errors.push('Job code cannot exceed 100 characters.');
    }
  }

  // title validation if provided
  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      errors.push('Job title cannot be empty.');
    } else if (title.trim().length > 255) {
      errors.push('Job title cannot exceed 255 characters.');
    }
  }

  // organization validation if provided
  if (organization !== undefined) {
    if (typeof organization !== 'string' || !organization.trim()) {
      errors.push('Organization cannot be empty.');
    } else if (organization.trim().length > 255) {
      errors.push('Organization cannot exceed 255 characters.');
    }
  }

  // category_id validation if provided
  if (category_id !== undefined) {
    const catIdNum = Number(category_id);
    if (!Number.isInteger(catIdNum) || catIdNum <= 0) {
      errors.push('Category ID must be a positive integer referencing an existing category.');
    }
  }

  // job_group validation if provided
  if (job_group !== undefined && job_group !== null && String(job_group).trim() !== '') {
    const rawGroup = String(job_group).trim().toUpperCase();
    if (!ALLOWED_JOB_GROUPS.includes(rawGroup)) {
      errors.push(`Job group must be one of: ${ALLOWED_JOB_GROUPS.join(', ')}`);
    } else {
      req.body.job_group = rawGroup;
    }
  } else if (job_group === '' || job_group === null) {
    req.body.job_group = null;
  }

  // description validation if provided
  if (description !== undefined && (typeof description !== 'string' || !description.trim())) {
    errors.push('Description cannot be empty.');
  }

  // vacancies validation if provided
  if (vacancies !== undefined) {
    const vacNum = Number(vacancies);
    if (!Number.isInteger(vacNum) || vacNum <= 0) {
      errors.push('Vacancies must be a positive integer greater than 0.');
    }
  }

  // Dates
  let parsedOpening = null;
  let parsedLast = null;

  if (opening_date) {
    if (!isValidDateString(opening_date)) {
      errors.push('Opening date must be a valid date.');
    } else {
      parsedOpening = new Date(opening_date);
    }
  }

  if (last_date) {
    if (!isValidDateString(last_date)) {
      errors.push('Last date must be a valid date.');
    } else {
      parsedLast = new Date(last_date);
    }
  }

  if (parsedOpening && parsedLast && parsedLast < parsedOpening) {
    errors.push('Last date cannot be earlier than opening date.');
  }

  // URL validations
  if (notification_url && !isValidUrl(notification_url)) {
    errors.push('Notification URL must be a valid HTTP/HTTPS URL.');
  }

  if (apply_url && !isValidUrl(apply_url)) {
    errors.push('Apply URL must be a valid HTTP/HTTPS URL.');
  }

  // status validation
  if (status !== undefined) {
    const rawStatus = String(status).trim().toLowerCase();
    if (!VALID_STATUSES.includes(rawStatus)) {
      errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    return sendError(res, errors[0], 400, errors);
  }

  next();
};

/**
 * Validates status update (PATCH /api/admin/jobs/:id/status)
 */
export const validateStatusPatch = (req, res, next) => {
  const { status } = req.body;

  if (!status || typeof status !== 'string') {
    return sendError(res, 'Status is required.', 400);
  }

  const normalized = status.trim().toLowerCase();
  if (!VALID_STATUSES.includes(normalized)) {
    return sendError(
      res,
      `Invalid status. Status must be one of: ${VALID_STATUSES.join(', ')}`,
      400
    );
  }

  req.body.status = normalized;
  next();
};
