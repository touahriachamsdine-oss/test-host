const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DOMAIN_FILES = {
  'ai-computing': 'data/global/ai-computing.json',
  'robotics': 'data/global/robotics.json',
  'biotech-healthtech': 'data/global/biotech-healthtech.json',
  'drones-autonomy': 'data/global/drones-autonomy.json',
  'nanotech-materials': 'data/global/nanotech-materials.json',
  'energy-storage': 'data/global/energy-storage.json',
  'space-aerospace': 'data/global/space-aerospace.json',
  'agritech-foodtech': 'data/global/agritech-foodtech.json',
  'medtech': 'data/global/medtech.json',
  'semiconductors': 'data/global/semiconductors.json',
  'cybersecurity': 'data/global/cybersecurity.json',
  'manufacturing-3d': 'data/global/manufacturing-3d.json',
  'cleantech': 'data/global/cleantech.json',
  'cloud-iot': 'data/global/cloud-iot.json',
  'other-deep-tech': 'data/global/other-deep-tech.json'
};

const REQUIRED = ['name', 'country', 'sub_domain', 'short_description', 'technology', 'year_founded', 'official_site', 'priority', 'why_relevant'];

function slugify(name) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length ? base : 'imported';
}

(async () => {
  const env = fs.readFileSync('.env.local', 'utf8');
  const m = env.match(/DATABASE_URL\s*=\s*"([^"]+)"/) || env.match(/DATABASE_URL\s*=\s*'([^']+)'/);
  if (!m) throw new Error('DATABASE_URL not found in .env.local');
  const client = new Client({ connectionString: m[1] });
  await client.connect();

  const existing = await client.query('SELECT id, name, country FROM startups');
  const knownNames = new Map(existing.rows.map((r) => [r.name.toLowerCase().trim(), r]));
  const usedIds = new Set(existing.rows.map((r) => r.id));

  const all = [];
  const errors = [];
  const duplicatedNames = [];

  for (const [domain, file] of Object.entries(DOMAIN_FILES)) {
    const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const row of rows) {
      const name = String(row.name || '').trim();
      for (const key of REQUIRED) {
        if (key === 'year_founded') continue;
        if (row[key] === undefined || String(row[key]).trim() === '') {
          errors.push(`${domain}/${name || '(unknown)'}: missing ${key}`);
        }
      }
      const dup = knownNames.get(name.toLowerCase());
      if (dup) {
        duplicatedNames.push(`${name} (existing: ${dup.name} in ${dup.country})`);
        continue;
      }
      knownNames.set(name.toLowerCase(), { name, country: row.country });
      all.push({ domain, ...row, name });
    }
  }

  const byName = new Map();
  for (const row of all) {
    const key = row.name.toLowerCase().trim();
    if (byName.has(key)) {
      duplicatedNames.push(`IN-FILE ${row.name} in ${row.domain} and ${byName.get(key).domain}`);
    } else {
      byName.set(key, row);
    }
  }

  if (errors.length || duplicatedNames.length) {
    console.log('VALIDATION ERRORS:');
    errors.forEach((e) => console.log(' -', e));
    console.log('DUPLICATES:');
    duplicatedNames.forEach((d) => console.log(' -', d));
    throw new Error('Validation failed');
  }

  const perDomain = {};
  for (const row of all) perDomain[row.domain] = (perDomain[row.domain] || 0) + 1;
  console.log('Per-domain rows (verified set):');
  Object.entries(perDomain).forEach(([d, c]) => console.log(`  ${d}: ${c}`));
  console.log('TOTAL to insert:', all.length);

  const insert = await client.query('SELECT 1');
  console.log('(connection ok)');

  await client.query('BEGIN');
  let inserted = 0;
  for (const row of all) {
    let id = slugify(row.name);
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${slugify(row.name)}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);
    const year = row.year_founded && /^\d{4}$/.test(String(row.year_founded)) ? Number(row.year_founded) : null;
    await client.query(
      `INSERT INTO startups (
         id, name, country, domain, sub_domain, short_description, technology,
         year_founded, official_site, source_url, why_relevant, priority, status,
         is_duplicate_2025, submitted_by_team, submitted_by_team_code
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'verified',$13,NULL,NULL)`,
      [
        id, row.name, row.country, row.domain, row.sub_domain, row.short_description,
        row.technology, year, row.official_site || null, row.official_site || null,
        row.why_relevant, row.priority, false
      ]
    );
    inserted += 1;
  }
  await client.query('COMMIT');

  const after = await client.query("SELECT count(*)::int AS total FROM startups");
  const afterVerified = await client.query("SELECT count(*)::int AS total FROM startups WHERE status = 'verified'");
  const perDomainAfter = await client.query("SELECT domain, count(*)::int FROM startups WHERE status='verified' GROUP BY domain ORDER BY domain");
  console.log('INSERTED:', inserted);
  console.log('TOTAL startups now:', after.rows[0].total, '| verified:', afterVerified.rows[0].total);
  perDomainAfter.rows.forEach((r) => console.log(`  ${r.domain}: ${r.count}`));
  await client.end();
})().catch((err) => {
  console.error('SEED FAILED:', err.message);
  process.exit(1);
});