import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { isTamil } = useLanguage();

  return (
    <footer className="gov-footer">
      <div className="gov-footer-container">
        {/* Navigation Grid */}
        <div className="footer-nav-grid">
          {/* Column 1: Quick Links */}
          <div className="footer-nav-column">
            <h4 className="footer-heading">
              {isTamil ? 'விரைவு இணைப்புகள்' : 'Quick Links'}
            </h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/">{isTamil ? 'முகப்பு' : 'Home'}</Link>
              </li>
              <li>
                <Link to="/jobs">{isTamil ? 'அரசுப் பணிகள்' : 'Government Jobs'}</Link>
              </li>
              <li>
                <Link to="/study-materials">{isTamil ? 'படிப்பு வளங்கள்' : 'Study Materials'}</Link>
              </li>
              <li>
                <Link to="/syllabus">{isTamil ? 'பாடத்திட்டம்' : 'Syllabus'}</Link>
              </li>
              <li>
                <Link to="/about">{isTamil ? 'பற்றி' : 'About'}</Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Recruitment Portals */}
          <div className="footer-nav-column">
            <h4 className="footer-heading">
              {isTamil ? 'அரசுப் பணித் தளங்கள்' : 'Recruitment Portals'}
            </h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/jobs">{isTamil ? 'புதிய வேலைவாய்ப்பு அறிவிப்புகள்' : 'Latest Job Notifications'}</Link>
              </li>
              <li>
                <Link to="/jobs?category_id=central-govt">{isTamil ? 'மத்திய அரசுப் பணிகள்' : 'Central Government Jobs'}</Link>
              </li>
              <li>
                <Link to="/jobs?category_id=tamil-nadu-govt">{isTamil ? 'மாநில அரசுப் பணிகள்' : 'State Government Jobs'}</Link>
              </li>
              <li>
                <Link to="/jobs?category_id=defence">{isTamil ? 'பாதுகாப்புத் துறைப் பணிகள்' : 'Defence & Police Vacancies'}</Link>
              </li>
              <li>
                <Link to="/jobs?category_id=railway">{isTamil ? 'ரயில்வே & வங்கிப் பணிகள்' : 'Railway & Banking Opportunities'}</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Candidate Services */}
          <div className="footer-nav-column">
            <h4 className="footer-heading">
              {isTamil ? 'வேட்பாளர் சேவைகள்' : 'Candidate Services'}
            </h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/candidate/dashboard">{isTamil ? 'வேட்பாளர் கட்டுப்பாட்டு பலகை' : 'Candidate Dashboard'}</Link>
              </li>
              <li>
                <Link to="/my-applications">{isTamil ? 'விண்ணப்ப நிலை சரிபார்ப்பு' : 'My Applications & Status'}</Link>
              </li>
              <li>
                <Link to="/syllabus">{isTamil ? 'பாடத்திட்டம் மற்றும் தேர்வு முறைகள்' : 'Exam Schemes & Syllabus'}</Link>
              </li>
              <li>
                <Link to="/study-materials">{isTamil ? 'முந்தைய ஆண்டு வினாத்தாள்கள்' : 'Study Notes & Past Papers'}</Link>
              </li>
              <li>
                <Link to="/notifications">{isTamil ? 'அறிவிப்புகள் மற்றும் எச்சரிக்கைகள்' : 'Notifications & Alerts'}</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Admin & Portal Guidelines */}
          <div className="footer-nav-column">
            <h4 className="footer-heading">
              {isTamil ? 'தளத்தின் வழிகாட்டுதல்கள்' : 'Portal Guidelines'}
            </h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/about">{isTamil ? 'பற்றி' : 'About'}</Link>
              </li>
              <li>
                <Link to="/about">{isTamil ? 'குடிமக்கள் சாசனம் & கொள்கைகள்' : 'Citizen Charter & Policy'}</Link>
              </li>
              <li>
                <Link to="/about">{isTamil ? 'இடஒதுக்கீடு & தகுதி விதிகள்' : 'Reservation & Eligibility Rules'}</Link>
              </li>
              <li>
                <Link to="/admin/dashboard">{isTamil ? 'நிர்வாக கன்சோல்' : 'Admin Console'}</Link>
              </li>
              <li>
                <Link to="/login">{isTamil ? 'அலுவலர் உள்நுழைவு' : 'Official Portal Login'}</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Developer Attribution & About (Section 16 Specification) */}
        <div className="footer-developer-strip">
          <div className="footer-brand-tag">
            <span className="footer-portal-title">
              {isTamil ? 'அரசுப் பணி தளம்' : 'Government Job Portal'}
            </span>
            <Link to="/about" className="footer-about-link">
              {isTamil ? 'பற்றி' : 'About'}
            </Link>
          </div>
          <div className="footer-dev-credit-box">
            <span className="footer-dev-label">{isTamil ? 'உருவாக்கியவர்' : 'Developed by'}</span>
            <strong className="footer-dev-name">Abi Anto A</strong>
            <span className="footer-dev-dept">{isTamil ? 'கணினி அறிவியல் துறை' : 'Department of Computer Science'}</span>
          </div>
        </div>

        {/* Bottom Copyright & Disclaimer Strip */}
        <div className="footer-bottom-strip">
          <div className="footer-bottom-left">
            <p className="copyright-text">
              © {currentYear} {isTamil ? 'அரசுப் பணி தளம்' : 'Government Job Portal'} —{' '}
              {isTamil
                ? 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.'
                : 'All rights reserved.'}
            </p>
            <p className="official-disclaimer">
              {isTamil
                ? 'அதிகாரப்பூர்வ அரசு வேலைவாய்ப்பு தகவல் தளம். வெளிப்படையான மற்றும் தகுதி அடிப்படையிலான ஆட்சேர்ப்புக்காக உருவாக்கப்பட்டது.'
                : 'Official government employment information system. Designed for transparent and merit-based recruitment opportunities.'}
            </p>
          </div>
          <div className="footer-bottom-right">
            <span className="security-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              {isTamil ? 'பாதுகாப்பான மற்றும் அணுகக்கூடிய டிஜிட்டல் தளம்' : 'Secure & Accessible Digital Portal'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
