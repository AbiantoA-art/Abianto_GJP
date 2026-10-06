import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Format timestamp into relative or readable format in active language
 */
const formatTimestamp = (dateString, isTa) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return isTa ? 'சற்று முன்' : 'Just now';
  if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    return isTa ? `${mins} நிமிடம் முன்` : `${mins}m ago`;
  }
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return isTa ? `${hours} மணி நேரம் முன்` : `${hours}h ago`;
  }
  if (diffSec < 604800) {
    const days = Math.floor(diffSec / 86400);
    return isTa ? `${days} நாள் முன்` : `${days}d ago`;
  }

  try {
    return date.toLocaleDateString(isTa ? 'ta-IN' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
};

/**
 * Renders appropriate SVG icon based on notification type
 */
const NotificationTypeIcon = ({ type }) => {
  switch (type) {
    case 'application_submitted':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      );
    case 'application_status':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <polyline points="16 11 18 13 22 9" />
        </svg>
      );
    case 'new_job':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    case 'study_material':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
        </svg>
      );
    case 'syllabus':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      );
    case 'deadline':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'announcement':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m3 11 18-5v12L3 13v-2z" />
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
      );
    case 'system':
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
  }
};

export const NotificationItem = ({
  notification,
  onMarkRead,
  onArchive,
  compact = false,
  onNavigate,
}) => {
  const navigate = useNavigate();
  const { language, tNotificationType } = useLanguage();
  const isTa = language === 'ta';

  if (!notification) return null;

  const isUnread = !notification.is_read;
  const isUrgent = notification.priority === 'urgent';
  const isHigh = notification.priority === 'high';

  const handleClick = (e) => {
    // If clicked on action buttons, let button handler deal with it
    if (e.target.closest('button')) return;

    if (isUnread && onMarkRead) {
      onMarkRead(notification.id);
    }

    if (notification.action_url) {
      if (onNavigate) onNavigate();
      navigate(notification.action_url);
    }
  };

  const formattedType = tNotificationType(notification.type, language);

  return (
    <div
      className={`gov-notification-item ${isUnread ? 'is-unread' : 'is-read'} ${
        isUrgent ? 'is-urgent' : ''
      } ${compact ? 'is-compact' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e);
        }
      }}
    >
      <div className={`notification-icon-wrapper type-${notification.type || 'system'}`}>
        <NotificationTypeIcon type={notification.type} />
      </div>

      <div className="notification-content-wrapper">
        <div className="notification-meta-row">
          <span className="notification-type-tag">{formattedType}</span>

          {isUrgent && <span className="notification-priority-tag tag-urgent">{isTa ? 'அவசரம்' : 'Urgent'}</span>}
          {isHigh && <span className="notification-priority-tag tag-high">{isTa ? 'உயர் முன்னுரிமை' : 'High Priority'}</span>}

          <span className="notification-timestamp">{formatTimestamp(notification.created_at, isTa)}</span>

          {isUnread && <span className="notification-unread-dot" title={isTa ? 'படிக்காதது' : 'Unread'} />}
        </div>

        <h4 className="notification-title">{notification.title}</h4>

        <p className="notification-message">
          {compact && notification.message?.length > 110
            ? `${notification.message.substring(0, 110)}...`
            : notification.message}
        </p>

        {!compact && (
          <div className="notification-actions-row">
            {notification.action_url && (
              <span className="notification-nav-hint">
                {isTa ? 'விவரங்களைக் காண்க →' : 'View Details →'}
              </span>
            )}

            <div className="notification-button-group">
              {isUnread && onMarkRead && (
                <button
                  type="button"
                  className="btn-notification-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead(notification.id);
                  }}
                  title={isTa ? 'படித்ததாகக் குறிக்கவும்' : 'Mark as read'}
                >
                  {isTa ? 'படித்ததாகக் குறிக்கவும்' : 'Mark as Read'}
                </button>
              )}

              {onArchive && notification.status !== 'archived' && (
                <button
                  type="button"
                  className="btn-notification-action btn-archive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(notification.id);
                  }}
                  title={isTa ? 'அறிவிப்பைக் காப்பகப்படுத்து' : 'Archive notification'}
                >
                  {isTa ? 'காப்பகப்படுத்து' : 'Archive'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
