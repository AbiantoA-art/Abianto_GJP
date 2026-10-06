import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MaterialCard } from '../components/materials/MaterialCard';
import { MaterialFilters } from '../components/materials/MaterialFilters';
import { getStudyMaterials, getCategories } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const StudyMaterials = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tCategory, isTamil } = useLanguage();

  // URL-driven initial parameters
  const initialCategory = searchParams.get('category_id') || '';
  const initialGroup = searchParams.get('exam_group') || '';
  const initialType = searchParams.get('material_type') || '';
  const initialSearch = searchParams.get('search') || '';

  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedExamGroup, setSelectedExamGroup] = useState(initialGroup);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedMaterialType, setSelectedMaterialType] = useState(initialType);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [subjectTerm, setSubjectTerm] = useState('');
  const [selectedSort, setSelectedSort] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Sync state if URL changes externally
  useEffect(() => {
    const cat = searchParams.get('category_id') || '';
    const grp = searchParams.get('exam_group') || '';
    const typ = searchParams.get('material_type') || '';
    const srch = searchParams.get('search') || '';

    if (cat !== selectedCategory) setSelectedCategory(cat);
    if (grp !== selectedExamGroup) setSelectedExamGroup(grp);
    if (typ !== selectedMaterialType) setSelectedMaterialType(typ);
    if (srch !== searchTerm) setSearchTerm(srch);
  }, [searchParams]);

  // Fetch Categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      const res = await getCategories();
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    };
    fetchCats();
  }, []);

  // Fetch Study Materials
  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStudyMaterials({
        page: currentPage,
        limit: 12,
        search: searchTerm,
        category_id: selectedCategory || null,
        subject: subjectTerm,
        exam_group: selectedExamGroup || null,
        language: selectedLanguage || null,
        material_type: selectedMaterialType || null,
        sort: selectedSort,
      });

      if (!res.success) {
        setError(res.message || (isTamil ? 'படிப்பு வளங்களை ஏற்றுவதில் சிக்கல் ஏற்பட்டது.' : 'Failed to load study materials.'));
        setMaterials([]);
      } else {
        setMaterials(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setError(err.message || (isTamil ? 'எதிர்பாராத பிழை ஏற்பட்டது.' : 'An unexpected error occurred.'));
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedExamGroup, selectedLanguage, selectedMaterialType, selectedCategory, subjectTerm, selectedSort, isTamil]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setSelectedExamGroup('');
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedExamGroup('');
    setSelectedLanguage('');
    setSelectedMaterialType('');
    setSelectedCategory('');
    setSubjectTerm('');
    setSelectedSort('latest');
    setCurrentPage(1);
    setSearchParams({});
  };

  const handleDownloadSuccess = (materialId) => {
    setMaterials((prev) =>
      prev.map((item) =>
        item.id === materialId
          ? { ...item, download_count: (item.download_count || 0) + 1 }
          : item
      )
    );
  };

  // Determine if the selected category is Tamil Nadu Government (ID 13 or slug tamil-nadu-government)
  const isTamilNaduGovtSelected = useMemo(() => {
    if (!selectedCategory) return true; // Show TNPSC group tabs also on All
    const cat = categories.find((c) => String(c.id) === String(selectedCategory));
    return cat ? cat.id === 13 || cat.slug?.includes('tamil-nadu') : false;
  }, [selectedCategory, categories]);

  // Quick category list with icons for the overview explorer
  const featuredCategories = useMemo(() => {
    const list = [
      { id: 1, name: 'UPSC', icon: '🏛️', desc: 'Civil Services, CDS, NDA, CAPF' },
      { id: 2, name: 'SSC', icon: '📑', desc: 'CGL, CHSL, MTS, GD Constable' },
      { id: 3, name: 'Banking', icon: '🏦', desc: 'IBPS PO, Clerk, SBI PO, Clerk, RRB' },
      { id: 4, name: 'Railway', icon: '🚆', desc: 'RRB NTPC, Group D, ALP, Technician' },
      { id: 5, name: 'Defence', icon: '🛡️', desc: 'NDA, CDS, AFCAT, Army, Navy, Air Force' },
      { id: 6, name: 'Police', icon: '👮', desc: 'SI, Constable, Forest Guard' },
      { id: 13, name: 'Tamil Nadu Government', icon: '🏛️', desc: 'TNPSC Group 1, 2, 2A, 3, 4, TRB' },
      { id: 14, name: 'Postal', icon: '📮', desc: 'India Post GDS, Postal Assistant, Postman' },
      { id: 15, name: 'PSU', icon: '⚙️', desc: 'ONGC, BHEL, SAIL, IOCL, GAIL' },
      { id: 7, name: 'Teaching', icon: '📚', desc: 'TET, CTET, NET, SET, Assistant Professor' },
      { id: 9, name: 'Engineering', icon: '🔧', desc: 'ESE, GATE, State AE/JE Technical Cadres' },
      { id: 10, name: 'IT / Computer', icon: '💻', desc: 'NIC, Scientist, Programmer, Data Entry' },
    ];

    return list.map((item) => {
      const match = categories.find((c) => c.name.toLowerCase() === item.name.toLowerCase() || c.id === item.id);
      return {
        ...item,
        actualId: match ? match.id : item.id,
      };
    });
  }, [categories]);

  return (
    <div className="gov-materials-page">
      {/* Header Banner */}
      <div className="page-header-strip">
        <div className="navbar-container">
          <div className="breadcrumb-nav">
            <Link to="/">{isTamil ? 'முகப்பு' : 'Home'}</Link> /{' '}
            <span className="active-crumb">{isTamil ? 'படிப்பு வளங்கள்' : 'Study Materials'}</span>
          </div>
          <h1 className="page-header-title">
            {isTamil ? 'அரசுத் தேர்வு தயாரிப்பு வளங்கள்' : 'Government Exam Preparation Resources'}
          </h1>
          <p className="page-header-subtitle">
            {isTamil
              ? 'அனைத்து 24 அரசுப் பணி பிரிவுகளுக்கான அதிகாரப்பூர்வ பாடத்திட்டம், முந்தைய ஆண்டு வினாத்தாள்கள் மற்றும் விரிவான ஆய்வு வழிகாட்டிகள்.'
              : 'Official study notes, syllabus blueprints, previous question papers, and preparation guides for all 24 government job sectors.'}
          </p>
        </div>
      </div>

      <div className="navbar-container page-content-wrap">
        {/* Short Introduction */}
        <div className="materials-intro-banner">
          <div className="materials-intro-content">
            <h2 className="materials-intro-title">
              {isTamil ? 'முழுமையான அரசுத் தேர்வு தயாரிப்பு மையம்' : 'Complete Government Exam Preparation Hub'}
            </h2>
            <p className="materials-intro-text">
              {isTamil
                ? 'யு.பி.எஸ்.சி, எஸ்.எஸ்.சி, வங்கி, இரயில்வே, பாதுகாப்பு, காவல்துறை, டி.என்.பி.எஸ்.சி (குரூப் 1, 2, 2A, 3, 4), அஞ்சல், பொதுத்துறை நிறுவனங்கள் மற்றும் அனைத்து அரசுத் துறைகளின் நம்பகமான அதிகாரப்பூர்வ வளங்கள்.'
                : 'Direct access to authentic preparation resources for UPSC, SSC, Banking, Railways, Defence, Police, TNPSC (Groups 1, 2, 2A, 3, 4), Postal, PSUs, and all state and central recruitment boards.'}
            </p>
          </div>
        </div>

        {/* 1. Category Navigation Grid across all 24 categories */}
        <div className="category-nav-section" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isTamil ? 'அரசுப் பணி பிரிவு தேர்வு (Select Job Category):' : 'Select Job Category:'}
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

        {/* 2. Quick Group Filter Toolbar (for TNPSC / State Govt) */}
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
                  placeholder={isTamil ? 'தேடுக (Exam / Subject)...' : 'Search exam, subject...'}
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
                </svg>
                <span>{isTamil ? (showFilterPanel ? 'வடிப்பான்களை மறைக்க' : 'கூடுதல் வடிப்பான்கள் ▾') : (showFilterPanel ? 'Hide Filters' : 'Filter Options ▾')}</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Quick Material Type Selector */}
        <div className="material-type-quick-tabs">
          {[
            { key: '', labelEn: 'All Types', labelTa: 'அனைத்து வகைகளும்' },
            { key: 'study_material', labelEn: 'Study Materials', labelTa: 'படிப்பு பொருட்கள்' },
            { key: 'syllabus', labelEn: 'Syllabus', labelTa: 'பாடத்திட்டம்' },
            { key: 'question_paper', labelEn: 'Previous Year Papers', labelTa: 'முந்தைய வினாத்தாள்கள்' },
            { key: 'exam_pattern', labelEn: 'Exam Pattern', labelTa: 'தேர்வு முறை' },
            { key: 'answer_key', labelEn: 'Answer Keys', labelTa: 'விடைக்குறிப்புகள்' },
            { key: 'current_affairs', labelEn: 'Current Affairs', labelTa: 'நடப்பு நிகழ்வுகள்' },
            { key: 'practice_material', labelEn: 'Practice Tests', labelTa: 'பயிற்சித் தாள்கள்' },
          ].map((typeItem) => {
            const isActive = selectedMaterialType === typeItem.key;
            return (
              <button
                key={typeItem.key || 'ALL_TYPES'}
                type="button"
                className={`material-type-quick-tab ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setSelectedMaterialType(typeItem.key);
                  setCurrentPage(1);
                }}
              >
                {isTamil ? typeItem.labelTa : typeItem.labelEn}
              </button>
            );
          })}
        </div>

        {/* Optional Collapsible Filter Controls (Hidden by default) */}
        {showFilterPanel && (
          <MaterialFilters
            searchTerm={searchTerm}
            onSearchChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            selectedExamGroup={selectedExamGroup}
            onExamGroupChange={(val) => {
              setSelectedExamGroup(val);
              setCurrentPage(1);
            }}
            selectedLanguage={selectedLanguage}
            onLanguageChange={(val) => {
              setSelectedLanguage(val);
              setCurrentPage(1);
            }}
            selectedMaterialType={selectedMaterialType}
            onMaterialTypeChange={(val) => {
              setSelectedMaterialType(val);
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

        {/* 4. Category Cards Explorer (Featured when viewing All Categories and no search) */}
        {!selectedCategory && !searchTerm && !selectedExamGroup && !selectedMaterialType && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📑</span>
              <span>{isTamil ? 'முக்கிய அரசுத் தேர்வுகள் வழிகாட்டி' : 'Major Government Examinations'}</span>
            </h3>
            <div className="category-explorer-grid">
              {featuredCategories.map((cat) => (
                <div key={cat.id} className="category-explorer-card">
                  <div className="cat-card-header">
                    <div className="cat-card-icon">{cat.icon}</div>
                    <div>
                      <h4 className="cat-card-title">{tCategory(cat.name)}</h4>
                      <p className="cat-card-desc">{cat.desc}</p>
                    </div>
                  </div>
                  <div className="cat-card-actions">
                    <button
                      type="button"
                      className="cat-card-btn"
                      onClick={() => {
                        setSelectedCategory(cat.actualId);
                        setSelectedMaterialType('study_material');
                        setCurrentPage(1);
                      }}
                    >
                      {isTamil ? 'படிப்பு பொருட்கள்' : 'Study Materials'}
                    </button>
                    <button
                      type="button"
                      className="cat-card-btn"
                      onClick={() => {
                        setSelectedCategory(cat.actualId);
                        setSelectedMaterialType('syllabus');
                        setCurrentPage(1);
                      }}
                    >
                      {isTamil ? 'பாடத்திட்டம்' : 'Syllabus'}
                    </button>
                    <button
                      type="button"
                      className="cat-card-btn"
                      onClick={() => {
                        setSelectedCategory(cat.actualId);
                        setSelectedMaterialType('question_paper');
                        setCurrentPage(1);
                      }}
                    >
                      {isTamil ? 'வினாத்தாள்கள்' : 'Question Papers'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Metadata Bar */}
        <div className="materials-meta-bar">
          <div className="results-count-text">
            {isTamil ? (
              <>
                மொத்தம் <strong>{pagination.total}</strong> படிப்பு வளங்கள் கிடைக்கின்றன
                {searchTerm && <span> — "<strong>{searchTerm}</strong>" தேடலுக்கு</span>}
              </>
            ) : (
              <>
                Total <strong>{pagination.total}</strong> study resources available
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
            {selectedLanguage && (
              <span className="active-filter-chip">
                {isTamil ? 'மொழி: ' : 'Lang: '}
                {selectedLanguage}
              </span>
            )}
            {selectedMaterialType && (
              <span className="active-filter-chip">
                {isTamil ? 'வகை: ' : 'Type: '}
                {selectedMaterialType.replace('_', ' ')}
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
            <p>{isTamil ? 'அதிகாரப்பூர்வ படிப்பு வளங்கள் ஏற்றப்படுகின்றன...' : 'Loading official study resources...'}</p>
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
            <h3>{isTamil ? 'படிப்பு வளங்களை ஏற்றுவதில் சிக்கல்' : 'Failed to Load Study Resources'}</h3>
            <p>{error}</p>
            <button type="button" onClick={fetchMaterials} className="btn-primary">
              {isTamil ? 'மீண்டும் முயற்சிக்கவும்' : 'Try Again'}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && materials.length === 0 && (
          <div className="materials-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <h3>{isTamil ? 'படிப்பு வளங்கள் எதுவும் கிடைக்கவில்லை' : 'No Study Materials Found'}</h3>
            <p>
              {isTamil
                ? 'உங்கள் தற்போதைய தேடல் அல்லது வடிகட்டுதல் அளவுகோல்களுடன் பொருந்தக்கூடிய படிப்புப் பொருட்கள் எதுவும் இல்லை.'
                : 'No study materials match your search or filter criteria.'}
            </p>
            {(searchTerm || selectedCategory || selectedExamGroup || selectedMaterialType) && (
              <button type="button" onClick={handleResetFilters} className="btn-outline">
                {isTamil ? 'வடிப்பான்களை அழிக்கவும்' : 'Clear Filters'}
              </button>
            )}
          </div>
        )}

        {/* Materials Grid */}
        {!loading && !error && materials.length > 0 && (
          <div className="materials-cards-grid">
            {materials.map((mat) => (
              <MaterialCard
                key={mat.id}
                material={mat}
                onDownloadSuccess={handleDownloadSuccess}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="materials-pagination" role="navigation" aria-label="Pagination">
            <button
              type="button"
              className="btn-page-nav"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              ← {isTamil ? 'முந்தைய பக்கம்' : 'Previous'}
            </button>
            <span className="pagination-status">
              {isTamil
                ? `பக்கம் ${pagination.page} / ${pagination.totalPages}`
                : `Page ${pagination.page} of ${pagination.totalPages}`}
            </span>
            <button
              type="button"
              className="btn-page-nav"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
            >
              {isTamil ? 'அடுத்த பக்கம்' : 'Next'} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyMaterials;
