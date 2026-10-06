import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const JobFilters = ({
  filters,
  categories = [],
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  loading = false,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { t, tCategory, tJobGroup, isTamil } = useLanguage();

  // Count active filters (excluding default sort and page)
  const activeFilterCount = [
    filters.category_id,
    filters.job_group,
    filters.location,
    filters.organization,
    filters.department,
    filters.opening_date_from,
    filters.opening_date_to,
    filters.last_date_from,
    filters.last_date_to,
    filters.sort && filters.sort !== 'latest' ? filters.sort : null,
  ].filter(Boolean).length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onApplyFilters) onApplyFilters();
    setIsMobileOpen(false);
  };

  const handleClear = () => {
    if (onClearFilters) onClearFilters();
    setIsMobileOpen(false);
  };

  return (
    <aside className="job-filters-sidebar">
      {/* Mobile Toggle Button */}
      <div className="filters-mobile-toggle-bar">
        <button
          type="button"
          className="btn-toggle-filters-mobile"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          aria-expanded={isMobileOpen}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          <span>
            {isMobileOpen
              ? (isTamil ? 'வடிப்பான்களை மறை' : 'Hide Filters')
              : (isTamil ? 'மேம்பட்ட வடிப்பான்களைக் காட்டு' : 'Show Advanced Filters')}
          </span>
          {activeFilterCount > 0 && (
            <span className="active-filters-count-badge">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* Filter Panel Content */}
      <div className={`filters-panel-content ${isMobileOpen ? 'filters-panel-mobile-open' : ''}`}>
        <div className="filters-panel-header">
          <div className="filters-header-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <h3>{isTamil ? 'பணிகளை வடிகட்டு' : 'Filter Vacancies'}</h3>
          </div>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="btn-clear-filters-link"
              title={isTamil ? 'அனைத்து வடிப்பான்களையும் மீட்டமைக்கவும்' : 'Reset all filters'}
            >
              {isTamil ? `மீட்டமை (${activeFilterCount})` : `Reset (${activeFilterCount})`}
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="filters-form">
          {/* 1. Category Filter */}
          <div className="filter-group">
            <label htmlFor="filter-category" className="filter-label">
              {isTamil ? 'வகை' : 'Category'}
            </label>
            <select
              id="filter-category"
              className="filter-select"
              value={filters.category_id || ''}
              onChange={(e) => onFilterChange('category_id', e.target.value)}
            >
              <option value="">
                {isTamil ? `அனைத்துப் பிரிவுகளும் (${categories.length})` : `All Categories (${categories.length})`}
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {tCategory(cat.name)}
                </option>
              ))}
            </select>
          </div>

          {/* 1b. Job Group Filter */}
          <div className="filter-group">
            <label htmlFor="filter-job-group" className="filter-label">
              {t('jobGroup')}
            </label>
            <select
              id="filter-job-group"
              className="filter-select"
              value={filters.job_group || ''}
              onChange={(e) => onFilterChange('job_group', e.target.value)}
            >
              <option value="">{tJobGroup('ALL')}</option>
              <option value="GROUP_1">{tJobGroup('GROUP_1')}</option>
              <option value="GROUP_2">{tJobGroup('GROUP_2')}</option>
              <option value="GROUP_2A">{tJobGroup('GROUP_2A')}</option>
              <option value="GROUP_3">{tJobGroup('GROUP_3')}</option>
              <option value="GROUP_4">{tJobGroup('GROUP_4')}</option>
            </select>
          </div>

          {/* 2. Location Filter */}
          <div className="filter-group">
            <label htmlFor="filter-location" className="filter-label">
              {isTamil ? 'பணியிடம் / மாநிலம்' : 'Location / State'}
            </label>
            <div className="filter-input-wrap">
              <input
                id="filter-location"
                type="text"
                className="filter-input"
                placeholder={isTamil ? 'எ.கா. தமிழ்நாடு, சென்னை, அகில இந்திய' : 'e.g. Tamil Nadu, Chennai, All India'}
                value={filters.location || ''}
                onChange={(e) => onFilterChange('location', e.target.value)}
              />
            </div>
          </div>

          {/* 3. Organization Filter */}
          <div className="filter-group">
            <label htmlFor="filter-organization" className="filter-label">
              {isTamil ? 'நிறுவனம் / அமைப்பு' : 'Organization / Body'}
            </label>
            <div className="filter-input-wrap">
              <input
                id="filter-organization"
                type="text"
                className="filter-input"
                placeholder={isTamil ? 'எ.கா. TNPSC, UPSC, SSC, Railways' : 'e.g. TNPSC, UPSC, SSC, Railways'}
                value={filters.organization || ''}
                onChange={(e) => onFilterChange('organization', e.target.value)}
              />
            </div>
          </div>

          {/* 4. Department Filter */}
          <div className="filter-group">
            <label htmlFor="filter-department" className="filter-label">
              {isTamil ? 'துறை / அமைச்சகம்' : 'Department / Ministry'}
            </label>
            <div className="filter-input-wrap">
              <input
                id="filter-department"
                type="text"
                className="filter-input"
                placeholder={isTamil ? 'எ.கா. வருவாய்த்துறை, கல்வித்துறை' : 'e.g. Revenue, Education, Railways'}
                value={filters.department || ''}
                onChange={(e) => onFilterChange('department', e.target.value)}
              />
            </div>
          </div>

          {/* 5. Sort By */}
          <div className="filter-group">
            <label htmlFor="filter-sort" className="filter-label">
              {isTamil ? 'வரிசைப்படுத்து' : 'Sort By'}
            </label>
            <select
              id="filter-sort"
              className="filter-select"
              value={filters.sort || 'latest'}
              onChange={(e) => onFilterChange('sort', e.target.value)}
            >
              <option value="latest">{isTamil ? 'புதியவை முதலில்' : 'Latest First'}</option>
              <option value="oldest">{isTamil ? 'பழையவை முதலில்' : 'Oldest First'}</option>
              <option value="deadline_soon">{isTamil ? 'காலக்கெடு நெருங்குபவை' : 'Deadline Approaching'}</option>
              <option value="deadline_latest">{isTamil ? 'காலக்கெடு தொலைவில் உள்ளவை' : 'Deadline Farthest'}</option>
              <option value="vacancies_high">{isTamil ? 'அதிக காலியிடங்கள்' : 'Highest Vacancies'}</option>
              <option value="vacancies_low">{isTamil ? 'குறைந்த காலியிடங்கள்' : 'Lowest Vacancies'}</option>
            </select>
          </div>

          {/* 6. Opening Date Range */}
          <div className="filter-group-dates">
            <span className="filter-label">{isTamil ? 'தொடக்க தேதி வரம்பு' : 'Opening Date Range'}</span>
            <div className="date-inputs-row">
              <div className="date-field">
                <span className="date-sublabel">{isTamil ? 'முதல்' : 'From'}</span>
                <input
                  type="date"
                  className="filter-input date-input"
                  value={filters.opening_date_from || ''}
                  onChange={(e) => onFilterChange('opening_date_from', e.target.value)}
                  title={isTamil ? 'தொடக்க தேதி முதல்' : 'Opening date from'}
                />
              </div>
              <div className="date-field">
                <span className="date-sublabel">{isTamil ? 'வரை' : 'To'}</span>
                <input
                  type="date"
                  className="filter-input date-input"
                  value={filters.opening_date_to || ''}
                  onChange={(e) => onFilterChange('opening_date_to', e.target.value)}
                  title={isTamil ? 'தொடக்க தேதி வரை' : 'Opening date to'}
                />
              </div>
            </div>
          </div>

          {/* 7. Last Date (Deadline) Range */}
          <div className="filter-group-dates">
            <span className="filter-label">{isTamil ? 'விண்ணப்பிக்க கடைசி தேதி வரம்பு' : 'Last Date (Deadline) Range'}</span>
            <div className="date-inputs-row">
              <div className="date-field">
                <span className="date-sublabel">{isTamil ? 'முதல்' : 'From'}</span>
                <input
                  type="date"
                  className="filter-input date-input"
                  value={filters.last_date_from || ''}
                  onChange={(e) => onFilterChange('last_date_from', e.target.value)}
                  title={isTamil ? 'கடைசி தேதி முதல்' : 'Deadline date from'}
                />
              </div>
              <div className="date-field">
                <span className="date-sublabel">{isTamil ? 'வரை' : 'To'}</span>
                <input
                  type="date"
                  className="filter-input date-input"
                  value={filters.last_date_to || ''}
                  onChange={(e) => onFilterChange('last_date_to', e.target.value)}
                  title={isTamil ? 'கடைசி தேதி வரை' : 'Deadline date to'}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="filter-actions-group">
            <button
              type="submit"
              className="btn-apply-filters"
              disabled={loading}
            >
              {loading
                ? (isTamil ? 'வடிகட்டப்படுகிறது...' : 'Filtering...')
                : (isTamil ? 'வடிப்பான்களைப் பயன்படுத்து' : 'Apply Filters')}
            </button>
            <button
              type="button"
              className="btn-clear-filters"
              onClick={handleClear}
              disabled={loading}
            >
              {isTamil ? 'அனைத்தையும் நீக்கு' : 'Clear All'}
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
};

export default JobFilters;
