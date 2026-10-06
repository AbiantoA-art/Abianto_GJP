import React, { useState } from 'react';
import { replaceAdminMaterialFile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const ReplaceFileModal = ({
  isOpen,
  onClose,
  onSuccess,
  material,
}) => {
  const { token } = useAuth();
  const { isTamil } = useLanguage();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  if (!isOpen || !material) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError('');
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowed = ['.pdf', '.doc', '.docx'];

    if (!allowed.includes(ext)) {
      setFileError(
        isTamil
          ? 'தவறான கோப்பு வகை. PDF (.pdf), Word (.doc), மற்றும் Word (.docx) கோப்புகள் மட்டுமே ஏற்கப்படும்.'
          : 'Invalid file type. Only PDF (.pdf), Word (.doc), and Word (.docx) are accepted.'
      );
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError(
        isTamil
          ? 'கோப்பின் அளவு அனுமதிக்கப்பட்ட அதிகபட்ச 10 MB வரம்பை விட அதிகமாக உள்ளது.'
          : 'File size exceeds maximum allowed 10 MB limit.'
      );
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!selectedFile) {
      setFileError(isTamil ? 'மாற்று ஆவணக் கோப்பைத் தேர்ந்தெடுக்கவும்.' : 'Please select a replacement document file.');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('file', selectedFile);

      const res = await replaceAdminMaterialFile(material.id, data, token);
      if (!res.success) {
        setApiError(res.message || (isTamil ? 'கோப்பை மாற்ற முடியவில்லை.' : 'Failed to replace file.'));
      } else {
        onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setApiError(err.message || (isTamil ? 'எதிர்பாராத பிழை ஏற்பட்டது.' : 'An unexpected error occurred.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gov-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="gov-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="gov-modal-header">
          <div className="modal-header-title-box">
            <span className="modal-badge-tag">{isTamil ? 'நிர்வாக நடவடிக்கை' : 'Admin Action'}</span>
            <h3 className="modal-title">{isTamil ? 'வளக் கோப்பை மாற்றுக' : 'Replace Material File'}</h3>
          </div>
          <button type="button" className="gov-modal-close" onClick={onClose} title={isTamil ? 'மூடு' : 'Close'}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="gov-modal-form">
          {apiError && (
            <div className="gov-alert-error" role="alert">
              {apiError}
            </div>
          )}

          <div className="replace-file-info-box">
            <p className="replace-prompt-title">
              {isTamil ? 'இலக்கு வளம்:' : 'Target Material:'} <strong>{material.title}</strong>
            </p>
            <p className="replace-current-file">
              {isTamil ? 'தற்போதைய கோப்பு:' : 'Current File:'} <code>{material.file_original_name}</code> (
              {((material.file_size || 0) / 1024 / 1024).toFixed(2)} MB)
            </p>
            <div className="gov-alert-warning">
              <span>
                {isTamil
                  ? 'அறிவிப்பு: கோப்பை மாற்றுவது சேமிப்பகத்தில் உள்ள பழைய கோப்பை மேலெழுதும். மாற்றப்பட்டதும் முந்தைய கோப்பு நிரந்தரமாக நீக்கப்படும்.'
                  : 'Notice: Replacing the file will overwrite the existing file in storage. Once replaced, the previous file is permanently deleted.'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="replace-file-input" className="gov-form-label">
              {isTamil ? 'புதிய மாற்று ஆவணத்தைத் தேர்ந்தெடுக்கவும் (.pdf, .doc, .docx)' : 'Select New Replacement Document (.pdf, .doc, .docx)'} <span className="req">*</span>
            </label>
            <div className="gov-file-dropzone">
              <input
                type="file"
                id="replace-file-input"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="file-input-hidden"
              />
              <label htmlFor="replace-file-input" className="file-dropzone-label">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>
                  {selectedFile
                    ? selectedFile.name
                    : isTamil
                    ? 'புதிய PDF, DOC, அல்லது DOCX ஆவணத்தைத் தேர்ந்தெடுக்கவும் (அதிகபட்சம் 10 MB)'
                    : 'Select new PDF, DOC, or DOCX document (Max 10 MB)'}
                </span>
              </label>
            </div>
            {selectedFile && (
              <div className="file-selection-info">
                <span>{isTamil ? 'புதிய கோப்பு:' : 'New File:'} <strong>{selectedFile.name}</strong></span>
                <span className="file-size-badge">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}
            {fileError && <span className="field-error-msg">{fileError}</span>}
          </div>

          <div className="gov-modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              {isTamil ? 'ரத்துசெய்' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !selectedFile}
            >
              {submitting
                ? isTamil
                  ? 'பதிவேற்றப்பட்டு மாற்றப்படுகிறது...'
                  : 'Uploading & Replacing...'
                : isTamil
                ? 'கோப்பு மாற்றத்தை உறுதிசெய்க'
                : 'Confirm File Replacement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReplaceFileModal;
