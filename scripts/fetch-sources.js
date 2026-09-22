const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'data', 'global', '_sources');
fs.mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
  ['unicorns', 'List of unicorn startup companies'],
  ['ai', 'List of artificial intelligence companies'],
  ['robotics', 'List of robotics companies'],
  ['semicon_us', 'List of semiconductor companies in the United States'],
  ['fabs', 'List of semiconductor fabrication plants'],
  ['cyber', 'List of computer security companies'],
  ['space', 'List of satellite constellations'],
  ['fusion', 'List of nuclear fusion companies'],
  ['drones', 'List of unmanned aerial vehicles'],
  ['biomed_mc', 'List of largest biomedical companies by market capitalization'],
  ['biomed_rev', 'List of largest biomedical companies by revenue'],
  ['agrimach', 'List of agricultural machinery manufacturers'],
  ['siliconvalley', 'List of companies based in Silicon Valley'],
  ['aircraft', 'List of aircraft manufacturers'],
  ['engines', 'List of engine manufacturers'],
  ['motorcycles', 'List of motorcycle manufacturers'],
  ['trucks', 'List of truck manufacturers'],
  ['ships', 'List of shipbuilders and shipyards'],
  ['smartphones', 'List of smartphone manufacturers'],
  ['wind', 'List of wind turbine manufacturers'],
  ['solar', 'List of solar panel manufacturers'],
  ['reactors', 'List of nuclear reactor manufacturers'],
  ['rail', 'List of rolling stock manufacturers'],
  ['pharma', 'List of pharmaceutical companies'],
  ['meddev', 'List of medical device manufacturers'],
  ['biopharma', 'List of biopharmaceutical companies'],
  ['medtech_eu', 'List of medical equipment manufacturers'],
  ['automobiles', 'List of automobile manufacturers'],
  ['aircraft2', 'List of aircraft manufacturers'],
  ['semicon_china', 'List of semiconductor companies in China'],
  ['semicon_japan', 'List of semiconductor companies in Japan'],
  ['semicon_eu', 'List of semiconductor companies in Europe'],
  ['cameras', 'List of camera manufacturers'],
  ['computers', 'List of computer manufacturers'],
  ['turbines', 'List of turbine manufacturers'],
  ['autoparts', 'List of auto parts manufacturers']
];

const UA = {
  'User-Agent': 'startup-ideas-dz/0.1 (research script)',
  Accept: 'application/json'
};

const CC = {
  US: 'United States', USA: 'United States', UK: 'United Kingdom', GBR: 'United Kingdom', GB: 'United Kingdom',
  CAN: 'Canada', CA: 'Canada', FRA: 'France', FR: 'France', DEU: 'Germany', DE: 'Germany', ITA: 'Italy', IT: 'Italy',
  ESP: 'Spain', ES: 'Spain', CHN: 'China', CN: 'China', JPN: 'Japan', JP: 'Japan', KOR: 'South Korea', KR: 'South Korea',
  RUS: 'Russia', RU: 'Russia', IND: 'India', IN: 'India', BRA: 'Brazil', BR: 'Brazil', AUS: 'Australia', AU: 'Australia',
  NZL: 'New Zealand', NZ: 'New Zealand', SWE: 'Sweden', SE: 'Sweden', NOR: 'Norway', NO: 'Norway', DNK: 'Denmark',
  DK: 'Denmark', FIN: 'Finland', FI: 'Finland', NLD: 'Netherlands', NL: 'Netherlands', BEL: 'Belgium', BE: 'Belgium',
  CHE: 'Switzerland', CH: 'Switzerland', AUT: 'Austria', AT: 'Austria', POL: 'Poland', PL: 'Poland',
  CZE: 'Czech Republic', CZ: 'Czech Republic', GRC: 'Greece', GR: 'Greece', PRT: 'Portugal', PT: 'Portugal',
  TUR: 'Turkey', TR: 'Turkey', ISR: 'Israel', IL: 'Israel', MEX: 'Mexico', MX: 'Mexico', ARG: 'Argentina', AR: 'Argentina',
  EGY: 'Egypt', EG: 'Egypt', VNM: 'Vietnam', VN: 'Vietnam', IDN: 'Indonesia', ID: 'Indonesia', THA: 'Thailand',
  TH: 'Thailand', MYS: 'Malaysia', MY: 'Malaysia', SGP: 'Singapore', SG: 'Singapore', HKG: 'Hong Kong', HK: 'Hong Kong',
  TWN: 'Taiwan', TW: 'Taiwan', ARE: 'United Arab Emirates', AE: 'United Arab Emirates', SAU: 'Saudi Arabia',
  SA: 'Saudi Arabia', UKR: 'Ukraine', UA: 'Ukraine', ZAF: 'South Africa', ZA: 'South Africa', MAR: 'Morocco',
  MA: 'Morocco', DZA: 'Algeria', DZ: 'Algeria'
};

