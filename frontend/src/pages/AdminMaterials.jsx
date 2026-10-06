import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getAdminMaterials,
  getAdminMaterialStats,
  getCategories,
  updateAdminMaterialStatus,
  archiveAdminMaterial,
  downloadStudyMaterialFile,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MaterialStatusBadge } from '../components/materials/MaterialStatusBadge';
import { MaterialFormModal } from '../components/materials/MaterialFormModal';
import { ReplaceFileModal } from '../components/materials/ReplaceFileModal';

export const AdminMaterials = () => {
  const { token } = useAuth();
  const { language, t, tCategory } = useLanguage();
  const isTa = language === 'ta';

  // Data states
  const [materials, setMaterials] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    studyMaterials: 0,
    syllabus: 0,
    totalDownloads: 0,
  });
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [examGroupFilter, setExamGroupFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [selectedSort, setSelectedSort] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [replacingMaterial, setReplacingMaterial] = useState(null);

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

  // Fetch Statistics
  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getAdminMaterialStats(token);
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch {
      // Quietly ignore stat load error
    }
  }, [token]);

  // Fetch Materials List
  const fetchMaterialsList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminMaterials(
        {
          page: currentPage,
          limit: 10,
          search: searchTerm,
          status: statusFilter,
          material_type: typeFilter,
          category_id: categoryFilter,
          exam_group: examGroupFilter,
          language: languageFilter,
          sort: selectedSort,
        },
        token
      );

      if (!res.success) {
        setError(res.message || (isTa ? 'வளங்களைப் பெறுவதில் பிழை.' : 'Failed to retrieve materials.'));
        setMaterials([]);
      } else {
        setMaterials(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setError(err.message || (isTa ? 'நிர்வாக வளங்களைப் பெறுவதில் பிணையப் பிழை.' : 'Network error fetching admin materials.'));
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, searchTerm, statusFilter, typeFilter, categoryFilter, examGroupFilter, languageFilter, selectedSort, isTa]);

  useEffect(() => {
    fetchStats();
    fetchMaterialsList();
  }, [fetchStats, fetchMaterialsList]);

  // Handle status toggle (draft -> published -> archived)
  const handleStatusChange = async (materialId, targetStatus) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await updateAdminMaterialStatus(materialId, targetStatus, token);
      if (!res.success) {
        setActionError(res.message || (isTa ? 'வளத்தின் நிலையைப் புதுப்பிக்க முடியவில்லை.' : 'Failed to update resource status.'));
      } else {
        setActionSuccess(isTa ? 'வளத்தின் நிலை வெற்றிகரமாக புதுப்பிக்கப்பட்டது.' : 'Resource status updated successfully.');
        fetchMaterialsList();
        fetchStats();
      }
    } catch (err) {
      setActionError(err.message || (isTa ? 'நிலையைப் புதுப்பிப்பதில் பிழை ஏற்பட்டது.' : 'Error updating status.'));
    }
  };

  // Handle soft archive
  const handleArchive = async (materialId) => {
    const confirmMsg = isTa
      ? 'இந்த வளத்தைக் காப்பகப்படுத்த விரும்புகிறீர்களா? இது பொதுமக்கள் பார்வையிலிருந்து மறைக்கப்படும்.'
      : 'Are you sure you want to archive this resource? It will be hidden from public view.';
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await archiveAdminMaterial(materialId, token);
      if (!res.success) {
        setActionError(res.message || (isTa ? 'வளத்தைக் காப்பகப்படுத்த முடியவில்லை.' : 'Failed to archive resource.'));
      } else {
        setActionSuccess(isTa ? 'வளம் வெற்றிகரமாக காப்பகப்படுத்தப்பட்டது.' : 'Resource archived successfully.');
        fetchMaterialsList();
        fetchStats();
      }
    } catch (err) {
      setActionError(err.message || (isTa ? 'வளத்தைக் காப்பகப்படுத்துவதில் பிழை ஏற்பட்டது.' : 'Error archiving resource.'));
    }
  };

  // Handle admin download
  const handleDownload = async (mat) => {
    try {
      await downloadStudyMaterialFile(
        mat.id,
        token,
        mat.file_original_name || `${mat.slug || 'document'}.pdf`
      );
      fetchStats();
    } catch (err) {
      setActionError(err.message || (isTa ? 'கோப்பைப் பதிவிறக்க முடியவில்லை.' : 'Failed to download file.'));
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setCategoryFilter('');
    setExamGroupFilter('');
    setLanguageFilter('');
    setSelectedSort('latest');
    setCurrentPage(1);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isTa ? 'ta-IN' : 'en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="gov-admin-materials-page">
      {/* Admin Title Strip */}
      <div className="admin-header-strip">
        <div className="navbar-container admin-header-content">
          <div>
            <div className="breadcrumb-nav">
              <Link to="/admin/dashboard">{t('admin.dashboard')}</Link> /{' '}
              <span className="active-crumb">{isTa ? 'படிப்பு வளங்கள் & பாடத்திட்ட மேலாண்மை' : 'Study Materials & Syllabus Management'}</span>
            </div>
            <h1 className="admin-header-title">{isTa ? 'படிப்பு வளங்கள் & பாடத்திட்டக் களஞ்சியம்' : 'Study Materials & Syllabus Repository'}</h1>
            <p className="admin-header-subtitle">
              {isTa
                ? 'தயாரிப்பு வளங்களை வெளியிடுதல், பாடத்திட்டங்களைப் பதிவேற்றுதல், பதிவிறக்க அளவீடுகளை ஆய்வு செய்தல் மற்றும் வளங்களின் சுழற்சியை நிர்வகித்தல்.'
                : 'Publish preparation resources, upload syllabi, monitor download metrics, and manage resource lifecycles.'}
            </p>
          </div>
          <button
            type="button"
            className="btn-primary btn-create-material"
            onClick={() => {
              setEditingMaterial(null);
              setFormModalOpen(true);
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{isTa ? 'புதிய வளத்தைப் பதிவேற்றுக' : 'Upload New Resource'}</span>
          </button>
        </div>
      </div>

      <div className="navbar-container page-content-wrap">
        {/* Notifications */}
        {actionSuccess && (
          <div className="gov-alert-success" role="alert">
            <span>{actionSuccess}</span>
            <button type="button" onClick={() => setActionSuccess(null)} className="alert-close">
              ✕
            </button>
          </div>
        )}
        {actionError && (
          <div className="gov-alert-error" role="alert">
            <span>{actionError}</span>
            <button type="button" onClick={() => setActionError(null)} className="alert-close">
              ✕
            </button>
          </div>
        )}

        {/* Statistics Tiles Grid */}
        <div className="admin-stats-grid">
          <div className="stat-card">
            <span className="stat-label">{isTa ? 'மொத்த வளங்கள்' : 'Total Resources'}</span>
            <span className="stat-value">{stats.total || 0}</span>
            <span className="stat-subtext">{isTa ? 'பதிவு செய்யப்பட்ட அனைத்து வளங்கள்' : 'All registered resources'}</span>
          </div>
          <div className="stat-card published-stat">
            <span className="stat-label">{isTa ? 'வெளியிடப்பட்டது (நேரலை)' : 'Published (Live)'}</span>
            <span className="stat-value">{stats.published || 0}</span>
            <span className="stat-subtext">{isTa ? 'பொதுமக்கள் பார்வைக்கு' : 'Publicly accessible'}</span>
          </div>
          <div className="stat-card draft-stat">
            <span className="stat-label">{isTa ? 'வரைவு (தனிப்பட்டது)' : 'Draft (Private)'}</span>
            <span className="stat-value">{stats.draft || 0}</span>
            <span className="stat-subtext">{isTa ? 'நிர்வாகப் பரிசீலனையில்' : 'Under admin review'}</span>
          </div>
          <div className="stat-card archived-stat">
            <span className="stat-label">{isTa ? 'காப்பகப்படுத்தப்பட்டது' : 'Archived'}</span>
            <span className="stat-value">{stats.archived || 0}</span>
            <span className="stat-subtext">{isTa ? 'பொதுமக்களிடமிருந்து மறைக்கப்பட்டது' : 'Hidden from public'}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{t('nav.studyMaterials')}</span>
            <span className="stat-value">{stats.studyMaterials || 0}</span>
            <span className="stat-subtext">{isTa ? 'தயாரிப்பு வழிகாட்டிகள்' : 'Preparation guides'}</span>
          </div>
          <div className="stat-card syllabus-stat">
            <span className="stat-label">{isTa ? 'பாடத்திட்ட வளங்கள்' : 'Syllabus Resources'}</span>
            <span className="stat-value">{stats.syllabus || 0}</span>
            <span className="stat-subtext">{isTa ? 'தேர்வு முறைகள் மற்றும் வடிவங்கள்' : 'Exam patterns & schemes'}</span>
          </div>
          <div className="stat-card downloads-stat">
            <span className="stat-label">{isTa ? 'மொத்த பதிவிறக்கங்கள்' : 'Total Downloads'}</span>
            <span className="stat-value highlight-downloads">{stats.totalDownloads?.toLocaleString(isTa ? 'ta-IN' : 'en-US') || 0}</span>
            <span className="stat-subtext">{isTa ? 'மொத்த குடிமக்கள் பதிவிறக்கங்கள்' : 'Total candidate downloads'}</span>
          </div>
        </div>

        {/* Controls & Search Bar */}
        <div className="admin-controls-card gov-card">
          <div className="controls-row">
            <div className="search-field-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder={isTa ? 'தலைப்பு, பாடம், விளக்கம் மூலம் தேடுங்கள்...' : 'Search by title, subject, or description...'}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="gov-form-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="clear-search-btn"
                  title={isTa ? 'தேடலை அழிக்கவும்' : 'Clear search'}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Exam Group Filter */}
            <select
              value={examGroupFilter}
              onChange={(e) => {
                setExamGroupFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="gov-form-select control-select"
            >
              <option value="">{isTa ? 'அனைத்து குழுக்களும்' : 'All Groups'}</option>
              <option value="GROUP_1">Group 1</option>
              <option value="GROUP_2">Group 2</option>
              <option value="GROUP_2A">Group 2A</option>
              <option value="GROUP_3">Group 3</option>
              <option value="GROUP_4">Group 4</option>
            </select>

            {/* Language Filter */}
            <select
              value={languageFilter}
              onChange={(e) => {
                setLanguageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="gov-form-select control-select"
            >
              <option value="">{isTa ? 'அனைத்து மொழிகளும்' : 'All Languages'}</option>
              <option value="TAMIL">Tamil (தமிழ்)</option>
              <option value="ENGLISH">English (ஆங்கிலம்)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="gov-form-select control-select"
            >
              <option value="">{isTa ? 'அனைத்து நிலைகள்' : 'All Statuses'}</option>
              <option value="draft">{isTa ? 'வரைவு' : 'Draft'}</option>
              <option value="published">{isTa ? 'வெளியிடப்பட்டது' : 'Published'}</option>
              <option value="archived">{isTa ? 'காப்பகப்படுத்தப்பட்டது' : 'Archived'}</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="gov-form-select control-select"
            >
              <option value="">{isTa ? 'அனைத்து வகைகள்' : 'All Types'}</option>
              <option value="study_material">{isTa ? 'படிப்புப் பொருள்' : 'Study Material'}</option>
              <option value="syllabus">{isTa ? 'பாடத்திட்டம்' : 'Syllabus'}</option>
              <option value="exam_pattern">{isTa ? 'தேர்வு முறை' : 'Exam Pattern'}</option>
              <option value="question_paper">{isTa ? 'முந்தைய வினாத்தாள்' : 'Question Paper'}</option>
              <option value="notification">{isTa ? 'அறிவிக்கை' : 'Notification'}</option>
              <option value="answer_key">{isTa ? 'விடைக்குறிப்பு' : 'Answer Key'}</option>
              <option value="current_affairs">{isTa ? 'நடப்பு நிகழ்வுகள்' : 'Current Affairs'}</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="gov-form-select control-select"
            >
              <option value="">{t('home.allCategories')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {tCategory(c.name)}
                </option>
              ))}
            </select>

            {/* Sort Filter */}
            <select
              value={selectedSort}
              onChange={(e) => {
                setSelectedSort(e.target.value);
                setCurrentPage(1);
              }}
              className="gov-form-select control-select"
            >
              <option value="latest">{isTa ? 'புதியவை' : 'Latest'}</option>
              <option value="oldest">{isTa ? 'பழையவை' : 'Oldest'}</option>
              <option value="downloads_high">{isTa ? 'பதிவிறக்கங்கள் (அதிகம்)' : 'Downloads (High)'}</option>
              <option value="downloads_low">{isTa ? 'பதிவிறக்கங்கள் (குறைவு)' : 'Downloads (Low)'}</option>
              <option value="title_az">{isTa ? 'தலைப்பு (A-Z)' : 'Title (A-Z)'}</option>
              <option value="title_za">{isTa ? 'தலைப்பு (Z-A)' : 'Title (Z-A)'}</option>
            </select>

            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-outline btn-reset-filters"
              title={isTa ? 'மீட்டமைக்க' : 'Reset filters'}
            >
              {isTa ? 'மீட்டமை' : 'Reset'}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="materials-loading-state" role="status">
            <div className="loading-spinner"></div>
            <p>{isTa ? 'நிர்வாக வளங்கள் ஏற்றப்படுகின்றன...' : 'Loading resources...'}</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="materials-error-state" role="alert">
            <p>{error}</p>
            <button type="button" onClick={fetchMaterialsList} className="btn-primary">
              {isTa ? 'மீண்டும் முயற்சிக்கவும்' : 'Try Again'}
            </button>
          </div>
        )}

        {/* Table Content */}
        {!loading && !error && materials.length === 0 && (
          <div className="materials-empty-state">
            <h3>{isTa ? 'வளங்கள் எதுவும் கிடைக்கவில்லை' : 'No Resources Found'}</h3>
            <p>{isTa ? 'தேர்ந்தெடுக்கப்பட்ட வடிப்பான்களுக்குப் பொருந்தும் படிப்பு வளங்கள் எதுவும் இல்லை.' : 'No study materials match your selected filters.'}</p>
            <button
              type="button"
              onClick={() => {
                setEditingMaterial(null);
                setFormModalOpen(true);
              }}
              className="btn-primary"
            >
              {isTa ? 'முதல் வளத்தைப் பதிவேற்றுக' : 'Upload First Resource'}
            </button>
          </div>
        )}

        {!loading && !error && materials.length > 0 && (
          <div className="gov-table-container">
            <table className="gov-table admin-materials-table">
              <thead>
                <tr>
                  <th>{isTa ? 'தலைப்பு & பாடம்' : 'Title & Subject'}</th>
                  <th>{isTa ? 'வகை' : 'Type'}</th>
                  <th>{isTa ? 'குழு & மொழி' : 'Group & Lang'}</th>
                  <th>{isTa ? 'பிரிவு' : 'Category'}</th>
                  <th>{isTa ? 'நிலை' : 'Status'}</th>
                  <th>{isTa ? 'கோப்பு தகவல்' : 'File Info'}</th>
                  <th>{isTa ? 'பதிவிறக்கங்கள்' : 'Downloads'}</th>
                  <th>{isTa ? 'பதிவேற்றப்பட்டது' : 'Uploaded'}</th>
                  <th style={{ textAlign: 'right' }}>{isTa ? 'செயல்கள்' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((mat) => (
                  <tr key={mat.id}>
                    <td>
                      <div className="table-title-cell">
                        <strong className="mat-row-title">{mat.title}</strong>
                        <span className="mat-row-subject">{isTa ? 'பாடம்:' : 'Subject:'} {mat.subject}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`material-type-pill ${mat.material_type === 'syllabus' ? 'type-pill-syllabus' : 'type-pill-study'}`}>
                        {mat.material_type === 'syllabus' ? (isTa ? 'பாடத்திட்டம்' : 'Syllabus') : (isTa ? 'படிப்புப் பொருள்' : 'Study Material')}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1e3a8a' }}>
                        {mat.exam_group ? mat.exam_group.replace('_', ' ') : '-'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                        {mat.language || 'ENGLISH'}
                      </div>
                    </td>
                    <td>
                      <span className="table-cat-badge">{tCategory(mat.category_name) || 'N/A'}</span>
                    </td>
                    <td>
                      <MaterialStatusBadge status={mat.status} />
                    </td>
                    <td>
                      <div className="table-file-cell">
                        <span className="file-name-text" title={mat.file_original_name}>
                          {mat.file_original_name}
                        </span>
                        <span className="file-meta-sub">{formatFileSize(mat.file_size)}</span>
                      </div>
                    </td>
                    <td>
                      <span className="table-downloads-count">{mat.download_count || 0}</span>
                    </td>
                    <td>
                      <span className="table-date-text">{formatDate(mat.created_at)}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-action-buttons">
                        {/* Download button */}
                        <button
                          type="button"
                          className="btn-action-icon"
                          title={isTa ? 'கோப்பைப் பதிவிறக்குக' : 'Download file'}
                          onClick={() => handleDownload(mat)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>

                        {/* Edit metadata */}
                        <button
                          type="button"
                          className="btn-action-icon"
                          title={isTa ? 'விவரங்களைத் திருத்துக' : 'Edit details'}
                          onClick={() => {
                            setEditingMaterial(mat);
                            setFormModalOpen(true);
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </button>

                        {/* Replace File */}
                        <button
                          type="button"
                          className="btn-action-icon"
                          title={isTa ? 'கோப்பை மாற்றுக' : 'Replace file'}
                          onClick={() => {
                            setReplacingMaterial(mat);
                            setReplaceModalOpen(true);
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="16 16 12 12 8 16" />
                            <line x1="12" y1="12" x2="12" y2="21" />
                            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                          </svg>
                        </button>

                        {/* Publish / Draft status toggle */}
                        {mat.status === 'draft' && (
                          <button
                            type="button"
                            className="btn-action-status btn-status-publish"
                            title={isTa ? 'வளத்தை வெளியிடுக' : 'Publish resource'}
                            onClick={() => handleStatusChange(mat.id, 'published')}
                          >
                            {isTa ? 'வெளியிடு' : 'Publish'}
                          </button>
                        )}
                        {mat.status === 'published' && (
                          <button
                            type="button"
                            className="btn-action-status btn-status-draft"
                            title={isTa ? 'வரைவாக மாற்றுக' : 'Revert to draft'}
                            onClick={() => handleStatusChange(mat.id, 'draft')}
                          >
                            {isTa ? 'திரும்பப்பெறு' : 'Draft'}
                          </button>
                        )}
                        {mat.status === 'archived' && (
                          <button
                            type="button"
                            className="btn-action-status btn-status-publish"
                            title={isTa ? 'மீண்டும் வெளியிடுக' : 'Restore resource'}
                            onClick={() => handleStatusChange(mat.id, 'published')}
                          >
                            {isTa ? 'மீட்டெடு' : 'Restore'}
                          </button>
                        )}

                        {/* Archive button */}
                        {mat.status !== 'archived' && (
                          <button
                            type="button"
                            className="btn-action-icon btn-action-archive"
                            title={isTa ? 'காப்பகப்படுத்துக' : 'Archive resource'}
                            onClick={() => handleArchive(mat.id)}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="4" rx="1" />
                              <path d="M5 7v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" />
                              <line x1="10" y1="12" x2="14" y2="12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="gov-pagination-wrap" aria-label="Pagination">
            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              {isTa ? '← முந்தையது' : '← Previous'}
            </button>
            <div className="pagination-pages">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  type="button"
                  className={`pagination-num ${currentPage === pg ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pg)}
                >
                  {pg}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
            >
              {isTa ? 'அடுத்தது →' : 'Next →'}
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <MaterialFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingMaterial(null);
        }}
        onSuccess={() => {
          setActionSuccess(
            editingMaterial
              ? (isTa ? 'படிப்பு வளம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது.' : 'Resource updated successfully.')
              : (isTa ? 'படிப்பு வளம் வெற்றிகரமாக பதிவேற்றப்பட்டது.' : 'Resource uploaded successfully.')
          );
          fetchMaterialsList();
          fetchStats();
        }}
        material={editingMaterial}
        categories={categories}
      />

      {/* Replace File Modal */}
      <ReplaceFileModal
        isOpen={replaceModalOpen}
        onClose={() => {
          setReplaceModalOpen(false);
          setReplacingMaterial(null);
        }}
        onSuccess={() => {
          setActionSuccess(isTa ? 'வளக் கோப்பு வெற்றிகரமாக மாற்றப்பட்டது.' : 'File replaced successfully.');
          fetchMaterialsList();
        }}
        material={replacingMaterial}
      />
    </div>
  );
};

export default AdminMaterials;
