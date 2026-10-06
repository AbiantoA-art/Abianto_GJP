import { sendError } from '../utils/apiResponse.js';

/**
 * Request Validation Middleware Foundation
 * Provides a standardized higher-order validator function for future phases.
 * @param {Function} schemaValidator - Function returning { error, value } or boolean
 */
export const validateRequest = (schemaValidator) => {
  return (req, res, next) => {
    if (!schemaValidator) {
      return next();
    }

    const { error } = schemaValidator(req.body, req.params, req.query);
    if (error) {
      return sendError(res, 'Validation Error', 400, error.details || error.message || error);
    }

    return next();
  };
};
