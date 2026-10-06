import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const MaterialCard = ({ material }) => {
  const [downloading, setDownloading] = useState(false);
  const { isTamil } = useLanguage();

  if (!material) return null;

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      alert(`[Download Simulation]\n\nPreparing file: "${material.title}" (${material.fileSize}).`);
      setDownloading(false);
    }, 250);
  };

  const handleView = () => {
    alert(`[Document Preview]\n\n"${material.title}"\nCategory: ${material.category}\nFile Type: ${material.fileType}\nUploaded: ${material.uploadDate}`);
  };

  return (
    <div className="gov-material-card">
      <div className="material-card-top">
        <span className="material-cat-tag">{material.category}</span>
        <span className="material-file-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {material.fileType}
        </span>
      </div>

      <div className="material-card-body">
        <h4 className="material-title">{material.title}</h4>
        <p className="material-description">{material.description}</p>
      </div>

      <div className="material-card-meta">
        <div className="meta-item">
          <span className="meta-label">{isTamil ? 'பதிவேற்றப்பட்டது' : 'Uploaded'}</span>
          <span className="meta-val">{material.uploadDate}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">{isTamil ? 'அளவு' : 'Size'}</span>
          <span className="meta-val">{material.fileSize}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">{isTamil ? 'பதிவிறக்கங்கள்' : 'Downloads'}</span>
          <span className="meta-val">{material.downloads?.toLocaleString() || '1,000+'}</span>
        </div>
      </div>

      <div className="material-card-actions">
        <button
          type="button"
          onClick={handleView}
          className="btn-material-action btn-material-view"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>{isTamil ? 'பார்வையிட' : 'View'}</span>
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="btn-material-action btn-material-download"
          disabled={downloading}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>{downloading ? (isTamil ? 'பதிவிறக்கப்படுகிறது...' : 'Downloading...') : (isTamil ? 'பதிவிறக்கம்' : 'Download')}</span>
        </button>
      </div>
    </div>
  );
};

