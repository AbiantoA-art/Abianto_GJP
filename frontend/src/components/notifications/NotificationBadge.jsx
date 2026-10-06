import React from 'react';

/**
 * Visual badge pill for unread notification count
 */
export const NotificationBadge = ({ count = 0, urgent = false, className = '' }) => {
  if (!count || count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count;

  return (
    <span
      className={`gov-notification-badge ${urgent ? 'badge-urgent' : ''} ${className}`}
      title={`${count} unread notification${count > 1 ? 's' : ''}`}
      aria-label={`${count} unread notification${count > 1 ? 's' : ''}`}
    >
      {displayCount}
    </span>
  );
};

export default NotificationBadge;
