import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import NotificationItem from './NotificationItem';
import NotificationBadge from './NotificationBadge';

export const NotificationDropdown = ({
  notifications = [],
  unreadCount = 0,
  loading = false,
  onMarkRead,
  onMarkAllRead,
  onClose,
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const handleViewAll = () => {
    if (onClose) onClose();
    navigate('/notifications');
  };

  return (
    <div className="gov-notification-dropdown" role="menu" aria-label={isTa ? 'அறிவிப்புகள் பட்டியல்' : 'Notifications list'}>
      {/* Header */}
      <div className="notification-dropdown-header">
        <div className="dropdown-title-group">
          <span className="dropdown-title">{isTa ? 'அறிவிப்புகள்' : 'Notifications'}</span>
          <NotificationBadge count={unreadCount} />
        </div>

        {unreadCount > 0 && onMarkAllRead && (
          <button
            type="button"
            className="btn-mark-all-inline"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAllRead();
            }}
            title={isTa ? 'அனைத்து அறிவிப்புகளையும் படித்ததாகக் குறிக்கவும்' : 'Mark all notifications as read'}
          >
            {isTa ? 'அனைத்தையும் படித்ததாகக் குறிக்கவும்' : 'Mark all as read'}
          </button>
        )}
      </div>

      {/* Content Body */}
      <div className="notification-dropdown-body">
        {loading ? (
          <div className="dropdown-loading-state">
            <div className="gov-spinner-sm" />
            <span>{isTa ? 'அறிவிப்புகள் ஏற்றப்படுகிறது...' : 'Loading notifications...'}</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="dropdown-empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <p>{isTa ? 'அறிவிப்புகள் எதுவும் இல்லை' : 'No notifications'}</p>
            <span className="empty-subtext">
              {isTa ? 'அனைத்து அறிவிப்புகளையும் நீங்கள் பார்த்துவிட்டீர்கள்!' : "You're all caught up!"}
            </span>
          </div>
        ) : (
          <div className="dropdown-items-list">
            {notifications.slice(0, 6).map((item) => (
              <NotificationItem
                key={item.id}
                notification={item}
                compact={true}
                onMarkRead={onMarkRead}
                onNavigate={onClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="notification-dropdown-footer">
        <button
          type="button"
          onClick={handleViewAll}
          className="btn-view-all-notifications"
        >
          {isTa ? 'அனைத்து அறிவிப்புகளையும் காண்க →' : 'View All Notifications →'}
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
