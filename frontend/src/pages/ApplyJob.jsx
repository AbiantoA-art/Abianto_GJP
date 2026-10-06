import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  getJobById,
  checkAlreadyApplied,
  submitApplication,
} from '../services/api';
import { ApplicationHeaderCard } from '../components/application/ApplicationHeaderCard';
import { ApplicationStepper } from '../components/application/ApplicationStepper';
import { DocumentUploadCard } from '../components/application/DocumentUploadCard';
import { ApplicationReview } from '../components/application/ApplicationReview';

const CURRENT_YEAR = new Date().getFullYear();

export const ApplyJob = () => {
  const { id } = useParams();
  const { user, token, isAuthenticated, isCandidate, isAdmin } = useAuth();
  const { language, t } = useLanguage();
  const isTa = language === 'ta';

  // 1. Job details and application verification state
  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [jobError, setJobError] = useState(null);

  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);
  const [checkingApplied, setCheckingApplied] = useState(true);

  // 2. Active Step State (1 to 8: 1-7 sections, 8 is review & submit)
  const [currentStep, setCurrentStep] = useState(1);
  const [draftToast, setDraftToast] = useState(null);

  // 3. Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    date_of_birth: '',
    gender: 'male',
    address_line: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    highest_qualification: 'Graduate',
    qualification_details: '',
    university_or_board: '',
    passing_year: CURRENT_YEAR,
    percentage_or_cgpa: '',
    experience_status: 'fresher',
    experience_details: '',
    declaration_accepted: false,
  });

  // 4. File attachments
  const [resumeFile, setResumeFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [certFile, setCertFile] = useState(null);

  // 5. Validation & submission state
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [generalError, setGeneralError] = useState(null);

  // Stepper definition
  const steps = useMemo(
    () => [
      { id: 1, labelEn: 'Personal', labelTa: 'தனிப்பட்டவை', shortCode: '01' },
      { id: 2, labelEn: 'Contact', labelTa: 'தொடர்பு', shortCode: '02' },
      { id: 3, labelEn: 'Address', labelTa: 'முகவரி', shortCode: '03' },
      { id: 4, labelEn: 'Education', labelTa: 'கல்வி', shortCode: '04' },
      { id: 5, labelEn: 'Experience', labelTa: 'அனுபவம்', shortCode: '05' },
      { id: 6, labelEn: 'Documents', labelTa: 'ஆவணங்கள்', shortCode: '06' },
      { id: 7, labelEn: 'Declaration', labelTa: 'உறுதிமொழி', shortCode: '07' },
      { id: 8, labelEn: 'Review & Submit', labelTa: 'சரிபார்ப்பு', shortCode: '08' },
    ],
    []
  );

  // Pre-fill user data & restore local draft if available
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        full_name: prev.full_name || user.name || user.full_name || '',
        email: prev.email || user.email || '',
        mobile_number: prev.mobile_number || user.mobile_number || '',
      }));
    }

    // Attempt local draft restore for this job
    try {
      const savedDraft = localStorage.getItem(`gov_portal_app_draft_${id}`);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          // Retain authenticated identity defaults if not in draft
          full_name: parsed.full_name || prev.full_name,
          email: parsed.email || prev.email,
          mobile_number: parsed.mobile_number || prev.mobile_number,
        }));
      }
    } catch {
      // Ignore draft retrieval errors
    }
  }, [user, id]);

  // Load Job and verify if candidate already applied
  useEffect(() => {
    let isMounted = true;

    const loadJobAndCheck = async () => {
      setLoadingJob(true);
      setJobError(null);

      const res = await getJobById(id);
      if (!isMounted) return;

      if (!res.success || !res.data) {
        setJobError(
          res.message ||
            (isTa
              ? 'அரசுப் பணி அறிவிப்பு கிடைக்கவில்லை அல்லது செயலில் இல்லை.'
              : 'Job vacancy not found or inactive.')
        );
        setLoadingJob(false);
        setCheckingApplied(false);
        return;
      }

      setJob(res.data);
      setLoadingJob(false);

      if (token && isCandidate) {
        setCheckingApplied(true);
        const appCheck = await checkAlreadyApplied(id, token);
        if (isMounted) {
          if (appCheck.success && appCheck.applied) {
            setAlreadyApplied(true);
            setExistingApplication(appCheck);
          }
          setCheckingApplied(false);
        }
      } else {
        setCheckingApplied(false);
      }
    };

    loadJobAndCheck();

    return () => {
      isMounted = false;
    };
  }, [id, token, isCandidate, isTa]);

  // Check deadline
  const isDeadlinePassed = useCallback(() => {
    if (!job || !job.last_date) return false;
    const lastDateStr = job.last_date.split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    return lastDateStr < todayStr;
  }, [job]);

  // Handle generic input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Handle file uploads with format & size validation
  const handleFileChange = (e, field) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (field === 'resume') {
      if (!['.pdf', '.doc', '.docx'].includes(ext)) {
        setFormErrors((prev) => ({
          ...prev,
          resume: isTa
            ? 'பயோடேட்டா PDF, DOC அல்லது DOCX வடிவத்தில் மட்டுமே இருக்க வேண்டும்.'
            : 'Resume must be in PDF, DOC, or DOCX format.',
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors((prev) => ({
          ...prev,
          resume: isTa
            ? 'கோப்பின் அளவு 5 MB-க்கு மிகாமல் இருக்க வேண்டும்.'
            : 'File size must not exceed 5 MB.',
        }));
        return;
      }
      setResumeFile(file);
      setFormErrors((prev) => ({ ...prev, resume: null }));
    } else if (field === 'photograph') {
      if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
        setFormErrors((prev) => ({
          ...prev,
          photograph: isTa
            ? 'புகைப்படம் JPG, JPEG அல்லது PNG வடிவத்தில் இருக்க வேண்டும்.'
            : 'Photograph must be in JPG, JPEG, or PNG format.',
        }));
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setFormErrors((prev) => ({
          ...prev,
          photograph: isTa
            ? 'புகைப்படத்தின் அளவு 2 MB-க்கு மிகாமல் இருக்க வேண்டும்.'
            : 'Photograph size must not exceed 2 MB.',
        }));
        return;
      }
      setPhotoFile(file);
      setFormErrors((prev) => ({ ...prev, photograph: null }));
    } else if (field === 'certificate') {
      if (!['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'].includes(ext)) {
        setFormErrors((prev) => ({
          ...prev,
          certificate: isTa
            ? 'சான்றிதழ் PDF, DOC, DOCX, JPG அல்லது PNG வடிவத்தில் இருக்க வேண்டும்.'
            : 'Certificate must be in PDF, DOC, DOCX, JPG, or PNG format.',
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors((prev) => ({
          ...prev,
          certificate: isTa
            ? 'சான்றிதழின் அளவு 5 MB-க்கு மிகாமல் இருக்க வேண்டும்.'
            : 'Certificate size must not exceed 5 MB.',
        }));
        return;
      }
      setCertFile(file);
      setFormErrors((prev) => ({ ...prev, certificate: null }));
    }
  };

  // Step-level validation
  const validateStep = (stepNumber) => {
    const errors = {};

    if (stepNumber === 1) {
      if (!formData.full_name || formData.full_name.trim().length < 2) {
        errors.full_name = isTa
          ? 'முழுப் பெயர் அவசியமானது (குறைந்தது 2 எழுத்துகள்).'
          : 'Full name is required (minimum 2 characters).';
      }
      if (!formData.date_of_birth) {
        errors.date_of_birth = isTa
          ? 'பிறந்த தேதி அவசியமானது.'
          : 'Date of birth is required.';
      } else {
        const dobDate = new Date(formData.date_of_birth);
        if (dobDate >= new Date()) {
          errors.date_of_birth = isTa
            ? 'பிறந்த தேதி கடந்த கால தேதியாக இருக்க வேண்டும்.'
            : 'Date of birth must be a date in the past.';
        }
      }
      if (!formData.gender) {
        errors.gender = isTa ? 'பாலினம் அவசியமானது.' : 'Gender is required.';
      }
    } else if (stepNumber === 2) {
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errors.email = isTa
          ? 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.'
          : 'Please enter a valid email address.';
      }
      if (!formData.mobile_number || !/^\+?[0-9]{10,15}$/.test(formData.mobile_number.trim())) {
        errors.mobile_number = isTa
          ? 'சரியான 10 முதல் 15 இலக்க கைபேசி எண்ணை உள்ளிடவும்.'
          : 'Please enter a valid 10 to 15 digit mobile number.';
      }
    } else if (stepNumber === 3) {
      if (!formData.address_line || formData.address_line.trim().length < 5) {
        errors.address_line = isTa
          ? 'முகவரி அவசியமானது (குறைந்தது 5 எழுத்துகள்).'
          : 'Address is required (minimum 5 characters).';
      }
      if (!formData.city || formData.city.trim().length === 0) {
        errors.city = isTa ? 'நகரம் அவசியமானது.' : 'City is required.';
      }
      if (!formData.district || formData.district.trim().length === 0) {
        errors.district = isTa ? 'மாவட்டம் அவசியமானது.' : 'District is required.';
      }
      if (!formData.state || formData.state.trim().length === 0) {
        errors.state = isTa ? 'மாநிலம் அவசியமானது.' : 'State is required.';
      }
      if (!formData.pincode || !/^[0-9]{4,10}$/.test(formData.pincode.trim())) {
        errors.pincode = isTa
          ? 'சரியான அஞ்சல் குறியீட்டு எண் (4-10 இலக்கங்கள்) தேவை.'
          : 'Valid postal code (4-10 digits) is required.';
      }
    } else if (stepNumber === 4) {
      if (!formData.highest_qualification || formData.highest_qualification.trim().length === 0) {
        errors.highest_qualification = isTa
          ? 'உயர்கல்வித் தகுதி அவசியமானது.'
          : 'Highest qualification is required.';
      }
      if (!formData.university_or_board || formData.university_or_board.trim().length === 0) {
        errors.university_or_board = isTa
          ? 'பல்கலைக்கழகம் அல்லது வாரியத்தின் பெயர் அவசியமானது.'
          : 'University or Board name is required.';
      }
      if (
        !formData.passing_year ||
        parseInt(formData.passing_year, 10) < 1950 ||
        parseInt(formData.passing_year, 10) > new Date().getFullYear() + 1
      ) {
        errors.passing_year = isTa
          ? 'சரியான தேர்ச்சி பெற்ற ஆண்டை உள்ளிடவும்.'
          : 'Please enter a valid passing year.';
      }
      if (!formData.percentage_or_cgpa || String(formData.percentage_or_cgpa).trim().length === 0) {
        errors.percentage_or_cgpa = isTa
          ? 'மதிப்பெண் சதவீதம் அல்லது CGPA தேவை.'
          : 'Percentage or CGPA is required.';
      }
    } else if (stepNumber === 5) {
      // Experience step: validate details if marked experienced
      if (formData.experience_status === 'experienced' && !formData.experience_details?.trim()) {
        errors.experience_details = isTa
          ? 'உங்கள் முந்தைய பணி அனுபவ விவரங்களை உள்ளிடவும்.'
          : 'Please enter your work experience details.';
      }
    } else if (stepNumber === 6) {
      if (!resumeFile) {
        errors.resume = isTa
          ? 'பயோடேட்டா ஆவணம் அவசியமானது (.pdf, .doc, .docx).'
          : 'Resume document is required (.pdf, .doc, .docx).';
      }
      if (!photoFile) {
        errors.photograph = isTa
          ? 'வேட்பாளரின் புகைப்படம் அவசியமானது (.jpg, .jpeg, .png).'
          : 'Photograph is required (.jpg, .jpeg, .png).';
      }
    } else if (stepNumber === 7) {
      if (!formData.declaration_accepted) {
        errors.declaration_accepted = isTa
          ? 'விண்ணப்பத்தை சமர்ப்பிக்க அதிகாரப்பூர்வ உறுதிமொழியை ஏற்க வேண்டும்.'
          : 'You must accept the official declaration to submit.';
      }
    }

    setFormErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  // Full form validation
  const validateForm = () => {
    let isValid = true;
    for (let s = 1; s <= 7; s++) {
      if (!validateStep(s)) {
        isValid = false;
      }
    }
    return isValid;
  };

  // Compute live completed steps map
  const completedSteps = useMemo(() => {
    const isEmailValid = Boolean(
      formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    );
    const isMobileValid = Boolean(
      formData.mobile_number && /^\+?[0-9]{10,15}$/.test(formData.mobile_number.trim())
    );
    const isPinValid = Boolean(
      formData.pincode && /^[0-9]{4,10}$/.test(formData.pincode.trim())
    );

    return {
      1: Boolean(formData.full_name && formData.full_name.trim().length >= 2 && formData.date_of_birth),
      2: Boolean(isEmailValid && isMobileValid),
      3: Boolean(
        formData.address_line &&
          formData.address_line.trim().length >= 5 &&
          formData.city &&
          formData.district &&
          formData.state &&
          isPinValid
      ),
      4: Boolean(
        formData.highest_qualification &&
          formData.university_or_board &&
          formData.passing_year &&
          formData.percentage_or_cgpa
      ),
      5: Boolean(formData.experience_status),
      6: Boolean(resumeFile && photoFile),
      7: Boolean(formData.declaration_accepted),
      8: false,
    };
  }, [formData, resumeFile, photoFile]);

  const completedStepsCount = useMemo(() => {
    return Object.values(completedSteps).filter(Boolean).length;
  }, [completedSteps]);

  const progressPercentage = useMemo(() => {
    if (currentStep === 8) return 100;
    return Math.min(100, Math.round((completedStepsCount / 7) * 100));
  }, [completedStepsCount, currentStep]);

  // Step navigation handlers
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(8, prev + 1));
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleStepClick = (targetStep) => {
    if (targetStep === currentStep) return;
    // Allow clicking backwards, or forwards if current step passes validation
    if (targetStep < currentStep || validateStep(currentStep)) {
      setCurrentStep(targetStep);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  // Local Draft Save
  const handleSaveDraft = () => {
    try {
      localStorage.setItem(`gov_portal_app_draft_${id}`, JSON.stringify(formData));
      setDraftToast(isTa ? '✓ வரைவு உங்கள் சாதனத்தில் பாதுகாப்பாக சேமிக்கப்பட்டது.' : '✓ Application draft saved securely on your device.');
      setTimeout(() => setDraftToast(null), 3500);
    } catch {
      setDraftToast(isTa ? 'வரைவை சேமிக்க முடியவில்லை.' : 'Failed to save draft locally.');
      setTimeout(() => setDraftToast(null), 3500);
    }
  };

  // Final Submission Handler
  const handleSubmitFinal = async () => {
    if (!validateForm()) {
      setCurrentStep(1); // Jump to first error
      return;
    }

    setSubmitting(true);
    setGeneralError(null);

    const payload = new FormData();
    payload.append('job_id', job.id);
    payload.append('full_name', formData.full_name);
    payload.append('email', formData.email);
    payload.append('mobile_number', formData.mobile_number);
    payload.append('date_of_birth', formData.date_of_birth);
    payload.append('gender', formData.gender);
    payload.append('address_line', formData.address_line);
    payload.append('city', formData.city);
    payload.append('district', formData.district);
    payload.append('state', formData.state);
    payload.append('pincode', formData.pincode);
    payload.append('highest_qualification', formData.highest_qualification);
    payload.append('qualification_details', formData.qualification_details || '');
    payload.append('university_or_board', formData.university_or_board);
    payload.append('passing_year', formData.passing_year);
    payload.append('percentage_or_cgpa', formData.percentage_or_cgpa);
    payload.append('experience_status', formData.experience_status);
    payload.append('experience_details', formData.experience_details || '');
    payload.append('declaration_accepted', 'true');

    if (resumeFile) payload.append('resume', resumeFile);
    if (photoFile) payload.append('photograph', photoFile);
    if (certFile) payload.append('certificate', certFile);

    const res = await submitApplication(payload, token);
    setSubmitting(false);

    if (res.success && res.data) {
      setSubmissionSuccess(res.data);
      // Clean up local draft upon successful submission
      try {
        localStorage.removeItem(`gov_portal_app_draft_${id}`);
      } catch {
        // Ignore local storage error
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (res.statusCode === 409) {
        setAlreadyApplied(true);
      }
      setGeneralError(
        res.message ||
          (isTa
            ? 'விண்ணப்பத்தை சமர்ப்பிக்க முடியவில்லை. விவரங்களைச் சரிபார்க்கவும்.'
            : 'Failed to submit application. Please check your details.')
      );
    }
  };

  // --------------------------------------------------------------------------
  // Special State: Loading Job
  // --------------------------------------------------------------------------
  if (loadingJob || checkingApplied) {
    return (
      <div className="candidate-apply-page">
        <div className="gov-card" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
          <div className="loading-spinner-portal" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
            {isTa ? 'அரசுப் பணி அறிவிப்பு விவரங்கள் சரிபார்க்கப்படுகின்றன...' : 'Loading official recruitment vacancy details...'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {isTa ? 'தயவுசெய்து காத்திருக்கவும்' : 'Please wait while we prepare your application workspace.'}
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Special State: Job Not Found or Inactive
  // --------------------------------------------------------------------------
  if (jobError || !job) {
    return (
      <div className="candidate-apply-page">
        <div className="gov-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            {isTa ? 'விண்ணப்பம் கிடைக்கவில்லை' : 'Application Not Available'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.5 }}>
            {jobError || (isTa ? 'கோரப்பட்ட காலிப்பணியிடத்திற்கு தற்போது ஆன்லைனில் விண்ணப்பிக்க முடியாது.' : 'Online application is currently not available for this vacancy.')}
          </p>
          <Link to="/jobs" className="btn-dash-primary" style={{ display: 'inline-flex', padding: '0.65rem 1.5rem' }}>
            {isTa ? 'அரசுப் பணிகள் பட்டியலுக்குத் திரும்பு' : 'Back to Government Jobs'}
          </Link>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Special State: Unauthenticated User
  // --------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="candidate-apply-page">
        <div className="gov-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            {isTa ? 'வேட்பாளர் உள்நுழைவு தேவை' : 'Candidate Sign In Required'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.5 }}>
            {isTa ? (
              <span><strong>{job.title}</strong> பணிக்கு அதிகாரப்பூர்வமாக விண்ணப்பிக்க, உங்கள் வேட்பாளர் கணக்கில் உள்நுழையவும் அல்லது புதிய பதிவு செய்யவும்.</span>
            ) : (
              <span>To apply for <strong>{job.title}</strong>, please sign in to your official candidate account or create a new registration.</span>
            )}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={`/login?redirect=/jobs/${job.id}/apply`} className="btn-dash-primary">
              {isTa ? 'விண்ணப்பிக்க உள்நுழையவும்' : 'Sign In to Apply'}
            </Link>
            <Link to="/register" className="btn-nav btn-outline">
              {t('nav.register')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Special State: Administrator Notice
  // --------------------------------------------------------------------------
  if (isAdmin) {
    return (
      <div className="candidate-apply-page">
        <div className="gov-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            {isTa ? 'நிர்வாக கணக்கு அறிவிப்பு' : 'Administrator Account Notice'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.5 }}>
            {isTa
              ? 'நீங்கள் நிர்வாகி கணக்கில் உள்நுழைந்துள்ளீர்கள். நேரடி விண்ணப்பங்கள் வேட்பாளர் கணக்குகளுக்கு மட்டுமே ஒதுக்கப்பட்டுள்ளது.'
              : 'You are signed in as an administrator. Direct recruitment applications can only be submitted by registered candidate accounts.'}
          </p>
          <Link to="/admin/dashboard" className="btn-dash-primary" style={{ display: 'inline-flex', padding: '0.65rem 1.5rem' }}>
            {isTa ? 'நிர்வாக பலகைக்குத் திரும்பு' : 'Return to Admin Dashboard'}
          </Link>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Special State: Already Applied
  // --------------------------------------------------------------------------
  if (alreadyApplied) {
    return (
      <div className="candidate-apply-page">
        <div className="gov-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ fontSize: '3.5rem', color: '#16a34a', marginBottom: '1rem' }}>✓</div>
          <span className="app-badge app-badge-submitted" style={{ margin: '0 auto 1rem', display: 'inline-flex' }}>
            {isTa ? 'ஏற்கனவே விண்ணப்பிக்கப்பட்டது' : 'Already Applied'}
          </span>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            {isTa ? 'விண்ணப்பம் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது' : 'Application Already Submitted'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            {isTa
              ? 'நீங்கள் ஏற்கனவே இந்த அதிகாரப்பூர்வ அரசுப் பணிக்கு வெற்றிகரமாக விண்ணப்பித்துள்ளீர்கள்:'
              : 'You have already submitted an official application for this position:'}
          </p>
          <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.75rem', textAlign: 'left' }}>
            <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{job.title}</strong>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              {job.organization} {job.department && `• ${job.department}`} • {isTa ? 'பணி குறியீடு:' : 'Job Code:'} {job.job_code}
            </div>
            {existingApplication?.applicationId && (
              <div style={{ marginTop: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{isTa ? 'அதிகாரப்பூர்வ விண்ணப்ப எண்:' : 'Application ID:'}</span>
                <code style={{ fontSize: '1.1rem' }}>{existingApplication.applicationId}</code>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to={existingApplication?.id ? `/applications/${existingApplication.id}` : '/my-applications'}
              className="btn-dash-primary"
            >
              {isTa ? 'விண்ணப்ப விவரங்களைக் காண்க' : 'View Application Details'}
            </Link>
            <Link to="/jobs" className="btn-nav btn-outline">
              {isTa ? 'பிற பணிகளைத் தேடுங்கள்' : 'Browse Other Vacancies'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Special State: Deadline Passed
  // --------------------------------------------------------------------------
  if (isDeadlinePassed()) {
    return (
      <div className="candidate-apply-page">
        <div className="gov-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⌛</div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            {isTa ? 'விண்ணப்ப காலக்கெடு முடிவடைந்துவிட்டது' : 'Application Deadline Passed'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {isTa ? (
              <span><strong>{job.title}</strong> பணிக்கான கடைசி தேதி: <strong>{job.last_date}</strong>. புதிய விண்ணப்பங்கள் ஏற்கப்பட மாட்டாது.</span>
            ) : (
              <span>The application deadline for <strong>{job.title}</strong> was <strong>{job.last_date}</strong>. New applications are no longer accepted for this recruitment cycle.</span>
            )}
          </p>
          <Link to="/jobs" className="btn-dash-primary" style={{ display: 'inline-flex', padding: '0.65rem 1.5rem' }}>
            {isTa ? 'செயலில் உள்ள பிற பணிகளைப் பார்க்கவும்' : 'View Active Vacancies'}
          </Link>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Special State: Submission Success Receipt
  // --------------------------------------------------------------------------
  if (submissionSuccess) {
    return (
      <div className="candidate-apply-page">
        <div className="gov-card" style={{ maxWidth: '740px', margin: '0 auto', textAlign: 'center', padding: '3rem 2rem', borderTop: '5px solid #16a34a' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#16a34a',
              fontSize: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            ✓
          </div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 800 }}>
            {isTa ? 'விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது' : 'Application Successfully Submitted'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.5 }}>
            {isTa ? (
              <span><strong>{job.title}</strong> பணிக்கான உங்கள் விண்ணப்பம் தமிழ்நாடு அரசு வேலைவாய்ப்பு போர்ட்டலில் பதிவு செய்யப்பட்டுள்ளது.</span>
            ) : (
              <span>Your application for <strong>{job.title}</strong> has been officially recorded in the government recruitment system.</span>
            )}
          </p>

          <div
            style={{
              background: 'var(--bg-base)',
              border: '2px dashed var(--border-medium)',
              borderRadius: '12px',
              padding: '1.75rem',
              marginBottom: '2rem',
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              {isTa ? 'உங்கள் அதிகாரப்பூர்வ விண்ணப்ப எண் (Application ID)' : 'Official Application ID'}
            </div>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--color-primary)',
                marginTop: '0.35rem',
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
              }}
            >
              {submissionSuccess.application_id}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.65rem' }}>
              {isTa
                ? 'எதிர்கால தேர்வுத் தொடர்புகள், நுழைவுச்சீட்டு பதிவிறக்கம் ஆகியவற்றிற்கு இந்த எண்ணைப் பாதுகாப்பாக வைக்கவும்.'
                : 'Please preserve this application number for admit cards, examination schedules, and recruitment correspondence.'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={`/applications/${submissionSuccess.id}`} className="btn-dash-primary">
              {isTa ? 'விண்ணப்பத்தைக் காண்க & அச்சிடுக' : 'View & Print Application'}
            </Link>
            <Link to="/my-applications" className="btn-nav btn-outline">
              {isTa ? 'என் விண்ணப்பங்களில் கண்காணிக்கவும்' : 'Track in My Applications'}
            </Link>
            <Link to="/jobs" className="btn-nav btn-outline">
              {isTa ? 'மேலும் பணிகளைத் தேடுங்கள்' : 'Search More Jobs'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Main Application Workspace
  // --------------------------------------------------------------------------
  return (
    <div className="candidate-apply-page">
      {/* Breadcrumb Navigation */}
      <nav className="app-breadcrumb-nav" aria-label="Breadcrumb">
        <Link to="/">{isTa ? 'முகப்பு' : 'Home'}</Link>
        <span>/</span>
        <Link to="/jobs">{isTa ? 'அரசுப் பணிகள்' : 'Government Jobs'}</Link>
        <span>/</span>
        <Link to={`/jobs/${job.id}`}>{job.title}</Link>
        <span>/</span>
        <span className="active-crumb">{isTa ? 'விண்ணப்பப் படிவம்' : 'Job Application'}</span>
      </nav>

      {/* Header Summary Card */}
      <ApplicationHeaderCard
        job={job}
        progressPercentage={progressPercentage}
        completedStepsCount={completedStepsCount}
        totalSteps={8}
        currentStep={currentStep}
      />

      {/* Interactive Progress Stepper */}
      <ApplicationStepper
        steps={steps}
        currentStep={currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
      />

      {/* General Error Banner */}
      {generalError && (
        <div className="app-error-banner" role="alert">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <strong>{isTa ? 'பிழை:' : 'Error:'}</strong> {generalError}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {draftToast && (
        <div className="app-toast-alert" role="status">
          <span>{draftToast}</span>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          Step Mode (1 - 7) or Review Mode (8)
          ---------------------------------------------------------------------- */}
      {currentStep === 8 ? (
        <ApplicationReview
          formData={formData}
          job={job}
          resumeFile={resumeFile}
          photoFile={photoFile}
          certFile={certFile}
          onEditSection={handleStepClick}
          onSubmitFinal={handleSubmitFinal}
          onSaveDraft={handleSaveDraft}
          submitting={submitting}
          onBackToEdit={() => setCurrentStep(1)}
        />
      ) : (
        <form onSubmit={(e) => e.preventDefault()} noValidate>
          {/* STEP 1: Personal Details */}
          {currentStep === 1 && (
            <section className="app-form-section-card" aria-labelledby="section-personal-title">
              <div className="app-section-header">
                <div className="app-section-header-left">
                  <div className="app-section-badge">01</div>
                  <div className="app-section-title-wrap">
                    <h2 id="section-personal-title" className="app-section-title">
                      {isTa ? 'தனிப்பட்ட விவரங்கள்' : 'Personal Details'}
                    </h2>
                    <p className="app-section-subtitle">
                      {isTa
                        ? 'உங்கள் 10ஆம் வகுப்பு சான்றிதழில் உள்ளவாறு விவரங்களைச் சரியாக உள்ளிடவும்.'
                        : 'Enter your personal details exactly as recorded in your 10th standard certificate.'}
                    </p>
                  </div>
                </div>

                <div className="app-section-header-right">
                  {completedSteps[1] && (
                    <span className="app-section-status-pill">
                      ✓ {isTa ? 'முழுமையானது' : 'Completed'}
                    </span>
                  )}
                </div>
              </div>

              <div className="app-form-body">
                <div className="form-grid">
                  {/* Full Name */}
                  <div className="app-form-group col-span-full">
                    <label className="app-form-label" htmlFor="full_name">
                      <span>{isTa ? 'முழுப் பெயர் (சான்றிதழின்படி)' : 'Full Name (as per Certificate)'}</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      className={`app-input ${formErrors.full_name ? 'input-error' : ''}`}
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder={isTa ? 'எ.கா. ரமேஷ் குமார்' : 'e.g. Ramesh Kumar'}
                      required
                    />
                    <span className="app-field-hint">
                      {isTa ? 'பத்தாம் வகுப்பு மதிப்பெண் பட்டியலில் உள்ளவாறு பிழையின்றி உள்ளிடவும்.' : 'Enter full name exactly as shown on official identity records.'}
                    </span>
                    {formErrors.full_name && (
                      <div className="app-field-error">
                        <span>{formErrors.full_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div className="app-form-group">
                    <label className="app-form-label" htmlFor="date_of_birth">
                      <span>{isTa ? 'பிறந்த தேதி' : 'Date of Birth'}</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="date"
                      id="date_of_birth"
                      name="date_of_birth"
                      className={`app-input ${formErrors.date_of_birth ? 'input-error' : ''}`}
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="app-field-hint">
                      {isTa ? 'நாட்காட்டி மூலம் உங்கள் பிறந்த தேதியைத் தேர்வு செய்க.' : 'Select your date of birth using the calendar picker.'}
                    </span>
                    {formErrors.date_of_birth && (
                      <div className="app-field-error">
                        <span>{formErrors.date_of_birth}</span>
                      </div>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="app-form-group">
                    <label className="app-form-label" htmlFor="gender">
                      <span>{isTa ? 'பாலினம்' : 'Gender'}</span>
                      <span className="required-star">*</span>
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      className="app-select"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="male">{isTa ? 'ஆண் (Male)' : 'Male'}</option>
                      <option value="female">{isTa ? 'பெண் (Female)' : 'Female'}</option>
                      <option value="transgender">{isTa ? 'திருநங்கை (Transgender)' : 'Transgender'}</option>
                      <option value="other">{isTa ? 'பிற (Other)' : 'Other'}</option>
                    </select>
                    <span className="app-field-hint">
                      {isTa ? 'அதிகாரப்பூர்வ ஆவணங்களின்படி உங்கள் பாலினத்தைத் தேர்ந்தெடுக்கவும்.' : 'Select your gender category as per official records.'}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 2: Contact Details */}
          {currentStep === 2 && (
            <section className="app-form-section-card" aria-labelledby="section-contact-title">
              <div className="app-section-header">
                <div className="app-section-header-left">
                  <div className="app-section-badge">02</div>
                  <div className="app-section-title-wrap">
                    <h2 id="section-contact-title" className="app-section-title">
                      {isTa ? 'தொடர்பு விவரங்கள்' : 'Contact Details'}
                    </h2>
                    <p className="app-section-subtitle">
                      {isTa
                        ? 'அரசுத் தேர்வுகள் மற்றும் அறிவிப்புகள் இந்த தொடர்பு விவரங்களுக்கு அனுப்பப்படும்.'
                        : 'Official recruitment notifications, hall tickets, and SMS alerts will be sent here.'}
                    </p>
                  </div>
                </div>

                <div className="app-section-header-right">
                  {completedSteps[2] && (
                    <span className="app-section-status-pill">
                      ✓ {isTa ? 'முழுமையானது' : 'Completed'}
                    </span>
                  )}
                </div>
              </div>

              <div className="app-form-body">
                <div className="form-grid">
                  {/* Email */}
                  <div className="app-form-group">
                    <label className="app-form-label" htmlFor="email">
                      <span>{isTa ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className={`app-input ${formErrors.email ? 'input-error' : ''}`}
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="candidate@example.com"
                      required
                    />
                    <span className="app-field-hint">
                      {isTa ? 'தொடர்ந்து பயன்படுத்தும் சரியான மின்னஞ்சலை உள்ளிடவும்.' : 'Official registration notices will be dispatched to this email.'}
                    </span>
                    {formErrors.email && (
                      <div className="app-field-error">
                        <span>{formErrors.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Mobile Number */}
                  <div className="app-form-group">
                    <label className="app-form-label" htmlFor="mobile_number">
                      <span>{isTa ? 'கைபேசி எண்' : 'Mobile Number'}</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="tel"
                      id="mobile_number"
                      name="mobile_number"
                      className={`app-input ${formErrors.mobile_number ? 'input-error' : ''}`}
                      value={formData.mobile_number}
                      onChange={handleInputChange}
                      placeholder={isTa ? 'எ.கா. 9876543210' : 'e.g. +91 9876543210'}
                      required
                    />
                    <span className="app-field-hint">
                      {isTa ? '10 முதல் 15 இலக்க செல்லுபடியாகும் கைபேசி எண்.' : 'Enter active 10-15 digit mobile number for SMS notifications.'}
                    </span>
                    {formErrors.mobile_number && (
                      <div className="app-field-error">
                        <span>{formErrors.mobile_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 3: Residential Address */}
          {currentStep === 3 && (
            <section className="app-form-section-card" aria-labelledby="section-address-title">
              <div className="app-section-header">
                <div className="app-section-header-left">
                  <div className="app-section-badge">03</div>
                  <div className="app-section-title-wrap">
                    <h2 id="section-address-title" className="app-section-title">
                      {isTa ? 'குடியிருப்பு முகவரி' : 'Residential Address'}
                    </h2>
                    <p className="app-section-subtitle">
                      {isTa
                        ? 'தற்போதைய குடியிருப்பு முகவரியை உள்ளிடவும். அஞ்சல் தொடர்புக்கு இது பயன்படுத்தப்படும்.'
                        : 'Provide your current permanent communication address.'}
                    </p>
                  </div>
                </div>

                <div className="app-section-header-right">
                  {completedSteps[3] && (
                    <span className="app-section-status-pill">
                      ✓ {isTa ? 'முழுமையானது' : 'Completed'}
                    </span>
                  )}
                </div>
              </div>

              <div className="app-form-body">
                <div className="form-grid four-columns">
                  {/* Street Address */}
                  <div className="app-form-group col-span-full">
                    <label className="app-form-label" htmlFor="address_line">
                      <span>{isTa ? 'முகவரி (கதவு எண், தெரு பெயர்)' : 'Address (Door / Plot No., Street Name)'}</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="address_line"
                      name="address_line"
                      className={`app-input ${formErrors.address_line ? 'input-error' : ''}`}
                      value={formData.address_line}
                      onChange={handleInputChange}
                      placeholder={isTa ? 'எண் 12, காந்தி தெரு, அண்ணா நகர்' : 'No. 12, Gandhi Street, Anna Nagar'}
                      required
                    />
                    {formErrors.address_line && (
                      <div className="app-field-error">
                        <span>{formErrors.address_line}</span>
                      </div>
                    )}
                  </div>

                  {/* City */}
                  <div className="app-form-group">
                    <label className="app-form-label" htmlFor="city">
                      <span>{isTa ? 'நகரம் / ஊர்' : 'City / Town'}</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      className={`app-input ${formErrors.city ? 'input-error' : ''}`}
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder={isTa ? 'எ.கா. சென்னை' : 'e.g. Chennai'}
                      required
                    />
                    {formErrors.city && (
                      <div className="app-field-error">
                        <span>{formErrors.city}</span>
                      </div>
                    )}
                  </div>

                  {/* District */}
                  <div className="app-form-group">
                    <label className="app-form-label" htmlFor="district">
                      <span>{isTa ? 'மாவட்டம்' : 'District'}</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="district"
                      name="district"
                      className={`app-input ${formErrors.district ? 'input-error' : ''}`}
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder={isTa ? 'எ.கா. சென்னை' : 'e.g. Chennai'}
                      required
                    />
                    {formErrors.district && (
                      <div className="app-field-error">
                        <span>{formErrors.district}</span>
                      </div>
                    )}
                  </div>

                  {/* State */}
                  <div className="app-form-group">
                    <label className="app-form-label" htmlFor="state">
                      <span>{isTa ? 'மாநிலம்' : 'State / UT'}</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      className={`app-input ${formErrors.state ? 'input-error' : ''}`}
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder={isTa ? 'எ.கா. தமிழ்நாடு' : 'e.g. Tamil Nadu'}
                      required
                    />
                    {formErrors.state && (
                      <div className="app-field-error">
                        <span>{formErrors.state}</span>
                      </div>
                    )}
                  </div>

                  {/* Pincode */}
                  <div className="app-form-group">
                    <label className="app-form-label" htmlFor="pincode">
                      <span>{isTa ? 'அஞ்சல் குறியீடு (PIN)' : 'Postal Code (PIN)'}</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="pincode"
                      name="pincode"
                      className={`app-input ${formErrors.pincode ? 'input-error' : ''}`}
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder={isTa ? 'எ.கா. 600001' : 'e.g. 600001'}
                      required
                    />
                    {formErrors.pincode && (
                      <div className="app-field-error">
                        <span>{formErrors.pincode}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 4: Educational Qualifications */}
          {currentStep === 4 && (
            <section className="app-form-section-card" aria-labelledby="section-education-title">
              <div className="app-section-header">
                <div className="app-section-header-left">
                  <div className="app-section-badge">04</div>
                  <div className="app-section-title-wrap">
                    <h2 id="section-education-title" className="app-section-title">
                      {isTa ? 'கல்வித் தகுதிகள்' : 'Educational Qualifications'}
                    </h2>
                    <p className="app-section-subtitle">
                      {isTa
                        ? 'இந்தப் பணிக்குரிய குறைந்தபட்ச கல்வித் தகுதியை உள்ளிடவும்.'
                        : 'Enter details of your highest relevant educational qualification.'}
                    </p>
                  </div>
                </div>

                <div className="app-section-header-right">
                  {completedSteps[4] && (
                    <span className="app-section-status-pill">
                      ✓ {isTa ? 'முழுமையானது' : 'Completed'}
                    </span>
                  )}
                </div>
              </div>

              <div className="app-form-body">
                <div className="form-grid">
                  {/* Highest Qualification */}
                  <div className="app-form-group">
                    <label className="app-form-label" htmlFor="highest_qualification">
                      <span>{isTa ? 'உயர்கல்வித் தகுதி' : 'Highest Qualification'}</span>
                      <span className="required-star">*</span>
                    </label>
                    <select
                      id="highest_qualification"
                      name="highest_qualification"
                      className="app-select"
                      value={formData.highest_qualification}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="10th Standard">{isTa ? '10ஆம் வகுப்பு / மெட்ரிகுலேஷன்' : '10th Standard / Matriculation'}</option>
                      <option value="12th Standard">{isTa ? '12ஆம் வகுப்பு / மேல்நிலைப்பள்ளி' : '12th Standard / Higher Secondary'}</option>
                      <option value="Diploma">{isTa ? 'டிப்ளமோ / பாலிடெக்னிக்' : 'Diploma / Polytechnic'}</option>
                      <option value="Graduate">{isTa ? "இளங்கலை பட்டப்படிப்பு (Bachelor's)" : "Graduate (Bachelor's)"}</option>
                      <option value="Post Graduate">{isTa ? "முதுகலை பட்டப்படிப்பு (Master's)" : "Post Graduate (Master's)"}</option>
                      <option value="Doctorate">{isTa ? 'முனைவர் பட்டம் (Ph.D.)' : 'Doctorate (Ph.D.)'}</option>
                      <option value="Other">{isTa ? 'பிற இணையான தகுதி' : 'Other Equivalent'}</option>
                    </select>
                  </div>

                  {/* Specialization */}
                  <div className="app-form-group">
                    <label className="app-form-label" htmlFor="qualification_details">
                      <span>{isTa ? 'பாடப்பிரிவு / சிறப்புப் பிரிவு' : 'Subject / Branch / Specialization'}</span>
                    </label>
                    <input
                      type="text"
                      id="qualification_details"
                      name="qualification_details"
                      className="app-input"
                      value={formData.qualification_details}
                      onChange={handleInputChange}
                      placeholder={isTa ? 'எ.கா. B.E. கணினி அறிவியல் / B.Com' : 'e.g. B.E. Computer Science / B.Com'}
                    />
                  </div>

                  {/* Board / University */}
                  <div className="app-form-group col-span-full">
                    <label className="app-form-label" htmlFor="university_or_board">
                      <span>{isTa ? 'பல்கலைக்கழகம் / கல்வி வாரியம்' : 'University / Board / Institution'}</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="university_or_board"
                      name="university_or_board"
                      className={`app-input ${formErrors.university_or_board ? 'input-error' : ''}`}
                      value={formData.university_or_board}
                      onChange={handleInputChange}
                      placeholder={isTa ? 'எ.கா. அண்ணா பல்கலைக்கழகம் / சென்னை பல்கலைக்கழகம்' : 'e.g. Anna University / University of Madras'}
                      required
                    />
                    {formErrors.university_or_board && (
                      <div className="app-field-error">
                        <span>{formErrors.university_or_board}</span>
                      </div>
                    )}
                  </div>

                  {/* Year of Passing */}
                  <div className="app-form-group">
                    <label className="app-form-label" htmlFor="passing_year">
                      <span>{isTa ? 'தேர்ச்சி பெற்ற ஆண்டு' : 'Passing Year'}</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="number"
                      id="passing_year"
                      name="passing_year"
                      className={`app-input ${formErrors.passing_year ? 'input-error' : ''}`}
                      value={formData.passing_year}
                      onChange={handleInputChange}
                      min="1950"
                      max={CURRENT_YEAR + 1}
                      required
                    />
                    {formErrors.passing_year && (
                      <div className="app-field-error">
                        <span>{formErrors.passing_year}</span>
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="app-form-group">
                    <label className="app-form-label" htmlFor="percentage_or_cgpa">
                      <span>{isTa ? 'மதிப்பெண் சதவீதம் / CGPA' : 'Score (Percentage or CGPA)'}</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="percentage_or_cgpa"
                      name="percentage_or_cgpa"
                      className={`app-input ${formErrors.percentage_or_cgpa ? 'input-error' : ''}`}
                      value={formData.percentage_or_cgpa}
                      onChange={handleInputChange}
                      placeholder={isTa ? 'எ.கா. 82.5% அல்லது 8.4 CGPA' : 'e.g. 82.5% or 8.4 CGPA'}
                      required
                    />
                    {formErrors.percentage_or_cgpa && (
                      <div className="app-field-error">
                        <span>{formErrors.percentage_or_cgpa}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 5: Work Experience */}
          {currentStep === 5 && (
            <section className="app-form-section-card" aria-labelledby="section-experience-title">
              <div className="app-section-header">
                <div className="app-section-header-left">
                  <div className="app-section-badge">05</div>
                  <div className="app-section-title-wrap">
                    <h2 id="section-experience-title" className="app-section-title">
                      {isTa ? 'பணி அனுபவம்' : 'Work Experience'}
                    </h2>
                    <p className="app-section-subtitle">
                      {isTa
                        ? 'உங்கள் முந்தைய பணி அனுபவ நிலையைத் தேர்வு செய்யவும்.'
                        : 'Indicate whether you are applying as a fresher or have prior work experience.'}
                    </p>
                  </div>
                </div>

                <div className="app-section-header-right">
                  {completedSteps[5] && (
                    <span className="app-section-status-pill">
                      ✓ {isTa ? 'முழுமையானது' : 'Completed'}
                    </span>
                  )}
                </div>
              </div>

              <div className="app-form-body">
                <div className="radio-cards-group">
                  <label className={`radio-card-label ${formData.experience_status === 'fresher' ? 'radio-active' : ''}`}>
                    <input
                      type="radio"
                      name="experience_status"
                      value="fresher"
                      checked={formData.experience_status === 'fresher'}
                      onChange={handleInputChange}
                    />
                    <span className="radio-card-text">
                      {isTa ? 'புதியவர் (முந்தைய அனுபவம் இல்லை)' : 'Fresher (No Prior Experience)'}
                    </span>
                  </label>

                  <label className={`radio-card-label ${formData.experience_status === 'experienced' ? 'radio-active' : ''}`}>
                    <input
                      type="radio"
                      name="experience_status"
                      value="experienced"
                      checked={formData.experience_status === 'experienced'}
                      onChange={handleInputChange}
                    />
                    <span className="radio-card-text">
                      {isTa ? 'பணி அனுபவம் உள்ளவர்' : 'Experienced Professional'}
                    </span>
                  </label>
                </div>

                {formData.experience_status === 'experienced' && (
                  <div className="app-form-group" style={{ marginTop: '1rem' }}>
                    <label className="app-form-label" htmlFor="experience_details">
                      <span>{isTa ? 'பணி விவரம் (நிறுவனம், பதவி, பணிக்காலம்)' : 'Experience Details (Organization, Role, Duration)'}</span>
                      <span className="required-star">*</span>
                    </label>
                    <textarea
                      id="experience_details"
                      name="experience_details"
                      className={`app-textarea ${formErrors.experience_details ? 'input-error' : ''}`}
                      value={formData.experience_details}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder={isTa ? 'எ.கா. 2 ஆண்டுகள் இளநிலை உதவியாளர் (2022-2024)' : 'e.g. 2 years as Junior Assistant at State Electricity Board (2022 - 2024)'}
                      required
                    />
                    {formErrors.experience_details && (
                      <div className="app-field-error">
                        <span>{formErrors.experience_details}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* STEP 6: Upload Documents */}
          {currentStep === 6 && (
            <section className="app-form-section-card" aria-labelledby="section-documents-title">
              <div className="app-section-header">
                <div className="app-section-header-left">
                  <div className="app-section-badge">06</div>
                  <div className="app-section-title-wrap">
                    <h2 id="section-documents-title" className="app-section-title">
                      {isTa ? 'ஆவணங்கள் பதிவேற்றம்' : 'Upload Documents'}
                    </h2>
                    <p className="app-section-subtitle">
                      {isTa
                        ? 'அரசு விதிகளின்படி பயோடேட்டா மற்றும் சமீபத்திய புகைப்படத்தை பதிவேற்றவும்.'
                        : 'Upload your verified resume and recent passport-size photograph.'}
                    </p>
                  </div>
                </div>

                <div className="app-section-header-right">
                  {completedSteps[6] && (
                    <span className="app-section-status-pill">
                      ✓ {isTa ? 'முழுமையானது' : 'Completed'}
                    </span>
                  )}
                </div>
              </div>

              <div className="app-form-body">
                <div className="documents-upload-grid">
                  {/* Resume Upload */}
                  <DocumentUploadCard
                    id="resume"
                    name="resume"
                    label={isTa ? 'வேட்பாளர் பயோடேட்டா (Resume/CV)' : 'Candidate Resume (Resume / CV)'}
                    helperText={isTa ? 'அனுமதிக்கப்பட்ட வடிவங்கள்: .PDF, .DOC, .DOCX' : 'Supported formats: .PDF, .DOC, .DOCX'}
                    accept=".pdf,.doc,.docx"
                    maxSizeMB={5}
                    required={true}
                    file={resumeFile}
                    error={formErrors.resume}
                    onChange={(e) => handleFileChange(e, 'resume')}
                    onRemove={() => setResumeFile(null)}
                    iconType="document"
                  />

                  {/* Photograph Upload */}
                  <DocumentUploadCard
                    id="photograph"
                    name="photograph"
                    label={isTa ? 'சமீபத்திய பாஸ்போர்ட் அளவு புகைப்படம்' : 'Recent Passport Size Photograph'}
                    helperText={isTa ? 'அனுமதிக்கப்பட்ட வடிவங்கள்: .JPG, .JPEG, .PNG' : 'Supported formats: .JPG, .JPEG, .PNG'}
                    accept=".jpg,.jpeg,.png"
                    maxSizeMB={2}
                    required={true}
                    file={photoFile}
                    error={formErrors.photograph}
                    onChange={(e) => handleFileChange(e, 'photograph')}
                    onRemove={() => setPhotoFile(null)}
                    iconType="photo"
                  />

                  {/* Optional Certificate */}
                  <DocumentUploadCard
                    id="certificate"
                    name="certificate"
                    label={isTa ? 'கூடுதல் தகுதிச் சான்றிதழ் (விருப்பத்தேர்வு)' : 'Additional Certificate (Optional)'}
                    helperText={isTa ? 'சாதி, கல்வி அல்லது பிற தகுதி ஆவணம்' : 'Community, sports, or relevant certificate'}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    maxSizeMB={5}
                    required={false}
                    file={certFile}
                    error={formErrors.certificate}
                    onChange={(e) => handleFileChange(e, 'certificate')}
                    onRemove={() => setCertFile(null)}
                    iconType="certificate"
                  />
                </div>
              </div>
            </section>
          )}

          {/* STEP 7: Candidate Declaration */}
          {currentStep === 7 && (
            <section className="app-form-section-card" aria-labelledby="section-declaration-title">
              <div className="app-section-header">
                <div className="app-section-header-left">
                  <div className="app-section-badge">07</div>
                  <div className="app-section-title-wrap">
                    <h2 id="section-declaration-title" className="app-section-title">
                      {isTa ? 'வேட்பாளர் உறுதிமொழி' : 'Candidate Declaration'}
                    </h2>
                    <p className="app-section-subtitle">
                      {isTa
                        ? 'அரசுப் பணி விதிகளின் கீழ் அதிகாரப்பூர்வ உறுதிமொழியை படித்து ஏற்கவும்.'
                        : 'Read and accept the official government appointment declaration.'}
                    </p>
                  </div>
                </div>

                <div className="app-section-header-right">
                  {completedSteps[7] && (
                    <span className="app-section-status-pill">
                      ✓ {isTa ? 'ஏற்கப்பட்டது' : 'Accepted'}
                    </span>
                  )}
                </div>
              </div>

              <div className="app-form-body">
                <div className="app-declaration-card">
                  <label className="declaration-checkbox-wrap">
                    <input
                      type="checkbox"
                      name="declaration_accepted"
                      className="app-checkbox"
                      checked={formData.declaration_accepted}
                      onChange={handleInputChange}
                      required
                    />
                    <div className="declaration-content">
                      <span className="declaration-affirmation">
                        {isTa
                          ? 'இந்த விண்ணப்பத்தில் கொடுக்கப்பட்டுள்ள அனைத்து தகவல்களும் எனக்குத் தெரிந்தவரை உண்மையானவை மற்றும் சரியானவை என்று உறுதியளிக்கிறேன்.'
                          : 'I hereby declare that all information provided in this application is true, complete, and correct to the best of my knowledge.'}
                      </span>
                      <span className="declaration-subtext">
                        {isTa
                          ? 'தேர்வு நடைமுறையின் எந்த கட்டத்திலாவது ஏதேனும் தகவல் தவறானது என்று கண்டறியப்பட்டால் எனது விண்ணப்பம் எவ்வித முன்னறிவிப்புமின்றி தகுதி நீக்கம் செய்யப்படும் என்பதையும், சட்டப்பூர்வ நடவடிக்கைகளுக்கு உட்பட்டது என்பதையும் ஒப்புக்கொள்கிறேன்.'
                          : 'I understand that any false statement, omission, or misrepresentation will result in immediate disqualification of my candidature at any stage of selection.'}
                      </span>
                    </div>
                  </label>

                  {formErrors.declaration_accepted && (
                    <div className="app-field-error" style={{ marginTop: '0.5rem' }}>
                      <span>{formErrors.declaration_accepted}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Sticky Action Bar */}
          <nav className="app-action-bar" aria-label={isTa ? 'விண்ணப்ப கட்டுப்பாடுகள்' : 'Application Navigation'}>
            <div className="action-bar-inner">
              <div className="action-btn-group-left">
                <button
                  type="button"
                  className="btn-step-prev"
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                >
                  ← {isTa ? 'முந்தையது' : 'Previous'}
                </button>
              </div>

              <div className="action-btn-group-center">
                <button
                  type="button"
                  className="btn-step-save-draft"
                  onClick={handleSaveDraft}
                  title={isTa ? 'உங்கள் சாதனத்தில் வரைவாகச் சேமிக்கவும்' : 'Save current progress to local device'}
                >
                  💾 {isTa ? 'வரைவாகச் சேமி' : 'Save Draft'}
                </button>
              </div>

              <div className="action-btn-group-right">
                {currentStep < 7 ? (
                  <button
                    type="button"
                    className="btn-step-next"
                    onClick={handleNextStep}
                  >
                    <span>{isTa ? 'அடுத்த படி' : 'Next Step'}</span>
                    <span aria-hidden="true">→</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-step-review"
                    onClick={() => {
                      if (validateStep(7)) {
                        setCurrentStep(8);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }
                    }}
                  >
                    <span>{isTa ? 'முழுமையாக சரிபார்க்கவும்' : 'Review Application'}</span>
                    <span aria-hidden="true">→</span>
                  </button>
                )}
              </div>
            </div>
          </nav>
        </form>
      )}
    </div>
  );
};

export default ApplyJob;
