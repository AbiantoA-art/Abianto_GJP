import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

/**
 * Professional Government Job Portal Hero Banner Carousel
 * Meets all requirements from Sections 4, 5, 6, 7, 8, 9, 22, 23:
 * - Uses 8 specified image assets (excluding 08_ashoka_emblem.png)
 * - 4-second auto-rotation with smooth transition
 * - Previous / Next controls with accessible aria-labels
 * - Keyboard navigation (ArrowLeft / ArrowRight)
 * - Pause on hover and keyboard focus; resumes on exit
 * - Indicator dots with keyboard accessibility
 * - Responsive sizes from 1920px down to 320px
 * - Correct React Router navigation (/jobs or /study-materials)
 * - Bilingual overlay text (Tamil & English) with high contrast in Light & Dark modes
 * - Strict timer cleanup on unmount (zero memory leaks)
 */

const CAROUSEL_SLIDES = [
  {
    id: 1,
    image: '/images/01_government_office_building.png',
    route: '/jobs',
    title: {
      ta: 'மத்திய & மாநில அரசுப் பணிகள்',
      en: 'Central & State Government Jobs',
    },
    subtitle: {
      ta: 'பல்வேறு அரசுத் துறைகளின் அதிகாரப்பூர்வ ஆட்சேர்ப்பு மற்றும் காலிப்பணியிடங்கள்',
      en: 'Official recruitment notifications and vacancies across premier ministries and departments',
    },
    badge: {
      ta: 'அதிகாரப்பூர்வ ஆட்சேர்ப்பு',
      en: 'Official Recruitment',
    },
    cta: {
      ta: 'பணிகளைக் காண்க',
      en: 'Explore Jobs',
    },
    alt: {
      ta: 'அரசு தலைமை அலுவலகக் கட்டிடம்',
      en: 'Government administrative headquarters building',
    },
  },
  {
    id: 2,
    image: '/images/02_government_employment_scene.png',
    route: '/jobs',
    title: {
      ta: 'அரசுப் பணியாளர் தேர்வு தளம்',
      en: 'Public Sector Career Opportunities',
    },
    subtitle: {
      ta: 'நாடெங்கிலும் உள்ள தகுதி வாய்ந்த பொதுத்துறை வேலைவாய்ப்புகளுக்கு நேரடியாக விண்ணப்பியுங்கள்',
      en: 'Discover verified public sector career paths with equal access and transparent selection',
    },
    badge: {
      ta: 'பொதுத்துறை வேலைவாய்ப்பு',
      en: 'Public Employment',
    },
    cta: {
      ta: 'விண்ணப்பிக்கவும்',
      en: 'Apply Now',
    },
    alt: {
      ta: 'அரசு வேலைவாய்ப்பு பணிச்சூழல்',
      en: 'Government employment and recruitment scene',
    },
  },
  {
    id: 3,
    image: '/images/03_student_studying.png',
    route: '/study-materials',
    title: {
      ta: 'போட்டித் தேர்வு தயாரிப்பு வளங்கள்',
      en: 'Competitive Examination Preparation',
    },
    subtitle: {
      ta: 'அதிகாரப்பூர்வ பாடத்திட்டம், முந்தைய ஆண்டு வினாத்தாள்கள் மற்றும் தயாரிப்புக் குறிப்புகள்',
      en: 'Access verified syllabi, 10-year question banks, and comprehensive preparation modules',
    },
    badge: {
      ta: 'படிப்பு வளங்கள்',
      en: 'Study Resources',
    },
    cta: {
      ta: 'பாடக் குறிப்புகளைப் பெறுக',
      en: 'Access Materials',
    },
    alt: {
      ta: 'போட்டித் தேர்வுக்கு தயாராகும் மாணவர்',
      en: 'Student preparing for competitive examinations',
    },
  },
  {
    id: 4,
    image: '/images/04_competitive_exam_preparation.png',
    route: '/jobs',
    title: {
      ta: 'தேர்வாணைய அறிவிப்புகள் & வழிகாட்டுதல்கள்',
      en: 'Recruitment Commission Notices',
    },
    subtitle: {
      ta: 'தேர்வு அட்டவணைகள், கல்வித் தகுதிகள் மற்றும் விண்ணப்ப முறைகள்',
      en: 'Latest exam schedules, eligibility standards, and application timelines',
    },
    badge: {
      ta: 'தேர்வு வழிகாட்டுதல்',
      en: 'Exam Guidelines',
    },
    cta: {
      ta: 'விவரங்களை அறிக',
      en: 'View Notifications',
    },
    alt: {
      ta: 'போட்டித் தேர்வு தயாரிப்பு குழு',
      en: 'Candidates engaged in examination preparation',
    },
  },
  {
    id: 5,
    image: '/images/05_job_interview.png',
    route: '/jobs',
    title: {
      ta: 'நேர்முகத் தேர்வு & தகுதி பட்டியல்',
      en: 'Interviews & Merit Selection',
    },
    subtitle: {
      ta: 'வெளிப்படையான தகுதி அடிப்படையிலான தேர்வு நிலைகள் மற்றும் அதிகாரப்பூர்வ அறிவுறுத்தல்கள்',
      en: 'Merit-based candidate evaluations and verified interview schedules',
    },
    badge: {
      ta: 'நேர்முகத் தேர்வு',
      en: 'Selection Process',
    },
    cta: {
      ta: 'அட்டவணை காண்க',
      en: 'Check Schedules',
    },
    alt: {
      ta: 'அரசுப் பணி நேர்முகத் தேர்வு குழு',
      en: 'Official recruitment interview panel',
    },
  },
  {
    id: 6,
    image: '/images/06_job_application_submission.png',
    route: '/jobs',
    title: {
      ta: 'எளிய இணைய விண்ணப்ப முறை',
      en: 'Seamless Online Application Process',
    },
    subtitle: {
      ta: 'ஒற்றை முறை பதிவு, ஆவணப் பதிவேற்றம் மற்றும் நிகழ்நேர விண்ணப்ப கண்காணிப்பு',
      en: 'One-time registration, digital document uploads, and live application status tracking',
    },
    badge: {
      ta: 'இணைய விண்ணப்பம்',
      en: 'Online Submission',
    },
    cta: {
      ta: 'பதிவு செய்க',
      en: 'Apply Online',
    },
    alt: {
      ta: 'இணைய வழி விண்ணப்ப சமர்ப்பிப்பு',
      en: 'Candidate submitting digital job application',
    },
  },
  {
    id: 7,
    image: '/images/07_career_success.png',
    route: '/jobs',
    title: {
      ta: 'பாதுகாப்பான அரசுப் பணி எதிர்காலம்',
      en: 'Rewarding Public Sector Careers',
    },
    subtitle: {
      ta: 'உங்கள் தகுதிக்குரிய அரசுப் பணியை அடைந்து பெருமையுடன் தேசத்திற்குச் சேவையாற்றுங்கள்',
      en: 'Achieve career stability and serve the nation with honor through public employment',
    },
    badge: {
      ta: 'வெற்றிப் பாதை',
      en: 'Career Success',
    },
    cta: {
      ta: 'பணிகளைத் தேடுக',
      en: 'Search Vacancies',
    },
    alt: {
      ta: 'வெற்றிகரமான அரசுப் பணி நியமனம்',
      en: 'Successful candidates celebrating public service appointment',
    },
  },
  {
    id: 8,
    image: '/images/09_professional_study_workspace.png',
    route: '/study-materials',
    title: {
      ta: 'டிஜிட்டல் படிப்பு நூலகம்',
      en: 'Digital Resource Library',
    },
    subtitle: {
      ta: 'தேர்வுகளுக்கான பாடத்திட்டம் மற்றும் பாடக் குறிப்புகளை இலவசமாகப் பதிவிறக்குங்கள்',
      en: 'Curated official exam syllabi and revision modules ready for instant download',
    },
    badge: {
      ta: 'டிஜிட்டல் நூலகம்',
      en: 'Resource Hub',
    },
    cta: {
      ta: 'நூலகத்தை அணுகுக',
      en: 'Download Resources',
    },
    alt: {
      ta: 'தொழில்முறை படிப்புப் பணிச்சூழல்',
      en: 'Professional study workspace and learning materials',
    },
  },
];

