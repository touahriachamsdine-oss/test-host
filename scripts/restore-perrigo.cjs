// Restores Perrigo, which the Israel purge removed incorrectly.
//
// It was flagged only by "Companies listed on the Tel Aviv Stock Exchange".
// Perrigo is an Irish-American pharmaceutical group headquartered in Dublin and
// listed on the NYSE; a TASE listing does not make a company Israeli.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const V2 = path.join(ROOT, 'data', 'global', 'v2');
const FINAL = path.join(ROOT, 'data', 'global', '_sources', 'final.json');

function dbUrl() {
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  return env.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL=')).slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '');
}

function slugify(name) {
  return String(name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

(async () => {
  const { Client } = require('pg');
  const client = new Client({ connectionString: dbUrl() });
  await client.connect();

  const exists = await client.query('SELECT id FROM startups WHERE lower(name) = lower($1)', ['Perrigo']);
  if (exists.rowCount) {
    console.log('Perrigo already present:', exists.rows[0].id);
    await client.end();
    return;
  }

  const final = JSON.parse(fs.readFileSync(FINAL, 'utf8'));
  const src = final.find((r) => /perrigo/i.test(r.name));
  if (!src) throw new Error('Perrigo not found in final.json');
  console.log(`final.json source: ${src.name} | ${src.country} | ${src.domain}`);

  // Locate the generated record, which carries the analysis + translations.
  let record = null;
  for (const file of fs.readdirSync(V2)) {
    const rows = JSON.parse(fs.readFileSync(path.join(V2, file), 'utf8'));
    const hit = rows.find((r) => /perrigo/i.test(r.name));
    if (hit) { record = hit; console.log(`generated record found in v2/${file}`); break; }
  }
  if (!record) throw new Error('Perrigo generated record not found');

  const id = slugify(record.name);
  // Mirrors COLS in seed-global-v2.js; the real schema has is_duplicate_2025,
  // submitted_by_team and submitted_by_team_code.
  const COLS = [
    'id', 'name', 'country', 'domain', 'sub_domain', 'short_description', 'technology',
    'year_founded', 'official_site', 'source_url', 'why_relevant', 'priority',
    'status', 'is_duplicate_2025', 'submitted_by_team', 'submitted_by_team_code',
    'concept', 'main_sellers', 'team_rec', 'build_approach', 'product_issues',
    'algeria_value', 'difficulty_score', 'difficulty_breakdown', 'source_tier', 'source_note'
  ];

  const values = [
    id, record.name, 'Ireland', src.domain, record.sub_domain, record.short_description,
    record.technology, /^\d{4}$/.test(String(record.year_founded)) ? Number(record.year_founded) : null,
    record.official_site || null, record.source_url || null, record.why_relevant, record.priority,
    'verified', false, null, null,
    record.concept ?? null, record.main_sellers ? JSON.stringify(record.main_sellers) : null,
    record.team_rec ? JSON.stringify(record.team_rec) : null, record.build_approach ?? null,
    record.product_issues ? JSON.stringify(record.product_issues) : null, record.algeria_value ?? null,
    record.difficulty_score ?? null, record.difficulty_breakdown ? JSON.stringify(record.difficulty_breakdown) : null,
    record.source_tier ?? null, record.source_note ?? null
  ];

  // The VALUES list must be parenthesised; a bare "$1,$2" list is a syntax error.
  const placeholders = `(${values.map((_, j) => '$' + (j + 1)).join(',')})`;
  await client.query(`INSERT INTO startups (${COLS.join(',')}) VALUES ${placeholders}`, values);
  console.log(`restored Perrigo as ${id} (country Ireland, domain ${src.domain})`);

  const trCols = ['startup_id', 'locale', 'name', 'country', 'sub_domain', 'short_description',
    'technology', 'why_relevant', 'concept', 'main_sellers', 'team_rec', 'build_approach',
    'product_issues', 'algeria_value'];
  const tvals = [];
  const params = [];
  for (const locale of ['ar', 'fr']) {
    const t = record.translations?.[locale] || {};
    const row = [
      id, locale, record.name, 'Ireland', record.sub_domain,
      t.short_description ?? record.short_description, t.technology ?? record.technology,
      t.why_relevant ?? record.why_relevant, t.concept ?? record.concept,
      t.main_sellers ? JSON.stringify(t.main_sellers) : JSON.stringify(record.main_sellers),
      t.team_rec ? JSON.stringify(t.team_rec) : JSON.stringify(record.team_rec),
      t.build_approach ?? record.build_approach, t.product_issues ?? record.product_issues,
      t.algeria_value ?? record.algeria_value
    ];
    tvals.push(`(${row.map((_, j) => '$' + (params.length + 1 + j)).join(',')})`);
    params.push(...row);
  }
  await client.query(
    `INSERT INTO startup_translations (${trCols.join(',')}) VALUES ${tvals.join(',')}
     ON CONFLICT (startup_id, locale) DO NOTHING`,
    params
  );
  console.log('restored ar + fr translations');

  const t = await client.query('SELECT count(*)::int AS c FROM startups');
  const isl = await client.query("SELECT count(*)::int AS c FROM startups WHERE country ILIKE '%israel%'");
  console.log(`\nstartups total: ${t.rows[0].c} | israel matches: ${isl.rows[0].c}`);
  await client.end();
})().catch((e) => { console.error('RESTORE FAILED:', e.message); process.exit(1); });