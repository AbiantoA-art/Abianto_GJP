/**
 * Government Job Portal - Bilingual Localization System (Tamil & English)
 * Complete official terminology dictionary supporting both:
 * - Tamil (தமிழ்) ['ta'] (Default)
 * - English ['en']
 *
 * Preserves all backend database values, IDs, slugs, and API parameters.
 */

// Initial language detection from localStorage
let currentGlobalLanguage = 'ta';
if (typeof window !== 'undefined' && window.localStorage) {
  const saved = window.localStorage.getItem('gov_job_portal_language');
  if (saved === 'en' || saved === 'ta') {
    currentGlobalLanguage = saved;
  }
}

export const getGlobalLanguage = () => currentGlobalLanguage;
export const setGlobalLanguage = (lang) => {
  if (lang === 'en' || lang === 'ta') {
    currentGlobalLanguage = lang;
  }
};

/* =========================================================================
   CATEGORY TRANSLATIONS (All 24 Categories)
   ========================================================================= */

const CATEGORY_DICTS = {
  ta: {
    'upsc': 'யுபிஎஸ்சி',
    'UPSC': 'யுபிஎஸ்சி',
    'ssc': 'எஸ்எஸ்சி',
    'SSC': 'எஸ்எஸ்சி',
    'banking': 'வங்கி',
    'Banking': 'வங்கி',
    'railway': 'ரயில்வே',
    'Railway': 'ரயில்வே',
    'defence': 'பாதுகாப்புத் துறை',
    'Defence': 'பாதுகாப்புத் துறை',
    'police': 'காவல்துறை',
    'Police': 'காவல்துறை',
    'teaching': 'கற்பித்தல்',
    'Teaching': 'கற்பித்தல்',
    'medical': 'மருத்துவம்',
    'Medical': 'மருத்துவம்',
    'engineering': 'பொறியியல்',
    'Engineering': 'பொறியியல்',
    'it-computer': 'தகவல் தொழில்நுட்பம் / கணினி',
    'IT / Computer': 'தகவல் தொழில்நுட்பம் / கணினி',
    'central-govt': 'மத்திய அரசு',
    'Central Government': 'மத்திய அரசு',
    'state-govt': 'மாநில அரசு',
    'State Government': 'மாநில அரசு',
    'tamil-nadu-govt': 'தமிழ்நாடு அரசு',
    'Tamil Nadu Government': 'தமிழ்நாடு அரசு',
    'postal': 'அஞ்சல் துறை',
    'Postal': 'அஞ்சல் துறை',
    'psu': 'பொதுத்துறை நிறுவனங்கள்',
    'PSU': 'பொதுத்துறை நிறுவனங்கள்',
    'research': 'ஆராய்ச்சி',
    'Research': 'ஆராய்ச்சி',
    'court-judiciary': 'நீதிமன்றம் / நீதித்துறை',
    'Court / Judiciary': 'நீதிமன்றம் / நீதித்துறை',
    'forest-dept': 'வனத்துறை',
    'Forest Department': 'வனத்துறை',
    'revenue-dept': 'வருவாய்த்துறை',
    'Revenue Department': 'வருவாய்த்துறை',
    'electricity-board': 'மின்சார வாரியம்',
    'Electricity Board': 'மின்சார வாரியம்',
    'transport-dept': 'போக்குவரத்துத் துறை',
    'Transport Department': 'போக்குவரத்துத் துறை',
    'municipal-local': 'மாநகராட்சி / உள்ளாட்சி',
    'Municipal / Local Government': 'மாநகராட்சி / உள்ளாட்சி',
    'apprentice': 'பயிற்சியாளர் பணிகள்',
    'Apprentice': 'பயிற்சியாளர் பணிகள்',
    'other-govt-jobs': 'பிற அரசு பணிகள்',
    'Other Government Jobs': 'பிற அரசு பணிகள்',
  },
  en: {
    'upsc': 'UPSC',
    'UPSC': 'UPSC',
    'யுபிஎஸ்சி': 'UPSC',
    'ssc': 'SSC',
    'SSC': 'SSC',
    'எஸ்எஸ்சி': 'SSC',
    'banking': 'Banking',
    'Banking': 'Banking',
    'வங்கி': 'Banking',
    'railway': 'Railway',
    'Railway': 'Railway',
    'ரயில்வே': 'Railway',
    'defence': 'Defence',
    'Defence': 'Defence',
    'பாதுகாப்புத் துறை': 'Defence',
    'police': 'Police',
    'Police': 'Police',
    'காவல்துறை': 'Police',
    'teaching': 'Teaching',
    'Teaching': 'Teaching',
    'கற்பித்தல்': 'Teaching',
    'medical': 'Medical',
    'Medical': 'Medical',
    'மருத்துவம்': 'Medical',
    'engineering': 'Engineering',
    'Engineering': 'Engineering',
    'பொறியியல்': 'Engineering',
    'it-computer': 'IT / Computer',
    'IT / Computer': 'IT / Computer',
    'தகவல் தொழில்நுட்பம் / கணினி': 'IT / Computer',
    'central-govt': 'Central Government',
    'Central Government': 'Central Government',
    'மத்திய அரசு': 'Central Government',
    'state-govt': 'State Government',
    'State Government': 'State Government',
    'மாநில அரசு': 'State Government',
    'tamil-nadu-govt': 'Tamil Nadu Government',
    'Tamil Nadu Government': 'Tamil Nadu Government',
    'தமிழ்நாடு அரசு': 'Tamil Nadu Government',
    'postal': 'Postal',
    'Postal': 'Postal',
    'அஞ்சல் துறை': 'Postal',
    'psu': 'PSU',
    'PSU': 'PSU',
    'PSU / Public Sector': 'PSU',
    'பொதுத்துறை நிறுவனங்கள்': 'PSU',
    'research': 'Research',
    'Research': 'Research',
    'ஆராய்ச்சி': 'Research',
    'court-judiciary': 'Court / Judiciary',
    'Court / Judiciary': 'Court / Judiciary',
    'நீதிமன்றம் / நீதித்துறை': 'Court / Judiciary',
    'forest-dept': 'Forest Department',
    'Forest Department': 'Forest Department',
    'வனத்துறை': 'Forest Department',
    'revenue-dept': 'Revenue Department',
    'Revenue Department': 'Revenue Department',
    'வருவாய்த்துறை': 'Revenue Department',
    'electricity-board': 'Electricity Board',
    'Electricity Board': 'Electricity Board',
    'மின்சார வாரியம்': 'Electricity Board',
    'transport-dept': 'Transport Department',
    'Transport Department': 'Transport Department',
    'போக்குவரத்துத் துறை': 'Transport Department',
    'municipal-local': 'Municipal / Local Government',
    'Municipal / Local Government': 'Municipal / Local Government',
    'மாநகராட்சி / உள்ளாட்சி': 'Municipal / Local Government',
    'apprentice': 'Apprentice',
    'Apprentice': 'Apprentice',
    'பயிற்சியாளர் பணிகள்': 'Apprentice',
    'other-govt-jobs': 'Other Government Jobs',
    'Other Government Jobs': 'Other Government Jobs',
    'பிற அரசு பணிகள்': 'Other Government Jobs',
  },
};

export const CATEGORY_TRANSLATIONS = new Proxy(CATEGORY_DICTS, {
  get(target, prop) {
    if (prop === 'ta' || prop === 'en') return target[prop];
    const activeLang = currentGlobalLanguage || 'ta';
    const dict = target[activeLang] || target.ta;
    return dict[prop] || target.ta[prop];
  },
});

/* =========================================================================
   STATUS TRANSLATIONS
   ========================================================================= */

const STATUS_DICTS = {
  ta: {
    'submitted': 'சமர்ப்பிக்கப்பட்டது',
    'Submitted': 'சமர்ப்பிக்கப்பட்டது',
    'under_review': 'பரிசீலனையில்',
    'Under Review': 'பரிசீலனையில்',
    'shortlisted': 'தேர்வுப் பட்டியலில்',
    'Shortlisted': 'தேர்வுப் பட்டியலில்',
    'selected': 'தேர்ந்தெடுக்கப்பட்டது',
    'Selected': 'தேர்ந்தெடுக்கப்பட்டது',
    'rejected': 'நிராகரிக்கப்பட்டது',
    'Rejected': 'நிராகரிக்கப்பட்டது',
    'withdrawn': 'திரும்பப் பெறப்பட்டது',
    'Withdrawn': 'திரும்பப் பெறப்பட்டது',
    'published': 'வெளியிடப்பட்டது',
    'Published': 'வெளியிடப்பட்டது',
    'draft': 'வரைவு',
    'Draft': 'வரைவு',
    'closed': 'முடிவடைந்தது',
    'Closed': 'முடிவடைந்தது',
    'archived': 'காப்பகப்படுத்தப்பட்டது',
    'Archived': 'காப்பகப்படுத்தப்பட்டது',
    'active': 'செயலில்',
    'Active': 'செயலில்',
    'inactive': 'செயலற்றது',
    'Inactive': 'செயலற்றது',
    'unread': 'படிக்காதவை',
    'Unread': 'படிக்காதவை',
    'read': 'படித்தவை',
    'Read': 'படித்தவை',
  },
  en: {
    'submitted': 'Submitted',
    'Submitted': 'Submitted',
    'சமர்ப்பிக்கப்பட்டது': 'Submitted',
    'under_review': 'Under Review',
    'Under Review': 'Under Review',
    'பரிசீலனையில்': 'Under Review',
    'shortlisted': 'Shortlisted',
    'Shortlisted': 'Shortlisted',
    'தேர்வுப் பட்டியலில்': 'Shortlisted',
    'selected': 'Selected',
    'Selected': 'Selected',
    'தேர்ந்தெடுக்கப்பட்டது': 'Selected',
    'rejected': 'Rejected',
    'Rejected': 'Rejected',
    'நிராகரிக்கப்பட்டது': 'Rejected',
    'withdrawn': 'Withdrawn',
    'Withdrawn': 'Withdrawn',
    'திரும்பப் பெறப்பட்டது': 'Withdrawn',
    'published': 'Published',
    'Published': 'Published',
    'வெளியிடப்பட்டது': 'Published',
    'draft': 'Draft',
    'Draft': 'Draft',
    'வரைவு': 'Draft',
    'closed': 'Closed',
    'Closed': 'Closed',
    'முடிவடைந்தது': 'Closed',
    'archived': 'Archived',
    'Archived': 'Archived',
    'காப்பகப்படுத்தப்பட்டது': 'Archived',
    'active': 'Active',
    'Active': 'Active',
    'செயலில்': 'Active',
    'inactive': 'Inactive',
    'Inactive': 'Inactive',
    'செயலற்றது': 'Inactive',
    'unread': 'Unread',
    'Unread': 'Unread',
    'படிக்காதவை': 'Unread',
    'read': 'Read',
    'Read': 'Read',
    'படித்தவை': 'Read',
  },
};

export const STATUS_TRANSLATIONS = new Proxy(STATUS_DICTS, {
  get(target, prop) {
    if (prop === 'ta' || prop === 'en') return target[prop];
    const activeLang = currentGlobalLanguage || 'ta';
    const dict = target[activeLang] || target.ta;
    return dict[prop] || target.ta[prop];
  },
});

/* =========================================================================
   NOTIFICATION TYPE TRANSLATIONS
   ========================================================================= */

const NOTIFICATION_DICTS = {
  ta: {
    'new_job': 'புதிய வேலைவாய்ப்பு',
    'application_status': 'விண்ணப்ப நிலை',
    'deadline': 'காலக்கெடு அறிவிப்பு',
    'study_material': 'படிப்பு வளங்கள்',
    'syllabus': 'பாடத்திட்டம்',
    'announcement': 'பொது அறிவிப்பு',
    'system': 'கணினி அறிவிப்பு',
  },
  en: {
    'new_job': 'New Job Alert',
    'application_status': 'Application Status',
    'deadline': 'Deadline Alert',
    'study_material': 'Study Resources',
    'syllabus': 'Syllabus',
    'announcement': 'Announcement',
    'system': 'System Alert',
  },
};

export const NOTIFICATION_TYPE_TRANSLATIONS = new Proxy(NOTIFICATION_DICTS, {
  get(target, prop) {
    if (prop === 'ta' || prop === 'en') return target[prop];
    const activeLang = currentGlobalLanguage || 'ta';
    const dict = target[activeLang] || target.ta;
    return dict[prop] || target.ta[prop];
  },
});

/* =========================================================================
   JOB GROUP TRANSLATIONS (Group 1, 2, 2A, 3, 4)
   ========================================================================= */

