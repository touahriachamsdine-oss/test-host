// Shared country resolution used by the fetch pipeline and the DB repair script.
// Keeping this in one place guarantees a repaired value is one the pipeline
// itself would also accept.

const NATIONALITY = {
  american: 'United States', us: 'United States', usa: 'United States', british: 'United Kingdom',
  english: 'United Kingdom', canadian: 'Canada', german: 'Germany', french: 'France', italian: 'Italy',
  spanish: 'Spain', chinese: 'China', japanese: 'Japan', korean: 'South Korea', southkorean: 'South Korea',
  russian: 'Russia', indian: 'India', brazilian: 'Brazil', australian: 'Australia', swiss: 'Switzerland',
  swedish: 'Sweden', norwegian: 'Norway', danish: 'Denmark', finnish: 'Finland', dutch: 'Netherlands',
  belgian: 'Belgium', austrian: 'Austria', polish: 'Poland', czech: 'Czech Republic', greek: 'Greece',
  portuguese: 'Portugal', turkish: 'Turkey', israeli: 'Israel', mexican: 'Mexico', argentine: 'Argentina',
  argentinian: 'Argentina', egyptian: 'Egypt', vietnamese: 'Vietnam', indonesian: 'Indonesia',
  thai: 'Thailand', malaysian: 'Malaysia', singaporean: 'Singapore', taiwanese: 'Taiwan',
  ukrainian: 'Ukraine', southafrican: 'South Africa', moroccan: 'Morocco', algerian: 'Algeria',
  iranian: 'Iran', pakistani: 'Pakistan', bangladeshi: 'Bangladesh', chilean: 'Chile', colombian: 'Colombia',
  newzealand: 'New Zealand', irish: 'Ireland', hungarian: 'Hungary', romanian: 'Romania', bulgarian: 'Bulgaria',
  croatian: 'Croatia', serbian: 'Serbia', slovak: 'Slovakia', slovenian: 'Slovenia', lithuanian: 'Lithuania',
  latvian: 'Latvia', estonian: 'Estonia', icelandic: 'Iceland', luxembourgish: 'Luxembourg', maltese: 'Malta'
};

const COUNTRY_NAMES = ['United States', 'United Kingdom', 'South Korea', 'United Arab Emirates', 'Saudi Arabia',
  'South Africa', 'Czech Republic', 'New Zealand', 'Netherlands', 'Germany', 'France', 'Italy', 'Spain',
  'China', 'Japan', 'Canada', 'Australia', 'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Finland',
  'Belgium', 'Austria', 'Poland', 'Greece', 'Portugal', 'Turkey', 'Israel', 'Mexico', 'Argentina',
  'Egypt', 'Vietnam', 'Indonesia', 'Thailand', 'Malaysia', 'Singapore', 'Taiwan', 'Ukraine', 'Russia',
  'India', 'Brazil', 'Ireland', 'Hungary', 'Romania', 'Bulgaria', 'Croatia', 'Serbia', 'Slovakia',
  'Slovenia', 'Lithuania', 'Latvia', 'Estonia', 'Iceland', 'Luxembourg', 'Morocco', 'Algeria', 'Tunisia',
  'Iran', 'Pakistan', 'Bangladesh', 'Chile', 'Colombia', 'Peru', 'Uruguay', 'Venezuela', 'Philippines',
  'Nigeria', 'Kenya', 'Ghana', 'Tanzania', 'Uganda', 'Zambia', 'Zimbabwe', 'Botswana', 'Namibia',
  'Mozambique', 'Ethiopia', 'Senegal', 'Ivory Coast', 'Cameroon', 'Rwanda', 'Mauritius', 'Ecuador',
  'Bolivia', 'Paraguay', 'Cuba', 'Kazakhstan', 'Uzbekistan', 'Azerbaijan', 'Georgia', 'Armenia',
  'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Jordan', 'Lebanon', 'Iraq', 'Sri Lanka', 'Nepal',
  'Myanmar', 'Cambodia', 'Laos', 'Mongolia', 'Afghanistan', 'Dominican Republic', 'Haiti',
  'Faroe Islands', 'Greenland', 'Puerto Rico', 'Bermuda', 'Cayman Islands', 'Guernsey', 'Jersey',
  'Isle of Man', 'Macau', 'Hong Kong', 'Palestine', 'Kosovo', 'Moldova', 'Belarus', 'Albania',
  'North Macedonia', 'Montenegro', 'Bosnia and Herzegovina', 'Tajikistan', 'Kyrgyzstan',
  'Turkmenistan', 'Brunei', 'Timor-Leste', 'Fiji', 'Papua New Guinea', 'Seychelles', 'Gambia',
  'Eswatini', 'Lesotho', 'Malawi', 'Angola', 'Gabon', 'Congo', 'DR Congo', 'Chad', 'Niger',
  'Burkina Faso', 'Mali', 'Liberia', 'Sierra Leone', 'Guinea', 'Sudan', 'Somalia', 'Djibouti',
  'Eritrea', 'Yemen', 'Syria', 'Israel'];

