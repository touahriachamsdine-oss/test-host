// Removes Israeli companies from the database.
//
// The spec requires complete Israel exclusion. build-v2.js already drops them
// during finalise, but rows seeded before that rule (or rows whose country was
// recorded as "Israel" rather than the ISRAEL_FLAG sentinel) survive. This does
// a final sweep on both the country column and the Wikipedia category cache.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CACHE = path.join(ROOT, 'data', 'global', '_sources', '_country-cache.json');
const { countryFromCategory } = require('./lib/countries');

function dbUrl() {
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  return env.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL=')).slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '');
}

(async () => {
  const { Client } = require('pg');
  const client = new Client({ connectionString: dbUrl() });
  await client.connect();

  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};

  const { rows } = await client.query('SELECT id, name, country, domain FROM startups ORDER BY id');
  const doomed = [];
  const review = [];
  for (const r of rows) {
    // Only the recorded country or a strong Israeli category may trigger a
    // deletion. A stock-exchange listing is not ownership, so the shared
    // resolver handles that distinction.
    if (/\bisrael\b/i.test(r.country || '')) { doomed.push({ ...r, via: `country=${r.country}` }); continue; }
    if (cache[r.name]?.israel) { doomed.push({ ...r, via: 'cache israel flag' }); continue; }
    const strong = (cache[r.name]?.cats || []).find((c) => countryFromCategory(c) === 'ISRAEL_FLAG');
    if (strong) doomed.push({ ...r, via: `category=${strong}` });
    // Report, but never delete, rows that merely trade in Israel.
    const listing = (cache[r.name]?.cats || []).find((c) => /tel aviv stock exchange|\btase\b/i.test(c));
    if (listing) review.push({ ...r, via: listing });
  }

  console.log(`rows scanned: ${rows.length}`);
  console.log(`Israeli rows found: ${doomed.length}`);
  doomed.forEach((r) => console.log(`  ${r.id} | ${r.name} | ${r.country} | ${r.domain} | ${r.via}`));
  console.log(`\nlisted in Israel but NOT treated as Israeli (kept): ${review.length}`);
  review.forEach((r) => console.log(`  ${r.id} | ${r.name} | ${r.country} | ${r.domain} | ${r.via}`));

  if (doomed.length) {
    const ids = doomed.map((r) => r.id);
    await client.query('DELETE FROM startup_translations WHERE startup_id = ANY($1::text[])', [ids]);
    const del = await client.query('DELETE FROM startups WHERE id = ANY($1::text[])', [ids]);
    console.log(`\ndeleted ${del.rowCount} startups and their translations`);
  }

  const after = await client.query("SELECT count(*)::int AS c FROM startups WHERE country ILIKE '%israel%'");
  const total = await client.query('SELECT count(*)::int AS c FROM startups');
  console.log(`\nremaining israel country matches: ${after.rows[0].c}`);
  console.log(`startups total: ${total.rows[0].c}`);
  if (after.rows[0].c !== 0) console.log('WARNING: Israel exclusion incomplete');

  await client.end();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });