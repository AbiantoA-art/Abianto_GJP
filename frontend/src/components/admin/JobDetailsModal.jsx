import React from 'react';
import { StatusBadge } from '../StatusBadge';
import { useLanguage } from '../../context/LanguageContext';

export const JobDetailsModal = ({ isOpen, onClose, job, onEdit, onChangeStatus, onArchive }) => {
  const { language, t, tCategory, tJobGroup } = useLanguage();
  const isTa = language === 'ta';

  if (!isOpen || !job) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-container admin-modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-modal-header">
          <div>
            <div className="job-detail-top-badges">
              <span className="table-code">{job.job_code}</span>
              <StatusBadge status={job.status} />
              <span className="badge-chip-cat">{tCategory(job.category?.name)}</span>
              {job.job_group && (
                <span className="badge-chip-cat" style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', borderColor: 'var(--color-primary-border)' }}>
                  {tJobGroup(job.job_group)}
                </span>
              )}
            </div>
            <h2 className="admin-modal-title" style={{ marginTop: '0.4rem' }}>{job.title}</h2>
            <p className="admin-modal-subtitle">
              {job.organization} {job.department ? `• ${job.department}` : ''}
            </p>
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label={isTa ? 'மூடு' : 'Close'}>
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="admin-modal-body">
          {/* Quick Metrics Bar */}
          <div className="job-quick-stat-bar">
            <div className="stat-pill">
              <span className="stat-pill-label">{t('jobs.vacancies')}</span>
              <span className="stat-pill-val">{job.vacancies?.toLocaleString(isTa ? 'ta-IN' : 'en-US') || 0}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-label">{t('jobs.salary')}</span>
              <span className="stat-pill-val">{job.salary || (isTa ? 'விதிகளின்படி' : 'As per rules')}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-label">{t('jobs.location')}</span>
              <span className="stat-pill-val">{job.location || (isTa ? 'இந்தியா முழுவதும்' : 'All India')}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-label">{t('jobs.lastDate')}</span>
              <span className="stat-pill-val text-warning">{job.last_date || (isTa ? 'திறந்துள்ளது' : 'Open')}</span>
            </div>
          </div>

          {/* Description */}
          <div className="job-detail-block">
            <h4 className="detail-block-title">{isTa ? 'அறிவிப்பு விளக்கம்' : 'Notification Overview'}</h4>
            <div className="detail-block-text">{job.description}</div>
          </div>

          {/* Detailed Specifications Grid */}
          <div className="detail-spec-grid">
            <div className="spec-item">
              <span className="spec-label">{t('jobs.qualification')}</span>
              <span className="spec-value">{job.qualification || (isTa ? 'அதிகாரப்பூர்வ அறிவிப்பைப் பார்க்கவும்' : 'Refer official notification')}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">{t('jobs.ageLimit')}</span>
              <span className="spec-value">{job.age_limit || (isTa ? 'அதிகாரப்பூர்வ அறிவிப்பைப் பார்க்கவும்' : 'Refer official notification')}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">{t('jobs.experience')}</span>
              <span className="spec-value">{job.experience || (isTa ? 'புதியவர் / அனுபவம் வாய்ந்தவர்' : 'Fresher / Experienced')}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">{t('jobs.applicationFee')}</span>
              <span className="spec-value">{job.application_fee || (isTa ? 'குறிப்பிடப்படவில்லை' : 'Not specified')}</span>
            </div>
            {job.job_group && (
              <div className="spec-item">
                <span className="spec-label">{isTa ? 'பணி குழு' : 'Job Group'}</span>
                <span className="spec-value">{tJobGroup(job.job_group)}</span>
              </div>
            )}
            <div className="spec-item">
              <span className="spec-label">{isTa ? 'தொடக்க தேதி' : 'Opening Date'}</span>
              <span className="spec-value">{job.opening_date || (isTa ? 'உடனடியாக' : 'Immediate')}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">{isTa ? 'கடைசி தேதி' : 'Closing Date'}</span>
              <span className="spec-value">{job.last_date || (isTa ? 'முடிவடையும் வரை' : 'Until Filled')}</span>
            </div>
          </div>

          {/* Selection & Documents */}
          <div className="detail-spec-grid" style={{ marginTop: '1rem' }}>
            <div className="spec-item full-width-spec">
              <span className="spec-label">{t('jobs.selectionProcess')}</span>
              <span className="spec-value">{job.selection_process || (isTa ? 'எழுத்துத் தேர்வு / நேர்காணல்' : 'Written Exam / Interview')}</span>
            </div>
            <div className="spec-item full-width-spec">
              <span className="spec-label">{t('jobs.requiredDocuments')}</span>
              <span className="spec-value">{job.required_documents || (isTa ? 'புகைப்பட அடையாள அட்டை, பட்டப்படிப்பு சான்றிதழ்கள், இடஒதுக்கீடு சான்றிதழ்' : 'Photo ID, Degree Certificates, Category Certificate')}</span>
            </div>
          </div>

          {/* Official URLs */}
          <div className="job-detail-block" style={{ marginTop: '1.25rem' }}>
            <h4 className="detail-block-title">{isTa ? 'அதிகாரப்பூர்வ ஆட்சேர்ப்பு இணைப்புகள்' : 'Official Recruitment Links'}</h4>
            <div className="detail-links-row">
              {job.notification_url ? (
                <a
                  href={job.notification_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="official-doc-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span>{isTa ? 'அதிகாரப்பூர்வ அறிவிப்பு PDF பதிவிறக்கம்' : 'Download Official Notification PDF'}</span>
                </a>
              ) : (
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                  {isTa ? 'அதிகாரப்பூர்வ அறிவிப்பு இணைப்பு வழங்கப்படவில்லை' : 'No official notification link provided'}
                </span>
              )}

              {job.apply_url ? (
                <a
                  href={job.apply_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="official-apply-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  <span>{isTa ? 'விண்ணப்ப தளத்தைப் பார்வையிடுக' : 'Visit Application Portal'}</span>
                </a>
              ) : (
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                  {isTa ? 'நேரடி விண்ணப்ப இணைய முகவரி வழங்கப்படவில்லை' : 'No direct apply URL provided'}
                </span>
              )}
            </div>
          </div>

          {/* Administrative Audit Metadata */}
          <div className="admin-audit-box">
            <h4 className="audit-box-title">{isTa ? 'கணினி தணிக்கை பதிவு' : 'Administrative Audit Log'}</h4>
            <div className="audit-fields-grid">
              <div>
                <span className="audit-field-label">{isTa ? 'உருவாக்கிய நிர்வாகி:' : 'Created by Admin:'}</span>
                <span className="audit-field-val">
                  {job.creator ? `${job.creator.name} (${job.creator.email})` : (isTa ? `பயனர் எண் #${job.created_by}` : `User #${job.created_by}`)}
                </span>
              </div>
              <div>
                <span className="audit-field-label">{isTa ? 'உருவாக்கப்பட்ட தேதி:' : 'Created Date:'}</span>
                <span className="audit-field-val">
                  {job.created_at ? new Date(job.created_at).toLocaleString(isTa ? 'ta-IN' : 'en-US') : '—'}
                </span>
              </div>
              <div>
                <span className="audit-field-label">{isTa ? 'கடைசியாக மாற்றப்பட்டது:' : 'Last Updated:'}</span>
                <span className="audit-field-val">
                  {job.updated_at ? new Date(job.updated_at).toLocaleString(isTa ? 'ta-IN' : 'en-US') : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="admin-modal-footer">
          <button type="button" className="btn-modal-cancel" onClick={onClose}>
            {isTa ? 'மூடு' : 'Close'}
          </button>

          <button
            type="button"
            className="btn-modal-secondary"
            onClick={() => {
              onClose();
              onChangeStatus(job);
            }}
          >
            {isTa ? 'நிலை மாற்று' : 'Change Status'}
          </button>

          <button
            type="button"
            className="btn-modal-primary"
            onClick={() => {
              onClose();
              onEdit(job);
            }}
          >
            {isTa ? 'பணியைத் திருத்து' : 'Edit Job'}
          </button>

          {job.status !== 'archived' && (
            <button
              type="button"
              className="btn-modal-danger"
              onClick={() => {
                onClose();
                onArchive(job);
              }}
            >
              {t('admin.archive')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal;
