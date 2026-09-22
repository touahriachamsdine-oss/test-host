const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'data', 'global', '_sources');
const CACHE = path.join(SRC, '_country-cache.json');
const MERGED = path.join(SRC, 'merged.json');

const UA = { 'User-Agent': 'startup-ideas-dz/0.2 (research script)' };

const SOURCE_META = {
  unicorns: { domain: null, industry: 'startup' },
  ai: { domain: 'ai-computing', industry: 'artificial intelligence' },
  robotics: { domain: 'robotics', industry: 'robotics' },
  semicon_us: { domain: 'semiconductors', industry: 'semiconductors' },
  fabs: { domain: 'semiconductors', industry: 'semiconductor fabrication' },
  cyber: { domain: 'cybersecurity', industry: 'cybersecurity' },
  fusion: { domain: 'energy-storage', industry: 'nuclear fusion energy' },
  biomed_mc: { domain: 'biotech-healthtech', industry: 'biomedical/pharmaceuticals' },
  biomed_rev: { domain: 'biotech-healthtech', industry: 'biomedical/pharmaceuticals' },
  motorcycles: { domain: 'manufacturing-3d', industry: 'motorcycle manufacturing' },
  trucks: { domain: 'manufacturing-3d', industry: 'truck manufacturing' },
  ships: { domain: 'manufacturing-3d', industry: 'shipbuilding' },
  rail: { domain: 'manufacturing-3d', industry: 'rolling stock manufacturing' },
  automobiles: { domain: 'manufacturing-3d', industry: 'automotive manufacturing' },
  pharma: { domain: 'biotech-healthtech', industry: 'pharmaceuticals' },
  wind: { domain: 'cleantech', industry: 'wind energy' }
};

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
  'Iran', 'Pakistan', 'Bangladesh', 'Chile', 'Colombia', 'Peru', 'Uruguay', 'Venezuela', 'Philippines'];

function countryFromCategory(cat) {
  const c = cat.replace(/^Category:/, '').trim();
  const lc = c.toLowerCase();
  if (/israel|tel aviv|haifa|jerusalem|rehovot|ramat gan|givatayim/.test(lc)) return 'ISRAEL_FLAG';
  const adj = Object.keys(NATIONALITY).find((k) => new RegExp(`^${k}\\b`).test(lc));
  if (adj) return NATIONALITY[adj];
  const of = lc.match(/^(?:[a-z -]+? )?(?:companies|manufacturers|firms|brands|businesses)(?: (?:based in|of)) (.+)$/) || lc.match(/^(?:[a-z -]+? )?(?:companies|manufacturers|firms|brands|businesses) of (.+)$/);
  if (of) {
    const place = of[1].toLowerCase();
    if (/israel|tel aviv|haifa|jerusalem|rehovot|ramat gan|givatayim/.test(place)) return 'ISRAEL_FLAG';
    for (const name of COUNTRY_NAMES) if (new RegExp(`^${name.toLowerCase()}($| )`).test(place)) return name;
    const city = CITY_COUNTRY[place];
    if (city) return city === 'ISRAEL_FLAG' ? 'ISRAEL_FLAG' : city;
  }
  for (const name of COUNTRY_NAMES) {
    if (new RegExp(` (?:of|based in) ${name.toLowerCase()}($| )`).test(lc) || lc.endsWith(` companies ${name.toLowerCase()}`)) return name;
  }
  return null;
}

