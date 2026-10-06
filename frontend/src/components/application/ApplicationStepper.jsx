import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * ApplicationStepper Component
 * Renders an 8-step progress stepper with completed, current, and upcoming states.
 * Switches to a compact, responsive indicator on mobile viewports.
 */
export const ApplicationStepper = ({
  steps = [],
  currentStep = 1,
  onStepClick,
  completedSteps = {},
}) => {
  const { isTamil } = useLanguage();

  const defaultSteps = [
    { id: 1, labelEn: 'Personal', labelTa: 'தனிப்பட்டவை', shortCode: '01' },
    { id: 2, labelEn: 'Contact', labelTa: 'தொடர்பு', shortCode: '02' },
    { id: 3, labelEn: 'Address', labelTa: 'முகவரி', shortCode: '03' },
    { id: 4, labelEn: 'Education', labelTa: 'கல்வி', shortCode: '04' },
    { id: 5, labelEn: 'Experience', labelTa: 'அனுபவம்', shortCode: '05' },
    { id: 6, labelEn: 'Documents', labelTa: 'ஆவணங்கள்', shortCode: '06' },
    { id: 7, labelEn: 'Declaration', labelTa: 'உறுதிமொழி', shortCode: '07' },
    { id: 8, labelEn: 'Review & Submit', labelTa: 'சரிபார்ப்பு', shortCode: '08' },
  ];

  const activeSteps = steps.length > 0 ? steps : defaultSteps;
  const currentStepObj = activeSteps.find((s) => s.id === currentStep) || activeSteps[0];
  const progressPercent = Math.round((currentStep / activeSteps.length) * 100);

  return (
    <nav className="gov-card app-stepper-container" aria-label={isTamil ? 'விண்ணப்ப படிநிலைகள்' : 'Application Steps'}>
      {/* Desktop & Tablet Horizontal Stepper */}
      <ol className="app-stepper-list">
        {activeSteps.map((step, idx) => {
          const isCompleted = Boolean(completedSteps[step.id]);
          const isCurrent = step.id === currentStep;
          const isUpcoming = !isCompleted && !isCurrent;

          let stateClass = 'step-upcoming';
          if (isCurrent) stateClass = 'step-current';
          else if (isCompleted) stateClass = 'step-completed';

          return (
            <li
              key={step.id}
              className={`app-step-item ${stateClass}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* Connector line before (except first) */}
              {idx > 0 && (
                <div
                  className={`app-step-connector ${completedSteps[step.id - 1] ? 'connector-filled' : ''}`}
                  aria-hidden="true"
                />
              )}

              <button
                type="button"
                className="app-step-btn"
                onClick={() => onStepClick && onStepClick(step.id)}
                title={isTamil ? `${step.labelTa} பகுதிக்குச் செல்லவும்` : `Go to ${step.labelEn}`}
              >
                <span className="app-step-circle">
                  {isCompleted ? (
                    <svg className="step-check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span className="step-num">{step.shortCode}</span>
                  )}
                </span>

                <span className="app-step-label-group">
                  <span className="app-step-name">
                    {isTamil ? step.labelTa : step.labelEn}
                  </span>
                  <span className="app-step-status-tag">
                    {isCurrent
                      ? (isTamil ? 'தற்போது' : 'Active')
                      : isCompleted
                      ? (isTamil ? 'முடிந்தது' : 'Complete')
                      : (isTamil ? 'நிலுவை' : 'Pending')}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Mobile Compact Stepper Indicator */}
      <div className="app-stepper-mobile">
        <div className="mobile-stepper-header">
          <div className="mobile-step-pill">
            {isTamil ? `படி ${currentStep} / ${activeSteps.length}` : `Step ${currentStep} of ${activeSteps.length}`}
          </div>
          <div className="mobile-step-title">
            {isTamil ? currentStepObj.labelTa : currentStepObj.labelEn}
          </div>
          <div className="mobile-step-percent">
            {progressPercent}%
          </div>
        </div>

        <div className="mobile-stepper-progress-track" aria-hidden="true">
          <div
            className="mobile-stepper-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Quick Mobile Navigation Dots */}
        <div className="mobile-stepper-dots" role="tablist">
          {activeSteps.map((step) => {
            const isCompleted = Boolean(completedSteps[step.id]);
            const isCurrent = step.id === currentStep;
            return (
              <button
                key={step.id}
                type="button"
                className={`mobile-dot ${isCurrent ? 'dot-active' : ''} ${isCompleted ? 'dot-completed' : ''}`}
                onClick={() => onStepClick && onStepClick(step.id)}
                aria-label={isTamil ? `${step.labelTa}` : `${step.labelEn}`}
              />
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default ApplicationStepper;
