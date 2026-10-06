import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ADMIN_DASHBOARD_DATA } from '../data/placeholderData';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  getAdminJobs,
  getAdminJobStats,
  getCategories,
} from '../services/api';
import { JobStatsCards } from '../components/admin/JobStatsCards';
import { JobFormModal } from '../components/admin/JobFormModal';
import { JobDetailsModal } from '../components/admin/JobDetailsModal';
import { StatusChangeModal } from '../components/admin/StatusChangeModal';
import { ArchiveConfirmModal } from '../components/admin/ArchiveConfirmModal';

export const AdminDashboard = () => {
  const { user, token } = useAuth();
  const { language, t, tCategory, tJobGroup } = useLanguage();
  const isTa = language === 'ta';
  const { recentApplications } = ADMIN_DASHBOARD_DATA;

  // Active top-level Tab: 'jobManagement' | 'overview'
  const [activeTab, setActiveTab] = useState('jobManagement');

  // Job Management States
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    published: 0,
    closed: 0,
    expired: 0,
    archived: 0,
  });
  const [categories, setCategories] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [_loadingStats, setLoadingStats] = useState(false);

  // Filters & Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobsCount, setTotalJobsCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [viewingJob, setViewingJob] = useState(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTargetJob, setStatusTargetJob] = useState(null);

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveTargetJob, setArchiveTargetJob] = useState(null);

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState(null);

  const adminName = user?.name || user?.full_name || 'Portal Administrator';
  const adminEmail = user?.email || 'admin@recruitment.gov.in';

  // Load Job Categories once
  useEffect(() => {
    const loadCategories = async () => {
      const res = await getCategories();
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    };
    loadCategories();
  }, []);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    if (!token) return;
    setLoadingStats(true);
    try {
      const res = await getAdminJobStats(token);
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch {
      // Handled silently
    } finally {
      setLoadingStats(false);
    }
  }, [token]);

  // Fetch Jobs with pagination & filters
  const fetchJobs = useCallback(async () => {
    if (!token) return;
    setLoadingJobs(true);
    try {
      const res = await getAdminJobs(
        {
          page: currentPage,
          limit: pageSize,
          status: statusFilter,
          search: searchQuery,
          category_id: categoryFilter,
        },
        token
      );

      if (res.success) {
        setJobs(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalJobsCount(res.pagination.total || 0);
        }
      } else {
        setJobs([]);
      }
    } catch {
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  }, [token, currentPage, pageSize, statusFilter, searchQuery, categoryFilter]);

  // Load data on change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Reset page when filter changes
  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchJobs();
  };

  // Modal Handlers
  const handleOpenAddJob = () => {
    setEditingJob(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditJob = (job) => {
    setEditingJob(job);
    setIsFormModalOpen(true);
  };

  const handleOpenDetails = (job) => {
    setViewingJob(job);
    setIsDetailsModalOpen(true);
  };

  const handleOpenChangeStatus = (job) => {
    setStatusTargetJob(job);
    setIsStatusModalOpen(true);
  };

  const handleOpenArchive = (job) => {
    setArchiveTargetJob(job);
    setIsArchiveModalOpen(true);
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const handleSuccessAction = (job, actionType) => {
    fetchJobs();
    fetchStats();
    if (actionType === 'created') {
      showToast(isTa ? `பணி அறிவிப்பு "${job.job_code}" வெற்றிகரமாக உருவாக்கப்பட்டது.` : `Job notification "${job.job_code}" created successfully.`);
    } else if (actionType === 'updated') {
      showToast(isTa ? `பணி அறிவிப்பு "${job.job_code}" வெற்றிகரமாகப் புதுப்பிக்கப்பட்டது.` : `Job notification "${job.job_code}" updated successfully.`);
    } else if (actionType === 'status_updated') {
      showToast(isTa ? `பணி அறிவிப்பு "${job.job_code}" நிலை புதுப்பிக்கப்பட்டது.` : `Job notification "${job.job_code}" status updated.`);
    } else if (actionType === 'archived') {
      showToast(isTa ? `பணி அறிவிப்பு "${job.job_code}" பாதுகாப்பாகக் காப்பகப்படுத்தப்பட்டது.` : `Job notification "${job.job_code}" archived securely.`);
    }
  };

  return (
    <div className="dashboard-page-layout">
      {/* 1. Admin Header Strip */}
      <div className="dashboard-banner-strip admin-banner-theme">
        <div className="section-container banner-content-grid">
          <div className="candidate-welcome-info">
            <div className="admin-avatar">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <div className="candidate-reg-id admin-tag">
                {isTa ? `பணியாளர் தேர்வு ஆணைய நிர்வாகம் • ${adminEmail}` : `Staff Selection Commission Administration • ${adminEmail}`}
              </div>
              <h1 className="candidate-name">
                {t('admin.dashboard')} — {adminName}
              </h1>
              <p className="candidate-subtext">
                {isTa
                  ? 'துறை காலிப்பணியிட வெளியீடு • விண்ணப்ப சரிபார்ப்பு • தேர்வு மேலாண்மை'
                  : 'Department Vacancy Publishing • Application Verification • Examination Management'}
              </p>
            </div>
          </div>

          <div className="candidate-banner-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              to="/admin/applications"
              className="btn-dash-primary"
              id="admin-view-applications-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>{t('admin.applications')}</span>
            </Link>

            <Link
              to="/admin/materials"
              className="btn-dash-primary"
              id="admin-view-materials-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>{t('admin.studyMaterials')}</span>
            </Link>

            <button
              type="button"
              onClick={handleOpenAddJob}
              className="btn-dash-primary admin-primary-btn"
              id="admin-add-job-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>{t('admin.addNewJob')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="section-container dashboard-body-grid-admin">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="admin-toast-banner" role="alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              className="admin-toast-close"
              onClick={() => setToastMessage(null)}
              aria-label="Dismiss toast"
            >
              &times;
            </button>
          </div>
        )}

        {/* Tab Toggle for Console Sections */}
        <div className="dash-tabs-bar">
          <button
            type="button"
            className={`dash-tab-btn ${activeTab === 'jobManagement' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('jobManagement')}
            id="tab-job-management"
          >
            {isTa ? `பணி மேலாண்மை (${stats.total || 0})` : `Manage Jobs (${stats.total || 0})`}
          </button>
          <button
            type="button"
            className={`dash-tab-btn ${activeTab === 'overview' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('overview')}
            id="tab-dashboard-overview"
          >
            {isTa ? 'கணினி கண்ணோட்டம் & வரிசை' : 'System Overview & Queue'}
          </button>
          <Link
            to="/admin/applications"
            className="dash-tab-btn"
            id="tab-applications-nav"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          >
            {isTa ? 'விண்ணப்பங்கள் மேலாண்மை' : 'Manage Applications'}
          </Link>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: JOB MANAGEMENT CONSOLE */}
        {/* ============================================================== */}
        {activeTab === 'jobManagement' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* A. Header Row */}
            <div className="job-mgmt-header-row">
              <div className="job-mgmt-titles">
                <h2 className="job-mgmt-title">{t('admin.manageJobs')}</h2>
                <p className="job-mgmt-subtitle">
                  {isTa
                    ? 'மத்திய அரசு காலிப்பணியிட மேலாண்மை, சுழற்சி கண்காணிப்பு மற்றும் அதிகாரப்பூர்வ அறிவிப்புக் கட்டுப்பாடு.'
                    : 'Central recruitment vacancy management, lifecycle monitoring, and official notification control.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddJob}
                className="btn-dash-primary admin-primary-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>{t('admin.addNewJob')}</span>
              </button>
            </div>

            {/* B. Job Statistics (6 Metric Counters from backend data) */}
            <JobStatsCards
              stats={stats}
              selectedStatus={statusFilter}
              onSelectStatus={handleStatusFilterChange}
            />

            {/* C. Filter & Search Toolbar */}
            <div className="admin-filter-bar">
              <form onSubmit={handleSearchSubmit} className="admin-search-wrap">
                <span className="search-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder={isTa ? 'பணி பெயர், நிறுவனம் அல்லது குறியீட்டைத் தேடுக...' : 'Search job title, organization, or code...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              <select
                className="admin-filter-select"
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                aria-label={isTa ? 'பணி நிலை வடிப்பான்' : 'Job status filter'}
              >
                <option value="">{isTa ? `அனைத்து நிலைகளும் (${stats.total})` : `All Statuses (${stats.total})`}</option>
                <option value="draft">{isTa ? `வரைவு (${stats.draft})` : `Draft (${stats.draft})`}</option>
                <option value="published">{isTa ? `வெளியிடப்பட்டது (${stats.published})` : `Published (${stats.published})`}</option>
                <option value="closed">{isTa ? `முடிவடைந்தது (${stats.closed})` : `Closed (${stats.closed})`}</option>
                <option value="expired">{isTa ? `காலாவதியானது (${stats.expired})` : `Expired (${stats.expired})`}</option>
                <option value="archived">{isTa ? `காப்பகப்படுத்தப்பட்டது (${stats.archived})` : `Archived (${stats.archived})`}</option>
              </select>

              <select
                className="admin-filter-select"
                value={categoryFilter}
                onChange={handleCategoryFilterChange}
                aria-label={isTa ? 'பணி பிரிவு வடிப்பான்' : 'Job category filter'}
              >
                <option value="">{t('home.allCategories')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {tCategory(c.name)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="btn-filter-refresh"
                onClick={() => {
                  fetchJobs();
                  fetchStats();
                }}
                title={isTa ? 'அட்டவணையைப் புதுப்பி' : 'Refresh table'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                <span>{isTa ? 'புதுப்பி' : 'Refresh'}</span>
              </button>
            </div>

            {/* D. Job Table Card */}
            <div className="gov-card table-card-wrap">
              <div className="table-responsive-box">
                {loadingJobs ? (
                  <div className="admin-empty-state">
                    <span className="inline-spinner" style={{ width: '28px', height: '28px', borderColor: 'rgba(15, 61, 117, 0.2)', borderTopColor: 'var(--color-primary)' }} />
                    <p className="empty-state-heading">{isTa ? 'அரசுப் பணிகள் ஏற்றப்படுகிறது...' : 'Loading government jobs...'}</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="admin-empty-state">
                    <div className="empty-state-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                    </div>
                    <h3 className="empty-state-heading">
                      {statusFilter || searchQuery || categoryFilter
                        ? (isTa ? 'வடிப்பான் நிபந்தனைகளுக்குப் பொருந்தும் பணிகள் எதுவும் இல்லை.' : 'No jobs match your filter criteria.')
                        : (isTa ? 'பணிகள் எதுவும் இன்னும் சேர்க்கப்படவில்லை.' : 'No jobs have been added yet.')}
                    </h3>
                    <p className="empty-state-desc">
                      {statusFilter || searchQuery || categoryFilter
                        ? (isTa ? 'மற்ற அறிவிப்புகளைக் காண தேடலை அல்லது வடிப்பான்களை அழிக்கவும்.' : 'Clear search or filters to see other listings.')
                        : (isTa ? 'பொது அறிவிப்புக்காக உங்கள் முதல் அதிகாரப்பூர்வ ஆட்சேர்ப்பு அறிவிப்பை உருவாக்கவும்.' : 'Create your first official recruitment vacancy for publication.')}
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddJob}
                      className="btn-modal-primary"
                    >
                      {t('admin.addNewJob')}
                    </button>
                  </div>
                ) : (
                  <table className="gov-table" id="admin-jobs-table">
                    <thead>
                      <tr>
                        <th>{isTa ? 'பணி குறியீடு' : 'Job Code'}</th>
                        <th>{isTa ? 'பணி பெயர் & நிறுவனம்' : 'Job Title & Organization'}</th>
                        <th>{isTa ? 'வகை' : 'Category'}</th>
                        <th>{t('jobs.vacancies')}</th>
                        <th>{isTa ? 'தொடக்க தேதி' : 'Opening Date'}</th>
                        <th>{t('jobs.lastDate')}</th>
                        <th>{isTa ? 'நிலை' : 'Status'}</th>
                        <th>{isTa ? 'உருவாக்கப்பட்ட தேதி' : 'Created Date'}</th>
                        <th>{isTa ? 'நடவடிக்கைகள்' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((j) => (
                        <tr key={j.id}>
                          <td>
                            <code className="table-code">{j.job_code}</code>
                          </td>
                          <td>
                            <div className="table-title-cell">
                              <button
                                type="button"
                                onClick={() => handleOpenDetails(j)}
                                className="table-link"
                                style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                              >
                                {j.title}
                              </button>
                              <span className="table-sub-org">
                                {j.organization} {j.department ? `(${j.department})` : ''}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="badge-chip-cat">
                              {tCategory(j.category?.name)}
                            </span>
                            {j.job_group && (
                              <span className="badge-chip-cat" style={{ marginLeft: '4px', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}>
                                {tJobGroup(j.job_group)}
                              </span>
                            )}
                          </td>
                          <td><strong>{j.vacancies?.toLocaleString(isTa ? 'ta-IN' : 'en-US') || 0}</strong></td>
                          <td>{j.opening_date || '—'}</td>
                          <td>
                            <span className="text-warning" style={{ fontWeight: 600 }}>
                              {j.last_date || '—'}
                            </span>
                          </td>
                          <td>
                            <StatusBadge status={j.status} />
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {j.created_at ? new Date(j.created_at).toLocaleDateString(isTa ? 'ta-IN' : 'en-US') : '—'}
                          </td>
                          <td>
                            <div className="table-actions-cell">
                              <button
                                type="button"
                                className="btn-action-pill btn-action-view"
                                onClick={() => handleOpenDetails(j)}
                                title={isTa ? 'முழு பணி விவரங்களையும் காண்க' : 'View full job details'}
                              >
                                {t('jobs.viewDetails')}
                              </button>
                              <button
                                type="button"
                                className="btn-action-pill btn-action-edit"
                                onClick={() => handleOpenEditJob(j)}
                                title={isTa ? 'பணி தகவல்களைத் திருத்து' : 'Edit job details'}
                              >
                                {t('admin.edit')}
                              </button>
                              <button
                                type="button"
                                className="btn-action-pill btn-action-status"
                                onClick={() => handleOpenChangeStatus(j)}
                                title={isTa ? 'பணி நிலையை மாற்று' : 'Change job status'}
                              >
                                {isTa ? 'நிலை' : 'Status'}
                              </button>
                              {j.status !== 'archived' && (
                                <button
                                  type="button"
                                  className="btn-action-pill btn-action-archive"
                                  onClick={() => handleOpenArchive(j)}
                                  title={isTa ? 'பணியைப் பாதுகாப்பாகக் காப்பகப்படுத்து' : 'Archive job safely'}
                                >
                                  {t('admin.archive')}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* E. Pagination Controls */}
              {jobs.length > 0 && (
                <div className="admin-pagination-bar">
                  <span className="pagination-info">
                    {isTa
                      ? `மொத்தம் ${totalJobsCount} பணிகளில் ${(currentPage - 1) * pageSize + 1} முதல் ${Math.min(totalJobsCount, currentPage * pageSize)} வரை காட்டப்படுகிறது`
                      : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(totalJobsCount, currentPage * pageSize)} of ${totalJobsCount} jobs`}
                  </span>
                  <div className="pagination-controls">
                    <button
                      type="button"
                      className="btn-page-step"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                    >
                      {isTa ? '← முந்தையது' : '← Previous'}
                    </button>
                    <span className="pagination-page-indicator">
                      {isTa ? `பக்கம் ${currentPage} / ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
                    </span>
                    <button
                      type="button"
                      className="btn-page-step"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                    >
                      {isTa ? 'அடுத்தது →' : 'Next →'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: SYSTEM OVERVIEW & RECENT QUEUE */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="gov-card table-card-wrap">
              <div className="table-header-row">
                <div>
                  <h3 className="table-heading">{isTa ? 'வேட்பாளர் விண்ணப்ப சரிபார்ப்பு வரிசை' : 'Candidate Application Verification Queue'}</h3>
                  <p className="table-subtext">{isTa ? 'விண்ணப்பங்கள் பரிசீலனை மற்றும் சரிபார்ப்பு கண்ணோட்டம்' : 'Applications review and verification overview'}</p>
                </div>
              </div>

              <div className="table-responsive-box">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>{t('applications.applicationId')}</th>
                      <th>{isTa ? 'வேட்பாளர் பெயர்' : 'Candidate Name'}</th>
                      <th>{isTa ? 'விண்ணப்பித்த பணி' : 'Applied Job'}</th>
                      <th>{t('applications.submittedDate')}</th>
                      <th>{isTa ? 'கட்டண நிலை' : 'Fee Status'}</th>
                      <th>{isTa ? 'சரிபார்ப்பு நிலை' : 'Verification Status'}</th>
                      <th>{isTa ? 'நடவடிக்கை' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApplications.map((app) => (
                      <tr key={app.id}>
                        <td><code className="table-code">{app.id}</code></td>
                        <td><strong>{app.candidateName}</strong></td>
                        <td>{app.jobTitle}</td>
                        <td>{app.submittedOn}</td>
                        <td>
                          <span className={`fee-pill ${app.feeStatus === 'Paid' ? 'fee-paid' : 'fee-exempt'}`}>
                            {app.feeStatus === 'Paid' ? (isTa ? 'செலுத்தப்பட்டது' : 'Paid') : (isTa ? 'விலக்கு அளிக்கப்பட்டது' : 'Exempted')}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={app.status} />
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => alert(isTa ? `விண்ணப்பம் ${app.id} (${app.candidateName}) பரிசீலனை செய்யப்படுகிறது.` : `Reviewing application ${app.id} (${app.candidateName}).`)}
                            className="btn-action-pill"
                          >
                            {isTa ? 'சரிபார்க்க' : 'Verify'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODALS */}
      {/* ============================================================== */}
      {/* 1. Add / Edit Job Modal */}
      <JobFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleSuccessAction}
        initialJob={editingJob}
        categories={categories}
      />

      {/* 2. Job Details Modal */}
      <JobDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        job={viewingJob}
        onEdit={handleOpenEditJob}
        onChangeStatus={handleOpenChangeStatus}
        onArchive={handleOpenArchive}
      />

      {/* 3. Status Change Modal */}
      <StatusChangeModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        job={statusTargetJob}
        onSuccess={handleSuccessAction}
      />

      {/* 4. Archive Confirmation Modal */}
      <ArchiveConfirmModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        job={archiveTargetJob}
        onSuccess={handleSuccessAction}
      />
    </div>
  );
};

export default AdminDashboard;
