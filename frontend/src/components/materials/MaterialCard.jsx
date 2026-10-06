import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { downloadStudyMaterialFile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const MaterialCard = ({ material, onDownloadSuccess }) => {
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const { token } = useAuth();
  const { t, tCategory, tExamGroup, tMaterialType, tMaterialLanguage, isTamil } = useLanguage();

  if (!material) return null;

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
      return d.toLocaleDateString(isTamil ? 'ta-IN' : 'en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getFileBadgeClass = (mime) => {
    if (!mime) return 'file-tag-default';
    if (mime.includes('pdf')) return 'file-tag-pdf';
    if (mime.includes('word') || mime.includes('document')) return 'file-tag-doc';
    return 'file-tag-default';
  };

  const getFileExt = (filename, mime) => {
    if (filename && filename.includes('.')) {
      return filename.split('.').pop().toUpperCase();
    }
    if (mime?.includes('pdf')) return 'PDF';
    if (mime?.includes('word')) return 'DOC';
    return 'PDF';
  };

  const handleDownload = async () => {
    setErrorMsg(null);
    setDownloading(true);
    try {
      const result = await downloadStudyMaterialFile(
        material.id,
        token,
        material.file_original_name || `${material.slug || 'document'}.pdf`
      );
      if (!result.success) {
        if (material.source_url) {
          window.open(material.source_url, '_blank', 'noopener,noreferrer');
        } else {
          setErrorMsg(result.message || (isTamil ? 'பதிவிறக்கம் தோல்வியடைந்தது' : 'Download failed'));
        }
      } else if (onDownloadSuccess) {
        onDownloadSuccess(material.id);
      }
    } catch (err) {
      if (material.source_url) {
        window.open(material.source_url, '_blank', 'noopener,noreferrer');
      } else {
        setErrorMsg(err.message || (isTamil ? 'கோப்பைப் பதிவிறக்குவதில் சிக்கல்' : 'Error downloading file'));
      }
    } finally {
      setDownloading(false);
    }
  };

  const isOfficialTnpsc = material.is_official && material.source_url?.includes('tnpsc.gov.in');
  const isOfficialGov = material.is_official && !isOfficialTnpsc;

  return (
    <div className="gov-material-card">
      {/* Top Badges Bar */}
      <div className="material-card-top" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
        {/* Exam Group Badge */}
        {material.exam_group && (
          <span className="material-group-badge" style={{
            background: '#1e3a8a',
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '0.75rem',
            padding: '2px 8px',
            borderRadius: '4px',
            display: 'inline-flex',
            alignItems: 'center',
          }}>
            {tExamGroup(material.exam_group)}
          </span>
        )}

        {/* Material Type Pill */}
        <span className="material-type-pill type-pill-study">
          {tMaterialType(material.material_type)}
        </span>

        {/* Language Badge */}
        <span className="material-lang-tag" style={{
          background: material.language === 'TAMIL' ? '#fef3c7' : '#e0f2fe',
          color: material.language === 'TAMIL' ? '#92400e' : '#0369a1',
          fontWeight: '600',
          fontSize: '0.72rem',
          padding: '2px 6px',
          borderRadius: '4px',
          border: `1px solid ${material.language === 'TAMIL' ? '#fde68a' : '#bae6fd'}`,
        }}>
          {tMaterialLanguage(material.language || 'ENGLISH')}
        </span>

        {/* Official Source Badge */}
        {isOfficialTnpsc && (
          <span className="material-official-badge" style={{
            background: '#ecfdf5',
            color: '#065f46',
            fontWeight: '600',
            fontSize: '0.72rem',
            padding: '2px 7px',
            borderRadius: '4px',
            border: '1px solid #a7f3d0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}>
            ✓ {isTamil ? 'அதிகாரப்பூர்வ TNPSC' : 'Official TNPSC'}
          </span>
        )}

        {isOfficialGov && (
          <span className="material-official-badge" style={{
            background: '#f0fdf4',
            color: '#166534',
            fontWeight: '600',
            fontSize: '0.72rem',
            padding: '2px 7px',
            borderRadius: '4px',
            border: '1px solid #bbf7d0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}>
            ✓ {isTamil ? 'அதிகாரப்பூர்வ அரசு மூலம்' : 'Official Govt Source'}
          </span>
        )}

        {/* File Format Badge */}
        <span className={`material-file-badge ${getFileBadgeClass(material.file_mime_type)}`} style={{ marginLeft: 'auto' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {getFileExt(material.file_original_name, material.file_mime_type)}
        </span>
      </div>

      <div className="material-card-body">
        <h4 className="material-title" title={material.title}>
          <Link to={`/study-materials/${material.id}`} className="material-title-link">
            {material.title}
          </Link>
        </h4>
        <div className="material-subject-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span>{isTamil ? 'பாடம்:' : 'Subject:'} <strong>{material.subject}</strong></span>
        </div>
        <p className="material-description">
          {material.description ||
            (isTamil
              ? 'போட்டித் தேர்வுகளுக்கான அதிகாரப்பூர்வ தேர்வு தயாரிப்பு ஆவணம்.'
              : 'Official preparation resource for competitive examinations.')}
        </p>
      </div>

      <div className="material-card-meta">
        <div className="meta-item">
          <span className="meta-label">{isTamil ? 'தேர்வு குழு' : 'Exam Group'}</span>
          <span className="meta-val" style={{ fontWeight: '600' }}>
            {tExamGroup(material.exam_group || 'GROUP_1')}
          </span>
        </div>
        <div className="meta-item">
          <span className="meta-label">{isTamil ? 'மொழி' : 'Language'}</span>
          <span className="meta-val">{tMaterialLanguage(material.language || 'ENGLISH')}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">{isTamil ? 'பதிவிறக்கங்கள்' : 'Downloads'}</span>
          <span className="meta-val highlight-downloads">
            {material.download_count?.toLocaleString() || 0}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="material-card-error" role="alert">
          {errorMsg}
        </div>
      )}

      <div className="material-card-actions">
        {/* Read / View Button */}
        <Link
          to={`/study-materials/${material.id}`}
          className="btn-material-action btn-material-view"
          title={isTamil ? 'விவரங்களை பார்வை இடவும்' : 'View material details'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>{t('readView', isTamil ? 'பார்வையிட' : 'Read / View')}</span>
        </Link>

        {/* Download Button */}
        <button
          type="button"
          onClick={handleDownload}
          className="btn-material-action btn-material-download"
          disabled={downloading}
          title={isTamil ? 'ஆவணத்தைப் பதிவிறக்கவும்' : 'Download document'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>
            {downloading
              ? (isTamil ? 'பதிவிறக்கப்படுகிறது...' : 'Downloading...')
              : t('download', isTamil ? 'பதிவிறக்கம்' : 'Download')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default MaterialCard;
