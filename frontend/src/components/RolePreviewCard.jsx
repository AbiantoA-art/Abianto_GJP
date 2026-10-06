import React from 'react';

export const RolePreviewCard = () => {
  return (
    <div className="section-block">
      <div className="section-header">
        <h2 className="section-title">
          User Role Architecture Blueprint
        </h2>
        <p className="section-subtitle">
          The portal is engineered to serve two distinct authorization domains in Phase 02.
        </p>
      </div>

      <div className="roles-grid">
        {/* Admin Card */}
        <div className="glass-panel role-card">
          <div className="role-top">
            <div className="role-icon-box gold-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <span className="upcoming-tag">Scheduled for Phase 02 / 05</span>
              <h3 className="role-name">Role 01: System & Portal Admin</h3>
            </div>
          </div>

          <p className="role-description">
            Dedicated administrative console for publishing official government notifications, managing departmental vacancies, reviewing incoming applications, and monitoring portal audits.
          </p>

          <div className="role-highlights">
            <div className="highlight-pill">Official Job Posting & Editing</div>
            <div className="highlight-pill">Application Screening & Shortlisting</div>
            <div className="highlight-pill">Study Materials & Syllabus Upload</div>
            <div className="highlight-pill">Candidate Analytics & Reports</div>
          </div>
        </div>

        {/* Candidate Card */}
        <div className="glass-panel role-card">
          <div className="role-top">
            <div className="role-icon-box cyan-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <span className="upcoming-tag">Scheduled for Phase 02 / 06</span>
              <h3 className="role-name">Role 02: Candidate / Applicant</h3>
            </div>
          </div>

          <p className="role-description">
            User-centric dashboard for discovering eligible vacancies across ministries, submitting direct applications with documentation, tracking application status, and accessing preparation materials.
          </p>

          <div className="role-highlights">
            <div className="highlight-pill">Direct Job Search & Category Filters</div>
            <div className="highlight-pill">Live Application Status Tracking</div>
            <div className="highlight-pill">Saved Jobs & Bookmark Queue</div>
            <div className="highlight-pill">Real-time Notification Alerts</div>
          </div>
        </div>
      </div>
    </div>
  );
};
