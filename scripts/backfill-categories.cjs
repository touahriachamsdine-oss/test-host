// Final country pass: resolve rows still at "Unknown" from English Wikipedia
// category evidence.
//
// Two groups need handling:
//   1. cache entries with a qid but no P17/P495/P159 (mostly defunct firms)
//   2. rows with no cache entry at all (baseline v1 rows)
//
// Both are resolved the same way: pull the enwiki page title from Wikidata (or
// search by name), read its categories, and hand them to the shared resolver so
// this pass accepts exactly the same countries the source pipeline does.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'data', 'global', '_sources');
const CACHE = path.join(SRC, '_country-cache.json');
const { isTrustedCountry, countryFromCategory } = require('./lib/countries');

const UA = { 'User-Agent': 'startup-ideas-dz/0.2 (research script)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WD = 'https://www.wikidata.org/w/api.php';
const EN = 'https://en.wikipedia.org/w/api.php';

async function getJson(url, tries = 6) {
  for (let a = 1; a <= tries; a++) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 30000);
    try {
      const r = await fetch(url, { headers: UA, signal: ctl.signal });
      clearTimeout(t);
      if (r.status === 429) { await sleep(20000 * a); continue; }
      if (!r.ok) return null;
      return await r.json();
    } catch (e) {
      clearTimeout(t);
      if (a === tries) return null;
      await sleep(4000 * a);
    }
  }
  return null;
}

const chunk = (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };

// A disambiguation page is not evidence about a company. Treat it as "no
// article" so the row is never bound to the wrong subject.
const DISAMBIGUATION = /disambiguation/i;

function dbUrl() {
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  return env.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL=')).slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '');
}

// Resolve the English Wikipedia article title for each company name.
async function titlesFor(names) {
  const out = new Map();
  for (const batch of chunk(names, 45)) {
    const joined = batch.map(encodeURIComponent).join('|');
    const j = await getJson(`${EN}?action=query&format=json&redirects=1&titles=${joined}&prop=pageprops`);
    if (!j?.query) continue;
    const norm = {};
    for (const n of j.query.normalized || []) norm[n.to] = n.from;
    for (const r of j.query.redirects || []) norm[r.to] = r.from;
    for (const p of Object.values(j.query.pages || {})) {
      if (p.missing !== undefined) continue;
      const original = norm[p.title] || p.title;
      out.set(original, p.title);
    }
    await sleep(150);
  }
  return out;
}

// Read categories for the resolved article titles.
async function catsFor(titles) {
  const out = new Map();
  for (const batch of chunk(titles, 45)) {
    const j = await getJson(`${EN}?action=query&format=json&titles=${batch.map(encodeURIComponent).join('|')}&prop=categories&cllimit=500&clshow=!hidden`);
    if (!j?.query) continue;
    const norm = {};
    for (const n of j.query.normalized || []) norm[n.to] = n.from;
    for (const r of j.query.redirects || []) norm[r.to] = r.from;
    for (const p of Object.values(j.query.pages || {})) {
      if (p.missing !== undefined) continue;
      const cats = (p.categories || []).map((c) => c.title);
      if (cats.some((c) => DISAMBIGUATION.test(c))) continue;
      const original = norm[p.title] || p.title;
      out.set(original, cats);
    }
    await sleep(150);
  }
  return out;
}

(async () => {
  const cache = JSON.parse(fs.readFileSync(CACHE, 'utf8'));

  const { Client } = require('pg');
  const client = new Client({ connectionString: dbUrl() });
  await client.connect();
  const { rows: unknowns } = await client.query("SELECT id, name FROM startups WHERE country = 'Unknown' OR country IS NULL");
  console.log(`rows still Unknown: ${unknowns.length}`);

  const titleByName = await titlesFor(unknowns.map((r) => r.name));
  console.log(`  matched to an enwiki article: ${titleByName.size}`);

  const catMap = await catsFor([...titleByName.values()]);
  console.log(`  category fetches returned: ${catMap.size}`);

  // Any name still unbound either has no article or landed on a disambiguation
  // page. Neither is country evidence, so they are left for a human to triage
  // via _still-unknown.json rather than guessed at.

  let hits = 0;
  const stillUnknown = [];
  for (const row of unknowns) {
    const title = titleByName.get(row.name);
    const cats = title ? catMap.get(title) || [] : [];
    let country = null;
    for (const cat of cats) {
      const r = countryFromCategory(cat);
      if (r && isTrustedCountry(r)) { country = r; break; }
    }
    if (country) {
      await client.query('UPDATE startups SET country=$2, updated_at=now() WHERE id=$1', [row.id, country]);
      const e = cache[row.name] || (cache[row.name] = {});
      e.country = country;
      e.qsource = 'enwiki-categories';
      e.article = title;
      e.cats = cats;
      hits++;
    } else {
      stillUnknown.push({ id: row.id, name: row.name, title, cats: cats.length });
    }
  }

  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));
  fs.writeFileSync(path.join(SRC, '_still-unknown.json'), JSON.stringify(stillUnknown, null, 1));

  console.log(`\nresolved from enwiki categories: ${hits}`);
  console.log(`still unresolved: ${stillUnknown.length}`);
  const t = await client.query("SELECT count(*)::int AS c FROM startups WHERE country='Unknown'");
  const total = await client.query('SELECT count(*)::int AS c FROM startups');
  console.log(`country 'Unknown' now: ${t.rows[0].c} / ${total.rows[0].c} (${((t.rows[0].c / total.rows[0].c) * 100).toFixed(1)}%)`);
  await client.end();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });