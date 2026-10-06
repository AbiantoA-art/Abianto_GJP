import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const JobCard = ({ job, featured = false }) => {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const { t, tCategory, tStatus, tJobGroup, isTamil } = useLanguage();

  if (!job) return null;

  // Extract attributes with support for both database and legacy mock structures
  const categoryRaw = job.category?.name || job.category_name || job.category || 'Government Job';
  const categoryName = tCategory(categoryRaw);
  const vacanciesCount = job.vacancies ?? 0;
  const lastDateFormatted = job.last_date || job.dates?.lastDate || (isTamil ? 'அறிவிப்பைப் பார்க்கவும்' : 'Refer Notification');

  // Compute deadline proximity if valid last_date
  let isClosingSoon = Boolean(job.isClosingSoon);
  if (job.last_date && !job.isClosingSoon) {
    try {
      const deadline = new Date(job.last_date).getTime();
      const now = new Date().getTime();
      const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      if (daysRemaining >= 0 && daysRemaining <= 7) {
        isClosingSoon = true;
      }
    } catch {}
  }

  return (
    <>
      <article className={`gov-job-card ${featured ? 'job-card-featured' : ''}`}>
        {/* Top Badges & Meta Row */}
        <div className="job-card-top">
          <div className="job-card-badges">
            <span className="category-pill">{categoryName}</span>
            {job.job_group && (
              <span className="category-pill job-group-pill">{tJobGroup(job.job_group)}</span>
            )}
            {job.job_code && (
              <span className="job-code-badge" title="Official Job Notification Code">
                {job.job_code}
              </span>
            )}
            {isClosingSoon && (
              <span className="deadline-alert-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {t('closingSoonBadge')}
              </span>
            )}
            <span className="status-pill-published">{tStatus('published')}</span>
          </div>
          <div className="job-vacancies-chip">
            <span className="vacancies-count">{vacanciesCount}</span>
            <span className="vacancies-label">{t('posts')}</span>
          </div>
        </div>

        {/* Title, Organization & Department */}
        <div className="job-card-heading">
          <h3 className="job-title">
            <Link to={`/jobs/${job.id}`} className="job-title-link">
              {job.title}
            </Link>
          </h3>
          <div className="job-organization">
            <svg className="meta-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M9 11h.01M9 15h.01M15 11h.01M15 15h.01" />
            </svg>
            <span className="org-name-text">{job.organization}</span>
            {job.department && (
              <span className="dept-tag">• {job.department}</span>
            )}
          </div>
        </div>

        {/* Key Specifications Grid */}
        <div className="job-specs-grid">
          <div className="job-spec-item spec-location">
            <span className="spec-label">{t('location')}</span>
            <span className="spec-value location-value" title={job.location || 'All India'}>
              <svg className="spec-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{job.location || (isTamil ? 'அனைத்திந்தியா' : 'All India')}</span>
            </span>
          </div>

          <div className="job-spec-item spec-qualification">
            <span className="spec-label">{t('qualification')}</span>
            <span className="spec-value qualification-value" title={job.qualification || 'As per official rules'}>
              <svg className="spec-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              </svg>
              <span>{job.qualification || (isTamil ? 'விதிகளின்படி' : 'As per rules')}</span>
            </span>
          </div>

          <div className="job-spec-item spec-salary">
            <span className="spec-label">{t('salary')}</span>
            <span className="spec-value salary-value" title={job.salary || 'As per official rules'}>
              <svg className="spec-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <span>{job.salary || (isTamil ? 'அரசு ஊதிய விதிகளின்படி' : 'As per govt pay rules')}</span>
            </span>
          </div>

          <div className="job-spec-item deadline-spec spec-deadline">
            <span className="spec-label">{t('lastDate')}</span>
            <span className={`spec-value ${isClosingSoon ? 'deadline-value' : ''}`}>
              <svg className="spec-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{lastDateFormatted}</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="job-card-actions">
          <Link to={`/jobs/${job.id}`} className="btn-job-action btn-view-details">
            <span>{t('viewDetails')}</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <Link
            to={`/jobs/${job.id}/apply`}
            className="btn-job-action btn-apply-now"
          >
            {t('apply')}
          </Link>
        </div>
      </article>

      {/* Informational Apply Modal */}
      {showApplyModal && (
        <div className="modal-backdrop" onClick={() => setShowApplyModal(false)}>
          <div
            className="gov-card apply-notice-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="apply-modal-title"
          >
            <div className="apply-modal-header">
              <div className="apply-modal-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div>
                <h3 id="apply-modal-title" className="apply-modal-title">
                  {isTamil ? 'விண்ணப்ப அறிவிப்பு' : 'Application Notice'}
                </h3>
                <span className="apply-modal-code">{job.job_code}</span>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setShowApplyModal(false)}
                aria-label={isTamil ? 'மூடவும்' : 'Close dialog'}
              >
                ✕
              </button>
            </div>

            <div className="apply-modal-body">
              <p className="apply-modal-heading">
                {isTamil ? 'நீங்கள் தேர்வு செய்தது: ' : 'You selected: '}
                <strong>{job.title}</strong> — <strong>{job.organization}</strong>.
              </p>
              {job.apply_url && (
                <div className="external-apply-link-box">
                  <p>{isTamil ? 'அதிகாரப்பூர்வ விண்ணப்பத் தளம்:' : 'External recruitment portal provided by the ministry:'}</p>
                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="external-portal-link"
                  >
                    <span>{isTamil ? 'அதிகாரப்பூர்வ தளத்திற்குச் செல்லவும்' : 'Visit Official Ministry Portal'}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              )}
            </div>

            <div className="apply-modal-footer">
              <Link
                to={`/jobs/${job.id}`}
                className="btn-view-full-details"
                onClick={() => setShowApplyModal(false)}
              >
                {t('viewDetails')}
              </Link>
              <button
                type="button"
                className="btn-close-notice"
                onClick={() => setShowApplyModal(false)}
              >
                {isTamil ? 'மூடவும்' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JobCard;
