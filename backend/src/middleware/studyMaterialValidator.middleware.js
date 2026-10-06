import { sendError } from '../utils/apiResponse.js';
import { JobCategoryModel } from '../models/jobCategory.model.js';
import StudyMaterialModel from '../models/studyMaterial.model.js';
import { cleanupMaterialFile } from './uploadStudyMaterial.middleware.js';

export const ALLOWED_MATERIAL_TYPES = [
  'study_material',
  'syllabus',
  'exam_pattern',
  'question_paper',
  'notification',
  'answer_key',
  'current_affairs',
  'practice_material',
];
export const ALLOWED_EXAM_GROUPS = ['GROUP_1', 'GROUP_2', 'GROUP_2A', 'GROUP_3', 'GROUP_4'];
export const ALLOWED_LANGUAGES = ['TAMIL', 'ENGLISH', 'BILINGUAL'];
const ALLOWED_STATUSES = ['draft', 'published', 'archived'];
const ALLOWED_SORTS = [
  'latest',
  'oldest',
  'downloads_high',
  'downloads_low',
  'title_az',
  'title_za',
];

// Valid status lifecycle transitions
const ALLOWED_TRANSITIONS = {
  draft: ['published', 'archived'],
  published: ['draft', 'archived'],
  archived: ['published', 'draft'],
};

/**
 * Validate creation of a new study material / syllabus resource
 */
