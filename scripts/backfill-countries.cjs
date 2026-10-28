// Resolves each company's country from Wikidata (P17 country / P495 country of
// origin) instead of guessing from Wikipedia category names.
//
// Needed because the category-based resolver in build-v2.js starves whole
// batches: `cllimit=max` is a per-query total, so a single category-heavy page
// exhausts the budget and every other page in the batch comes back with none.
// fetchCategories() in build-v2.js also swallows failed attempts, so affected
// names were never cached at all and silently finalised as "Unknown".
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'data', 'global', '_sources');
const CACHE = path.join(SRC, '_country-cache.json');
const QMAP = path.join(SRC, '_wikidata-country-map.json');
const { countryFromCategory } = require('./lib/countries');

const UA = { 'User-Agent': 'startup-ideas-dz/0.2 (research script)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const WIKI = 'https://en.wikipedia.org/w/api.php';
const WD = 'https://www.wikidata.org/w/api.php';

// Category-derived country is a weaker signal; keep it as a fallback only.
const FALLBACK_COUNTRIES = [
  'United States', 'United Kingdom', 'China', 'Japan', 'South Korea', 'India', 'Germany', 'France',
  'Italy', 'Spain', 'Canada', 'Australia', 'Brazil', 'Russia', 'Ukraine', 'Poland', 'Netherlands',
  'Belgium', 'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Austria', 'Ireland',
  'Portugal', 'Greece', 'Czech Republic', 'Slovakia', 'Slovenia', 'Croatia', 'Serbia', 'Hungary',
  'Romania', 'Bulgaria', 'Lithuania', 'Latvia', 'Estonia', 'Iceland', 'Luxembourg', 'Malta',
  'Turkey', 'Israel', 'Egypt', 'Morocco', 'Algeria', 'Tunisia', 'South Africa', 'Nigeria', 'Kenya',
  'Ghana', 'Tanzania', 'Uganda', 'Zambia', 'Zimbabwe', 'Botswana', 'Namibia', 'Mozambique', 'Ethiopia',
  'Senegal', 'Ivory Coast', 'Cameroon', 'Rwanda', 'Mauritius', 'Mexico', 'Argentina', 'Chile',
  'Colombia', 'Peru', 'Uruguay', 'Venezuela', 'Ecuador', 'Bolivia', 'Paraguay', 'Cuba', 'Vietnam',
  'Thailand', 'Indonesia', 'Malaysia', 'Singapore', 'Philippines', 'Taiwan', 'South Korea', 'Kazakhstan',
  'Uzbekistan', 'Azerbaijan', 'Georgia (country)', 'Armenia', 'Saudi Arabia', 'United Arab Emirates',
  'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Jordan', 'Lebanon', 'Iraq', 'Iran', 'Pakistan',
  'Bangladesh', 'Sri Lanka', 'Nepal', 'Myanmar', 'Cambodia', 'Laos', 'Mongolia', 'Afghanistan'
];

async function getJson(url, tries = 6) {
  for (let a = 1; a <= tries; a++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 30000);
    try {
      const r = await fetch(url, { headers: UA, signal: ctl.signal });
      clearTimeout(timer);
      if (r.status === 429) { await sleep(20000 * a); continue; }
      if (r.status >= 500) { await sleep(5000 * a); continue; }
      if (!r.ok) return null;
      return await r.json();
    } catch (e) {
      clearTimeout(timer);
      if (a === tries) { console.error(`   ! giving up after ${a} tries: ${e.message}`); return null; }
      await sleep(5000 * a);
    }
  }
  return null;
}

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// --- Phase 1: categories + wikibase_item, small batches so no page starves the batch
async function fetchPages(names) {
  const found = new Map();
  let failures = 0;
  for (const batch of chunk(names, 15)) {
    const url = `${WIKI}?action=query&format=json&formatversion=2&redirects=1` +
      `&prop=categories|pageprops&cllimit=500&titles=${encodeURIComponent(batch.join('|'))}`;
    const j = await getJson(url);
    if (!j) { failures++; continue; }

    const norm = {};
    for (const r of j.query?.redirects || []) norm[r.from] = r.to;

    for (const p of j.query?.pages || []) {
      const entry = {
        cats: (p.categories || []).map((c) => c.title),
        qid: p.pageprops?.wikibase_item || null
      };
      found.set(p.title, entry);
      for (const [from, to] of Object.entries(norm)) {
        if (to === p.title) found.set(from, entry);
      }
    }
    if (failures) console.log(`   ! ${failures} batch requests failed so far`);
    await sleep(200);
  }
  return found;
}