// Guard against a repeated entry making the ambiguity check below think two
// countries matched when in fact the same one did.
const UNIQUE_COUNTRIES = [...new Set(COUNTRY_NAMES)];

const ALIAS_COUNTRY = {
  usa: 'United States', us: 'United States', 'u.s.': 'United States', 'u.s.a.': 'United States',
  'united states of america': 'United States', america: 'United States',
  uk: 'United Kingdom', 'u.k.': 'United Kingdom', england: 'United Kingdom', scotland: 'United Kingdom',
  wales: 'United Kingdom', britain: 'United Kingdom', 'great britain': 'United Kingdom',
  uae: 'United Arab Emirates', korea: 'South Korea', 'republic of korea': 'South Korea',
  'russian federation': 'Russia', prussia: 'Russia', czechia: 'Czech Republic',
  'georgia (country)': 'Georgia', 'hong kong sar': 'Hong Kong', 'east timor': 'Timor-Leste',
  'ivory coast': 'Ivory Coast', 'côte divoire': 'Ivory Coast', 'cote divoire': 'Ivory Coast',
  'cape verde': 'Cabo Verde', swaziland: 'Eswatini', macedonia: 'North Macedonia',
  burma: 'Myanmar', 'south korea': 'South Korea', 'ivorycoast': 'Ivory Coast', 'ussr': 'Russia',
  // Wikidata P17 for Chinese entities returns this long form, not "China".
  "people's republic of china": 'China', 'mainland china': 'China', prc: 'China',
  'republic of china': 'Taiwan', 'taiwan, province of china': 'Taiwan',
  'kingdom of the netherlands': 'Netherlands', 'netherlands': 'Netherlands',
  'federal republic of germany': 'Germany', 'german empire': 'Germany',
  'republic of ireland': 'Ireland', 'swiss confederation': 'Switzerland',
  'hellenic republic': 'Greece', 'kingdom of spain': 'Spain', 'italian republic': 'Italy',
  'republic of india': 'India', 'state of israel': 'Israel'
};

// The scraped "country" column is unreliable: many list pages put a lifespan
// ("1931-"), a status ("Defunct") or a founder list there instead. Only values
// on this allowlist are trusted.
function isTrustedCountry(v) {
  const s = String(v || '').trim();
  if (!s) return false;
  if (s.length > 32) return false;
  if (UNIQUE_COUNTRIES.includes(s)) return true;
  const low = s.toLowerCase();
  if (ALIAS_COUNTRY[low]) return true;
  return UNIQUE_COUNTRIES.some((n) => n.toLowerCase() === low);
}

// A stock-exchange listing says where a company's shares trade, not where the
// company is domiciled. Foreign firms list abroad constantly, which is how Perrigo
// (Irish-American) came to be treated as Israeli via its Tel Aviv listing, and
// how Walmart ended up in China. Listing categories yield no country at all.
const LISTING_CATEGORY = /\b(companies|shares|stocks|equities)\b.*\b(listed|quoted|traded)\b|\b(listed|quoted|traded)\b.*\b(companies|shares|stocks|equities)\b/i;
const ISRAEL_LISTING = /stock exchange|\btase\b|nasdaq|nyse|\bse\b/i;

// Ownership/identity signals: the company itself is Israeli.
const ISRAEL_STRONG = [
  /^(israeli|companies (based|of|headquartered) in israel)/i,
  // "Software companies of Israel" and similar sector+country categories state
  // the company's home country, not a listing venue.
  /\b(?:companies|manufacturers|startups|brands|firms|chains|businesses) of israel\b/i,
  /\bisraeli (companies|corporations|manufacturers|startups|technology|tech|pharmaceutical|biotech|medical|defense|conglomerate)/i,
  /(headquarters|headquartered|domiciled|based) in (tel aviv|haifa|jerusalem|rehovot|petah tikva|netanya|rishon lezion|ramat gan|givatayim|beer sheva|beer-sheva)/i,
];

// Place names that are not countries. Wikipedia categories name administrative
// divisions constantly, and several division names collide with country names:
// "Essex County, New Jersey" contains the country Jersey (a Crown dependency), and
// "Georgia (U.S. state)" is a US state rather than the country. Subnational
// qualifiers disqualify the match.
const SUBNATIONAL = [
  /\((?:u\.?s\.?|us|uk|english|scottish|welsh|irish|australian|canadian)\.?[^)]*(?:state|county|province|region|district|territory|constituent|division)\)?/i,
  /\bcounty\b/, /\bcensus area\b/, /\bmunicipality\b/, /\bborough\b/, /\bparish\b/,
  /\bprefecture\b/, /\boblast\b/, /\brayon\b/, /\boblast\b/, /\bgovernorate\b/,
  /\btownship\b/, /\bvillage\b/, /\bcity\b/, /\bmetropolitan\b/,
];

