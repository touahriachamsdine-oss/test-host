/**
 * Imports every project in C:\Users\anouar\Documents\proto\spud that is not
 * already in the database:
 *
 *   - the four patent workbooks (Lens.org exports)
 *   - the Arabic micro-enterprise catalogue (24 sector sheets)
 *   - the open-hardware catalogue (already imported by import-open-hardware.cjs)
 *
 *   node scripts/import-excels.cjs --dry-run
 *   node scripts/import-excels.cjs --apply
 *
 * Ids are prefixed `pt-` (patents) and `ae-` (Arabic enterprises), so a
 * rollback is: DELETE FROM startups WHERE id LIKE 'pt-%' OR id LIKE 'ae-%';
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const XLSX = require(process.env.XLSX_PATH || 'xlsx');

const SOURCE_DIR = process.env.SPUD_DIR || 'C:\\Users\\anouar\\Documents\\proto\\spud';
const mode = process.argv.includes('--apply') ? 'apply' : 'dry-run';

/** [arabic, english, latitude, longitude] */
const COUNTRIES = [
  ['الولايات المتحدة', 'United States', 38.9072, -77.0369],
  ['أمريكا', 'United States', 38.9072, -77.0369],
  ['ألمانيا', 'Germany', 52.52, 13.405],
  ['الهند', 'India', 28.6139, 77.209],
  ['هولندا', 'Netherlands', 52.3676, 4.9041],
  ['كندا', 'Canada', 45.4215, -75.6972],
  ['فرنسا', 'France', 48.8566, 2.3522],
  ['إيطاليا', 'Italy', 41.9028, 12.4964],
  ['الصين', 'China', 39.9042, 116.4074],
  ['اليابان', 'Japan', 35.6762, 139.6503],
  ['المملكة المتحدة', 'United Kingdom', 51.5074, -0.1278],
  ['بريطانيا', 'United Kingdom', 51.5074, -0.1278],
  ['تركيا', 'Turkey', 39.9334, 32.8597],
  ['مصر', 'Egypt', 30.0444, 31.2357],
  ['إسبانيا', 'Spain', 40.4168, -3.7038],
  ['أستراليا', 'Australia', -35.2809, 149.13],
  ['المغرب', 'Morocco', 34.0209, -6.8416],
  ['النرويج', 'Norway', 59.9139, 10.7522],
  ['إسرائيل', 'Israel', 31.7683, 35.2137],
  ['كينيا', 'Kenya', -1.2921, 36.8219],
  ['المكسيك', 'Mexico', 19.4326, -99.1332],
  ['فيتنام', 'Vietnam', 21.0278, 105.8342],
  ['البرازيل', 'Brazil', -15.7939, -47.8828],
  ['سنغافورة', 'Singapore', 1.3521, 103.8198],
  ['نيجيريا', 'Nigeria', 9.0765, 7.3986],
  ['بلجيكا', 'Belgium', 50.8503, 4.3517],
  ['سويسرا', 'Switzerland', 46.948, 7.4474],
  ['بولندا', 'Poland', 52.2297, 21.0122],
  ['الإمارات', 'United Arab Emirates', 24.4539, 54.3773],
  ['السويد', 'Sweden', 59.3293, 18.0686],
  ['تايلاند', 'Thailand', 13.7563, 100.5018],
  ['تونس', 'Tunisia', 36.8065, 10.1815],
  ['الدنمارك', 'Denmark', 55.6761, 12.5683],
  ['فنلندا', 'Finland', 60.1699, 24.9384],
  ['ماليزيا', 'Malaysia', 3.139, 101.6869],
  ['كوريا الجنوبية', 'South Korea', 37.5665, 126.978],
  ['جمهورية كوريا', 'South Korea', 37.5665, 126.978],
  ['تشيلي', 'Chile', -33.4489, -70.6693],
  ['تشيكيا', 'Czechia', 50.0755, 14.4378],
  ['التشيك', 'Czechia', 50.0755, 14.4378],
  ['فلسطين', 'Palestine', 31.9038, 35.2034],
  ['السعودية', 'Saudi Arabia', 24.7136, 46.6753],
  ['المملكة العربية السعودية', 'Saudi Arabia', 24.7136, 46.6753],
  ['إندونيسيا', 'Indonesia', -6.2088, 106.8456],
  ['نيوزيلندا', 'New Zealand', -41.2866, 174.7756],
  ['جنوب أفريقيا', 'South Africa', -25.7479, 28.2293],
  ['الأرجنتين', 'Argentina', -34.6037, -58.3816],
  ['اليونان', 'Greece', 37.9838, 23.7275],
  ['النمسا', 'Austria', 48.2082, 16.3738],
  ['باكستان', 'Pakistan', 33.6844, 73.0479],
  ['الأردن', 'Jordan', 31.9454, 35.9284],
  ['البرتغال', 'Portugal', 38.7223, -9.1393],
  ['أيرلندا', 'Ireland', 53.3498, -6.2603],
  ['لوكسمبورغ', 'Luxembourg', 49.6116, 6.1319],
  ['غانا', 'Ghana', 5.6037, -0.187],
  ['بنغلاديش', 'Bangladesh', 23.8103, 90.4125],
  ['إستونيا', 'Estonia', 59.437, 24.7536],
  ['كرواتيا', 'Croatia', 45.815, 15.9819],
  ['جزر فارو', 'Faroe Islands', 62.0079, -6.7909],
  ['بيرو', 'Peru', -12.0464, -77.0428],
  ['إثيوبيا', 'Ethiopia', 9.032, 38.7469],
  ['الجزائر', 'Algeria', 36.7538, 3.0588],
  ['كولومبيا', 'Colombia', 4.711, -74.0721],
  ['الإكوادور', 'Ecuador', -0.1807, -78.4678],
  ['سلوفينيا', 'Slovenia', 46.0569, 14.5058],
  ['سلوفاكيا', 'Slovakia', 48.1486, 17.1077],
  ['بلغاريا', 'Bulgaria', 42.6977, 23.3219],
  ['ميانمار', 'Myanmar', 16.8661, 96.1951],
  ['زيمبابوي', 'Zimbabwe', -17.8252, 31.0335],
  ['رواندا', 'Rwanda', -1.9441, 30.0619],
  ['أوغندا', 'Uganda', 0.3476, 32.5825],
  ['تايوان', 'Taiwan', 25.033, 121.5654],
  ['مالطا', 'Malta', 35.8989, 14.5146],
  ['تنزانيا', 'Tanzania', -6.7924, 39.2083],
  ['آيسلندا', 'Iceland', 64.1466, -21.9426],
  ['إيران', 'Iran', 35.6892, 51.389],
  ['المجر', 'Hungary', 47.4979, 19.0402],
  ['ناميبيا', 'Namibia', -22.5609, 17.0658],
  ['النيبال', 'Nepal', 27.7172, 85.324],
  ['ليتوانيا', 'Lithuania', 54.6872, 25.2797],
  ['روسيا', 'Russia', 55.7558, 37.6173],
  ['لاتفيا', 'Latvia', 56.9496, 24.1052],
  ['اسكتلندا', 'Scotland', 55.9533, -3.1883],
  ['كوستاريكا', 'Costa Rica', 9.9281, -84.0907],
  ['ساحل العاج', "Côte d'Ivoire", 6.8276, -5.2893],
  ['الفلبين', 'Philippines', 14.5995, 120.9842],
  ['كمبوديا', 'Cambodia', 11.5564, 104.9282],
  ['قطر', 'Qatar', 25.2854, 51.531],
  ['هونغ كونغ', 'Hong Kong', 22.3193, 114.1694],
  ['بنما', 'Panama', 8.9824, -79.5199],
  ['زامبيا', 'Zambia', -15.3875, 28.3228],
  ['البوسنة والهرسك', 'Bosnia and Herzegovina', 43.8563, 18.4131],
  ['بنين', 'Benin', 6.4969, 2.6289],
  ['صربيا', 'Serbia', 44.7866, 20.4489],
  ['أرمينيا', 'Armenia', 40.1792, 44.4991],
  ['سلطنة عمان', 'Oman', 23.588, 58.3829],
  ['عمان', 'Oman', 23.588, 58.3829],
  ['العراق', 'Iraq', 33.3152, 44.3661],
  ['الكويت', 'Kuwait', 29.3759, 47.9774],
  ['أنغولا', 'Angola', -8.839, 13.2894],
  ['الكاميرون', 'Cameroon', 3.848, 11.5021],
  ['السودان', 'Sudan', 15.5007, 32.5599],
  ['دولي', 'International', null, null],
  ['عالمي', 'International', null, null]
];