const JOB_GROUP_DICTS = {
  ta: {
    'ALL': 'அனைத்து குழுக்களும்',
    'ALL_GROUPS': 'அனைத்து குழுக்களும்',
    'All Groups': 'அனைத்து குழுக்களும்',
    'GROUP_1': 'குழு 1',
    'Group 1': 'குழு 1',
    'GROUP_2': 'குழு 2',
    'Group 2': 'குழு 2',
    'GROUP_2A': 'குழு 2A',
    'Group 2A': 'குழு 2A',
    'GROUP_3': 'குழு 3',
    'Group 3': 'குழு 3',
    'GROUP_4': 'குழு 4',
    'Group 4': 'குழு 4',
    'None': 'எதுவுமில்லை',
    'NONE': 'எதுவுமில்லை',
  },
  en: {
    'ALL': 'All Groups',
    'ALL_GROUPS': 'All Groups',
    'All Groups': 'All Groups',
    'GROUP_1': 'Group 1',
    'Group 1': 'Group 1',
    'GROUP_2': 'Group 2',
    'Group 2': 'Group 2',
    'GROUP_2A': 'Group 2A',
    'Group 2A': 'Group 2A',
    'GROUP_3': 'Group 3',
    'Group 3': 'Group 3',
    'GROUP_4': 'Group 4',
    'Group 4': 'Group 4',
    'None': 'None',
    'NONE': 'None',
  },
};

export const JOB_GROUP_TRANSLATIONS = new Proxy(JOB_GROUP_DICTS, {
  get(target, prop) {
    if (prop === 'ta' || prop === 'en') return target[prop];
    const activeLang = currentGlobalLanguage || 'ta';
    const dict = target[activeLang] || target.ta;
    return dict[prop] || target.ta[prop];
  },
});

export const EXAM_GROUP_DICTS = JOB_GROUP_DICTS;

export const MATERIAL_TYPE_DICTS = {
  ta: {
    'all': 'அனைத்து வகைகளும்',
    'study_material': 'படிப்பு பொருட்கள்',
    'syllabus': 'அதிகாரப்பூர்வ பாடத்திட்டம்',
    'exam_pattern': 'தேர்வு முறை',
    'question_paper': 'முந்தைய ஆண்டு வினாத்தாள்கள்',
    'notification': 'அறிவிப்புகள்',
    'answer_key': 'விடைக்குறிப்புகள்',
    'current_affairs': 'நடப்பு நிகழ்வுகள்',
    'practice_material': 'பயிற்சிப் பொருட்கள்',
  },
  en: {
    'all': 'All Types',
    'study_material': 'Study Material',
    'syllabus': 'Official Syllabus',
    'exam_pattern': 'Exam Pattern',
    'question_paper': 'Question Paper',
    'notification': 'Notification',
    'answer_key': 'Answer Key',
    'current_affairs': 'Current Affairs',
    'practice_material': 'Practice Material',
  },
};

export const LANGUAGE_DICTS = {
  ta: {
    'ALL': 'அனைத்து மொழிகளும்',
    'TAMIL': 'தமிழ்',
    'ENGLISH': 'ஆங்கிலம்',
    'ta': 'தமிழ்',
    'en': 'ஆங்கிலம்',
  },
  en: {
    'ALL': 'All Languages',
    'TAMIL': 'Tamil',
    'ENGLISH': 'English',
    'ta': 'Tamil',
    'en': 'English',
  },
};

/* =========================================================================
   UI STRINGS (BILINGUAL DICTIONARY)
   ========================================================================= */