// --- Phase 2: Wikidata country claims
async function fetchQids(qids) {
  const found = new Map();
  for (const batch of chunk(qids, 45)) {
    const url = `${WD}?action=wbgetentities&format=json&ids=${batch.join('|')}&props=claims`;
    const j = await getJson(url);
    if (!j) continue;
    for (const [qid, ent] of Object.entries(j.entities || {})) {
      const claims = ent.claims || {};
      const pick = (prop) => {
        const arr = claims[prop];
        if (!arr || !arr.length) return null;
        const v = arr[0]?.mainsnak?.datavalue?.value;
        return v && typeof v === 'object' && v.id ? v.id : null;
      };
      found.set(qid, { p17: pick('P17'), p495: pick('P495') });
    }
    await sleep(200);
  }
  return found;
}

async function loadCountryLabels(qids) {
  let map = {};
  if (fs.existsSync(QMAP)) map = JSON.parse(fs.readFileSync(QMAP, 'utf8'));
  const missing = [...new Set(qids)].filter((q) => !map[q]);
  if (!missing.length) return map;
  for (const batch of chunk(missing, 45)) {
    const url = `${WD}?action=wbgetentities&format=json&ids=${batch.join('|')}&props=labels&languages=en`;
    const j = await getJson(url);
    if (!j) continue;
    for (const [qid, ent] of Object.entries(j.entities || {})) {
      const label = ent.labels?.en?.value;
      if (label) map[qid] = label;
    }
    await sleep(200);
  }
  fs.writeFileSync(QMAP, JSON.stringify(map, null, 1));
  return map;
}

// Use the shared resolver. An earlier local copy of this logic drifted from
// build-v2.js: it returned the first FALLBACK_COUNTRIES prefix match, so a
// multinational with categories for two countries resolved to whichever came
// first in that array, and it treated any category containing "israel" as
// Israeli ownership (deleting Perrigo for its Tel Aviv listing).
const CATEGORY_FALLBACK = (cat) => {
  const r = countryFromCategory(cat);
  if (!r || r === 'ISRAEL_FLAG') return r;
  return FALLBACK_COUNTRIES.includes(r) ? r : null;
};

(async () => {
  const finalPath = path.join(SRC, 'final.json');
  const final = JSON.parse(fs.readFileSync(finalPath, 'utf8'));
  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};

  const unresolved = [...new Set(final.filter((r) => !r.country || r.country === 'Unknown').map((r) => r.name))];
  console.log(`unresolved-country rows: ${unresolved.length} (unique names ${unresolved.length})`);

  const missingQid = [];
  const todo = [];
  for (const name of unresolved) {
    const c = cache[name];
    if (c && c.qid) todo.push(name);
    else missingQid.push(name);
  }
  console.log(`  already have a Wikidata id: ${todo.length} | need page lookup: ${missingQid.length}`);

  if (missingQid.length) {
    console.log(`\nPhase 1: fetching categories + Wikidata ids for ${missingQid.length} names`);
    const pages = await fetchPages(missingQid);
    console.log(`  pages returned: ${pages.size}/${missingQid.length}`);
    for (const [name, entry] of pages) {
      const prev = cache[name] || {};
      cache[name] = { country: prev.country || 'Unknown', israel: !!prev.israel, cats: entry.cats.length ? entry.cats : prev.cats || [], qid: entry.qid || prev.qid || null };
      todo.push(name);
    }
    fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));
  }

  const qids = [...new Set(todo.map((n) => cache[n]?.qid).filter(Boolean))];
  console.log(`\nPhase 2: Wikidata country claims for ${qids.length} entities`);
  const claims = await fetchQids(qids);
  console.log(`  entities returned: ${claims.size}`);

  const countryQids = new Set();
  for (const c of claims.values()) {
    if (c.p17) countryQids.add(c.p17);
    if (c.p495) countryQids.add(c.p495);
  }
  console.log(`\nPhase 3: labels for ${countryQids.size} country entities`);
  const qmap = await loadCountryLabels([...countryQids]);
  console.log(`  country label map size: ${Object.keys(qmap).length}`);

  let wikidataHit = 0;
  let fallbackHit = 0;
  let stillUnknown = 0;
  for (const name of todo) {
    const c = cache[name];
    if (!c) continue;
    const claim = claims.get(c.qid);
    const label = claim && ((claim.p17 && qmap[claim.p17]) || (claim.p495 && qmap[claim.p495]));
    if (label) {
      c.country = label;
      c.qsource = 'wikidata';
      wikidataHit++;
      continue;
    }
    let fb = null;
    for (const cat of c.cats || []) {
      const r = CATEGORY_FALLBACK(cat);
      if (r === 'ISRAEL_FLAG') { c.israel = true; break; }
      if (r) fb = r;
    }
    if (fb) {
      c.country = fb;
      c.qsource = 'category';
      fallbackHit++;
    } else if (!c.country || c.country === 'Unknown') {
      stillUnknown++;
    }
    if (c.israel) c.country = 'ISRAEL_FLAG';
  }

  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));
  console.log(`\nresolved from Wikidata: ${wikidataHit}`);
  console.log(`resolved from categories: ${fallbackHit}`);
  console.log(`still unknown: ${stillUnknown}`);
  process.exit(0);
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});