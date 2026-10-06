import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

/**
 * About Page Component
 * Implements Sections 9, 10, 11, 12, and 13:
 * - Bilingual support for Tamil ('ta') and English ('en')
 * - Layout: ABOUT HERO -> Portal Introduction -> Main Features -> How the Portal Helps Candidates -> Developer Credit
 * - Strictly authorized developer credit: ABI ANTO A, Department of Computer Science
 */
export const About = () => {
  const { isTamil } = useLanguage();

  return (
    <div className="about-page-layout">
      {/* 1. ABOUT HERO */}
      <div className="page-header-strip">
        <div className="section-container">
          <div className="breadcrumb-nav">
            <Link to="/">{isTamil ? 'முகப்பு' : 'Home'}</Link> /{' '}
            <span className="active-crumb">{isTamil ? 'அரசுப் பணி தளம் பற்றி' : 'About'}</span>
          </div>
          <h1 className="page-header-title">
            {isTamil ? 'அரசுப் பணி தளம் பற்றி' : 'About Government Job Portal'}
          </h1>
          <p className="page-header-subtitle">
            {isTamil
              ? 'அரசுத் துறைகளின் வேலைவாய்ப்புகள், விண்ணப்பங்கள், படிப்பு மற்றும் தேர்வு தொடர்பான அதிகாரப்பூர்வ தளம்'
              : 'Discovering government recruitment opportunities, applications, study materials and examination resources'}
          </p>
        </div>
      </div>

      <div className="section-container page-content-wrap">
        {/* 2. Portal Introduction */}
        <section className="gov-card about-intro-card" style={{ marginBottom: '2.5rem', padding: '2rem 2.5rem' }}>
          <div className="about-intro-content">
            <div className="section-tag-pill" style={{ marginBottom: '1rem', display: 'inline-block' }}>
              {isTamil ? 'அதிகாரப்பூர்வ தளம்' : 'Official Portal'}
            </div>
            <h2 className="about-title" style={{ fontSize: '1.6rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              {isTamil ? 'அரசுப் பணி தளம் பற்றி' : 'About Government Job Portal'}
            </h2>
            <p className="about-paragraph" style={{ fontSize: '1.05rem', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
              {isTamil
                ? 'அரசுத் துறைகளின் வேலைவாய்ப்புகள், விண்ணப்பங்கள், படிப்பு மற்றும் தேர்வு தொடர்பான தகவல்களை ஒரே தளத்தில் வழங்கும் வகையில் இந்த தளம் உருவாக்கப்பட்டுள்ளது.'
                : 'Government Job Portal provides a centralized platform for discovering government recruitment opportunities, applications, study materials and examination resources.'}
            </p>
          </div>
        </section>

        {/* 3. Main Features */}
        <section className="about-features-section" style={{ marginBottom: '3rem' }}>
          <div className="section-title-row" style={{ marginBottom: '1.5rem' }}>
            <div>
              <h2 className="section-main-title">
                {isTamil ? 'தளத்தின் முக்கிய சேவைகள்' : 'Key Portal Services'}
              </h2>
              <p className="section-main-subtitle">
                {isTamil
                  ? 'வேட்பாளர்களுக்கான ஒருங்கிணைந்த சேவைகள் மற்றும் வசதிகள்'
                  : 'Integrated features designed to empower every candidate'}
              </p>
            </div>
          </div>

          <div
            className="about-features-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Feature 1: Government Jobs */}
            <div className="gov-card about-feature-card" style={{ padding: '1.75rem' }}>
              <div className="feature-icon-box" style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                {isTamil ? 'அரசுப் பணிகள்' : 'Government Jobs'}
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.925rem' }}>
                {isTamil ? (
                  <>
                    <li>பல்வேறு அரசு துறைகளின் வேலைவாய்ப்பு தகவல்களைப் பார்க்கலாம்.</li>
                    <li>வேலைவாய்ப்புகளைத் தேடி, வகைப்படுத்தி, வடிகட்டி பார்க்கலாம்.</li>
                  </>
                ) : (
                  <>
                    <li>Browse government employment opportunities from different departments.</li>
                    <li>Search, filter and explore available vacancies.</li>
                  </>
                )}
              </ul>
            </div>

            {/* Feature 2: Application Services */}
            <div className="gov-card about-feature-card" style={{ padding: '1.75rem' }}>
              <div className="feature-icon-box" style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                {isTamil ? 'விண்ணப்ப சேவை' : 'Application Services'}
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.925rem' }}>
                {isTamil ? (
                  <>
                    <li>தகுதியான வேலைவாய்ப்புகளுக்கு விண்ணப்பிக்கலாம்.</li>
                    <li>விண்ணப்ப நிலையை கண்காணிக்கலாம்.</li>
                  </>
                ) : (
                  <>
                    <li>Apply for eligible government job opportunities.</li>
                    <li>Track application status.</li>
                  </>
                )}
              </ul>
            </div>

            {/* Feature 3: Study Resources */}
            <div className="gov-card about-feature-card" style={{ padding: '1.75rem' }}>
              <div className="feature-icon-box" style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                {isTamil ? 'படிப்பு வளங்கள்' : 'Study Resources'}
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.925rem' }}>
                {isTamil ? (
                  <li>தேர்வு தயாரிப்பிற்கான படிப்பு வளங்கள் மற்றும் பாடத்திட்டங்களை அணுகலாம்.</li>
                ) : (
                  <li>Access study materials and examination syllabi for preparation.</li>
                )}
              </ul>
            </div>

            {/* Feature 4: Notifications */}
            <div className="gov-card about-feature-card" style={{ padding: '1.75rem' }}>
              <div className="feature-icon-box" style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                {isTamil ? 'அறிவிப்புகள்' : 'Notifications'}
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.925rem' }}>
                {isTamil ? (
                  <>
                    <li>புதிய வேலைவாய்ப்புகள்</li>
                    <li>விண்ணப்ப நிலை மாற்றங்கள்</li>
                    <li>முக்கிய காலக்கெடு அறிவிப்புகள்</li>
                  </>
                ) : (
                  <>
                    <li>New job opportunities</li>
                    <li>Application status updates</li>
                    <li>Important deadline alerts</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* 4. How the Portal Helps Candidates */}
        <section className="gov-card about-pillars-card" style={{ marginBottom: '3rem', padding: '2rem 2.5rem' }}>
          <h2 className="section-main-title" style={{ marginBottom: '0.5rem' }}>
            {isTamil ? 'வேட்பாளர்களுக்கு தளம் எவ்வாறு உதவுகிறது?' : 'How the Portal Helps Candidates'}
          </h2>
          <p className="section-main-subtitle" style={{ marginBottom: '1.5rem' }}>
            {isTamil
              ? 'வெளிப்படையான மற்றும் தகுதி அடிப்படையிலான அரசுப் பணி தேர்வு'
              : 'Empowering candidates with transparency and equal opportunity'}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <div className="pillar-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  ✓
                </div>
                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {isTamil ? '100% சரிபார்க்கப்பட்ட தகவல்கள்' : '100% Verified Information'}
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {isTamil
                  ? 'அதிகாரப்பூர்வ அரசு அரசிதழ் அறிவிப்புகள் மற்றும் தேர்வாணைய உத்தரவுகளின் அடிப்படையில் மட்டுமே தகவல்கள் வெளியிடப்படுகின்றன.'
                  : 'All notifications are sourced directly from official government gazettes and public service commissions.'}
              </p>
            </div>

            <div className="pillar-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  ✓
                </div>
                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {isTamil ? 'எளிய விண்ணப்ப முறை' : 'Simplified Applications'}
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {isTamil
                  ? 'ஒற்றை முறை வேட்பாளர் பதிவு, ஆவணப் பதிவேற்றம் மற்றும் நேரடி விண்ணப்ப நிலை கண்காணிப்பு.'
                  : 'One-time registration, document uploads, and real-time application status tracking.'}
              </p>
            </div>

            <div className="pillar-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(217, 119, 6, 0.15)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  ✓
                </div>
                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {isTamil ? 'முழுமையான தயாரிப்பு வளங்கள்' : 'Comprehensive Preparation'}
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {isTamil
                  ? 'தேர்வு பாடத்திட்டம், வினாத்தாள் வடிவங்கள் மற்றும் வழிகாட்டிகளை இலவசமாக அணுகலாம்.'
                  : 'Free and direct access to exam syllabi, schemes, and curated preparation materials.'}
              </p>
            </div>
          </div>
        </section>

        {/* 5. DEVELOPER CREDIT (Section 12 Mandatory Specification) */}
        <section className="about-developer-section" style={{ marginBottom: '2.5rem' }}>
          <div
            className="gov-card developer-credit-card"
            style={{
              padding: '2.25rem',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-elevated, var(--bg-surface)) 100%)',
              boxShadow: 'var(--shadow-md)',
              maxWidth: '650px',
              margin: '0 auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--color-primary-subtle, rgba(30, 58, 138, 0.1))',
                  border: '2px solid var(--color-primary, #1e3a8a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary, #1e3a8a)',
                  flexShrink: 0,
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>

              <div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 700,
                    color: 'var(--color-gold, #b45309)',
                    display: 'block',
                    marginBottom: '0.25rem',
                  }}
                >
                  {isTamil ? 'உருவாக்கியவர்' : 'Developed By'}
                </span>
                <h3
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: 0,
                    letterSpacing: '0.02em',
                  }}
                >
                  Abi Anto A
                </h3>
                <p
                  style={{
                    margin: '0.35rem 0 0',
                    fontSize: '0.95rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  {isTamil ? 'கணினி அறிவியல் துறை' : 'Department of Computer Science'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
