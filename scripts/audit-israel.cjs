// Audit mode for scripts/purge-israel.cjs.
//
// Default matching used a bare /israel/i over Wikipedia categories, so a company
// was deleted for appearing in a listing category such as
// "Companies listed on the Tel Aviv Stock Exchange" even when it is not Israeli
// (Perrigo, an Irish-American company listed in New York, was one casualty).
//
// This script re-checks every row against STRONG Israeli signals only and prints
// a keep/review verdict. It changes no data.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CACHE = path.join(ROOT, 'data', 'global', '_sources', '_country-cache.json');

// Ownership/identity: the company itself is Israeli.
const STRONG_COUNTRY = /\bisrael\b/i;
const STRONG_CATS = [
  /companies (based|of|headquartered) in israel/i,
  /israeli (companies|corporations|manufacturers|startups|technology|tech|pharmaceutical|biotech|medical|defense)/i,
  /companies based in (tel aviv|haifa|jerusalem|rehovot|petah tikva|netanya|rishon lezion|beer sheva|beer-sheva|ramat gan)/i,
  /(headquarters|headquartered) in (tel aviv|haifa|jerusalem|rehovot|petah tikva|netanya|ramat gan)/i,
];

// Weak signals: these place a company in an Israeli context but do not establish
// Israeli ownership. They are reported for review, never auto-deleted.
const WEAK_CATS = [
  /listed on the tel aviv stock exchange/i,
  /companies listed on the (tel aviv|nasdaq|nyse|stock exchange)/i,
  /establish(ed|ments)? in israel/i,
  /israeli (stock|exchange|market)/i,
  /\bisrael\b/i,
];

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

  const strong = [];
  const weakOnly = [];
  for (const r of rows) {
    const cats = cache[r.name]?.cats || [];
    const strongCat = cats.find((c) => STRONG_CATS.some((p) => p.test(c)));
    const weakCat = cats.find((c) => WEAK_CATS.some((p) => p.test(c)));
    const strongCountry = STRONG_COUNTRY.test(r.country || '') || cache[r.name]?.israel === true;

    if (strongCountry || strongCat) {
      strong.push({ ...r, via: strongCountry ? `country=${r.country}` : `category=${strongCat}` });
    } else if (weakCat) {
      weakOnly.push({ ...r, via: weakCat });
    }
  }

  console.log(`rows scanned: ${rows.length}`);
  console.log(`\nSTRONG Israeli signals (would be deleted): ${strong.length}`);
  strong.forEach((r) => console.log(`  ${r.id} | ${r.name} | ${r.country} | ${r.domain} | ${r.via}`));

  console.log(`\nWEAK-ONLY signals (must NOT be auto-deleted): ${weakOnly.length}`);
  weakOnly.forEach((r) => console.log(`  ${r.id} | ${r.name} | ${r.country} | ${r.domain} | ${r.via}`));

  fs.writeFileSync(path.join(ROOT, 'data', 'global', '_sources', '_israel-strong.txt'),
    strong.map((r) => r.id).join('\n') + '\n');
  fs.writeFileSync(path.join(ROOT, 'data', 'global', '_sources', '_israel-weak-review.txt'),
    weakOnly.map((r) => `${r.id}\t${r.name}\t${r.via}`).join('\n') + '\n');

  await client.end();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });