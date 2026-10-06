import React from 'react';
import { Link } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { JobCard } from '../components/JobCard';
import { CategoryCard } from '../components/CategoryCard';
import { HomeCarousel } from '../components/HomeCarousel';
import { JOB_CATEGORIES, SAMPLE_JOBS } from '../data/placeholderData';
import { useLanguage } from '../context/LanguageContext';

export const Home = () => {
  const { isTamil } = useLanguage();

  // Latest Jobs sample
  const latestJobs = SAMPLE_JOBS.slice(0, 6);
  // Closing Soon sample
  const closingSoonJobs = SAMPLE_JOBS.filter((j) => j.isClosingSoon);

  return (
    <div className="home-page-layout">
      {/* 1. Hero Image Carousel (FIRST major visual content immediately below Navbar) */}
      <section className="home-hero-carousel-section">
        <HomeCarousel />
      </section>

      {/* 2. Hero Section & Introduction */}
      <section className="portal-hero-section">
        <div className="portal-hero-container">
          <div className="hero-announcement-strip">
            <span className="announcement-pill">
              {isTamil ? 'அதிகாரப்பூர்வ வேலைவாய்ப்பு அடைவு' : 'Official Vacancy Directory'}
            </span>
            <span className="announcement-text">
              {isTamil ? 'மத்திய & மாநில அரசுப் பணிகள் 2026' : 'Central & State Government Jobs 2026'}
            </span>
          </div>

          <h1 className="portal-hero-title">
            GOVERNMENT JOB PORTAL
          </h1>
          <p className="portal-subtext-tamil" style={{ fontSize: '1.2rem', color: 'var(--color-gold, #b45309)', fontWeight: 600, marginTop: '-0.5rem', marginBottom: '0.75rem' }}>
            {isTamil
              ? 'அரசுப் பணியாளர் தேர்வு மற்றும் வேலைவாய்ப்பு தளம்'
              : 'National Recruitment & Vacancy System'}
          </p>

          <p className="portal-hero-tagline">
            {isTamil
              ? 'மத்திய மற்றும் மாநில அரசுகளின் அமைச்சகங்கள், துறைகள் மற்றும் பொதுத்துறை நிறுவனங்களின் வேலைவாய்ப்புகளைக் கண்டறிந்து விண்ணப்பிப்பதற்கான அதிகாரப்பூர்வ தளம்.'
              : 'Official portal to explore and apply for central and state government ministry, department, and public sector employment opportunities.'}
          </p>

          {/* Reusable Search Interface */}
          <div className="hero-search-wrapper">
            <SearchBar />
          </div>

          {/* Quick Highlight Metrics */}
          <div className="hero-highlights-strip">
            <div className="highlight-item">
              <span className="highlight-number">45,000+</span>
              <span className="highlight-label">
                {isTamil ? 'செயலில் உள்ள காலியிடங்கள்' : 'Active Vacancies'}
              </span>
            </div>
            <div className="highlight-separator" />
            <div className="highlight-item">
              <span className="highlight-number">24+</span>
              <span className="highlight-label">
                {isTamil ? 'பணிப் பிரிவுகள்' : 'Job Categories'}
              </span>
            </div>
            <div className="highlight-separator" />
            <div className="highlight-item">
              <span className="highlight-number">100%</span>
              <span className="highlight-label">
                {isTamil ? 'சரிபார்க்கப்பட்ட அறிவிப்புகள்' : 'Verified Notifications'}
              </span>
            </div>
            <div className="highlight-separator" />
            <div className="highlight-item">
              <span className="highlight-number">{isTamil ? 'அனைத்திந்தியா' : 'All India'}</span>
              <span className="highlight-label">
                {isTamil ? 'மத்திய & மாநில ஒதுக்கீடுகள்' : 'Central & State Quotas'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Urgent Closing Soon Alert Section */}
      {closingSoonJobs.length > 0 && (
        <section className="section-container closing-soon-section">
          <div className="section-title-row">
            <div className="title-with-badge">
              <span className="urgent-pulse-indicator" />
              <div>
                <h2 className="section-main-title">
                  {isTamil ? 'விண்ணப்ப முடிவு நெருங்குகிறது' : 'Closing Soon'}
                </h2>
                <p className="section-main-subtitle">
                  {isTamil
                    ? 'அடுத்த சில நாட்களில் விண்ணப்பங்கள் முடிவடைகின்றன. காலக்கெடுவிற்கு முன் உங்கள் விண்ணப்பத்தைச் சரிபார்த்து சமர்ப்பிக்கவும்.'
                    : 'Applications closing in the next few days. Review and submit your application before the deadline.'}
                </p>
              </div>
            </div>
            <Link to="/jobs" className="section-view-all-link">
              <span>{isTamil ? 'அனைத்து காலக்கெடுக்களையும் காண்க' : 'View All Deadlines'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>

          <div className="jobs-cards-grid">
            {closingSoonJobs.map((job) => (
              <JobCard key={job.id} job={job} featured={true} />
            ))}
          </div>
        </section>
      )}

      {/* 3. Job Categories Section (All 24 Categories) */}
      <section className="section-container categories-section">
        <div className="section-title-row">
          <div>
            <h2 className="section-main-title">
              {isTamil ? 'அரசுத் துறைகள் மற்றும் பிரிவுகள் வாரியாகத் தேடுங்கள்' : 'Explore by Departments & Categories'}
            </h2>
            <p className="section-main-subtitle">
              {isTamil
                ? 'அமைச்சகங்கள், தொழில்நுட்பப் பிரிவுகள் மற்றும் மாநில நிர்வாகங்கள் வாரியாக வகைப்படுத்தப்பட்ட பணிகள்.'
                : 'Vacancies organized by ministries, technical departments, and state administrations.'}
            </p>
          </div>
          <Link to="/jobs" className="section-view-all-link">
            <span>{isTamil ? 'அனைத்து 24 பிரிவுகளையும் காண்க' : 'View All 24 Categories'}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        <div className="categories-cards-grid">
          {JOB_CATEGORIES.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* 4. Latest Jobs Section */}
      <section className="section-container latest-jobs-section">
        <div className="section-title-row">
          <div>
            <h2 className="section-main-title">
              {isTamil ? 'சமீபத்திய அரசுப் பணி அறிவிப்புகள்' : 'Latest Government Job Notifications'}
            </h2>
            <p className="section-main-subtitle">
              {isTamil
                ? 'சமீபத்தில் வெளியிடப்பட்ட அதிகாரப்பூர்வ ஆட்சேர்ப்பு மற்றும் வேலைவாய்ப்பு அறிவிப்புகள்.'
                : 'Recently published official recruitment and vacancy notifications.'}
            </p>
          </div>
          <Link to="/jobs" className="section-view-all-link">
            <span>
              {isTamil
                ? `அனைத்தையும் காண்க (${SAMPLE_JOBS.length}+ பணிகள்)`
                : `View All (${SAMPLE_JOBS.length}+ Jobs)`}
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        <div className="jobs-cards-grid">
          {latestJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>

        <div className="browse-more-row">
          <Link to="/jobs" className="btn-browse-more">
            <span>{isTamil ? 'முழு வேலைவாய்ப்பு அடைவை ஆராயுங்கள்' : 'Explore Complete Vacancy Directory'}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </section>

      {/* 5. Citizen & Candidate Advisory Banner */}
      <section className="section-container">
        <div className="citizen-advisory-card">
          <div className="advisory-icon-box">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="advisory-content">
            <h3 className="advisory-title">
              {isTamil ? 'வேட்பாளர்களுக்கான அதிகாரப்பூர்வ எச்சரிக்கை' : 'Official Candidate Advisory'}
            </h3>
            <p className="advisory-text">
              {isTamil
                ? 'அரசுப் பணிகள் முற்றிலும் தகுதி மற்றும் அரசு நடத்தும் தேர்வுகளின் அடிப்படையிலேயே வழங்கப்படுகின்றன. இடைத்தரகர்களையோ அல்லது அங்கீகரிக்கப்படாத நபர்களையோ நம்ப வேண்டாம். அனைத்து விண்ணப்பக் கட்டணங்களும் அதிகாரப்பூர்வ தளம் வாயிலாக மட்டுமே செலுத்தப்பட வேண்டும்.'
                : 'Government appointments are strictly merit-based following official examinations. Beware of touts or unauthorized intermediaries. All application fees must be paid through official channels.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