const UI_STRINGS_TA = {
  // Branding & Global
  portalTitle: 'GOVERNMENT JOB PORTAL',
  portalSubtitle: 'அரசுப் பணியாளர் தேர்வு மற்றும் வேலைவாய்ப்பு தளம்',
  portalTagline: 'மத்திய மற்றும் மாநில அரசுகளின் அமைச்சகங்கள், துறைகள் மற்றும் பொதுத்துறை நிறுவனங்களின் வேலைவாய்ப்புகளைக் கண்டறிந்து விண்ணப்பிப்பதற்கான அதிகாரப்பூர்வ தளம்.',
  emblemAlt: 'இந்திய அரசுச் சின்னம்',
  topStripPublicPortal: 'அதிகாரப்பூர்வ அரசு பணியாளர் தேர்வு தளம்',
  topStripDirectory: 'இந்திய அரசு / மாநில அரசு சேவைகள் அடைவு',
  candidatePortal: 'வேட்பாளர் தளம்',
  adminPortal: 'நிர்வாக தளம்',

  // Navigation
  navHome: 'முகப்பு',
  navJobs: 'அரசுப் பணிகள்',
  navStudyMaterials: 'படிப்பு வளங்கள்',
  navSyllabus: 'பாடத்திட்டம்',
  navAbout: 'எங்களைப் பற்றி',
  navSignIn: 'உள்நுழைவு',
  navRegister: 'பதிவு',
  navSignOut: 'வெளியேறு',
  navMyApplications: 'என் விண்ணப்பங்கள்',
  navNotifications: 'அறிவிப்புகள்',
  navAdminConsole: 'நிர்வாக கன்சோல்',
  navDashboard: 'கட்டுப்பாட்டு பலகை',
  themeDark: 'இருண்ட பயன்முறை',
  themeLight: 'ஒளி பயன்முறை',
  switchLangTamil: 'மொழியை தமிழுக்கு மாற்றவும்',
  switchLangEnglish: 'Switch language to English',

  // Common Actions & States
  loading: 'ஏற்றப்படுகிறது...',
  loadingVacancies: 'அரசுப் பணிகள் ஏற்றப்படுகிறது...',
  somethingWentWrong: 'ஏதோ ஒரு சிக்கல் ஏற்பட்டுள்ளது',
  tryAgain: 'மீண்டும் முயற்சிக்கவும்',
  retryRequest: 'மீண்டும் முயற்சிக்கவும்',
  noJobsFound: 'பணிகள் எதுவும் கிடைக்கவில்லை',
  noJobsFoundDesc: 'உங்கள் தேடல் நிபந்தனைகளுக்குப் பொருந்தும் அரசுப் பணிகள் எதுவும் கிடைக்கவில்லை. தேடல் சொற்களை மாற்றவும் அல்லது வடிப்பான்களை அழிக்கவும்.',
  viewDetails: 'விவரங்களைக் காண்க',
  apply: 'விண்ணப்பிக்கவும்',
  applyNow: 'விண்ணப்பிக்கவும்',
  applyOnline: 'ஆன்லைனில் விண்ணப்பிக்கவும்',
  alreadyApplied: 'ஏற்கனவே விண்ணப்பிக்கப்பட்டது',
  alreadyAppliedView: '✓ ஏற்கனவே விண்ணப்பிக்கப்பட்டது (காண்க)',
  deadlinePassed: 'காலக்கெடு முடிந்தது',
  closingSoon: 'விண்ணப்ப முடிவு நெருங்குகிறது',
  closingSoonBadge: 'காலக்கெடு நெருங்குகிறது',
  publishedBadge: 'வெளியிடப்பட்டது',
  verifiedBadge: 'சரிபார்க்கப்பட்ட அதிகாரப்பூர்வ அறிவிப்பு',
  posts: 'பணியிடங்கள்',
  vacancies: 'காலிப்பணியிடங்கள்',
  location: 'பணியிடம்',
  salary: 'சம்பளம் / ஊதிய அளவு',
  qualification: 'கல்வித் தகுதி',
  lastDate: 'விண்ணப்பிக்க கடைசி தேதி',
  openingDate: 'விண்ணப்பம் தொடங்கும் தேதி',
  ageLimit: 'வயது வரம்பு',
  experience: 'அனுபவம்',
  applicationFee: 'விண்ணப்பக் கட்டணம்',
  selectionProcess: 'தேர்வு செயல்முறை',
  requiredDocuments: 'தேவையான ஆவணங்கள்',
  jobDescription: 'பணி விவரம்',
  officialGazette: 'அதிகாரப்பூர்வ அரசிதழ் அறிவிப்பு',
  downloadGazette: 'அதிகாரப்பூர்வ அறிவிப்பைப் பதிவிறக்குக (PDF)',
  backToAllJobs: '← அனைத்து அரசுப் பணிகளுக்கும் திரும்புக',
  allIndia: 'அனைத்திந்தியா',
  asPerRules: 'விதிகளின்படி',
  asPerGovtRules: 'அரசு ஊதிய விதிகளின்படி',
  referNotification: 'அறிவிப்பைப் பார்க்கவும்',

  // Search & Filters
  searchJobs: 'பணிகளைத் தேடுங்கள்',
  searchPlaceholder: 'பணி பெயர், நிறுவனம் அல்லது துறையைத் தேடுங்கள்...',
  category: 'வகை',
  allCategories: 'அனைத்துப் பிரிவுகளும்',
  jobGroup: 'பணி குழு',
  allGroups: 'அனைத்து குழுக்களும்',
  group1: 'குழு 1',
  group2: 'குழு 2',
  group2A: 'குழு 2A',
  group3: 'குழு 3',
  group4: 'குழு 4',
  organization: 'நிறுவனம் / அமைப்பு',
  department: 'துறை / அமைச்சகம்',
  sort: 'வரிசைப்படுத்து',
  sortLatest: 'புதியவை முதலில்',
  sortOldest: 'பழையவை முதலில்',
  sortDeadlineSoon: 'காலக்கெடு நெருங்குபவை',
  sortDeadlineLatest: 'காலக்கெடு தொலைவில் உள்ளவை',
  sortVacanciesHigh: 'அதிக காலியிடங்கள்',
  sortVacanciesLow: 'குறைந்த காலியிடங்கள்',
  filterVacancies: 'பணிகளை வடிகட்டவும்',
  clearFilters: 'வடிப்பான்களை அழிக்கவும்',
  reset: 'மீட்டமை',
  applyFilters: 'வடிப்பான்களைப் பயன்படுத்து',
  searchVacanciesBtn: 'பணிகளைத் தேடுக',
  selectLocation: 'பணியிடத்தைத் தேர்ந்தெடுக்கவும்',
  allQualifications: 'அனைத்து கல்வித் தகுதிகள்',
  locationPlaceholder: 'எ.கா. தமிழ்நாடு, சென்னை, அகில இந்திய',
  orgPlaceholder: 'எ.கா. TNPSC, UPSC, SSC, Railways',
  deptPlaceholder: 'எ.கா. வருவாய்த்துறை, கல்வித்துறை',
  startDateRange: 'தொடக்க தேதி வரம்பு',
  lastDateRange: 'விண்ணப்பிக்க கடைசி தேதி வரம்பு',
  fromDate: 'முதல்',
  toDate: 'வரை',
  hideFilters: 'வடிப்பான்களை மறை',
  showFilters: 'மேம்பட்ட வடிப்பான்களைக் காட்டு',

  // Registration Page
  regTitle: 'வேட்பாளர் ஒருமுறை பதிவு',
  regSubtitle: 'மத்திய மற்றும் மாநில அரசு பணிகளுக்கு விண்ணப்பிக்க உங்கள் நிரந்தர வேட்பாளர் சுயவிவரத்தை உருவாக்குங்கள்.',
  fullName: 'முழுப் பெயர்',
  fullNameHint: '10ஆம் வகுப்பு / மதிப்பெண் சான்றிதழில் உள்ள பெயரின்படி',
  fullNamePlaceholder: 'எ.கா. அருண் குமார்',
  emailAddress: 'மின்னஞ்சல் முகவரி',
  emailPlaceholder: 'எ.கா. candidate@example.com',
  mobileNumber: 'கைபேசி எண்',
  mobileNumberHint: 'அதிகாரப்பூர்வ SMS / அறிவிப்புகளுக்காக',
  mobilePlaceholder: '10-இலக்க கைபேசி எண்',
  password: 'கடவுச்சொல்',
  passwordHint: 'குறைந்தது 8 எழுத்துகள் (எழுத்துகள் மற்றும் எண்கள்)',
  passwordPlaceholder: 'குறைந்தது 8 எழுத்துகள் (எழுத்து மற்றும் எண்)',
  confirmPassword: 'கடவுச்சொல்லை உறுதிப்படுத்தவும்',
  confirmPasswordPlaceholder: 'கடவுச்சொல்லை மீண்டும் உள்ளிடவும்',
  regDeclaration: 'நான் வழங்கிய அனைத்து தகவல்களும் எனது அறிவுக்கு எட்டிய வரை உண்மையானவை மற்றும் சரியானவை என உறுதி கூறுகிறேன்.',
  registerButton: 'பதிவு செய்யவும்',
  registeringButton: 'பதிவு செய்யப்படுகிறது...',
  alreadyHaveAccount: 'ஏற்கனவே கணக்கு உள்ளதா? உள்நுழையவும்',

  // Login Page
  loginTitleCandidate: 'வேட்பாளர் உள்நுழைவு',
  loginTitleAdmin: 'நிர்வாக உள்நுழைவு',
  loginSubtitle: 'உங்கள் விண்ணப்பங்கள் மற்றும் கட்டுப்பாட்டு பலகையை அணுக உங்கள் விவரங்களை உள்ளிடவும்.',
  tabCandidate: 'வேட்பாளர்',
  tabAdmin: 'நிர்வாகம்',
  loginButton: 'உள்நுழையவும்',
  verifyingButton: 'சரிபார்க்கப்படுகிறது...',
  forgotPassword: 'கடவுச்சொல்லை மறந்துவிட்டீர்களா?',
  newCandidateRegister: 'புதிய வேட்பாளரா? பதிவு செய்யவும்',
  rememberMe: 'என்னை நினைவில் கொள்க',
  passwordInputPlaceholder: 'உங்கள் கடவுச்சொல்லை உள்ளிடவும்',
  loginSecurityNotice: 'பாதுகாக்கப்பட்ட அமர்வு. உங்கள் கடவுச்சொல்லை யாருடனும் பகிர வேண்டாம்.',

  // Applications
  myApplicationsTitle: 'என் விண்ணப்பங்கள்',
  myApplicationsSubtitle: 'உங்கள் விண்ணப்ப நிலையை கண்காணிக்கவும், விவரங்களை பார்க்கவும் மற்றும் அச்சிடவும்.',
  applicationNo: 'விண்ணப்ப எண்',
  applicationStatus: 'விண்ணப்ப நிலை',
  submittedDate: 'சமர்ப்பிக்கப்பட்ட தேதி',
  documents: 'ஆவணங்கள்',
  withdrawApplication: 'விண்ணப்பத்தைத் திரும்பப் பெறவும்',
  print: 'அச்சிடவும்',
  download: 'பதிவிறக்கவும்',
  viewAppDetails: 'விண்ணப்ப விவரங்கள்',
  candidateName: 'வேட்பாளர் பெயர்',
  noApplicationsFound: 'விண்ணப்பங்கள் எதுவும் கிடைக்கவில்லை',
  noApplicationsDesc: 'நீங்கள் இதுவரை எந்த அரசுப் பணிக்கும் விண்ணப்பிக்கவில்லை.',
  viewPublishedJobs: 'வெளியிடப்பட்ட பணிகளைக் காண்க',
  loadingApplications: 'சமர்ப்பிக்கப்பட்ட விண்ணப்பங்கள் ஏற்றப்படுகின்றன...',
  allApplications: 'அனைத்து விண்ணப்பங்களும்',
  backToMyApps: '← என் விண்ணப்பங்கள்',
  confirmWithdrawTitle: 'விண்ணப்பத்தை திரும்பப் பெறுவதை உறுதிப்படுத்தவும்',
  confirmWithdrawDesc: 'உங்கள் விண்ணப்பத்தை திரும்பப் பெற விரும்புகிறீர்களா? இந்த செயல் நிரந்தரமானது மற்றும் மாற்ற முடியாது.',
  confirmWithdrawBtn: 'ஆம், விண்ணப்பத்தைத் திரும்பப் பெறவும்',
  cancel: 'ரத்து செய்',

  // Study Materials & Syllabus
  studyMaterialsTitle: 'படிப்பு வளங்கள்',
  studyMaterialsSubtitle: 'மத்திய மற்றும் மாநில அரசுத் தேர்வுகளுக்குத் தேவையான அதிகாரப்பூர்வ பாடக் குறிப்புகள், ஆய்வு வழிகாட்டிகள் மற்றும் தயாரிப்புப் பொருட்கள்.',
  syllabusTitle: 'பாடத்திட்டம்',
  syllabusSubtitle: 'அங்கீகரிக்கப்பட்ட தேர்வு முறைகள், பாட வாரியான மதிப்பெண் திட்டங்கள், வினாத்தாள் வடிவங்கள் மற்றும் தலைப்புகள் அடங்கிய அதிகாரப்பூர்வ பாடத்திட்டம்.',
  materialsList: 'படிப்புப் பொருட்கள்',
  subjects: 'பாடங்கள்',
  syllabusDetails: 'பாடத்திட்ட விவரங்கள்',
  downloadBtn: 'பதிவிறக்கம்',
  viewBtn: 'பார்வையிட',
  searchMaterialPlaceholder: 'பாடக்குறிப்புகள், வினாத்தாள்களைத் தேடுக...',
  uploadedDate: 'பதிவேற்றப்பட்ட தேதி',
  noMaterialsFound: 'படிப்பு வளங்கள் எதுவும் கிடைக்கவில்லை',
  noMaterialsDesc: 'உங்கள் தற்போதைய தேடல் அல்லது வடிகட்டுதல் அளவுகோல்களுடன் பொருந்தக்கூடிய படிப்புப் பொருட்கள் எதுவும் இல்லை.',
  noSyllabusFound: 'பாடத்திட்ட ஆவணங்கள் எதுவும் கிடைக்கவில்லை',
  noSyllabusDesc: 'உங்கள் தற்போதைய தேடல் அல்லது வடிகட்டுதல் அளவுகோல்களுடன் பொருந்தக்கூடிய பாடத்திட்ட ஆவணங்கள் எதுவும் இல்லை.',
  examGroup: 'தேர்வு குழு',
  language: 'மொழி',
  allLanguages: 'அனைத்து மொழிகளும்',
  officialSyllabus: 'அதிகாரப்பூர்வ பாடத்திட்டம்',
  questionPapers: 'முந்தைய ஆண்டு வினாத்தாள்கள்',
  notifications: 'அறிவிப்புகள்',
  answerKeys: 'விடைக்குறிப்புகள்',
  examPattern: 'தேர்வு முறை',
  currentAffairs: 'நடப்பு நிகழ்வுகள்',
  practiceMaterials: 'பயிற்சிப் பொருட்கள்',
  officialTnpscSource: 'அதிகாரப்பூர்வ TNPSC',
  officialGovtSource: 'அதிகாரப்பூர்வ அரசு மூலம்',
  officialSource: 'அதிகாரப்பூர்வ மூலம்',
  readView: 'பார்வையிட',
  download: 'பதிவிறக்கம்',
  sourceUrl: 'அதிகாரப்பூர்வ இணைப்பு',
  allMaterialTypes: 'அனைத்து வகைகளும்',

  // Notifications
  notificationsTitle: 'அறிவிப்புகள்',
  notificationsSubtitle: 'அரசுப் பணி அறிவிப்புகள், விண்ணப்ப நிலை மாற்றங்கள், தேர்வு பாடத்திட்ட வெளியீடுகள் மற்றும் காலக்கெடு தகவல்களை உடனுக்குடன் தெரிந்துகொள்ளுங்கள்.',
  markAllAsRead: 'அனைத்தையும் படித்ததாகக் குறிக்கவும்',
  unread: 'படிக்காதவை',
  read: 'படித்தவை',
  newJobAlert: 'புதிய வேலைவாய்ப்பு',
  appStatusAlert: 'விண்ணப்ப நிலை',
  deadlineAlert: 'காலக்கெடு அறிவிப்பு',
  noNotificationsFound: 'அறிவிப்புகள் எதுவும் கிடைக்கவில்லை',
  noNotificationsDesc: 'தற்போது உங்களுக்குப் புதிய அறிவிப்புகள் எதுவும் இல்லை.',

  // Admin UI
  adminDashboard: 'நிர்வாகக் கட்டுப்பாட்டு பலகை',
  adminManageJobs: 'பணிகளை நிர்வகிக்கவும்',
  adminApplications: 'விண்ணப்பங்கள்',
  adminUsers: 'பயனர்கள்',
  adminStudyMaterials: 'படிப்பு வளங்கள்',
  adminNotifications: 'அறிவிப்புகள்',
  adminCreateAnnouncement: 'அறிவிப்பு உருவாக்கவும்',
  addNewJob: 'புதிய பணியைச் சேர்க்கவும்',
  edit: 'திருத்தவும்',
  delete: 'நீக்கவும்',
  archive: 'காப்பகப்படுத்தவும்',
  publish: 'வெளியிடவும்',

  // Validation & Messages
  thisFieldRequired: 'இந்த தகவல் தேவையாகும்',
  validEmailRequired: 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்',
  passwordMismatch: 'கடவுச்சொற்கள் பொருந்தவில்லை. ஒரே மாதிரியான கடவுச்சொற்களை உள்ளிடவும்.',
  passwordMinLength: 'கடவுச்சொல் குறைந்தது 8 எழுத்துகளைக் கொண்டிருக்க வேண்டும் (எழுத்துகள் மற்றும் எண்கள் தேவை).',
  acceptDeclarationReq: 'பதிவைத் தொடர வேட்பாளர் உறுதிமொழியை ஏற்கவும்.',
  regSuccessMsg: 'பதிவு வெற்றிகரமாக முடிந்தது! உங்கள் மின்னஞ்சல் மற்றும் கடவுச்சொல்லுடன் உள்நுழையவும்.',
  submittedSuccessfully: 'வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது',

  // Pagination
  page: 'பக்கம்',
  of: '/',
  total: 'மொத்தம்',
  previous: 'முந்தையது',
  next: 'அடுத்தது',

  // Footer
  footerPortals: 'அரசுப் பணித் தளங்கள்',
  footerCandidateServices: 'வேட்பாளர் சேவைகள்',
  footerAdminAccess: 'நிர்வாக அணுகல்',
  footerGuidelines: 'தளத்தின் வழிகாட்டுதல்கள்',
  footerQuickLinks: 'விரைவு இணைப்புகள்',
  footerAllRightsReserved: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
  footerDisclaimer: 'அதிகாரப்பூர்வ அரசு வேலைவாய்ப்பு தகவல் தளம். வெளிப்படையான மற்றும் தகுதி அடிப்படையிலான ஆட்சேர்ப்புக்காக உருவாக்கப்பட்டது.',
  footerSecureBadge: 'பாதுகாப்பான மற்றும் அணுகக்கூடிய டிஜிட்டல் தளம்',
};

