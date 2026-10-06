import AuthService from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export class AuthController {
  /**
   * Handle Candidate Registration
   * POST /api/auth/register
   */
  static async register(req, res, next) {
    try {
      const { full_name, email, date_of_birth, mobile_number, password } = req.body;

      const result = await AuthService.registerCandidate({
        full_name,
        email,
        date_of_birth: date_of_birth || req.body.dateOfBirth || null,
        mobile_number: mobile_number || null,
        password,
      });

      return sendSuccess(
        res,
        'Registration successful. Candidate profile created.',
        {
          token: result.token,
          user: result.user,
        },
        201
      );
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Handle User Login (Candidate & Admin)
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login({ email, password });

      return sendSuccess(
        res,
        'Login successful.',
        {
          token: result.token,
          user: result.user,
        },
        200
      );
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Handle Authenticated User Identity Check
   * GET /api/auth/me
   */
  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getCurrentUser(req.user.id);

      return sendSuccess(
        res,
        'User profile retrieved successfully.',
        { user },
        200
      );
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  }
}

export default AuthController;
