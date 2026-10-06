import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { sendError } from '../utils/apiResponse.js';

// Base uploads root
const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
const APPLICATIONS_ROOT = path.join(UPLOAD_ROOT, 'applications');
const TEMP_ROOT = path.join(UPLOAD_ROOT, 'temp');

// Ensure root and temp directories exist
fs.mkdirSync(APPLICATIONS_ROOT, { recursive: true });
fs.mkdirSync(TEMP_ROOT, { recursive: true });

// Whitelist of allowed extensions and MIME types
const ALLOWED_MIME_BY_EXT = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ],
  '.jpg': ['image/jpeg', 'image/pjpeg'],
  '.jpeg': ['image/jpeg', 'image/pjpeg'],
  '.png': ['image/png'],
};

// Strict blacklist of dangerous/executable extensions
const FORBIDDEN_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.js', '.html', '.htm', '.php', '.phtml',
  '.svg', '.vbs', '.ps1', '.jar', '.war', '.py', '.dll', '.scr', '.msi',
  '.cgi', '.pl', '.com', '.app',
]);

/**
 * Sanitize original file name safely
 * @param {string} originalName
 * @returns {string}
 */
export const sanitizeFilename = (originalName) => {
  if (!originalName || typeof originalName !== 'string') return 'document';
  const basename = path.basename(originalName);
  return basename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.+/g, '.')
    .substring(0, 180);
};

// Multer Disk Storage into isolated temp directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_ROOT);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const prefix = file.fieldname || 'doc';
    const unique = `${prefix}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, unique);
  },
});

// File filter enforcing field-specific types and strictly forbidding executables
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // 1. Strict blacklist rejection
  if (FORBIDDEN_EXTENSIONS.has(ext)) {
    return cb(
      new Error(`Security violation: File type '${ext}' is strictly prohibited. Executables and scripts are rejected.`),
      false
    );
  }

  // 2. Validate field name
  if (!['resume', 'photograph', 'certificate'].includes(file.fieldname)) {
    return cb(new Error(`Unexpected form field: '${file.fieldname}'`), false);
  }

  // 3. Allowed extensions per field
  if (file.fieldname === 'resume') {
    if (!['.pdf', '.doc', '.docx'].includes(ext)) {
      return cb(new Error('Resume must be a valid document file (.pdf, .doc, .docx).'), false);
    }
  } else if (file.fieldname === 'photograph') {
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
      return cb(new Error('Photograph must be a valid image file (.jpg, .jpeg, .png).'), false);
    }
  } else if (file.fieldname === 'certificate') {
    if (!['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'].includes(ext)) {
      return cb(new Error('Certificate must be a valid document or image (.pdf, .doc, .docx, .jpg, .png).'), false);
    }
  }

  // 4. Validate MIME type matches extension
  const validMimes = ALLOWED_MIME_BY_EXT[ext] || [];
  if (!validMimes.includes(file.mimetype.toLowerCase())) {
    // If MIME type does not match known extension, reject
    return cb(new Error(`Invalid MIME type '${file.mimetype}' for file extension '${ext}'.`), false);
  }

  return cb(null, true);
};

// Multer instance with 5MB max file size ceiling
const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB overall limit
    files: 3,
  },
});

/**
 * Express middleware for application document uploads (resume, photograph, certificate)
 */
export const uploadApplicationDocuments = (req, res, next) => {
  const uploader = multerUpload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'photograph', maxCount: 1 },
    { name: 'certificate', maxCount: 1 },
  ]);

  uploader(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'File size exceeds allowable limit (Maximum: 5 MB).', 400);
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return sendError(res, `Unexpected upload field: ${err.field}`, 400);
        }
        return sendError(res, `File upload error: ${err.message}`, 400);
      }
      return sendError(res, err.message, 400);
    }

    // Secondary size check for photograph (Max 2MB)
    if (req.files && req.files.photograph && req.files.photograph[0]) {
      const photo = req.files.photograph[0];
      if (photo.size > 2 * 1024 * 1024) {
        // Clean up uploaded files in temp
        cleanupUploadedFiles(req.files);
        return sendError(res, 'Photograph size exceeds allowable limit (Maximum: 2 MB).', 400);
      }
    }

    next();
  });
};

/**
 * Move uploaded temp files into the permanent application directory:
 * backend/uploads/applications/{application_id}/
 * @param {Object} files Multer req.files object
 * @param {string} applicationId e.g. APP-2026-A1B2C3D4
 * @returns {Array<{ document_type: string, original_filename: string, stored_filename: string, file_path: string, mime_type: string, file_size: number }>}
 */
export const storeApplicationFiles = async (files, applicationId) => {
  const result = [];
  if (!files) return result;

  const appFolder = path.join(APPLICATIONS_ROOT, applicationId);
  fs.mkdirSync(appFolder, { recursive: true });

  const mapping = [
    { field: 'resume', type: 'resume' },
    { field: 'photograph', type: 'photograph' },
    { field: 'certificate', type: 'certificate' },
  ];

  for (const { field, type } of mapping) {
    if (files[field] && files[field][0]) {
      const file = files[field][0];
      const typeSubdir = path.join(appFolder, type);
      fs.mkdirSync(typeSubdir, { recursive: true });

      const targetPath = path.join(typeSubdir, file.filename);
      // Move from temp to app directory
      fs.renameSync(file.path, targetPath);

      // Store relative path for portability: e.g. "applications/APP-2026-XXXX/resume/resume-xyz.pdf"
      const relativePath = path.relative(UPLOAD_ROOT, targetPath).replace(/\\/g, '/');

      result.push({
        document_type: type,
        original_filename: sanitizeFilename(file.originalname),
        stored_filename: file.filename,
        file_path: relativePath,
        mime_type: file.mimetype,
        file_size: file.size,
      });
    }
  }

  return result;
};

/**
 * Clean up files from temp directory or application directory
 * @param {Object|string} filesOrPath
 */
export const cleanupUploadedFiles = (filesOrPath) => {
  if (!filesOrPath) return;

  try {
    if (typeof filesOrPath === 'string') {
      const fullPath = path.isAbsolute(filesOrPath)
        ? filesOrPath
        : path.join(UPLOAD_ROOT, filesOrPath);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
      return;
    }

    // Multer req.files object
    if (typeof filesOrPath === 'object') {
      for (const field of Object.keys(filesOrPath)) {
        const fileArr = filesOrPath[field];
        if (Array.isArray(fileArr)) {
          for (const f of fileArr) {
            if (f.path && fs.existsSync(f.path)) {
              fs.unlinkSync(f.path);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error during file cleanup:', error.message);
  }
};

/**
 * Resolve absolute file path safely within UPLOAD_ROOT
 * Strictly prevents path traversal attacks
 * @param {string} relativeFilePath
 * @returns {string|null} Absolute path or null if invalid
 */
export const resolveSafeUploadPath = (relativeFilePath) => {
  if (!relativeFilePath || typeof relativeFilePath !== 'string') return null;
  const resolved = path.resolve(UPLOAD_ROOT, relativeFilePath);
  // Ensure the resolved path starts with UPLOAD_ROOT
  if (!resolved.startsWith(UPLOAD_ROOT)) {
    return null; // Path traversal attempt detected
  }
  return resolved;
};