const UI_STRINGS_EN = {
  // Branding & Global
  portalTitle: 'GOVERNMENT JOB PORTAL',
  portalSubtitle: 'National Recruitment & Vacancy System',
  portalTagline: 'Official portal to explore and apply for central and state government ministry, department, and public sector employment opportunities.',
  emblemAlt: 'Government of India emblem',
  topStripPublicPortal: 'Official Government Recruitment Portal',
  topStripDirectory: 'Government of India / State Government Services Directory',
  candidatePortal: 'Candidate Portal',
  adminPortal: 'Admin Portal',

  // Navigation
  navHome: 'Home',
  navJobs: 'Government Jobs',
  navStudyMaterials: 'Study Materials',
  navSyllabus: 'Syllabus',
  navAbout: 'About',
  navSignIn: 'Sign In',
  navRegister: 'Register',
  navSignOut: 'Sign Out',
  navMyApplications: 'My Applications',
  navNotifications: 'Notifications',
  navAdminConsole: 'Admin Console',
  navDashboard: 'Dashboard',
  themeDark: 'Dark Mode',
  themeLight: 'Light Mode',
  switchLangTamil: 'மொழியை தமிழுக்கு மாற்றவும்',
  switchLangEnglish: 'Switch language to English',

  // Common Actions & States
  loading: 'Loading...',
  loadingVacancies: 'Loading government vacancies...',
  somethingWentWrong: 'Something went wrong',
  tryAgain: 'Try Again',
  retryRequest: 'Try Again',
  noJobsFound: 'No Jobs Found',
  noJobsFoundDesc: 'No government vacancies matched your search criteria. Try modifying your keywords or clear the applied filters.',
  viewDetails: 'View Details',
  apply: 'Apply',
  applyNow: 'Apply Now',
  applyOnline: 'Apply Online',
  alreadyApplied: 'Already Applied',
  alreadyAppliedView: '✓ Already Applied (View)',
  deadlinePassed: 'Deadline Passed',
  closingSoon: 'Closing Soon',
  closingSoonBadge: 'Deadline Approaching',
  publishedBadge: 'Published',
  verifiedBadge: 'Verified Official Notification',
  posts: 'Posts',
  vacancies: 'Vacancies',
  location: 'Location',
  salary: 'Salary / Pay Scale',
  qualification: 'Qualification',
  lastDate: 'Last Date to Apply',
  openingDate: 'Application Start Date',
  ageLimit: 'Age Limit',
  experience: 'Experience',
  applicationFee: 'Application Fee',
  selectionProcess: 'Selection Process',
  requiredDocuments: 'Required Documents',
  jobDescription: 'Job Description',
  officialGazette: 'Official Gazette Notification',
  downloadGazette: 'Download Official Notification (PDF)',
  backToAllJobs: '← Back to All Government Jobs',
  allIndia: 'All India',
  asPerRules: 'As per rules',
  asPerGovtRules: 'As per govt pay rules',
  referNotification: 'Refer Notification',

  // Search & Filters
  searchJobs: 'Search Jobs',
  searchPlaceholder: 'Search by job title, department, or organization...',
  category: 'Category',
  allCategories: 'All Categories',
  jobGroup: 'Job Group',
  allGroups: 'All Groups',
  group1: 'Group 1',
  group2: 'Group 2',
  group2A: 'Group 2A',
  group3: 'Group 3',
  group4: 'Group 4',
  organization: 'Organization / Body',
  department: 'Department / Ministry',
  sort: 'Sort By',
  sortLatest: 'Latest First',
  sortOldest: 'Oldest First',
  sortDeadlineSoon: 'Deadline Approaching',
  sortDeadlineLatest: 'Deadline Farthest',
  sortVacanciesHigh: 'Highest Vacancies',
  sortVacanciesLow: 'Lowest Vacancies',
  filterVacancies: 'Filter Vacancies',
  clearFilters: 'Clear Filters',
  reset: 'Reset',
  applyFilters: 'Apply Filters',
  searchVacanciesBtn: 'Search Jobs',
  selectLocation: 'Select Location',
  allQualifications: 'All Qualifications',
  locationPlaceholder: 'e.g. All India, Chennai, Delhi, Tamil Nadu',
  orgPlaceholder: 'e.g. UPSC, SSC, Railways, TNPSC, Banking',
  deptPlaceholder: 'e.g. Revenue, Education, Technical',
  startDateRange: 'Opening Date Range',
  lastDateRange: 'Last Date (Deadline) Range',
  fromDate: 'From',
  toDate: 'To',
  hideFilters: 'Hide Filters',
  showFilters: 'Show Advanced Filters',

  // Registration Page
  regTitle: 'Candidate One-Time Registration',
  regSubtitle: 'Create your permanent candidate profile to apply for central and state government recruitment opportunities.',
  fullName: 'Full Name',
  fullNameHint: 'As per 10th Class / Matriculation Certificate',
  fullNamePlaceholder: 'e.g. Arun Kumar',
  emailAddress: 'Email Address',
  emailPlaceholder: 'e.g. candidate@example.com',
  mobileNumber: 'Mobile Number',
  mobileNumberHint: 'For official SMS / Alerts',
  mobilePlaceholder: '10-digit mobile number',
  password: 'Password',
  passwordHint: 'Minimum 8 characters (letters and numbers)',
  passwordPlaceholder: 'Minimum 8 characters (alphanumeric)',
  confirmPassword: 'Confirm Password',
  confirmPasswordPlaceholder: 'Re-enter your password',
  regDeclaration: 'I hereby declare that all information submitted is true, complete and correct to the best of my knowledge.',
  registerButton: 'Register',
  registeringButton: 'Registering...',
  alreadyHaveAccount: 'Already have an account? Sign In',

  // Login Page
  loginTitleCandidate: 'Candidate Login',
  loginTitleAdmin: 'Admin Login',
  loginSubtitle: 'Enter your credentials to access your applications, hall tickets and dashboard.',
  tabCandidate: 'Candidate',
  tabAdmin: 'Admin',
  loginButton: 'Sign In',
  verifyingButton: 'Verifying...',
  forgotPassword: 'Forgot Password?',
  newCandidateRegister: 'New candidate? Register',
  rememberMe: 'Remember Me',
  passwordInputPlaceholder: 'Enter your password',
  loginSecurityNotice: 'Secure encrypted session. Do not share your password with anyone.',

  // Applications
  myApplicationsTitle: 'My Applications',
  myApplicationsSubtitle: 'Track your application status, view submission details and print official acknowledgements.',
  applicationNo: 'Application ID',
  applicationStatus: 'Application Status',
  submittedDate: 'Submitted Date',
  documents: 'Documents',
  withdrawApplication: 'Withdraw Application',
  print: 'Print',
  download: 'Download',
  viewAppDetails: 'Application Details',
  candidateName: 'Candidate Name',
  noApplicationsFound: 'No Applications Found',
  noApplicationsDesc: 'You have not submitted applications for any government vacancies yet.',
  viewPublishedJobs: 'Explore Published Vacancies',
  loadingApplications: 'Loading submitted applications...',
  allApplications: 'All Applications',
  backToMyApps: '← Back to My Applications',
  confirmWithdrawTitle: 'Confirm Application Withdrawal',
  confirmWithdrawDesc: 'Are you sure you want to withdraw your application? This action is permanent and cannot be undone.',
  confirmWithdrawBtn: 'Yes, Withdraw Application',
  cancel: 'Cancel',

  // Study Materials & Syllabus
  studyMaterialsTitle: 'Study Materials',
  studyMaterialsSubtitle: 'Access curated study resources, previous year question papers, and preparation guides for competitive examinations.',
  syllabusTitle: 'Syllabus',
  syllabusSubtitle: 'Official examination schemes, subject-wise marking blueprints, patterns, and syllabi across recruitment boards.',
  materialsList: 'Study Materials',
  subjects: 'Subjects',
  syllabusDetails: 'Syllabus Details',
  downloadBtn: 'Download',
  viewBtn: 'View',
  searchMaterialPlaceholder: 'Search notes, question papers, guides...',
  uploadedDate: 'Uploaded Date',
  noMaterialsFound: 'No Study Materials Found',
  noMaterialsDesc: 'No study materials match your current search or category filter criteria.',
  noSyllabusFound: 'No Syllabus Documents Found',
  noSyllabusDesc: 'No examination syllabi match your current search or category filter criteria.',
  examGroup: 'Exam Group',
  language: 'Language',
  allLanguages: 'All Languages',
  officialSyllabus: 'Official Syllabus',
  questionPapers: 'Question Papers',
  notifications: 'Notifications',
  answerKeys: 'Answer Keys',
  examPattern: 'Exam Pattern',
  currentAffairs: 'Current Affairs',
  practiceMaterials: 'Practice Materials',
  officialTnpscSource: 'Official TNPSC',
  officialGovtSource: 'Official Govt Source',
  officialSource: 'Official Source',
  readView: 'Read / View',
  download: 'Download',
  sourceUrl: 'Official Source URL',
  allMaterialTypes: 'All Types',

  // Notifications
  notificationsTitle: 'Notifications',
  notificationsSubtitle: 'Stay updated with new vacancy alerts, application status transitions, syllabus releases, and critical deadlines.',
  markAllAsRead: 'Mark All as Read',
  unread: 'Unread',
  read: 'Read',
  newJobAlert: 'New Job Alert',
  appStatusAlert: 'Application Status',
  deadlineAlert: 'Deadline Alert',
  noNotificationsFound: 'No Notifications Found',
  noNotificationsDesc: 'You have no notifications at this time.',

  // Admin UI
  adminDashboard: 'Admin Dashboard',
  adminManageJobs: 'Manage Jobs',
  adminApplications: 'Applications',
  adminUsers: 'Users',
  adminStudyMaterials: 'Study Materials',
  adminNotifications: 'Notifications',
  adminCreateAnnouncement: 'Create Announcement',
  addNewJob: 'Add New Job',
  edit: 'Edit',
  delete: 'Delete',
  archive: 'Archive',
  publish: 'Publish',

  // Validation & Messages
  thisFieldRequired: 'This field is required',
  validEmailRequired: 'Please enter a valid email address',
  passwordMismatch: 'Passwords do not match. Please verify both passwords.',
  passwordMinLength: 'Password must be at least 8 characters long (including letters and numbers).',
  acceptDeclarationReq: 'Please accept the declaration to proceed with registration.',
  regSuccessMsg: 'Registration completed successfully! Please sign in with your email and password.',
  submittedSuccessfully: 'Successfully submitted',

  // Pagination
  page: 'Page',
  of: '/',
  total: 'Total',
  previous: 'Previous',
  next: 'Next',

  // Footer
  footerPortals: 'Recruitment Portals',
  footerCandidateServices: 'Candidate Services',
  footerAdminAccess: 'Administrative Access',
  footerGuidelines: 'Portal Guidelines',
  footerQuickLinks: 'Quick Links',
  footerAllRightsReserved: 'All rights reserved.',
  footerDisclaimer: 'Official government recruitment directory. Built for transparent, merit-based public appointments.',
  footerSecureBadge: 'Secure & Accessible Digital Portal',
};

