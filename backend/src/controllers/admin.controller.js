import { sendSuccess } from '../utils/apiResponse.js';

export class AdminController {
  /**
   * Test Admin Authorization Endpoint
   * GET /api/admin/test
   * Only reachable by users with role: 'admin'
   */
  static async testAdmin(req, res) {
    return sendSuccess(
      res,
      'Admin authorization verified. Access granted to administrative route.',
      {
        admin: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
        system: {
          portal: 'Government Job Portal Administrative Subsystem',
          phase: 'Phase 03 - Authentication & Authorization',
          authorizedAt: new Date().toISOString(),
        },
      },
      200
    );
  }
}

export default AdminController;
