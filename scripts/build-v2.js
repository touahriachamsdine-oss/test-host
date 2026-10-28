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
  wind: { domain: 'cleantech', industry: 'wind energy' },
  lawfirms: { domain: 'law-social-impact', industry: 'law firm' },
  socialent: { domain: 'law-social-impact', industry: 'social enterprise' },
  food: { domain: 'agritech-foodtech', industry: 'food and beverage manufacturing' },
  railways: { domain: 'manufacturing-3d', industry: 'railway operations and rolling stock' },
  telecom: { domain: 'cloud-iot', industry: 'telecommunications' },
  mining: { domain: 'nanotech-materials', industry: 'mining and critical minerals' },
  vc: { domain: 'other-deep-tech', industry: 'venture capital' }
};

const { NATIONALITY, COUNTRY_NAMES, isTrustedCountry, countryFromCategory, countryFromCategories } = require('./lib/countries');



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
  if (/law|legal|attorney|solicitor|barrister|patent|compliance|social enterprise|impact|non-?profit|ngo|charit/.test(s)) return 'law-social-impact';
  if (/space|aero|satellite|rocket|launch|orbit|propulsion|avionics/.test(s)) return 'space-aerospace';
  if (/agri|food|farm|crop|livestock|aqua|beverage|dairy|bakery|brewery|distill|restaur/.test(s)) return 'agritech-foodtech';
  if (/pharma|biotech|biomedical|bio\b|genetic|genomic|cell|crispr|drug|therapeutic|vaccine|diagnos|molecular/.test(s)) return 'biotech-healthtech';
  if (/medical|medtech|clinical|surgical|device|hospital|patient|care|imaging|therapeutic/.test(s)) return 'medtech';
  if (/material|nano|chemical|composite|polymer|alloy/.test(s)) return 'nanotech-materials';
  if (/\b(mining|mines?|miners?|minerals?|ore|copper|gold|silver|zinc|coal|rare earths?|critical minerals?|extraction)\b/.test(s)) return 'nanotech-materials';
  if (/manufactur|industrial|auto|vehicle|car|motorcycle|truck|ship|rail|train|tramway|metro|aircraft|machin|equipment|robotics work/.test(s)) return 'manufacturing-3d';
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
  let lastErr = null;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetchCategories(batch);
      Object.assign(map, res);
      return map;
    } catch (e) {
      lastErr = e;
      if (e.status === 429) await new Promise((r) => setTimeout(r, 1400 * attempt));
      else await new Promise((r) => setTimeout(r, 700 * attempt));
    }
  }
  // Never drop a batch silently: an exhausted retry used to leave these names
  // out of the cache entirely, so they finalised as country "Unknown".
  console.error(`   ! enrichBatch exhausted retries for ${batch.length} names: ${lastErr && lastErr.message}`);
  return map;
}

async function enrich() {
  const pending = JSON.parse(fs.readFileSync(path.join(SRC, '_pending.json'), 'utf8'));
  let cache = {};
  if (fs.existsSync(CACHE)) cache = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  const remaining = pending.filter((it) => !(it.name in cache));
  console.log('pending chunks:', remaining.length);
  // cllimit is a per-query total, so a category-heavy page can starve every
  // other page in the batch. Small batches keep category coverage complete.
  const BATCH = 15;
  const CONC = 2;
  const batches = [];
  for (let i = 0; i < remaining.length; i += BATCH) batches.push(remaining.slice(i, i + BATCH).map((it) => it.name));
  let done = 0;
  for (let i = 0; i < batches.length; i += CONC) {
    const chunkBatches = batches.slice(i, i + CONC);
    const results = await Promise.all(chunkBatches.map((b) => enrichBatch(b)));
    for (const map of results) {
      for (const [name, cats] of Object.entries(map)) {
        const country = countryFromCategories(cats);
        cache[name] = { country: country === 'ISRAEL_FLAG' ? 'Unknown' : country || 'Unknown', israel: country === 'ISRAEL_FLAG', cats };
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
  if (c.israel) return { country: 'ISRAEL_FLAG', israel: true };
  // A Wikidata P17/P495 value is authoritative; take it before guessing from
  // category names.
  if (c.country && c.country !== 'Unknown' && isTrustedCountry(c.country)) return { country: c.country, israel: false };
let country = null;
    if (c.cats && c.cats.length) {
      // Aggregate by agreement rather than last match: see countryFromCategories.
      const r = countryFromCategories(c.cats);
      if (r === 'ISRAEL_FLAG') return { country: 'ISRAEL_FLAG', israel: true };
      country = r;
      return { country: country || 'Unknown', israel: false };
    }
    return { country: 'Unknown', israel: false };
}

function finalize() {
  const merged = JSON.parse(fs.readFileSync(MERGED, 'utf8'));
  let cache = {};
  if (fs.existsSync(CACHE)) cache = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  const out = [];
  let israelDrop = 0, unknown = 0, junkDrop = 0, untrustedCountry = 0;
  const JUNK = /^(ayurvedic|homeopathy|homeopathic|vitamin(s)?|supplement(s)?|botox|cosmetic(s)?|generics?)$/i;
  for (const r of merged) {
    let country = r.country;
    let israel = r.israel === true;
    if (country === 'ISRAEL_FLAG') israel = true;
    // Scraped cells frequently hold a lifespan, "Defunct" or a founder list
    // rather than a country. Reject those and fall back to the cache.
    if (country && country !== 'Unknown' && !isTrustedCountry(country)) {
      country = null;
      untrustedCountry++;
    }
    if (!country) {
      const c = cache[r.name];
      if (c) {
        const res = resolveFromCache(c, r.name);
        if (res.israel) israel = true;
        else country = res.country;
      }
      if (!country || country === 'Unknown') unknown++;
    }
    if (JUNK.test(r.name)) { junkDrop++; continue; }
    if (israel || (country === 'ISRAEL_FLAG') || /israel/i.test(country || '')) { israelDrop++; continue; }
    if (!country) country = 'Unknown';
    if (/israel/i.test(country)) { israelDrop++; continue; }
    out.push({ ...r, country, israel: false });
  }
  fs.writeFileSync(path.join(SRC, 'final.json'), JSON.stringify(out, null, 1));
  console.log('final rows:', out.length, '| israel dropped:', israelDrop, '| unknown country:', unknown, '| junk dropped:', junkDrop, '| untrusted scraped country discarded:', untrustedCountry);
}

const cmd = process.argv[2] || 'merge';
if (cmd === 'merge') merge();
else if (cmd === 'enrich') enrich();
else if (cmd === 'final') finalize();
else console.log('cmd: merge | enrich | final');