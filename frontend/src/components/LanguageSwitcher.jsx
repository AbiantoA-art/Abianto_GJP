import React from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Compact Segmented Language Switcher: [ தமிழ் | English ]
 * Features:
 * - Visually highlighted active state
 * - Full accessibility: aria-label, aria-pressed, keyboard navigation
 * - Responsive support for Light & Dark modes, Desktop, Tablet, and Mobile
 */
export const LanguageSwitcher = ({ idPrefix = 'nav' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className="lang-switcher-segmented"
      role="group"
      aria-label="Language Selector / மொழி தேர்வு"
    >
      <button
        type="button"
        id={`${idPrefix}-lang-btn-ta`}
        onClick={() => setLanguage('ta')}
        className={`lang-segment-btn ${language === 'ta' ? 'lang-btn-active' : ''}`}
        aria-pressed={language === 'ta'}
        aria-label="மொழியை தமிழுக்கு மாற்றவும்"
        title="தமிழ் (Tamil)"
      >
        தமிழ்
      </button>
      <span className="lang-segment-divider" aria-hidden="true">|</span>
      <button
        type="button"
        id={`${idPrefix}-lang-btn-en`}
        onClick={() => setLanguage('en')}
        className={`lang-segment-btn ${language === 'en' ? 'lang-btn-active' : ''}`}
        aria-pressed={language === 'en'}
        aria-label="Switch language to English"
        title="English"
      >
        English
      </button>
    </div>
  );
};

export default LanguageSwitcher;
