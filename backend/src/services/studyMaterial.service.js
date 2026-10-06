import fs from 'fs';
import crypto from 'crypto';
import pool from '../config/db.config.js';
import StudyMaterialModel from '../models/studyMaterial.model.js';
import NotificationService from './notification.service.js';
import {
  storeStudyMaterialFile,
  cleanupMaterialFile,
  resolveSafeMaterialPath,
} from '../middleware/uploadStudyMaterial.middleware.js';

class StudyMaterialService {
  /**
   * Helper to slugify a string
   */
  static slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  /**
   * Generate guaranteed unique slug
   */
  static async generateUniqueSlug(title, excludeId = null) {
    const base = this.slugify(title) || 'study-material';
    let slug = base;
    let counter = 1;

    while (await StudyMaterialModel.slugExists(slug, excludeId)) {
      const suffix = crypto.randomBytes(3).toString('hex');
      slug = `${base}-${suffix}`;
      counter++;
      if (counter > 10) {
        slug = `${base}-${Date.now()}`;
        break;
      }
    }

    return slug;
  }

  /**
   * Create a study material with transactional file storage
   */
  static async createMaterial(data, file, userId) {
    if (!file && !data.source_url) {
      throw new Error('A file or source URL is required to create study material.');
    }

    // Move file to permanent storage if file is uploaded
    const storedFileMeta = file ? storeStudyMaterialFile(file) : null;
    const slug = await this.generateUniqueSlug(data.title);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const insertData = {
        title: data.title,
        slug,
        description: data.description || null,
        subject: data.subject,
        category_id: data.category_id,
        material_type: data.material_type || 'study_material',
        exam_group: data.exam_group || null,
        language: data.language || 'ENGLISH',
        source_url: data.source_url || null,
        is_official: data.is_official !== undefined ? (data.is_official ? 1 : 0) : 1,
        file_original_name: storedFileMeta ? storedFileMeta.file_original_name : null,
        file_stored_name: storedFileMeta ? storedFileMeta.file_stored_name : null,
        file_path: storedFileMeta ? storedFileMeta.file_path : null,
        file_mime_type: storedFileMeta ? storedFileMeta.file_mime_type : 'application/pdf',
        file_size: storedFileMeta ? storedFileMeta.file_size : 0,
        status: data.status || 'draft',
        uploaded_by: userId,
        download_count: 0,
      };

      const materialId = await StudyMaterialModel.create(insertData, connection);

      await connection.commit();

      const created = await StudyMaterialModel.findById(materialId);
      this.dispatchPublicationNotification(created);
      return created;
    } catch (error) {
      await connection.rollback();
      // Clean up permanent file on failure
      if (storedFileMeta && storedFileMeta.file_path) {
        cleanupMaterialFile(storedFileMeta.file_path);
      }
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Helper to dispatch study material or syllabus notifications
   */
  static dispatchPublicationNotification(material) {
    if (!material || material.status !== 'published') return;

    if (material.material_type === 'syllabus') {
      NotificationService.notifySyllabus(material).catch((err) =>
        console.error('Syllabus notification dispatch error:', err.message)
      );
    } else {
      NotificationService.notifyStudyMaterial(material).catch((err) =>
        console.error('Study material notification dispatch error:', err.message)
      );
    }
  }

  /**
   * Get paginated published materials for candidates/public
   */
  static async getPublishedMaterials(query) {
    return await StudyMaterialModel.findPublished(query);
  }

  /**
   * Get single published material by ID
   */
  static async getPublishedMaterialById(id) {
    const material = await StudyMaterialModel.findById(id);
    if (!material) {
      return null;
    }

    // Must be published and category must be active
    if (material.status !== 'published') {
      return null;
    }

    if (material.category_status && material.category_status !== 'active') {
      return null;
    }

    return material;
  }

  /**
   * Get admin materials (all statuses)
   */
  static async getAllAdminMaterials(query) {
    return await StudyMaterialModel.findAllAdmin(query);
  }

  /**
   * Get admin statistics
   */
  static async getAdminStats() {
    return await StudyMaterialModel.getStats();
  }

  /**
   * Get admin single material by ID
   */
  static async getAdminMaterialById(id) {
    return await StudyMaterialModel.findById(id);
  }

  /**
   * Update material metadata
   */
  static async updateMaterial(id, updateData) {
    const existing = await StudyMaterialModel.findById(id);
    if (!existing) {
      return null;
    }

    // If title changed, update slug
    if (updateData.title && updateData.title !== existing.title) {
      updateData.slug = await this.generateUniqueSlug(updateData.title, id);
    }

    await StudyMaterialModel.update(id, updateData);
    const updated = await StudyMaterialModel.findById(id);

    if (updateData.status === 'published' && existing.status !== 'published') {
      this.dispatchPublicationNotification(updated);
    }

    return updated;
  }

  /**
   * Update material status
   */
  static async updateStatus(id, newStatus) {
    await StudyMaterialModel.updateStatus(id, newStatus);
    const updated = await StudyMaterialModel.findById(id);

    if (newStatus === 'published') {
      this.dispatchPublicationNotification(updated);
    }

    return updated;
  }

  /**
   * Replace uploaded file safely
   */
  static async replaceFile(id, newFile) {
    if (!newFile) {
      throw new Error('A new replacement file is required.');
    }

    const existing = await StudyMaterialModel.findById(id);
    if (!existing) {
      cleanupMaterialFile(newFile);
      return null;
    }

    const oldFilePath = existing.file_path;
    const storedFileMeta = storeStudyMaterialFile(newFile);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await StudyMaterialModel.updateFile(id, storedFileMeta, connection);

      await connection.commit();

      // Successfully updated DB: delete old file
      if (oldFilePath) {
        cleanupMaterialFile(oldFilePath);
      }

      return await StudyMaterialModel.findById(id);
    } catch (error) {
      await connection.rollback();
      // Rollback: clean up the newly saved file
      if (storedFileMeta && storedFileMeta.file_path) {
        cleanupMaterialFile(storedFileMeta.file_path);
      }
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Soft archive material
   */
  static async archiveMaterial(id) {
    const existing = await StudyMaterialModel.findById(id);
    if (!existing) {
      return null;
    }

    await StudyMaterialModel.archive(id);
    return await StudyMaterialModel.findById(id);
  }

  /**
   * Download material: checks permission, increments download_count, resolves safe file path
   */
  static async downloadMaterial(id, user = null) {
    const material = await StudyMaterialModel.findById(id);
    if (!material) {
      const err = new Error('Resource not found');
      err.statusCode = 404;
      throw err;
    }

    const isAdmin = user && user.role === 'admin';

    // Non-admin can only download published materials with active category
    if (!isAdmin) {
      if (material.status !== 'published') {
        const err = new Error('This resource is not available for download.');
        err.statusCode = 403;
        throw err;
      }
      if (material.category_status && material.category_status !== 'active') {
        const err = new Error('This resource belongs to an inactive category.');
        err.statusCode = 403;
        throw err;
      }
    }

    let resolvedPath = null;
    if (material.file_path) {
      resolvedPath = resolveSafeMaterialPath(material.file_path);
    }

    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      if (material.source_url) {
        await StudyMaterialModel.incrementDownloadCount(id);
        return {
          isExternal: true,
          sourceUrl: material.source_url,
          material,
        };
      }
      const err = new Error('The requested file could not be safely resolved.');
      err.statusCode = 404;
      throw err;
    }

    // Increment download count atomically
    await StudyMaterialModel.incrementDownloadCount(id);

    return {
      isExternal: false,
      filePath: resolvedPath,
      originalName: material.file_original_name,
      mimeType: material.file_mime_type,
      material,
    };
  }
}

export default StudyMaterialService;
