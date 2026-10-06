import React from 'react';

export const PhaseRoadmap = () => {
  const phases = [
    {
      number: '01',
      title: 'Full-Stack Foundation',
      desc: 'React frontend, Express modular API, MySQL pool config, health endpoint, security headers',
      status: 'completed',
    },
    {
      number: '02',
      title: 'Auth & Role Authorization',
      desc: 'JWT authentication, password hashing, Admin vs Candidate role access control',
      status: 'next',
    },
    {
      number: '03',
      title: 'User Profile Management',
      desc: 'Personal details, candidate qualifications, resume & document storage pipeline',
      status: 'pending',
    },
    {
      number: '04',
      title: 'Database Schema & Migrations',
      desc: 'MySQL schema execution, foreign key constraints, indexes, and seed datasets',
      status: 'pending',
    },
    {
      number: '05',
      title: 'Job Vacancies & Listings',
      desc: 'Admin job publisher, filters, search by ministry/department, eligibility checker',
      status: 'pending',
    },
    {
      number: '06',
      title: 'Application Workflow Engine',
      desc: 'Candidate application submission, tracking IDs, status lifecycle updates',
      status: 'pending',
    },
    {
      number: '07',
      title: 'Study Materials & Syllabus',
      desc: 'Categorized study resources, exam patterns, downloadable official syllabi',
      status: 'pending',
    },
    {
      number: '08',
      title: 'Notifications & Alerts',
      desc: 'In-app notification feed, application status email alerts, deadline reminders',
      status: 'pending',
    },
  ];

  return (
    <div className="section-block">
      <div className="section-header">
        <h2 className="section-title">
          Phased Engineering Roadmap
        </h2>
        <p className="section-subtitle">
          Structured phase progression ensuring rock-solid code quality without mock shortcuts.
        </p>
      </div>

      <div className="roadmap-grid">
        {phases.map((phase) => (
          <div
            key={phase.number}
            className={`glass-panel roadmap-item ${
              phase.status === 'completed'
                ? 'phase-completed'
                : phase.status === 'next'
                ? 'phase-next'
                : 'phase-future'
            }`}
          >
            <div className="roadmap-badge-row">
              <span className="phase-num">Phase {phase.number}</span>
              <span className={`status-pill pill-${phase.status}`}>
                {phase.status === 'completed' ? '✓ Completed' : phase.status === 'next' ? '→ Next Up' : 'Scheduled'}
              </span>
            </div>
            <h4 className="roadmap-title">{phase.title}</h4>
            <p className="roadmap-desc">{phase.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
