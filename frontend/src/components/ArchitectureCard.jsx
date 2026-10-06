import React from 'react';

export const ArchitectureCard = () => {
  const tiers = [
    {
      title: 'Frontend Client Layer',
      tech: 'React.js (v19) + Vite',
      status: 'Active & Verified',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
      accent: 'cyan',
      features: [
        'Vite build tooling & HMR',
        'Component & routing structure ready',
        'Sovereign civic design system',
        'Zero mock APIs - Real network bridge',
      ],
    },
    {
      title: 'Backend API Gateway',
      tech: 'Node.js + Express.js',
      status: 'Operational',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      ),
      accent: 'gold',
      features: [
        'Layered modular MVC architecture',
        'Security middleware (Helmet & CORS)',
        'Centralized error handling & logging',
        'Standardized API response contracts',
      ],
    },
    {
      title: 'Database Foundation',
      tech: 'MySQL 8.0+ / mysql2',
      status: 'Pool Configured',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      ),
      accent: 'emerald',
      features: [
        'Connection pool architecture',
        'Secure environment variable bindings',
        'Graceful fallback startup check',
        'Full relational schema planned for Phase 04',
      ],
    },
  ];

  return (
    <div className="section-block">
      <div className="section-header">
        <h2 className="section-title">
          Tiered Architectural Separation
        </h2>
        <p className="section-subtitle">
          Phase 01 foundation delivers clean decoupling between presentation, application logic, and persistence.
        </p>
      </div>

      <div className="tiers-grid">
        {tiers.map((tier, index) => (
          <div key={index} className={`glass-panel tier-card border-${tier.accent}`}>
            <div className="tier-header">
              <div className={`tier-icon icon-${tier.accent}`}>
                {tier.icon}
              </div>
              <span className={`status-badge badge-${tier.accent}`}>
                {tier.status}
              </span>
            </div>

            <h3 className="tier-title">{tier.title}</h3>
            <div className="tier-tech">{tier.tech}</div>

            <ul className="tier-list">
              {tier.features.map((feature, fIndex) => (
                <li key={fIndex}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
