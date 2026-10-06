import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Standard Status Badge for Candidate Applications
 * Supports: submitted, under_review, shortlisted, rejected, selected, withdrawn
 */
export const ApplicationStatusBadge = ({ status }) => {
  const { tStatus } = useLanguage();
  const normalized = (status || 'submitted').toLowerCase();

  const configs = {
    submitted: {
      className: 'app-badge app-badge-submitted',
      icon: '✓',
    },
    under_review: {
      className: 'app-badge app-badge-review',
      icon: '⏳',
    },
    shortlisted: {
      className: 'app-badge app-badge-shortlisted',
      icon: '★',
    },
    rejected: {
      className: 'app-badge app-badge-rejected',
      icon: '✕',
    },
    selected: {
      className: 'app-badge app-badge-selected',
      icon: '🏆',
    },
    withdrawn: {
      className: 'app-badge app-badge-withdrawn',
      icon: '↩',
    },
  };

  const current = configs[normalized] || {
    className: 'app-badge app-badge-submitted',
    icon: '•',
  };

  return (
    <span className={current.className}>
      <span className="app-badge-icon" aria-hidden="true">{current.icon}</span>
      <span>{tStatus(normalized)}</span>
    </span>
  );
};

export default ApplicationStatusBadge;
