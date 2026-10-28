// Corrects country values in final.json for entries whose Wikipedia categories
// agree on a different, trusted country with a clear margin.
//
// Background: an earlier resolver took the first or last category match, so
// final.json kept values such as Walmart -> "China" (from "Supermarkets of
// China", its local subsidiary chain) and Domino's Pizza -> "Italy" (from
// "Italian-American cuisine"). The database was already repaired with the
// fixed plurality resolver; these files still held the old answers and would
// reintroduce them on the next seed.
//
// Guard rails, because the resolver is not trustworthy on its own:
//   - the winning country must be trusted (real country in the allowlist);
//   - it must beat the runner-up by at least MARGIN votes, so a single
//     coincidental category cannot decide the answer. Ford is why: it resolved
//     to "United Kingdom" from one category, "English masculine given names",
//     which is about a given name rather than the company;
//   - only qsource 'category' entries are touched, never Wikidata.
//
// Run with --dry-run (the default) to review before writing.
const fs = require('fs');
const path = require('path');
const { countryFromCategory, countryFromCategories, isTrustedCountry } = require('./lib/countries.js');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'data', 'global', '_sources');
const FINAL = path.join(SRC, 'final.json');
const MARGIN = 2;

// Checked by hand and excluded from the automatic pass: the categories mix a
// domicile signal with a product signal and support either answer. Hadji Bey
// carries "Food and drink companies of Ireland" and "Irish confectionery"
// against "Turkish delight", so the previous value is as defensible as the new
// one and the call belongs to a human.
const SKIP = new Set(['Hadji Bey']);

// Rejected by the margin rule despite being verified by hand, because a single
// cuisine category is not a domicile signal. Domino's Pizza has "Fast-food
// chains of the United States" and "Pizza chains of the United States" against
// "Italian-American cuisine"; it is a US company listed in Italy, and "Italy"
// came from that cuisine category.
const VERIFIED = new Map([
  ["Domino's Pizza", 'United States'],
  ["Domino's", 'United States'],
]);

const DRY = !process.argv.includes('--write');

const cache = JSON.parse(fs.readFileSync(path.join(SRC, '_country-cache.json'), 'utf8'));
const final = JSON.parse(fs.readFileSync(FINAL, 'utf8'));

function rankedVotes(cats) {
  const counts = new Map();
  for (const cat of cats || []) {
    const r = countryFromCategory(cat);
    if (r && r !== 'ISRAEL_FLAG') counts.set(r, (counts.get(r) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

const changes = [];
const rejected = [];
let matched = 0;

for (const row of final) {
  if (SKIP.has(row.name)) { rejected.push([row.name, 'ambiguous, skipped by hand']); continue; }

  const want = VERIFIED.get(row.name);
  if (want) {
    if (row.country !== want && isTrustedCountry(want)) {
      changes.push({ name: row.name, from: row.country, to: want, margin: 'manual', votes: 'manual' });
    }
    continue;
  }

  const entry = cache[row.name];
  if (!entry || entry.qsource !== 'category' || !Array.isArray(entry.cats) || !entry.cats.length) continue;
  matched += 1;

  const res = countryFromCategories(entry.cats);
  if (!res || res === 'ISRAEL_FLAG') continue;
  if (res === row.country) continue;
  if (!isTrustedCountry(res)) { rejected.push([row.name, `${res} not a trusted country`]); continue; }

  const ranked = rankedVotes(entry.cats);
  const margin = ranked.length > 1 ? ranked[0][1] - ranked[1][1] : ranked[0][1];
  if (margin < MARGIN) { rejected.push([row.name, `margin ${margin} < ${MARGIN}`]); continue; }

  changes.push({ name: row.name, from: row.country, to: res, margin, votes: ranked[0][1] });
}

console.log(`final.json rows: ${final.length}`);
console.log(`rows with category evidence: ${matched}`);
console.log(`corrections passing all guards: ${changes.length}`);
for (const c of changes) {
  console.log(`  ${c.name}: ${c.from} -> ${c.to}  (${c.votes} votes, margin ${c.margin})`);
}
console.log(`\nrejected: ${rejected.length}`);
for (const [n, why] of rejected.slice(0, 20)) console.log(`  ${n}: ${why}`);
if (rejected.length > 20) console.log(`  ... and ${rejected.length - 20} more`);

if (DRY) {
  console.log('\ndry run only; pass --write to apply');
  process.exit(0);
}

const byName = new Map(changes.map((c) => [c.name, c.to]));
for (const row of final) {
  const to = byName.get(row.name);
  if (to) row.country = to;
}
fs.writeFileSync(FINAL, JSON.stringify(final, null, 2) + '\n');
console.log(`\npatched ${changes.length} countries in ${path.relative(ROOT, FINAL)}`);