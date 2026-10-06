import React, { useState, useMemo } from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { STUDY_MATERIALS } from '../data/placeholderData';

export const Materials = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    'All',
    'General Knowledge',
    'Aptitude & Reasoning',
    'Current Affairs',
    'Previous Year Papers',
    'English & Language',
    'Engineering & Technical',
    'Syllabus & Pattern',
  ];

  const filteredMaterials = useMemo(() => {
    return STUDY_MATERIALS.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="materials-page-layout">
      {/* Header Banner */}
      <div className="page-header-strip">
        <div className="section-container">
          <div className="breadcrumb-nav">
            <span>Home</span> / <span className="active-crumb">Official Study Materials</span>
          </div>
          <h1 className="page-header-title">Government Examination Preparation Resources</h1>
          <p className="page-header-subtitle">
            Access official syllabi, previous 10-year question papers, current affairs compendiums, and subject guides provided for public recruitment exams.
          </p>
        </div>
      </div>

      <div className="section-container page-content-wrap">
        {/* Search & Category Filter Bar */}
        <div className="materials-controls-box">
          <div className="material-search-input-wrap">
            <svg className="search-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search study materials, subjects, exam pattern..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="materials-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="clear-search-btn"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="category-pills-scroll">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-filter-pill ${selectedCategory === cat ? 'pill-active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Metadata */}
        <div className="results-control-bar">
          <div className="results-count-text">
            Showing <strong>{filteredMaterials.length}</strong> study modules
            {selectedCategory !== 'All' && <span> under <strong>{selectedCategory}</strong></span>}
          </div>
        </div>

        {/* Materials Grid */}
        {filteredMaterials.length > 0 ? (
          <div className="materials-cards-grid">
            {filteredMaterials.map((mat) => (
              <MaterialCard key={mat.id} material={mat} />
            ))}
          </div>
        ) : (
          <div className="empty-results-box">
            <div className="empty-icon-wrap">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h3 className="empty-title">No Study Materials Found</h3>
            <p className="empty-desc">
              No preparation modules matched your query. Try searching with broader terms or select another category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
              className="btn-reset-filters"
            >
              Show All Materials
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
