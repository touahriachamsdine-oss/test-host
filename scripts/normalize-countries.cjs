// Normalizes equivalent country names to one canonical form.
//
// Wikidata returns "People's Republic of China" for Chinese entities while the
// scraped and category-derived values use "China", so the same country appeared
// under two spellings and split the country breakdown. Normalizes both the DB and
// the cache; Wikidata is untouched since the alias handles it on read.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CACHE = path.join(ROOT, 'data', 'global', '_sources', '_country-cache.json');
const { ALIAS_COUNTRY } = require('./lib/countries');

function dbUrl() {
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  return env.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL=')).slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '');
}

// Only rewrite a value when it is not already the canonical spelling.
const canonical = (v) => {
  const s = String(v || '').trim();
  const low = s.toLowerCase();
  return ALIAS_COUNTRY[low] && ALIAS_COUNTRY[low] !== s ? ALIAS_COUNTRY[low] : null;
};

(async () => {
  const { Client } = require('pg');
  const client = new Client({ connectionString: dbUrl() });
  await client.connect();

  const { rows } = await client.query('SELECT id, name, country FROM startups ORDER BY id');
  let updated = 0;
  const byTarget = new Map();
  for (const r of rows) {
    const to = canonical(r.country);
    if (!to) continue;
    await client.query('UPDATE startups SET country=$2, updated_at=now() WHERE id=$1', [r.id, to]);
    updated++;
    byTarget.set(`${r.country} -> ${to}`, (byTarget.get(`${r.country} -> ${to}`) || 0) + 1);
  }
  console.log(`DB rows normalized: ${updated}`);
  for (const [k, v] of byTarget) console.log(`  ${k}: ${v}`);

  // Mirror into translations so per-locale country labels stay consistent.
  let trUpdated = 0;
  for (const [from, to] of byTarget.keys()) {
    const [src, dst] = from.split(' -> ');
    const r = await client.query('UPDATE startup_translations SET country=$2 WHERE country=$1', [src, dst]);
    trUpdated += r.rowCount || 0;
  }
  console.log(`translation rows normalized: ${trUpdated}`);

  if (fs.existsSync(CACHE)) {
    const cache = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
    let cacheUpdated = 0;
    for (const e of Object.values(cache)) {
      const to = canonical(e.country);
      if (to) { e.country = to; cacheUpdated++; }
    }
    fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));
    console.log(`cache entries normalized: ${cacheUpdated}`);
  }

  await client.end();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });