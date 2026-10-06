import React, { useState, useEffect } from 'react';
import { updateAdminJobStatus } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../StatusBadge';

export const StatusChangeModal = ({ isOpen, onClose, job, onSuccess }) => {
  const { token } = useAuth();
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [selectedStatus, setSelectedStatus] = useState('draft');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const statusDescriptions = {
    draft: isTa
      ? 'வரைவு: பணி அறிவிப்பு தயாரிக்கப்படுகிறது மற்றும் வேட்பாளர்களுக்கு மறைக்கப்பட்டுள்ளது.'
      : 'Draft: Job notification is being prepared and is hidden from candidates.',
    published: isTa
      ? 'வெளியிடப்பட்டது: பணி அறிவிப்பு நேரலையில் உள்ளது மற்றும் அனைத்து வேட்பாளர்களுக்கும் பொது பார்வைக்குக் கிடைக்கிறது.'
      : 'Published: Job notification is live and publicly visible to all candidates.',
    closed: isTa
      ? 'முடிவடைந்தது: விண்ணப்பங்கள் பெறுவது நிறுத்தப்பட்டது. நேரடி பொது அணுகல் முடக்கப்பட்டுள்ளது.'
      : 'Closed: Application intake is closed. Direct public access is disabled.',
    expired: isTa
      ? 'காலாவதியானது: விண்ணப்ப காலக்கெடு முடிவடைந்தது. பொதுப் பட்டியலில் காலாவதியானதாகக் காட்டப்படும்.'
      : 'Expired: Application deadline has passed. Listed as expired in public catalog.',
    archived: isTa
      ? 'காப்பகப்படுத்தப்பட்டது: செயலில் உள்ள பட்டியலிலிருந்து நீக்கப்பட்டு வரலாற்று பதிவுகளில் பாதுகாப்பாக வைக்கப்பட்டுள்ளது.'
      : 'Archived: Removed from active catalog and preserved safely for audit.',
  };

  useEffect(() => {
    if (job) {
      setSelectedStatus(job.status || 'draft');
      setErrorMessage('');
    }
  }, [job, isOpen]);

  if (!isOpen || !job) return null;

  const handleUpdate = async () => {
    if (selectedStatus === job.status) {
      onClose();
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const result = await updateAdminJobStatus(job.id, selectedStatus, token);
      if (!result.success) {
        setErrorMessage(result.message || (isTa ? 'பணி நிலையைப் புதுப்பிக்க முடியவில்லை.' : 'Failed to update job status.'));
        setSubmitting(false);
        return;
      }

      onSuccess(result.data, 'status_updated');
      onClose();
    } catch (err) {
      setErrorMessage(err.message || (isTa ? 'நிலை புதுப்பித்தலில் நெட்வொர்க் பிழை.' : 'Network error during status update.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-container admin-modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <span className="modal-category-tag">{isTa ? 'பணி சுழற்சி மேலாண்மை' : 'Job Lifecycle Management'}</span>
            <h2 className="admin-modal-title">{isTa ? 'பணி நிலையை மாற்றுதல்' : 'Change Job Status'}</h2>
            <p className="admin-modal-subtitle">{job.job_code} — {job.title}</p>
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

          <div className="status-current-row">
            <span className="spec-label">{isTa ? 'தற்போதைய நிலை:' : 'Current Status:'}</span>
            <StatusBadge status={job.status} />
          </div>

          <div className="form-field-group" style={{ marginTop: '1.25rem' }}>
            <label className="form-label" htmlFor="new_status">
              {isTa ? 'புதிய நிலையைத் தேர்ந்தெடுக்கவும்:' : 'Select New Status:'}
            </label>
            <select
              id="new_status"
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="draft">{isTa ? 'வரைவு (தயாரிப்பில்)' : 'Draft (In preparation)'}</option>
              <option value="published">{isTa ? 'வெளியிடப்பட்டது (பொது பார்வைக்கு)' : 'Published (Public)'}</option>
              <option value="closed">{isTa ? 'முடிவடைந்தது (விண்ணப்பங்கள் நிறுத்தம்)' : 'Closed (Intake stopped)'}</option>
              <option value="expired">{isTa ? 'காலாவதியானது (காலக்கெடு முடிந்தது)' : 'Expired (Deadline passed)'}</option>
              <option value="archived">{isTa ? 'காப்பகப்படுத்தப்பட்டது (பாதுகாப்பான காப்பகம்)' : 'Archived (Secure storage)'}</option>
            </select>
          </div>

          <div className="status-impact-box">
            <h5 className="impact-box-title">{isTa ? 'நிலையின் தாக்கம்:' : 'Status Impact:'}</h5>
            <p className="impact-box-desc">{statusDescriptions[selectedStatus]}</p>
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
            className="btn-modal-primary"
            onClick={handleUpdate}
            disabled={submitting || selectedStatus === job.status}
          >
            {submitting
              ? (isTa ? 'புதுப்பிக்கப்படுகிறது...' : 'Updating...')
              : (isTa ? 'நிலை மாற்றத்தை உறுதிப்படுத்து' : 'Confirm Status Change')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusChangeModal;
