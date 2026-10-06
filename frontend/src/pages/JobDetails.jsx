import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getJob, checkAlreadyApplied } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated, isCandidate } = useAuth();
  const { tCategory, tStatus, tJobGroup, isTamil } = useLanguage();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [is404, setIs404] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [appliedAppId, setAppliedAppId] = useState(null);

  // Eligibility Confirmation Modal state
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [eligibilityConfirmed, setEligibilityConfirmed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchJobDetails = async () => {
      setLoading(true);
      setError(null);
      setIs404(false);

      try {
        const res = await getJob(id);
        if (!isMounted) return;

        if (res.success && res.data) {
          setJob(res.data);
        } else if (res.statusCode === 404) {
          setIs404(true);
          setError(
            isTamil
              ? 'கோரப்பட்ட வேலைவாய்ப்பு அறிவிப்பு கிடைக்கவில்லை அல்லது தற்போது செயலில் இல்லை.'
              : 'Requested job notification not found or currently inactive.'
          );
        } else {
          setError(
            res.message ||
              (isTamil
                ? 'வேலைவாய்ப்பு விவரங்களை ஏற்றுவதில் சிக்கல் ஏற்பட்டுள்ளது.'
                : 'Failed to load job details.')
          );
        }
      } catch {
        if (!isMounted) return;
        setError(
          isTamil
            ? 'வேலைவாய்ப்பு விவரங்களை ஏற்றுவதில் நெட்வொர்க் பிழை ஏற்பட்டுள்ளது.'
            : 'Network error loading job details.'
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) {
      fetchJobDetails();
    }

    if (id && token && isCandidate) {
      checkAlreadyApplied(id, token).then((checkRes) => {
        if (isMounted && checkRes.success && checkRes.applied) {
          setHasApplied(true);
          setAppliedAppId(checkRes.id);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [id, token, isCandidate, isTamil]);

  // Helper to parse selection process or documents
  const parseListItems = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return val
        .split('\n')
        .map((s) => s.replace(/^[-*•\d.]+\s*/, '').trim())
        .filter(Boolean);
    }
    return [String(val)];
  };

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/jobs/${job.id}/apply`);
      return;
    }
    setShowEligibilityModal(true);
  };

  const handleModalContinue = () => {
    setShowEligibilityModal(false);
    navigate(`/jobs/${job.id}/apply`);
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="job-details-page-layout">
        <div className="page-header-strip">
          <div className="section-container">
            <div className="skeleton-line" style={{ width: '180px', height: '16px', marginBottom: '1rem' }} />
            <div className="skeleton-line" style={{ width: '60%', height: '32px', marginBottom: '0.75rem' }} />
            <div className="skeleton-line" style={{ width: '40%', height: '20px' }} />
          </div>
        </div>
        <div className="section-container details-body-container" style={{ padding: '2rem 1rem' }}>
          <div className="gov-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="skeleton-line" style={{ width: '30%', height: '24px' }} />
            <div className="skeleton-grid">
              <div className="skeleton-spec" />
              <div className="skeleton-spec" />
              <div className="skeleton-spec" />
              <div className="skeleton-spec" />
            </div>
            <div className="skeleton-line" style={{ width: '100%', height: '80px' }} />
          </div>
        </div>
      </div>
    );
  }

  // 2. 404 Not Found or Error State
  if (is404 || !job) {
    return (
      <div className="job-details-page-layout">
        <div className="section-container details-body-container" style={{ padding: '4rem 1rem' }}>
          <div className="gov-card details-error-card">
            <div className="state-icon-wrap error-icon-wrap">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="details-error-title">
              {is404
                ? (isTamil ? 'வேலைவாய்ப்பு அறிவிப்பு கிடைக்கவில்லை' : 'Job Notification Not Found')
                : (isTamil ? 'பணியைக் காட்ட இயலவில்லை' : 'Unable to Display Job')}
            </h2>
            <p className="details-error-desc">
              {is404
                ? (isTamil
                    ? 'கோரப்பட்ட வேலைவாய்ப்பு அறிவிப்பு இல்லை அல்லது திரும்பப் பெறப்பட்டு காப்பகப்படுத்தப்பட்டுள்ளது.'
                    : 'The requested job notification does not exist or has been archived.')
                : error || (isTamil ? 'இந்த வேலைவாய்ப்பு அறிவிப்பை ஏற்றும்போது எதிர்பாராத பிழை ஏற்பட்டது.' : 'An unexpected error occurred while loading this job notification.')}
            </p>
            <div className="details-error-actions">
              <Link to="/jobs" className="btn-back-jobs">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>{isTamil ? 'அனைத்து அரசுப் பணிகளையும் காண்க' : 'Back to All Government Jobs'}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const rawCatName = job.category?.name || job.category_name || 'Government Job';
  const categoryDisplayName = tCategory(rawCatName);
  const selectionStages = parseListItems(job.selection_process);
  const requiredDocs = parseListItems(job.required_documents);

  const todayStr = new Date().toISOString().split('T')[0];
  const isDeadlinePassed = Boolean(job.last_date && job.last_date < todayStr);
  const isUpcoming = Boolean(job.opening_date && job.opening_date > todayStr);

  // URL query params for preparation resources linking
  const prepQueryParams = new URLSearchParams();
  if (job.category_id) prepQueryParams.set('category_id', job.category_id);
  if (job.job_group) prepQueryParams.set('exam_group', job.job_group);
  if (job.exam_name) prepQueryParams.set('search', job.exam_name);

  return (
    <div className="job-details-page-layout">
      {/* Top Header Strip */}
      <div className="page-header-strip">
        <div className="section-container">
          <div className="breadcrumb-nav">
            <Link to="/">{isTamil ? 'முகப்பு' : 'Home'}</Link> /{' '}
            <Link to="/jobs">{isTamil ? 'அரசுப் பணிகள்' : 'Government Jobs'}</Link> /{' '}
            <span className="active-crumb">{categoryDisplayName}</span>
          </div>

          <div className="details-header-main">
            <div className="details-header-left">
              <div className="details-badge-row">
                <span className="category-pill">{categoryDisplayName}</span>
                {job.job_group && (
                  <span className="category-pill job-group-pill">{tJobGroup(job.job_group)}</span>
                )}
                {job.job_code && (
                  <span className="job-code-badge" title="Official Job Code">
                    {job.job_code}
                  </span>
                )}
                <span className="status-pill-published">{tStatus(job.status || 'published')}</span>
                <span className="govt-verified-badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {isTamil ? 'சரிபார்க்கப்பட்ட அதிகாரப்பூர்வ அறிவிப்பு' : 'Verified Official Notification'}
                </span>
              </div>

              <h1 className="details-job-title">{job.title}</h1>

              <div className="details-org-row">
                <span className="org-name-highlight">{job.organization}</span>
                {job.recruitment_body && job.recruitment_body !== job.organization && (
                  <>
                    <span className="org-divider">•</span>
                    <span className="dept-name">{job.recruitment_body}</span>
                  </>
                )}
                {job.department && (
                  <>
                    <span className="org-divider">•</span>
                    <span className="dept-name">{job.department}</span>
                  </>
                )}
                {job.exam_name && (
                  <>
                    <span className="org-divider">•</span>
                    <span className="dept-name" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                      {job.exam_name}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="details-header-actions">
              {hasApplied ? (
                <Link
                  to={appliedAppId ? `/applications/${appliedAppId}` : '/my-applications'}
                  className="btn-dash-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                >
                  <span>{isTamil ? '✓ ஏற்கனவே விண்ணப்பிக்கப்பட்டது (காண்க)' : '✓ Already Applied (View)'}</span>
                </Link>
              ) : isDeadlinePassed ? (
                <button
                  type="button"
                  disabled
                  className="btn-nav btn-outline"
                  style={{ opacity: 0.65, cursor: 'not-allowed', color: '#dc2626', borderColor: '#fca5a5' }}
                >
                  {isTamil ? 'விண்ணப்ப காலக்கெடு முடிந்தது' : 'Application Closed'}
                </button>
              ) : isUpcoming ? (
                <button
                  type="button"
                  disabled
                  className="btn-nav btn-outline"
                  style={{ opacity: 0.8, cursor: 'not-allowed' }}
                >
                  {isTamil ? 'வரவிருக்கும் அறிவிப்பு' : 'Upcoming Recruitment'}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleApplyClick}
                    className="btn-apply-primary"
                    id="btn-apply-now"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                    <span>{isTamil ? 'இப்போதே விண்ணப்பிக்கவும் (APPLY NOW)' : 'Apply Now'}</span>
                  </button>

                  {job.apply_url && (
                    <a
                      href={job.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-nav btn-outline"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                    >
                      <span>{isTamil ? 'அதிகாரப்பூர்வ தளத்தில் விண்ணப்பிக்க ↗' : 'Apply on Official Website ↗'}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Details Body */}
      <div className="section-container details-body-container">
        <div className="details-grid-layout">
          {/* Main Column */}
          <div className="details-main-column">
            {/* 1. Preparation Resources Section */}
            <section className="gov-card details-section-card prep-resources-banner-card">
              <div className="prep-resources-header">
                <div className="prep-icon-wrap">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="card-section-title" style={{ borderBottom: 'none', paddingBottom: 0, fontSize: '1.25rem' }}>
                    {isTamil ? 'தேர்வு தயாரிப்பு வளங்கள் (Preparation Resources)' : 'Preparation Resources'}
                  </h2>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    {isTamil
                      ? `${job.title} தேர்வுக்குத் தேவையான அதிகாரப்பூர்வ பாடத்திட்டம், மாதிரி வினாத்தாள்கள் மற்றும் வழிகாட்டிகள்:`
                      : `Access verified syllabus, exam blueprints, previous question papers, and study guides for this recruitment:`}
                  </p>
                </div>
              </div>

              <div className="prep-resource-links-grid">
                <Link
                  to={`/syllabus?${prepQueryParams.toString()}`}
                  className="prep-resource-button-item"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span>{isTamil ? 'பாடத்திட்டம் (View Syllabus)' : 'View Syllabus'}</span>
                </Link>

                <Link
                  to={`/study-materials?${prepQueryParams.toString()}&material_type=study_material`}
                  className="prep-resource-button-item"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                  <span>{isTamil ? 'படிப்பு பொருட்கள் (Study Materials)' : 'Study Materials'}</span>
                </Link>

                <Link
                  to={`/study-materials?${prepQueryParams.toString()}&material_type=question_paper`}
                  className="prep-resource-button-item"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>{isTamil ? 'முந்தைய வினாத்தாள்கள் (PYQ)' : 'Previous Year Papers'}</span>
                </Link>

                <Link
                  to={`/study-materials?${prepQueryParams.toString()}&material_type=exam_pattern`}
                  className="prep-resource-button-item"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{isTamil ? 'தேர்வு மாதிரி (Exam Pattern)' : 'Exam Pattern'}</span>
                </Link>
              </div>
            </section>

            {/* 2. Basic Information & Key Summary */}
            <section className="gov-card details-section-card">
              <h2 className="card-section-title">
                {isTamil ? 'முக்கிய வேலைவாய்ப்பு சுருக்கம்' : 'Key Job Summary'}
              </h2>
              <div className="summary-specs-grid">
                <div className="summary-spec-box">
                  <span className="sum-label">{isTamil ? 'அறிவிப்புக் குறியீடு' : 'Notification Code'}</span>
                  <span className="sum-val">{job.job_code || 'N/A'}</span>
                </div>
                <div className="summary-spec-box">
                  <span className="sum-label">{isTamil ? 'காலிப்பணியிடங்கள்' : 'Vacancies'}</span>
                  <span className="sum-val sum-vacancies">
                    {Number(job.vacancies || 0).toLocaleString('en-IN')}{' '}
                    {isTamil ? 'பணியிடங்கள்' : 'Posts'}
                  </span>
                </div>
                <div className="summary-spec-box">
                  <span className="sum-label">{isTamil ? 'நிறுவனம் / அமைப்பு' : 'Organization'}</span>
                  <span className="sum-val">{job.organization}</span>
                </div>
                <div className="summary-spec-box">
                  <span className="sum-label">{isTamil ? 'தேர்வு முகமை / அமைப்பு' : 'Recruitment Body'}</span>
                  <span className="sum-val">{job.recruitment_body || job.organization}</span>
                </div>
                <div className="summary-spec-box">
                  <span className="sum-label">{isTamil ? 'துறை / அமைச்சகம்' : 'Department / Ministry'}</span>
                  <span className="sum-val">
                    {job.department || (isTamil ? 'நேரடி அரசு பணி நியமனம்' : 'Direct Government Recruitment')}
                  </span>
                </div>
                <div className="summary-spec-box">
                  <span className="sum-label">{isTamil ? 'பணி வகை' : 'Category'}</span>
                  <span className="sum-val">{categoryDisplayName}</span>
                </div>
                {job.job_group && (
                  <div className="summary-spec-box">
                    <span className="sum-label">{isTamil ? 'பணி குழு' : 'Job Group'}</span>
                    <span className="sum-val">{tJobGroup(job.job_group)}</span>
                  </div>
                )}
                {job.exam_name && (
                  <div className="summary-spec-box">
                    <span className="sum-label">{isTamil ? 'தேர்வுப் பெயர்' : 'Exam Name'}</span>
                    <span className="sum-val">{job.exam_name}</span>
                  </div>
                )}
                <div className="summary-spec-box">
                  <span className="sum-label">{isTamil ? 'சம்பளம் / ஊதிய அளவு' : 'Salary / Pay Scale'}</span>
                  <span className="sum-val">{job.salary || (isTamil ? 'அரசு விதிகளின்படி' : 'As per govt pay rules')}</span>
                </div>
                <div className="summary-spec-box">
                  <span className="sum-label">{isTamil ? 'பணியிடம்' : 'Location'}</span>
                  <span className="sum-val">{job.location || (isTamil ? 'அகில இந்திய' : 'All India')}</span>
                </div>
                <div className="summary-spec-box">
                  <span className="sum-label">{isTamil ? 'விண்ணப்பக் கட்டணம்' : 'Application Fee'}</span>
                  <span className="sum-val">{job.application_fee || (isTamil ? 'விதிகளின்படி' : 'As per rules')}</span>
                </div>
                <div className="summary-spec-box">
                  <span className="sum-label">{isTamil ? 'விண்ணப்ப நிலை' : 'Application Status'}</span>
                  <span className="sum-val" style={{ textTransform: 'capitalize' }}>
                    {isDeadlinePassed
                      ? (isTamil ? 'முடிந்தது (Closed)' : 'Closed')
                      : isUpcoming
                      ? (isTamil ? 'வரவிருக்கும் (Upcoming)' : 'Upcoming')
                      : (isTamil ? 'செயலில் (Active)' : 'Active')}
                  </span>
                </div>
              </div>
            </section>

            {/* 3. Eligibility Requirements */}
            <section className="gov-card details-section-card">
              <h2 className="card-section-title">
                {isTamil ? 'தகுதி வரம்புகள்' : 'Eligibility Criteria'}
              </h2>
              <div className="eligibility-specs-list">
                <div className="eligibility-row">
                  <span className="eligibility-label">{isTamil ? 'கல்வித் தகுதி:' : 'Qualification:'}</span>
                  <span className="eligibility-val">
                    {job.qualification || (isTamil ? 'அதிகாரப்பூர்வ அறிவிப்பைக் காண்க' : 'Refer official notification')}
                  </span>
                </div>
                <div className="eligibility-row">
                  <span className="eligibility-label">{isTamil ? 'வயது வரம்பு:' : 'Age Limit:'}</span>
                  <span className="eligibility-val">
                    {job.age_limit || (isTamil ? 'அரசு விதிகளின்படி பொருந்தும் தளர்வுகளுடன்' : 'As per government rules with relaxations')}
                  </span>
                </div>
                <div className="eligibility-row">
                  <span className="eligibility-label">{isTamil ? 'அனுபவம்:' : 'Experience:'}</span>
                  <span className="eligibility-val">
                    {job.experience || (isTamil ? 'புதியவர்கள் / அனுபவம் உள்ளவர்கள்' : 'Freshers / Experienced')}
                  </span>
                </div>
              </div>
            </section>

            {/* 4. Job Description & Scope */}
            {job.description && (
              <section className="gov-card details-section-card">
                <h2 className="card-section-title">{isTamil ? 'பணி விவரம்' : 'Job Description'}</h2>
                <p className="details-description-text">{job.description}</p>
              </section>
            )}

            {/* 5. Selection Process */}
            {selectionStages.length > 0 && (
              <section className="gov-card details-section-card">
                <h2 className="card-section-title">{isTamil ? 'தேர்வு செயல்முறை' : 'Selection Process'}</h2>
                <ol className="selection-stages-list">
                  {selectionStages.map((stage, idx) => (
                    <li key={idx} className="stage-item">
                      <span className="stage-number">
                        {isTamil ? `நிலை ${String(idx + 1).padStart(2, '0')}` : `Stage ${String(idx + 1).padStart(2, '0')}`}
                      </span>
                      <span className="stage-content">{stage}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* 6. Required Documents */}
            {requiredDocs.length > 0 && (
              <section className="gov-card details-section-card">
                <h2 className="card-section-title">{isTamil ? 'தேவையான ஆவணங்கள்' : 'Required Documents'}</h2>
                <ul className="documents-checklist">
                  {requiredDocs.map((doc, idx) => (
                    <li key={idx} className="doc-item">
                      <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Sidebar Column */}
          <aside className="details-sidebar-column">
            {/* Quick Action Card */}
            <div className="gov-card sidebar-card" style={{ borderTop: '4px solid var(--color-primary)' }}>
              <h3 className="sidebar-card-title">{isTamil ? 'விண்ணப்ப நடவடிக்கை' : 'Recruitment Application'}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                {isTamil
                  ? 'விண்ணப்பப் படிவத்தை சமர்ப்பிப்பதற்கு முன் அதிகாரப்பூர்வ அறிவிப்பை முழுமையாகப் பார்க்கவும்.'
                  : 'Ensure you review the official notification requirements before submitting your candidature.'}
              </p>

              {hasApplied ? (
                <Link
                  to={appliedAppId ? `/applications/${appliedAppId}` : '/my-applications'}
                  className="btn-dash-primary"
                  style={{ display: 'flex', width: '100%', justifyContent: 'center', textAlign: 'center', textDecoration: 'none' }}
                >
                  {isTamil ? '✓ விண்ணப்பத்தைக் காண்க' : '✓ View Submitted Application'}
                </Link>
              ) : isDeadlinePassed ? (
                <div style={{ textAlign: 'center', padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontWeight: 600, fontSize: '0.9rem' }}>
                  {isTamil ? 'விண்ணப்பக் காலம் முடிவடைந்தது' : 'Application Period Has Closed'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={handleApplyClick}
                    className="btn-apply-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <span>{isTamil ? 'இப்போதே விண்ணப்பிக்கவும் (APPLY NOW)' : 'Apply Now'}</span>
                  </button>

                  {job.apply_url && (
                    <a
                      href={job.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-nav btn-outline"
                      style={{ width: '100%', justifyContent: 'center', textAlign: 'center', textDecoration: 'none' }}
                    >
                      <span>{isTamil ? 'அதிகாரப்பூர்வ இணையதளத்தில் விண்ணப்பிக்க ↗' : 'Apply on Official Website ↗'}</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Important Dates Timeline Card */}
            <div className="gov-card sidebar-card dates-card">
              <h3 className="sidebar-card-title">{isTamil ? 'முக்கிய தேதிகள்' : 'Important Dates'}</h3>
              <div className="dates-timeline">
                <div className="timeline-item">
                  <span className="timeline-dot" />
                  <div className="timeline-info">
                    <span className="timeline-label">
                      {isTamil ? 'விண்ணப்பத் தொடக்க தேதி' : 'Application Start Date'}
                    </span>
                    <span className="timeline-date">
                      {job.opening_date || (isTamil ? 'அறிவிப்பு வெளியிடப்பட்டது' : 'Notification Published')}
                    </span>
                  </div>
                </div>

                <div className="timeline-item timeline-critical">
                  <span className="timeline-dot dot-critical" />
                  <div className="timeline-info">
                    <span className="timeline-label">
                      {isTamil ? 'விண்ணப்பிக்க கடைசி தேதி' : 'Last Date to Apply'}
                    </span>
                    <span className="timeline-date date-critical">
                      {job.last_date || (isTamil ? 'அறிவிப்பைக் காண்க' : 'Refer Notification')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Notification Gazette Link Card */}
            <div className="gov-card sidebar-card official-notice-card">
              <h3 className="sidebar-card-title">
                {isTamil ? 'அதிகாரப்பூர்வ அரசிதழ் / அறிவிப்பு' : 'Official Notification / Gazette'}
              </h3>
              <p className="notice-subtext">
                {isTamil
                  ? `விண்ணப்பிக்கும் முன் ${job.organization} வெளியிட்ட அதிகாரப்பூர்வ அறிவிப்பைப் படித்துப் பார்க்கவும்.`
                  : `Please review the official notification issued by ${job.organization} before applying.`}
              </p>
              {job.notification_url ? (
                <a
                  href={job.notification_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-download-notice"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  <span>{isTamil ? 'அறிவிப்பைப் பதிவிறக்கவும் (PDF)' : 'Download Notification (PDF)'}</span>
                </a>
              ) : (
                <div className="notice-unavailable-box">
                  <span>
                    {isTamil
                      ? 'அதிகாரப்பூர்வ அறிவிப்பு இணைப்பு விரைவில் வெளியிடப்படும்.'
                      : 'Official notification link will be updated soon.'}
                  </span>
                </div>
              )}
            </div>

            {/* Back to Jobs Link */}
            <div className="gov-card sidebar-card help-card">
              <h3 className="sidebar-card-title">{isTamil ? 'வழிசெலுத்தல்' : 'Navigation'}</h3>
              <Link to="/jobs" className="btn-help-link">
                {isTamil ? '← அனைத்து அரசுப் பணிகளுக்கும் திரும்பு' : '← Back to All Government Jobs'}
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* 3. Eligibility Confirmation Modal */}
      {showEligibilityModal && (
        <div className="gov-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="gov-modal-card">
            <div className="gov-modal-header">
              <div className="gov-modal-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div>
                <h3 className="gov-modal-title" id="modal-title">
                  {isTamil ? 'விண்ணப்ப தகுதி உறுதிப்படுத்தல்' : 'Application Eligibility Confirmation'}
                </h3>
                <span className="gov-modal-subtitle">
                  {job.title} • {job.organization}
                </span>
              </div>
            </div>

            <div className="gov-modal-body">
              <p className="gov-modal-notice">
                {isTamil
                  ? 'அதிகாரப்பூர்வ வேலைவாய்ப்பு அறிவிப்பில் குறிப்பிடப்பட்டுள்ள கல்வித் தகுதி, வயது வரம்பு, இடஒதுக்கீடு மற்றும் பிற அனைத்து தகுதி நிபந்தனைகளையும் நீங்கள் பூர்த்தி செய்கிறீர்கள் என்பதை உறுதிப்படுத்தவும்.'
                  : 'Please confirm that you meet the educational qualifications, age limit, and other eligibility requirements specified in the official notification.'}
              </p>

              <label className="gov-modal-checkbox-row">
                <input
                  type="checkbox"
                  id="eligibility-checkbox"
                  checked={eligibilityConfirmed}
                  onChange={(e) => setEligibilityConfirmed(e.target.checked)}
                  className="gov-checkbox-input"
                />
                <span className="gov-checkbox-label">
                  {isTamil
                    ? 'அதிகாரப்பூர்வ தகுதி வரம்புகளை நான் சரிபார்த்து பூர்த்தி செய்வதை உறுதிப்படுத்துகிறேன்.'
                    : 'I confirm that I have checked and meet the official eligibility requirements.'}
                </span>
              </label>
            </div>

            <div className="gov-modal-footer">
              <button
                type="button"
                onClick={() => {
                  setShowEligibilityModal(false);
                  setEligibilityConfirmed(false);
                }}
                className="btn-modal-cancel"
              >
                {isTamil ? 'ரத்துசெய்' : 'Cancel'}
              </button>

              <button
                type="button"
                id="btn-modal-continue"
                disabled={!eligibilityConfirmed}
                onClick={handleModalContinue}
                className="btn-modal-continue"
                style={{
                  opacity: eligibilityConfirmed ? 1 : 0.5,
                  cursor: eligibilityConfirmed ? 'pointer' : 'not-allowed',
                }}
              >
                <span>{isTamil ? 'விண்ணப்பத்திற்கு தொடரவும்' : 'Continue to Application'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails;