const COUNTRY_BY_ARABIC = new Map(COUNTRIES.map(([ar, en, lat, lng]) => [ar, { en, lat, lng }]));

/** Normalises messy country cells such as "الصين - تشنغدو" or "فرنسا؛ باريس". */
function countryOf(raw) {
  const text = String(raw || '').trim();
  if (!text) return { en: 'Unknown', lat: null, lng: null };
  if (COUNTRY_BY_ARABIC.has(text)) return COUNTRY_BY_ARABIC.get(text);
  const head = text
    .split(/[؛/|(]/)[0]
    .replace(/\s*[-–]\s*.*$/, '')
    .replace(/\s*\(.*$/, '')
    .trim();
  if (COUNTRY_BY_ARABIC.has(head)) return COUNTRY_BY_ARABIC.get(head);
  const partial = COUNTRIES.find(([ar]) => head.startsWith(ar) || ar.startsWith(head));
  if (partial) return { en: partial[1], lat: partial[2], lng: partial[3] };
  return { en: 'International', lat: null, lng: null };
}

/** Patent jurisdictions. */
const JURISDICTIONS = {
  US: { en: 'United States', lat: 38.9072, lng: -77.0369 },
  EP: { en: 'Germany', lat: 48.1351, lng: 11.582 },
  WO: { en: 'Switzerland', lat: 46.2044, lng: 6.1432 },
  CN: { en: 'China', lat: 39.9042, lng: 116.4074 },
  JP: { en: 'Japan', lat: 35.6762, lng: 139.6503 },
  KR: { en: 'South Korea', lat: 37.5665, lng: 126.978 },
  AU: { en: 'Australia', lat: -35.2809, lng: 149.13 },
  IE: { en: 'Ireland', lat: 53.3498, lng: -6.2603 },
  GB: { en: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  DE: { en: 'Germany', lat: 52.52, lng: 13.405 },
  FR: { en: 'France', lat: 48.8566, lng: 2.3522 },
  CA: { en: 'Canada', lat: 45.4215, lng: -75.6972 },
  IN: { en: 'India', lat: 28.6139, lng: 77.209 },
  TW: { en: 'Taiwan', lat: 25.033, lng: 121.5654 },
  SG: { en: 'Singapore', lat: 1.3521, lng: 103.8198 },
  IL: { en: 'Israel', lat: 31.7683, lng: 35.2137 },
  BR: { en: 'Brazil', lat: -15.7939, lng: -47.8828 },
  MX: { en: 'Mexico', lat: 19.4326, lng: -99.1332 },
  RU: { en: 'Russia', lat: 55.7558, lng: 37.6173 },
  AT: { en: 'Austria', lat: 48.2082, lng: 16.3738 },
  ES: { en: 'Spain', lat: 40.4168, lng: -3.7038 },
  IT: { en: 'Italy', lat: 41.9028, lng: 12.4964 },
  NL: { en: 'Netherlands', lat: 52.3676, lng: 4.9041 },
  SE: { en: 'Sweden', lat: 59.3293, lng: 18.0686 },
  CH: { en: 'Switzerland', lat: 46.948, lng: 7.4474 },
  DK: { en: 'Denmark', lat: 55.6761, lng: 12.5683 },
  FI: { en: 'Finland', lat: 60.1699, lng: 24.9384 },
  NO: { en: 'Norway', lat: 59.9139, lng: 10.7522 },
  PL: { en: 'Poland', lat: 52.2297, lng: 21.0122 },
  BE: { en: 'Belgium', lat: 50.8503, lng: 4.3517 },
  PT: { en: 'Portugal', lat: 38.7223, lng: -9.1393 },
  CZ: { en: 'Czechia', lat: 50.0755, lng: 14.4378 },
  HU: { en: 'Hungary', lat: 47.4979, lng: 19.0402 },
  TR: { en: 'Turkey', lat: 39.9334, lng: 32.8597 },
  ZA: { en: 'South Africa', lat: -25.7479, lng: 28.2293 },
  NZ: { en: 'New Zealand', lat: -41.2866, lng: 174.7756 },
  EA: { en: 'Eurasia', lat: 55.7558, lng: 37.6173 },
  AR: { en: 'Argentina', lat: -34.6037, lng: -58.3816 },
  CL: { en: 'Chile', lat: -33.4489, lng: -70.6693 },
  CO: { en: 'Colombia', lat: 4.711, lng: -74.0721 },
  MY: { en: 'Malaysia', lat: 3.139, lng: 101.6869 },
  TH: { en: 'Thailand', lat: 13.7563, lng: 100.5018 },
  VN: { en: 'Vietnam', lat: 21.0278, lng: 105.8342 },
  PH: { en: 'Philippines', lat: 14.5995, lng: 120.9842 },
  ID: { en: 'Indonesia', lat: -6.2088, lng: 106.8456 },
  EG: { en: 'Egypt', lat: 30.0444, lng: 31.2357 },
  MA: { en: 'Morocco', lat: 34.0209, lng: -6.8416 },
  DZ: { en: 'Algeria', lat: 36.7538, lng: 3.0588 },
  SA: { en: 'Saudi Arabia', lat: 24.7136, lng: 46.6753 },
  AE: { en: 'United Arab Emirates', lat: 24.4539, lng: 54.3773 }
};

const DOMAIN_RULES = [
  [/cyber|s[ée]curit[ée]|hacking/i, 'cybersecurity'],
  [/intelligence artificielle|machine learning|\bia\b|neural|llm/i, 'ai-computing'],
  [/nano/i, 'nanotech-materials'],
  [/robot/i, 'robotics'],
  [/drone|uav|a[ée]rien|transport|mobilit/i, 'drones-autonomy'],
  [/sant[ée]|m[ée]dical|pharma|th[ée]rapeut/i, 'medtech'],
  [/biotech|biolog|g[ée]nomi|sciences de la vie/i, 'biotech-healthtech'],
  [/puce|silicium|risc-v|asic|fpga|semi-conduct|processor|processeur/i, 'semiconductors'],
  [/fabrication num[ée]rique|cnc|impression 3d|usinage|r[ée]parabilit|machines?[- ]outils/i, 'manufacturing-3d'],
  [/[ée]nergie|puissance|batterie|stockage/i, 'energy-storage'],
  [/agriculture|alimentation|aquaculture|desalement|dessalement|eau/i, 'agritech-foodtech'],
  [/espace|spatial|satellite/i, 'space-aerospace'],
  [/environnement|climat|recyclage|d[ée]chet/i, 'cleantech'],
  [/iot|domotique|connect[ée]|internet|logiciel|informatique|num[ée]rique|cloud/i, 'cloud-iot']
];

function domainOf(label) {
  for (const [pattern, domain] of DOMAIN_RULES) {
    if (pattern.test(label)) return domain;
  }
  return 'other-deep-tech';
}

const SHEET_DOMAIN = {
  // patent workbooks
  'Énergies renouvelables (solaire': 'energy-storage',
  'Efficacité énergétique': 'energy-storage',
  'Dassalement de leau de mer': 'cleantech',
  Pharmaceutique: 'biotech-healthtech',
  Biotechnologies: 'biotech-healthtech',
  'Dispositifs Médicaux': 'medtech',
  IoT: 'cloud-iot',
  Cybersécurité: 'cybersecurity',
  'Systèmes intelligents': 'ai-computing',
  'Transport et mobiliré durable': 'drones-autonomy',
  // Arabic catalogue
  'مجال الفلاحة': 'agritech-foodtech',
  'المكننة الفلاحية': 'agritech-foodtech',
  'صناعة الغدائية': 'agritech-foodtech',
  'تربية المائيات': 'agritech-foodtech',
  الزراعة: 'agritech-foodtech',
  صناعة: 'manufacturing-3d',
  'الصناعات التحويلية': 'manufacturing-3d',
  'الطباعة ثلاثية الأبعاد والنمذجة': 'manufacturing-3d',
  الطاقة: 'energy-storage',
  'مشتقات وخدمات البترولية': 'energy-storage',
  روبوتيك: 'robotics',
  'البيئة و اعادة التدوير': 'cleantech',
  'حماية البيئة والغابات': 'cleantech',
  'الصحة والعناية بالجسم': 'medtech',
  'التكنولوجيا النانوية': 'nanotech-materials',
  'مشاريع مختلفة': 'other-deep-tech',
  السياحة: 'law-social-impact',
  'قطاع العقارات و البناء': 'law-social-impact',
  'مجال التاريخ والتراث': 'law-social-impact',
  رياضة: 'law-social-impact',
  'علم الاجتماع والانثروبولوجيا': 'law-social-impact',
  'قطاع الإعلام وصناعة المحتوى': 'law-social-impact',
  'التسويق واللغات': 'other-deep-tech',
  'خدمات الصيانة والتنظيف': 'other-deep-tech'
};

module.exports = { countryOf, domainOf, JURISDICTIONS, SHEET_DOMAIN, DOMAIN_RULES };
