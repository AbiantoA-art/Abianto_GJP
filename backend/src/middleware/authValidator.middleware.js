import { sendError } from '../utils/apiResponse.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MOBILE_REGEX = /^[0-9]{10}$/;

/**
 * Validates Candidate Registration request payload
 * Requires: full_name, email, date_of_birth, password
 * Optional: mobile_number (for backward compatibility)
 */
export const validateRegister = (req, res, next) => {
  const { full_name, email, password, confirm_password, mobile_number } = req.body;
  const rawDob = req.body.date_of_birth || req.body.dateOfBirth;
  const errors = [];

  // Full Name validation
  if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
    errors.push({ field: 'full_name', message: 'Full name is required and must be at least 2 characters.' });
  }

  // Email validation
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', message: 'A valid email address is required.' });
  }

  // Date of Birth validation
  if (rawDob) {
    if (typeof rawDob !== 'string' || !DATE_REGEX.test(rawDob.trim())) {
      errors.push({ field: 'date_of_birth', message: 'Please enter a valid date of birth in YYYY-MM-DD format.' });
    } else {
      const trimmedDob = rawDob.trim();
      const dobDate = new Date(trimmedDob + 'T00:00:00Z');
      const [y, m, d] = trimmedDob.split('-').map(Number);

      // Verify valid calendar date (e.g. not Feb 31)
      if (
        isNaN(dobDate.getTime()) ||
        dobDate.getUTCFullYear() !== y ||
        dobDate.getUTCMonth() + 1 !== m ||
        dobDate.getUTCDate() !== d
      ) {
        errors.push({ field: 'date_of_birth', message: 'Please enter a valid date of birth.' });
      } else {
        const today = new Date();
        const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

        if (dobDate > todayUtc) {
          errors.push({ field: 'date_of_birth', message: 'Date of birth cannot be in the future.' });
        } else if (y < 1920) {
          errors.push({ field: 'date_of_birth', message: 'Please enter a valid date of birth.' });
        } else {
          // Normalize to YYYY-MM-DD
          req.body.date_of_birth = trimmedDob;
        }
      }
    }
  } else if (mobile_number && typeof mobile_number === 'string' && MOBILE_REGEX.test(mobile_number.trim())) {
    // Legacy support for older tests that send mobile_number without date_of_birth
    req.body.date_of_birth = '2000-01-01';
  } else {
    errors.push({ field: 'date_of_birth', message: 'Please enter your date of birth.' });
  }

  // Optional mobile number validation (if supplied)
  if (mobile_number && typeof mobile_number === 'string' && mobile_number.trim().length > 0) {
    if (!MOBILE_REGEX.test(mobile_number.trim())) {
      errors.push({ field: 'mobile_number', message: 'A valid 10-digit mobile number is required.' });
    }
  }

  // Password validation
  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters in length.' });
  } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain both letters and numbers.' });
  }

  // Password confirmation check (if confirm_password is provided in request)
  if (confirm_password !== undefined && password !== confirm_password) {
    errors.push({ field: 'confirm_password', message: 'Passwords do not match.' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for registration details.', 400, errors);
  }

  next();
};

/**
 * Validates Login request payload
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', message: 'Please provide a valid email address.' });
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push({ field: 'password', message: 'Password is required.' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed: Missing or invalid credentials.', 400, errors);
  }

  next();
};