function stripWikitext(v) {
  let s = String(v || '');
  s = s.replace(/<ref[\s\S]*?<\/ref>/gi, '');
  s = s.replace(/<ref[^>]*\/>/gi, '');
  s = s.replace(/<br\s*\/?\s*>/gi, ' ');
  s = s.replace(/<sup[\s\S]*?<\/sup>/gi, '');
  s = s.replace(/\{\{\s*(?:flag|flaglist|flagicon|flagu|flag icon|flagcountry)\s*\|([^}|]+)(?:\|[^}]+)?\}\}/g, '$1');
  s = s.replace(/\{\{\s*([A-Z]{2,3})\s*\}\}/g, (m, k) => (CC[k] ? CC[k] : k));
  s = s.replace(/\{\{[^{}]*?\}\}/g, '');
  s = s.replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1');
  s = s.replace(/\[\[([^\]]*)\]\]/g, '$1');
  s = s.replace(/\[(https?:\/\/[^\]\s]*)\s+([^\]]*)\]?/gi, '$2');
  s = s.replace(/\[([^\]]*)\]?/g, '$1');
  s = s.replace(/'{2,}/g, '');
  s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'");
  return s.replace(/\s+/g, ' ').trim();
}

const FIELD_MAP = [
  [/^(company|company name|name|organization|maker|manufacturer|client focused)$/, 'name'],
  [/^(country|countries|headquarters|hq|location|region|based in|based|nationality)$/, 'country'],
  [/^(industry|sector|sectors|type|category|technology|description|product|area|specialty|focus|segment)$/, 'industry'],
  [/^(founded|founded year|year|year founded|founded date)$/, 'year'],
  [/^(website|homepage|web site)$/, 'site'],
  [/^(valuation|funding|total funding|revenue|market cap|market capitalization)$/, 'valuation'],
  [/^(founders?|founder|key people|ceo|chairman)$/, 'founders'],
  [/^(notes?|comments|refs?)$/, 'note']
];

function parseTable(table) {
  const rows = [];
  const lines = table.split('\n');
  let current = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (/^\{\|/.test(line) || /^\|\}/.test(line) || /^\|-/.test(line)) {
      if (current) rows.push(current);
      current = null;
      continue;
    }
    if (/^[!|]([!|]|.)+/.test(line)) {
      const kind = line[0];
      let body = line.slice(1);
      const cells = body.split(kind === '!' ? '!!' : '||');
      const clean = cells.map((c) => {
        const attr = /^([^|]*\|\s?)/.exec(c);
        let s = c;
        if (attr && attr[1].includes('=')) s = c.slice(attr[1].length);
        return stripWikitext(s);
      });
      if (!current) current = [];
      for (const c of clean) current.push(c);
    } else if (current && line) {
      current[current.length - 1] += ' ' + stripWikitext(line);
    }
  }
  if (current) rows.push(current);
  return rows;
}

function findTables(wikitext) {
  const clean = wikitext
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref[\s\S]*?<\/ref>/gi, '')
    .replace(/<ref[^>]*\/>/gi, '');
  const lines = clean.split('\n');
  const tables = [];
  let cur = null;
  for (const raw of lines) {
    const line = raw.replace(/\r/g, '');
    const t = line.trimStart();
    if (!cur) {
      if (t.startsWith('{|')) cur = [line];
      continue;
    }
    cur.push(line);
    if (t.startsWith('|}')) {
      const block = cur.join('\n');
      if (block.length > 120) tables.push(block);
      cur = null;
    }
  }
  return tables;
}

