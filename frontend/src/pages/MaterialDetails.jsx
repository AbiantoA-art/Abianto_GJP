import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStudyMaterialById, downloadStudyMaterialFile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const MaterialDetails = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const { language, t, tCategory, tExamGroup, tMaterialType, tMaterialLanguage } = useLanguage();
  const isTa = language === 'ta';

  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getStudyMaterialById(id, token);
        if (!res.success) {
          setError(res.message || (isTa ? 'படிப்பு வளங்கள் கிடைக்கவில்லை.' : 'Study material not found.'));
          setMaterial(null);
        } else {
          setMaterial(res.data);
        }
      } catch (err) {
        setError(err.message || (isTa ? 'வளத்தின் விவரங்களை ஏற்றுவதில் சிக்கல்.' : 'Error loading resource details.'));
        setMaterial(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, token, isTa]);

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
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const isPdf = material?.file_mime_type?.includes('pdf') || material?.file_original_name?.endsWith('.pdf');
  const isSyllabus = material?.material_type === 'syllabus';

  const handleDownload = async () => {
    setDownloadError(null);
    setDownloading(true);
    try {
      const res = await downloadStudyMaterialFile(
        material.id,
        token,
        material.file_original_name || `${material.slug || 'document'}.pdf`
      );
      if (!res.success) {
        if (material.source_url) {
          window.open(material.source_url, '_blank', 'noopener,noreferrer');
        } else {
          setDownloadError(res.message || (isTa ? 'பதிவிறக்கம் தோல்வியடைந்தது' : 'Download failed'));
        }
      } else {
        // Increment count locally
        setMaterial((prev) => ({
          ...prev,
          download_count: (prev.download_count || 0) + 1,
        }));
      }
    } catch (err) {
      if (material.source_url) {
        window.open(material.source_url, '_blank', 'noopener,noreferrer');
      } else {
        setDownloadError(err.message || (isTa ? 'பதிவிறக்கத்தின் போது பிழை ஏற்பட்டது.' : 'Error during download.'));
      }
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="navbar-container page-content-wrap">
        <div className="materials-loading-state" role="status">
          <div className="loading-spinner"></div>
          <p>{isTa ? 'தேர்வு வளத்தின் விவரங்கள் ஏற்றப்படுகின்றன...' : 'Loading resource details...'}</p>
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="navbar-container page-content-wrap">
        <div className="materials-error-state" role="alert">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3>{isTa ? 'வளம் கிடைக்கவில்லை' : 'Resource Not Found'}</h3>
          <p>{error || (isTa ? 'கோரப்பட்ட படிப்புப் பொருள் அல்லது பாடத்திட்டம் கிடைக்கவில்லை.' : 'The requested study material or syllabus could not be found.')}</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
            <Link to="/study-materials" className="btn-primary">
              {isTa ? 'படிப்பு வளங்களைக் காண்க' : 'View Study Materials'}
            </Link>
            <Link to="/syllabus" className="btn-outline">
              {isTa ? 'பாடத்திட்டத்தைக் காண்க' : 'View Syllabus'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categoryDisplayName = tCategory(material.category_name || 'General Category');
  const isOfficialTnpsc = material.is_official && material.source_url?.includes('tnpsc.gov.in');
  const isOfficialGov = material.is_official && !isOfficialTnpsc;

  return (
    <div className="gov-material-details-page">
      {/* Header Banner */}
      <div className="page-header-strip">
        <div className="navbar-container">
          <div className="breadcrumb-nav">
            <Link to="/">{t('nav.home')}</Link> /{' '}
            <Link to={isSyllabus ? '/syllabus' : '/study-materials'}>
              {isSyllabus ? (isTa ? 'தேர்வு பாடத்திட்டம்' : 'Syllabus') : t('nav.studyMaterials')}
            </Link>{' '}
            / <span className="active-crumb">{material.title}</span>
          </div>

          <div className="details-header-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            {/* Exam Group */}
            {material.exam_group && (
              <span style={{
                background: '#1e3a8a',
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '0.8rem',
                padding: '4px 10px',
                borderRadius: '4px',
              }}>
                {tExamGroup(material.exam_group)}
              </span>
            )}

            {/* Material Type */}
            <span className="material-type-pill type-pill-study">
              {tMaterialType(material.material_type)}
            </span>

            {/* Language */}
            <span style={{
              background: material.language === 'TAMIL' ? '#fef3c7' : '#e0f2fe',
              color: material.language === 'TAMIL' ? '#92400e' : '#0369a1',
              fontWeight: '600',
              fontSize: '0.8rem',
              padding: '4px 8px',
              borderRadius: '4px',
              border: `1px solid ${material.language === 'TAMIL' ? '#fde68a' : '#bae6fd'}`,
            }}>
              {tMaterialLanguage(material.language || 'ENGLISH')}
            </span>

            {/* Category */}
            <span className="material-cat-tag">
              {categoryDisplayName}
            </span>

            {/* Official Source */}
            {isOfficialTnpsc && (
              <span style={{
                background: '#ecfdf5',
                color: '#065f46',
                fontWeight: '600',
                fontSize: '0.78rem',
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid #a7f3d0',
              }}>
                ✓ {isTa ? 'அதிகாரப்பூர்வ TNPSC' : 'Official TNPSC'}
              </span>
            )}

            {isOfficialGov && (
              <span style={{
                background: '#f0fdf4',
                color: '#166534',
                fontWeight: '600',
                fontSize: '0.78rem',
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid #bbf7d0',
              }}>
                ✓ {isTa ? 'அதிகாரப்பூர்வ அரசு மூலம்' : 'Official Govt Source'}
              </span>
            )}
          </div>

          <h1 className="page-header-title">{material.title}</h1>

          <p className="page-header-subtitle">
            {isTa ? 'பாடம்' : 'Subject'}: <strong>{material.subject}</strong> &bull; {isTa ? 'பிரிவு' : 'Category'}:{' '}
            {categoryDisplayName}
          </p>
        </div>
      </div>

      <div className="navbar-container page-content-wrap">
        <div className="material-details-grid">
          {/* Main Content Column */}
          <div className="details-main-column">
            {/* Overview Section */}
            <div className="gov-card details-card">
              <h2 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>{isTa ? 'பாடத்திட்டம் & கண்ணோட்டம்' : 'Syllabus & Overview'}</span>
              </h2>
              <div className="details-description-box">
                {material.description ? (
                  <p className="description-text">{material.description}</p>
                ) : (
                  <p className="description-empty">
                    {isTa
                      ? 'இந்த வளத்திற்கான கூடுதல் விளக்கம் எதுவும் வழங்கப்படவில்லை. முழு உள்ளடக்கத்திற்கு ஆவணத்தைப் பதிவிறக்கவும்.'
                      : 'No additional description provided for this resource. Download the document for full details.'}
                  </p>
                )}
              </div>
            </div>

            {/* Document Preview Section (For PDF) */}
            {isPdf && (
              <div className="gov-card details-card preview-card">
                <div className="preview-header-bar">
                  <h2 className="section-title" style={{ margin: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>{isTa ? 'ஆவண முன்னோட்டம் (PDF)' : 'Document Preview (PDF)'}</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="btn-outline btn-sm"
                  >
                    {showPreview
                      ? (isTa ? 'முன்னோட்டத்தை மறை' : 'Hide Preview')
                      : (isTa ? 'PDF முன்னோட்டத்தைக் காட்டு' : 'Show PDF Preview')}
                  </button>
                </div>

                {showPreview && (
                  <div className="pdf-preview-container">
                    <iframe
                      src={`/api/materials/${material.id}/download#toolbar=0`}
                      title={`Preview of ${material.title}`}
                      className="pdf-preview-frame"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar / Meta Column */}
          <div className="details-sidebar-column">
            {/* Download Action Card */}
            <div className="gov-card download-action-card">
              <h3 className="sidebar-card-title">{isTa ? 'அதிகாரப்பூர்வ வளத்தைப் பதிவிறக்கவும்' : 'Download Official Resource'}</h3>
              <p className="download-prompt">
                {isTa
                  ? 'அரசுப் பணி தேர்வர்களுக்காக வெளியிடப்பட்ட சரிபார்க்கப்பட்ட அதிகாரப்பூர்வ ஆவணம்.'
                  : 'Verified official document released for government job candidates.'}
              </p>

              {downloadError && (
                <div className="material-card-error" role="alert" style={{ marginBottom: '1rem' }}>
                  {downloadError}
                </div>
              )}

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="btn-primary w-full btn-large-download"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>
                  {downloading
                    ? (isTa ? 'பதிவிறக்கப்படுகிறது...' : 'Downloading...')
                    : (isTa ? 'ஆவணத்தைப் பதிவிறக்கவும்' : 'Download Document')}
                </span>
              </button>

              <div className="file-info-list">
                {material.exam_group && (
                  <div className="file-info-row">
                    <span className="info-row-label">{isTa ? 'தேர்வு குழு:' : 'Exam Group:'}</span>
                    <span className="info-row-val" style={{ fontWeight: '600', color: '#1e3a8a' }}>
                      {tExamGroup(material.exam_group)}
                    </span>
                  </div>
                )}
                <div className="file-info-row">
                  <span className="info-row-label">{isTa ? 'மொழி:' : 'Language:'}</span>
                  <span className="info-row-val" style={{ fontWeight: '600' }}>
                    {tMaterialLanguage(material.language || 'ENGLISH')}
                  </span>
                </div>
                {material.source_url && (
                  <div className="file-info-row">
                    <span className="info-row-label">{isTa ? 'அதிகாரப்பூர்வ மூலம்:' : 'Official Source:'}</span>
                    <span className="info-row-val">
                      <a
                        href={material.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1d4ed8', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        {isOfficialTnpsc
                          ? (isTa ? 'அதிகாரப்பூர்வ TNPSC தளம் ↗' : 'Official TNPSC Portal ↗')
                          : (isTa ? 'அதிகாரப்பூர்வ அரசு தளம் ↗' : 'Official Govt Portal ↗')}
                      </a>
                    </span>
                  </div>
                )}
                <div className="file-info-row">
                  <span className="info-row-label">{isTa ? 'கோப்பு பெயர்:' : 'File Name:'}</span>
                  <span className="info-row-val" title={material.file_original_name} style={{ overflowWrap: 'anywhere' }}>
                    {material.file_original_name || 'document.pdf'}
                  </span>
                </div>
                <div className="file-info-row">
                  <span className="info-row-label">{isTa ? 'கோப்பு வகை:' : 'File Type:'}</span>
                  <span className="info-row-val">{isPdf ? 'PDF Document' : 'Word Document (.doc / .docx)'}</span>
                </div>
                <div className="file-info-row">
                  <span className="info-row-label">{isTa ? 'கோப்பு அளவு:' : 'File Size:'}</span>
                  <span className="info-row-val">{formatFileSize(material.file_size)}</span>
                </div>
                <div className="file-info-row">
                  <span className="info-row-label">{isTa ? 'மொத்த பதிவிறக்கங்கள்:' : 'Total Downloads:'}</span>
                  <span className="info-row-val highlight-downloads">
                    {material.download_count?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="file-info-row">
                  <span className="info-row-label">{isTa ? 'பதிவேற்றப்பட்ட தேதி:' : 'Uploaded Date:'}</span>
                  <span className="info-row-val">{formatDate(material.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Back Navigation Card */}
            <div className="gov-card quick-nav-card">
              <h4 className="quick-nav-title">{isTa ? 'வளங்களை அறிதல்' : 'Quick Navigation'}</h4>
              <ul className="quick-nav-links">
                <li>
                  <Link to="/study-materials">{isTa ? 'அனைத்து படிப்பு வளங்களையும் காண்க →' : 'View All Study Materials →'}</Link>
                </li>
                <li>
                  <Link to="/syllabus">{isTa ? 'தேர்வு பாடத்திட்டத்தைக் காண்க →' : 'View Exam Syllabus →'}</Link>
                </li>
                <li>
                  <Link to="/jobs">{isTa ? 'அரசுப் பணிகளைத் தேடுங்கள் →' : 'Search Government Jobs →'}</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialDetails;
