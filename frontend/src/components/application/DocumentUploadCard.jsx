import React, { useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * DocumentUploadCard Component
 * Modern file upload card with drag/drop area, file preview, size calculation,
 * format restrictions, replace/remove buttons, and validation error messages.
 */
export const DocumentUploadCard = ({
  id,
  name,
  label,
  helperText,
  accept,
  maxSizeMB = 5,
  required = false,
  file = null,
  error = null,
  onChange,
  onRemove,
  iconType = 'document', // 'document' | 'photo' | 'certificate'
}) => {
  const { isTamil } = useLanguage();
  const fileInputRef = useRef(null);

  const handleChooseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleInputChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={`app-upload-card ${file ? 'has-file' : ''} ${error ? 'has-error' : ''}`}>
      <div className="upload-card-header">
        <label htmlFor={id} className="upload-field-label">
          <span>{label}</span>
          {required && <span className="required-star" aria-hidden="true">*</span>}
        </label>
        <span className="upload-size-limit">
          {isTamil ? `அதிகபட்சம் ${maxSizeMB} MB` : `Max: ${maxSizeMB} MB`}
        </span>
      </div>

      <p className="upload-helper-text">{helperText}</p>

      {/* Hidden real file input */}
      <input
        ref={fileInputRef}
        type="file"
        id={id}
        name={name}
        accept={accept}
        onChange={handleInputChange}
        className="app-hidden-file-input"
        required={required && !file}
      />

      {/* Upload Zone or File Preview */}
      {!file ? (
        <div
          className="upload-dropzone"
          onClick={handleChooseClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleChooseClick();
            }
          }}
          aria-label={isTamil ? `${label} கோப்பை தேர்வு செய்க` : `Choose file for ${label}`}
        >
          <div className="upload-icon-circle">
            {iconType === 'photo' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            ) : iconType === 'certificate' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
          </div>

          <div className="upload-prompt-text">
            <span className="upload-main-cta">
              {isTamil ? 'கோப்பை தேர்வு செய்க' : 'Choose File to Upload'}
            </span>
            <span className="upload-sub-cta">
              {isTamil ? 'அல்லது கோப்பை இங்கே இழுத்து விடவும்' : 'or browse from your device'}
            </span>
          </div>

          <button
            type="button"
            className="btn-upload-browse"
            onClick={(e) => {
              e.stopPropagation();
              handleChooseClick();
            }}
          >
            {isTamil ? 'கோப்பைத் தேர்ந்தெடு' : 'Browse Files'}
          </button>
        </div>
      ) : (
        <div className="upload-file-preview-card">
          <div className="preview-file-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <div className="preview-file-info">
            <div className="preview-file-name" title={file.name}>
              {file.name}
            </div>
            <div className="preview-file-meta">
              <span className="file-size-badge">{formatFileSize(file.size)}</span>
              <span className="file-status-text">
                {isTamil ? '✓ தயாராக உள்ளது' : '✓ Ready for upload'}
              </span>
            </div>
          </div>

          <div className="preview-file-actions">
            <button
              type="button"
              className="btn-file-replace"
              onClick={handleChooseClick}
              title={isTamil ? 'வேறு கோப்பை தேர்வு செய்யவும்' : 'Replace with another file'}
            >
              {isTamil ? 'மாற்று' : 'Replace'}
            </button>
            <button
              type="button"
              className="btn-file-remove"
              onClick={() => onRemove && onRemove()}
              title={isTamil ? 'கோப்பை நீக்கவும்' : 'Remove file'}
              aria-label={isTamil ? 'கோப்பை நீக்கு' : 'Remove file'}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="app-field-error" role="alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default DocumentUploadCard;
