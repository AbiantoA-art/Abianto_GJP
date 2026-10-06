import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { sendError } from '../utils/apiResponse.js';

// Upload directories
const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
const STUDY_MATERIALS_ROOT = path.join(UPLOAD_ROOT, 'study-materials');
const TEMP_ROOT = path.join(UPLOAD_ROOT, 'temp');

// Ensure directories exist
fs.mkdirSync(STUDY_MATERIALS_ROOT, { recursive: true });
fs.mkdirSync(TEMP_ROOT, { recursive: true });

// Allowed MIME types per extension
const ALLOWED_MIME_BY_EXT = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ],
};

// Strict blacklist of dangerous/executable extensions
const FORBIDDEN_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.js', '.html', '.htm', '.php', '.phtml',
  '.svg', '.vbs', '.ps1', '.jar', '.war', '.py', '.dll', '.scr', '.msi',
  '.cgi', '.pl', '.com', '.app', '.jsp', '.asp', '.aspx', '.bash', '.bin',
]);

/**
 * Sanitize original filename safely
 * @param {string} originalName
 * @returns {string}
 */
export const sanitizeFilename = (originalName) => {
  if (!originalName || typeof originalName !== 'string') return 'document.pdf';
  const basename = path.basename(originalName);
  return basename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.+/g, '.')
    .substring(0, 180);
};

// Disk storage into isolated temp directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_ROOT);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `mat-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, unique);
  },
});

// File filter enforcing PDF, DOC, DOCX and rejecting executables
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // 1. Strict blacklist rejection
  if (FORBIDDEN_EXTENSIONS.has(ext)) {
    return cb(
      new Error(`Security violation: File type '${ext}' is strictly prohibited. Executables and scripts are rejected.`),
      false
    );
  }

  // 2. Allow only .pdf, .doc, .docx
  if (!['.pdf', '.doc', '.docx'].includes(ext)) {
    return cb(
      new Error(`Invalid file type '${ext}'. Only PDF (.pdf), Word (.doc), and Word (.docx) files are supported.`),
      false
    );
  }

  // 3. Validate MIME type
  const validMimes = ALLOWED_MIME_BY_EXT[ext] || [];
  if (!validMimes.includes(file.mimetype.toLowerCase())) {
    return cb(
      new Error(`Invalid MIME type '${file.mimetype}' for file extension '${ext}'.`),
      false
    );
  }

  return cb(null, true);
};

// Multer upload instance with 10MB file size limit
const multerMaterialUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum
    files: 1,
  },
});

/**
 * Express middleware for study material file upload
 */
export const uploadStudyMaterialFile = (req, res, next) => {
  const uploader = multerMaterialUpload.single('file');

  uploader(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'File size exceeds allowable limit (Maximum: 10 MB).', 400);
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return sendError(res, `Unexpected upload field: '${err.field}'. Expected form field 'file'.`, 400);
        }
        return sendError(res, `File upload error: ${err.message}`, 400);
      }
      return sendError(res, err.message, 400);
    }
    next();
  });
};

/**
 * Move uploaded file from temp to permanent study materials directory
 * @param {Object} file Multer file object
 * @returns {Object} file metadata
 */
export const storeStudyMaterialFile = (file) => {
  if (!file) return null;

  const targetPath = path.join(STUDY_MATERIALS_ROOT, file.filename);
  fs.renameSync(file.path, targetPath);

  const relativePath = path.relative(UPLOAD_ROOT, targetPath).replace(/\\/g, '/');

  return {
    file_original_name: sanitizeFilename(file.originalname),
    file_stored_name: file.filename,
    file_path: relativePath,
    file_mime_type: file.mimetype,
    file_size: file.size,
  };
};

/**
 * Safely delete a file from disk
 * @param {string|Object} fileOrPath
 */
export const cleanupMaterialFile = (fileOrPath) => {
  if (!fileOrPath) return;

  try {
    if (typeof fileOrPath === 'string') {
      const fullPath = path.isAbsolute(fileOrPath)
        ? fileOrPath
        : path.join(UPLOAD_ROOT, fileOrPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      return;
    }

    if (fileOrPath && fileOrPath.path && fs.existsSync(fileOrPath.path)) {
      fs.unlinkSync(fileOrPath.path);
    }
  } catch (error) {
    console.error('Error cleaning up material file:', error.message);
  }
};

/**
 * Resolve absolute file path safely within UPLOAD_ROOT
 * Prevents path traversal attacks
 * @param {string} relativeFilePath
 * @returns {string|null}
 */
export const resolveSafeMaterialPath = (relativeFilePath) => {
  if (!relativeFilePath || typeof relativeFilePath !== 'string') return null;
  const resolved = path.resolve(UPLOAD_ROOT, relativeFilePath);
  // Ensure the resolved path strictly starts with UPLOAD_ROOT
  if (!resolved.startsWith(UPLOAD_ROOT)) {
    return null; // Path traversal or arbitrary outside path detected
  }
  return resolved;
};
