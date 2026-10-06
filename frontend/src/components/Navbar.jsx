import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationBell } from './notifications/NotificationBell';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { t, isTamil } = useLanguage();

  const navLinks = isAdmin
    ? [
        { label: isTamil ? 'நிர்வாக பலகை' : 'Admin Dashboard', path: '/admin/dashboard' },
        { label: isTamil ? 'அரசுப் பணிகள்' : 'Government Jobs', path: '/jobs' },
        { label: isTamil ? 'விண்ணப்பங்கள்' : 'Applications', path: '/admin/applications' },
        { label: isTamil ? 'படிப்பு வளங்கள்' : 'Study Materials', path: '/admin/materials' },
        { label: isTamil ? 'அறிவிப்புகள்' : 'Notifications', path: '/admin/notifications' },
      ]
    : [
        { label: isTamil ? 'முகப்பு' : 'Home', path: '/' },
        { label: isTamil ? 'அரசுப் பணிகள்' : 'Government Jobs', path: '/jobs' },
        { label: isTamil ? 'படிப்பு வளங்கள்' : 'Study Materials', path: '/study-materials' },
        { label: isTamil ? 'பாடத்திட்டம்' : 'Syllabus', path: '/syllabus' },
        ...(isAuthenticated && !isAdmin
          ? [
              { label: isTamil ? 'என் விண்ணப்பங்கள்' : 'My Applications', path: '/my-applications' },
              { label: isTamil ? 'அறிவிப்புகள்' : 'Notifications', path: '/notifications' },
            ]
          : []),
        { label: isTamil ? 'எங்களைப் பற்றி' : 'About', path: '/about' },
      ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <header className="gov-navbar">
      {/* Official Top Utility Strip */}
      <div className="navbar-top-strip">
        <div className="navbar-container top-strip-content">
          <div className="top-strip-left">
            <span className="portal-service-tag">
              {isTamil ? 'அதிகாரப்பூர்வ அரசு பணியாளர் தேர்வு தளம்' : 'Official Government Recruitment Portal'}
            </span>
            <span className="strip-divider">|</span>
            <span className="portal-version-tag">
              {isTamil ? 'இந்திய அரசு / மாநில அரசு சேவைகள் அடைவு' : 'Govt of India / State Govt Services Directory'}
            </span>
          </div>
          <div className="top-strip-right">
            <Link
              to="/candidate/dashboard"
              className={`top-strip-link ${!isAdmin && isAuthenticated ? 'strip-link-active' : ''}`}
            >
              {isTamil ? 'வேட்பாளர் தளம்' : 'Candidate Portal'}
            </Link>
            <span className="strip-divider">|</span>
            <Link
              to="/admin/dashboard"
              className={`top-strip-link ${isAdmin ? 'strip-link-active' : ''}`}
            >
              {isTamil ? 'நிர்வாக தளம்' : 'Admin Portal'}
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="navbar-main">
        <div className="navbar-container navbar-main-content">
          {/* Brand Logo & Title */}
          <Link to="/" className="portal-brand brand-container" onClick={() => setMobileMenuOpen(false)}>
            <div className="brand-icon-box">
              <img
                src="/images/08_ashoka_emblem_transparent.png"
                alt={isTamil ? "இந்திய அரசுச் சின்னம்" : "Government of India emblem"}
                className="portal-emblem navbar-ashoka-emblem"
              />
            </div>
            <div className="brand-text-block">
              <span className="brand-title">GOVERNMENT JOB PORTAL</span>
              <span className="brand-subtext">
                {isTamil
                  ? 'அரசுப் பணியாளர் தேர்வு மற்றும் வேலைவாய்ப்பு தளம்'
                  : 'National Recruitment & Vacancy System'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav-links" aria-label="Main Navigation">
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Action Buttons, Language Switcher & Theme Toggle */}
          <div className="navbar-actions">
            {/* Desktop / Medium 2-Row Controls Container */}
            <div className="navbar-actions-desktop">
              {/* ROW 1: Language Selector + Theme Toggle */}
              <div className="navbar-actions-row navbar-actions-row-1">
                <LanguageSwitcher idPrefix="nav-header" />
                <ThemeToggle />
              </div>

              {/* ROW 2: Auth Buttons or Session Controls */}
              <div className="navbar-actions-row navbar-actions-row-2">
                {!isAuthenticated ? (
                  <>
                    <Link to="/register" className="btn-nav btn-primary">
                      {isTamil ? 'பதிவு' : 'Register'}
                    </Link>
                    <Link to="/login" className="btn-nav btn-outline">
                      {isTamil ? 'உள்நுழைவு' : 'Sign In'}
                    </Link>
                  </>
                ) : (
                  <>
                    <NotificationBell />
                    <Link
                      to={isAdmin ? '/admin/dashboard' : '/candidate/dashboard'}
                      className="btn-nav btn-outline user-session-btn"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {isAdmin ? (
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        ) : (
                          <>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </>
                        )}
                      </svg>
                      <span>
                        {isAdmin
                          ? (isTamil ? 'நிர்வாக கன்சோல்' : 'Admin Console')
                          : (user?.name || user?.full_name?.split(' ')[0] || (isTamil ? 'கட்டுப்பாட்டு பலகை' : 'Dashboard'))}
                      </span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="btn-nav btn-outline"
                      style={{ cursor: 'pointer' }}
                      title={isTamil ? 'வெளியேறு' : 'Sign Out'}
                    >
                      {isTamil ? 'வெளியேறு' : 'Sign Out'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Header Controls (<= 768px) */}
            <div className="navbar-actions-mobile">
              {isAuthenticated && <NotificationBell />}
              <button
                type="button"
                className="mobile-hamburger"
                aria-label="Toggle navigation menu"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {mobileMenuOpen ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                  ) : (
                    <>
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <div className="mobile-nav-container">
            {/* Mobile Language Switcher Row */}
            <div className="mobile-drawer-lang-row">
              <span className="mobile-drawer-lang-title">
                {isTamil ? 'மொழி / Language:' : 'Language / மொழி:'}
              </span>
              <LanguageSwitcher idPrefix="nav-drawer" />
            </div>

            {/* Mobile Theme Row */}
            <div className="mobile-drawer-theme-row">
              <span className="mobile-drawer-lang-title">
                {isTamil ? 'வண்ண தீம் / Theme:' : 'Theme / தீம்:'}
              </span>
              <ThemeToggle />
            </div>

            <hr className="mobile-drawer-divider" />

            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <hr className="mobile-drawer-divider" />
            <div className="mobile-portal-links">
              <Link
                to="/candidate/dashboard"
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {isTamil ? 'வேட்பாளர் பலகை' : 'Candidate Dashboard'}
              </Link>
              <Link
                to="/admin/dashboard"
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {isTamil ? 'நிர்வாக பலகை' : 'Admin Dashboard'}
              </Link>
            </div>
            <div className="mobile-auth-actions">
              {isAuthenticated ? (
                <>
                  <div style={{ padding: '0.5rem 0', fontSize: '0.875rem', color: 'var(--text-muted, #64748b)' }}>
                    {isTamil ? 'உள்நுழைந்துள்ள கணக்கு: ' : 'Signed in as: '}
                    <strong>{user?.full_name || user?.name || user?.email}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn-nav btn-outline w-full text-center"
                    style={{ width: '100%', cursor: 'pointer' }}
                  >
                    {isTamil ? 'வெளியேறு' : 'Sign Out'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn-nav btn-outline w-full text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {isTamil ? 'உள்நுழைவு' : 'Sign In'}
                  </Link>
                  <Link
                    to="/register"
                    className="btn-nav btn-primary w-full text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {isTamil ? 'பதிவு' : 'Register'}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
