import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MaterialCard } from '../components/materials/MaterialCard';
import { MaterialFilters } from '../components/materials/MaterialFilters';
import { getStudyMaterials, getCategories } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const EXAM_GROUPS_CONFIG = [
  {
    key: 'GROUP_1',
    titleEn: 'TNPSC Group 1 Examination Syllabus (CCS-I)',
    titleTa: 'டி.என்.பி.எஸ்.சி குரூப் 1 தேர்வு பாடத்திட்டம் (முதல்நிலை & முதன்மை)',
    descEn: 'Deputy Collector, DSP, Assistant Commissioner of Commercial Taxes, and Apex State Administrative Services.',
    descTa: 'துணை ஆட்சியர், காவல் துணைக் கண்காணிப்பாளர் (DSP), வணிகவரி உதவி ஆணையர் பணியிடங்களுக்கான அதிகாரப்பூர்வ தேர்வு முறை.',
    badge: 'Group 1',
    color: '#1e40af',
  },
  {
    key: 'GROUP_2',
    titleEn: 'TNPSC Group 2 (Interview Posts) Examination Syllabus (CCS-II)',
    titleTa: 'டி.என்.பி.எஸ்.சி குரூப் 2 (நேர்முகத் தேர்வுப் பதவிகள்) பாடத்திட்டம்',
    descEn: 'Sub-Registrar Grade-II, Municipal Commissioner Grade-II, Probation Officer, and Executive Officer Cadres.',
    descTa: 'சார்-பதிவாளர் நிலை-2, நகராட்சி ஆணையர் நிலை-2, நன்னடத்தை அலுவலர் பணிகளுக்கான அதிகாரப்பூர்வ பாடத்திட்டம்.',
    badge: 'Group 2',
    color: '#0d9488',
  },
  {
    key: 'GROUP_2A',
    titleEn: 'TNPSC Group 2A (Non-Interview Posts) Examination Syllabus (CCS-IIA)',
    titleTa: 'டி.என்.பி.எஸ்.சி குரூப் 2A (நேர்முகத் தேர்விலா பதவிகள்) பாடத்திட்டம்',
    descEn: 'Assistant in Tamil Nadu Secretariat, Revenue Assistant, and Non-Interview State Department Executives.',
    descTa: 'தலைமைச் செயலக உதவியாளர், வருவாய் உதவியாளர் மற்றும் அரசுத் துறைகளின் நேர்முகத் தேர்விலா நிர்வாகப் பணிகள்.',
    badge: 'Group 2A',
    color: '#0284c7',
  },
  {
    key: 'GROUP_3',
    titleEn: 'TNPSC Group 3 & 3A Examination Syllabus (CCS-III)',
    titleTa: 'டி.என்.பி.எஸ்.சி குரூப் 3 & 3A தேர்வு பாடத்திட்டம் மற்றும் தேர்வுத் திட்டம்',
    descEn: 'Station Fire Officer, Junior Inspector of Co-operative Societies, and Store Keeper Services.',
    descTa: 'நிலைய தீயணைப்பு அலுவலர், கூட்டுறவு சங்க இளநிலை ஆய்வாளர் பணிகளுக்கான தேர்வு முறை மற்றும் பாடத்திட்டம்.',
    badge: 'Group 3',
    color: '#7c3aed',
  },
  {
    key: 'GROUP_4',
    titleEn: 'TNPSC Group 4 & VAO Examination Syllabus (CCS-IV)',
    titleTa: 'டி.என்.பி.எஸ்.சி குரூப் 4 மற்றும் கிராம நிர்வாக அலுவலர் (VAO) பாடத்திட்டம்',
    descEn: 'Village Administrative Officer (VAO), Junior Assistant, Typist, Steno-Typist, and Field Assistant Cadres.',
    descTa: 'கிராம நிர்வாக அலுவலர் (VAO), இளநிலை உதவியாளர், தட்டச்சர் மற்றும் சுருக்கெழுத்து தட்டச்சர் பணிகளுக்கான விரிவான பாடத்திட்டம்.',
    badge: 'Group 4',
    color: '#ea580c',
  },
];

