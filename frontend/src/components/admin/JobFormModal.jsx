import React, { useState, useEffect } from 'react';
import { createAdminJob, updateAdminJob } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const DEFAULT_FORM_DATA = {
  job_code: '',
  title: '',
  organization: '',
  department: '',
  category_id: '',
  job_group: '',
  description: '',
  vacancies: '',
  qualification: '',
  age_limit: '',
  salary: '',
  location: '',
  experience: '',
  application_fee: '',
  opening_date: '',
  last_date: '',
  selection_process: '',
  required_documents: '',
  notification_url: '',
  apply_url: '',
  status: 'draft',
};

export const JobFormModal = ({ isOpen, onClose, onSuccess, initialJob = null, categories = [] }) => {
  const { token } = useAuth();
  const { language, t, tCategory } = useLanguage();
  const isTa = language === 'ta';
  const isEditing = !!initialJob;

  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialJob) {
      setFormData({
        job_code: initialJob.job_code || '',
        title: initialJob.title || '',
        organization: initialJob.organization || '',
        department: initialJob.department || '',
        category_id: initialJob.category_id || (categories.length > 0 ? categories[0].id : ''),
        job_group: initialJob.job_group || '',
        description: initialJob.description || '',
        vacancies: initialJob.vacancies !== undefined ? String(initialJob.vacancies) : '',
        qualification: initialJob.qualification || '',
        age_limit: initialJob.age_limit || '',
        salary: initialJob.salary || '',
        location: initialJob.location || '',
        experience: initialJob.experience || '',
        application_fee: initialJob.application_fee || '',
        opening_date: initialJob.opening_date || '',
        last_date: initialJob.last_date || '',
        selection_process: initialJob.selection_process || '',
        required_documents: initialJob.required_documents || '',
        notification_url: initialJob.notification_url || '',
        apply_url: initialJob.apply_url || '',
        status: initialJob.status || 'draft',
      });
    } else {
      setFormData({
        ...DEFAULT_FORM_DATA,
        category_id: categories.length > 0 ? categories[0].id : '',
        job_group: '',
      });
    }
    setErrorMessage('');
    setFieldErrors({});
  }, [initialJob, categories, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.job_code.trim()) errors.job_code = isTa ? 'பணி குறியீடு தேவை.' : 'Job code is required.';
    if (!formData.title.trim()) errors.title = isTa ? 'பணி பெயர் தேவை.' : 'Job title is required.';
    if (!formData.organization.trim()) errors.organization = isTa ? 'நிறுவனம் தேவை.' : 'Organization is required.';
    if (!formData.category_id) errors.category_id = isTa ? 'வகை தேவை.' : 'Category is required.';
    if (!formData.description.trim()) errors.description = isTa ? 'விளக்கம் தேவை.' : 'Description is required.';
    
    const vac = parseInt(formData.vacancies, 10);
    if (isNaN(vac) || vac <= 0) {
      errors.vacancies = isTa ? 'காலிப்பணியிடங்கள் 0-ஐ விட அதிகமான எண்ணாக இருக்க வேண்டும்.' : 'Vacancies must be a number greater than 0.';
    }

    if (formData.opening_date && formData.last_date) {
      const openD = new Date(formData.opening_date);
      const lastD = new Date(formData.last_date);
      if (lastD < openD) {
        errors.last_date = isTa ? 'கடைசி தேதி தொடக்க தேதியை விட முந்தையதாக இருக்க முடியாது.' : 'Last date cannot be earlier than opening date.';
      }
    }

    if (formData.notification_url && !/^https?:\/\//i.test(formData.notification_url.trim())) {
      errors.notification_url = isTa ? 'அறிவிப்பு முகவரி http:// அல்லது https:// உடன் தொடங்க வேண்டும்.' : 'URL must begin with http:// or https://';
    }

    if (formData.apply_url && !/^https?:\/\//i.test(formData.apply_url.trim())) {
      errors.apply_url = isTa ? 'விண்ணப்ப முகவரி http:// அல்லது https:// உடன் தொடங்க வேண்டும்.' : 'URL must begin with http:// or https://';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (overrideStatus = null) => {
    setErrorMessage('');
    if (!validate()) {
      setErrorMessage(isTa ? 'சேமிப்பதற்கு முன் சிறப்பித்துக் காட்டப்பட்டுள்ள பிழைகளைச் சரிசெய்யவும்.' : 'Please fix the highlighted errors before saving.');
      return;
    }

    setSubmitting(true);
    const payload = {
      ...formData,
      job_group: formData.job_group ? formData.job_group : null,
      vacancies: parseInt(formData.vacancies, 10),
      status: overrideStatus || formData.status,
    };

    try {
      let result;
      if (isEditing) {
        result = await updateAdminJob(initialJob.id, payload, token);
      } else {
        result = await createAdminJob(payload, token);
      }

      if (!result.success) {
        setErrorMessage(result.message || (isTa ? 'பணி அறிவிப்பைச் சேமிப்பதில் பிழை ஏற்பட்டது.' : 'Error saving job notification.'));
        setSubmitting(false);
        return;
      }

      onSuccess(result.data, isEditing ? 'updated' : 'created');
      onClose();
    } catch (err) {
      setErrorMessage(err.message || (isTa ? 'சேமிப்பதில் நெட்வொர்க் பிழை.' : 'Network error during save.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-container admin-modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="admin-modal-header">
          <div>
            <span className="modal-category-tag">{isTa ? 'அதிகாரப்பூர்வ ஆட்சேர்ப்பு அறிவிப்பு' : 'Official Recruitment Notification'}</span>
            <h2 className="admin-modal-title">
              {isEditing
                ? (isTa ? `பணி அறிவிப்பைத் திருத்து — ${initialJob.job_code}` : `Edit Job Notification — ${initialJob.job_code}`)
                : (isTa ? 'புதிய அதிகாரப்பூர்வ அரசுப் பணியை வெளியிடு' : 'Publish New Official Government Job')}
            </h2>
            <p className="admin-modal-subtitle">
              {isEditing
                ? (isTa ? 'துறை காலிப்பணியிட விவரங்கள், தகுதி வரம்புகள் மற்றும் விண்ணப்ப காலக்கெடுவை மாற்றவும்.' : 'Modify vacancy details, eligibility criteria, and application deadlines.')
                : (isTa ? 'நிர்வாக ஒப்புதல் மற்றும் வெளியீட்டிற்காக அனைத்து அதிகாரப்பூர்வ பணி விவரங்களையும் உள்ளிடவும்.' : 'Enter all official job details for administration approval and publication.')}
            </p>
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label={isTa ? 'மூடு' : 'Close'}>
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="admin-modal-body">
          {errorMessage && (
            <div className="admin-form-alert admin-form-alert-danger">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            {/* Section 1: Basic Job Information */}
            <div className="form-section-box">
              <h3 className="form-section-title">
                <span className="form-section-number">1</span>
                {isTa ? 'அடிப்படை பணி விவரங்கள்' : 'Basic Job Information'}
              </h3>
              <div className="form-grid-two">
                <div className="form-field-group">
                  <label className="form-label" htmlFor="job_code">
                    {isTa ? 'பணி குறியீடு / அறிவிப்பு எண்' : 'Job Code / Notification No.'} <span className="req-star">*</span>
                  </label>
                  <input
                    id="job_code"
                    name="job_code"
                    type="text"
                    className={`form-input ${fieldErrors.job_code ? 'input-error' : ''}`}
                    placeholder="e.g. UPSC-CSE-2026-01"
                    value={formData.job_code}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.job_code && <span className="field-error-text">{fieldErrors.job_code}</span>}
                  <span className="field-helper">{isTa ? 'இந்த ஆட்சேர்ப்புக்கான தனித்துவமான அதிகாரப்பூர்வ குறிப்பு எண்' : 'Unique official identifier for this vacancy'}</span>
                </div>

                <div className="form-field-group">
                  <label className="form-label" htmlFor="category_id">
                    {isTa ? 'ஆட்சேர்ப்பு வகை' : 'Recruitment Category'} <span className="req-star">*</span>
                  </label>
                  <select
                    id="category_id"
                    name="category_id"
                    className={`form-select ${fieldErrors.category_id ? 'input-error' : ''}`}
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {tCategory(cat.name)}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.category_id && <span className="field-error-text">{fieldErrors.category_id}</span>}
                </div>
              </div>

              <div className="form-field-group">
                <label className="form-label" htmlFor="title">
                  {isTa ? 'அதிகாரப்பூர்வ பணி பெயர்' : 'Official Job Title'} <span className="req-star">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  className={`form-input ${fieldErrors.title ? 'input-error' : ''}`}
                  placeholder={isTa ? 'எ.கா. குடிமைப் பணிகள் தேர்வு 2026 (IAS / IPS / IFS)' : 'e.g. Civil Services Examination 2026 (IAS / IPS / IFS)'}
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.title && <span className="field-error-text">{fieldErrors.title}</span>}
              </div>

              <div className="form-grid-two">
                <div className="form-field-group">
                  <label className="form-label" htmlFor="organization">
                    {isTa ? 'நிறுவனம் / ஆணையம்' : 'Organization / Commission'} <span className="req-star">*</span>
                  </label>
                  <input
                    id="organization"
                    name="organization"
                    type="text"
                    className={`form-input ${fieldErrors.organization ? 'input-error' : ''}`}
                    placeholder={isTa ? 'எ.கா. மத்திய அரசு பணியாளர் தேர்வாணையம்' : 'e.g. Union Public Service Commission'}
                    value={formData.organization}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.organization && <span className="field-error-text">{fieldErrors.organization}</span>}
                </div>

                <div className="form-field-group">
                  <label className="form-label" htmlFor="department">
                    {isTa ? 'துறை / அமைச்சகம்' : 'Department / Ministry'}
                  </label>
                  <input
                    id="department"
                    name="department"
                    type="text"
                    className="form-input"
                    placeholder={isTa ? 'எ.கா. பணியாளர் மற்றும் பயிற்சித் துறை' : 'e.g. Department of Personnel and Training'}
                    value={formData.department}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-label" htmlFor="job_group">
                    {isTa ? 'பணி குழு' : 'Job Group'}
                  </label>
                  <select
                    id="job_group"
                    name="job_group"
                    className="form-select"
                    value={formData.job_group}
                    onChange={handleChange}
                  >
                    <option value="">{isTa ? 'எதுவுமில்லை' : 'None'}</option>
                    <option value="GROUP_1">{isTa ? 'குழு 1' : 'Group 1'}</option>
                    <option value="GROUP_2">{isTa ? 'குழு 2' : 'Group 2'}</option>
                    <option value="GROUP_2A">{isTa ? 'குழு 2A' : 'Group 2A'}</option>
                    <option value="GROUP_3">{isTa ? 'குழு 3' : 'Group 3'}</option>
                    <option value="GROUP_4">{isTa ? 'குழு 4' : 'Group 4'}</option>
                  </select>
                  <span className="field-helper">{isTa ? 'அரசு தேர்வு குழு வகைப்பாடு (பொருந்தினால்)' : 'Exam group classification (if applicable)'}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Job Details */}
            <div className="form-section-box">
              <h3 className="form-section-title">
                <span className="form-section-number">2</span>
                {isTa ? 'பணி விவரங்கள் & தகுதி வரம்புகள்' : 'Job Details & Eligibility Criteria'}
              </h3>
              
              <div className="form-field-group">
                <label className="form-label" htmlFor="description">
                  {isTa ? 'பணி விளக்கம் & எல்லை' : 'Job Description & Scope'} <span className="req-star">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className={`form-textarea ${fieldErrors.description ? 'input-error' : ''}`}
                  placeholder={isTa ? 'முழுமையான அறிவிப்பு விவரங்கள், சேவை நிபந்தனைகள், பணிகள் மற்றும் வழிகாட்டுதல்கள்...' : 'Complete notification details, terms of service, responsibilities, and guidelines...'}
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.description && <span className="field-error-text">{fieldErrors.description}</span>}
              </div>

              <div className="form-grid-three">
                <div className="form-field-group">
                  <label className="form-label" htmlFor="vacancies">
                    {t('jobs.vacancies')} <span className="req-star">*</span>
                  </label>
                  <input
                    id="vacancies"
                    name="vacancies"
                    type="number"
                    min="1"
                    className={`form-input ${fieldErrors.vacancies ? 'input-error' : ''}`}
                    placeholder="e.g. 1056"
                    value={formData.vacancies}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.vacancies && <span className="field-error-text">{fieldErrors.vacancies}</span>}
                </div>

                <div className="form-field-group">
                  <label className="form-label" htmlFor="age_limit">
                    {t('jobs.ageLimit')}
                  </label>
                  <input
                    id="age_limit"
                    name="age_limit"
                    type="text"
                    className="form-input"
                    placeholder={isTa ? 'எ.கா. 21 முதல் 32 வரை' : 'e.g. 21 to 32 years'}
                    value={formData.age_limit}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-label" htmlFor="salary">
                    {t('jobs.salary')}
                  </label>
                  <input
                    id="salary"
                    name="salary"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Level 10 (₹56,100 - ₹1,77,500)"
                    value={formData.salary}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-grid-three">
                <div className="form-field-group">
                  <label className="form-label" htmlFor="qualification">
                    {t('jobs.qualification')}
                  </label>
                  <input
                    id="qualification"
                    name="qualification"
                    type="text"
                    className="form-input"
                    placeholder={isTa ? 'எ.கா. ஏதேனும் ஒரு பட்டப்படிப்பு' : 'e.g. Any Bachelor Degree'}
                    value={formData.qualification}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-label" htmlFor="location">
                    {t('jobs.location')}
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    className="form-input"
                    placeholder={isTa ? 'எ.கா. இந்தியா முழுவதும் / சென்னை' : 'e.g. All India / Chennai'}
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-label" htmlFor="experience">
                    {t('jobs.experience')}
                  </label>
                  <input
                    id="experience"
                    name="experience"
                    type="text"
                    className="form-input"
                    placeholder={isTa ? 'எ.கா. புதியவர் / முன் அனுபவம் தேவையில்லை' : 'e.g. Fresher / No prior experience'}
                    value={formData.experience}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Application Information */}
            <div className="form-section-box">
              <h3 className="form-section-title">
                <span className="form-section-number">3</span>
                {isTa ? 'விண்ணப்ப கால அட்டவணை & தேர்வு முறை' : 'Application Schedule & Selection Method'}
              </h3>

              <div className="form-grid-three">
                <div className="form-field-group">
                  <label className="form-label" htmlFor="opening_date">
                    {isTa ? 'தொடக்க தேதி' : 'Opening Date'}
                  </label>
                  <input
                    id="opening_date"
                    name="opening_date"
                    type="date"
                    className="form-input"
                    value={formData.opening_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-label" htmlFor="last_date">
                    {t('jobs.lastDate')}
                  </label>
                  <input
                    id="last_date"
                    name="last_date"
                    type="date"
                    className={`form-input ${fieldErrors.last_date ? 'input-error' : ''}`}
                    value={formData.last_date}
                    onChange={handleChange}
                  />
                  {fieldErrors.last_date && <span className="field-error-text">{fieldErrors.last_date}</span>}
                </div>

                <div className="form-field-group">
                  <label className="form-label" htmlFor="application_fee">
                    {t('jobs.applicationFee')}
                  </label>
                  <input
                    id="application_fee"
                    name="application_fee"
                    type="text"
                    className="form-input"
                    placeholder={isTa ? 'எ.கா. ₹100 (SC/ST/பெண்களுக்கு விலக்கு)' : 'e.g. ₹100 (Exempted for SC/ST/Women)'}
                    value={formData.application_fee}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-grid-two">
                <div className="form-field-group">
                  <label className="form-label" htmlFor="selection_process">
                    {t('jobs.selectionProcess')}
                  </label>
                  <textarea
                    id="selection_process"
                    name="selection_process"
                    rows={2}
                    className="form-textarea"
                    placeholder={isTa ? 'எ.கா. முதல்நிலைத் தேர்வு, முதன்மைத் தேர்வு, ஆளுமைத் தேர்வு / நேர்காணல்' : 'e.g. Preliminary Exam, Main Exam, Personality Test / Interview'}
                    value={formData.selection_process}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-label" htmlFor="required_documents">
                    {t('jobs.requiredDocuments')}
                  </label>
                  <textarea
                    id="required_documents"
                    name="required_documents"
                    rows={2}
                    className="form-textarea"
                    placeholder={isTa ? 'எ.கா. பட்டப்படிப்பு சான்றிதழ், புகைப்பட அடையாள அட்டை, சாதிச் சான்றிதழ், புகைப்படம்' : 'e.g. Degree Certificate, Photo ID Proof, Category Certificate, Photograph'}
                    value={formData.required_documents}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Official Links */}
            <div className="form-section-box">
              <h3 className="form-section-title">
                <span className="form-section-number">4</span>
                {isTa ? 'அதிகாரப்பூர்வ தளங்கள் & அறிவிப்பு இணைப்புகள்' : 'Official Portals & Notification Links'}
              </h3>
              <div className="form-grid-two">
                <div className="form-field-group">
                  <label className="form-label" htmlFor="notification_url">
                    {isTa ? 'அதிகாரப்பூர்வ அறிவிப்பு இணைப்பு (PDF / அரசிதழ்)' : 'Official Notification Link (PDF / Gazette)'}
                  </label>
                  <input
                    id="notification_url"
                    name="notification_url"
                    type="url"
                    className={`form-input ${fieldErrors.notification_url ? 'input-error' : ''}`}
                    placeholder="https://example.gov.in/notification.pdf"
                    value={formData.notification_url}
                    onChange={handleChange}
                  />
                  {fieldErrors.notification_url && (
                    <span className="field-error-text">{fieldErrors.notification_url}</span>
                  )}
                </div>

                <div className="form-field-group">
                  <label className="form-label" htmlFor="apply_url">
                    {isTa ? 'அதிகாரப்பூர்வ ஆன்லைன் விண்ணப்ப இணைப்பு' : 'Official Online Application Link'}
                  </label>
                  <input
                    id="apply_url"
                    name="apply_url"
                    type="url"
                    className={`form-input ${fieldErrors.apply_url ? 'input-error' : ''}`}
                    placeholder="https://example.gov.in/apply-online"
                    value={formData.apply_url}
                    onChange={handleChange}
                  />
                  {fieldErrors.apply_url && (
                    <span className="field-error-text">{fieldErrors.apply_url}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 5: Publication Status */}
            <div className="form-section-box">
              <h3 className="form-section-title">
                <span className="form-section-number">5</span>
                {isTa ? 'வெளியீட்டு நிலை' : 'Publication Status'}
              </h3>
              <div className="form-field-group" style={{ maxWidth: '320px' }}>
                <label className="form-label" htmlFor="status">
                  {isTa ? 'தொடக்க / இலக்கு பணி நிலை' : 'Initial / Target Job Status'}
                </label>
                <select
                  id="status"
                  name="status"
                  className="form-select"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="draft">{isTa ? 'வரைவு (வேட்பாளர்களுக்கு மறைக்கப்பட்டது)' : 'Draft (Hidden from candidates)'}</option>
                  <option value="published">{isTa ? 'வெளியிடப்பட்டது (அனைத்து வேட்பாளர்களுக்கும் தெரியும்)' : 'Published (Visible to all candidates)'}</option>
                  <option value="closed">{isTa ? 'முடிவடைந்தது (விண்ணப்பங்கள் நிறுத்தம்)' : 'Closed (Application intake stopped)'}</option>
                  <option value="expired">{isTa ? 'காலாவதியானது (காலக்கெடு முடிந்தது)' : 'Expired (Deadline passed)'}</option>
                  <option value="archived">{isTa ? 'காப்பகப்படுத்தப்பட்டது (பாதுகாப்பான காப்பகம்)' : 'Archived (Preserved in archives)'}</option>
                </select>
                <span className="field-helper">
                  {formData.status === 'published'
                    ? (isTa ? '✓ பொது வேட்பாளர் பணிப் பட்டியலில் உடனடியாகத் தோன்றும்.' : '✓ Will appear immediately in public catalog.')
                    : (isTa ? 'ℹ வரைவு அல்லது முடிவடைந்த பணிகள் பொது தளங்களிலிருந்து மறைக்கப்பட்டிருக்கும்.' : 'ℹ Draft or closed jobs remain hidden from public.')}
                </span>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="admin-modal-footer">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onClose}
            disabled={submitting}
          >
            {isTa ? 'ரத்து செய்' : 'Cancel'}
          </button>

          {!isEditing && (
            <button
              type="button"
              className="btn-modal-draft"
              onClick={() => handleSubmit('draft')}
              disabled={submitting}
            >
              {submitting ? (isTa ? 'சேமிக்கப்படுகிறது...' : 'Saving...') : (isTa ? 'வரைவாகச் சேமி' : 'Save as Draft')}
            </button>
          )}

          <button
            type="button"
            className="btn-modal-primary"
            onClick={() => handleSubmit(isEditing ? null : 'published')}
            disabled={submitting}
          >
            {submitting ? (
              <span className="btn-spinner-row">
                <span className="inline-spinner" />
                <span>{isTa ? 'சேமிக்கப்படுகிறது...' : 'Saving...'}</span>
              </span>
            ) : isEditing ? (
              (isTa ? 'மாற்றங்களைச் சேமி' : 'Save Changes')
            ) : (
              (isTa ? 'பணியை வெளியிடு' : 'Publish Job')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobFormModal;
