import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getMyApplications } from '../services/api';
import { ApplicationStatusBadge } from '../components/application/ApplicationStatusBadge';

export const MyApplications = () => {
  const { token } = useAuth();
  const { isTamil } = useLanguage();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const loadApplications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    const res = await getMyApplications(
      {
        page: currentPage,
        limit: 10,
        status: statusFilter,
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
      setError(
        res.message ||
          (isTamil
            ? 'உங்கள் விண்ணப்பங்களை மீட்டெடுக்க முடியவில்லை.'
            : 'Failed to retrieve your applications.')
      );
    }
  }, [token, currentPage, statusFilter, isTamil]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const statusOptions = [
    { label: isTamil ? 'அனைத்து விண்ணப்பங்களும்' : 'All Applications', value: '' },
    { label: isTamil ? 'சமர்ப்பிக்கப்பட்டது' : 'Submitted', value: 'submitted' },
    { label: isTamil ? 'பரிசீலனையில்' : 'Under Review', value: 'under_review' },
    { label: isTamil ? 'தேர்வுப் பட்டியலில்' : 'Shortlisted', value: 'shortlisted' },
    { label: isTamil ? 'தேர்ந்தெடுக்கப்பட்டது' : 'Selected', value: 'selected' },
    { label: isTamil ? 'நிராகரிக்கப்பட்டது' : 'Rejected', value: 'rejected' },
    { label: isTamil ? 'திரும்பப் பெறப்பட்டது' : 'Withdrawn', value: 'withdrawn' },
  ];

  return (
    <div className="section-container" style={{ padding: '2.5rem 1rem' }}>
      {/* Top Banner */}
      <div className="gov-card" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-primary)', fontWeight: 700 }}>
              {isTamil ? 'வேட்பாளர் தளம்' : 'Candidate Portal'}
            </span>
            <h1 style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: 'var(--text-primary)' }}>
              {isTamil ? 'என் விண்ணப்பங்கள்' : 'My Applications'}
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {isTamil
                ? 'உங்கள் விண்ணப்ப நிலையை கண்காணிக்கவும், விவரங்களை பார்க்கவும் மற்றும் அச்சிடவும்.'
                : 'Track application status, review submitted details and print acknowledgements.'}
            </p>
          </div>

          <Link to="/jobs" className="btn-dash-primary">
            {isTamil ? 'அரசுப் பணிகளைத் தேடுங்கள்' : 'Explore Government Jobs'}
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleStatusFilterChange(opt.value)}
            className={`btn-nav ${statusFilter === opt.value ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
          >
            {opt.label}
          </button>
        ))}
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
          <button type="button" onClick={loadApplications} className="btn-nav btn-outline" style={{ fontSize: '0.8rem' }}>
            {isTamil ? 'மீண்டும் முயற்சிக்கவும்' : 'Try Again'}
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="loading-spinner-portal" style={{ margin: '0 auto 1rem' }}></div>
          <p className="loading-text">
            {isTamil ? 'சமர்ப்பிக்கப்பட்ட விண்ணப்பங்கள் ஏற்றப்படுகின்றன...' : 'Loading submitted applications...'}
          </p>
        </div>
      ) : applications.length === 0 ? (
        /* Empty state */
        <div className="gov-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>
            {isTamil ? 'விண்ணப்பங்கள் எதுவும் கிடைக்கவில்லை' : 'No Applications Found'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            {statusFilter
              ? (isTamil ? 'இந்த பிரிவில் விண்ணப்பங்கள் எதுவும் இல்லை.' : 'No applications found in this category.')
              : (isTamil ? 'நீங்கள் இதுவரை எந்த அரசுப் பணிக்கும் விண்ணப்பிக்கவில்லை.' : 'You have not submitted applications for any government vacancies yet.')}
          </p>
          <Link to="/jobs" className="btn-dash-primary" style={{ display: 'inline-block' }}>
            {isTamil ? 'வெளியிடப்பட்ட பணிகளைக் காண்க' : 'Explore Published Vacancies'}
          </Link>
        </div>
      ) : (
        /* Applications List Cards */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {applications.map((app) => (
            <div key={app.id} className="gov-card" style={{ padding: '1.5rem', transition: 'transform 0.15s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      background: 'rgba(59, 130, 246, 0.1)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                    }}>
                      {app.application_id}
                    </span>
                    <ApplicationStatusBadge status={app.status} />
                  </div>
                  <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.25rem', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                    {app.job_title}
                  </h2>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                    {app.job_organization} {app.job_department && `• ${app.job_department}`} • {isTamil ? 'குறியீடு:' : 'Code:'} <strong>{app.job_code}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Link
                    to={`/applications/${app.id}`}
                    className="btn-dash-primary"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  >
                    {isTamil ? 'விவரங்களைக் காண்க' : 'View Details'}
                  </Link>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}>
                <div>
                  <strong>{isTamil ? 'சமர்ப்பிக்கப்பட்ட தேதி:' : 'Submitted Date:'}</strong> {new Date(app.submitted_at).toLocaleDateString()} {new Date(app.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div>
                  <strong>{isTamil ? 'வேட்பாளர் பெயர்:' : 'Candidate Name:'}</strong> {app.full_name}
                </div>
                <div>
                  <strong>{isTamil ? 'பணியிடம்:' : 'Location:'}</strong> {app.job_location || (isTamil ? 'அகில இந்திய' : 'All India')}
                </div>
                <div>
                  <strong>{isTamil ? 'விண்ணப்பிக்க கடைசி தேதி:' : 'Last Date to Apply:'}</strong> {app.job_last_date || 'N/A'}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="btn-nav btn-outline"
                style={{ padding: '0.4rem 0.8rem' }}
              >
                {isTamil ? 'முந்தையது' : 'Previous'}
              </button>
              <span style={{ alignSelf: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {isTamil
                  ? `பக்கம் ${currentPage} / ${pagination.totalPages}`
                  : `Page ${currentPage} of ${pagination.totalPages}`}
              </span>
              <button
                type="button"
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="btn-nav btn-outline"
                style={{ padding: '0.4rem 0.8rem' }}
              >
                {isTamil ? 'அடுத்தது' : 'Next'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyApplications;