export const UI_STRINGS = new Proxy(
  {
    ta: UI_STRINGS_TA,
    en: UI_STRINGS_EN,
  },
  {
    get(target, prop) {
      if (prop === 'ta' || prop === 'en') return target[prop];
      const activeLang = currentGlobalLanguage || 'ta';
      const dict = target[activeLang] || target.ta;
      return dict[prop] !== undefined ? dict[prop] : target.ta[prop];
    },
  }
);

/* =========================================================================
   CORE TRANSLATION HELPERS
   ========================================================================= */

/**
 * Translates a key from UI_STRINGS with optional fallback and language override.
 * Supports dot notation like t("nav.home") or direct keys like t("navHome").
 */
export const t = (key, fallback = '', lang = null) => {
  if (!key) return fallback;
  const activeLang = lang || currentGlobalLanguage || 'ta';
  const dict = activeLang === 'en' ? UI_STRINGS_EN : UI_STRINGS_TA;
  const fallbackDict = activeLang === 'en' ? UI_STRINGS_TA : UI_STRINGS_EN;

  // Direct key lookup
  if (dict[key] !== undefined) {
    return dict[key];
  }

  // Handle dot notation: e.g. "nav.home" -> "navHome"
  if (key.includes('.')) {
    const camel = key.replace(/\.([a-z])/g, (_, letter) => letter.toUpperCase());
    if (dict[camel] !== undefined) {
      return dict[camel];
    }
  }

  // Fallback to other dictionary if available
  if (fallbackDict[key] !== undefined) {
    return fallback || fallbackDict[key];
  }

  return fallback || key;
};

