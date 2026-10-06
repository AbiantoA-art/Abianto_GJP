import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  getCandidateApplicationById,
  withdrawApplication,
  downloadDocumentFile,
} from '../services/api';
import { ApplicationStatusBadge } from '../components/application/ApplicationStatusBadge';

export const ApplicationDetails = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const { isTamil } = useLanguage();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Withdraw Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);

  // Download state
  const [downloadingDocId, setDownloadingDocId] = useState(null);

  const loadApplication = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    const res = await getCandidateApplicationById(id, token);
    setLoading(false);

    if (res.success && res.data) {
      setApplication(res.data);
    } else {
      setError(
        res.message ||
          (isTamil
            ? 'விண்ணப்ப விவரங்களை மீட்டெடுக்க முடியவில்லை.'
            : 'Failed to retrieve application details.')
      );
    }
  }, [id, token, isTamil]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDoc = async (doc) => {
    setDownloadingDocId(doc.id);
    await downloadDocumentFile(doc.id, doc.original_filename, token);
    setDownloadingDocId(null);
  };

  const handleConfirmWithdraw = async () => {
    setWithdrawing(true);
    setWithdrawError(null);

    const res = await withdrawApplication(id, token);
    setWithdrawing(false);

    if (res.success) {
      setShowWithdrawModal(false);
      loadApplication();
    } else {
      setWithdrawError(
        res.message ||
          (isTamil
            ? 'விண்ணப்பத்தை திரும்பப் பெறுவதில் தோல்வி ஏற்பட்டது.'
            : 'Failed to withdraw application.')
      );
    }
  };

  const canWithdraw =
    application && ['submitted', 'under_review'].includes(application.status);

  if (loading) {
    return (
      <div className="section-container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="loading-spinner-portal" style={{ margin: '0 auto 1.5rem' }}></div>
        <p className="loading-text">
          {isTamil ? 'விண்ணப்ப பதிவு ஏற்றப்படுகிறது...' : 'Loading application record...'}
        </p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="section-container" style={{ padding: '4rem 1rem' }}>
        <div className="gov-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
            {isTamil ? 'விண்ணப்பம் கிடைக்கவில்லை' : 'Application Not Found'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {error || (isTamil ? 'கோரப்பட்ட விண்ணப்பத்தை ஏற்ற முடியவில்லை.' : 'Could not load requested application.')}
          </p>
          <Link to="/my-applications" className="btn-dash-primary" style={{ display: 'inline-block' }}>
            {isTamil ? 'என் விண்ணப்பங்களுக்குத் திரும்பு' : 'Back to My Applications'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container application-print-area" style={{ padding: '2.5rem 1rem' }}>
      {/* Non-print Top Controls */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link to="/my-applications" className="btn-nav btn-outline">
          {isTamil ? '← என் விண்ணப்பங்கள்' : '← My Applications'}
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-nav btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>🖨️ {isTamil ? 'அச்சிடவும்' : 'Print'}</span>
          </button>
          {canWithdraw && (
            <button
              type="button"
              onClick={() => setShowWithdrawModal(true)}
              className="btn-nav btn-outline"
              style={{ color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.4)' }}
            >
              {isTamil ? 'விண்ணப்பத்தைத் திரும்பப் பெறவும்' : 'Withdraw Application'}
            </button>
          )}
        </div>
      </div>

      {/* Main Official Application Document Container */}
      <div className="gov-card application-docket" style={{ padding: '2.5rem' }}>
        {/* Header Header Strip */}
        <div style={{
          borderBottom: '2px solid var(--border-color)',
          paddingBottom: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-primary)', fontWeight: 800 }}>
              {isTamil
                ? 'அரசுப் பணியாளர் தேர்வு தளம் • அதிகாரப்பூர்வ விண்ணப்பச் சுருக்கம்'
                : 'Government Recruitment Portal • Official Application Summary'}
            </div>
            <h1 style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: 'var(--text-primary)', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
              {application.job_title}
            </h1>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.25rem', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
              {application.job_organization} • {isTamil ? 'அறிவிப்புக் குறியீடு:' : 'Code:'} <strong>{application.job_code}</strong>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              {isTamil ? 'விண்ணப்ப எண்' : 'Application ID'}
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              fontFamily: 'monospace',
              color: 'var(--accent-primary)',
              letterSpacing: '0.04em',
            }}>
              {application.application_id}
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <ApplicationStatusBadge status={application.status} />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              {isTamil ? 'சமர்ப்பிக்கப்பட்ட தேதி: ' : 'Submitted: '}
              {new Date(application.submitted_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Section 1: Candidate Personal & Contact Profile */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: 'var(--accent-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
            {isTamil ? '1. வேட்பாளர் அடையாள மற்றும் தொடர்பு விவரங்கள்' : '1. Candidate Personal & Contact Profile'}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            background: 'var(--bg-secondary)',
            padding: '1.25rem',
            borderRadius: '8px',
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                {isTamil ? 'முழுப் பெயர்' : 'Full Name'}
              </span>
              <strong style={{ fontSize: '1rem' }}>{application.full_name}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                {isTamil ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}
              </span>
              <strong>{application.email}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                {isTamil ? 'கைபேசி எண்' : 'Mobile Number'}
              </span>
              <strong>{application.mobile_number}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                {isTamil ? 'பிறந்த தேதி' : 'Date of Birth'}
              </span>
              <strong>{application.date_of_birth}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                {isTamil ? 'பாலினம்' : 'Gender'}
              </span>
              <strong style={{ textTransform: 'capitalize' }}>
                {application.gender === 'male'
                  ? (isTamil ? 'ஆண்' : 'Male')
                  : application.gender === 'female'
                  ? (isTamil ? 'பெண்' : 'Female')
                  : application.gender || '—'}
              </strong>
            </div>
          </div>
        </section>

        {/* Section 2: Residential Address */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: 'var(--accent-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
            {isTamil ? '2. குடியிருப்பு முகவரி' : '2. Residential Address'}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            background: 'var(--bg-secondary)',
            padding: '1.25rem',
            borderRadius: '8px',
          }}>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                {isTamil ? 'முகவரி' : 'Address Line'}
              </span>
              <strong style={{ overflowWrap: 'anywhere' }}>{application.address_line}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                {isTamil ? 'நகரம்' : 'City'}
              </span>
              <strong>{application.city}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                {isTamil ? 'மாவட்டம்' : 'District'}
              </span>
              <strong>{application.district}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                {isTamil ? 'மாநிலம்' : 'State'}
              </span>
              <strong>{application.state}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                {isTamil ? 'அஞ்சல் குறியீடு எண்' : 'Pincode'}
              </span>
              <strong>{application.pincode}</strong>
            </div>
          </div>
        </section>

        {/* Section 3: Educational Qualifications */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: 'var(--accent-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
            {isTamil ? '3. கல்வித் தகுதிகள்' : '3. Educational Qualifications'}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            background: 'var(--bg-secondary)',
            padding: '1.25rem',
            borderRadius: '8px',
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                {isTamil ? 'உயர்கல்வித் தகுதி' : 'Highest Qualification'}
              </span>
              <strong>{application.highest_qualification}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                {isTamil ? 'பாடப்பிரிவு / சிறப்புப் பிரிவு' : 'Discipline / Branch'}
              </span>
              <strong>{application.qualification_details || 'N/A'}</strong>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                {isTamil ? 'பல்கலைக்கழகம் / வாரியம் / நிறுவனம்' : 'University / Board / Institution'}
              </span>
              <strong style={{ overflowWrap: 'anywhere' }}>{application.university_or_board}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                {isTamil ? 'தேர்ச்சி பெற்ற ஆண்டு' : 'Passing Year'}
              </span>
              <strong>{application.passing_year}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                {isTamil ? 'மதிப்பெண் சதவீதம் / சிஜிபிஏ' : 'Percentage / CGPA'}
              </span>
              <strong>{application.percentage_or_cgpa}</strong>
            </div>
          </div>
        </section>

        {/* Section 4: Work Experience */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: 'var(--accent-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
            {isTamil ? '4. பணி அனுபவம்' : '4. Work Experience'}
          </h2>
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '1.25rem',
            borderRadius: '8px',
          }}>
            <p>
              <strong>{isTamil ? 'நிலை:' : 'Status:'}</strong>{' '}
              <span style={{ textTransform: 'capitalize' }}>
                {application.experience_status === 'fresher'
                  ? (isTamil ? 'புதியவர் (Fresher)' : 'Fresher')
                  : application.experience_status === 'experienced'
                  ? (isTamil ? 'அனுபவம் உள்ளவர்' : 'Experienced')
                  : application.experience_status}
              </span>
            </p>
            {application.experience_details && (
              <p style={{ marginTop: '0.5rem', overflowWrap: 'anywhere' }}>
                <strong>{isTamil ? 'விவரங்கள்:' : 'Details:'}</strong> {application.experience_details}
              </p>
            )}
          </div>
        </section>

        {/* Section 5: Uploaded Candidate Documents */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: 'var(--accent-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
            {isTamil ? '5. பதிவேற்றப்பட்ட ஆவணங்கள்' : '5. Uploaded Candidate Documents'}
          </h2>
          {application.documents && application.documents.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {application.documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '1rem',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      color: 'var(--accent-primary)',
                      fontWeight: 700,
                      display: 'block',
                    }}>
                      {doc.document_type}
                    </span>
                    <strong style={{ fontSize: '0.9rem', overflowWrap: 'anywhere', wordBreak: 'break-word', display: 'block' }}>
                      {doc.original_filename}
                    </strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {(doc.file_size / 1024).toFixed(1)} KB
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadDoc(doc)}
                    disabled={downloadingDocId === doc.id}
                    className="btn-nav btn-outline no-print"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', flexShrink: 0 }}
                  >
                    {downloadingDocId === doc.id
                      ? (isTamil ? 'பதிவிறக்கப்படுகிறது...' : 'Downloading...')
                      : (isTamil ? 'பதிவிறக்கவும்' : 'Download')}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>
              {isTamil ? 'ஆவணங்கள் எதுவும் பதிவு செய்யப்படவில்லை.' : 'No documents recorded.'}
            </p>
          )}
        </section>

        {/* Section 6: Candidate Declaration */}
        <section style={{
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '8px',
          padding: '1.25rem',
        }}>
          <h2 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
            {isTamil ? '6. வேட்பாளர் உறுதிமொழி' : '6. Candidate Declaration'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6 }}>
            {isTamil
              ? '"இந்த விண்ணப்பத்தில் கொடுக்கப்பட்டுள்ள அனைத்து தகவல்களும் எனக்குத் தெரிந்தவரை உண்மையானவை மற்றும் சரியானவை என்று உறுதியளிக்கிறேன். தவறான அல்லது துல்லியமற்ற தகவல்கள் உடனடியாக தகுதி நீக்கத்திற்கு வழிவகுக்கும் என்பதை நான் புரிந்துகொள்கிறேன்."'
              : '"I hereby declare that all information provided in this application is true, complete and correct to the best of my knowledge and belief. I understand that any false or inaccurate details will lead to immediate disqualification."'}
          </p>
          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>
            {isTamil
              ? `✓ முறையாக உறுதிசெய்யப்பட்டு ஏற்கப்பட்டது: ${new Date(application.submitted_at).toLocaleString()}`
              : `✓ Formally verified and submitted: ${new Date(application.submitted_at).toLocaleString()}`}
          </div>
        </section>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="modal-backdrop-portal" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div className="gov-card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#dc2626', marginBottom: '0.75rem' }}>
              {isTamil ? 'விண்ணப்பத்தை திரும்பப் பெறுவதை உறுதிப்படுத்தவும்' : 'Confirm Application Withdrawal'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {isTamil
                ? `உங்கள் விண்ணப்பம் ${application.application_id} — ${application.job_title} ஐ திரும்பப் பெற விரும்புகிறீர்களா? இந்த செயல் நிரந்தரமானது மற்றும் மாற்ற முடியாது.`
                : `Are you sure you want to withdraw your application ${application.application_id} for ${application.job_title}? This action is permanent and cannot be reversed.`}
            </p>

            {withdrawError && (
              <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {withdrawError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="btn-nav btn-outline"
                disabled={withdrawing}
              >
                {isTamil ? 'ரத்து செய்' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdraw}
                className="btn-dash-primary"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                disabled={withdrawing}
              >
                {withdrawing
                  ? (isTamil ? 'திரும்பப் பெறப்படுகிறது...' : 'Withdrawing...')
                  : (isTamil ? 'ஆம், விண்ணப்பத்தைத் திரும்பப் பெறவும்' : 'Yes, Withdraw Application')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetails;