const CITY_COUNTRY = {
  tokyo: 'Japan', osaka: 'Japan', kyoto: 'Japan', pekin: 'China', beijing: 'China', shanghai: 'China',
  shenzhen: 'China', 'hong kong': 'China', seoul: 'South Korea', busan: 'South Korea', singapore: 'Singapore',
  london: 'United Kingdom', berlin: 'Germany', munich: 'Germany', hamburg: 'Germany', frankfurt: 'Germany',
  paris: 'France', lyon: 'France', milan: 'Italy', rome: 'Italy', turin: 'Italy', bologna: 'Italy',
  modena: 'Italy', madrid: 'Spain', barcelona: 'Spain', valencia: 'Spain', lisbon: 'Portugal', porto: 'Portugal',
  amsterdam: 'Netherlands', rotterdam: 'Netherlands', brussels: 'Belgium', vienna: 'Austria', zurich: 'Switzerland',
  geneva: 'Switzerland', stockholm: 'Sweden', oslo: 'Norway', copenhagen: 'Denmark', helsinki: 'Finland',
  warsaw: 'Poland', prague: 'Czech Republic', bucarest: 'Romania', bucharest: 'Romania', budapest: 'Hungary',
  'saint petersburg': 'Russia', moscow: 'Russia', mumbai: 'India', pune: 'India', bengaluru: 'India',
  bangalore: 'India', chennai: 'India', delhi: 'India', 'new delhi': 'India', hyderabad: 'India',
  'san jose': 'United States', 'silicon valley': 'United States', 'new york': 'United States',
  'los angeles': 'United States', chicago: 'United States', 'san francisco': 'United States',
  austin: 'United States', seattle: 'United States', boston: 'United States', detroit: 'United States',
  cleveland: 'United States', 'san diego': 'United States', 'toronto': 'Canada', vancouver: 'Canada',
  montreal: 'Canada', ottawa: 'Canada', 'sao paulo': 'Brazil', 'rio de janeiro': 'Brazil', 'buenos aires': 'Argentina',
  mexico: 'Mexico', 'mexico city': 'Mexico', caucasia: 'Colombia', bogota: 'Colombia', 'santiago': 'Chile',
  dublin: 'Ireland', reykjavik: 'Iceland', athens: 'Greece', istanbul: 'Turkey', telaviv: 'ISRAEL_FLAG',
  'tel aviv': 'ISRAEL_FLAG', haifa: 'ISRAEL_FLAG', jerusalem: 'ISRAEL_FLAG', cairo: 'Egypt', 'casablanca': 'Morocco',
  algiers: 'Algeria', 'abu dhabi': 'United Arab Emirates', dubai: 'United Arab Emirates', riyadh: 'Saudi Arabia',
  bangkok: 'Thailand', 'kuala lumpur': 'Malaysia', jakarta: 'Indonesia', manila: 'Philippines', taipei: 'Taiwan',
  hanoi: 'Vietnam', 'ho chi minh': 'Vietnam', 'cape town': 'South Africa', johannesburg: 'South Africa'
};

function cleanName(raw) {
  let n = String(raw || '').trim();
  n = n.replace(/^\s*\|\s*/, '').replace(/\|.*$/, '');
  n = n.replace(/\s*\(formerly[^)]*\)\s*$/i, '').replace(/\s*\(formerly[^)]*\)\s*/i, '');
  n = n.replace(/\{\{[^{}]*\}\}/g, '').replace(/[\{\}]/g, '');
  n = n.replace(/^\s*(The)\s+/i, '');
  n = n.replace(/\s+/g, ' ').trim();
  return n;
}

function cleanCountry(v) {
  let s = String(v || '').trim().replace(/\s*\|\s*/g, ' ');
  s = s.replace(/^[\s,|]+/, '').replace(/[\s,|]+$/, '');
  if (!s) return s;
  if (s.toLowerCase().includes(' and ')) s = s.split(' and ')[0].trim();
  return s.split('/')[0].trim();
}

function normalizeCountry(c) {
  const s = String(c || '').trim();
  const D = { 'usa': 'United States', 'united states of america': 'United States', 'us': 'United States', 'u.s.': 'United States', 'u.s.a.': 'United States', 'uk': 'United Kingdom', 'grande-bretagne': 'United Kingdom', "england": 'United Kingdom', 'russia': 'Russia', 'ussia': 'Russia', 'korea': 'South Korea', 'the faeroe islands': 'Faroe Islands', ...CITY_COUNTRY };
  if (/^israel$/i.test(s)) return 'ISRAEL_FLAG';
  const low = s.toLowerCase();
  if (D[low]) return D[low] === 'ISRAEL_FLAG' ? 'ISRAEL_FLAG' : D[low];
  if (COUNTRY_NAMES.some((n) => n.toLowerCase() === low)) return s.trim();
  if (s.includes(',')) {
    const parts = s.split(',').map((x) => x.trim());
    const hit = parts.find((p) => COUNTRY_NAMES.some((n) => n.toLowerCase() === p.toLowerCase()));
    if (hit) return normalizeCountry(hit);
  }
  if (/israel/i.test(s)) return 'ISRAEL_FLAG';
  return s;
}

function assignSourceMeta(source, row) {
  const meta = SOURCE_META[source] || {};
  if (!row.industry || /^[\s|]*$/.test(row.industry)) row.industry = meta.industry || '';
  if (!row.domain) row.domain = meta.domain || null;
  return row;
}

