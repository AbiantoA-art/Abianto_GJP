import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const StatusBadge = ({ status, variant = 'neutral' }) => {
  const { tStatus } = useLanguage();
  let computedVariant = variant;
  const s = String(status || '').toLowerCase();

  if (s.includes('active') || s.includes('admit') || s.includes('approved') || s.includes('selected') || s.includes('paid')) {
    computedVariant = 'success';
  } else if (s.includes('closing') || s.includes('scrutiny') || s.includes('review') || s.includes('pending') || s.includes('warning')) {
    computedVariant = 'warning';
  } else if (s.includes('expired') || s.includes('rejected') || s.includes('closed')) {
    computedVariant = 'danger';
  } else if (s.includes('new') || s.includes('submitted') || s.includes('info')) {
    computedVariant = 'info';
  }

  const displayStatus = tStatus(status) || status;

  return (
    <span className={`status-badge-chip status-${computedVariant}`}>
      <span className="badge-dot" />
      <span className="badge-text">{displayStatus}</span>
    </span>
  );
};

export default StatusBadge;
