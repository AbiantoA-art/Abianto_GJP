import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const MaterialStatusBadge = ({ status }) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';
  const normalized = (status || 'draft').toLowerCase();

  const config = {
    published: {
      label: isTa ? 'வெளியிடப்பட்டது' : 'Published',
      className: 'badge-status-published',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    draft: {
      label: isTa ? 'வரைவு' : 'Draft',
      className: 'badge-status-draft',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
    archived: {
      label: isTa ? 'காப்பகப்படுத்தப்பட்டது' : 'Archived',
      className: 'badge-status-archived',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="3" width="18" height="4" rx="1" />
          <path d="M5 7v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      ),
    },
  };

  const current = config[normalized] || config.draft;

  return (
    <span className={`gov-status-badge ${current.className}`}>
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
};

export default MaterialStatusBadge;