export const Syllabus = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tCategory, isTamil } = useLanguage();

  const initialCategory = searchParams.get('category_id') || '';
  const initialGroup = searchParams.get('exam_group') || '';
  const initialSearch = searchParams.get('search') || '';

  const [syllabusList, setSyllabusList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedExamGroup, setSelectedExamGroup] = useState(initialGroup);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [subjectTerm, setSubjectTerm] = useState('');
  const [selectedSort, setSelectedSort] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Sync state if URL changes externally
  useEffect(() => {
    const cat = searchParams.get('category_id') || '';
    const grp = searchParams.get('exam_group') || '';
    const srch = searchParams.get('search') || '';

    if (cat !== selectedCategory) setSelectedCategory(cat);
    if (grp !== selectedExamGroup) setSelectedExamGroup(grp);
    if (srch !== searchTerm) setSearchTerm(srch);
  }, [searchParams]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      const res = await getCategories();
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    };
    fetchCats();
  }, []);

  // Fetch Syllabus resources (material_type = syllabus)
  const fetchSyllabus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStudyMaterials({
        page: currentPage,
        limit: 50,
        search: searchTerm,
        exam_group: selectedExamGroup || null,
        category_id: selectedCategory || null,
        subject: subjectTerm,
        material_type: 'syllabus',
        sort: selectedSort,
      });

      if (!res.success) {
        setError(
          res.message ||
            (isTamil
              ? 'பாடத்திட்ட ஆவணங்களை ஏற்றுவதில் சிக்கல் ஏற்பட்டது.'
              : 'Failed to load syllabus documents.')
        );
        setSyllabusList([]);
      } else {
        setSyllabusList(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setError(
        err.message ||
          (isTamil ? 'எதிர்பாராத பிழை ஏற்பட்டது.' : 'An unexpected error occurred.')
      );
      setSyllabusList([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedExamGroup, selectedCategory, subjectTerm, selectedSort, isTamil]);

  useEffect(() => {
    fetchSyllabus();
  }, [fetchSyllabus]);

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setSelectedExamGroup('');
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedExamGroup('');
    setSelectedCategory('');
    setSubjectTerm('');
    setSelectedSort('latest');
    setCurrentPage(1);
    setSearchParams({});
  };

  const handleDownloadSuccess = (materialId) => {
    setSyllabusList((prev) =>
      prev.map((item) =>
        item.id === materialId
          ? { ...item, download_count: (item.download_count || 0) + 1 }
          : item
      )
    );
  };

  const isTamilNaduGovtSelected = useMemo(() => {
    if (!selectedCategory) return true;
    const cat = categories.find((c) => String(c.id) === String(selectedCategory));
    return cat ? cat.id === 13 || cat.slug?.includes('tamil-nadu') : false;
  }, [selectedCategory, categories]);

  // Group syllabus items by category for the broad overview view
  const categorizedSyllabus = useMemo(() => {
    const map = {};
    syllabusList.forEach((item) => {
      const catName = item.category_name || 'Other Government Jobs';
      if (!map[catName]) {
        map[catName] = [];
      }
      map[catName].push(item);
    });
    return map;
  }, [syllabusList]);

  return (
    <div className="gov-materials-page syllabus-theme-page">
      {/* 1. Header Banner */}
      <div className="page-header-strip syllabus-header-strip">
        <div className="navbar-container">
          <div className="breadcrumb-nav">
            <Link to="/">{isTamil ? 'முகப்பு' : 'Home'}</Link> /{' '}
            <span className="active-crumb">{isTamil ? 'தேர்வு பாடத்திட்டம்' : 'Syllabus'}</span>
          </div>
          <h1 className="page-header-title">
            {isTamil
              ? 'அதிகாரப்பூர்வ தேர்வு பாடத்திட்டம் மற்றும் தேர்வுத் திட்டங்கள்'
              : 'Official Examination Syllabus & Exam Schemes'}
          </h1>
          <p className="page-header-subtitle">
            {isTamil
              ? 'அனைத்து 24 அரசுப் பணி பிரிவுகளுக்கான அங்கீகரிக்கப்பட்ட தேர்வு முறைகள், பாட வாரியான மதிப்பெண் திட்டங்கள் மற்றும் பாடத்திட்ட ஆவணங்கள்.'
              : 'Verified examination schemes, subject-wise marking blueprints, patterns, and official syllabi across all 24 government recruitment categories.'}
          </p>
        </div>
      </div>

      <div className="navbar-container page-content-wrap">
        {/* 2. Short Introduction */}
        <div className="materials-intro-banner">
          <div className="materials-intro-content">
            <h2 className="materials-intro-title">
              {isTamil
                ? 'அனைத்து அரசுப் பணிகளுக்கான அதிகாரப்பூர்வ பாடத்திட்ட வழிகாட்டி'
                : 'Complete Government Recruitment Syllabus Portal'}
            </h2>
            <p className="materials-intro-text">
              {isTamil
                ? 'யு.பி.எஸ்.சி, எஸ்.எஸ்.சி (CGL, CHSL, MTS, GD), வங்கி (IBPS, SBI), இரயில்வே (NTPC, Group D, ALP), பாதுகாப்பு, டி.என்.பி.எஸ்.சி (குரூப் 1, 2, 2A, 3, 4), அஞ்சல் மற்றும் அனைத்து அரசுத் துறைகளின் அதிகாரப்பூர்வ பாடத்திட்டங்களை நேரடியாகப் பதிவிறக்குங்கள்.'
                : 'Direct official syllabi and examination pattern documents for UPSC, SSC, Banking, Railways, Defence, TNPSC (Groups 1, 2, 2A, 3, 4), Postal, and State & Central Government recruitment bodies.'}
            </p>
          </div>
        </div>

        {/* 3. Category Navigation Grid across all 24 categories */}
        <div className="category-nav-section" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isTamil ? 'பாடத்திட்டப் பிரிவு தேர்வு (Select Job Category):' : 'Select Job Category:'}
            </span>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => handleCategorySelect('')}
                style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                {isTamil ? 'அனைத்து பிரிவுகளையும் காண்க (Show All)' : 'Show All Categories'}
              </button>
            )}
          </div>

          <div className="category-nav-scroll-grid" role="tablist" aria-label="Job Categories">
            <button
              type="button"
              className={`category-nav-chip ${!selectedCategory ? 'active' : ''}`}
              onClick={() => handleCategorySelect('')}
            >
              {isTamil ? 'அனைத்துப் பணிகளும் (All)' : 'All Categories'}
            </button>

            {categories.map((cat) => {
              const isSelected = String(selectedCategory) === String(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-nav-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(cat.id)}
                >
                  {tCategory(cat.name)}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Compact Group Navigation Toolbar (for TNPSC) */}
        {isTamilNaduGovtSelected && (
          <div className="resource-quick-toolbar" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
            <div className="resource-group-tabs" role="toolbar" aria-label="TNPSC Exam Group Filter">
              {[
                { key: '', labelEn: 'All Groups', labelTa: 'அனைத்துக் குழுக்களும்' },
                { key: 'GROUP_1', labelEn: 'Group 1', labelTa: 'குரூப் 1' },
                { key: 'GROUP_2', labelEn: 'Group 2', labelTa: 'குரூப் 2' },
                { key: 'GROUP_2A', labelEn: 'Group 2A', labelTa: 'குரூப் 2A' },
                { key: 'GROUP_3', labelEn: 'Group 3', labelTa: 'குரூப் 3' },
                { key: 'GROUP_4', labelEn: 'Group 4', labelTa: 'குரூப் 4' },
              ].map((grp) => {
                const isActive = selectedExamGroup === grp.key;
                return (
                  <button
                    key={grp.key || 'ALL'}
                    type="button"
                    className={`resource-group-tab ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedExamGroup(grp.key);
                      setCurrentPage(1);
                    }}
                    aria-pressed={isActive}
                  >
                    {isTamil ? grp.labelTa : grp.labelEn}
                  </button>
                );
              })}
            </div>

            <div className="resource-controls-right">
              <div className="resource-quick-search-wrap">
                <svg className="resource-quick-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder={isTamil ? 'பாடத்திட்டம் தேடுக (Exam / Subject)...' : 'Search syllabus, exam...'}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="resource-quick-search-input"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="btn-clear-search-inline"
                    title="Clear"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="button"
                className={`btn-toggle-filter-panel ${showFilterPanel ? 'active' : ''}`}
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                aria-expanded={showFilterPanel}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <span>{isTamil ? (showFilterPanel ? 'வடிப்பான்களை மறைக்க' : 'கூடுதல் வடிப்பான்கள் ▾') : (showFilterPanel ? 'Hide Filters' : 'Filter Options ▾')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Optional Collapsible Filter Controls */}
        {showFilterPanel && (
          <MaterialFilters
            searchTerm={searchTerm}
            onSearchChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            selectedCategory={selectedCategory}
            onCategoryChange={(val) => {
              setSelectedCategory(val);
              setCurrentPage(1);
            }}
            categories={categories}
            subjectTerm={subjectTerm}
            onSubjectChange={(val) => {
              setSubjectTerm(val);
              setCurrentPage(1);
            }}
            selectedSort={selectedSort}
            onSortChange={(val) => {
              setSelectedSort(val);
              setCurrentPage(1);
            }}
            onReset={handleResetFilters}
          />
        )}

        {/* Results Metadata Bar */}
        <div className="materials-meta-bar">
          <div className="results-count-text">
            {isTamil ? (
              <>
                மொத்தம் <strong>{pagination.total}</strong> பாடத்திட்ட ஆவணங்கள் கிடைக்கின்றன
                {searchTerm && <span> — "<strong>{searchTerm}</strong>" தேடலுக்கு</span>}
              </>
            ) : (
              <>
                Total <strong>{pagination.total}</strong> syllabus documents available
                {searchTerm && <span> — for "<strong>{searchTerm}</strong>"</span>}
              </>
            )}
          </div>
          <div className="active-filter-indicators">
            {selectedCategory && (
              <span className="active-filter-chip">
                {isTamil ? 'பிரிவு: ' : 'Category: '}
                {tCategory(categories.find((c) => String(c.id) === String(selectedCategory))?.name || 'Selected')}
              </span>
            )}
            {selectedExamGroup && (
              <span className="active-filter-chip">
                {isTamil ? 'குழு: ' : 'Group: '}
                {selectedExamGroup.replace('_', ' ')}
              </span>
            )}
            {subjectTerm && (
              <span className="active-filter-chip">
                {isTamil ? 'பாடம்: ' : 'Subject: '}
                {subjectTerm}
              </span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="materials-loading-state" role="status">
            <div className="loading-spinner"></div>
            <p>{isTamil ? 'அதிகாரப்பூர்வ பாடத்திட்ட ஆவணங்கள் ஏற்றப்படுகின்றன...' : 'Loading official syllabus documents...'}</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="materials-error-state" role="alert">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h3>{isTamil ? 'பாடத்திட்ட ஆவணங்களை ஏற்றுவதில் சிக்கல்' : 'Failed to Load Syllabus Documents'}</h3>
            <p>{error}</p>
            <button type="button" onClick={fetchSyllabus} className="btn-primary">
              {isTamil ? 'மீண்டும் முயற்சிக்கவும்' : 'Try Again'}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && syllabusList.length === 0 && (
          <div className="materials-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M7 7h10" />
              <path d="M7 12h10" />
              <path d="M7 17h10" />
            </svg>
            <h3>{isTamil ? 'பாடத்திட்ட ஆவணங்கள் எதுவும் கிடைக்கவில்லை' : 'No Syllabus Documents Found'}</h3>
            <p>
              {isTamil
                ? 'உங்கள் தற்போதைய தேடல் அல்லது வடிகட்டுதல் அளவுகோல்களுடன் பொருந்தக்கூடிய பாடத்திட்ட ஆவணங்கள் எதுவும் இல்லை.'
                : 'No syllabus documents match your search or filter criteria.'}
            </p>
            {(searchTerm || selectedCategory || subjectTerm || selectedExamGroup) && (
              <button type="button" onClick={handleResetFilters} className="btn-outline">
                {isTamil ? 'வடிப்பான்களை அழிக்கவும்' : 'Clear Filters'}
              </button>
            )}
          </div>
        )}

        {/* 5. Syllabus Content */}
        {!loading && !error && syllabusList.length > 0 && (
          <>
            {/* If TNPSC is selected (or All Groups with no search), show TNPSC Group Sections */}
            {isTamilNaduGovtSelected && !selectedExamGroup && !searchTerm && (
              <div className="syllabus-sections-container" style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🏛️</span>
                  <span>{isTamil ? 'டி.என்.பி.எஸ்.சி குரூப் பாடத்திட்டங்கள் (TNPSC Groups)' : 'TNPSC Group Examination Syllabi'}</span>
                </h3>
                {EXAM_GROUPS_CONFIG.map((grp) => {
                  const groupItems = syllabusList.filter((s) => s.exam_group === grp.key);
                  if (groupItems.length === 0) return null;

                  return (
                    <section
                      key={grp.key}
                      className="syllabus-group-section"
                      aria-labelledby={`heading-${grp.key}`}
                    >
                      <div className="syllabus-group-header">
                        <div className="syllabus-group-title-wrap">
                          <span className="syllabus-group-badge" style={{ backgroundColor: grp.color }}>
                            {grp.badge}
                          </span>
                          <div>
                            <h2 id={`heading-${grp.key}`} className="syllabus-group-heading">
                              {isTamil ? grp.titleTa : grp.titleEn}
                            </h2>
                            <p className="syllabus-group-desc">
                              {isTamil ? grp.descTa : grp.descEn}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="materials-cards-grid">
                        {groupItems.map((syl) => (
                          <MaterialCard
                            key={syl.id}
                            material={syl}
                            onDownloadSuccess={handleDownloadSuccess}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}

            {/* Other categories or filtered results grid */}
            {(!isTamilNaduGovtSelected || selectedExamGroup || searchTerm || selectedCategory) && (
              <div className="materials-cards-grid">
                {syllabusList.map((syl) => (
                  <MaterialCard
                    key={syl.id}
                    material={syl}
                    onDownloadSuccess={handleDownloadSuccess}
                  />
                ))}
              </div>
            )}

            {/* When viewing All Categories without filter, also display syllabi of other sectors */}
            {!selectedCategory && !selectedExamGroup && !searchTerm && (
              <div style={{ marginTop: '2.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📚</span>
                  <span>{isTamil ? 'மத்திய & பிற மாநில அரசுத் தேர்வு பாடத்திட்டங்கள்' : 'Central & Other Sector Examination Syllabi'}</span>
                </h3>
                <div className="materials-cards-grid">
                  {syllabusList
                    .filter((s) => !s.exam_group)
                    .map((syl) => (
                      <MaterialCard
                        key={syl.id}
                        material={syl}
                        onDownloadSuccess={handleDownloadSuccess}
                      />
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Syllabus;