export const validateCreateMaterial = async (req, res, next) => {
  const errors = [];
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

  // Title validation
  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push({ field: 'title', message: 'Resource title is required.' });
  } else if (title.trim().length < 3 || title.trim().length > 255) {
    errors.push({ field: 'title', message: 'Resource title must be between 3 and 255 characters.' });
  }

  // Subject validation
  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    errors.push({ field: 'subject', message: 'Subject name is required.' });
  } else if (subject.trim().length < 2 || subject.trim().length > 150) {
    errors.push({ field: 'subject', message: 'Subject must be between 2 and 150 characters.' });
  }

  // Material type validation
  if (!material_type || !ALLOWED_MATERIAL_TYPES.includes(material_type)) {
    errors.push({
      field: 'material_type',
      message: `Material type must be one of: ${ALLOWED_MATERIAL_TYPES.join(', ')}.`,
    });
  }

  // Category validation
  if (!category_id) {
    errors.push({ field: 'category_id', message: 'Category ID is required.' });
  } else {
    const catIdNum = parseInt(category_id, 10);
    if (isNaN(catIdNum) || catIdNum <= 0) {
      errors.push({ field: 'category_id', message: 'Category ID must be a valid positive integer.' });
    } else {
      const category = await JobCategoryModel.findById(catIdNum);
      if (!category) {
        errors.push({ field: 'category_id', message: `Job Category with ID ${catIdNum} does not exist.` });
      }
    }
  }

  // Status validation (optional on creation, defaults to draft)
  if (status && !ALLOWED_STATUSES.includes(status)) {
    errors.push({
      field: 'status',
      message: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}.`,
    });
  }

  // Description validation (optional)
  if (description && typeof description === 'string' && description.length > 5000) {
    errors.push({ field: 'description', message: 'Description cannot exceed 5000 characters.' });
  }

  // File or source_url requirement check
  if (!req.file && (!source_url || !String(source_url).trim())) {
    errors.push({ field: 'file', message: 'A resource document file (.pdf, .doc, .docx) or official source URL is required.' });
  }

  // exam_group validation (optional)
  if (exam_group !== undefined && exam_group !== null && String(exam_group).trim() !== '') {
    const rawGrp = String(exam_group).trim().toUpperCase();
    if (!ALLOWED_EXAM_GROUPS.includes(rawGrp)) {
      errors.push({ field: 'exam_group', message: `Exam group must be one of: ${ALLOWED_EXAM_GROUPS.join(', ')}.` });
    } else {
      req.body.exam_group = rawGrp;
    }
  } else {
    req.body.exam_group = null;
  }

  // language validation (optional, defaults to ENGLISH)
  if (language !== undefined && language !== null && String(language).trim() !== '') {
    const rawLang = String(language).trim().toUpperCase();
    if (!ALLOWED_LANGUAGES.includes(rawLang)) {
      errors.push({ field: 'language', message: `Language must be one of: ${ALLOWED_LANGUAGES.join(', ')}.` });
    } else {
      req.body.language = rawLang;
    }
  } else {
    req.body.language = 'ENGLISH';
  }

  if (source_url !== undefined && source_url !== null) {
    req.body.source_url = String(source_url).trim() || null;
  } else {
    req.body.source_url = null;
  }

  req.body.is_official = is_official !== undefined ? Boolean(is_official) : true;

  if (errors.length > 0) {
    // If validation fails and file was uploaded to temp, clean it up
    if (req.file) {
      cleanupMaterialFile(req.file);
    }
    return sendError(res, 'Validation failed for study material submission.', 400, errors);
  }

  // Normalize trimmed fields
  req.body.title = title.trim();
  req.body.subject = subject.trim();
  req.body.category_id = parseInt(category_id, 10);
  req.body.material_type = material_type;
  req.body.description = description ? description.trim() : null;
  req.body.status = status || 'draft';

  next();
};

/**
 * Validate updating metadata of an existing resource
 */
export const validateUpdateMaterial = async (req, res, next) => {
  const errors = [];
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

  // exam_group validation
  if (exam_group !== undefined) {
    if (exam_group === null || String(exam_group).trim() === '') {
      req.body.exam_group = null;
    } else {
      const rawGrp = String(exam_group).trim().toUpperCase();
      if (!ALLOWED_EXAM_GROUPS.includes(rawGrp)) {
        errors.push({ field: 'exam_group', message: `Exam group must be one of: ${ALLOWED_EXAM_GROUPS.join(', ')}.` });
      } else {
        req.body.exam_group = rawGrp;
      }
    }
  }

  // language validation
  if (language !== undefined) {
    if (language === null || String(language).trim() === '') {
      req.body.language = 'ENGLISH';
    } else {
      const rawLang = String(language).trim().toUpperCase();
      if (!ALLOWED_LANGUAGES.includes(rawLang)) {
        errors.push({ field: 'language', message: `Language must be one of: ${ALLOWED_LANGUAGES.join(', ')}.` });
      } else {
        req.body.language = rawLang;
      }
    }
  }

  if (source_url !== undefined) {
    req.body.source_url = source_url ? String(source_url).trim() : null;
  }

  if (is_official !== undefined) {
    req.body.is_official = Boolean(is_official);
  }

  // Title validation
  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      errors.push({ field: 'title', message: 'Resource title cannot be empty.' });
    } else if (title.trim().length < 3 || title.trim().length > 255) {
      errors.push({ field: 'title', message: 'Resource title must be between 3 and 255 characters.' });
    } else {
      req.body.title = title.trim();
    }
  }

  // Subject validation
  if (subject !== undefined) {
    if (typeof subject !== 'string' || !subject.trim()) {
      errors.push({ field: 'subject', message: 'Subject cannot be empty.' });
    } else if (subject.trim().length < 2 || subject.trim().length > 150) {
      errors.push({ field: 'subject', message: 'Subject must be between 2 and 150 characters.' });
    } else {
      req.body.subject = subject.trim();
    }
  }

  // Category validation
  if (category_id !== undefined) {
    const catIdNum = parseInt(category_id, 10);
    if (isNaN(catIdNum) || catIdNum <= 0) {
      errors.push({ field: 'category_id', message: 'Category ID must be a valid positive integer.' });
    } else {
      const category = await JobCategoryModel.findById(catIdNum);
      if (!category) {
        errors.push({ field: 'category_id', message: `Job Category with ID ${catIdNum} does not exist.` });
      } else {
        req.body.category_id = catIdNum;
      }
    }
  }

  // Material type validation
  if (material_type !== undefined) {
    if (!ALLOWED_MATERIAL_TYPES.includes(material_type)) {
      errors.push({
        field: 'material_type',
        message: `Material type must be one of: ${ALLOWED_MATERIAL_TYPES.join(', ')}.`,
      });
    }
  }

  // Description validation
  if (description !== undefined) {
    if (description !== null && typeof description === 'string' && description.length > 5000) {
      errors.push({ field: 'description', message: 'Description cannot exceed 5000 characters.' });
    } else {
      req.body.description = description ? description.trim() : null;
    }
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for material update.', 400, errors);
  }

  next();
};

/**
 * Validate resource status transition
 * Returns HTTP 422 for invalid lifecycle transitions
 */
export const validateUpdateStatus = async (req, res, next) => {
  const { status } = req.body;
  const materialId = parseInt(req.params.id, 10);

  if (isNaN(materialId) || materialId <= 0) {
    return sendError(res, 'Invalid material ID provided.', 400);
  }

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return sendError(
      res,
      `Invalid status '${status}'. Status must be one of: ${ALLOWED_STATUSES.join(', ')}.`,
      422
    );
  }

  const existing = await StudyMaterialModel.findById(materialId);
  if (!existing) {
    return sendError(res, 'Study material resource not found.', 404);
  }

  // If status is unchanged, proceed cleanly
  if (existing.status === status) {
    req.material = existing;
    return next();
  }

  const allowedNext = ALLOWED_TRANSITIONS[existing.status] || [];
  if (!allowedNext.includes(status)) {
    return sendError(
      res,
      `Invalid lifecycle transition from '${existing.status}' to '${status}'. Allowed transitions: ${allowedNext.join(', ') || 'none'}.`,
      422
    );
  }

  req.material = existing;
  next();
};

/**
 * Validate query parameters for search/filtering
 */
export const validateMaterialQuery = (req, res, next) => {
  const { page, limit, sort, material_type, status, exam_group, language } = req.query;

  if (page !== undefined) {
    const p = parseInt(page, 10);
    if (isNaN(p) || p <= 0) {
      req.query.page = 1;
    } else {
      req.query.page = p;
    }
  } else {
    req.query.page = 1;
  }

  if (limit !== undefined) {
    const l = parseInt(limit, 10);
    if (isNaN(l) || l <= 0) {
      req.query.limit = 10;
    } else {
      req.query.limit = Math.min(50, l);
    }
  } else {
    req.query.limit = 10;
  }

  if (sort !== undefined && !ALLOWED_SORTS.includes(sort)) {
    req.query.sort = 'latest';
  }

  if (material_type !== undefined) {
    const rawType = String(material_type).trim().toLowerCase();
    if (rawType === 'all' || rawType === '') {
      delete req.query.material_type;
    } else if (ALLOWED_MATERIAL_TYPES.includes(rawType)) {
      req.query.material_type = rawType;
    } else {
      req.query.material_type = '';
    }
  }

  if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
    req.query.status = '';
  }

  if (exam_group !== undefined) {
    const rawGrp = String(exam_group).trim().toUpperCase();
    if (rawGrp === 'ALL' || rawGrp === 'ALL_GROUPS' || rawGrp === '') {
      delete req.query.exam_group;
    } else if (ALLOWED_EXAM_GROUPS.includes(rawGrp)) {
      req.query.exam_group = rawGrp;
    } else {
      return sendError(res, `Invalid exam_group. Allowed values are: ${ALLOWED_EXAM_GROUPS.join(', ')}`, 400);
    }
  }

  if (language !== undefined) {
    const rawLang = String(language).trim().toUpperCase();
    if (rawLang === 'ALL' || rawLang === 'ALL_LANGUAGES' || rawLang === '') {
      delete req.query.language;
    } else if (ALLOWED_LANGUAGES.includes(rawLang)) {
      req.query.language = rawLang;
    } else {
      return sendError(res, `Invalid language. Allowed values are: ${ALLOWED_LANGUAGES.join(', ')}`, 400);
    }
  }

  next();
};
