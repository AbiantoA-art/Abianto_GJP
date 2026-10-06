import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  setGlobalLanguage,
  t as translateHelper,
  tCategory as categoryHelper,
  tStatus as statusHelper,
  tNotificationType as notificationTypeHelper,
  tJobGroup as jobGroupHelper,
  tExamGroup as examGroupHelper,
  tMaterialType as materialTypeHelper,
  tMaterialLanguage as materialLanguageHelper,
} from '../i18n/translations';

const LanguageContext = createContext();

const STORAGE_KEY = 'gov_job_portal_language';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'ta') {
        return saved;
      }
    }
    // Default language is strictly Tamil ('ta')
    return 'ta';
  });

  // Sync language with localStorage, DOM attribute, and translation module
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore localStorage access issues
    }
    document.documentElement.setAttribute('lang', language);
    setGlobalLanguage(language);
  }, [language]);

  const setLanguage = useCallback((newLang) => {
    if (newLang === 'en' || newLang === 'ta') {
      setLanguageState(newLang);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'ta' ? 'en' : 'ta'));
  }, []);

  // Context-bound helper functions that automatically use current language
  const t = useCallback(
    (key, fallback = '') => translateHelper(key, fallback, language),
    [language]
  );

  const tCategory = useCallback(
    (catNameOrSlug) => categoryHelper(catNameOrSlug, language),
    [language]
  );

  const tStatus = useCallback(
    (status) => statusHelper(status, language),
    [language]
  );

  const tNotificationType = useCallback(
    (type) => notificationTypeHelper(type, language),
    [language]
  );

  const tJobGroup = useCallback(
    (groupCode) => jobGroupHelper(groupCode, language),
    [language]
  );

  const tExamGroup = useCallback(
    (groupCode) => examGroupHelper(groupCode, language),
    [language]
  );

  const tMaterialType = useCallback(
    (type) => materialTypeHelper(type, language),
    [language]
  );

  const tMaterialLanguage = useCallback(
    (langCode) => materialLanguageHelper(langCode, language),
    [language]
  );

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    isTamil: language === 'ta',
    isEnglish: language === 'en',
    t,
    tCategory,
    tStatus,
    tNotificationType,
    tJobGroup,
    tExamGroup,
    tMaterialType,
    tMaterialLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
