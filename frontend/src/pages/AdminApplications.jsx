import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  getAdminApplications,
  getAdminApplicationStats,
  getAdminApplicationById,
  updateAdminApplicationStatus,
  downloadDocumentFile,
} from '../services/api';
import { ApplicationStatusBadge } from '../components/application/ApplicationStatusBadge';

export const AdminApplications = () => {
  const { token } = useAuth();
  const { language, t, tStatus } = useLanguage();
  const isTa = language === 'ta';

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    under_review: 0,
    shortlisted: 0,
    selected: 0,
    rejected: 0,
    withdrawn: 0,
  });

  // Applications
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Detail Modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Status Change Modal
  const [statusModalApp, setStatusModalApp] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState(null);

  // Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchStats = useCallback(async () => {
    if (!token) return;
    const res = await getAdminApplicationStats(token);
    if (res.success && res.data) {
      setStats(res.data);
    }
  }, [token]);

  const fetchApplications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    const res = await getAdminApplications(
      {
        page: currentPage,
        limit: 10,
        search,
        status: statusFilter,
        date_from: dateFrom,
        date_to: dateTo,
      },
      token
    );

    setLoading(false);

    if (res.success) {
      setApplications(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } else {
      setError(res.message || (isTa ? 'விண்ணப்பங்களை ஏற்றுவதில் பிழை.' : 'Failed to load applications.'));
    }
  }, [token, currentPage, search, statusFilter, dateFrom, dateTo, isTa]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchApplications();
  };

  const handleOpenDetails = async (appId) => {
    setLoadingDetail(true);
    setDetailModalOpen(true);
    const res = await getAdminApplicationById(appId, token);
    setLoadingDetail(false);
    if (res.success && res.data) {
      setSelectedApp(res.data);
    } else {
      showToast(res.message || (isTa ? 'விண்ணப்ப விவரங்களை ஏற்றுவதில் பிழை.' : 'Error loading application details.'));
      setDetailModalOpen(false);
    }
  };

  const handleOpenStatusModal = (app) => {
    setStatusModalApp(app);
    setTargetStatus('');
    setStatusError(null);
  };

  const handleSaveStatus = async () => {
    if (!targetStatus || !statusModalApp) return;

    setUpdatingStatus(true);
    setStatusError(null);

    const res = await updateAdminApplicationStatus(statusModalApp.id, targetStatus, token);
    setUpdatingStatus(false);

    if (res.success) {
      showToast(isTa ? 'விண்ணப்ப நிலை வெற்றிகரமாகப் புதுப்பிக்கப்பட்டது.' : 'Application status updated successfully.');
      setStatusModalApp(null);
      fetchStats();
      fetchApplications();
    } else {
      setStatusError(res.message || (isTa ? 'விண்ணப்ப நிலையைப் புதுப்பிக்க முடியவில்லை.' : 'Failed to update application status.'));
    }
  };

  // State machine options for status change
  const getAllowedStatusOptions = (current) => {
    switch (current) {
      case 'submitted':
        return [
          { value: 'under_review', label: isTa ? 'பரிசீலனைக்கு நகர்த்து (Under Review)' : 'Move to Under Review' },
          { value: 'withdrawn', label: isTa ? 'திரும்பப் பெற்றதாகக் குறி (Withdrawn)' : 'Mark as Withdrawn' },
        ];
      case 'under_review':
        return [
          { value: 'shortlisted', label: isTa ? 'தேர்வுப் பட்டியலில் சேர் (Shortlist Candidate)' : 'Shortlist Candidate' },
          { value: 'rejected', label: isTa ? 'விண்ணப்பத்தை நிராகரி (Reject Application)' : 'Reject Application' },
          { value: 'withdrawn', label: isTa ? 'திரும்பப் பெற்றதாகக் குறி (Withdrawn)' : 'Mark as Withdrawn' },
        ];
      case 'shortlisted':
        return [
          { value: 'selected', label: isTa ? 'தேர்ந்தெடு - இறுதி தேர்வு (Select Candidate)' : 'Select Candidate' },
          { value: 'rejected', label: isTa ? 'விண்ணப்பத்தை நிராகரி (Reject Application)' : 'Reject Application' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="section-container" style={{ padding: '2.5rem 1rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: 'var(--accent-primary)',
          color: '#ffffff',
          padding: '0.85rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          zIndex: 99999,
          fontWeight: 600,
        }}>
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="gov-card" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-primary)', fontWeight: 700 }}>
              {isTa ? 'மத்திய நிர்வாக கன்சோல்' : 'Central Admin Console'}
            </span>
            <h1 style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: 'var(--text-primary)' }}>
              {isTa ? 'வேட்பாளர் விண்ணப்பங்கள் மேலாண்மை' : 'Manage Candidate Applications'}
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {isTa
                ? 'சமர்ப்பிக்கப்பட்ட விண்ணப்பங்களை மதிப்பாய்வு செய்தல், ஆவணங்களைச் சரிபார்த்தல் மற்றும் ஆட்சேர்ப்பு நிலைகளைப் புதுப்பித்தல்.'
                : 'Review submitted applications, verify documents, and update candidate progression statuses.'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div className="gov-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{isTa ? 'மொத்தம்' : 'Total'}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.total}</div>
        </div>
        <div className="gov-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#3b82f6', textTransform: 'uppercase' }}>{t('status.submitted')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6' }}>{stats.submitted}</div>
        </div>
        <div className="gov-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#f59e0b', textTransform: 'uppercase' }}>{t('status.underReview')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>{stats.under_review}</div>
        </div>
        <div className="gov-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#8b5cf6', textTransform: 'uppercase' }}>{t('status.shortlisted')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#8b5cf6' }}>{stats.shortlisted}</div>
        </div>
        <div className="gov-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#16a34a', textTransform: 'uppercase' }}>{t('status.selected')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>{stats.selected}</div>
        </div>
        <div className="gov-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#dc2626', textTransform: 'uppercase' }}>{t('status.rejected')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626' }}>{stats.rejected}</div>
        </div>
        <div className="gov-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>{t('status.withdrawn')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#64748b' }}>{stats.withdrawn}</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="gov-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label className="field-label" htmlFor="admin-app-search">{isTa ? 'தேடல் சொல்' : 'Search'}</label>
            <input
              type="text"
              id="admin-app-search"
              className="filter-input-text"
              style={{ width: '100%' }}
              placeholder={isTa ? 'வேட்பாளர் பெயர், விண்ணப்ப எண், பணி...' : 'Candidate name, ID, job...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="admin-app-status">{t('applications.applicationStatus')}</label>
            <select
              id="admin-app-status"
              className="filter-input-text"
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">{isTa ? 'அனைத்து நிலைகளும்' : 'All Statuses'}</option>
              <option value="submitted">{t('status.submitted')}</option>
              <option value="under_review">{t('status.underReview')}</option>
              <option value="shortlisted">{t('status.shortlisted')}</option>
              <option value="selected">{t('status.selected')}</option>
              <option value="rejected">{t('status.rejected')}</option>
              <option value="withdrawn">{t('status.withdrawn')}</option>
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="admin-app-date-from">{isTa ? 'சமர்ப்பிக்கப்பட்ட தொடக்க தேதி' : 'Date From'}</label>
            <input
              type="date"
              id="admin-app-date-from"
              className="filter-input-text"
              style={{ width: '100%' }}
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="admin-app-date-to">{isTa ? 'சமர்ப்பிக்கப்பட்ட முடிவு தேதி' : 'Date To'}</label>
            <input
              type="date"
              id="admin-app-date-to"
              className="filter-input-text"
              style={{ width: '100%' }}
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn-dash-primary" style={{ flex: 1, padding: '0.55rem' }}>
              {isTa ? 'வடிகட்டு' : 'Filter'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setDateFrom('');
                setDateTo('');
                setCurrentPage(1);
              }}
              className="btn-nav btn-outline"
              style={{ padding: '0.55rem 0.9rem' }}
            >
              {isTa ? 'மீட்டமை' : 'Reset'}
            </button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          color: '#dc2626',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>{error}</span>
          <button type="button" onClick={fetchApplications} className="btn-nav btn-outline" style={{ fontSize: '0.8rem' }}>
            {isTa ? 'மீண்டும் முயற்சிக்கவும்' : 'Try Again'}
          </button>
        </div>
      )}

      {/* Applications Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="loading-spinner-portal" style={{ margin: '0 auto 1rem' }}></div>
          <p className="loading-text">{isTa ? 'விண்ணப்பங்கள் ஏற்றப்படுகிறது...' : 'Loading applications...'}</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="gov-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>
            {isTa ? 'விண்ணப்பங்கள் எதுவும் கிடைக்கவில்லை' : 'No Applications Found'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isTa
              ? 'தேர்வு செய்த நிபந்தனைகளுக்குப் பொருந்தும் விண்ணப்பங்கள் எதுவும் கிடைக்கவில்லை.'
              : 'No applications found matching your specified search/filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="gov-card" style={{ overflowX: 'auto', padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem' }}>{t('applications.applicationId')}</th>
                <th style={{ padding: '1rem' }}>{isTa ? 'வேட்பாளர்' : 'Candidate'}</th>
                <th style={{ padding: '1rem' }}>{isTa ? 'அரசுப் பணி' : 'Government Job'}</th>
                <th style={{ padding: '1rem' }}>{t('applications.submittedDate')}</th>
                <th style={{ padding: '1rem' }}>{t('applications.applicationStatus')}</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>{isTa ? 'நடவடிக்கைகள்' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {app.application_id}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{app.full_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{app.email} • {app.mobile_number}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{app.job_title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{app.job_organization} ({app.job_code})</div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {new Date(app.submitted_at).toLocaleDateString(isTa ? 'ta-IN' : 'en-US')}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <ApplicationStatusBadge status={app.status} />
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(app.id)}
                        className="btn-nav btn-outline"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                      >
                        {isTa ? 'மதிப்பாய்வு' : 'Review'}
                      </button>
                      {['submitted', 'under_review', 'shortlisted'].includes(app.status) && (
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(app)}
                          className="btn-dash-primary"
                          style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                        >
                          {isTa ? 'நிலை மாற்று' : 'Update Status'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {isTa
                ? `மொத்தம் ${pagination.total} விண்ணப்பங்களில் ${applications.length} காட்டப்படுகிறது`
                : `Showing ${applications.length} of ${pagination.total} applications`}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="btn-nav btn-outline"
                style={{ padding: '0.35rem 0.75rem' }}
              >
                {isTa ? 'முந்தையது' : 'Previous'}
              </button>
              <span style={{ alignSelf: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {isTa ? `பக்கம் ${currentPage} / ${pagination.totalPages}` : `Page ${currentPage} of ${pagination.totalPages}`}
              </span>
              <button
                type="button"
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="btn-nav btn-outline"
                style={{ padding: '0.35rem 0.75rem' }}
              >
                {isTa ? 'அடுத்தது' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review / Detail Modal */}
      {detailModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div className="gov-card" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            {loadingDetail || !selectedApp ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="loading-spinner-portal" style={{ margin: '0 auto 1rem' }}></div>
                <p>{isTa ? 'விண்ணப்ப விவரங்கள் ஏற்றப்படுகிறது...' : 'Loading application details...'}</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--accent-primary)', fontSize: '1.2rem' }}>
                      {selectedApp.application_id}
                    </span>
                    <h2 style={{ fontSize: '1.4rem', marginTop: '0.25rem' }}>{selectedApp.job_title}</h2>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {selectedApp.job_organization} • {selectedApp.job_code}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <ApplicationStatusBadge status={selectedApp.status} />
                    <button
                      type="button"
                      onClick={() => setDetailModalOpen(false)}
                      className="btn-nav btn-outline"
                      style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.8rem' }}
                    >
                      {isTa ? 'மூடு' : 'Close'}
                    </button>
                  </div>
                </div>

                {/* Candidate Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{isTa ? 'வேட்பாளர் பெயர்' : 'Candidate Name'}</span>
                    <strong>{selectedApp.full_name}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{isTa ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}</span>
                    <strong>{selectedApp.email}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{isTa ? 'கைபேசி எண்' : 'Mobile Number'}</span>
                    <strong>{selectedApp.mobile_number}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{isTa ? 'பிறந்த தேதி & பாலினம்' : 'DOB & Gender'}</span>
                    <strong>{selectedApp.date_of_birth} ({selectedApp.gender})</strong>
                  </div>
                </div>

                {/* Address & Education */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                    <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>{isTa ? 'முகவரி' : 'Address'}</h3>
                    <p style={{ fontSize: '0.9rem' }}>{selectedApp.address_line}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {selectedApp.city}, {selectedApp.district}, {selectedApp.state} - {selectedApp.pincode}
                    </p>
                  </div>
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                    <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>{t('jobs.qualification')}</h3>
                    <p style={{ fontSize: '0.9rem' }}><strong>{selectedApp.highest_qualification}</strong> - {selectedApp.qualification_details || (isTa ? 'பொது' : 'General')}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {selectedApp.university_or_board} • {isTa ? 'தேர்ச்சி ஆண்டு:' : 'Passing Year:'} {selectedApp.passing_year} ({selectedApp.percentage_or_cgpa})
                    </p>
                  </div>
                </div>

                {/* Documents */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-primary)', marginBottom: '0.75rem' }}>{isTa ? 'பதிவேற்றப்பட்ட ஆவணங்கள்' : 'Uploaded Documents'}</h3>
                  {selectedApp.documents && selectedApp.documents.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selectedApp.documents.map((doc) => (
                        <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.65rem 1rem', borderRadius: '6px' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)', marginRight: '0.5rem' }}>
                              [{doc.document_type}]
                            </span>
                            <span style={{ fontSize: '0.85rem' }}>{doc.original_filename}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => downloadDocumentFile(doc.id, doc.original_filename, token)}
                            className="btn-nav btn-outline"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                          >
                            {t('studyMaterials.download')}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{isTa ? 'ஆவணங்கள் எதுவும் இல்லை.' : 'No documents attached.'}</p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setDetailModalOpen(false)}
                    className="btn-nav btn-outline"
                  >
                    {isTa ? 'மதிப்பாய்வை மூடு' : 'Close Review'}
                  </button>
                  {['submitted', 'under_review', 'shortlisted'].includes(selectedApp.status) && (
                    <button
                      type="button"
                      onClick={() => {
                        setDetailModalOpen(false);
                        handleOpenStatusModal(selectedApp);
                      }}
                      className="btn-dash-primary"
                    >
                      {isTa ? 'விண்ணப்ப நிலையைப் புதுப்பி' : 'Update Application Status'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {statusModalApp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div className="gov-card" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              {isTa ? 'விண்ணப்ப நிலையைப் புதுப்பித்தல்' : 'Update Application Status'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {isTa
                ? <span>விண்ணப்ப எண் <strong>{statusModalApp.application_id}</strong> ({statusModalApp.full_name}) நிலையைப் புதுப்பித்தல்.</span>
                : <span>Updating status for <strong>{statusModalApp.application_id}</strong> ({statusModalApp.full_name}).</span>}
            </p>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              {isTa ? 'தற்போதைய நிலை:' : 'Current Status:'} <strong>{tStatus(statusModalApp.status)}</strong>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="field-label" htmlFor="target-status-select">
                {isTa ? 'புதிய நிலையைத் தேர்ந்தெடுக்கவும்' : 'Select New Status'}
              </label>
              <select
                id="target-status-select"
                className="filter-input-text"
                style={{ width: '100%' }}
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
              >
                <option value="">{isTa ? '-- நிலையைத் தேர்ந்தெடுக்கவும் --' : '-- Select Status --'}</option>
                {getAllowedStatusOptions(statusModalApp.status).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {statusError && (
              <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {statusError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setStatusModalApp(null)}
                className="btn-nav btn-outline"
                disabled={updatingStatus}
              >
                {isTa ? 'ரத்து செய்' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                className="btn-dash-primary"
                disabled={!targetStatus || updatingStatus}
              >
                {updatingStatus ? (isTa ? 'சேமிக்கப்படுகிறது...' : 'Saving...') : (isTa ? 'நிலை மாற்றத்தைப் பயன்படுத்து' : 'Apply Status Change')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApplications;
