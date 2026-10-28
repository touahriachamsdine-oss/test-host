// Repairs rows whose `country` column holds something that is not a country.
//
// These predate the allowlist in scripts/lib/countries.js: list pages often put
// a lifespan ("1931-"), a merger note ("merged with X to form Y") or a founder
// list in the country cell, and an earlier seed wrote those strings straight
// into the DB. Each repair re-resolves the country from final.json (already
// validated by the pipeline) or the Wikipedia/Wikidata cache, and rows that turn
// out to be Israeli are removed per the spec.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'data', 'global', '_sources');
const { isTrustedCountry, countryFromCategories } = require('./lib/countries');

function dbUrl() {
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  return env.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL=')).slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '');
}

(async () => {
  const { Client } = require('pg');
  const client = new Client({ connectionString: dbUrl() });
  await client.connect();

  const cache = fs.existsSync(path.join(SRC, '_country-cache.json'))
    ? JSON.parse(fs.readFileSync(path.join(SRC, '_country-cache.json'), 'utf8')) : {};
  const finalByName = new Map(
    JSON.parse(fs.readFileSync(path.join(SRC, 'final.json'), 'utf8')).map((r) => [r.name.toLowerCase(), r.country])
  );

  // Two groups need review:
  //  1. any row whose country is not allowlisted - a person name such as
  //     "Colin Huang" or scraped prose, indistinguishable from a real value by
  //     shape alone, so only the allowlist can decide;
  //  2. any row whose country was itself derived from Wikipedia categories, since
  //     the category resolver was fixed after those values were written. A
  //     category-derived value that is allowlisted is still not necessarily right:
  //     Walmart resolved to "China" because it is allowlisted.
  const { rows: suspects } = await client.query('SELECT id, name, country FROM startups ORDER BY id');
  const reviewed = suspects.filter((r) =>
    !isTrustedCountry(r.country)
    || r.country === 'Unknown'
    || cache[r.name]?.qsource === 'category');
  console.log(`rows needing review: ${reviewed.length} of ${suspects.length} (non-allowlisted, Unknown, or category-derived)`);

  let repaired = 0;
  const unresolved = [];
  const israelish = [];
  const noEvidence = [];

  for (const row of reviewed) {
    const key = row.name.toLowerCase();
    const entry = cache[row.name];

    if (entry && entry.israel) { israelish.push(row); continue; }

    // Source precedence:
    //  1. Wikidata P17/P495 recorded in the cache - authoritative, keep as is.
    //  2. Re-derived from the cached category list - the category resolver was
    //     fixed after these values were first written, so a category-derived
    //     value must be recomputed rather than trusted. final.json is not used as
    //     a source here: it was produced by the same buggy resolver and still
    //     carried Walmart as "China".
    //  3. final.json, for rows with no category evidence at all.
    let fixed = null;
    const sourced = entry && entry.qsource && entry.qsource !== 'category' && entry.country && entry.country !== 'Unknown';
    if (sourced && isTrustedCountry(entry.country)) {
      fixed = entry.country;
    } else if (entry && entry.cats && entry.cats.length) {
      const r = countryFromCategories(entry.cats);
      if (r === 'ISRAEL_FLAG') { entry.israel = true; israelish.push(row); continue; }
      if (r && isTrustedCountry(r)) fixed = r;
    }
    if (!fixed) {
      const fromFinal = finalByName.get(key);
      if (isTrustedCountry(fromFinal)) fixed = fromFinal;
    }

    const target = fixed || 'Unknown';
    if (target !== row.country) {
      await client.query('UPDATE startups SET country=$2, updated_at=now() WHERE id=$1', [row.id, target]);
      repaired++;
      if (target === 'Unknown') noEvidence.push(row);
      continue;
    }

    unresolved.push(row);
  }

  console.log(`country values repaired: ${repaired}`);
  console.log(`  of those, parked as Unknown (no better evidence): ${noEvidence.length}`);
  console.log(`left unchanged (already trusted): ${unresolved.length}`);
  if (unresolved.length) {
    unresolved.slice(0, 15).forEach((r) => console.log(`  ${r.name} => "${r.country}"`));
    if (unresolved.length > 15) console.log(`  ... and ${unresolved.length - 15} more`);
  }

  if (israelish.length) {
    console.log(`\nIsraeli rows detected: ${israelish.length}`);
    israelish.forEach((r) => console.log(`  ${r.id} | ${r.name} | "${r.country}"`));
    for (const r of israelish) {
      await client.query('DELETE FROM startup_translations WHERE startup_id = $1', [r.id]);
      await client.query('DELETE FROM startups WHERE id = $1', [r.id]);
    }
    console.log(`  deleted ${israelish.length} Israeli rows and their translations`);
  }

  const after = await client.query("SELECT count(*)::int AS c FROM startups");
  const bad = await client.query("SELECT count(*)::int AS c FROM startups WHERE length(country) > 30");
  const unk = await client.query("SELECT count(*)::int AS c FROM startups WHERE country='Unknown'");
  const isl = await client.query("SELECT count(*)::int AS c FROM startups WHERE country ILIKE '%israel%'");
  console.log(`\nstartups total: ${after.rows[0].c}`);
  console.log(`country longer than 30 chars: ${bad.rows[0].c}`);
  console.log(`country 'Unknown': ${unk.rows[0].c}`);
  console.log(`israel matches: ${isl.rows[0].c}`);

  await client.end();
})().catch((e) => { console.error('REPAIR FAILED:', e.message); process.exit(1); });