function industryToDomain(ind) {
  const s = String(ind || '').toLowerCase();
  if (/quantum/.test(s)) return 'nanotech-materials';
  if (/artificial\s?intelligence|machine learning|neural|deep learning|llm|nlp|computer vision/.test(s)) return 'ai-computing';
  if (/robot/.test(s)) return 'robotics';
  if (/semi|chip|fab|wafer|microelect|integrated circuit/.test(s)) return 'semiconductors';
  if (/cyber|security|malware|ransomware|zero.?day/.test(s)) return 'cybersecurity';
  if (/drone|uav|unmanned|autonomous|self.?driving|delivery robot/.test(s)) return 'drones-autonomy';
  if (/battery|energy storage|fusion|nuclear|grid|renewable|solar|wind|hydrogen|power|electricity/.test(s)) return 'energy-storage';
  if (/wind|clean|cleantech|climate|carbon/.test(s)) return 'cleantech';
  if (/space|aero|satellite|rocket|launch|orbit|propulsion|avionics/.test(s)) return 'space-aerospace';
  if (/agri|food|farm|crop|livestock|aqua/.test(s)) return 'agritech-foodtech';
  if (/pharma|biotech|biomedical|bio\b|genetic|genomic|cell|crispr|drug|therapeutic|vaccine|diagnos|molecular/.test(s)) return 'biotech-healthtech';
  if (/medical|medtech|clinical|surgical|device|hospital|patient|care|imaging|therapeutic/.test(s)) return 'medtech';
  if (/material|nano|chemical|composite|polymer|alloy/.test(s)) return 'nanotech-materials';
  if (/manufactur|industrial|auto|vehicle|car|motorcycle|truck|ship|rail|train|aircraft|machin|equipment|robotics work/.test(s)) return 'manufacturing-3d';
  if (/software|internet|cloud|iot|platform|app\b|saas|fintech|banking|e-?commerce|data|analytics|telecom|network|web|pay/.test(s)) return 'cloud-iot';
  return 'other-deep-tech';
}

function merge() {
  const known = new Map(); // lower name -> {name, country}
  const loaded = [];
  for (const file of fs.readdirSync(SRC)) {
    if (file === '_country-cache.json' || file === 'merged.json') continue;
    const source = file.replace(/\.json$/, '');
    if (!(source in SOURCE_META)) continue;
    const rows = JSON.parse(fs.readFileSync(path.join(SRC, file), 'utf8'));
    for (const r of rows) {
      const rec = { source, name: '', country: null, industry: '', year: null, site: null, valuation: null, founders: null, domain: null };
      rec.name = cleanName(r.name || '');
      if (!rec.name || rec.name.length < 2) continue;
      rec.industry = String(r.industry || '').trim();
      rec.country = r.country ? normalizeCountry(cleanCountry(r.country)) : null;
      if (rec.country === 'ISRAEL_FLAG') rec.israel = true;
      rec.year = /(19|20)\d{2}/.test(String(r.year || '')) ? (String(r.year).match(/(19|20)\d{2}/) || [null])[0] : null;
      rec.site = r.site || null;
      rec.valuation = r.valuation || null;
      rec.founders = r.founders || null;
      assignSourceMeta(source, rec);
      if (!rec.domain) rec.domain = industryToDomain(rec.industry || SOURCE_META[source]?.industry || rec.industry || '');
      rec.domain = rec.domain || industryToDomain(rec.industry) || 'other-deep-tech';
      const key = rec.name.toLowerCase();
      if (!known.has(key)) known.set(key, rec);
    }
    loaded.push(source);
  }
  fs.writeFileSync(MERGED, JSON.stringify([...known.values()], null, 1));
  console.log('merged unique names:', known.size, 'sources:', loaded.join(','));
  const noCountry = [...known.values()].filter((r) => !r.country || r.country === 'Unknown');
  fs.writeFileSync(path.join(SRC, '_pending.json'), JSON.stringify(noCountry.map((r) => ({ name: r.name, source: r.source })), null, 1));
  console.log('pending country lookup:', noCountry.length);
}

