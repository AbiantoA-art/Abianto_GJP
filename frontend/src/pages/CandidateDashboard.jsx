import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CANDIDATE_DASHBOARD_DATA } from '../data/placeholderData';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const CandidateDashboard = () => {
  const { profile, stats, appliedJobs, savedJobs, notifications } = CANDIDATE_DASHBOARD_DATA;
  const { user } = useAuth();
  const { language, t, tStatus, tCategory } = useLanguage();
  const isTa = language === 'ta';
  const [activeTab, setActiveTab] = useState('applied');

  const displayName = user?.name || user?.full_name || profile.fullName;
  const displayEmail = user?.email || profile.email;
  const displayMobile = user?.mobile_number || profile.mobile;
  const displayCandidateId = user?.id ? `GOV-CAN-${String(user.id).padStart(5, '0')}` : profile.candidateId;

  const handleActionNotice = (actionName) => {
    alert(
      isTa
        ? `[வேட்பாளர் அறிவிப்பு]\n\nஇயக்கப்பட்டது: "${actionName}".\nஅதிகாரப்பூர்வ ஆவணப் பதிவிறக்கங்கள் மற்றும் சுயவிவர மாற்றங்கள் அடுத்த கட்டத்தில் செயல்படுத்தப்படும்.`
        : `[Candidate Notice]\n\nAction: "${actionName}".\nOfficial document downloads and profile modifications will be available soon.`
    );
  };

  return (
    <div className="dashboard-page-layout">
      {/* 1. Dashboard Welcome Area */}
      <div className="dashboard-banner-strip">
        <div className="section-container banner-content-grid">
          <div className="candidate-welcome-info">
            <div className="candidate-avatar">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <div className="candidate-reg-id">
                {isTa ? `வேட்பாளர் எண்: ${displayCandidateId}` : `Candidate ID: ${displayCandidateId}`}
              </div>
              <h1 className="candidate-name">
                {isTa ? `வரவேற்கிறோம், ${displayName}` : `Welcome, ${displayName}`}
              </h1>
              <p className="candidate-subtext">
                {isTa
                  ? 'மத்திய வேட்பாளர் தேர்வு கட்டுப்பாட்டு தளம் • நிலை: செயலில் & சரிபார்க்கப்பட்டது'
                  : 'Central Candidate Recruitment System • Status: Active & Verified'}
              </p>
            </div>
          </div>

          <div className="candidate-banner-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/my-applications" className="btn-dash-primary" style={{ background: 'var(--accent-primary)', textDecoration: 'none' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>{t('applications.myApplications')}</span>
            </Link>

            <Link to="/jobs" className="btn-nav btn-outline" style={{ textDecoration: 'none' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>{isTa ? 'அரசுப் பணிகளைத் தேடுக' : 'Search Jobs'}</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="section-container dashboard-body-grid">
        {/* Left Column: Profile Summary */}
        <aside className="dashboard-sidebar">
          {/* Profile Summary Card */}
          <div className="gov-card profile-card">
            <div className="profile-card-header">
              <h3 className="sidebar-section-title">{isTa ? 'சுயவிவர சுருக்கம்' : 'Profile Summary'}</h3>
              <span className="profile-status-tag">{isTa ? 'சரிபார்க்கப்பட்டது' : 'Verified'}</span>
            </div>

            <div className="profile-completion-wrap">
              <div className="completion-labels">
                <span>{isTa ? 'சுயவிவர முழுமை' : 'Profile Completion'}</span>
                <strong>{profile.profileCompletion}%</strong>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${profile.profileCompletion}%` }}
                />
              </div>
            </div>

            <div className="profile-details-list">
              <div className="profile-detail-item">
                <span className="detail-label">{isTa ? 'மின்னஞ்சல்' : 'Email'}</span>
                <span className="detail-value">{displayEmail}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">{isTa ? 'கைபேசி' : 'Mobile'}</span>
                <span className="detail-value">{displayMobile}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">{t('jobs.qualification')}</span>
                <span className="detail-value">{profile.education}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">{isTa ? 'இடஒதுக்கீடு பிரிவு' : 'Category'}</span>
                <span className="detail-value">{profile.category}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">{isTa ? 'வசிப்பிட மாநிலம்' : 'Domicile State'}</span>
                <span className="detail-value">{profile.state}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleActionNotice(isTa ? 'சுயவிவர விவரங்களைப் புதுப்பித்தல்' : 'Update Profile Details')}
              className="btn-edit-profile"
            >
              {isTa ? 'சுயவிவர விவரங்களைப் புதுப்பிக்கவும்' : 'Update Profile Details'}
            </button>
          </div>

          {/* Quick Study Materials Card */}
          <div className="gov-card prep-resources-card">
            <h3 className="sidebar-section-title">{isTa ? 'தேர்வுத் தயாரிப்பு வளங்கள்' : 'Preparation Resources'}</h3>
            <p className="card-subtext">
              {isTa
                ? 'நீங்கள் விண்ணப்பித்த பணிகளுக்கான பரிந்துரைக்கப்பட்ட தேர்வு வழிகாட்டிகள் மற்றும் வினாத்தாள்கள்.'
                : 'Recommended exam guides and question papers for your applied vacancies.'}
            </p>
            <Link to="/study-materials" className="btn-view-materials">
              <span>{isTa ? 'படிப்பு வளங்களைப் பார்வையிடு' : 'View Study Materials'}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </aside>

        {/* Right Main Column: Metrics & Tabbed Sections */}
        <main className="dashboard-main-content">
          {/* Stat Overview Cards */}
          <div className="dash-stats-grid">
            <div className="gov-card dash-stat-card">
              <div className="dash-stat-top">
                <span className="stat-label">{isTa ? 'விண்ணப்பித்த பணிகள்' : 'Applied Jobs'}</span>
                <span className="stat-icon-pill icon-blue">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  </svg>
                </span>
              </div>
              <span className="stat-big-number">{stats.appliedJobs}</span>
              <span className="stat-trend-text">{isTa ? 'செயலில் உள்ள விண்ணப்பங்கள்' : 'Active Applications'}</span>
            </div>

            <div className="gov-card dash-stat-card">
              <div className="dash-stat-top">
                <span className="stat-label">{isTa ? 'சேமிக்கப்பட்ட பணிகள்' : 'Saved Jobs'}</span>
                <span className="stat-icon-pill icon-gold">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
              </div>
              <span className="stat-big-number">{stats.savedJobs}</span>
              <span className="stat-trend-text">{isTa ? 'குறிக்கப்பட்ட காலிப்பணியிடங்கள்' : 'Bookmarked Vacancies'}</span>
            </div>

            <div className="gov-card dash-stat-card">
              <div className="dash-stat-top">
                <span className="stat-label">{t('status.underReview')}</span>
                <span className="stat-icon-pill icon-orange">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
              </div>
              <span className="stat-big-number">{stats.underReview}</span>
              <span className="stat-trend-text">{isTa ? 'சரிபார்ப்பு செயல்பாட்டில் உள்ளது' : 'Verification In Progress'}</span>
            </div>

            <div className="gov-card dash-stat-card">
              <div className="dash-stat-top">
                <span className="stat-label">{isTa ? 'நுழைவுச்சீட்டுகள்' : 'Admit Cards'}</span>
                <span className="stat-icon-pill icon-green">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </span>
              </div>
              <span className="stat-big-number">{stats.admitCards}</span>
              <span className="stat-trend-text">{isTa ? 'பதிவிறக்கத்திற்குத் தயார்' : 'Ready for Download'}</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="dash-tabs-bar">
            <button
              type="button"
              className={`dash-tab-btn ${activeTab === 'applied' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('applied')}
            >
              {isTa ? `விண்ணப்பித்த பணிகள் & நிலை (${appliedJobs.length})` : `Applied Jobs & Status (${appliedJobs.length})`}
            </button>
            <button
              type="button"
              className={`dash-tab-btn ${activeTab === 'saved' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              {isTa ? `சேமிக்கப்பட்ட பணிகள் (${savedJobs.length})` : `Saved Jobs (${savedJobs.length})`}
            </button>
            <button
              type="button"
              className={`dash-tab-btn ${activeTab === 'notifications' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              {isTa ? `அறிவிப்புகள் & எச்சரிக்கைகள் (${notifications.length})` : `Notifications & Alerts (${notifications.length})`}
            </button>
          </div>

          {/* Tab 1: Applied Jobs & Application Status */}
          {activeTab === 'applied' && (
            <div className="tab-pane-content">
              <div className="applied-jobs-list">
                {appliedJobs.map((app) => (
                  <div key={app.id} className="gov-card applied-job-card">
                    <div className="app-card-header">
                      <div>
                        <span className="app-org-tag">{app.organization}</span>
                        <h4 className="app-job-title">{app.jobTitle}</h4>
                        <span className="app-ref-number">
                          {t('applications.applicationId')}: {app.applicationNo}
                        </span>
                      </div>
                      <StatusBadge status={app.status} variant={app.statusType} />
                    </div>

                    <div className="app-card-details">
                      <div className="app-meta-box">
                        <span className="app-meta-lbl">{t('applications.submittedDate')}</span>
                        <span className="app-meta-val">{app.appliedDate}</span>
                      </div>
                      <div className="app-meta-box">
                        <span className="app-meta-lbl">{isTa ? 'தற்போதைய நிலை' : 'Current Status'}</span>
                        <span className="app-meta-val">{app.nextAction}</span>
                      </div>
                    </div>

                    <div className="app-card-footer">
                      <button
                        type="button"
                        onClick={() => handleActionNotice(isTa ? `விண்ணப்ப ஒப்புகைச் சீட்டு - ${app.applicationNo}` : `Application Receipt - ${app.applicationNo}`)}
                        className="btn-app-secondary"
                      >
                        {isTa ? 'விண்ணப்ப ஒப்புகைச் சீட்டு (PDF)' : 'Application Receipt (PDF)'}
                      </button>
                      {app.status.includes('Admit Card') && (
                        <button
                          type="button"
                          onClick={() => handleActionNotice(isTa ? `நுழைவுச்சீட்டு பதிவிறக்கம் - ${app.applicationNo}` : `Admit Card Download - ${app.applicationNo}`)}
                          className="btn-app-highlight"
                        >
                          {isTa ? 'நுழைவுச்சீட்டு பதிவிறக்கம்' : 'Download Admit Card'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Saved Jobs */}
          {activeTab === 'saved' && (
            <div className="tab-pane-content">
              <div className="saved-jobs-list">
                {savedJobs.map((item) => (
                  <div key={item.id} className="gov-card saved-job-card">
                    <div className="saved-job-info">
                      <span className="category-pill">{tCategory(item.category)}</span>
                      <h4 className="saved-job-title">{item.title}</h4>
                      <span className="saved-job-org">{item.organization}</span>
                      <div className="saved-meta-row">
                        <span>{t('jobs.vacancies')}: <strong>{item.vacancies}</strong></span>
                        <span>•</span>
                        <span>{t('jobs.lastDate')}: <strong className="text-warning">{item.lastDate}</strong></span>
                      </div>
                    </div>
                    <div className="saved-job-actions">
                      <Link to={`/jobs/${item.id}`} className="btn-app-primary">
                        {t('jobs.apply')}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Notifications & Alerts */}
          {activeTab === 'notifications' && (
            <div className="tab-pane-content">
              <div className="notifications-list">
                {notifications.map((n) => (
                  <div key={n.id} className={`gov-card notification-card ${n.unread ? 'notif-unread' : ''}`}>
                    <div className="notif-header">
                      <div className="notif-title-group">
                        {n.unread && <span className="unread-dot" />}
                        <h4 className="notif-title">{n.title}</h4>
                      </div>
                      <span className="notif-date">{n.date}</span>
                    </div>
                    <p className="notif-text">{n.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CandidateDashboard;
