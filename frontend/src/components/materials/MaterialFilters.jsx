import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const MaterialFilters = ({
  searchTerm,
  onSearchChange,
  selectedExamGroup = '',
  onExamGroupChange,
  selectedLanguage = '',
  onLanguageChange,
  selectedMaterialType = '',
  onMaterialTypeChange,
  selectedCategory = '',
  onCategoryChange,
  categories = [],
  subjectTerm = '',
  onSubjectChange,
  selectedSort = 'latest',
  onSortChange,
  onReset,
}) => {
  const { t, tCategory, tExamGroup, tMaterialType, isTamil } = useLanguage();

  return (
    <div className="gov-material-filters-panel">
      {/* Search Input Row */}
      <div className="filter-row search-row">
        <div className="material-search-input-wrap">
          <svg className="search-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            id="material-search-input"
            placeholder={
              isTamil
                ? 'தலைப்பு, பாடம், தேர்வு முறை, முக்கிய சொற்களைத் தேடுங்கள்...'
                : 'Search by title, subject, scheme, or keywords...'
            }
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="materials-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="clear-search-btn"
              title={isTamil ? 'தேடலை அழிக்கவும்' : 'Clear search'}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="filters-grid">
        {/* 1. Exam Group Filter */}
        <div className="filter-group">
          <label htmlFor="material-exam-group-select" className="filter-label">
            {t('examGroup', isTamil ? 'தேர்வு குழு' : 'Exam Group')}
          </label>
          <select
            id="material-exam-group-select"
            value={selectedExamGroup}
            onChange={(e) => onExamGroupChange && onExamGroupChange(e.target.value)}
            className="gov-filter-select"
          >
            <option value="">{t('allGroups', isTamil ? 'அனைத்து குழுக்களும்' : 'All Groups')}</option>
            <option value="GROUP_1">{tExamGroup('GROUP_1')}</option>
            <option value="GROUP_2">{tExamGroup('GROUP_2')}</option>
            <option value="GROUP_2A">{tExamGroup('GROUP_2A')}</option>
            <option value="GROUP_3">{tExamGroup('GROUP_3')}</option>
            <option value="GROUP_4">{tExamGroup('GROUP_4')}</option>
          </select>
        </div>

        {/* 2. Language Filter */}
        <div className="filter-group">
          <label htmlFor="material-language-select" className="filter-label">
            {t('language', isTamil ? 'மொழி' : 'Language')}
          </label>
          <select
            id="material-language-select"
            value={selectedLanguage}
            onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
            className="gov-filter-select"
          >
            <option value="">{t('allLanguages', isTamil ? 'அனைத்து மொழிகளும்' : 'All Languages')}</option>
            <option value="TAMIL">{isTamil ? 'தமிழ் (Tamil)' : 'Tamil'}</option>
            <option value="ENGLISH">{isTamil ? 'ஆங்கிலம் (English)' : 'English'}</option>
          </select>
        </div>

        {/* 3. Material Type Filter */}
        <div className="filter-group">
          <label htmlFor="material-type-select" className="filter-label">
            {isTamil ? 'வளத்தின் வகை' : 'Material Type'}
          </label>
          <select
            id="material-type-select"
            value={selectedMaterialType}
            onChange={(e) => onMaterialTypeChange && onMaterialTypeChange(e.target.value)}
            className="gov-filter-select"
          >
            <option value="">{t('allMaterialTypes', isTamil ? 'அனைத்து வகைகளும்' : 'All Types')}</option>
            <option value="syllabus">{t('officialSyllabus', isTamil ? 'அதிகாரப்பூர்வ பாடத்திட்டம்' : 'Official Syllabus')}</option>
            <option value="exam_pattern">{t('examPattern', isTamil ? 'தேர்வு முறை' : 'Exam Pattern')}</option>
            <option value="study_material">{isTamil ? 'படிப்பு பொருட்கள்' : 'Study Material'}</option>
            <option value="question_paper">{t('questionPapers', isTamil ? 'முந்தைய ஆண்டு வினாத்தாள்கள்' : 'Question Papers')}</option>
            <option value="notification">{t('notifications', isTamil ? 'அறிவிப்புகள்' : 'Notifications')}</option>
            <option value="answer_key">{t('answerKeys', isTamil ? 'விடைக்குறிப்புகள்' : 'Answer Keys')}</option>
            <option value="current_affairs">{t('currentAffairs', isTamil ? 'நடப்பு நிகழ்வுகள்' : 'Current Affairs')}</option>
          </select>
        </div>

        {/* 4. Category Filter */}
        <div className="filter-group">
          <label htmlFor="material-category-select" className="filter-label">
            {isTamil ? 'தேர்வுப் பிரிவு (வகை)' : 'Category'}
          </label>
          <select
            id="material-category-select"
            value={selectedCategory}
            onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
            className="gov-filter-select"
          >
            <option value="">
              {isTamil
                ? `அனைத்துப் பிரிவுகளும் (${categories.length})`
                : `All Categories (${categories.length})`}
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {tCategory(cat.name)}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Subject Filter */}
        <div className="filter-group">
          <label htmlFor="material-subject-input" className="filter-label">
            {isTamil ? 'பாடம்' : 'Subject'}
          </label>
          <input
            type="text"
            id="material-subject-input"
            placeholder={isTamil ? 'எ.கா. பொது அறிவு, கணிதம்' : 'e.g. General Studies, History'}
            value={subjectTerm}
            onChange={(e) => onSubjectChange && onSubjectChange(e.target.value)}
            className="gov-filter-input"
          />
        </div>

        {/* 6. Sort Filter */}
        <div className="filter-group">
          <label htmlFor="material-sort-select" className="filter-label">
            {isTamil ? 'வரிசைப்படுத்து' : 'Sort By'}
          </label>
          <select
            id="material-sort-select"
            value={selectedSort}
            onChange={(e) => onSortChange && onSortChange(e.target.value)}
            className="gov-filter-select"
          >
            <option value="latest">{isTamil ? 'புதியவை முதலில்' : 'Latest First'}</option>
            <option value="oldest">{isTamil ? 'பழையவை முதலில்' : 'Oldest First'}</option>
            <option value="downloads_high">{isTamil ? 'அதிகம் பதிவிறக்கப்பட்டவை' : 'Most Downloaded'}</option>
            <option value="downloads_low">{isTamil ? 'குறைவாக பதிவிறக்கப்பட்டவை' : 'Least Downloaded'}</option>
            <option value="title_az">{isTamil ? 'தலைப்பு (அ – ஃ)' : 'Title (A – Z)'}</option>
            <option value="title_za">{isTamil ? 'தலைப்பு (ஃ – அ)' : 'Title (Z – A)'}</option>
          </select>
        </div>

        {/* Reset Action */}
        <div className="filter-group filter-actions-group">
          <label className="filter-label">&nbsp;</label>
          <button
            type="button"
            onClick={onReset}
            className="btn-filter-reset"
            title={isTamil ? 'வடிப்பான்களை மீட்டமைக்கவும்' : 'Reset filters'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>{isTamil ? 'மீட்டமை' : 'Reset'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialFilters;
