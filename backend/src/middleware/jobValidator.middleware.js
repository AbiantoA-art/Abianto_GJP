import { sendError } from '../utils/apiResponse.js';

const ALLOWED_SORT_OPTIONS = [
  'latest',
  'oldest',
  'deadline_soon',
  'deadline_latest',
  'vacancies_high',
  'vacancies_low',
];

export const ALLOWED_JOB_GROUPS = [
  'GROUP_1',
  'GROUP_2',
  'GROUP_2A',
  'GROUP_3',
  'GROUP_4',
];

/**
 * Validates date format (YYYY-MM-DD) and checks for real calendar date
 * @param {string} val
 * @returns {boolean}
 */
const isValidDateString = (val) => {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;
  const parts = trimmed.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
};

/**
 * Validates query parameters for candidate public job discovery (GET /api/jobs)
 * Validates page, limit, category_id, job_group, dates, and sort options
 */
export const validateJobsQuery = (req, res, next) => {
  const {
    page,
    limit,
    category_id,
    job_group,
    opening_date_from,
    opening_date_to,
    last_date_from,
    last_date_to,
    sort,
  } = req.query;

  // 1. Validate 'page' if provided
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

  // 2. Validate 'limit' if provided
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

  // 3. Validate 'category_id' if provided
  if (category_id !== undefined && category_id !== null && category_id !== '') {
    const rawCatId = String(category_id).trim();
    if (!/^\d+$/.test(rawCatId) || parseInt(rawCatId, 10) < 1) {
      return sendError(
        res,
        'Invalid category_id parameter. Category ID must be a positive integer.',
        400
      );
    }
    req.query.category_id = parseInt(rawCatId, 10);
  }

  // 3b. Validate 'job_group' if provided
  if (job_group !== undefined && job_group !== null && String(job_group).trim() !== '') {
    const rawGroup = String(job_group).trim().toUpperCase();
    if (rawGroup === 'ALL' || rawGroup === 'ALL_GROUPS') {
      delete req.query.job_group;
    } else if (!ALLOWED_JOB_GROUPS.includes(rawGroup)) {
      return sendError(
        res,
        `Invalid job_group parameter '${job_group}'. Allowed values are: ${ALLOWED_JOB_GROUPS.join(', ')}.`,
        400
      );
    } else {
      req.query.job_group = rawGroup;
    }
  }

  // 4. Validate Date Filters
  const dateParams = [
    { name: 'opening_date_from', val: opening_date_from },
    { name: 'opening_date_to', val: opening_date_to },
    { name: 'last_date_from', val: last_date_from },
    { name: 'last_date_to', val: last_date_to },
  ];

  for (const { name, val } of dateParams) {
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      if (!isValidDateString(String(val))) {
        return sendError(
          res,
          `Invalid date format for ${name}. Expected valid date in YYYY-MM-DD format.`,
          400
        );
      }
      req.query[name] = String(val).trim();
    }
  }

  // 5. Validate 'sort' if provided
  if (sort !== undefined && sort !== null && String(sort).trim() !== '') {
    const rawSort = String(sort).trim().toLowerCase();
    if (!ALLOWED_SORT_OPTIONS.includes(rawSort)) {
      return sendError(
        res,
        `Invalid sort parameter '${sort}'. Allowed values are: ${ALLOWED_SORT_OPTIONS.join(', ')}.`,
        400
      );
    }
    req.query.sort = rawSort;
  } else {
    req.query.sort = 'latest';
  }

  // 6. Security guard: Disallow candidate override of job lifecycle status
  if (req.query.status) {
    delete req.query.status;
  }

  next();
};

/**
 * Validates job ID parameter for GET /api/jobs/:id
 * If the ID is invalid (non-numeric or non-positive), returns HTTP 404
 */
export const validateJobId = (req, res, next) => {
  const rawId = String(req.params.id || '').trim();

  if (!/^\d+$/.test(rawId) || parseInt(rawId, 10) <= 0) {
    return sendError(res, 'Job not found', 404);
  }

  req.params.id = parseInt(rawId, 10);
  next();
};