export const HomeCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { isTamil } = useLanguage();
  const navigate = useNavigate();
  const carouselRef = useRef(null);

  const totalSlides = CAROUSEL_SLIDES.length;

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  }, [totalSlides]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  }, [totalSlides]);

  const goToSlide = (idx) => {
    setCurrentIndex(idx);
  };

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      goToNext();
    }, 4000);

    return () => clearInterval(timer);
  }, [isPaused, goToNext]);

  // Keyboard navigation within the carousel
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNext();
    }
  };

  const handleSlideClick = (route) => {
    navigate(route);
  };

  const currentSlide = CAROUSEL_SLIDES[currentIndex];

  return (
    <div
      ref={carouselRef}
      className="gov-home-carousel-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label={isTamil ? 'அரசுப் பணி முகப்பு சுழல் பலகை' : 'Government Job Portal Feature Carousel'}
    >
      {/* Slides Viewport */}
      <div className="gov-carousel-viewport">
        {CAROUSEL_SLIDES.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={slide.id}
              className={`gov-carousel-slide ${isActive ? 'slide-active' : ''}`}
              aria-hidden={!isActive}
              onClick={() => handleSlideClick(slide.route)}
              role="button"
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(e) => {
                if (isActive && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleSlideClick(slide.route);
                }
              }}
              title={
                isTamil
                  ? `${slide.title.ta} - செல்ல கிளிக் செய்க`
                  : `${slide.title.en} - Click to navigate`
              }
            >
              <img
                src={slide.image}
                alt={isTamil ? slide.alt.ta : slide.alt.en}
                className="gov-carousel-img"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />

              {/* Gradient Scrim & Content Overlay */}
              <div className="gov-carousel-overlay">
                <div className="gov-carousel-content">
                  <span className="gov-carousel-badge">
                    {isTamil ? slide.badge.ta : slide.badge.en}
                  </span>
                  <h3 className="gov-carousel-title">
                    {isTamil ? slide.title.ta : slide.title.en}
                  </h3>
                  <p className="gov-carousel-subtitle">
                    {isTamil ? slide.subtitle.ta : slide.subtitle.en}
                  </p>
                  <span className="gov-carousel-cta-btn">
                    <span>{isTamil ? slide.cta.ta : slide.cta.en}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Controls: Previous Button */}
      <button
        type="button"
        className="gov-carousel-nav-btn btn-prev"
        onClick={(e) => {
          e.stopPropagation();
          goToPrev();
        }}
        aria-label={isTamil ? 'முந்தைய படம்' : 'Previous image'}
        title={isTamil ? 'முந்தைய படம்' : 'Previous image'}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Navigation Controls: Next Button */}
      <button
        type="button"
        className="gov-carousel-nav-btn btn-next"
        onClick={(e) => {
          e.stopPropagation();
          goToNext();
        }}
        aria-label={isTamil ? 'அடுத்த படம்' : 'Next image'}
        title={isTamil ? 'அடுத்த படம்' : 'Next image'}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Pagination Indicator Dots */}
      <div
        className="gov-carousel-dots"
        role="tablist"
        aria-label={isTamil ? 'சுழல் பலகை நிலைக் குறிகாட்டிகள்' : 'Carousel slide indicators'}
      >
        {CAROUSEL_SLIDES.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`gov-carousel-dot ${isActive ? 'dot-active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(idx);
              }}
              aria-label={
                isTamil
                  ? `படம் ${idx + 1}: ${slide.title.ta}`
                  : `Slide ${idx + 1}: ${slide.title.en}`
              }
              title={
                isTamil
                  ? `படம் ${idx + 1}`
                  : `Slide ${idx + 1}`
              }
            />
          );
        })}
      </div>
    </div>
  );
};

export default HomeCarousel;
