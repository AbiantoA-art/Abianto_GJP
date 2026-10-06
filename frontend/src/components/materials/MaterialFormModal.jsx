import React, { useState, useEffect } from 'react';
import { createAdminMaterial, updateAdminMaterial } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const MaterialFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  material = null, // null for create, object for edit
  categories = [],
}) => {
  const { token } = useAuth();
  const { tCategory, isTamil } = useLanguage();
  const isEdit = Boolean(material && material.id);

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    category_id: '',
    material_type: 'study_material',
    exam_group: '',
    language: 'ENGLISH',
    source_url: '',
    description: '',
    status: 'draft',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (material) {
      setFormData({
        title: material.title || '',
        subject: material.subject || '',
        category_id: material.category_id ? String(material.category_id) : '',
        material_type: material.material_type || 'study_material',
        exam_group: material.exam_group || '',
        language: material.language || 'ENGLISH',
        source_url: material.source_url || '',
        description: material.description || '',
        status: material.status || 'draft',
      });
      setSelectedFile(null);
      setFileError('');
      setErrors({});
      setApiError(null);
    } else {
      setFormData({
        title: '',
        subject: '',
        category_id: categories.length > 0 ? String(categories[0].id) : '',
        material_type: 'study_material',
        exam_group: '',
        language: 'ENGLISH',
        source_url: '',
        description: '',
        status: 'draft',
      });
      setSelectedFile(null);
      setFileError('');
      setErrors({});
      setApiError(null);
    }
  }, [material, categories, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError('');
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowed = ['.pdf', '.doc', '.docx'];

    if (!allowed.includes(ext)) {
      setFileError(
        isTamil
          ? 'தவறான கோப்பு வகை. PDF (.pdf), Word (.doc), மற்றும் Word (.docx) கோப்புகள் மட்டுமே ஏற்கப்படும்.'
          : 'Invalid file type. Only PDF (.pdf), Word (.doc), and Word (.docx) are accepted.'
      );
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError(
        isTamil
          ? 'கோப்பின் அளவு அனுமதிக்கப்பட்ட அதிகபட்ச 10 MB வரம்பை விட அதிகமாக உள்ளது.'
          : 'File size exceeds maximum allowed 10 MB limit.'
      );
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = isTamil ? 'தலைப்பு தேவை (குறைந்தது 3 எழுத்துகள்).' : 'Title is required (minimum 3 characters).';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = isTamil ? 'தலைப்பு குறைந்தது 3 எழுத்துகளாக இருக்க வேண்டும்.' : 'Title must be at least 3 characters.';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = isTamil ? 'பாடப் பெயர் தேவை.' : 'Subject name is required.';
    }

    if (!formData.category_id) {
      newErrors.category_id = isTamil ? 'பணி வகையைத் தேர்ந்தெடுக்கவும்.' : 'Please select a category.';
    }

    if (!isEdit && !selectedFile && !formData.source_url.trim()) {
      newErrors.file = isTamil
        ? 'ஆவணக் கோப்பு அல்லது அதிகாரப்பூர்வ இணைய இணைப்பு தேவை.'
        : 'Either a document file or an official source URL is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && !fileError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isEdit) {
        // Metadata update
        const payload = {
          title: formData.title,
          subject: formData.subject,
          category_id: parseInt(formData.category_id, 10),
          material_type: formData.material_type,
          exam_group: formData.exam_group || null,
          language: formData.language || 'ENGLISH',
          source_url: formData.source_url || null,
          description: formData.description,
        };

        const res = await updateAdminMaterial(material.id, payload, token);
        if (!res.success) {
          setApiError(res.message || (isTamil ? 'வளத் தகவலைப் புதுப்பிப்பதில் தோல்வி.' : 'Failed to update study material.'));
        } else {
          onSuccess(res.data);
          onClose();
        }
      } else {
        // Create with file upload or external URL
        const data = new FormData();
        data.append('title', formData.title);
        data.append('subject', formData.subject);
        data.append('category_id', formData.category_id);
        data.append('material_type', formData.material_type);
        data.append('exam_group', formData.exam_group || '');
        data.append('language', formData.language || 'ENGLISH');
        data.append('source_url', formData.source_url || '');
        data.append('is_official', '1');
        data.append('description', formData.description || '');
        data.append('status', formData.status);
        if (selectedFile) {
          data.append('file', selectedFile);
        }

        const res = await createAdminMaterial(data, token);
        if (!res.success) {
          setApiError(res.message || (isTamil ? 'வளத்தைப் பதிவேற்றுவதில் தோல்வி.' : 'Failed to upload study material.'));
        } else {
          onSuccess(res.data);
          onClose();
        }
      }
    } catch (err) {
      setApiError(err.message || (isTamil ? 'எதிர்பாராத பிழை ஏற்பட்டது.' : 'An error occurred during submission.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gov-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="gov-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="gov-modal-header">
          <div className="modal-header-title-box">
            <span className="modal-badge-tag">{isTamil ? 'நிர்வாக நடவடிக்கை' : 'Admin Action'}</span>
            <h3 className="modal-title">
              {isEdit
                ? (isTamil ? 'வளத் தகவலைத் திருத்துக' : 'Edit Study Material / Syllabus')
                : (isTamil ? 'படிப்பு வளம் / பாடத்திட்டத்தைப் பதிவேற்றுக' : 'Upload Study Material / Syllabus')}
            </h3>
          </div>
          <button type="button" className="gov-modal-close" onClick={onClose} title={isTamil ? 'மூடு' : 'Close'}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="gov-modal-form">
          {apiError && (
            <div className="gov-alert-error" role="alert">
              {apiError}
            </div>
          )}

          {/* Title */}
          <div className="form-group">
            <label htmlFor="material-title" className="gov-form-label">
              {isTamil ? 'வளத்தின் தலைப்பு' : 'Material Title'} <span className="req">*</span>
            </label>
            <input
              type="text"
              id="material-title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder={isTamil ? 'எ.கா. UPSC பொதுப் படிப்புகள் தாள் I பாடத்திட்டம்' : 'e.g. UPSC General Studies Paper I Syllabus'}
              className={`gov-form-input ${errors.title ? 'input-error' : ''}`}
            />
            {errors.title && <span className="field-error-msg">{errors.title}</span>}
          </div>

          {/* Subject & Category Row */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="material-subject" className="gov-form-label">
                {isTamil ? 'பாடம்' : 'Subject'} <span className="req">*</span>
              </label>
              <input
                type="text"
                id="material-subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder={isTamil ? 'எ.கா. இந்திய அரசியலமைப்பு, கணிதத் திறன்' : 'e.g. Indian Polity, Quantitative Aptitude'}
                className={`gov-form-input ${errors.subject ? 'input-error' : ''}`}
              />
              {errors.subject && <span className="field-error-msg">{errors.subject}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="material-category" className="gov-form-label">
                {isTamil ? 'பணி வகை' : 'Category'} <span className="req">*</span>
              </label>
              <select
                id="material-category"
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className={`gov-form-select ${errors.category_id ? 'input-error' : ''}`}
              >
                <option value="">{isTamil ? 'வகையைத் தேர்ந்தெடுக்கவும்' : 'Select Category'}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {tCategory(cat.name)}
                  </option>
                ))}
              </select>
              {errors.category_id && <span className="field-error-msg">{errors.category_id}</span>}
            </div>
          </div>

          {/* Type & Exam Group Row */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="material-type" className="gov-form-label">
                {isTamil ? 'வள வகை' : 'Material Type'} <span className="req">*</span>
              </label>
              <select
                id="material-type"
                name="material_type"
                value={formData.material_type}
                onChange={handleInputChange}
                className="gov-form-select"
              >
                <option value="study_material">{isTamil ? 'படிப்புப் பொருள் (Study Material)' : 'Study Material'}</option>
                <option value="syllabus">{isTamil ? 'அதிகாரப்பூர்வ பாடத்திட்டம் (Syllabus)' : 'Official Syllabus'}</option>
                <option value="exam_pattern">{isTamil ? 'தேர்வு முறை (Exam Pattern)' : 'Exam Pattern'}</option>
                <option value="question_paper">{isTamil ? 'முந்தைய ஆண்டு வினாத்தாள் (Question Paper)' : 'Question Paper'}</option>
                <option value="notification">{isTamil ? 'அறிவிக்கை (Notification)' : 'Notification'}</option>
                <option value="answer_key">{isTamil ? 'விடைக்குறிப்பு (Answer Key)' : 'Answer Key'}</option>
                <option value="current_affairs">{isTamil ? 'நடப்பு நிகழ்வுகள் (Current Affairs)' : 'Current Affairs'}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="material-exam-group" className="gov-form-label">
                {isTamil ? 'தேர்வு குழு' : 'Exam Group'}
              </label>
              <select
                id="material-exam-group"
                name="exam_group"
                value={formData.exam_group}
                onChange={handleInputChange}
                className="gov-form-select"
              >
                <option value="">{isTamil ? 'பொதுவானது / பிற' : 'None / General'}</option>
                <option value="GROUP_1">Group 1 (தொகுதி 1)</option>
                <option value="GROUP_2">Group 2 (தொகுதி 2 - நேர்முகப் பதவிகள்)</option>
                <option value="GROUP_2A">Group 2A (தொகுதி 2A - நேர்முகத் தேர்விலா பதவிகள்)</option>
                <option value="GROUP_3">Group 3 (தொகுதி 3 / 3A)</option>
                <option value="GROUP_4">Group 4 (தொகுதி 4 & VAO)</option>
              </select>
            </div>
          </div>

          {/* Language & Status Row */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="material-language" className="gov-form-label">
                {isTamil ? 'மொழி' : 'Language'} <span className="req">*</span>
              </label>
              <select
                id="material-language"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                className="gov-form-select"
              >
                <option value="ENGLISH">English (ஆங்கிலம்)</option>
                <option value="TAMIL">தமிழ் (Tamil)</option>
              </select>
            </div>

            {!isEdit ? (
              <div className="form-group">
                <label htmlFor="material-status" className="gov-form-label">
                  {isTamil ? 'தொடக்க நிலை' : 'Initial Status'}
                </label>
                <select
                  id="material-status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="gov-form-select"
                >
                  <option value="draft">{isTamil ? 'வரைவு (தனிப்பட்டது)' : 'Draft (Private)'}</option>
                  <option value="published">{isTamil ? 'வெளியிடப்பட்டது (நேரலை)' : 'Published (Live)'}</option>
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="material-source-url" className="gov-form-label">
                  {isTamil ? 'அதிகாரப்பூர்வ மூல இணைப்பு' : 'Official Source URL'}
                </label>
                <input
                  type="url"
                  id="material-source-url"
                  name="source_url"
                  value={formData.source_url}
                  onChange={handleInputChange}
                  placeholder="https://www.tnpsc.gov.in/..."
                  className="gov-form-input"
                />
              </div>
            )}
          </div>

          {!isEdit && (
            <div className="form-group">
              <label htmlFor="material-source-url" className="gov-form-label">
                {isTamil ? 'அதிகாரப்பூர்வ மூல இணைப்பு (URL)' : 'Official Source URL'}
              </label>
              <input
                type="url"
                id="material-source-url"
                name="source_url"
                value={formData.source_url}
                onChange={handleInputChange}
                placeholder="https://www.tnpsc.gov.in/static_pdf/..."
                className="gov-form-input"
              />
            </div>
          )}

          {/* Description */}
          <div className="form-group">
            <label htmlFor="material-description" className="gov-form-label">
              {isTamil ? 'விளக்கம் / தேர்வு நோக்கம்' : 'Description / Exam Scope'}
            </label>
            <textarea
              id="material-description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              placeholder={
                isTamil
                  ? 'பாடத்திட்டம், தலைப்பு விவரங்கள் அல்லது தயாரிப்புக் குறிப்புகளின் கண்ணோட்டத்தை வழங்கவும்...'
                  : 'Provide an overview of the syllabus, topics, or preparation notes...'
              }
              className="gov-form-textarea"
            />
          </div>

          {/* File Upload (Create Only) */}
          {!isEdit && (
            <div className="form-group">
              <label htmlFor="material-file-upload" className="gov-form-label">
                {isTamil ? 'வளக் கோப்பைப் பதிவேற்றுக (.pdf, .doc, .docx)' : 'Upload Material File (.pdf, .doc, .docx)'} <span className="req">*</span>
              </label>
              <div className="gov-file-dropzone">
                <input
                  type="file"
                  id="material-file-upload"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="file-input-hidden"
                />
                <label htmlFor="material-file-upload" className="file-dropzone-label">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>
                    {selectedFile
                      ? selectedFile.name
                      : isTamil
                      ? 'PDF, DOC, அல்லது DOCX ஆவணத்தைத் தேர்ந்தெடுக்கவும் (அதிகபட்சம் 10 MB)'
                      : 'Select PDF, DOC, or DOCX document (Max 10 MB)'}
                  </span>
                </label>
              </div>
              {selectedFile && (
                <div className="file-selection-info">
                  <span>{isTamil ? 'தேர்ந்தெடுக்கப்பட்டது:' : 'Selected:'} <strong>{selectedFile.name}</strong></span>
                  <span className="file-size-badge">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
              {fileError && <span className="field-error-msg">{fileError}</span>}
              {errors.file && <span className="field-error-msg">{errors.file}</span>}
            </div>
          )}

          {/* Action Buttons */}
          <div className="gov-modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              {isTamil ? 'ரத்துசெய்' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting
                ? isTamil
                  ? 'சேமிக்கப்படுகிறது...'
                  : 'Saving...'
                : isEdit
                ? isTamil
                  ? 'விவரங்களைப் புதுப்பிக்கவும்'
                  : 'Update Details'
                : isTamil
                ? 'வளத்தைப் பதிவேற்றுக'
                : 'Upload Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialFormModal;
