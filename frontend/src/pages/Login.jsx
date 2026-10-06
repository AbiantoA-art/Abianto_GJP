import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const Login = () => {
  const [role, setRole] = useState('candidate');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { isTamil } = useLanguage();

  // If redirected from registration with success notification
  const successNotice = location.state?.registeredMessage;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      const result = await login(identifier, password);

      if (result.success) {
        if (result.user?.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/candidate/dashboard', { replace: true });
        }
      } else {
        setErrorMessage(
          result.message ||
            (isTamil
              ? 'தவறான நற்சான்றிதழ்கள். மின்னஞ்சல் மற்றும் கடவுச்சொல்லை சரிபார்க்கவும்.'
              : 'Invalid credentials. Please verify your email and password.')
        );
        setSubmitting(false);
      }
    } catch (err) {
      setErrorMessage(
        err.message ||
          (isTamil
            ? 'உள்நுழைவின் போது எதிர்பாராத பிழை ஏற்பட்டது.'
            : 'An unexpected error occurred during authentication.')
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
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="auth-title">
            {role === 'admin'
              ? (isTamil ? 'நிர்வாக உள்நுழைவு' : 'Admin Login')
              : (isTamil ? 'வேட்பாளர் உள்நுழைவு' : 'Candidate Login')}
          </h1>
          <p className="auth-subtitle">
            {isTamil
              ? 'உங்கள் விண்ணப்பங்கள் மற்றும் கட்டுப்பாட்டு பலகையை அணுக உங்கள் விவரங்களை உள்ளிடவும்.'
              : 'Enter your credentials to access your applications and dashboard.'}
          </p>
        </div>

        {/* Role Toggle Tabs */}
        <div className="auth-role-tabs">
          <button
            type="button"
            className={`role-tab ${role === 'candidate' ? 'tab-active' : ''}`}
            onClick={() => {
              setRole('candidate');
              setErrorMessage('');
            }}
          >
            {isTamil ? 'வேட்பாளர் தளம்' : 'Candidate Portal'}
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'admin' ? 'tab-active' : ''}`}
            onClick={() => {
              setRole('admin');
              setErrorMessage('');
            }}
          >
            {isTamil ? 'நிர்வாக தளம்' : 'Admin Portal'}
          </button>
        </div>

        {/* Success Alert */}
        {successNotice && !errorMessage && (
          <div
            className="auth-alert-box alert-success"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--text-success, #059669)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successNotice}</span>
          </div>
        )}

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
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="auth-form" onSubmit={handleLoginSubmit}>
          <div className="form-field-group">
            <label htmlFor="auth-identifier" className="form-label">
              {isTamil ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}
            </label>
            <div className="input-with-icon form-input-wrapper">
              <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="auth-identifier"
                type="email"
                required
                placeholder={role === 'admin' ? 'admin@recruitment.gov.in' : 'candidate@example.com'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="form-input"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-field-group">
            <label htmlFor="auth-password" className="form-label">
              {isTamil ? 'கடவுச்சொல்' : 'Password'}
            </label>
            <div className="input-with-icon form-input-wrapper">
              <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="auth-password"
                type="password"
                required
                placeholder={isTamil ? 'உங்கள் கடவுச்சொல்லை உள்ளிடவும்' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="form-options-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="form-checkbox"
              />
              <span>{isTamil ? 'என்னை நினைவில் கொள்க' : 'Remember Me'}</span>
            </label>

            <button
              type="button"
              className="forgot-password-link"
              onClick={() =>
                alert(
                  isTamil
                    ? '[கடவுச்சொல் உதவி]\n\nOTP சரிபார்ப்புடன் கூடிய கடவுச்சொல் மீட்பு சேவை விரைவில் சேர்க்கப்படும்.'
                    : '[Password Assistance]\n\nSelf-service OTP password recovery will be activated soon.'
                )
              }
            >
              {isTamil ? 'கடவுச்சொல்லை மறந்துவிட்டீர்களா?' : 'Forgot Password?'}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-auth-submit"
            disabled={submitting}
          >
            {submitting
              ? (isTamil ? 'சரிபார்க்கப்படுகிறது...' : 'Verifying...')
              : (isTamil ? 'உள்நுழையவும்' : 'Sign In')}
          </button>
        </form>

        {/* Registration Link */}
        <div className="auth-footer-prompt">
          <Link to="/register" className="auth-switch-link">
            {isTamil ? 'புதிய வேட்பாளரா? பதிவு செய்யவும்' : 'New candidate? Register'}
          </Link>
        </div>

        {/* Security Notice */}
        <div className="auth-security-notice">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>
            {isTamil
              ? 'பாதுகாக்கப்பட்ட அமர்வு. உங்கள் கடவுச்சொல்லை யாருடனும் பகிர வேண்டாம்.'
              : 'Secure encrypted session. Never share your password with anyone.'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
