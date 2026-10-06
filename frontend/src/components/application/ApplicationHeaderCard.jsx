import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * ApplicationHeaderCard Component
 * Displays recruitment job summary, organization, job code, deadline,
 * vacancy details, and live progress bar for the candidate application.
 */
export const ApplicationHeaderCard = ({
  job,
  progressPercentage = 0,
  completedStepsCount = 0,
  totalSteps = 8,
  currentStep = 1,
}) => {
  const { isTamil } = useLanguage();

  if (!job) return null;

  // Format deadline and vacancies
  const vacancyCount = Number(job.vacancies || 0).toLocaleString(isTamil ? 'ta-IN' : 'en-US');

  return (
    <div className="gov-card app-header-summary-card">
      <div className="app-header-top-row">
        <div className="app-header-identity">
          <div className="app-header-badge-row">
            <span className="app-portal-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <span>{isTamil ? 'அதிகாரப்பூர்வ நேரடித் தேர்வு விண்ணப்பம்' : 'Official Direct Recruitment Application'}</span>
            </span>

            <span className="app-status-indicator-pill">
              <span className="app-status-pulse-dot" aria-hidden="true" />
              <span>{isTamil ? 'படிவம் நிரப்பப்படுகிறது' : 'In Progress'}</span>
            </span>
          </div>

          <h1 className="app-job-title">{job.title}</h1>

          <div className="app-org-meta">
            <span className="app-org-name">{job.organization}</span>
            {job.department && (
              <>
                <span className="meta-separator">•</span>
                <span className="app-dept-name">{job.department}</span>
              </>
            )}
            <span className="meta-separator">•</span>
            <span className="app-code-badge">
              <span className="app-code-label">{isTamil ? 'பணி குறியீடு:' : 'Job Code:'}</span>
              <code>{job.job_code}</code>
            </span>
          </div>
        </div>

        <div className="app-header-stat-group">
          <div className="app-stat-chip deadline-chip">
            <div className="stat-chip-label">{isTamil ? 'கடைசி தேதி' : 'Last Date'}</div>
            <div className="stat-chip-value deadline-val">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{job.last_date}</span>
            </div>
          </div>

          <div className="app-stat-chip vacancies-chip">
            <div className="stat-chip-label">{isTamil ? 'காலிப்பணியிடங்கள்' : 'Vacancies'}</div>
            <div className="stat-chip-value vacancies-val">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>{vacancyCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar Section */}
      <div className="app-header-progress-wrap">
        <div className="app-progress-meta-row">
          <div className="app-progress-label">
            <span className="progress-title">{isTamil ? 'விண்ணப்ப முன்னேற்றம்' : 'Application Progress'}</span>
            <span className="progress-step-text">
              {isTamil
                ? `(படி ${currentStep} / ${totalSteps} • ${completedStepsCount} பிரிவுகள் பூர்த்தி செய்யப்பட்டன)`
                : `(Step ${currentStep} of ${totalSteps} • ${completedStepsCount} sections complete)`}
            </span>
          </div>
          <div className="app-progress-percentage" aria-live="polite">
            {progressPercentage}%
          </div>
        </div>

        <div
          className="app-progress-track"
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label={isTamil ? 'விண்ணப்ப முன்னேற்றப் பட்டை' : 'Application progress bar'}
        >
          <div
            className="app-progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ApplicationHeaderCard;
