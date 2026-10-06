import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * ApplicationReview Component
 * Displays a comprehensive, structured pre-submission summary of all 7 sections
 * with section-level Edit buttons, document badges, and submission controls.
 */
export const ApplicationReview = ({
  formData,
  job,
  resumeFile,
  photoFile,
  certFile,
  onEditSection,
  onSubmitFinal,
  onSaveDraft,
  submitting = false,
  onBackToEdit,
}) => {
  const { isTamil } = useLanguage();

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getGenderLabel = (g) => {
    switch (g) {
      case 'male':
        return isTamil ? 'ஆண்' : 'Male';
      case 'female':
        return isTamil ? 'பெண்' : 'Female';
      case 'transgender':
        return isTamil ? 'திருநங்கை' : 'Transgender';
      default:
        return isTamil ? 'பிற' : 'Other';
    }
  };

  return (
    <div className="app-review-container">
      {/* Review Banner */}
      <div className="app-review-banner-card gov-card">
        <div className="review-banner-icon-circle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>

        <div className="review-banner-text">
          <h2 className="review-banner-title">
            {isTamil ? 'இறுதி விண்ணப்ப சரிபார்ப்பு' : 'Final Application Review'}
          </h2>
          <p className="review-banner-desc">
            {isTamil
              ? 'உங்கள் விண்ணப்பத்தை அதிகாரப்பூர்வமாக சமர்ப்பிக்கும் முன் உள்ளிட்ட அனைத்து விவரங்களையும் கவனமாக சரிபார்க்கவும். ஏதேனும் மாற்றங்கள் செய்ய "திருத்து" பொத்தானைப் பயன்படுத்தவும்.'
              : 'Please carefully verify all details below before official submission. Use the "Edit" buttons on any section to make corrections.'}
          </p>
        </div>

        <button
          type="button"
          className="btn-review-back-edit"
          onClick={onBackToEdit}
        >
          <span>← {isTamil ? 'படிவத்திற்குத் திரும்பு' : 'Back to Form'}</span>
        </button>
      </div>

      {/* Grid of Section Reviews */}
      <div className="app-review-grid">
        {/* 1. Personal Details */}
        <div className="gov-card review-section-card">
          <div className="review-section-header">
            <div className="review-header-left">
              <span className="review-num-badge">01</span>
              <h3 className="review-card-title">{isTamil ? 'தனிப்பட்ட விவரங்கள்' : 'Personal Details'}</h3>
            </div>
            <div className="review-header-right">
              <span className="review-status-pill status-complete">✓ {isTamil ? 'சரிபார்க்கப்பட்டது' : 'Complete'}</span>
              <button
                type="button"
                className="btn-review-edit"
                onClick={() => onEditSection(1)}
                title={isTamil ? 'தனிப்பட்ட விவரங்களைத் திருத்தவும்' : 'Edit Personal Details'}
              >
                {isTamil ? 'திருத்து' : 'Edit'}
              </button>
            </div>
          </div>
          <div className="review-details-table">
            <div className="review-detail-row">
              <span className="detail-key">{isTamil ? 'முழுப் பெயர்:' : 'Full Name:'}</span>
              <span className="detail-val highlight-val">{formData.full_name || '—'}</span>
            </div>
            <div className="review-detail-row">
              <span className="detail-key">{isTamil ? 'பிறந்த தேதி:' : 'Date of Birth:'}</span>
              <span className="detail-val">{formData.date_of_birth || '—'}</span>
            </div>
            <div className="review-detail-row">
              <span className="detail-key">{isTamil ? 'பாலினம்:' : 'Gender:'}</span>
              <span className="detail-val">{getGenderLabel(formData.gender)}</span>
            </div>
          </div>
        </div>

        {/* 2. Contact Details */}
        <div className="gov-card review-section-card">
          <div className="review-section-header">
            <div className="review-header-left">
              <span className="review-num-badge">02</span>
              <h3 className="review-card-title">{isTamil ? 'தொடர்பு விவரங்கள்' : 'Contact Details'}</h3>
            </div>
            <div className="review-header-right">
              <span className="review-status-pill status-complete">✓ {isTamil ? 'சரிபார்க்கப்பட்டது' : 'Complete'}</span>
              <button
                type="button"
                className="btn-review-edit"
                onClick={() => onEditSection(2)}
                title={isTamil ? 'தொடர்பு விவரங்களைத் திருத்தவும்' : 'Edit Contact Details'}
              >
                {isTamil ? 'திருத்து' : 'Edit'}
              </button>
            </div>
          </div>
          <div className="review-details-table">
            <div className="review-detail-row">
              <span className="detail-key">{isTamil ? 'மின்னஞ்சல் முகவரி:' : 'Email Address:'}</span>
              <span className="detail-val">{formData.email || '—'}</span>
            </div>
            <div className="review-detail-row">
              <span className="detail-key">{isTamil ? 'கைபேசி எண்:' : 'Mobile Number:'}</span>
              <span className="detail-val">{formData.mobile_number || '—'}</span>
            </div>
          </div>
        </div>

        {/* 3. Residential Address */}
        <div className="gov-card review-section-card">
          <div className="review-section-header">
            <div className="review-header-left">
              <span className="review-num-badge">03</span>
              <h3 className="review-card-title">{isTamil ? 'குடியிருப்பு முகவரி' : 'Residential Address'}</h3>
            </div>
            <div className="review-header-right">
              <span className="review-status-pill status-complete">✓ {isTamil ? 'சரிபார்க்கப்பட்டது' : 'Complete'}</span>
              <button
                type="button"
                className="btn-review-edit"
                onClick={() => onEditSection(3)}
                title={isTamil ? 'முகவரியைத் திருத்தவும்' : 'Edit Address'}
              >
                {isTamil ? 'திருத்து' : 'Edit'}
              </button>
            </div>
          </div>
          <div className="review-details-table">
            <div className="review-detail-row">
              <span className="detail-key">{isTamil ? 'முகவரி:' : 'Street / Door:'}</span>
              <span className="detail-val">{formData.address_line || '—'}</span>
            </div>
            <div className="review-detail-row">
              <span className="detail-key">{isTamil ? 'நகரம் & மாவட்டம்:' : 'City & District:'}</span>
              <span className="detail-val">{formData.city}, {formData.district}</span>
            </div>
            <div className="review-detail-row">
              <span className="detail-key">{isTamil ? 'மாநிலம் & பின்கோடு:' : 'State & PIN:'}</span>
              <span className="detail-val">{formData.state} - {formData.pincode}</span>
            </div>
          </div>
        </div>

        {/* 4. Educational Qualifications */}
        <div className="gov-card review-section-card">
          <div className="review-section-header">
            <div className="review-header-left">
              <span className="review-num-badge">04</span>
              <h3 className="review-card-title">{isTamil ? 'கல்வித் தகுதிகள்' : 'Educational Qualifications'}</h3>
            </div>
            <div className="review-header-right">
              <span className="review-status-pill status-complete">✓ {isTamil ? 'சரிபார்க்கப்பட்டது' : 'Complete'}</span>
              <button
                type="button"
                className="btn-review-edit"
                onClick={() => onEditSection(4)}
                title={isTamil ? 'கல்வி விவரங்களைத் திருத்தவும்' : 'Edit Education'}
              >
                {isTamil ? 'திருத்து' : 'Edit'}
              </button>
            </div>
          </div>
          <div className="review-details-table">
            <div className="review-detail-row">
              <span className="detail-key">{isTamil ? 'உயர்கல்வித் தகுதி:' : 'Qualification:'}</span>
              <span className="detail-val">{formData.highest_qualification}</span>
            </div>
            {formData.qualification_details && (
              <div className="review-detail-row">
                <span className="detail-key">{isTamil ? 'பாடப்பிரிவு:' : 'Specialization:'}</span>
                <span className="detail-val">{formData.qualification_details}</span>
              </div>
            )}
            <div className="review-detail-row">
              <span className="detail-key">{isTamil ? 'பல்கலைக்கழகம் / வாரியம்:' : 'University / Board:'}</span>
              <span className="detail-val">{formData.university_or_board || '—'}</span>
            </div>
            <div className="review-detail-row">
              <span className="detail-key">{isTamil ? 'தேர்ச்சி ஆண்டு & மதிப்பெண்:' : 'Year & Score:'}</span>
              <span className="detail-val">{formData.passing_year} ({formData.percentage_or_cgpa})</span>
            </div>
          </div>
        </div>

        {/* 5. Work Experience */}
        <div className="gov-card review-section-card">
          <div className="review-section-header">
            <div className="review-header-left">
              <span className="review-num-badge">05</span>
              <h3 className="review-card-title">{isTamil ? 'பணி அனுபவம்' : 'Work Experience'}</h3>
            </div>
            <div className="review-header-right">
              <span className="review-status-pill status-complete">✓ {isTamil ? 'சரிபார்க்கப்பட்டது' : 'Complete'}</span>
              <button
                type="button"
                className="btn-review-edit"
                onClick={() => onEditSection(5)}
                title={isTamil ? 'அனுபவ விவரங்களைத் திருத்தவும்' : 'Edit Experience'}
              >
                {isTamil ? 'திருத்து' : 'Edit'}
              </button>
            </div>
          </div>
          <div className="review-details-table">
            <div className="review-detail-row">
              <span className="detail-key">{isTamil ? 'அனுபவ நிலை:' : 'Experience Status:'}</span>
              <span className="detail-val">
                {formData.experience_status === 'fresher'
                  ? (isTamil ? 'புதியவர் (முந்தைய அனுபவம் இல்லை)' : 'Fresher (No prior experience)')
                  : (isTamil ? 'பணி அனுபவம் உள்ளவர்' : 'Experienced')}
              </span>
            </div>
            {formData.experience_status === 'experienced' && formData.experience_details && (
              <div className="review-detail-row">
                <span className="detail-key">{isTamil ? 'விவரம்:' : 'Experience Details:'}</span>
                <span className="detail-val">{formData.experience_details}</span>
              </div>
            )}
          </div>
        </div>

        {/* 6. Uploaded Documents */}
        <div className="gov-card review-section-card">
          <div className="review-section-header">
            <div className="review-header-left">
              <span className="review-num-badge">06</span>
              <h3 className="review-card-title">{isTamil ? 'பதிவேற்றிய ஆவணங்கள்' : 'Uploaded Documents'}</h3>
            </div>
            <div className="review-header-right">
              <span className="review-status-pill status-complete">✓ {isTamil ? 'சரிபார்க்கப்பட்டது' : 'Complete'}</span>
              <button
                type="button"
                className="btn-review-edit"
                onClick={() => onEditSection(6)}
                title={isTamil ? 'ஆவணங்களைத் திருத்தவும்' : 'Edit Documents'}
              >
                {isTamil ? 'திருத்து' : 'Edit'}
              </button>
            </div>
          </div>
          <div className="review-details-table">
            <div className="review-detail-row">
              <span className="detail-key">{isTamil ? 'பயோடேட்டா (Resume):' : 'Resume / CV:'}</span>
              <span className="detail-val">
                {resumeFile ? (
                  <span className="file-chip">
                    📄 {resumeFile.name} ({formatFileSize(resumeFile.size)})
                  </span>
                ) : (
                  <span className="missing-file-warning">{isTamil ? 'தேவைப்படுகிறது' : 'Required'}</span>
                )}
              </span>
            </div>
            <div className="review-detail-row">
              <span className="detail-key">{isTamil ? 'புகைப்படம் (Photograph):' : 'Photograph:'}</span>
              <span className="detail-val">
                {photoFile ? (
                  <span className="file-chip">
                    🖼️ {photoFile.name} ({formatFileSize(photoFile.size)})
                  </span>
                ) : (
                  <span className="missing-file-warning">{isTamil ? 'தேவைப்படுகிறது' : 'Required'}</span>
                )}
              </span>
            </div>
            {certFile && (
              <div className="review-detail-row">
                <span className="detail-key">{isTamil ? 'கூடுதல் சான்றிதழ்:' : 'Certificate:'}</span>
                <span className="detail-val">
                  <span className="file-chip">
                    📜 {certFile.name} ({formatFileSize(certFile.size)})
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 7. Declaration */}
        <div className="gov-card review-section-card review-section-full">
          <div className="review-section-header">
            <div className="review-header-left">
              <span className="review-num-badge">07</span>
              <h3 className="review-card-title">{isTamil ? 'வேட்பாளர் உறுதிமொழி' : 'Candidate Declaration'}</h3>
            </div>
            <div className="review-header-right">
              <span className="review-status-pill status-complete">✓ {isTamil ? 'ஏற்கப்பட்டது' : 'Accepted'}</span>
            </div>
          </div>
          <div className="review-declaration-box">
            <p className="declaration-text">
              {isTamil
                ? '“இந்த விண்ணப்பத்தில் கொடுக்கப்பட்டுள்ள அனைத்து தகவல்களும் எனக்குத் தெரிந்தவரை உண்மையானவை மற்றும் சரியானவை என்று உறுதியளிக்கிறேன். ஏதேனும் தகவல் தவறானது என்று கண்டறியப்பட்டால் எனது விண்ணப்பம் எந்த நிலையிலும் தகுதி நீக்கம் செய்யப்படும் என்பதை நான் ஒப்புக்கொள்கிறேன்.”'
                : '“I hereby declare that all information provided in this application is true, complete, and correct to the best of my knowledge and belief. I understand that any false statement or misrepresentation will result in disqualification of my candidature at any stage.”'}
            </p>
            <div className="declaration-verified-badge">
              ✓ {isTamil ? 'வேட்பாளரால் உறுதிமொழி ஏற்கப்பட்டு மின்னணு முறையில் சரிபார்க்கப்பட்டது.' : 'Declaration confirmed and electronically acknowledged by candidate.'}
            </div>
          </div>
        </div>
      </div>

      {/* Submission Final Callout Card */}
      <div className="gov-card app-final-submit-card">
        <div className="final-submit-header">
          <div className="submit-seal-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div>
            <h3 className="final-submit-title">
              {isTamil ? 'விண்ணப்பத்தை சமர்ப்பிக்கத் தயாரா?' : 'Ready to Submit Your Application?'}
            </h3>
            <p className="final-submit-desc">
              {isTamil
                ? 'சமர்ப்பித்த பிறகு விண்ணப்ப எண் உருவாக்கப்படும். விவரங்களை மாற்ற முடியாது. உறுதிசெய்து இறுதி விண்ணப்பத்தை சமர்ப்பிக்கவும்.'
                : 'An official application ID will be generated upon submission. Please confirm all details are final.'}
            </p>
          </div>
        </div>

        <div className="final-submit-actions">
          <button
            type="button"
            className="btn-review-back"
            onClick={onBackToEdit}
            disabled={submitting}
          >
            ← {isTamil ? 'திருத்த பின்செல்லவும்' : 'Back to Edit'}
          </button>

          <button
            type="button"
            className="btn-save-draft"
            onClick={onSaveDraft}
            disabled={submitting}
          >
            💾 {isTamil ? 'வரைவாகச் சேமி' : 'Save Draft'}
          </button>

          <button
            type="button"
            className="btn-submit-final"
            onClick={onSubmitFinal}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-submit-sm" aria-hidden="true" />
                <span>{isTamil ? 'சமர்ப்பிக்கப்படுகிறது...' : 'Submitting Application...'}</span>
              </>
            ) : (
              <>
                <span>{isTamil ? 'இறுதி விண்ணப்பத்தை சமர்ப்பிக்கவும்' : 'Submit Official Application'}</span>
                <span className="btn-arrow" aria-hidden="true">✓</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationReview;
