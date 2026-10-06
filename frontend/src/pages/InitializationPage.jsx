import React from 'react';
import { HealthChecker } from '../components/HealthChecker';
import { ArchitectureCard } from '../components/ArchitectureCard';
import { RolePreviewCard } from '../components/RolePreviewCard';
import { PhaseRoadmap } from '../components/PhaseRoadmap';

export const InitializationPage = () => {
  return (
    <main className="init-page-container">
      {/* Hero Announcement */}
      <section className="hero-section">
        <div className="hero-emblem-badge float-subtle">
          <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
            <path d="M24 5L5 17V20H43V17L24 5Z" fill="#f59e0b" />
            <rect x="9" y="22" width="4.5" height="16" rx="1.5" fill="#38bdf8" />
            <rect x="18" y="22" width="4.5" height="16" rx="1.5" fill="#38bdf8" />
            <rect x="26" y="22" width="4.5" height="16" rx="1.5" fill="#38bdf8" />
            <rect x="34.5" y="22" width="4.5" height="16" rx="1.5" fill="#38bdf8" />
            <path d="M5 40H43V43H5V40Z" fill="#f59e0b" />
            <circle cx="24" cy="14" r="3" fill="#0f172a" />
          </svg>
        </div>

        <div className="phase-pill-banner">
          <span className="live-dot pulse-glow"></span>
          <span>PHASE 01: SYSTEM ARCHITECTURE & INITIALIZATION</span>
        </div>

        <h1 className="hero-title">
          GOVERNMENT JOB PORTAL
        </h1>

        <p className="hero-subtitle">
          அரசுப் பணியாளர் தேர்வு மற்றும் வேலைவாய்ப்பு தளம் — National public sector employment & recruitment management system. The full-stack core foundation is established, connected, and verified.
        </p>

        <div className="hero-stats-row">
          <div className="hero-stat-item">
            <span className="hero-stat-val gradient-text-gold">Phase 01</span>
            <span className="hero-stat-lbl">Active Development</span>
          </div>
          <div className="stat-separator">/</div>
          <div className="hero-stat-item">
            <span className="hero-stat-val gradient-text-cyan">2 Roles</span>
            <span className="hero-stat-lbl">Admin & Candidate</span>
          </div>
          <div className="stat-separator">/</div>
          <div className="hero-stat-item">
            <span className="hero-stat-val">3 Tiers</span>
            <span className="hero-stat-lbl">React • Express • MySQL</span>
          </div>
        </div>
      </section>

      {/* Live System Health Section */}
      <section className="content-section">
        <HealthChecker />
      </section>

      {/* Tiered Architecture Section */}
      <section className="content-section">
        <ArchitectureCard />
      </section>

      {/* Role Architecture Blueprint */}
      <section className="content-section">
        <RolePreviewCard />
      </section>

      {/* Phased Roadmap */}
      <section className="content-section">
        <PhaseRoadmap />
      </section>
    </main>
  );
};
