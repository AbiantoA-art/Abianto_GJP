import StudyMaterialService from '../services/studyMaterial.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { cleanupMaterialFile } from '../middleware/uploadStudyMaterial.middleware.js';

class AdminStudyMaterialController {
  /**
   * Admin: List all study materials and syllabus resources across all statuses
   * GET /api/admin/materials
   */
  static async getMaterials(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        material_type = '',
        subject = '',
        category_id = null,
        exam_group = '',
        language = '',
        status = '',
        sort = 'latest',
      } = req.query;

      const result = await StudyMaterialService.getAllAdminMaterials({
        page,
        limit,
        search,
        material_type,
        subject,
        category_id,
        exam_group,
        language,
        status,
        sort,
      });

      return sendSuccess(
        res,
        'Study materials retrieved successfully.',
        result.data,
        200,
        result.pagination
      );
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve study materials.', 500);
    }
  }

  /**
   * Admin: Get statistics for study materials & syllabus resources
   * GET /api/admin/materials/stats
   */
  static async getStats(req, res) {
    try {
      const stats = await StudyMaterialService.getAdminStats();
      return sendSuccess(res, 'Study material statistics retrieved successfully.', stats, 200);
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve statistics.', 500);
    }
  }

  /**
   * Admin: Get single study material by ID
   * GET /api/admin/materials/:id
   */
  static async getMaterialById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return sendError(res, 'Invalid material ID provided.', 400);
      }

      const material = await StudyMaterialService.getAdminMaterialById(id);
      if (!material) {
        return sendError(res, 'Study material resource not found.', 404);
      }

      return sendSuccess(res, 'Study material retrieved successfully.', material, 200);
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve study material.', 500);
    }
  }

  /**
   * Admin: Create / upload a new study material or syllabus resource
   * POST /api/admin/materials
   */
  static async createMaterial(req, res) {
    try {
      const {
        title,
        subject,
        category_id,
        material_type,
        description,
        status,
        exam_group,
        language,
        source_url,
        is_official,
      } = req.body;
      const file = req.file;

      if (!file && !source_url) {
        return sendError(res, 'Either a resource document file or a valid source URL is required.', 400);
      }

      const userId = req.user.id;

      const created = await StudyMaterialService.createMaterial(
        {
          title,
          subject,
          category_id,
          material_type,
          description,
          status,
          exam_group,
          language,
          source_url,
          is_official: is_official !== undefined ? Boolean(is_official) : true,
        },
        file,
        userId
      );

      return sendSuccess(res, 'Study material uploaded successfully.', created, 201);
    } catch (error) {
      if (req.file) {
        cleanupMaterialFile(req.file);
      }
      return sendError(res, error.message || 'Failed to create study material.', 500);
    }
  }

  /**
   * Admin: Update material metadata
   * PUT /api/admin/materials/:id
   */
  static async updateMaterial(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return sendError(res, 'Invalid material ID provided.', 400);
      }

      const {
        title,
        subject,
        category_id,
        material_type,
        description,
        exam_group,
        language,
        source_url,
        is_official,
      } = req.body;

      const updated = await StudyMaterialService.updateMaterial(id, {
        title,
        subject,
        category_id,
        material_type,
        description,
        exam_group,
        language,
        source_url,
        is_official: is_official !== undefined ? Boolean(is_official) : undefined,
      });

      if (!updated) {
        return sendError(res, 'Study material resource not found.', 404);
      }

      return sendSuccess(res, 'Study material updated successfully.', updated, 200);
    } catch (error) {
      return sendError(res, error.message || 'Failed to update study material.', 500);
    }
  }

  /**
   * Admin: Change material status (draft -> published -> archived)
   * PATCH /api/admin/materials/:id/status
   */
  static async updateStatus(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;

      const updated = await StudyMaterialService.updateStatus(id, status);
      if (!updated) {
        return sendError(res, 'Study material resource not found.', 404);
      }

      return sendSuccess(res, `Study material status updated to '${status}'.`, updated, 200);
    } catch (error) {
      return sendError(res, error.message || 'Failed to update status.', 500);
    }
  }

  /**
   * Admin: Replace uploaded file
   * PATCH /api/admin/materials/:id/file
   */
  static async replaceFile(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        if (req.file) cleanupMaterialFile(req.file);
        return sendError(res, 'Invalid material ID provided.', 400);
      }

      if (!req.file) {
        return sendError(res, 'A replacement document file (.pdf, .doc, .docx) is required.', 400);
      }

      const updated = await StudyMaterialService.replaceFile(id, req.file);
      if (!updated) {
        return sendError(res, 'Study material resource not found.', 404);
      }

      return sendSuccess(res, 'Study material file replaced successfully.', updated, 200);
    } catch (error) {
      if (req.file) cleanupMaterialFile(req.file);
      return sendError(res, error.message || 'Failed to replace file.', 500);
    }
  }

  /**
   * Admin: Safe archive (soft delete)
   * DELETE /api/admin/materials/:id
   */
  static async archiveMaterial(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return sendError(res, 'Invalid material ID provided.', 400);
      }

      const archived = await StudyMaterialService.archiveMaterial(id);
      if (!archived) {
        return sendError(res, 'Study material resource not found.', 404);
      }

      return sendSuccess(res, 'Study material archived successfully.', archived, 200);
    } catch (error) {
      return sendError(res, error.message || 'Failed to archive study material.', 500);
    }
  }
}

export default AdminStudyMaterialController;
