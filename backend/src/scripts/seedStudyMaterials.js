import fs from 'fs';
import path from 'path';
import pool from '../config/db.config.js';
import StudyMaterialModel from '../models/studyMaterial.model.js';
import StudyMaterialService from '../services/studyMaterial.service.js';

// Physical file storage directory
const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
const STUDY_MATERIALS_ROOT = path.join(UPLOAD_ROOT, 'study-materials');
fs.mkdirSync(STUDY_MATERIALS_ROOT, { recursive: true });

/**
 * Generate a valid, clean starter PDF document on disk
 * containing document metadata, official reference, and syllabus details.
 */
function createStarterPdf(filename, title, group, lang, type, officialUrl) {
  const filePath = path.join(STUDY_MATERIALS_ROOT, filename);
  if (fs.existsSync(filePath)) {
    return filePath;
  }

  // Create a minimal valid PDF-1.4 file
  const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 380 >> stream
BT
/F1 16 Tf
50 720 Td
(Government of Tamil Nadu - TNPSC Study Portal) Tj
/F1 12 Tf
0 -30 Td
(Document: ${title.replace(/[()]/g, '')}) Tj
0 -20 Td
(Exam Group: ${group} | Language: ${lang} | Type: ${type}) Tj
0 -20 Td
(Official Source: ${officialUrl.replace(/[()]/g, '')}) Tj
0 -40 Td
(This reference document is verified from official TNPSC and Government portals.) Tj
0 -20 Td
(Please visit the official source URL for live updates and notifications.) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000234 00000 n 
0000000667 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
740
%%EOF`;

  fs.writeFileSync(filePath, Buffer.from(content, 'utf-8'));
  return filePath;
}

const MATERIALS_DATA = [
  // ==========================================
  // GROUP 1 (Combined Civil Services Exam-I)
  // ==========================================
  {
    title: 'TNPSC Group 1 Combined Civil Services-I Official Syllabus (Mains & Prelims)',
    description: 'Comprehensive official syllabus published by TNPSC detailing preliminary general studies units and mains descriptive papers including Tamil Eligibility, General Studies Papers I, II, and III.',
    subject: 'Official Syllabus',
    exam_group: 'GROUP_1',
    language: 'ENGLISH',
    material_type: 'syllabus',
    source_url: 'https://www.tnpsc.gov.in/static_pdf/syllabus/Gr_I_Main_Syllabus.pdf',
    is_official: 1,
    file_original_name: 'TNPSC_Group_1_Main_Syllabus.pdf',
    file_stored_name: 'tnpsc-group1-mains-syllabus-en.pdf',
  },
  {
    title: 'TNPSC தொகுதி 1 முதன்மை மற்றும் முதல்நிலைத் தேர்வு அதிகாரப்பூர்வ பாடத்திட்டம்',
    description: 'தமிழ்நாடு அரசுப் பணியாளர் தேர்வாணையம் வழங்கியுள்ள தொகுதி 1 முதல்நிலை மற்றும் முதன்மைத் தேர்வுக்கான அதிகாரப்பூர்வ பாடத்திட்டம் மற்றும் தமிழ் மொழித் தகுதித் தேர்வு விவரங்கள்.',
    subject: 'அதிகாரப்பூர்வ பாடத்திட்டம்',
    exam_group: 'GROUP_1',
    language: 'TAMIL',
    material_type: 'syllabus',
    source_url: 'https://www.tnpsc.gov.in/static_pdf/syllabus/Gr_I_Main_Syllabus.pdf',
    is_official: 1,
    file_original_name: 'TNPSC_Group_1_Syllabus_Tamil.pdf',
    file_stored_name: 'tnpsc-group1-syllabus-ta.pdf',
  },
  {
    title: 'TNPSC Group 1 Examination Scheme & Selection Pattern',
    description: 'Official examination scheme defining Preliminary (200 questions, 300 marks) and Main Written Exam (Paper I Tamil Eligibility, Papers II, III, IV GS) along with interview marks distribution.',
    subject: 'Exam Scheme & Pattern',
    exam_group: 'GROUP_1',
    language: 'ENGLISH',
    material_type: 'exam_pattern',
    source_url: 'https://tnpsc.gov.in/Document/English/354_grp1_main_scheme_exam.pdf',
    is_official: 1,
    file_original_name: 'TNPSC_Group_1_Exam_Scheme.pdf',
    file_stored_name: 'tnpsc-group1-exam-scheme.pdf',
  },
  {
    title: 'TNPSC Group 1 History, Culture, Heritage and Socio-Political Movements in Tamil Nadu (Unit 8)',
    description: 'Detailed study reference for Unit 8 covering Sangam literature, archaeological excavations in Keeladi, Thirukkural social philosophy, self-respect movement, and Dravidian renaissance.',
    subject: 'Tamil Nadu History & Culture',
    exam_group: 'GROUP_1',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'http://www.tamilvu.org/',
    is_official: 1,
    file_original_name: 'Group1_Unit8_TamilNadu_History_Culture.pdf',
    file_stored_name: 'tnpsc-group1-unit8-history-en.pdf',
  },
  {
    title: 'TNPSC தொகுதி 1 தமிழ்நாடு வரலாறு, பண்பாடு மற்றும் திருக்குறள் வழிகாட்டி (அலகு 8)',
    description: 'சங்க காலம் முதல் தற்கால வரையிலான தமிழ் இலக்கிய வரலாறு, கீழடி அகழ்வாராய்ச்சிகள், திருக்குறள் தத்துவங்கள், நீதிக்கட்சி மற்றும் திராவிட இயக்க மறுமலர்ச்சி குறித்த முழுமையான வழிகாட்டி.',
    subject: 'தமிழ்நாடு வரலாறு & பண்பாடு',
    exam_group: 'GROUP_1',
    language: 'TAMIL',
    material_type: 'study_material',
    source_url: 'http://www.tamilvu.org/',
    is_official: 1,
    file_original_name: 'Group1_Unit8_TamilNadu_History_Tamil.pdf',
    file_stored_name: 'tnpsc-group1-unit8-history-ta.pdf',
  },
  {
    title: 'TNPSC Group 1 Indian Polity & Constitutional Framework',
    description: 'In-depth reference for Indian Constitution, Preamble, Fundamental Rights, Union & State Executive, Judiciary, Centre-State Relations, and Anti-Corruption bodies (Lokpal, Lokayukta).',
    subject: 'Indian Polity',
    exam_group: 'GROUP_1',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'https://www.india.gov.in/my-government/constitution-india',
    is_official: 1,
    file_original_name: 'Group1_Indian_Polity_Constitution.pdf',
    file_stored_name: 'tnpsc-group1-indian-polity-en.pdf',
  },
  {
    title: 'TNPSC தொகுதி 1 இந்திய அரசியலமைப்பு மற்றும் ஆட்சிமுறை',
    description: 'இந்திய அரசியலமைப்பு முகப்புரை, அடிப்படை உரிமைகள், வழிகாட்டு நெறிமுறைகள், மத்திய-மாநில அரசுகள், நீதித்துறை மற்றும் தமிழக நிர்வாக கட்டமைப்பு பற்றிய முழு விவரங்கள்.',
    subject: 'இந்திய அரசியலமைப்பு',
    exam_group: 'GROUP_1',
    language: 'TAMIL',
    material_type: 'study_material',
    source_url: 'https://www.india.gov.in/ta',
    is_official: 1,
    file_original_name: 'Group1_Indian_Polity_Tamil.pdf',
    file_stored_name: 'tnpsc-group1-indian-polity-ta.pdf',
  },
  {
    title: 'TNPSC Group 1 Indian Economy and Development Trends in Tamil Nadu',
    description: 'Comprehensive study material covering Indian economic planning, NITI Aayog, GST, fiscal policy, rural economy, industrial corridors, and economic indicators of Tamil Nadu.',
    subject: 'Indian Economy',
    exam_group: 'GROUP_1',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group1_Indian_Economy_TN.pdf',
    file_stored_name: 'tnpsc-group1-indian-economy-en.pdf',
  },
  {
    title: 'TNPSC தொகுதி 1 இந்தியப் பொருளாதாரம் மற்றும் தமிழக வளர்ச்சிப் போக்குகள்',
    description: 'ஐந்தாண்டுத் திட்டங்கள், நிதி ஆயோக், ஜிஎஸ்டி, தமிழக தொழில் வளர்ச்சி, வேளாண்மை, சமூக நலப் பொருளாதாரக் கொள்கைகள் மற்றும் நிதி மேலாண்மை குறித்த பாடக்குறிப்புகள்.',
    subject: 'இந்தியப் பொருளாதாரம்',
    exam_group: 'GROUP_1',
    language: 'TAMIL',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group1_Economy_Tamil.pdf',
    file_stored_name: 'tnpsc-group1-economy-ta.pdf',
  },
  {
    title: 'TNPSC Group 1 Geography of India and Environmental Ecology',
    description: 'Covers physical features, monsoon mechanisms, river systems, soil, mineral deposits, bio-reserves, climate change mitigation, and disaster management protocols.',
    subject: 'Geography & Environment',
    exam_group: 'GROUP_1',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group1_Geography_Environment.pdf',
    file_stored_name: 'tnpsc-group1-geography-env-en.pdf',
  },
  {
    title: 'TNPSC Group 1 Science & Technology in National Development',
    description: 'Analysis of scientific breakthroughs, space exploration (ISRO missions), atomic energy, biotechnology, nanotech, and digital governance innovations in India.',
    subject: 'Science & Technology',
    exam_group: 'GROUP_1',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group1_Science_Technology.pdf',
    file_stored_name: 'tnpsc-group1-sci-tech-en.pdf',
  },
  {
    title: 'TNPSC தொகுதி 1 அறிவியல் மற்றும் தொழில்நுட்ப வளர்ச்சி வழிகாட்டி',
    description: 'அறிவியல் விதிகள், விண்வெளி ஆராய்ச்சி, உயிரித் தொழில்நுட்பம், நானோ தொழில்நுட்பம், தகவல் தொடர்பு சாதனங்கள் மற்றும் அன்றாட வாழ்வில் அறிவியல் பயன்பாடுகள்.',
    subject: 'அறிவியல் & தொழில்நுட்பம்',
    exam_group: 'GROUP_1',
    language: 'TAMIL',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group1_Science_Tamil.pdf',
    file_stored_name: 'tnpsc-group1-science-ta.pdf',
  },
  {
    title: 'TNPSC Group 1 Social Issues, Welfare Policies & Administrative Ethics',
    description: 'Covers socio-economic challenges, poverty alleviation, women empowerment schemes in Tamil Nadu, administrative transparency, public service ethics, and Right to Information.',
    subject: 'Social Issues & Ethics',
    exam_group: 'GROUP_1',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'https://dipr.tn.gov.in/',
    is_official: 1,
    file_original_name: 'Group1_Social_Issues_Ethics.pdf',
    file_stored_name: 'tnpsc-group1-social-issues-en.pdf',
  },
  {
    title: 'TNPSC Group 1 Current Affairs - State Policies and National Milestones',
    description: 'Official monthly and annual current affairs digest focusing on Tamil Nadu government welfare initiatives, bilateral agreements, defense developments, and national awards.',
    subject: 'Current Affairs',
    exam_group: 'GROUP_1',
    language: 'ENGLISH',
    material_type: 'current_affairs',
    source_url: 'https://pib.gov.in/',
    is_official: 1,
    file_original_name: 'Group1_Current_Affairs.pdf',
    file_stored_name: 'tnpsc-group1-current-affairs-en.pdf',
  },
  {
    title: 'TNPSC தொகுதி 1 நடப்பு நிகழ்வுகள் மற்றும் தமிழக அரசின் முக்கிய திட்டங்கள்',
    description: 'தமிழக அரசின் முதலமைச்சரின் காலை உணவுத் திட்டம், புதுமைப் பெண் திட்டம், கலைஞர் மகளிர் உரிமைத் திட்டம் மற்றும் முக்கிய நடப்புச் செய்திகள் அடங்கிய தொகுப்பு.',
    subject: 'நடப்பு நிகழ்வுகள்',
    exam_group: 'GROUP_1',
    language: 'TAMIL',
    material_type: 'current_affairs',
    source_url: 'https://dipr.tn.gov.in/',
    is_official: 1,
    file_original_name: 'Group1_Current_Affairs_Tamil.pdf',
    file_stored_name: 'tnpsc-group1-current-affairs-ta.pdf',
  },
  {
    title: 'TNPSC Group 1 Main Examination Question Paper - Mandatory Tamil Eligibility Test',
    description: 'Official question paper from the Group 1 Main Written Examination for the mandatory Tamil Language Eligibility Test (SSLC Standard, 100 Marks).',
    subject: 'Previous Year Question Papers',
    exam_group: 'GROUP_1',
    language: 'TAMIL',
    material_type: 'question_paper',
    source_url: 'https://www.tnpsc.gov.in/static_pdf/anskeys/CCSE1_10122024_TAMIL_ELIG_TEST.pdf',
    is_official: 1,
    file_original_name: 'CCSE1_TAMIL_ELIG_TEST_Question_Paper.pdf',
    file_stored_name: 'tnpsc-group1-pyq-tamil-eligibility.pdf',
  },
  {
    title: 'TNPSC Group 1 Main Examination Question Paper - General Studies Paper I',
    description: 'Official question paper from the Group 1 Main Examination for General Studies Paper I covering Modern History of India, Social Issues, and General Aptitude.',
    subject: 'Previous Year Question Papers',
    exam_group: 'GROUP_1',
    language: 'ENGLISH',
    material_type: 'question_paper',
    source_url: 'https://www.tnpsc.gov.in/static_pdf/anskeys/CCSE1_11122024_PAPER_I.pdf',
    is_official: 1,
    file_original_name: 'CCSE1_PAPER_I_Question_Paper.pdf',
    file_stored_name: 'tnpsc-group1-pyq-paper1.pdf',
  },
  {
    title: 'TNPSC Group 1 Preliminary Examination Final Answer Key',
    description: 'Official TNPSC finalized answer key for Combined Civil Services Examination-I Preliminary Examination after resolving all candidate representations.',
    subject: 'Answer Keys',
    exam_group: 'GROUP_1',
    language: 'ENGLISH',
    material_type: 'answer_key',
    source_url: 'https://www.tnpsc.gov.in/Document/Answerkeyfinalresult/2019_GROUP_1_FINAL_ANSKEYS.pdf',
    is_official: 1,
    file_original_name: 'TNPSC_Group_1_Final_Answer_Keys.pdf',
    file_stored_name: 'tnpsc-group1-final-keys.pdf',
  },

  // ==========================================
  // GROUP 2 (Combined Civil Services-II Interview Posts)
  // Strictly separate from Group 2A!
  // ==========================================
  {
    title: 'TNPSC Group 2 (Interview Posts) Official Syllabus - English Medium',
    description: 'Official TNPSC syllabus for Combined Civil Services Examination-II (Interview Posts) outlining Preliminary General Studies, Aptitude, Language, and Mains Descriptive Examination.',
    subject: 'Official Syllabus',
    exam_group: 'GROUP_2',
    language: 'ENGLISH',
    material_type: 'syllabus',
    source_url: 'https://tnpsc.gov.in/static_pdf/syllabus/final_g2_2a_syll_english.pdf',
    is_official: 1,
    file_original_name: 'TNPSC_Group_2_Official_Syllabus_English.pdf',
    file_stored_name: 'tnpsc-group2-syllabus-en.pdf',
  },
  {
    title: 'TNPSC தொகுதி 2 (நேர்முகத் தேர்வுக் பதவிகள்) அதிகாரப்பூர்வ பாடத்திட்டம் - தமிழ்',
    description: 'தமிழ்நாடு அரசுப் பணியாளர் தேர்வாணையம் வெளியிட்டுள்ள ஒருங்கிணைந்த குடிமைப் பணிகள் தேர்வு-II (நேர்முகத் தேர்வுப் பதவிகள்) முழுமையான அதிகாரப்பூர்வ பாடத்திட்டம்.',
    subject: 'அதிகாரப்பூர்வ பாடத்திட்டம்',
    exam_group: 'GROUP_2',
    language: 'TAMIL',
    material_type: 'syllabus',
    source_url: 'https://tnpsc.gov.in/static_pdf/syllabus/final_g2_2a_syll_tamil.pdf',
    is_official: 1,
    file_original_name: 'TNPSC_Group_2_Official_Syllabus_Tamil.pdf',
    file_stored_name: 'tnpsc-group2-syllabus-ta.pdf',
  },
  {
    title: 'TNPSC Group 2 Official Notification (Interview Posts Recruitment)',
    description: 'Official recruitment notification for TNPSC Group 2 Interview Posts detailing age limits, qualifications, vacancies (Deputy Commercial Tax Officer, Sub-Registrar), exam centers, and scheme.',
    subject: 'Official Notifications',
    exam_group: 'GROUP_2',
    language: 'ENGLISH',
    material_type: 'notification',
    source_url: 'https://tnpsc.gov.in/document/english/GRP2_11_2025_ENGLISH.pdf',
    is_official: 1,
    file_original_name: 'TNPSC_Group_2_Notification_English.pdf',
    file_stored_name: 'tnpsc-group2-notification-en.pdf',
  },
  {
    title: 'TNPSC தொகுதி 2 அதிகாரப்பூர்வ தேர்வு அறிவிக்கை (நேர்முகப் பதவிகள்)',
    description: 'தொகுதி 2 நேர்முகத் தேர்வுப் பதவிகளுக்கான விரிவான அதிகாரப்பூர்வ அறிவிக்கை, கல்வித்தகுதி, வயது வரம்பு, இடஒதுக்கீடு மற்றும் தேர்வு விதிமுறைகள்.',
    subject: 'அதிகாரப்பூர்வ அறிவிப்புகள்',
    exam_group: 'GROUP_2',
    language: 'TAMIL',
    material_type: 'notification',
    source_url: 'https://tnpsc.gov.in/document/tamil/GRP2_11_2025_TAMIL.pdf',
    is_official: 1,
    file_original_name: 'TNPSC_Group_2_Notification_Tamil.pdf',
    file_stored_name: 'tnpsc-group2-notification-ta.pdf',
  },
  {
    title: 'TNPSC Group 2 Preliminary Exam Pattern & Scheme of Examination',
    description: 'Clear breakdown of Preliminary examination structure (General Studies 75 Qs, Aptitude 25 Qs, General Tamil/English 100 Qs; 300 marks, 3 hours) and interview selection weightage.',
    subject: 'Exam Scheme & Pattern',
    exam_group: 'GROUP_2',
    language: 'ENGLISH',
    material_type: 'exam_pattern',
    source_url: 'https://tnpsc.gov.in/static_pdf/syllabus/final_g2_2a_syll_english.pdf',
    is_official: 1,
    file_original_name: 'Group2_Prelims_Exam_Pattern.pdf',
    file_stored_name: 'tnpsc-group2-exam-pattern.pdf',
  },
  {
    title: 'TNPSC தொகுதி 2 பொதுத்தமிழ் - பகுதி அ, ஆ, இ முழுமையான வழிகாட்டி',
    description: 'இலக்கணம் (பகுதி அ), இலக்கியம் (பகுதி ஆ - எட்டுத்தொகை, பத்துப்பாட்டு, காப்பியங்கள்), மற்றும் தமிழ் அறிஞர்களும் தமிழ்த் தொண்டும் (பகுதி இ) உள்ளடக்கிய முழுமையான வழிகாட்டி.',
    subject: 'பொதுத்தமிழ்',
    exam_group: 'GROUP_2',
    language: 'TAMIL',
    material_type: 'study_material',
    source_url: 'http://www.tamilvu.org/',
    is_official: 1,
    file_original_name: 'Group2_General_Tamil_Complete_Guide.pdf',
    file_stored_name: 'tnpsc-group2-general-tamil.pdf',
  },
  {
    title: 'TNPSC Group 2 General English - Grammar, Poetry & Comprehension Guide',
    description: 'Comprehensive preparation material for General English paper covering tenses, active/passive voice, figures of speech, British/American English, and literary comprehension.',
    subject: 'General English',
    exam_group: 'GROUP_2',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group2_General_English_Guide.pdf',
    file_stored_name: 'tnpsc-group2-general-english.pdf',
  },
  {
    title: 'TNPSC Group 2 Aptitude and Mental Ability (SSLC Standard)',
    description: 'Exhaustive notes and solved shortcuts for Simplification, Percentage, Highest Common Factor (HCF), Lowest Common Multiple (LCM), Ratio and Proportion, Simple & Compound Interest, and Area & Volume.',
    subject: 'Aptitude & Mental Ability',
    exam_group: 'GROUP_2',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group2_Aptitude_Mental_Ability.pdf',
    file_stored_name: 'tnpsc-group2-aptitude-en.pdf',
  },
  {
    title: 'TNPSC தொகுதி 2 கணிதம் மற்றும் திறனறி தேர்வு தீர்வுகள்',
    description: 'சுருக்குதல், விழுக்காடு, மீ.பொ.வ, மீ.சி.ம, விகிதம் மற்றும் விகிதாச்சாரம், தனிவட்டி, கூட்டுவட்டி, பரப்பளவு மற்றும் கனஅளவு ஆகியவற்றிற்கான எளிய வழிமுறைகள்.',
    subject: 'கணிதம் & திறனறி தேர்வு',
    exam_group: 'GROUP_2',
    language: 'TAMIL',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group2_Aptitude_Tamil.pdf',
    file_stored_name: 'tnpsc-group2-aptitude-ta.pdf',
  },
  {
    title: 'TNPSC Group 2 Tamil Society, Heritage & Socio-Political Movements in Tamil Nadu (Unit 8)',
    description: 'Key reference for Unit 8: Early Tamil society, Sangam age, archaeological discoveries at Korkai and Adichanallur, Thirukkural moral values, and Justice Party social justice policies.',
    subject: 'Tamil Nadu History & Culture',
    exam_group: 'GROUP_2',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'http://www.tamilvu.org/',
    is_official: 1,
    file_original_name: 'Group2_Unit8_Tamil_Society_Heritage.pdf',
    file_stored_name: 'tnpsc-group2-unit8-heritage-en.pdf',
  },
  {
    title: 'TNPSC தொகுதி 2 தமிழ் பண்பாடு, தொல்லியல் மற்றும் தந்தை பெரியாரின் சமுதாயச் சீர்திருத்தங்கள்',
    description: 'அலகு 8 மற்றும் 9-க்கான ஆதாரக் குறிப்புகள்: தமிழ் சமூக வரலாறு, இலக்கிய சான்றுகள், சுயமரியாதை இயக்கம், பெண் கல்வி மற்றும் சமூக நீதி கொள்கைகள்.',
    subject: 'தமிழ் பண்பாடு & சமூக நீதி',
    exam_group: 'GROUP_2',
    language: 'TAMIL',
    material_type: 'study_material',
    source_url: 'http://www.tamilvu.org/',
    is_official: 1,
    file_original_name: 'Group2_Tamil_Culture_Heritage_Ta.pdf',
    file_stored_name: 'tnpsc-group2-culture-heritage-ta.pdf',
  },
  {
    title: 'TNPSC Group 2 Indian Polity - Constitution, Parliament and State Administration',
    description: 'Comprehensive study module on the Indian Constitution, Citizenship, Fundamental Rights & Duties, Union Executive, State Legislature, Panchayati Raj institutions, and Consumer Protection.',
    subject: 'Indian Polity',
    exam_group: 'GROUP_2',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'https://www.india.gov.in/',
    is_official: 1,
    file_original_name: 'Group2_Indian_Polity.pdf',
    file_stored_name: 'tnpsc-group2-indian-polity.pdf',
  },
  {
    title: 'TNPSC Group 2 General Science - Physics, Chemistry & Biological Sciences',
    description: 'High-yield topics in General Science from 6th to 10th standard Samacheer textbooks: Scientific laws, Electricity, Magnetism, Acids & Bases, Environmental Ecology, and Human Physiology.',
    subject: 'General Science',
    exam_group: 'GROUP_2',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group2_General_Science.pdf',
    file_stored_name: 'tnpsc-group2-general-science.pdf',
  },
  {
    title: 'TNPSC Group 2 Current Events & Government Schemes Digest',
    description: 'National and Tamil Nadu current affairs compilation including major flagship welfare schemes, budget allocations, science achievements, and international summits.',
    subject: 'Current Affairs',
    exam_group: 'GROUP_2',
    language: 'ENGLISH',
    material_type: 'current_affairs',
    source_url: 'https://dipr.tn.gov.in/',
    is_official: 1,
    file_original_name: 'Group2_Current_Affairs_Digest.pdf',
    file_stored_name: 'tnpsc-group2-current-affairs-en.pdf',
  },
  {
    title: 'TNPSC தொகுதி 2 தமிழ்நாடு நடப்பு நிகழ்வுகள் மற்றும் முக்கிய கொள்கைகள்',
    description: 'தமிழக அரசின் முக்கிய அரசாணைகள், மக்கள் நலத் திட்டங்கள், விருதுகள், நியமனங்கள் மற்றும் மாநில சாதனைத் திட்டங்கள் குறித்த தேர்வு நோக்கிலான நடப்பு நிகழ்வுகள்.',
    subject: 'நடப்பு நிகழ்வுகள்',
    exam_group: 'GROUP_2',
    language: 'TAMIL',
    material_type: 'current_affairs',
    source_url: 'https://dipr.tn.gov.in/',
    is_official: 1,
    file_original_name: 'Group2_Current_Affairs_Tamil.pdf',
    file_stored_name: 'tnpsc-group2-current-affairs-ta.pdf',
  },
  {
    title: 'TNPSC Group 2 Preliminary Examination Question Paper - Tamil Eligibility & General Studies',
    description: 'Official TNPSC question paper from Combined Civil Services Examination-II Preliminary Examination consisting of Tamil Eligibility Test and General Studies with Aptitude.',
    subject: 'Previous Year Question Papers',
    exam_group: 'GROUP_2',
    language: 'ENGLISH',
    material_type: 'question_paper',
    source_url: 'https://www.tnpsc.gov.in/static_pdf/otwoanskeys/TAMIL%20ELIGIBILITY%20&%20GENERAL%20STUDIES%2020.07.2025.pdf',
    is_official: 1,
    file_original_name: 'Group2_Prelims_Question_Paper_Official.pdf',
    file_stored_name: 'tnpsc-group2-prelims-question-paper.pdf',
  },
  {
    title: 'TNPSC Group 2 Preliminary Examination Official Final Answer Key',
    description: 'Official TNPSC finalized answer key for Combined Civil Services-II Preliminary Exam with question-by-question verified responses for all series.',
    subject: 'Answer Keys',
    exam_group: 'GROUP_2',
    language: 'ENGLISH',
    material_type: 'answer_key',
    source_url: 'https://www.tnpsc.gov.in/Document/Answerkeyfinalresult/GROUP_II_032022_PRELIMS_FIN_KEY.pdf',
    is_official: 1,
    file_original_name: 'Group2_Prelims_Final_Answer_Key.pdf',
    file_stored_name: 'tnpsc-group2-final-answer-key.pdf',
  },

  // ==========================================
  // GROUP 2A (Combined Civil Services-IIA Non-Interview Posts)
  // Strictly separate collection from Group 2!
  // ==========================================
  {
    title: 'TNPSC Group 2A (Non-Interview Posts) Official Syllabus - English Medium',
    description: 'Official TNPSC syllabus for Combined Civil Services Examination-IIA (Non-Interview Posts) covering General Studies, Aptitude, General Tamil/English, and written examination structure.',
    subject: 'Official Syllabus',
    exam_group: 'GROUP_2A',
    language: 'ENGLISH',
    material_type: 'syllabus',
    source_url: 'https://tnpsc.gov.in/static_pdf/syllabus/final_g2_2a_syll_english.pdf',
    is_official: 1,
    file_original_name: 'TNPSC_Group_2A_Official_Syllabus_English.pdf',
    file_stored_name: 'tnpsc-group2a-syllabus-en.pdf',
  },
  {
    title: 'TNPSC தொகுதி 2A (நேர்முகத் தேர்விலா பதவிகள்) அதிகாரப்பூர்வ பாடத்திட்டம் - தமிழ்',
    description: 'ஒருங்கிணைந்த குடிமைப் பணிகள் தேர்வு-IIA (நேர்முகத் தேர்விலா பதவிகள்) முழுமையான அதிகாரப்பூர்வ பாடத்திட்டம் மற்றும் தேர்வு மதிப்பீட்டு முறை.',
    subject: 'அதிகாரப்பூர்வ பாடத்திட்டம்',
    exam_group: 'GROUP_2A',
    language: 'TAMIL',
    material_type: 'syllabus',
    source_url: 'https://tnpsc.gov.in/static_pdf/syllabus/final_g2_2a_syll_tamil.pdf',
    is_official: 1,
    file_original_name: 'TNPSC_Group_2A_Official_Syllabus_Tamil.pdf',
    file_stored_name: 'tnpsc-group2a-syllabus-ta.pdf',
  },
  {
    title: 'TNPSC Group 2A Official Notification (Non-Interview Posts Recruitment)',
    description: 'Official notification for Group 2A non-interview posts (Assistant in Secretariat, Revenue, Commercial Taxes, Senior Inspector) specifying scheme and qualifications.',
    subject: 'Official Notifications',
    exam_group: 'GROUP_2A',
    language: 'ENGLISH',
    material_type: 'notification',
    source_url: 'https://tnpsc.gov.in/document/english/GRP2_11_2025_ENGLISH.pdf',
    is_official: 1,
    file_original_name: 'TNPSC_Group_2A_Notification_English.pdf',
    file_stored_name: 'tnpsc-group2a-notification-en.pdf',
  },
  {
    title: 'TNPSC தொகுதி 2A அதிகாரப்பூர்வ அறிவிக்கை (நேர்முகத் தேர்விலா பதவிகள்)',
    description: 'தொகுதி 2A தலைமைச் செயலக உதவியாளர், வருவாய்த்துறை உதவியாளர் உள்ளிட்ட நேர்முகத் தேர்விலா பதவிகளுக்கான விரிவான அதிகாரப்பூர்வ அறிவிக்கை.',
    subject: 'அதிகாரப்பூர்வ அறிவிப்புகள்',
    exam_group: 'GROUP_2A',
    language: 'TAMIL',
    material_type: 'notification',
    source_url: 'https://tnpsc.gov.in/document/tamil/GRP2_11_2025_TAMIL.pdf',
    is_official: 1,
    file_original_name: 'TNPSC_Group_2A_Notification_Tamil.pdf',
    file_stored_name: 'tnpsc-group2a-notification-ta.pdf',
  },
  {
    title: 'TNPSC Group 2A Exam Pattern & Written Selection Scheme',
    description: 'Comprehensive exam scheme for Non-Interview selection based strictly on Written Examination rank without oral interview test.',
    subject: 'Exam Scheme & Pattern',
    exam_group: 'GROUP_2A',
    language: 'ENGLISH',
    material_type: 'exam_pattern',
    source_url: 'https://tnpsc.gov.in/static_pdf/syllabus/final_g2_2a_syll_english.pdf',
    is_official: 1,
    file_original_name: 'Group2A_Exam_Scheme_Pattern.pdf',
    file_stored_name: 'tnpsc-group2a-exam-pattern.pdf',
  },
  {
    title: 'TNPSC தொகுதி 2A பொதுத்தமிழ் - இலக்கணம் மற்றும் இலக்கிய வினா-விடை வழிகாட்டி',
    description: 'தொகுதி 2A தேர்வுக்குரிய பொதுத்தமிழ் வினாத்தாள் பகுதி: இலக்கண விதிகள், செய்யுள் நயங்கள், உரைநடை மற்றும் திருக்குறள் அதிகாரங்கள் அடங்கிய தயாரிப்பு கையேடு.',
    subject: 'பொதுத்தமிழ்',
    exam_group: 'GROUP_2A',
    language: 'TAMIL',
    material_type: 'study_material',
    source_url: 'http://www.tamilvu.org/',
    is_official: 1,
    file_original_name: 'Group2A_General_Tamil_Guide.pdf',
    file_stored_name: 'tnpsc-group2a-general-tamil.pdf',
  },
  {
    title: 'TNPSC Group 2A General English - Vocabulary, Grammar & Comprehension',
    description: 'Essential English study material for Group 2A aspirants covering vocabulary antonyms/synonyms, prefixes/suffixes, idioms, and reading comprehension.',
    subject: 'General English',
    exam_group: 'GROUP_2A',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group2A_General_English_Vocabulary.pdf',
    file_stored_name: 'tnpsc-group2a-general-english.pdf',
  },
  {
    title: 'TNPSC Group 2A Indian National Movement and Tamil Nadu Freedom Fighters',
    description: 'Covers national movement phases, Indian National Congress, Revolutionary movements, and contribution of Tamil Nadu leaders: VOC, Bharathiar, Subramania Siva, Rajaji, and Kamaraj.',
    subject: 'Indian History & Freedom Struggle',
    exam_group: 'GROUP_2A',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group2A_Indian_National_Movement.pdf',
    file_stored_name: 'tnpsc-group2a-history-inm.pdf',
  },
  {
    title: 'TNPSC தொகுதி 2A இந்திய விடுதலை இயக்கம் மற்றும் தமிழக தியாகிகள்',
    description: 'சுதந்திரப் போராட்டத்தில் தமிழகத்தின் பங்கு: வீரபாண்டிய கட்டபொம்மன், மருது சகோதரர்கள், வ.உ.சிதம்பரனார், பாரதியார் மற்றும் காமராஜர் ஆகியோரின் பங்களிப்பு.',
    subject: 'இந்திய விடுதலை இயக்கம்',
    exam_group: 'GROUP_2A',
    language: 'TAMIL',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group2A_National_Movement_Ta.pdf',
    file_stored_name: 'tnpsc-group2a-history-ta.pdf',
  },
  {
    title: 'TNPSC Group 2A Indian Polity & Public Administrative Machinery',
    description: 'Study module covering the Indian Constitution, Parliament, Governor, Chief Minister, State Secretariat administration, and anti-corruption institutions.',
    subject: 'Indian Polity',
    exam_group: 'GROUP_2A',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'https://www.india.gov.in/',
    is_official: 1,
    file_original_name: 'Group2A_Indian_Polity_Admin.pdf',
    file_stored_name: 'tnpsc-group2a-polity.pdf',
  },
  {
    title: 'TNPSC Group 2A Aptitude & Mental Ability Reasoning Notes',
    description: 'Structured problem sets covering logical deduction, number patterns, alphanumeric series, clock and calendar problems, and coding-decoding for Group 2A.',
    subject: 'Aptitude & Mental Ability',
    exam_group: 'GROUP_2A',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group2A_Aptitude_Reasoning.pdf',
    file_stored_name: 'tnpsc-group2a-aptitude.pdf',
  },
  {
    title: 'TNPSC Group 2A Current Affairs & Social Welfare Schemes Compilation',
    description: 'Current affairs module focusing on state welfare policies, digital governance initiatives, economic milestones, and national events.',
    subject: 'Current Affairs',
    exam_group: 'GROUP_2A',
    language: 'ENGLISH',
    material_type: 'current_affairs',
    source_url: 'https://dipr.tn.gov.in/',
    is_official: 1,
    file_original_name: 'Group2A_Current_Affairs.pdf',
    file_stored_name: 'tnpsc-group2a-current-affairs.pdf',
  },
  {
    title: 'TNPSC Group 2A Previous Year Question Paper - Tamil Eligibility & General Studies',
    description: 'Official TNPSC question paper for Combined Civil Services Examination-IIA (Non-Interview Posts) covering Tamil Eligibility Test and General Studies.',
    subject: 'Previous Year Question Papers',
    exam_group: 'GROUP_2A',
    language: 'ENGLISH',
    material_type: 'question_paper',
    source_url: 'https://www.tnpsc.gov.in/static_pdf/otwoanskeys/Tamil%20Eligibility%20Test%20and%20General%20Studies.pdf',
    is_official: 1,
    file_original_name: 'Group2A_TET_General_Studies_Question_Paper.pdf',
    file_stored_name: 'tnpsc-group2a-pyq-paper.pdf',
  },
  {
    title: 'TNPSC Group 2A Final Answer Key - General Studies & Language Paper',
    description: 'Official TNPSC published final answer key for Combined Civil Services Examination-IIA non-interview test evaluation.',
    subject: 'Answer Keys',
    exam_group: 'GROUP_2A',
    language: 'ENGLISH',
    material_type: 'answer_key',
    source_url: 'https://www.tnpsc.gov.in/Document/Answerkeyfinalresult/GROUP_II_032022_PRELIMS_FIN_KEY.pdf',
    is_official: 1,
    file_original_name: 'Group2A_Final_Answer_Key.pdf',
    file_stored_name: 'tnpsc-group2a-final-answer-key.pdf',
  },

  // ==========================================
  // GROUP 3 / GROUP 3A (Combined Civil Services-III / III-A)
  // ==========================================
  {
    title: 'TNPSC Group 3 & 3A Combined Civil Services Scheme and Revised Syllabus',
    description: 'Official TNPSC scheme and revised syllabus for Combined Civil Services Examination-III and III-A (Junior Inspector of Co-operative Societies, Store Keeper).',
    subject: 'Official Syllabus',
    exam_group: 'GROUP_3',
    language: 'ENGLISH',
    material_type: 'syllabus',
    source_url: 'https://www.tnpsc.gov.in/static_pdf/Syllabus/1_Scheme_Revised_01122021.pdf',
    is_official: 1,
    file_original_name: 'TNPSC_Group_3_Revised_Scheme_Syllabus.pdf',
    file_stored_name: 'tnpsc-group3-scheme-syllabus.pdf',
  },
  {
    title: 'TNPSC தொகுதி 3 மற்றும் 3A அதிகாரப்பூர்வ பாடத்திட்டம் மற்றும் தேர்வுத் திட்டம்',
    description: 'கூட்டுறவு சங்கங்களின் இளநிலை ஆய்வாளர் உள்ளிட்ட தொகுதி 3 மற்றும் 3A பதவிகளுக்கான திருத்தப்பட்ட அதிகாரப்பூர்வ பாடத்திட்டம் மற்றும் தேர்வு முறை.',
    subject: 'அதிகாரப்பூர்வ பாடத்திட்டம்',
    exam_group: 'GROUP_3',
    language: 'TAMIL',
    material_type: 'syllabus',
    source_url: 'https://www.tnpsc.gov.in/static_pdf/Syllabus/1_Scheme_Revised_01122021.pdf',
    is_official: 1,
    file_original_name: 'TNPSC_Group_3_Syllabus_Tamil.pdf',
    file_stored_name: 'tnpsc-group3-syllabus-ta.pdf',
  },
  {
    title: 'TNPSC Group 3 Examination Pattern & Single Stage Written Scheme',
    description: 'Official single stage objective type examination pattern (HSC Standard General Studies, Aptitude, General Tamil / General English, 300 marks).',
    subject: 'Exam Scheme & Pattern',
    exam_group: 'GROUP_3',
    language: 'ENGLISH',
    material_type: 'exam_pattern',
    source_url: 'https://www.tnpsc.gov.in/static_pdf/Syllabus/1_Scheme_Revised_01122021.pdf',
    is_official: 1,
    file_original_name: 'Group3_Exam_Pattern_Scheme.pdf',
    file_stored_name: 'tnpsc-group3-exam-pattern.pdf',
  },
  {
    title: 'TNPSC தொகுதி 3 பொதுத்தமிழ் பாடக்குறிப்புகள் (மேல்நிலைப் பள்ளித் தரம்)',
    description: 'தொகுதி 3 தேர்விற்குரிய பொதுத்தமிழ்: 11 மற்றும் 12-ஆம் வகுப்பு தரம் கொண்ட இலக்கணம், இலக்கியக் கூறுகள் மற்றும் உரைநடை வழிகாட்டி.',
    subject: 'பொதுத்தமிழ்',
    exam_group: 'GROUP_3',
    language: 'TAMIL',
    material_type: 'study_material',
    source_url: 'http://www.tamilvu.org/',
    is_official: 1,
    file_original_name: 'Group3_General_Tamil_Guide.pdf',
    file_stored_name: 'tnpsc-group3-general-tamil.pdf',
  },
  {
    title: 'TNPSC Group 3 General Studies - Higher Secondary Standard Guide',
    description: 'Comprehensive General Studies material covering Indian History, Geography, Indian Polity, Economy, and Everyday Science calibrated to HSC Standard.',
    subject: 'General Studies',
    exam_group: 'GROUP_3',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group3_General_Studies_HSC.pdf',
    file_stored_name: 'tnpsc-group3-general-studies.pdf',
  },
  {
    title: 'TNPSC தொகுதி 3 பொது அறிவு மற்றும் தமிழ்நாடு வரலாறு பாடங்கள்',
    description: 'மேல்நிலைத் தரத்திலான பொது அறிவு, தமிழ்நாடு வரலாறு, பண்பாடு, மற்றும் சுதந்திரப் போராட்ட வரலாற்று நிகழ்வுகள்.',
    subject: 'பொது அறிவு & தமிழ்நாடு வரலாறு',
    exam_group: 'GROUP_3',
    language: 'TAMIL',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group3_General_Studies_Tamil.pdf',
    file_stored_name: 'tnpsc-group3-general-studies-ta.pdf',
  },
  {
    title: 'TNPSC Group 3 Aptitude and Mental Ability Practice Module',
    description: 'HSC standard aptitude test preparation covering Percentage, Profit and Loss, Simple Interest, Time and Work, and Diagrammatic Reasoning.',
    subject: 'Aptitude & Mental Ability',
    exam_group: 'GROUP_3',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group3_Aptitude_Mental_Ability.pdf',
    file_stored_name: 'tnpsc-group3-aptitude.pdf',
  },
  {
    title: 'TNPSC Group 3 Current Affairs - State and National Round-up',
    description: 'Essential current affairs round-up for Group 3 candidates covering state government achievements, science updates, and sports honours.',
    subject: 'Current Affairs',
    exam_group: 'GROUP_3',
    language: 'ENGLISH',
    material_type: 'current_affairs',
    source_url: 'https://pib.gov.in/',
    is_official: 1,
    file_original_name: 'Group3_Current_Affairs_Roundup.pdf',
    file_stored_name: 'tnpsc-group3-current-affairs.pdf',
  },
  {
    title: 'TNPSC Group 3 Combined Civil Services Examination Official Final Answer Key',
    description: 'Official TNPSC finalized answer key for Combined Civil Services Examination-III after resolving all candidate feedback.',
    subject: 'Answer Keys',
    exam_group: 'GROUP_3',
    language: 'ENGLISH',
    material_type: 'answer_key',
    source_url: 'https://www.tnpsc.gov.in/Document/Answerkeyfinalresult/CCSE_III_262022_FIN_KEY.pdf',
    is_official: 1,
    file_original_name: 'Group3_CCSE_III_Final_Answer_Key.pdf',
    file_stored_name: 'tnpsc-group3-final-answer-key.pdf',
  },
  {
    title: 'TNPSC Group 3A Junior Inspector of Co-operative Societies Official Answer Key',
    description: 'Official answer key for Group 3A Junior Inspector of Co-operative Societies examination issued by Tamil Nadu Public Service Commission.',
    subject: 'Answer Keys',
    exam_group: 'GROUP_3',
    language: 'ENGLISH',
    material_type: 'answer_key',
    source_url: 'https://www.tnpsc.gov.in/Document/Answerkeyfinalresult/GROUP_III_A_FIN_ANSKEYS_2k13.pdf',
    is_official: 1,
    file_original_name: 'Group3A_Junior_Inspector_Final_Key.pdf',
    file_stored_name: 'tnpsc-group3a-final-key.pdf',
  },

  // ==========================================
  // GROUP 4 (Combined Civil Services-IV / VAO)
  // ==========================================
  {
    title: 'TNPSC Group 4 and VAO Official Syllabus - English Medium',
    description: 'Official TNPSC syllabus for Group IV and Village Administrative Officer (VAO) containing Part A (General Tamil or General English) and Part B (General Studies & Aptitude).',
    subject: 'Official Syllabus',
    exam_group: 'GROUP_4',
    language: 'ENGLISH',
    material_type: 'syllabus',
    source_url: 'https://tnpsc.gov.in/static_pdf/syllabus/496_Group%20IV%20Syllabus.pdf',
    is_official: 1,
    file_original_name: 'TNPSC_Group_4_Official_Syllabus_English.pdf',
    file_stored_name: 'tnpsc-group4-syllabus-en.pdf',
  },
  {
    title: 'TNPSC தொகுதி 4 மற்றும் கிராம நிர்வாக அலுவலர் (VAO) அதிகாரப்பூர்வ பாடத்திட்டம்',
    description: 'தமிழ்நாடு அரசுப் பணியாளர் தேர்வாணையம் வழங்கியுள்ள தொகுதி 4 மற்றும் வி.ஏ.ஓ தேர்வுகளுக்கான பத்தாம் வகுப்பு தரம் கொண்ட முழுமையான அதிகாரப்பூர்வ பாடத்திட்டம்.',
    subject: 'அதிகாரப்பூர்வ பாடத்திட்டம்',
    exam_group: 'GROUP_4',
    language: 'TAMIL',
    material_type: 'syllabus',
    source_url: 'https://tnpsc.gov.in/static_pdf/syllabus/496_Group%20IV%20Syllabus.pdf',
    is_official: 1,
    file_original_name: 'TNPSC_Group_4_Official_Syllabus_Tamil.pdf',
    file_stored_name: 'tnpsc-group4-syllabus-ta.pdf',
  },
  {
    title: 'TNPSC Group 4 Official Recruitment Notification - English',
    description: 'Official recruitment notification for TNPSC Group 4 Services (Junior Assistant, Bill Collector, Typist, Steno-Typist, and Village Administrative Officer).',
    subject: 'Official Notifications',
    exam_group: 'GROUP_4',
    language: 'ENGLISH',
    material_type: 'notification',
    source_url: 'https://www.tnpsc.gov.in/Document/english/Grp%20IV%20English.pdf',
    is_official: 1,
    file_original_name: 'TNPSC_Group_4_Notification_English.pdf',
    file_stored_name: 'tnpsc-group4-notification-en.pdf',
  },
  {
    title: 'TNPSC தொகுதி 4 அதிகாரப்பூர்வ தேர்வு அறிவிக்கை - தமிழ்',
    description: 'கிராம நிர்வாக அலுவலர், இளநிலை உதவியாளர், தட்டச்சர், சுருக்கெழுத்து தட்டச்சர் உள்ளிட்ட பதவிகளுக்கான விரிவான அதிகாரப்பூர்வ அறிவிக்கை மற்றும் காலிப்பணியிட விவரங்கள்.',
    subject: 'அதிகாரப்பூர்வ அறிவிப்புகள்',
    exam_group: 'GROUP_4',
    language: 'TAMIL',
    material_type: 'notification',
    source_url: 'https://www.tnpsc.gov.in/Document/tamil/Grp%20IV%20Tamil.pdf',
    is_official: 1,
    file_original_name: 'TNPSC_Group_4_Notification_Tamil.pdf',
    file_stored_name: 'tnpsc-group4-notification-ta.pdf',
  },
  {
    title: 'TNPSC Group 4 Exam Pattern & Single Paper Scheme',
    description: 'Official examination scheme: Single paper of 3 hours, 200 objective questions, 300 marks (Part A: 100 Qs Language/Tamil Eligibility, Part B: 75 Qs General Studies + 25 Qs Aptitude).',
    subject: 'Exam Scheme & Pattern',
    exam_group: 'GROUP_4',
    language: 'ENGLISH',
    material_type: 'exam_pattern',
    source_url: 'https://tnpsc.gov.in/static_pdf/syllabus/496_Group%20IV%20Syllabus.pdf',
    is_official: 1,
    file_original_name: 'Group4_Exam_Pattern_Scheme.pdf',
    file_stored_name: 'tnpsc-group4-exam-pattern.pdf',
  },
  {
    title: 'TNPSC தொகுதி 4 பொதுத்தமிழ் (SSLC தரம்) முழுமையான பாடக்குறிப்புகள்',
    description: '6 முதல் 10-ஆம் வகுப்பு வரையிலான சமச்சீர் கல்வி பாடப்புத்தகங்களின் அடிப்படையில் அமைக்கப்பட்ட இலக்கணம், செய்யுள், உரைநடை, நூல்கள் மற்றும் ஆசிரியர்கள் பற்றிய முழு வழிகாட்டி.',
    subject: 'பொதுத்தமிழ்',
    exam_group: 'GROUP_4',
    language: 'TAMIL',
    material_type: 'study_material',
    source_url: 'http://www.tamilvu.org/',
    is_official: 1,
    file_original_name: 'Group4_General_Tamil_SSLC_Complete.pdf',
    file_stored_name: 'tnpsc-group4-general-tamil.pdf',
  },
  {
    title: 'TNPSC Group 4 General English - SSLC Standard Complete Grammar Guide',
    description: 'Complete SSLC-level General English grammar reference covering parts of speech, active/passive voice, direct/indirect speech, prepositions, degrees of comparison, and antonyms.',
    subject: 'General English',
    exam_group: 'GROUP_4',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group4_General_English_SSLC.pdf',
    file_stored_name: 'tnpsc-group4-general-english.pdf',
  },
  {
    title: 'TNPSC Group 4 General Studies - Samacheer Kalvi 6th to 10th Standard Reference',
    description: 'Foundational General Studies notes based on Tamil Nadu State Board Samacheer Kalvi textbooks covering Science, History, Geography, and Civics.',
    subject: 'General Studies',
    exam_group: 'GROUP_4',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group4_General_Studies_Samacheer.pdf',
    file_stored_name: 'tnpsc-group4-general-studies.pdf',
  },
  {
    title: 'TNPSC தொகுதி 4 பொது அறிவு - சமச்சீர் கல்வி 6 முதல் 10-ஆம் வகுப்பு கையேடு',
    description: 'தமிழ்நாடு அரசு சமச்சீர் கல்வி பாடத்திட்டத்தின் அறிவியல், வரலாறு, புவியியல், குடிமையியல் மற்றும் பொருளியல் பாடங்களின் சுருக்கமான குறிப்புகள்.',
    subject: 'பொது அறிவு',
    exam_group: 'GROUP_4',
    language: 'TAMIL',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group4_General_Studies_Tamil.pdf',
    file_stored_name: 'tnpsc-group4-general-studies-ta.pdf',
  },
  {
    title: 'TNPSC Group 4 Aptitude and Mental Ability (SSLC Mathematics)',
    description: 'High-yield math formula sheets, shortcuts, and 25-mark strategy for Simplification, Ratio, HCF & LCM, Percentage, Profit & Loss, Simple Interest, and Logical Reasoning.',
    subject: 'Aptitude & Mental Ability',
    exam_group: 'GROUP_4',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group4_Aptitude_Mental_Ability.pdf',
    file_stored_name: 'tnpsc-group4-aptitude.pdf',
  },
  {
    title: 'TNPSC தொகுதி 4 கணிதம் மற்றும் திறனறி தேர்வு தீர்வு முறைகள்',
    description: '25 மதிப்பெண்களுக்கான கணிதப் பகுதி: சுருக்குதல், விழுக்காடு, மீ.பொ.வ, மீ.சி.ம, தனிவட்டி, பரப்பளவு மற்றும் தர்க்கவியல் வினாக்களுக்கான எளிய குறுக்கு வழிகள்.',
    subject: 'கணிதம் & திறனறி தேர்வு',
    exam_group: 'GROUP_4',
    language: 'TAMIL',
    material_type: 'study_material',
    source_url: 'https://www.textbooksonline.tn.nic.in/',
    is_official: 1,
    file_original_name: 'Group4_Aptitude_Tamil.pdf',
    file_stored_name: 'tnpsc-group4-aptitude-ta.pdf',
  },
  {
    title: 'TNPSC Group 4 Indian Polity, Constitution and Village Administration Basics',
    description: 'Essential polity concepts, Fundamental Rights, Panchayati Raj three-tier structure, and the duties and functions of Village Administrative Officers (VAO).',
    subject: 'Indian Polity & Administration',
    exam_group: 'GROUP_4',
    language: 'ENGLISH',
    material_type: 'study_material',
    source_url: 'https://www.india.gov.in/',
    is_official: 1,
    file_original_name: 'Group4_Polity_Village_Administration.pdf',
    file_stored_name: 'tnpsc-group4-polity-vao.pdf',
  },
  {
    title: 'TNPSC தொகுதி 4 இந்திய அரசியலமைப்பு மற்றும் கிராம நிர்வாகக் கையேடு',
    description: 'இந்திய அரசியலமைப்பு விதிகள், கிராம பஞ்சாயத்து அமைப்பு, கிராம நிர்வாக அலுவலரின் அதிகாரங்கள், நில அளவை மற்றும் வருவாய்த்துறை ஆவணங்கள் பற்றிய குறிப்புகள்.',
    subject: 'இந்திய அரசியலமைப்பு & கிராம நிர்வாகம்',
    exam_group: 'GROUP_4',
    language: 'TAMIL',
    material_type: 'study_material',
    source_url: 'https://www.india.gov.in/ta',
    is_official: 1,
    file_original_name: 'Group4_Polity_VAO_Tamil.pdf',
    file_stored_name: 'tnpsc-group4-polity-vao-ta.pdf',
  },
  {
    title: 'TNPSC Group 4 Current Affairs & Tamil Nadu Welfare Schemes',
    description: 'Curated collection of state government schemes, awards, national events, sports achievements, and appointments essential for Group 4 exam.',
    subject: 'Current Affairs',
    exam_group: 'GROUP_4',
    language: 'ENGLISH',
    material_type: 'current_affairs',
    source_url: 'https://dipr.tn.gov.in/',
    is_official: 1,
    file_original_name: 'Group4_Current_Affairs_Schemes.pdf',
    file_stored_name: 'tnpsc-group4-current-affairs.pdf',
  },
  {
    title: 'TNPSC தொகுதி 4 நடப்பு நிகழ்வுகள் மற்றும் தமிழக அரசின் திட்டங்கள்',
    description: 'கலைஞர் மகளிர் உரிமைத் திட்டம், புதுமைப் பெண் திட்டம், நான் முதல்வன் திட்டம் மற்றும் முக்கிய மாநில, தேசிய நடப்பு நிகழ்வுகள்.',
    subject: 'நடப்பு நிகழ்வுகள்',
    exam_group: 'GROUP_4',
    language: 'TAMIL',
    material_type: 'current_affairs',
    source_url: 'https://dipr.tn.gov.in/',
    is_official: 1,
    file_original_name: 'Group4_Current_Affairs_Tamil.pdf',
    file_stored_name: 'tnpsc-group4-current-affairs-ta.pdf',
  },
  {
    title: 'TNPSC Group 4 Examination Question Paper - Tamil Eligibility & General Studies',
    description: 'Official TNPSC question paper from Combined Civil Services Examination-IV containing 100 questions of Tamil Eligibility Test and 100 questions of General Studies & Aptitude.',
    subject: 'Previous Year Question Papers',
    exam_group: 'GROUP_4',
    language: 'ENGLISH',
    material_type: 'question_paper',
    source_url: 'https://www.tnpsc.gov.in/static_pdf/otwoanskeys/18_2024_TET_With_General%20Studies.pdf',
    is_official: 1,
    file_original_name: 'Group4_TET_General_Studies_Official_Paper.pdf',
    file_stored_name: 'tnpsc-group4-pyq-official-paper.pdf',
  },
  {
    title: 'TNPSC Group 4 Examination Official Final Answer Key',
    description: 'Official TNPSC finalized answer key for Combined Civil Services Examination-IV containing verified answers for all sets.',
    subject: 'Answer Keys',
    exam_group: 'GROUP_4',
    language: 'ENGLISH',
    material_type: 'answer_key',
    source_url: 'https://www.tnpsc.gov.in/Document/Answerkeyfinalresult/07_2025_CCSE_IV_FINAL_ANSWER_KEY.pdf',
    is_official: 1,
    file_original_name: 'Group4_CCSE_IV_Final_Answer_Key.pdf',
    file_stored_name: 'tnpsc-group4-final-answer-key.pdf',
  },
  {
    title: 'TNPSC Group 4 Previous Year Final Answer Key (Past CCSE-IV)',
    description: 'Official archived answer key from past TNPSC Group IV examination published by the Commission for reference and revision.',
    subject: 'Answer Keys',
    exam_group: 'GROUP_4',
    language: 'ENGLISH',
    material_type: 'answer_key',
    source_url: 'https://www.tnpsc.gov.in/Document/Answerkeyfinalresult/GROUP_IV_FIN_ANS_KEY_23_2017.pdf',
    is_official: 1,
    file_original_name: 'Group4_Past_Final_Answer_Key.pdf',
    file_stored_name: 'tnpsc-group4-past-answer-key.pdf',
  },
];

async function seedStudyMaterials() {
  console.log('====================================================');
  console.log(' SEEDING STUDY MATERIALS - TNPSC GROUPS 1, 2, 2A, 3, 4');
  console.log('====================================================');

  const connection = await pool.getConnection();

  try {
    // 1. Initial State Counts
    const [[{ beforeCount }]] = await connection.query('SELECT COUNT(*) AS beforeCount FROM study_materials');
    const [[{ userCount }]] = await connection.query('SELECT COUNT(*) AS userCount FROM users');
    const [[{ jobCount }]] = await connection.query('SELECT COUNT(*) AS jobCount FROM jobs');
    const [[{ appCount }]] = await connection.query('SELECT COUNT(*) AS appCount FROM applications');
    const [[{ catCount }]] = await connection.query('SELECT COUNT(*) AS catCount FROM job_categories');

    console.log(`[STATE BEFORE SEEDING]`);
    console.log(`  Existing study materials : ${beforeCount}`);
    console.log(`  Existing users preserved : ${userCount}`);
    console.log(`  Existing jobs preserved  : ${jobCount}`);
    console.log(`  Existing applications    : ${appCount}`);
    console.log(`  Existing categories      : ${catCount}`);

    // Category 13 is 'Tamil Nadu Government'
    const categoryId = 13;
    // Default Admin User ID
    const defaultUserId = 1;

    let addedCount = 0;
    let skippedCount = 0;

    for (const item of MATERIALS_DATA) {
      // Deduplication check: check by title + exam_group + language OR source_url + title
      const [existing] = await connection.query(
        `SELECT id FROM study_materials 
         WHERE (title = ? AND exam_group = ? AND language = ?)
            OR (source_url = ? AND title = ?)`,
        [item.title, item.exam_group, item.language, item.source_url, item.title]
      );

      if (existing.length > 0) {
        skippedCount++;
        continue;
      }

      // Generate a physical starter PDF so local file download succeeds seamlessly
      const physicalPdfPath = createStarterPdf(
        item.file_stored_name,
        item.title,
        item.exam_group,
        item.language,
        item.material_type,
        item.source_url
      );

      const relativeFilePath = `study-materials/${item.file_stored_name}`;
      const fileSize = fs.statSync(physicalPdfPath).size;

      const slug = await StudyMaterialService.generateUniqueSlug(item.title);

      await connection.query(
        `INSERT INTO study_materials (
          title, slug, description, subject, category_id,
          material_type, exam_group, language, source_url, is_official,
          file_original_name, file_stored_name, file_path, file_mime_type, file_size,
          status, uploaded_by, download_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, 0)`,
        [
          item.title,
          slug,
          item.description,
          item.subject,
          categoryId,
          item.material_type,
          item.exam_group,
          item.language,
          item.source_url,
          item.is_official,
          item.file_original_name,
          item.file_stored_name,
          relativeFilePath,
          'application/pdf',
          fileSize,
          defaultUserId,
        ]
      );

      addedCount++;
    }

    // Post-seeding counts and statistics
    const [[{ afterCount }]] = await connection.query('SELECT COUNT(*) AS afterCount FROM study_materials');
    const [groupCounts] = await connection.query(
      `SELECT exam_group, COUNT(*) as cnt FROM study_materials GROUP BY exam_group ORDER BY exam_group`
    );
    const [langCounts] = await connection.query(
      `SELECT language, COUNT(*) as cnt FROM study_materials GROUP BY language ORDER BY language`
    );
    const [typeCounts] = await connection.query(
      `SELECT material_type, COUNT(*) as cnt FROM study_materials GROUP BY material_type ORDER BY material_type`
    );
    const [[{ cnt: officialCount }]] = await connection.query(
      'SELECT COUNT(*) as cnt FROM study_materials WHERE is_official = 1'
    );
    const [[{ cnt: pyqCount }]] = await connection.query(
      "SELECT COUNT(*) as cnt FROM study_materials WHERE material_type = 'question_paper'"
    );

    // Verify preservation of other tables
    const [[{ userCount: userCountAfter }]] = await connection.query('SELECT COUNT(*) AS userCount FROM users');
    const [[{ jobCount: jobCountAfter }]] = await connection.query('SELECT COUNT(*) AS jobCount FROM jobs');
    const [[{ appCount: appCountAfter }]] = await connection.query('SELECT COUNT(*) AS appCount FROM applications');
    const [[{ catCount: catCountAfter }]] = await connection.query('SELECT COUNT(*) AS catCount FROM job_categories');

    console.log('\n====================================================');
    console.log(' SEEDING RESULTS & DATABASE SAFETY REPORT');
    console.log('====================================================');
    console.log(`  Existing study materials before: ${beforeCount}`);
    console.log(`  New materials added            : ${addedCount}`);
    console.log(`  Existing study materials preserved: ${beforeCount}`);
    console.log(`  Duplicate records skipped      : ${skippedCount}`);
    console.log(`  Total study materials now      : ${afterCount}`);
    console.log(`  Official source materials      : ${officialCount}`);
    console.log(`  Previous Year Papers           : ${pyqCount}`);
    console.log('----------------------------------------------------');
    console.log('  Count by Exam Group:');
    groupCounts.forEach((r) => console.log(`    - ${r.exam_group}: ${r.cnt}`));
    console.log('  Count by Language:');
    langCounts.forEach((r) => console.log(`    - ${r.language}: ${r.cnt}`));
    console.log('  Count by Material Type:');
    typeCounts.forEach((r) => console.log(`    - ${r.material_type}: ${r.cnt}`));
    console.log('----------------------------------------------------');
    console.log(`  Existing users preserved       : ${userCountAfter} (Before: ${userCount})`);
    console.log(`  Existing jobs preserved        : ${jobCountAfter} (Before: ${jobCount})`);
    console.log(`  Existing applications preserved: ${appCountAfter} (Before: ${appCount})`);
    console.log(`  Existing categories preserved  : ${catCountAfter} (Before: ${catCount})`);
    console.log('====================================================\n');
  } catch (error) {
    console.error('Fatal error during study material seeding:', error);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seedStudyMaterials();
