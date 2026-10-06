import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { JobCard } from '../components/JobCard';
import { getJobs, getCategories } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const Jobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tCategory, isTamil } = useLanguage();

  // 1. Categories state for filter dropdowns
  const [categories, setCategories] = useState([]);
  const [_categoriesLoading, setCategoriesLoading] = useState(true);

  // 2. Query state derived from URL searchParams
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const currentSearch = searchParams.get('search') || searchParams.get('q') || '';
  const rawCatParam = searchParams.get('category_id') || searchParams.get('cat') || '';
  const currentCategory = useMemo(() => {
    if (!rawCatParam) return '';
    if (/^\d+$/.test(rawCatParam)) return rawCatParam;
    const found = categories.find(
      (c) =>
        c.name.toLowerCase() === rawCatParam.toLowerCase() ||
        c.slug.toLowerCase() === rawCatParam.toLowerCase()
    );
    return found ? String(found.id) : '';
  }, [rawCatParam, categories]);

  const currentLocation = searchParams.get('location') || searchParams.get('loc') || '';
  const currentJobGroup = searchParams.get('job_group') || '';
  const currentOrganization = searchParams.get('organization') || '';
  const currentDepartment = searchParams.get('department') || '';
  const currentOpeningDateFrom = searchParams.get('opening_date_from') || '';
  const currentOpeningDateTo = searchParams.get('opening_date_to') || '';
  const currentLastDateFrom = searchParams.get('last_date_from') || '';
  const currentLastDateTo = searchParams.get('last_date_to') || '';
  const currentSort = searchParams.get('sort') || 'latest';

  // 3. Local input state for search keyword and filter form
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [localFilters, setLocalFilters] = useState({
    category_id: currentCategory,
    job_group: currentJobGroup,
    location: currentLocation,
    organization: currentOrganization,
    department: currentDepartment,
    opening_date_from: currentOpeningDateFrom,
    opening_date_to: currentOpeningDateTo,
    last_date_from: currentLastDateFrom,
    last_date_to: currentLastDateTo,
    sort: currentSort,
  });

  // Sync local inputs when URL searchParams change
  useEffect(() => {
    setSearchInput(currentSearch);
    setLocalFilters({
      category_id: currentCategory,
      job_group: currentJobGroup,
      location: currentLocation,
      organization: currentOrganization,
      department: currentDepartment,
      opening_date_from: currentOpeningDateFrom,
      opening_date_to: currentOpeningDateTo,
      last_date_from: currentLastDateFrom,
      last_date_to: currentLastDateTo,
      sort: currentSort,
    });
  }, [
    currentSearch,
    currentCategory,
    currentJobGroup,
    currentLocation,
    currentOrganization,
    currentDepartment,
    currentOpeningDateFrom,
    currentOpeningDateTo,
    currentLastDateFrom,
    currentLastDateTo,
    currentSort,
  ]);

  // 4. Job listing state
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load categories once on mount
  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      try {
        const res = await getCategories();
        if (isMounted && res.success) {
          setCategories(res.data);
        }
      } catch {
        // Fallback silently if category fetch has issue
      } finally {
        if (isMounted) setCategoriesLoading(false);
      }
    };
    fetchCats();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch published jobs from backend API
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getJobs({
        page: currentPage,
        limit: 12,
        search: currentSearch,
        category_id: currentCategory,
        job_group: currentJobGroup,
        location: currentLocation,
        organization: currentOrganization,
        department: currentDepartment,
        opening_date_from: currentOpeningDateFrom,
        opening_date_to: currentOpeningDateTo,
        last_date_from: currentLastDateFrom,
        last_date_to: currentLastDateTo,
        sort: currentSort,
      });

      if (res.success) {
        setJobs(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        setError(res.message || (isTamil ? 'பணிகளை ஏற்றுவதில் சிக்கல் ஏற்பட்டுள்ளது. மீண்டும் முயற்சிக்கவும்.' : 'Failed to load jobs. Please try again.'));
      }
    } catch {
      setError(isTamil ? 'பணிகளை ஏற்றுவதில் சிக்கல் ஏற்பட்டுள்ளது. இணைய இணைப்பை சரிபார்த்து மீண்டும் முயற்சிக்கவும்.' : 'Network error loading jobs. Please check connection and retry.');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    currentSearch,
    currentCategory,
    currentJobGroup,
    currentLocation,
    currentOrganization,
    currentDepartment,
    currentOpeningDateFrom,
    currentOpeningDateTo,
    currentLastDateFrom,
    currentLastDateTo,
    currentSort,
    isTamil,
  ]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Update URL helper (resets page to 1 unless page change is explicit)
  const updateURL = (newParams, preservePage = false) => {
    const params = new URLSearchParams();

    const merged = {
      search: currentSearch,
      category_id: currentCategory,
      job_group: currentJobGroup,
      location: currentLocation,
      organization: currentOrganization,
      department: currentDepartment,
      opening_date_from: currentOpeningDateFrom,
      opening_date_to: currentOpeningDateTo,
      last_date_from: currentLastDateFrom,
      last_date_to: currentLastDateTo,
      sort: currentSort,
      page: preservePage ? currentPage : 1,
      ...newParams,
    };

    Object.entries(merged).forEach(([key, val]) => {
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        if (key === 'page' && Number(val) <= 1) return;
        if (key === 'sort' && val === 'latest') return;
        params.set(key, String(val).trim());
      }
    });

    setSearchParams(params);
  };

  // Search input submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateURL({ search: searchInput });
  };

  // Single filter change in local state
  const handleFilterChange = (field, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Apply filters from sidebar
  const handleApplyFilters = () => {
    updateURL(localFilters);
  };

  // Reset all filters and search
  const handleClearFilters = () => {
    setSearchInput('');
    setLocalFilters({
      category_id: '',
      job_group: '',
      location: '',
      organization: '',
      department: '',
      opening_date_from: '',
      opening_date_to: '',
      last_date_from: '',
      last_date_to: '',
      sort: 'latest',
    });
    setSearchParams(new URLSearchParams());
  };

  // Pagination navigation
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === currentPage) return;
    updateURL({ page: newPage }, true);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  // Quick category pill click
  const handleQuickCategory = (catId) => {
    const newCatId = currentCategory === String(catId) ? '' : String(catId);
    updateURL({ category_id: newCatId });
  };

  // Job group pill click
  const handleJobGroupChange = (grp) => {
    const newGrp = currentJobGroup === grp ? '' : grp;
    updateURL({ job_group: newGrp });
  };

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      currentSearch ||
      currentCategory ||
      currentJobGroup ||
      currentLocation ||
      currentOrganization ||
      currentDepartment ||
      currentOpeningDateFrom ||
      currentOpeningDateTo ||
      currentLastDateFrom ||
      currentLastDateTo ||
      (currentSort && currentSort !== 'latest')
    );
  }, [
    currentSearch,
    currentCategory,
    currentJobGroup,
    currentLocation,
    currentOrganization,
    currentDepartment,
    currentOpeningDateFrom,
    currentOpeningDateTo,
    currentLastDateFrom,
    currentLastDateTo,
    currentSort,
  ]);

  return (
    <div className="candidate-jobs-page">
      {/* 1. Page Header Strip */}
      <div className="page-header-strip">
        <div className="section-container">
          <div className="breadcrumb-nav">
            <Link to="/">{isTamil ? 'முகப்பு' : 'Home'}</Link> /{' '}
            <span className="active-crumb">{isTamil ? 'அரசுப் பணிகள்' : 'Government Jobs'}</span>
          </div>
          <h1 className="page-header-title">
            {isTamil ? 'அரசு வேலைவாய்ப்புகள்' : 'Government Jobs'}
          </h1>
          <p className="page-header-subtitle">
            {isTamil
              ? 'மத்திய அமைச்சகங்கள், மாநில அரசுப் பணியாளர் தேர்வாணையங்கள், பாதுகாப்பு, வங்கி மற்றும் பொதுத்துறை நிறுவனங்களின் அதிகாரப்பூர்வ அறிவிப்புகள்.'
              : 'Official recruitment notifications from central ministries, state public service commissions, defence, banking, and public sector undertakings.'}
          </p>

          {/* Search Header Bar */}
          <form className="hero-search-form" onSubmit={handleSearchSubmit}>
            <div className="hero-search-input-wrap">
              <svg className="hero-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="hero-search-input"
                placeholder={isTamil ? 'பணி பெயர், துறை, நிறுவனம் அல்லது தகுதியைத் தேடுங்கள்...' : 'Search by job title, department, organization or qualification...'}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  type="button"
                  className="btn-clear-search-inline"
                  onClick={() => {
                    setSearchInput('');
                    if (currentSearch) updateURL({ search: '' });
                  }}
                  title={isTamil ? 'தேடல் உரையை அழிக்கவும்' : 'Clear search text'}
                >
                  ✕
                </button>
              )}
            </div>
            <button type="submit" className="hero-search-btn">
              <span>{isTamil ? 'தேடுக' : 'Search'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* 2. Main Discovery Container */}
      <div className="section-container page-content-wrap">
        {/* Job Category Navigation & Filter Section */}
        <section
          className="category-filter-section"
          aria-label={isTamil ? 'அரசுப் பணிப் பிரிவுகள் வடிகட்டி' : 'Government Job Categories Filter'}
        >
          <div className="category-filter-header">
            <div className="category-filter-title-wrap">
              <h2 className="category-filter-heading">
                <svg
                  className="category-filter-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <span>{isTamil ? 'அரசுப் பணிப் பிரிவுகள்' : 'Job Categories'}</span>
              </h2>
              <span className="category-filter-count-pill">
                {isTamil ? '24 முக்கியத் துறைகள்' : '24 Sectors'}
              </span>
            </div>

            {currentCategory && (
              <button
                type="button"
                className="category-clear-btn"
                onClick={() => handleQuickCategory('')}
                title={isTamil ? 'பிரிவு வடிகட்டியை மீட்டமை' : 'Clear category selection'}
              >
                ✕ {isTamil ? 'அனைத்துப் பிரிவுகளும்' : 'Show All Categories'}
              </button>
            )}
          </div>

          <div
            className="category-filter-list"
            role="toolbar"
            aria-label={isTamil ? 'பணிப் பிரிவுகள் பொத்தான்கள்' : 'Job category buttons'}
          >
            <button
              type="button"
              className={`category-filter-button ${!currentCategory ? 'active' : ''}`}
              onClick={() => handleQuickCategory('')}
              aria-pressed={!currentCategory}
            >
              <span className="category-btn-label">
                {isTamil ? 'அனைத்துப் பிரிவுகளும்' : 'All Categories'}
              </span>
            </button>
            {categories.map((cat) => {
              const isSelected = currentCategory === String(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-filter-button ${isSelected ? 'active' : ''}`}
                  onClick={() => handleQuickCategory(cat.id)}
                  aria-pressed={isSelected}
                >
                  <span className="category-btn-label">
                    {tCategory(cat.name)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Job Groups (TNPSC Groups) Filter Section */}
        <section
          className="job-groups-filter-section"
          aria-label={isTamil ? 'டி.என்.பி.எஸ்.சி தேர்வுக் குழுக்கள்' : 'TNPSC Exam Groups'}
        >
          <div className="job-groups-bar">
            <span className="job-groups-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>{isTamil ? 'டி.என்.பி.எஸ்.சி குழுக்கள்:' : 'TNPSC Job Groups:'}</span>
            </span>
            <div className="job-groups-pills" role="toolbar" aria-label="TNPSC Groups">
              {[
                { key: '', labelEn: 'All Groups', labelTa: 'அனைத்துக் குழுக்களும்' },
                { key: 'GROUP_1', labelEn: 'Group 1', labelTa: 'குரூப் 1' },
                { key: 'GROUP_2', labelEn: 'Group 2', labelTa: 'குரூப் 2' },
                { key: 'GROUP_2A', labelEn: 'Group 2A', labelTa: 'குரூப் 2A' },
                { key: 'GROUP_3', labelEn: 'Group 3', labelTa: 'குரூப் 3' },
                { key: 'GROUP_4', labelEn: 'Group 4', labelTa: 'குரூப் 4' },
              ].map((grp) => {
                const isActive = currentJobGroup === grp.key;
                return (
                  <button
                    key={grp.key || 'ALL'}
                    type="button"
                    className={`job-group-pill ${isActive ? 'active' : ''}`}
                    onClick={() => handleJobGroupChange(grp.key)}
                    aria-pressed={isActive}
                  >
                    {isTamil ? grp.labelTa : grp.labelEn}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Discovery Layout: Full Width Main Results (Sidebar Removed) */}
        <div className="job-discovery-layout">
          {/* Main Results Full Width */}
          <main className="job-results-column">
            {/* Results Control Header */}
            <div className="results-control-bar">
              <div className="results-count-text">
                {loading ? (
                  <span>{isTamil ? 'அதிகாரப்பூர்வ காலிப்பணியிடங்கள் ஏற்றப்படுகின்றன...' : 'Loading official vacancies...'}</span>
                ) : (
                  <span>
                    {pagination.total === 0 ? (
                      <span>{isTamil ? 'பணிகள் எதுவும் கிடைக்கவில்லை' : 'No matching vacancies found'}</span>
                    ) : (
                      isTamil ? (
                        <>
                          மொத்தம் <strong>{pagination.total}</strong> பணிகளில் <strong>{jobs.length}</strong> காட்டப்படுகின்றன
                          {currentSearch && <> — "<strong>{currentSearch}</strong>" தேடலுக்கு</>}
                        </>
                      ) : (
                        <>
                          Showing <strong>{jobs.length}</strong> of <strong>{pagination.total}</strong> vacancies
                          {currentSearch && <> — for "<strong>{currentSearch}</strong>"</>}
                        </>
                      )
                    )}
                  </span>
                )}
              </div>

              {/* Sort By & Clear Filters Controls */}
              <div className="results-actions-bar">
                <div className="results-sort-wrap">
                  <label htmlFor="jobs-sort-select" className="results-sort-label">
                    {isTamil ? 'வரிசைப்படுத்து:' : 'Sort by:'}
                  </label>
                  <select
                    id="jobs-sort-select"
                    className="results-sort-select"
                    value={currentSort}
                    onChange={(e) => updateURL({ sort: e.target.value }, true)}
                  >
                    <option value="latest">{isTamil ? 'சமீபத்தியவை' : 'Latest'}</option>
                    <option value="closing_soon">{isTamil ? 'விரைவில் முடிவடையும்' : 'Closing Soon'}</option>
                    <option value="vacancies">{isTamil ? 'அதிக காலிப்பணியிடங்கள்' : 'Most Vacancies'}</option>
                    <option value="title">{isTamil ? 'பணிப் பெயர் (A-Z)' : 'Title (A-Z)'}</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="btn-inline-clear-filters"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    <span>{isTamil ? 'வடிப்பான்களை அழிக்கவும்' : 'Clear Filters'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="gov-card jobs-error-state" role="alert">
                <div className="state-icon-wrap error-icon-wrap">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="state-title">{isTamil ? 'பணிகளை ஏற்றுவதில் சிக்கல்' : 'Error Loading Vacancies'}</h3>
                <p className="state-desc">{error}</p>
                <button
                  type="button"
                  onClick={fetchJobs}
                  className="btn-retry-primary"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  <span>{isTamil ? 'மீண்டும் முயற்சிக்கவும்' : 'Try Again'}</span>
                </button>
              </div>
            )}

            {/* Loading State Skeleton Cards */}
            {!error && loading && (
              <div className="jobs-cards-grid">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div key={idx} className="gov-job-card skeleton-card">
                    <div className="skeleton-line skeleton-badge-row" />
                    <div className="skeleton-line skeleton-title" />
                    <div className="skeleton-line skeleton-subtitle" />
                    <div className="skeleton-grid">
                      <div className="skeleton-spec" />
                      <div className="skeleton-spec" />
                      <div className="skeleton-spec" />
                      <div className="skeleton-spec" />
                    </div>
                    <div className="skeleton-actions">
                      <div className="skeleton-btn" />
                      <div className="skeleton-btn" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!error && !loading && jobs.length === 0 && (
              <div className="gov-card empty-results-box">
                <div className="empty-icon-wrap">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </div>
                <h3 className="empty-title">
                  {currentCategory
                    ? (isTamil ? 'இந்த பிரிவில் காலிப்பணியிடங்கள் எதுவும் இல்லை.' : 'No vacancies found for this category.')
                    : (isTamil ? 'பணிகள் எதுவும் கிடைக்கவில்லை' : 'No matching vacancies found')}
                </h3>
                <p className="empty-desc">
                  {currentCategory
                    ? (isTamil
                        ? 'தேர்ந்தெடுக்கப்பட்ட அரசுப் பணிப் பிரிவில் தற்போது புதிய அறிவிப்புகள் எதுவும் இல்லை. பிற பிரிவுகளை அல்லது அனைத்துப் பணிகளையும் பார்க்கவும்.'
                        : 'There are currently no active official recruitment notices listed in this category. You can explore all available vacancies across all government sectors.')
                    : (isTamil
                        ? 'உங்கள் தேடல் அளவுகோலுக்கு ஏற்ற அரசுப் பணிகள் எதுவும் கிடைக்கவில்லை. வேறு தேடல் சொற்களை முயற்சிக்கவும் அல்லது வடிப்பான்களை அழிக்கவும்.'
                        : 'No government vacancies matched your search criteria. Try modifying your keywords or clear the applied filters.')}
                </p>
                {currentCategory ? (
                  <button
                    type="button"
                    onClick={() => handleQuickCategory('')}
                    className="btn-reset-filters"
                  >
                    {isTamil ? 'அனைத்துப் பிரிவுகளையும் காண்க' : 'View All Categories'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="btn-reset-filters"
                  >
                    {isTamil ? 'அனைத்து வடிப்பான்களையும் நீக்கு' : 'Reset All Filters'}
                  </button>
                )}
              </div>
            )}

            {/* Populated Job Grid */}
            {!error && !loading && jobs.length > 0 && (
              <>
                <div className="jobs-cards-grid">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <nav className="pagination-bar" aria-label="Job Results Pagination">
                    <div className="pagination-info">
                      {isTamil ? (
                        <>பக்கம் <strong>{pagination.page}</strong> / <strong>{pagination.totalPages}</strong> (மொத்தம் {pagination.total} பணிகள்)</>
                      ) : (
                        <>Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} Total Vacancies)</>
                      )}
                    </div>

                    <div className="pagination-buttons">
                      <button
                        type="button"
                        className="btn-pagination-nav"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1 || loading}
                        aria-label={isTamil ? 'முந்தைய பக்கம்' : 'Previous page'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                        <span>{isTamil ? 'முந்தையது' : 'Previous'}</span>
                      </button>

                      {/* Numeric Page Pills */}
                      <div className="pagination-page-pills">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                          .filter((pageNum) => {
                            return (
                              pageNum === 1 ||
                              pageNum === pagination.totalPages ||
                              Math.abs(pageNum - currentPage) <= 1
                            );
                          })
                          .map((pageNum, idx, arr) => {
                            const prev = arr[idx - 1];
                            const showEllipsis = prev && pageNum - prev > 1;

                            return (
                              <React.Fragment key={pageNum}>
                                {showEllipsis && <span className="pagination-ellipsis">...</span>}
                                <button
                                  type="button"
                                  className={`btn-page-number ${pageNum === currentPage ? 'active' : ''}`}
                                  onClick={() => handlePageChange(pageNum)}
                                  disabled={loading}
                                >
                                  {pageNum}
                                </button>
                              </React.Fragment>
                            );
                          })}
                      </div>

                      <button
                        type="button"
                        className="btn-pagination-nav"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= pagination.totalPages || loading}
                        aria-label={isTamil ? 'அடுத்த பக்கம்' : 'Next page'}
                      >
                        <span>{isTamil ? 'அடுத்தது' : 'Next'}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                  </nav>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Jobs;