/**
 * Translates category name or slug to official label based on active language.
 */
export const tCategory = (catNameOrSlug, lang = null) => {
  const activeLang = lang || currentGlobalLanguage || 'ta';
  if (!catNameOrSlug) return activeLang === 'en' ? 'Government Job' : 'அரசுப் பணி';
  const trimmed = String(catNameOrSlug).trim();
  const dict = CATEGORY_DICTS[activeLang] || CATEGORY_DICTS.ta;
  return dict[trimmed] || dict[trimmed.toLowerCase()] || trimmed;
};

/**
 * Translates status (application status, job status, notification status) based on active language.
 */
export const tStatus = (status, lang = null) => {
  if (!status) return '';
  const activeLang = lang || currentGlobalLanguage || 'ta';
  const trimmed = String(status).trim();
  const dict = STATUS_DICTS[activeLang] || STATUS_DICTS.ta;
  return dict[trimmed] || dict[trimmed.toLowerCase()] || trimmed;
};

/**
 * Translates notification type based on active language.
 */
export const tNotificationType = (type, lang = null) => {
  const activeLang = lang || currentGlobalLanguage || 'ta';
  if (!type) return activeLang === 'en' ? 'Notification' : 'அறிவிப்பு';
  const trimmed = String(type).trim();
  const dict = NOTIFICATION_DICTS[activeLang] || NOTIFICATION_DICTS.ta;
  return dict[trimmed] || dict[trimmed.toLowerCase()] || trimmed;
};

