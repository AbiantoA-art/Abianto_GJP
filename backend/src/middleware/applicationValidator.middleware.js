import { sendError } from '../utils/apiResponse.js';
import { cleanupUploadedFiles } from './upload.middleware.js';

const VALID_STATUSES = [
  'submitted',
  'under_review',
  'shortlisted',
  'rejected',
  'selected',
  'withdrawn',
];

const VALID_GENDERS = ['male', 'female', 'transgender', 'other'];

/**
 * Validates date string in YYYY-MM-DD format and ensures real calendar date
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
 * Lifecycle state machine transitions validator
 * @param {string} currentStatus
 * @param {string} targetStatus
 * @returns {boolean}
 */
export const isValidStatusTransition = (currentStatus, targetStatus) => {
  if (currentStatus === targetStatus) return true;

  const allowedTransitions = {
    submitted: ['under_review', 'withdrawn'],
    under_review: ['shortlisted', 'rejected', 'withdrawn'],
    shortlisted: ['selected', 'rejected'],
    rejected: [],
    selected: [],
    withdrawn: [],
  };

  const allowed = allowedTransitions[currentStatus] || [];
  return allowed.includes(targetStatus);
};

/**
 * Middleware: Validate Candidate Application Form Submission (POST /api/applications)
 */
export const validateCreateApplication = (req, res, next) => {
  const errors = [];
  const body = req.body || {};

  const fail = (message) => {
    if (req.files) {
      cleanupUploadedFiles(req.files);
    }
    return sendError(res, message, 422, errors.length > 0 ? errors : null);
  };

  // 1. job_id
  const rawJobId = body.job_id;
  if (!rawJobId || !/^\d+$/.test(String(rawJobId).trim()) || parseInt(rawJobId, 10) < 1) {
    errors.push('A valid positive integer job_id is required.');
  }

  // 2. full_name
  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
  if (!fullName || fullName.length < 2 || fullName.length > 150) {
    errors.push('Full Name is required and must be between 2 and 150 characters.');
  }

  // 3. email
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email) || email.length > 190) {
    errors.push('A valid email address is required.');
  }

  // 4. mobile_number
  const mobile = typeof body.mobile_number === 'string' ? body.mobile_number.trim() : '';
  if (!mobile || !/^\+?[0-9]{10,15}$/.test(mobile)) {
    errors.push('A valid mobile phone number (10 to 15 digits) is required.');
  }

  // 5. date_of_birth
  const dob = typeof body.date_of_birth === 'string' ? body.date_of_birth.trim() : '';
  if (!dob || !isValidDateString(dob)) {
    errors.push('Date of Birth must be a valid date in YYYY-MM-DD format.');
  } else {
    const dobDate = new Date(dob);
    const now = new Date();
    if (dobDate >= now) {
      errors.push('Date of Birth must be in the past.');
    }
  }

  // 6. gender
  const gender = typeof body.gender === 'string' ? body.gender.trim().toLowerCase() : '';
  if (!gender || !VALIDGENDERS_INCLUDES(gender)) {
    errors.push(`Gender is required and must be one of: ${VALID_GENDERS.join(', ')}.`);
  }

  // 7. address_line, city, district, state, pincode
  const addressLine = typeof body.address_line === 'string' ? body.address_line.trim() : '';
  if (!addressLine || addressLine.length < 5) {
    errors.push('Address Line is required (minimum 5 characters).');
  }

  const city = typeof body.city === 'string' ? body.city.trim() : '';
  if (!city || city.length > 100) {
    errors.push('City is required and must not exceed 100 characters.');
  }

  const district = typeof body.district === 'string' ? body.district.trim() : '';
  if (!district || district.length > 100) {
    errors.push('District is required and must not exceed 100 characters.');
  }

  const state = typeof body.state === 'string' ? body.state.trim() : '';
  if (!state || state.length > 100) {
    errors.push('State is required and must not exceed 100 characters.');
  }

  const pincode = typeof body.pincode === 'string' ? body.pincode.trim() : '';
  if (!pincode || !/^[0-9]{4,10}$/.test(pincode)) {
    errors.push('Pincode must contain 4 to 10 digits.');
  }

  // 8. highest_qualification & university_or_board
  const highestQual = typeof body.highest_qualification === 'string' ? body.highest_qualification.trim() : '';
  if (!highestQual || highestQual.length > 100) {
    errors.push('Highest Qualification is required.');
  }

  const university = typeof body.university_or_board === 'string' ? body.university_or_board.trim() : '';
  if (!university || university.length > 200) {
    errors.push('University or Board name is required.');
  }

  // 9. passing_year
  const rawPassingYear = body.passing_year;
  const currentYear = new Date().getFullYear();
  if (
    rawPassingYear === undefined ||
    !/^\d{4}$/.test(String(rawPassingYear).trim()) ||
    parseInt(rawPassingYear, 10) < 1950 ||
    parseInt(rawPassingYear, 10) > currentYear + 1
  ) {
    errors.push(`Passing year must be a 4-digit year between 1950 and ${currentYear + 1}.`);
  }

  // 10. percentage_or_cgpa
  const percentage = typeof body.percentage_or_cgpa === 'string' ? body.percentage_or_cgpa.trim() : String(body.percentage_or_cgpa || '').trim();
  if (!percentage || percentage.length > 20) {
    errors.push('Percentage or CGPA is required.');
  }

  // 11. experience_status
  const expStatus = typeof body.experience_status === 'string' ? body.experience_status.trim().toLowerCase() : 'fresher';
  if (!['fresher', 'experienced'].includes(expStatus)) {
    errors.push("Experience status must be either 'fresher' or 'experienced'.");
  }

  // 12. declaration_accepted
  const declaration = body.declaration_accepted;
  const isAccepted = declaration === true || declaration === 'true' || declaration === 1 || declaration === '1';
  if (!isAccepted) {
    errors.push('You must explicitly accept the declaration to submit your application.');
  }

  // 13. Required files check
  const files = req.files || {};
  if (!files.resume || !files.resume[0]) {
    errors.push('Resume document is required (.pdf, .doc, .docx).');
  }
  if (!files.photograph || !files.photograph[0]) {
    errors.push('Candidate photograph is required (.jpg, .jpeg, .png).');
  }

  if (errors.length > 0) {
    return fail('Application validation failed. Please check the provided inputs.');
  }

  // Normalize inputs
  req.body.job_id = parseInt(rawJobId, 10);
  req.body.full_name = fullName;
  req.body.email = email.toLowerCase();
  req.body.mobile_number = mobile;
  req.body.date_of_birth = dob;
  req.body.gender = gender;
  req.body.address_line = addressLine;
  req.body.city = city;
  req.body.district = district;
  req.body.state = state;
  req.body.pincode = pincode;
  req.body.highest_qualification = highestQual;
  req.body.university_or_board = university;
  req.body.passing_year = parseInt(rawPassingYear, 10);
  req.body.percentage_or_cgpa = percentage;
  req.body.experience_status = expStatus;
  req.body.declaration_accepted = true;

  next();
};