function mapColumns(headers) {
  return headers.map((h) => {
    const key = stripWikitext(h).toLowerCase().replace(/\s+/g, ' ');
    if (/country|headquarters|\bhq\b|location|based in|basedin|nationality|origin|region/.test(key) && /(United|America|Asia|Europe|China|Japan|Germany|France|UK|US|Canada|India|ussia|Korea|Italy|Spain|Brazil|Australia)/.test(key))
      return { field: 'country' };
    if (/^(company|name|organization|manufacturer|maker|operator|vendor)$/.test(key)) return { field: 'name' };
    if (/^country|cities|countries|headquarters|\bhq\b|^location|based in|nationality|^origin$|headquarters loc/.test(key)) return { field: 'country' };
    if (/valuation|funding|revenue|market cap|market capitalization|sales/.test(key)) return { field: 'valuation' };
    if (/founded|^year|founded year|est\.?/.test(key)) return { field: 'year' };
    if (/website|homepage|web ?site|url|official/.test(key)) return { field: 'site' };
    if (/founder|key people|\bceo\b|chairman|boss/.test(key)) return { field: 'founders' };
    if (/note|comment|refs?|reference/.test(key)) return { field: 'note' };
    if (/industry|sector|type|category|technology|description|product|specialty|focus|segment|area|field|activities/.test(key)) return { field: 'industry' };
    return { field: null };
  });
}

function extractRows(rows) {
  let headerIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const joined = rows[i].join(' ').toLowerCase();
    if (/company|name|manufacturer|firm|organization/.test(joined)) { headerIdx = i; break; }
  }
  const mappedCols = headerIdx >= 0 ? mapColumns(rows[headerIdx]) : [];
  if (!mappedCols.length) {
    for (let k = rows[0] ? rows[0].length : 0; mappedCols.length < k; ) mappedCols.push({ field: null });
  }
  const out = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const cells = rows[i];
    const rec = {};
    let found = false;
    for (let j = 0; j < mappedCols.length; j++) {
      const { field } = mappedCols[j];
      if (!field || j >= cells.length) continue;
      const val = String(cells[j] || '').replace(/\s+/g, ' ').trim();
      if (!val || ['—', '–', 'N/A', 'n/a'].includes(val)) continue;
      if (field === 'name' && (!rec.name || rec.name.length > val.length)) {
        if (rec.name) continue;
      }
      if (field === 'name' && !rec.name) rec.name = val;
      else if (!rec[field]) rec[field] = val;
      found = true;
    }
    if (found && (rec.name || rec.industry)) out.push(rec);
  }
  return out;
}

function extractProse(wikitext) {
  const recs = [];
  const re = /^\s*[\*#]\s+(.*)$/gm;
  let m;
  while ((m = re.exec(wikitext)) !== null) {
    const line = m[1];
    const link = /\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/.exec(line);
    if (!link) continue;
    const name = stripWikitext(link[2] || link[1]);
    if (!name || /^(Category|Template|list|List)/.test(name)) continue;
    const rest = stripWikitext(line.replace(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/, ''));
    const countryMatch = /\{\{\s*flag\s*\|\s*([^}]+)\s*\}\}/.exec(m[1]) || /\(([^()]*)\)$/.exec(rest);
    recs.push({
      name,
      industry: rest.split(/ — | – |, /)[0] || rest,
      ...(countryMatch ? { country: stripWikitext(countryMatch[1]) } : {})
    });
  }
  return recs;
}

async function withRetry(fn, attempts = 6) {
  let lastErr;
  for (let a = 1; a <= attempts; a++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      const wait = e.status === 429 ? 20000 : 2500 * a;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

async function fetchPage(label, title) {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=wikitext&format=json&formatversion=2`;
  try {
    const res = await withRetry(async () => {
      const r = await fetch(url, { headers: UA });
      if (r.status === 429) { const e = new Error('rate limited'); e.status = 429; throw e; }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r;
    });
    const json = await res.json();
    if (json.error) throw new Error(`ERR ${json.error.code}`);
    const wt = json.parse.wikitext || '';
    let recs = [];
    for (const t of findTables(wt)) recs = recs.concat(extractRows(parseTable(t)));
    if (recs.length < 5) recs = recs.concat(extractProse(wt));
    const file = path.join(OUT_DIR, `${label}.json`);
    fs.writeFileSync(file, JSON.stringify(recs, null, 1));
    console.log(`${label}\t${recs.length} rows\ttables ${findTables(wt).length}\t<${title}>`);
    return recs.length;
  } catch (e) {
    console.log(`${label}\tFAILED: ${e.message} <${title}>`);
    return 0;
  }
}

(async () => {
  let total = 0;
  for (const [label, title] of PAGES) {
    total += await fetchPage(label, title);
    await new Promise((r) => setTimeout(r, 800));
  }
  console.log('TOTAL rows fetched:', total);
})().catch((e) => { console.error('FETCH FAILED:', e); process.exit(1); });