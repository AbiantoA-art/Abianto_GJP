import fs from 'fs';
import StudyMaterialService from '../services/studyMaterial.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

class StudyMaterialController {
  /**
   * Public / Candidate: List published study materials with search, filter, and pagination
   * GET /api/materials
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
        sort = 'latest',
      } = req.query;

      const result = await StudyMaterialService.getPublishedMaterials({
        page,
        limit,
        search,
        material_type,
        subject,
        category_id,
        exam_group,
        language,
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
   * Public / Candidate: Get details of a single published study material
   * GET /api/materials/:id
   */
  static async getMaterialById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return sendError(res, 'Invalid resource ID provided.', 400);
      }

      // Check if user is admin via optional auth
      const isAdmin = req.user && req.user.role === 'admin';
      let material;

      if (isAdmin) {
        material = await StudyMaterialService.getAdminMaterialById(id);
      } else {
        material = await StudyMaterialService.getPublishedMaterialById(id);
      }

      if (!material) {
        return sendError(res, 'Study material resource not found or not published.', 404);
      }

      // Return sanitized object without internal filesystem path
      const safeData = {
        id: material.id,
        title: material.title,
        slug: material.slug,
        description: material.description,
        subject: material.subject,
        exam_group: material.exam_group,
        language: material.language,
        source_url: material.source_url,
        is_official: Boolean(material.is_official),
        category_id: material.category_id,
        category_name: material.category_name,
        category_slug: material.category_slug,
        material_type: material.material_type,
        file_original_name: material.file_original_name,
        file_mime_type: material.file_mime_type,
        file_size: material.file_size,
        status: material.status,
        download_count: material.download_count,
        created_at: material.created_at,
        updated_at: material.updated_at,
      };

      return sendSuccess(res, 'Study material details retrieved successfully.', safeData, 200);
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve material details.', 500);
    }
  }

  /**
   * Public / Candidate: Secure file download
   * GET /api/materials/:id/download
   */
  static async downloadMaterial(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return sendError(res, 'Invalid resource ID provided.', 400);
      }

      const downloadResult = await StudyMaterialService.downloadMaterial(
        id,
        req.user || null
      );

      if (downloadResult.isExternal && downloadResult.sourceUrl) {
        return res.redirect(downloadResult.sourceUrl);
      }

      const { filePath, originalName, mimeType } = downloadResult;

      if (!filePath || !fs.existsSync(filePath)) {
        if (downloadResult.material?.source_url) {
          return res.redirect(downloadResult.material.source_url);
        }
        return sendError(res, 'Resource file is missing from server storage.', 404);
      }

      res.setHeader('Content-Type', mimeType || 'application/octet-stream');
      return res.download(filePath, originalName, (err) => {
        if (err && !res.headersSent) {
          return sendError(res, 'Failed to complete resource download.', 500);
        }
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return sendError(res, error.message || 'Failed to process resource download.', status);
    }
  }
}

export default StudyMaterialController;
