import { Router } from 'express';
import AdminStudyMaterialController from '../controllers/adminStudyMaterial.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import { uploadStudyMaterialFile } from '../middleware/uploadStudyMaterial.middleware.js';
import {
  validateCreateMaterial,
  validateUpdateMaterial,
  validateUpdateStatus,
  validateMaterialQuery,
} from '../middleware/studyMaterialValidator.middleware.js';

const router = Router();

// Enforce admin-only authentication
router.use(authenticateToken);
router.use(requireRole('admin'));

// 1. Get statistics
router.get('/stats', AdminStudyMaterialController.getStats);

// 2. List all materials (all statuses, search, filter, pagination, sort)
router.get('/', validateMaterialQuery, AdminStudyMaterialController.getMaterials);

// 3. Create / upload new material or syllabus
router.post(
  '/',
  uploadStudyMaterialFile,
  validateCreateMaterial,
  AdminStudyMaterialController.createMaterial
);

// 4. Get single material details
router.get('/:id', AdminStudyMaterialController.getMaterialById);

// 5. Update metadata
router.put('/:id', validateUpdateMaterial, AdminStudyMaterialController.updateMaterial);

// 6. Update status (with lifecycle validation)
router.patch('/:id/status', validateUpdateStatus, AdminStudyMaterialController.updateStatus);

// 7. Replace uploaded file
router.patch('/:id/file', uploadStudyMaterialFile, AdminStudyMaterialController.replaceFile);

// 8. Soft archive material
router.delete('/:id', AdminStudyMaterialController.archiveMaterial);

export default router;
