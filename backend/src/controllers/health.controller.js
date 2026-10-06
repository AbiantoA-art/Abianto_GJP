import { checkHealth } from '../services/health.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Health Controller
 * Handles GET /api/health
 */
export const getHealth = async (req, res, next) => {
  try {
    const healthData = await checkHealth();
    return sendSuccess(res, 'Government Job Portal backend is running', healthData, 200);
  } catch (error) {
    return next(error);
  }
};
