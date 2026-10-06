import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  getAdminNotifications,
  getAdminNotificationStats,
  createAdminAnnouncement,
  archiveAdminNotification,
  triggerAdminDeadlineAlerts,
  getCategories,
} from '../services/api';

export const AdminNotifications = () => {
  const { token } = useAuth();
  const { language, t, tCategory, tNotificationType } = useLanguage();
  const isTa = language === 'ta';

  // Metrics
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    active: 0,
    archived: 0,
    announcements: 0,
    applicationStatus: 0,
    newJobs: 0,
    deadlines: 0,
    urgent: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Notifications List State
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Categories for targeted announcement
  const [categories, setCategories] = useState([]);

  // Modal States
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    priority: 'high',
    scope: 'all',
    category_id: '',
    candidate_id: '',
    action_url: '',
  });
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);
  const [announcementFeedback, setAnnouncementFeedback] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Deadline Trigger State
  const [triggeringDeadlines, setTriggeringDeadlines] = useState(false);
  const [deadlineFeedback, setDeadlineFeedback] = useState(null);

  // Load stats
  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getAdminNotificationStats(token);
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  // Load notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminNotifications(
        {
          page,
          limit: 10,
          search: search.trim(),
          type,
          priority,
          status,
          sort: 'latest',
        },
        token
      );

      if (res.success) {
        setNotifications(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        setError(res.message || (isTa ? 'நிர்வாக அறிவிப்புகளைப் பெறுவதில் பிழை.' : 'Failed to retrieve admin notifications.'));
      }
    } catch (err) {
      setError(err.message || (isTa ? 'நிர்வாக அறிவிப்புகளைப் பெறுவதில் பிணையப் பிழை.' : 'Network error fetching admin notifications.'));
    } finally {
      setLoading(false);
    }
  }, [token, page, search, type, priority, status, isTa]);

  // Load categories once
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategories();
        if (res.success) {
          setCategories(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    fetchStats();
    fetchNotifications();
  }, [fetchStats, fetchNotifications]);

  // Handle Archive
  const handleArchive = async (id) => {
    const confirmMsg = isTa
      ? 'இந்த அறிவிப்பைக் காப்பகப்படுத்த விரும்புகிறீர்களா?'
      : 'Are you sure you want to archive this notification?';
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await archiveAdminNotification(id, token);
      if (res.success) {
        fetchNotifications();
        fetchStats();
      }
    } catch (err) {
      console.error('Error archiving notification:', err);
    }
  };

  // Submit announcement
  const handleSendAnnouncement = async () => {
    setShowConfirmModal(false);
    setSubmittingAnnouncement(true);
    setAnnouncementFeedback(null);

    try {
      const payload = {
        title: announcementForm.title,
        message: announcementForm.message,
        priority: announcementForm.priority,
        scope: announcementForm.scope,
        action_url: announcementForm.action_url || null,
      };

      if (announcementForm.scope === 'category') {
        payload.category_id = parseInt(announcementForm.category_id, 10);
      } else if (announcementForm.scope === 'single') {
        payload.candidate_id = parseInt(announcementForm.candidate_id, 10);
      }

      const res = await createAdminAnnouncement(payload, token);
      if (res.success) {
        setAnnouncementFeedback({
          type: 'success',
          message: isTa
            ? `பொது அறிவிப்பு வெற்றிகரமாக ஒளிபரப்பப்பட்டது! ${res.data?.count || 0} வேட்பாளர்களுக்கு அனுப்பப்பட்டது.`
            : `Announcement broadcast successfully sent to ${res.data?.count || 0} candidate(s).`,
        });
        setAnnouncementForm({
          title: '',
          message: '',
          priority: 'high',
          scope: 'all',
          category_id: '',
          candidate_id: '',
          action_url: '',
        });
        fetchNotifications();
        fetchStats();
        setTimeout(() => {
          setShowAnnouncementModal(false);
          setAnnouncementFeedback(null);
        }, 2000);
      } else {
        setAnnouncementFeedback({
          type: 'error',
          message: res.message || (isTa ? 'பொது அறிவிப்பை அனுப்ப முடியவில்லை.' : 'Failed to send announcement.'),
        });
      }
    } catch (err) {
      setAnnouncementFeedback({
        type: 'error',
        message: err.message || (isTa ? 'அறிவிப்பை அனுப்புவதில் நெட்வொர்க் பிழை ஏற்பட்டது.' : 'Network error sending announcement.'),
      });
    } finally {
      setSubmittingAnnouncement(false);
    }
  };

  // Trigger Deadlines
  const handleTriggerDeadlines = async () => {
    const confirmMsg = isTa
      ? 'காலக்கெடு எச்சரிக்கைகள் ஸ்கேனை இயக்கவா? இது 7, 3 அல்லது 1 நாட்களில் முடிவடையும் செயலில் உள்ள காலியிடங்களை ஆய்வு செய்து விழிப்பூட்டல்களை அனுப்பும்.'
      : 'Trigger deadline alert scan? This checks active jobs expiring in 7, 3, or 1 days and issues notifications.';
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setTriggeringDeadlines(true);
    setDeadlineFeedback(null);
    try {
      const res = await triggerAdminDeadlineAlerts(token);
      if (res.success) {
        setDeadlineFeedback({
          type: 'success',
          message: res.message || (isTa ? 'காலக்கெடு எச்சரிக்கை சரிபார்ப்பு வெற்றிகரமாக முடிந்தது.' : 'Deadline scan completed successfully.'),
        });
        fetchNotifications();
        fetchStats();
      } else {
        setDeadlineFeedback({
          type: 'error',
          message: res.message || (isTa ? 'காலக்கெடு எச்சரிக்கைகளை ஆய்வு செய்ய முடியவில்லை.' : 'Failed to process deadline alerts.'),
        });
      }
    } catch (err) {
      setDeadlineFeedback({
        type: 'error',
        message: err.message || (isTa ? 'காலக்கெடு ஸ்கேனை இயக்குவதில் நெட்வொர்க் பிழை ஏற்பட்டது.' : 'Network error triggering deadline scan.'),
      });
    } finally {
      setTriggeringDeadlines(false);
    }
  };

  return (
    <div className="gov-page-container admin-notifications-page">
      {/* Top Breadcrumb & Heading */}
      <div className="admin-header-strip">
        <div className="header-meta">
          <span className="gov-breadcrumb-tag">{isTa ? 'நிர்வாக கன்சோல்' : 'Admin Console'}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="gov-breadcrumb-active">{isTa ? 'அறிவிப்புகள் & தகவல்கள்' : 'Notifications & Alerts'}</span>
          <h1 className="admin-main-title">{isTa ? 'கணினி அறிவிப்புகள் & பொதுத் தகவல்கள்' : 'System Notifications & Announcements'}</h1>
          <p className="admin-sub-title">
            {isTa
              ? 'வேட்பாளர்களுக்கு அதிகாரப்பூர்வ விழிப்பூட்டல்களை அனுப்புதல், விண்ணப்ப சுழற்சி அறிவிப்புகளைக் கண்காணித்தல் மற்றும் தளம் தழுவிய பொது அறிவிப்புகளை நிர்வகித்தல்.'
              : 'Broadcast announcements to candidates, track lifecycle notifications, and manage platform alerts.'}
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="btn-admin-action btn-secondary"
            onClick={handleTriggerDeadlines}
            disabled={triggeringDeadlines}
            title={isTa ? 'முடிவடையும் காலியிடங்களை ஆய்வு செய்து 7d, 3d, 1d விழிப்பூட்டல்களை அனுப்பவும்' : 'Scan expiring jobs and send 7d, 3d, 1d alerts'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {triggeringDeadlines
              ? (isTa ? 'காலக்கெடு ஆய்வு செய்யப்படுகிறது...' : 'Scanning deadlines...')
              : (isTa ? 'காலக்கெடு ஸ்கேன் இயக்கு' : 'Run Deadline Scan')}
          </button>

          <button
            type="button"
            className="btn-admin-action btn-primary"
            onClick={() => setShowAnnouncementModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 11 18-5v12L3 13v-2z" />
              <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
            </svg>
            {isTa ? 'அறிவிப்பு உருவாக்கவும்' : 'Create Announcement'}
          </button>
        </div>
      </div>

      {/* Deadline Feedback Banner */}
      {deadlineFeedback && (
        <div className={`gov-alert-banner ${deadlineFeedback.type}`}>
          <span>{deadlineFeedback.message}</span>
          <button
            type="button"
            className="alert-close-btn"
            onClick={() => setDeadlineFeedback(null)}
          >
            &times;
          </button>
        </div>
      )}

      {/* Statistics Cards Grid */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <span className="stat-label">{isTa ? 'மொத்த அறிவிப்புகள்' : 'Total Notifications'}</span>
          <span className="stat-value">{statsLoading ? '...' : stats.total}</span>
          <span className="stat-sub">{isTa ? 'தளம் முழுவதும்' : 'Platform-wide'}</span>
        </div>

        <div className="stat-card highlight-urgent">
          <span className="stat-label">{isTa ? 'அவசரம் / அதிக முன்னுரிமை' : 'Urgent / High Priority'}</span>
          <span className="stat-value">{statsLoading ? '...' : stats.urgent}</span>
          <span className="stat-sub">{isTa ? 'வேட்பாளர் நடவடிக்கை தேவை' : 'Action required'}</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">{isTa ? 'பொது அறிவிப்புகள்' : 'Announcements'}</span>
          <span className="stat-value">{statsLoading ? '...' : stats.announcements}</span>
          <span className="stat-sub">{isTa ? 'ஒளிபரப்பப்பட்டவை' : 'Broadcasted'}</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">{isTa ? 'காலக்கெடு அறிவிப்புகள்' : 'Deadline Alerts'}</span>
          <span className="stat-value">{statsLoading ? '...' : stats.deadlines}</span>
          <span className="stat-sub">{isTa ? 'முடிவு நெருங்குபவை' : 'Upcoming deadlines'}</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">{isTa ? 'வேட்பாளர்களால் படிக்கப்படாதவை' : 'Unread by Candidates'}</span>
          <span className="stat-value">{statsLoading ? '...' : stats.unread}</span>
          <span className="stat-sub">{isTa ? 'படிக்கப்படாமல் உள்ளவை' : 'Pending read'}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-filters-card">
        <div className="filter-item search-grow">
          <label>{isTa ? 'அறிவிப்புகளைத் தேடுக' : 'Search Notifications'}</label>
          <div className="input-with-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder={isTa ? 'தலைப்பு, செய்தி அல்லது மின்னஞ்சல் மூலம் தேடுக...' : 'Search by title, message, or email...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="gov-text-input"
            />
          </div>
        </div>

        <div className="filter-item">
          <label>{isTa ? 'அறிவிப்பு வகை' : 'Notification Type'}</label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="gov-select-control"
          >
            <option value="">{isTa ? 'அனைத்து வகைகள்' : 'All Types'}</option>
            <option value="announcement">{isTa ? 'பொது அறிவிப்பு' : 'Announcement'}</option>
            <option value="application_status">{isTa ? 'விண்ணப்ப நிலை' : 'Application Status'}</option>
            <option value="application_submitted">{isTa ? 'விண்ணப்பம் சமர்ப்பிக்கப்பட்டது' : 'Application Submitted'}</option>
            <option value="new_job">{isTa ? 'புதிய வேலைவாய்ப்பு' : 'New Job'}</option>
            <option value="study_material">{isTa ? 'படிப்பு வளங்கள்' : 'Study Material'}</option>
            <option value="syllabus">{isTa ? 'பாடத்திட்டம்' : 'Syllabus'}</option>
            <option value="deadline">{isTa ? 'காலக்கெடு அறிவிப்பு' : 'Deadline Alert'}</option>
            <option value="system">{isTa ? 'கணினி அறிவிப்பு' : 'System Alert'}</option>
          </select>
        </div>

        <div className="filter-item">
          <label>{isTa ? 'முன்னுரிமை' : 'Priority'}</label>
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            className="gov-select-control"
          >
            <option value="">{isTa ? 'அனைத்து முன்னுரிமைகள்' : 'All Priorities'}</option>
            <option value="urgent">{isTa ? 'அவசரம்' : 'Urgent'}</option>
            <option value="high">{isTa ? 'உயர்' : 'High'}</option>
            <option value="normal">{isTa ? 'சாதாரண' : 'Normal'}</option>
            <option value="low">{isTa ? 'குறைவு' : 'Low'}</option>
          </select>
        </div>

        <div className="filter-item">
          <label>{isTa ? 'நிலை' : 'Status'}</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="gov-select-control"
          >
            <option value="active">{isTa ? 'செயலில்' : 'Active'}</option>
            <option value="archived">{isTa ? 'காப்பகப்படுத்தப்பட்டது' : 'Archived'}</option>
            <option value="all">{isTa ? 'அனைத்தும்' : 'All'}</option>
          </select>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="admin-table-container">
        {loading ? (
          <div className="table-loading-card">
            <div className="gov-spinner-md" />
            <p>{isTa ? 'தளத்தின் அறிவிப்புகள் ஏற்றப்படுகின்றன...' : 'Loading notifications...'}</p>
          </div>
        ) : error ? (
          <div className="gov-error-state-card">
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
            <h3>{isTa ? 'அறிவிப்புகள் எதுவும் கிடைக்கவில்லை' : 'No Notifications Found'}</h3>
            <p>{isTa ? 'தேர்ந்தெடுக்கப்பட்ட தேடல் அல்லது வடிகட்டி நிபந்தனைகளுக்குப் பொருந்தும் அறிவிப்புகள் எதுவும் இல்லை.' : 'No notifications match your current search or filter criteria.'}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="gov-admin-table">
              <thead>
                <tr>
                  <th>{isTa ? 'பெறுநர்' : 'Recipient'}</th>
                  <th>{isTa ? 'வகை' : 'Type'}</th>
                  <th>{isTa ? 'தலைப்பு & செய்தி' : 'Title & Message'}</th>
                  <th>{isTa ? 'முன்னுரிமை' : 'Priority'}</th>
                  <th>{isTa ? 'படித்த நிலை' : 'Read Status'}</th>
                  <th>{isTa ? 'தேதி' : 'Date'}</th>
                  <th>{isTa ? 'செயல்' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((row) => (
                  <tr key={row.id} className={row.status === 'archived' ? 'row-archived' : ''}>
                    <td>
                      <div className="recipient-cell">
                        <span className="recipient-name">{row.recipient_name || (isTa ? 'வேட்பாளர்' : 'Candidate')}</span>
                        <span className="recipient-email">{row.recipient_email || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`table-badge badge-${row.type || 'system'}`}>
                        {tNotificationType(row.type, language)}
                      </span>
                    </td>
                    <td className="message-cell">
                      <div className="table-notification-title">{row.title}</div>
                      <div className="table-notification-excerpt">{row.message}</div>
                    </td>
                    <td>
                      <span className={`table-priority-badge priority-${row.priority || 'normal'}`}>
                        {row.priority === 'urgent'
                          ? (isTa ? 'அவசரம்' : 'Urgent')
                          : row.priority === 'high'
                          ? (isTa ? 'உயர்' : 'High')
                          : row.priority === 'low'
                          ? (isTa ? 'குறைவு' : 'Low')
                          : (isTa ? 'சாதாரண' : 'Normal')}
                      </span>
                    </td>
                    <td>
                      <span className={`table-read-badge ${row.is_read ? 'is-read' : 'is-unread'}`}>
                        {row.is_read ? (isTa ? 'படித்தவை' : 'Read') : (isTa ? 'படிக்காதவை' : 'Unread')}
                      </span>
                    </td>
                    <td className="date-cell">
                      {new Date(row.created_at).toLocaleDateString(isTa ? 'ta-IN' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      {row.status !== 'archived' ? (
                        <button
                          type="button"
                          className="btn-table-action btn-archive"
                          onClick={() => handleArchive(row.id)}
                          title={isTa ? 'காப்பகப்படுத்துக' : 'Archive'}
                        >
                          {isTa ? 'காப்பகப்படுத்து' : 'Archive'}
                        </button>
                      ) : (
                        <span className="archived-text">{isTa ? 'காப்பகப்படுத்தப்பட்டது' : 'Archived'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && pagination.totalPages > 1 && (
          <div className="gov-pagination-bar">
            <span className="pagination-info">
              {isTa
                ? `பக்கம் ${pagination.page} / ${pagination.totalPages} (${pagination.total} மொத்த உருப்படிகள்)`
                : `Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} total items)`}
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

      {/* Announcement Creation Modal */}
      {showAnnouncementModal && (
        <div className="gov-modal-backdrop" onClick={() => setShowAnnouncementModal(false)}>
          <div className="gov-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isTa ? 'கணினி பொது அறிவிப்பை உருவாக்கு' : 'Create System Announcement'}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAnnouncementModal(false)}
                title={isTa ? 'மூடு' : 'Close'}
              >
                &times;
              </button>
            </div>

            {announcementFeedback && (
              <div className={`gov-alert-banner ${announcementFeedback.type}`}>
                <span>{announcementFeedback.message}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowConfirmModal(true);
              }}
              className="announcement-form"
            >
              <div className="form-group">
                <label>{isTa ? 'அறிவிப்புத் தலைப்பு' : 'Announcement Title'} <span className="req">*</span></label>
                <input
                  type="text"
                  required
                  placeholder={isTa ? 'எ.கா. தளத்தின் திட்டமிடப்பட்ட பராமரிப்பு / முக்கிய அறிவிப்பு' : 'e.g. Scheduled Portal Maintenance / Important Update'}
                  value={announcementForm.title}
                  onChange={(e) =>
                    setAnnouncementForm({ ...announcementForm, title: e.target.value })
                  }
                  className="gov-text-input"
                />
              </div>

              <div className="form-group">
                <label>{isTa ? 'செய்தி உள்ளடக்கம்' : 'Message Content'} <span className="req">*</span></label>
                <textarea
                  required
                  rows={4}
                  placeholder={isTa ? 'வேட்பாளர்களுக்கான முழு அறிவிப்பு விவரங்களை உள்ளிடவும்...' : 'Enter full announcement details for candidates...'}
                  value={announcementForm.message}
                  onChange={(e) =>
                    setAnnouncementForm({ ...announcementForm, message: e.target.value })
                  }
                  className="gov-textarea"
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>{isTa ? 'முன்னுரிமை' : 'Priority'}</label>
                  <select
                    value={announcementForm.priority}
                    onChange={(e) =>
                      setAnnouncementForm({ ...announcementForm, priority: e.target.value })
                    }
                    className="gov-select-control"
                  >
                    <option value="normal">{isTa ? 'சாதாரண' : 'Normal'}</option>
                    <option value="high">{isTa ? 'அதிக முன்னுரிமை' : 'High Priority'}</option>
                    <option value="urgent">{isTa ? 'அவசரம்' : 'Urgent'}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{isTa ? 'பெறுநர்களின் வரம்பு' : 'Recipient Scope'}</label>
                  <select
                    value={announcementForm.scope}
                    onChange={(e) =>
                      setAnnouncementForm({ ...announcementForm, scope: e.target.value })
                    }
                    className="gov-select-control"
                  >
                    <option value="all">{isTa ? 'அனைத்து செயலில் உள்ள வேட்பாளர்கள்' : 'All Active Candidates'}</option>
                    <option value="category">{isTa ? 'குறிப்பிட்ட பணி வகையுடன் தொடர்புடைய வேட்பாளர்கள்' : 'Candidates in Specific Category'}</option>
                    <option value="single">{isTa ? 'தனிப்பட்ட வேட்பாளர்' : 'Single Candidate'}</option>
                  </select>
                </div>
              </div>

              {announcementForm.scope === 'category' && (
                <div className="form-group">
                  <label>{isTa ? 'இலக்கு பணி வகை' : 'Target Category'} <span className="req">*</span></label>
                  <select
                    required
                    value={announcementForm.category_id}
                    onChange={(e) =>
                      setAnnouncementForm({ ...announcementForm, category_id: e.target.value })
                    }
                    className="gov-select-control"
                  >
                    <option value="">{isTa ? 'வகையைத் தேர்ந்தெடுக்கவும்' : 'Select Category'}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {tCategory(c.name)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {announcementForm.scope === 'single' && (
                <div className="form-group">
                  <label>{isTa ? 'வேட்பாளர் பயனர் எண் (User ID)' : 'Candidate User ID'} <span className="req">*</span></label>
                  <input
                    type="number"
                    required
                    placeholder={isTa ? 'வேட்பாளர் பயனர் எண்ணை உள்ளிடவும் (எ.கா. 2)' : 'Enter candidate User ID (e.g. 2)'}
                    value={announcementForm.candidate_id}
                    onChange={(e) =>
                      setAnnouncementForm({ ...announcementForm, candidate_id: e.target.value })
                    }
                    className="gov-text-input"
                  />
                </div>
              )}

              <div className="form-group">
                <label>{isTa ? 'செயல் இணைப்பு (விருப்பத்தேர்வு)' : 'Action Link (Optional)'}</label>
                <input
                  type="text"
                  placeholder={isTa ? 'எ.கா. /jobs/5 அல்லது /study-materials' : 'e.g. /jobs/5 or /study-materials'}
                  value={announcementForm.action_url}
                  onChange={(e) =>
                    setAnnouncementForm({ ...announcementForm, action_url: e.target.value })
                  }
                  className="gov-text-input"
                />
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowAnnouncementModal(false)}
                >
                  {isTa ? 'ரத்துசெய்' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={submittingAnnouncement}
                >
                  {isTa ? 'அனுப்ப தொடரவும் →' : 'Proceed to Send →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="gov-modal-backdrop" onClick={() => setShowConfirmModal(false)}>
          <div className="gov-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3>{isTa ? 'பொது அறிவிப்பு ஒளிபரப்பை உறுதிப்படுத்தவும்' : 'Confirm Announcement Broadcast'}</h3>
            <p>
              {isTa ? 'இந்த அறிவிப்பை நீங்கள் நிச்சயமாக ஒளிபரப்ப விரும்புகிறீர்களா: ' : 'Are you sure you want to broadcast this announcement to: '}
              <strong>
                {announcementForm.scope === 'all'
                  ? (isTa ? 'தளத்தில் உள்ள அனைத்து செயலில் உள்ள வேட்பாளர்கள்' : 'All active candidates on the portal')
                  : announcementForm.scope === 'category'
                  ? (isTa ? 'தேர்ந்தெடுக்கப்பட்ட பிரிவில் ஆர்வமுள்ள வேட்பாளர்கள்' : 'Candidates in selected category')
                  : `${isTa ? 'வேட்பாளர் #' : 'Candidate #'}${announcementForm.candidate_id}`}
              </strong>?
            </p>
            <div className="confirm-buttons">
              <button
                type="button"
                className="btn-confirm-cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                {isTa ? 'இல்லை, சரிபார்க்கவும்' : 'Cancel, Review'}
              </button>
              <button
                type="button"
                className="btn-confirm-proceed"
                onClick={handleSendAnnouncement}
                disabled={submittingAnnouncement}
              >
                {submittingAnnouncement
                  ? (isTa ? 'ஒளிபரப்பப்படுகிறது...' : 'Broadcasting...')
                  : (isTa ? 'ஆம், இப்போது அனுப்புக' : 'Yes, Send Now')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
