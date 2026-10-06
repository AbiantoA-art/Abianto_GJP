import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JOB_CATEGORIES } from '../data/placeholderData';
import { useLanguage } from '../context/LanguageContext';

export const SearchBar = ({ initialKeyword = '', initialCategory = '', onSearch, compact = false }) => {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [category, setCategory] = useState(initialCategory);
  const [location, setLocation] = useState('');
  const [qualification, setQualification] = useState('');
  const navigate = useNavigate();
  const { t, tCategory, isTamil } = useLanguage();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({ keyword, category, location, qualification });
    } else {
      // If used on home page, navigate to /jobs with query params
      const params = new URLSearchParams();
      if (keyword) params.append('search', keyword);
      if (category) params.append('cat', category);
      if (location) params.append('location', location);
      navigate(`/jobs?${params.toString()}`);
    }
  };

  const qualificationsList = isTamil
    ? [
        '10ஆம் வகுப்பு / மெட்ரிகுலேஷன்',
        '12ஆம் வகுப்பு / மேல்நிலைப்பள்ளி',
        'டிப்ளமோ / பாலிடெக்னிக்',
        'ஏதேனும் பட்டப்படிப்பு (Graduate)',
        'பி.இ. / பி.டெக் (பொறியியல்)',
        'முதுகலை பட்டப்படிப்பு (Post Graduate)',
        'எம்பிபிஎஸ் / மருத்துவப் படிப்பு',
        'சட்டப் படிப்பு (LLB / Law)',
        'பி.எட் / கற்பித்தல் தகுதி',
      ]
    : [
        '10th Pass / Matriculation',
        '12th Pass / Higher Secondary',
        'Diploma / Polytechnic',
        'Graduate (Any Discipline)',
        'B.E. / B.Tech (Engineering)',
        'Post Graduate (Master Degree)',
        'MBBS / Medical Degree',
        'Law Degree (LLB)',
        'B.Ed / Teaching Qualification',
      ];

  return (
    <form className={`search-interface-form ${compact ? 'search-compact' : ''}`} onSubmit={handleSearchSubmit}>
      <div className="search-fields-grid">
        {/* Keyword / Job Title */}
        <div className="search-field-group">
          <label htmlFor="search-title" className="search-label">
            {t('searchJobs')}
          </label>
          <div className="input-with-icon form-input-wrapper">
            <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="search-title"
              type="text"
              placeholder={t('searchPlaceholder')}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Category */}
        <div className="search-field-group">
          <label htmlFor="search-category" className="search-label">
            {t('category')}
          </label>
          <div className="input-with-icon form-input-wrapper">
            <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <select
              id="search-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="search-select"
            >
              <option value="">{t('allCategories')}</option>
              {JOB_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {tCategory(cat.name)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location */}
        <div className="search-field-group">
          <label htmlFor="search-location" className="search-label">
            {t('location')}
          </label>
          <div className="input-with-icon form-input-wrapper">
            <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <input
              id="search-location"
              type="text"
              placeholder={isTamil ? 'எ.கா. அனைத்திந்தியா, சென்னை, தமிழ்நாடு...' : 'e.g. All India, Chennai, Delhi...'}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Qualification */}
        <div className="search-field-group">
          <label htmlFor="search-qualification" className="search-label">
            {t('qualification')}
          </label>
          <div className="input-with-icon form-input-wrapper">
            <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c0 2 6 3 6 3s6-1 6-3v-5" />
            </svg>
            <select
              id="search-qualification"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              className="search-select"
            >
              <option value="">{t('allQualifications', isTamil ? 'அனைத்து கல்வித் தகுதிகள்' : 'All Qualifications')}</option>
              {qualificationsList.map((q, idx) => (
                <option key={idx} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="search-submit-wrap">
        <button type="submit" className="search-submit-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>{t('searchVacanciesBtn')}</span>
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
