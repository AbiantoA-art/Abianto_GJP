import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    acceptDeclaration: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const navigate = useNavigate();
  const { register } = useAuth();
  const { isTamil } = useLanguage();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors([]);

    // Date of Birth validation
    const todayString = new Date().toISOString().split('T')[0];
    if (!formData.dateOfBirth) {
      setErrorMessage(
        isTamil
          ? 'உங்கள் பிறந்த தேதியை உள்ளிடவும்.'
          : 'Please enter your date of birth.'
      );
      return;
    }

    if (formData.dateOfBirth > todayString) {
      setErrorMessage(
        isTamil
          ? 'பிறந்த தேதி எதிர்கால தேதியாக இருக்கக்கூடாது.'
          : 'Date of birth cannot be in the future.'
      );
      return;
    }

    // Passwords match validation
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage(
        isTamil
          ? 'கடவுச்சொற்கள் பொருந்தவில்லை. ஒரே மாதிரியான கடவுச்சொற்களை உள்ளிடவும்.'
          : 'Passwords do not match. Please enter matching passwords.'
      );
      return;
    }

    if (formData.password.length < 8 || !/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      setErrorMessage(
        isTamil
          ? 'கடவுச்சொல் குறைந்தது 8 எழுத்துகளைக் கொண்டிருக்க வேண்டும் (எழுத்துகள் மற்றும் எண்கள் தேவை).'
          : 'Password must be at least 8 characters long (including letters and numbers).'
      );
      return;
    }

    if (!formData.acceptDeclaration) {
      setErrorMessage(
        isTamil
          ? 'பதிவைத் தொடர வேட்பாளர் உறுதிமொழியை ஏற்கவும்.'
          : 'Please accept the candidate declaration to proceed with registration.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await register({
        fullName: formData.fullName,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (response.success) {
        // Redirect to Login with success prompt
        navigate('/login', {
          state: {
            registeredMessage: isTamil
              ? 'பதிவு வெற்றிகரமாக முடிந்தது! உங்கள் மின்னஞ்சல் மற்றும் கடவுச்சொல்லுடன் உள்நுழையவும்.'
              : 'Registration completed successfully! Please sign in with your email and password.',
          },
          replace: true,
        });
      } else {
        setErrorMessage(
          response.message || (isTamil ? 'பதிவு தோல்வியடைந்தது.' : 'Registration failed.')
        );
        if (response.errors && Array.isArray(response.errors)) {
          setFieldErrors(response.errors);
        }
        setSubmitting(false);
      }
    } catch (err) {
      setErrorMessage(
        err.message ||
          (isTamil
            ? 'பதிவின் போது எதிர்பாராத பிழை ஏற்பட்டது.'
            : 'An unexpected error occurred during registration.')
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card gov-card">
        {/* Top Header */}
        <div className="auth-header">
          <div className="auth-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <h1 className="auth-title">
            {isTamil ? 'வேட்பாளர் ஒருமுறை பதிவு' : 'Candidate One-Time Registration'}
          </h1>
          <p className="auth-subtitle">
            {isTamil
              ? 'மத்திய மற்றும் மாநில அரசு பணிகளுக்கு விண்ணப்பிக்க உங்கள் நிரந்தர வேட்பாளர் சுயவிவரத்தை உருவாக்குங்கள்.'
              : 'Create your permanent candidate profile to apply for central and state government recruitment opportunities.'}
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div
            className="auth-alert-box alert-danger"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--text-danger, #dc2626)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <div>{errorMessage}</div>
              {fieldErrors.length > 0 && (
                <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                  {fieldErrors.map((err, idx) => (
                    <li key={idx}>{err.message}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Register Form */}
        <form className="auth-form" onSubmit={handleRegisterSubmit}>
          {/* Full Name */}
          <div className="form-field-group">
            <label htmlFor="reg-fullname" className="form-label">
              {isTamil ? 'முழுப் பெயர்' : 'Full Name'}{' '}
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                {isTamil ? '(10ஆம் வகுப்பு / மதிப்பெண் சான்றிதழில் உள்ள பெயரின்படி)' : '(As per 10th Class / Certificate)'}
              </span>
            </label>
            <div className="input-with-icon form-input-wrapper">
              <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="reg-fullname"
                name="fullName"
                type="text"
                required
                placeholder={isTamil ? 'எ.கா. அருண் குமார்' : 'e.g. Arun Kumar'}
                value={formData.fullName}
                onChange={handleChange}
                className="form-input"
                autoComplete="name"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="form-field-group">
            <label htmlFor="reg-email" className="form-label">
              {isTamil ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}
            </label>
            <div className="input-with-icon form-input-wrapper">
              <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                id="reg-email"
                name="email"
                type="email"
                required
                placeholder={isTamil ? 'எ.கா. candidate@example.com' : 'e.g. candidate@example.com'}
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div className="form-field-group">
            <label htmlFor="reg-dob" className="form-label">
              {isTamil ? 'பிறந்த தேதி' : 'Date of Birth'}{' '}
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                {isTamil ? '(10ஆம் வகுப்பு / பிறப்புச் சான்றிதழின்படி)' : '(As per 10th Certificate / Birth Record)'}
              </span>
            </label>
            <div className="input-with-icon form-input-wrapper">
              <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <input
                id="reg-dob"
                name="dateOfBirth"
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                min="1920-01-01"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="form-input form-input-date"
                autoComplete="bday"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-field-group">
            <label htmlFor="reg-password" className="form-label">
              {isTamil ? 'கடவுச்சொல்' : 'Password'}{' '}
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                {isTamil ? '(குறைந்தது 8 எழுத்துகள்)' : '(Min 8 characters)'}
              </span>
            </label>
            <div className="input-with-icon form-input-wrapper">
              <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="reg-password"
                name="password"
                type="password"
                required
                placeholder={isTamil ? 'குறைந்தது 8 எழுத்துகள் (எழுத்து மற்றும் எண்)' : 'Min 8 characters (alphanumeric)'}
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-field-group">
            <label htmlFor="reg-confirmpassword" className="form-label">
              {isTamil ? 'கடவுச்சொல்லை உறுதிப்படுத்தவும்' : 'Confirm Password'}
            </label>
            <div className="input-with-icon form-input-wrapper">
              <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="reg-confirmpassword"
                name="confirmPassword"
                type="password"
                required
                placeholder={isTamil ? 'கடவுச்சொல்லை மீண்டும் உள்ளிடவும்' : 'Re-enter your password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Candidate Declaration */}
          <div className="form-declaration-wrap">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="acceptDeclaration"
                checked={formData.acceptDeclaration}
                onChange={handleChange}
                className="form-checkbox"
                required
              />
              <span className="declaration-text">
                {isTamil
                  ? 'நான் வழங்கிய அனைத்து தகவல்களும் எனது அறிவுக்கு எட்டிய வரை உண்மையானவை மற்றும் சரியானவை என உறுதி கூறுகிறேன்.'
                  : 'I hereby declare that all information submitted is true, complete and correct to the best of my knowledge.'}
              </span>
            </label>
          </div>

          {/* Register Button */}
          <button
            type="submit"
            className="btn-auth-submit"
            disabled={submitting}
          >
            {submitting
              ? (isTamil ? 'பதிவு செய்யப்படுகிறது...' : 'Registering...')
              : (isTamil ? 'பதிவு செய்யவும்' : 'Register')}
          </button>
        </form>

        {/* Login Link */}
        <div className="auth-footer-prompt">
          <Link to="/login" className="auth-switch-link">
            {isTamil ? 'ஏற்கனவே கணக்கு உள்ளதா? உள்நுழையவும்' : 'Already have an account? Sign In'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