// Countries whose names are commonly used for a division of another country.
const AMBIGUOUS_PLACES = new Set(['Georgia', 'Jersey', 'New Mexico', 'Washington', 'Virginia', 'Oklahoma', 'Indiana', 'Kansas', 'Florida', 'Alaska', 'Hawaii', 'Nebraska', 'Kentucky', 'Tennessee', 'Carolina', 'Congo', 'Guinea', 'Niger', 'Senegal', 'Mali', 'Austria']);

function isSubnationalPlace(place) {
  if (SUBNATIONAL.some((p) => p.test(place))) return true;
  return [...AMBIGUOUS_PLACES].some((n) => new RegExp(`\\b${n}\\b`, 'i').test(place));
}

// Resolves a place fragment to a country, or null when it is not resolvable to
// exactly one country.
function countryFromPlace(place) {
  if (isSubnationalPlace(place)) return null;
  const named = UNIQUE_COUNTRIES.filter((n) => new RegExp(`\\b${n.toLowerCase()}\\b`).test(place));
  if (named.length === 1) return named[0];
  // Zero or several: not resolvable. Picking the first would have made Walmart
  // resolve to China from "Companies of the United States and China".
  return null;
}

function countryFromCategory(cat) {
  const c = String(cat).replace(/^Category:/, '').trim();
  const lc = c.toLowerCase();

  // Bail out before the Israel check: a listing venue is never ownership.
  if (LISTING_CATEGORY.test(c) && ISRAEL_LISTING.test(c)) return null;
  if (ISRAEL_STRONG.some((p) => p.test(c))) return 'ISRAEL_FLAG';

  const adj = Object.keys(NATIONALITY).find((k) => new RegExp(`^${k}\\b`).test(lc));
  if (adj) return NATIONALITY[adj];

  // "Companies of <place>", "Retail companies of the United States", ...
  const of = lc.match(/^(?:[a-z -]+? )?(?:companies|manufacturers|manufactures|chains|firms|brands|businesses)(?: (?:based in|of|originating in)) (?:the )?(.+)$/);

  // Collect every country this category names, from both the structured
  // "companies of <place>" form and the loose "of/based in <country>" tail, then
  // require agreement. Checking one form at a time is not enough: for
  // "Companies of the United States and China" the structured form correctly
  // finds two countries and bails, but the loose tail still matched
  // "of the United States" and returned it. A category that names more than one
  // country is not evidence for any of them.
  const candidates = new Set();
  let structured = null;
  if (of) {
    const hit = countryFromPlace(of[1].trim());
    if (hit) { candidates.add(hit); structured = hit; }
  }
  if (!isSubnationalPlace(lc)) {
    for (const name of UNIQUE_COUNTRIES) {
      if (new RegExp(` (?:of|based in|originating in) (?:the )?${name.toLowerCase()}($| )`).test(lc)) {
        candidates.add(name);
      }
    }
  }

  // Israel is the one country where a false positive deletes a row, so it needs
  // ownership evidence rather than topical association. Real Israeli companies
  // are already caught by ISRAEL_STRONG above, which returns the flag. Reaching
  // here with Israel means the category merely mentions the country: "Military
  // vehicles of Israel" describes a product line and "People from the Kingdom of
  // Israel" a historical monarchy. Neither says who owns the company, so the
  // loose tail must not set the country. Only the structured entity form
  // ("... companies of Israel") counts.
  if (candidates.has('Israel') && structured !== 'Israel') candidates.delete('Israel');

  return candidates.size === 1 ? [...candidates][0] : null;
}

// Resolves a whole category list to one country.
//
// Categories must be aggregated by agreement, not by taking the first or last
// match. A multinational legitimately carries categories for each country it
// operates in, and the count reflects that rather than domicile: Walmart has six
// US categories ("Supermarkets of the United States") against one Chinese one
// ("Supermarkets of China", its local subsidiary chain). Taking the last match
// produced China; the plurality country is United States. An exact tie means the
// categories do not agree and no country can be inferred.
function countryFromCategories(cats) {
  const counts = new Map();
  let israel = false;
  for (const cat of cats || []) {
    const r = countryFromCategory(cat);
    if (r === 'ISRAEL_FLAG') { israel = true; continue; }
    if (r) counts.set(r, (counts.get(r) || 0) + 1);
  }
  if (israel) return 'ISRAEL_FLAG';
  if (!counts.size) return null;
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) return null;
  return ranked[0][0];
}

module.exports = { NATIONALITY, COUNTRY_NAMES, ALIAS_COUNTRY, isTrustedCountry, countryFromCategory, countryFromCategories };