async function fetchCategories(names) {
  const url = 'https://en.wikipedia.org/w/api.php?format=json&formatversion=2&action=query&prop=categories&cllimit=max&redirects=1&titles=' + encodeURIComponent(names.join('|'));
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const res = await fetch(url, { headers: UA, signal: ctl.signal });
    clearTimeout(t);
    if (res.status === 429) throw Object.assign(new Error('rl'), { status: 429 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const out = {};
    if (json.query) {
      for (const page of json.query.pages || []) {
        out[page.title] = (page.categories || []).map((c) => c.title);
      }
      if (json.query.redirects) {
        for (const red of json.query.redirects) {
          if (red.to in out && out[red.from] === undefined) out[red.from] = out[red.to];
        }
      }
    }
    return out;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

async function enrichBatch(batch) {
  const map = {};
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetchCategories(batch);
      Object.assign(map, res);
      return map;
    } catch (e) {
      if (e.status === 429) await new Promise((r) => setTimeout(r, 1400 * attempt));
      else await new Promise((r) => setTimeout(r, 700 * attempt));
    }
  }
  return map;
}

async function enrich() {
  const pending = JSON.parse(fs.readFileSync(path.join(SRC, '_pending.json'), 'utf8'));
  let cache = {};
  if (fs.existsSync(CACHE)) cache = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  const remaining = pending.filter((it) => !(it.name in cache));
  console.log('pending chunks:', remaining.length);
  const BATCH = 40;
  const CONC = 4;
  const batches = [];
  for (let i = 0; i < remaining.length; i += BATCH) batches.push(remaining.slice(i, i + BATCH).map((it) => it.name));
  let done = 0;
  for (let i = 0; i < batches.length; i += CONC) {
    const chunkBatches = batches.slice(i, i + CONC);
    const results = await Promise.all(chunkBatches.map((b) => enrichBatch(b)));
    for (const map of results) {
      for (const [name, cats] of Object.entries(map)) {
        let country = null;
        let israel = false;
        for (const cat of cats) {
          const c = countryFromCategory(cat);
          if (c === 'ISRAEL_FLAG') israel = true;
          else if (c) country = c;
        }
        cache[name] = { country: country || 'Unknown', israel, cats };
      }
      done += map ? Object.keys(map).length : 0;
    }
    fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));
    if (i % 200 === 0 || i + CONC >= batches.length) console.log('progress ~', done, '/', remaining.length);
    await new Promise((r) => setTimeout(r, 200));
  }
  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));
  console.log('enrich complete:', Object.keys(cache).length, 'cached');
}

function resolveFromCache(c, name) {
  let country = null;
  let israel = false;
  if (c.cats && c.cats.length) {
    for (const cat of c.cats) {
      const r = countryFromCategory(cat);
      if (r === 'ISRAEL_FLAG') israel = true;
      else if (r) country = r;
    }
    return { country: country || 'Unknown', israel };
  }
  return { country: c.country || 'Unknown', israel: !!c.israel };
}

function finalize() {
  const merged = JSON.parse(fs.readFileSync(MERGED, 'utf8'));
  let cache = {};
  if (fs.existsSync(CACHE)) cache = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  const out = [];
  let israelDrop = 0, unknown = 0, junkDrop = 0;
  const JUNK = /^(ayurvedic|homeopathy|homeopathic|vitamin(s)?|supplement(s)?|botox|cosmetic(s)?|generics?)$/i;
  for (const r of merged) {
    let country = r.country;
    let israel = r.israel === true;
    if (!country) {
      const c = cache[r.name];
      if (c) {
        const res = resolveFromCache(c, r.name);
        if (res.israel) israel = true;
        else country = res.country;
        if (country === 'Unknown') unknown++;
      } else unknown++;
    }
    if (JUNK.test(r.name)) { junkDrop++; continue; }
    if (israel || (country === 'ISRAEL_FLAG') || /israel/i.test(country || '')) { israelDrop++; continue; }
    if (!country) country = 'Unknown';
    if (/israel/i.test(country)) { israelDrop++; continue; }
    out.push({ ...r, country, israel: false });
  }
  fs.writeFileSync(path.join(SRC, 'final.json'), JSON.stringify(out, null, 1));
  console.log('final rows:', out.length, '| israel dropped:', israelDrop, '| unknown country:', unknown, '| junk dropped:', junkDrop);
}

const cmd = process.argv[2] || 'merge';
if (cmd === 'merge') merge();
else if (cmd === 'enrich') enrich();
else if (cmd === 'final') finalize();
else console.log('cmd: merge | enrich | final');