function VALIDGENDERS_INCLUDES(gender) {
  return VALID_GENDERS.includes(gender);
}

/**
 * Middleware: Validate admin application status change (PATCH /api/admin/applications/:id/status)
 */
export const validateUpdateStatus = (req, res, next) => {
  const { status } = req.body || {};

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

/**
 * Middleware: Validate query parameters for admin application list (GET /api/admin/applications)
 */
export const validateAdminApplicationsQuery = (req, res, next) => {
  const { page, limit, status, job_id, candidate_id, date_from, date_to } = req.query;

  if (page !== undefined && page !== null && page !== '') {
    const rawPage = String(page).trim();
    if (!/^\d+$/.test(rawPage) || parseInt(rawPage, 10) < 1) {
      return sendError(res, 'Page parameter must be a positive integer >= 1.', 400);
    }
    req.query.page = parseInt(rawPage, 10);
  } else {
    req.query.page = 1;
  }

  if (limit !== undefined && limit !== null && limit !== '') {
    const rawLimit = String(limit).trim();
    if (!/^\d+$/.test(rawLimit) || parseInt(rawLimit, 10) < 1 || parseInt(rawLimit, 10) > 100) {
      return sendError(res, 'Limit parameter must be an integer between 1 and 100.', 400);
    }
    req.query.limit = parseInt(rawLimit, 10);
  } else {
    req.query.limit = 10;
  }

  if (status !== undefined && status !== null && status !== '') {
    const rawStatus = String(status).trim().toLowerCase();
    if (!VALID_STATUSES.includes(rawStatus)) {
      return sendError(res, `Invalid status filter. Status must be one of: ${VALID_STATUSES.join(', ')}`, 400);
    }
    req.query.status = rawStatus;
  }

  if (job_id !== undefined && job_id !== null && job_id !== '') {
    if (!/^\d+$/.test(String(job_id).trim())) {
      return sendError(res, 'job_id filter must be a valid positive integer.', 400);
    }
    req.query.job_id = parseInt(job_id, 10);
  }

  if (candidate_id !== undefined && candidate_id !== null && candidate_id !== '') {
    if (!/^\d+$/.test(String(candidate_id).trim())) {
      return sendError(res, 'candidate_id filter must be a valid positive integer.', 400);
    }
    req.query.candidate_id = parseInt(candidate_id, 10);
  }

  if (date_from && date_from.trim()) {
    if (!isValidDateString(date_from)) {
      return sendError(res, 'date_from must be a valid date in YYYY-MM-DD format.', 400);
    }
    req.query.date_from = date_from.trim();
  }

  if (date_to && date_to.trim()) {
    if (!isValidDateString(date_to)) {
      return sendError(res, 'date_to must be a valid date in YYYY-MM-DD format.', 400);
    }
    req.query.date_to = date_to.trim();
  }

  next();
};