/**
 * Translates government exam group (GROUP_1, GROUP_2, etc.) based on active language.
 */
export const tJobGroup = (groupCode, lang = null) => {
  if (!groupCode) return '';
  const activeLang = lang || currentGlobalLanguage || 'ta';
  const trimmed = String(groupCode).trim();
  const dict = JOB_GROUP_DICTS[activeLang] || JOB_GROUP_DICTS.ta;
  return dict[trimmed] || dict[trimmed.toUpperCase()] || trimmed;
};

/**
 * Translates exam group (GROUP_1, GROUP_2, etc.) based on active language.
 */
export const tExamGroup = (groupCode, lang = null) => {
  if (!groupCode) return '';
  const activeLang = lang || currentGlobalLanguage || 'ta';
  const trimmed = String(groupCode).trim();
  const dict = EXAM_GROUP_DICTS[activeLang] || EXAM_GROUP_DICTS.ta;
  return dict[trimmed] || dict[trimmed.toUpperCase()] || trimmed;
};

/**
 * Translates material type (study_material, syllabus, etc.) based on active language.
 */
export const tMaterialType = (type, lang = null) => {
  if (!type) return '';
  const activeLang = lang || currentGlobalLanguage || 'ta';
  const trimmed = String(type).trim().toLowerCase();
  const dict = MATERIAL_TYPE_DICTS[activeLang] || MATERIAL_TYPE_DICTS.ta;
  return dict[trimmed] || type;
};

/**
 * Translates study material language (TAMIL, ENGLISH) based on active language.
 */
export const tMaterialLanguage = (language, lang = null) => {
  if (!language) return '';
  const activeLang = lang || currentGlobalLanguage || 'ta';
  const trimmed = String(language).trim().toUpperCase();
  const dict = LANGUAGE_DICTS[activeLang] || LANGUAGE_DICTS.ta;
  return dict[trimmed] || language;
};
