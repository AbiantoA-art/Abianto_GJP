import React, { useState } from 'react';
import { archiveAdminJob } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const ArchiveConfirmModal = ({ isOpen, onClose, job, onSuccess }) => {
  const { token } = useAuth();
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !job) return null;

  const handleArchive = async () => {
    setSubmitting(true);
    setErrorMessage('');

    try {
      const result = await archiveAdminJob(job.id, token);
      if (!result.success) {
        setErrorMessage(result.message || (isTa ? 'பணியைக் காப்பகப்படுத்த முடியவில்லை.' : 'Failed to archive job.'));
        setSubmitting(false);
        return;
      }

      onSuccess(result.data, 'archived');
      onClose();
    } catch (err) {
      setErrorMessage(err.message || (isTa ? 'காப்பகப்படுத்துதலில் நெட்வொர்க் பிழை.' : 'Network error during archiving.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-container admin-modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <span className="modal-category-tag" style={{ color: 'var(--color-warning)' }}>
              {isTa ? 'பாதுகாப்பான காப்பக விதி' : 'Secure Archive Protocol'}
            </span>
            <h2 className="admin-modal-title">
              {isTa ? 'பணி அறிவிப்பைக் காப்பகப்படுத்துதல்' : 'Archive Job Notification'}
            </h2>
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label={isTa ? 'மூடு' : 'Close'}>
            &times;
          </button>
        </div>

        <div className="admin-modal-body">
          {errorMessage && (
            <div className="admin-form-alert admin-form-alert-danger">
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="archive-prompt-box">
            <div className="archive-icon-circle">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="21 8 21 21 3 21 3 8" />
                <rect x="1" y="3" width="22" height="5" />
                <line x1="10" y1="12" x2="14" y2="12" />
              </svg>
            </div>
            <h3 className="archive-question">
              {isTa ? 'இந்தப் பணியை நிச்சயமாகக் காப்பகப்படுத்த விரும்புகிறீர்களா?' : 'Are you sure you want to archive this job?'}
            </h3>
            <div className="archive-job-summary">
              <strong>{job.job_code}</strong> — {job.title} ({job.organization})
            </div>
            <p className="archive-explanation">
              {isTa
                ? 'காப்பகப்படுத்தப்பட்ட பணிகள் பொதுப் பட்டியலில் தோன்றாது. தணிக்கை மற்றும் விண்ணப்ப ஒருமைப்பாட்டிற்காக தரவுத்தளத்தில் இந்த பதிவு பாதுகாப்பாக வைக்கப்படும்.'
                : 'Archived jobs will not appear in public listings. This record is preserved in the database for audit and candidate integrity.'}
            </p>
          </div>
        </div>

        <div className="admin-modal-footer">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onClose}
            disabled={submitting}
          >
            {isTa ? 'ரத்து செய்' : 'Cancel'}
          </button>
          <button
            type="button"
            className="btn-modal-danger"
            onClick={handleArchive}
            disabled={submitting}
          >
            {submitting
              ? (isTa ? 'காப்பகப்படுத்தப்படுகிறது...' : 'Archiving...')
              : (isTa ? 'பணியைக் காப்பகப்படுத்து' : 'Archive Job')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveConfirmModal;
