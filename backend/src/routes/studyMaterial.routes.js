import { Router } from 'express';
import StudyMaterialController from '../controllers/studyMaterial.controller.js';
import { validateMaterialQuery } from '../middleware/studyMaterialValidator.middleware.js';
import { optionalAuthenticateToken } from '../middleware/auth.middleware.js';
import { fileRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// 1. List published materials / syllabus with search, filter, and pagination
router.get('/', validateMaterialQuery, StudyMaterialController.getMaterials);

// 2. Download material file (increments download count, checks visibility, rate-limited)
router.get('/:id/download', optionalAuthenticateToken, fileRateLimiter, StudyMaterialController.downloadMaterial);

// 3. Get single material details (sanitized, no internal paths)
router.get('/:id', optionalAuthenticateToken, StudyMaterialController.getMaterialById);

export default router;
