// Recomputes cache countries for entries whose country was derived from
// Wikipedia categories (qsource 'category'), using the plurality-based
// resolver. Authoritative Wikidata entries are left untouched.
//
// Categories alone often contain a stray foreign-market or cuisine category
// that the old first/last-match resolver used to pick up (Walmart ->
// "Supermarkets of China", Domino's Pizza -> "Italian-American cuisine").
const fs = require('fs');
const path = require('path');
const { countryFromCategories } = require('./lib/countries.js');

const ROOT = path.join(__dirname, '..');
const CACHE = path.join(ROOT, 'data', 'global', '_sources', '_country-cache.json');

const DRY = process.argv.includes('--dry-run') || !process.argv.includes('--write');
const cache = JSON.parse(fs.readFileSync(CACHE, 'utf8'));

const changes = [];
const israelFlags = [];
let considered = 0;

for (const [name, entry] of Object.entries(cache)) {
  if (entry.qsource !== 'category') continue;
  if (!Array.isArray(entry.cats) || entry.cats.length === 0) continue;
  considered += 1;
  const before = entry.country ?? null;
  const res = countryFromCategories(entry.cats);
  if (res === 'ISRAEL_FLAG') { israelFlags.push(name); continue; }
  // A null result means the categories carry no clear country signal. That is
  // "no opinion", not evidence the stored value is wrong, so it never
  // overwrites. Only a confident, different answer counts as a contradiction.
  if (res && res !== before) {
    changes.push({ name, before, after: res });
  }
}

console.log(`cache entries with derived country: ${considered}`);
console.log(`entries the resolver would change:  ${changes.length}`);
for (const c of changes.slice(0, 40)) {
  console.log(`  ${c.name}: ${c.before} -> ${c.after}`);
}
if (changes.length > 40) console.log(`  ... and ${changes.length - 40} more`);
if (israelFlags.length) {
  console.log(`\nstrong Israeli signal among derived entries (${israelFlags.length}): ${israelFlags.join(', ')}`);
}

if (DRY) {
  console.log('\ndry run only; pass --write to apply');
  process.exit(0);
}

for (const c of changes) cache[c.name].country = c.after;
fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2) + '\n');
console.log(`\nwrote ${changes.length} corrected countries to ${path.relative(ROOT, CACHE)}`);