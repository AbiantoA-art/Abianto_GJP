import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  archiveNotification,
} from '../services/api';
import NotificationItem from '../components/notifications/NotificationItem';
import NotificationFilters from '../components/notifications/NotificationFilters';
import NotificationBadge from '../components/notifications/NotificationBadge';

export const Notifications = () => {
  const { token } = useAuth();
  const { language, t } = useLanguage();
  const isTa = language === 'ta';

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('active');
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Map activeTab to API query params
  const getTabQueryParams = (tab) => {
    switch (tab) {
      case 'unread':
        return { is_read: 'false' };
      case 'read':
        return { is_read: 'true' };
      case 'application':
        return { type: 'application_status' };
      case 'new_job':
        return { type: 'new_job' };
      case 'study_material':
        return { type: 'study_material' };
      case 'syllabus':
        return { type: 'syllabus' };
      case 'deadline':
        return { type: 'deadline' };
      case 'announcement':
        return { type: 'announcement' };
      case 'all':
      default:
        return {};
    }
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const tabParams = getTabQueryParams(activeTab);
      const params = {
        page,
        limit: 10,
        search: searchTerm.trim(),
        priority,
        status,
        sort,
        ...tabParams,
      };

      const res = await getUserNotifications(params, token);
      if (res.success) {
        setNotifications(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        setError(res.message || (isTa ? 'அறிவிப்புகளை ஏற்றுவதில் சிக்கல்.' : 'Failed to load notifications.'));
      }

      // Also refresh unread count
      const countRes = await getUnreadNotificationCount(token);
      if (countRes.success) {
        setUnreadCount(countRes.unreadCount);
      }
    } catch (err) {
      setError(err.message || (isTa ? 'அறிவிப்புகளை ஏற்றுவதில் பிணையப் பிழை.' : 'Network error loading notifications.'));
    } finally {
      setLoading(false);
    }
  }, [token, page, activeTab, searchTerm, priority, status, sort, isTa]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Tab switch resets page to 1
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPage(1);
  };

  // Mark single as read
  const handleMarkRead = async (id) => {
    try {
      const res = await markNotificationRead(id, token);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsRead(token);
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Archive notification
  const handleArchive = async (id) => {
    try {
      const res = await archiveNotification(id, token);
      if (res.success) {
        if (status === 'active') {
          // Remove from view if showing only active
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        } else {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, status: 'archived' } : n))
          );
        }
      }
    } catch (err) {
      console.error('Error archiving notification:', err);
    }
  };

  return (
    <div className="gov-page-container notification-center-page">
      {/* Page Header */}
      <div className="notification-center-header">
        <div className="header-title-block">
          <div className="badge-row">
            <span className="gov-breadcrumb-tag">{isTa ? 'வேட்பாளர் தளம்' : 'Candidate Portal'}</span>
            <span className="breadcrumb-separator">/</span>
            <span className="gov-breadcrumb-active">{isTa ? 'அறிவிப்பு மையம்' : 'Notification Center'}</span>
          </div>
          <div className="title-with-badge">
            <h1 className="page-main-heading">{t('notifications.title')}</h1>
            <NotificationBadge count={unreadCount} />
          </div>
          <p className="page-subheading">
            {isTa
              ? 'அரசுப் பணி அறிவிப்புகள், விண்ணப்ப நிலை மாற்றங்கள், தேர்வு பாடத்திட்ட வெளியீடுகள் மற்றும் காலக்கெடு தகவல்களை உடனுக்குடன் தெரிந்துகொள்ளுங்கள்.'
              : 'Stay informed about government job openings, application status changes, syllabus updates, and important deadlines.'}
          </p>
        </div>

        {unreadCount > 0 && (
          <div className="header-actions">
            <button
              type="button"
              className="btn-mark-all-primary"
              onClick={handleMarkAllRead}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {isTa
                ? `அனைத்தையும் படித்ததாகக் குறிக்கவும் (${unreadCount})`
                : `Mark All as Read (${unreadCount})`}
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <NotificationFilters
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setPage(1);
        }}
        priority={priority}
        onPriorityChange={(val) => {
          setPriority(val);
          setPage(1);
        }}
        status={status}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(1);
        }}
        sort={sort}
        onSortChange={(val) => {
          setSort(val);
          setPage(1);
        }}
      />

      {/* Notifications List Container */}
      <div className="notification-list-wrapper">
        {loading ? (
          <div className="notification-loading-card">
            <div className="gov-spinner-md" />
            <p>{isTa ? 'அறிவிப்புகள் ஏற்றப்படுகிறது...' : 'Loading notifications...'}</p>
          </div>
        ) : error ? (
          <div className="gov-error-state-card">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h3>{isTa ? 'அறிவிப்புகளை ஏற்றுவதில் சிக்கல்' : 'Failed to load notifications'}</h3>
            <p>{error}</p>
            <button
              type="button"
              className="btn-gov-retry"
              onClick={fetchNotifications}
            >
              {isTa ? 'மீண்டும் முயற்சிக்கவும்' : 'Try Again'}
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="gov-empty-state-card">
            <div className="empty-icon-circle">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </div>
            <h3>{isTa ? 'அறிவிப்புகள் எதுவும் கிடைக்கவில்லை' : 'No Notifications Found'}</h3>
            <p>
              {searchTerm || priority || activeTab !== 'all'
                ? (isTa ? 'தேர்வு செய்த வடிப்பான்களுக்கு ஏற்ப அறிவிப்புகள் எதுவும் இல்லை.' : 'No notifications match your selected filters.')
                : (isTa ? 'தற்போது உங்களுக்குப் புதிய அறிவிப்புகள் எதுவும் இல்லை.' : 'You have no notifications at this time.')}
            </p>
            {(searchTerm || priority || activeTab !== 'all') && (
              <button
                type="button"
                className="btn-gov-secondary"
                onClick={() => {
                  setActiveTab('all');
                  setSearchTerm('');
                  setPriority('');
                  setPage(1);
                }}
              >
                {isTa ? 'வடிப்பான்களை அழிக்கவும்' : 'Clear Filters'}
              </button>
            )}
          </div>
        ) : (
          <div className="gov-notifications-feed">
            {notifications.map((item) => (
              <NotificationItem
                key={item.id}
                notification={item}
                onMarkRead={handleMarkRead}
                onArchive={handleArchive}
                compact={false}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && pagination.totalPages > 1 && (
          <div className="gov-pagination-bar">
            <span className="pagination-info">
              {isTa
                ? `பக்கம் ${pagination.page} / ${pagination.totalPages} (மொத்தம் ${pagination.total} அறிவிப்புகள்)`
                : `Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} total notifications)`}
            </span>

            <div className="pagination-buttons">
              <button
                type="button"
                className="btn-pagination-nav"
                disabled={pagination.page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                {isTa ? '← முந்தையது' : '← Previous'}
              </button>

              <span className="pagination-current-page">{pagination.page}</span>

              <button
                type="button"
                className="btn-pagination-nav"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              >
                {isTa ? 'அடுத்தது →' : 'Next →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
