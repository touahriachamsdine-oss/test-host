const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

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

function getDatabaseUrl() {
  const line = envContent.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL='));
  if (!line) throw new Error('DATABASE_URL not found in .env.local');
  const url = line.slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '');
  return url;
}

function slugify(name) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length ? base : 'imported';
}

async function main() {
  const transDir = path.join(root, 'data', 'global', 'translations');
  if (!fs.existsSync(transDir)) throw new Error('translations dir missing: ' + transDir);

  const pool = new Pool({ connectionString: getDatabaseUrl() });
  try {
    const { rows: all } = await pool.query('SELECT id, name, domain FROM startups');
    const byId = new Map(all.map((r) => [r.id, r.name]));
    const idBySlug = new Map(all.map((r) => [slugify(r.name), r.id]));

    let total = 0;
    let missing = 0;
    const errors = [];

    await pool.query('BEGIN');
    for (const [domain, file] of Object.entries(DOMAIN_FILES)) {
      const transPath = path.join(transDir, `${domain}.json`);
      if (!fs.existsSync(transPath)) {
        console.log(`MISSING translation file: ${domain}.json`);
        continue;
      }
      const data = JSON.parse(fs.readFileSync(transPath, 'utf8'));
      for (const [slug, locales] of Object.entries(data)) {
        if (!byId.has(slug)) {
          if (!locales._fallback || !idBySlug.has(locales._fallback)) {
            errors.push(`${domain}/${slug}: startup not found`);
            missing += 1;
            continue;
          }
        }
        const id = byId.has(slug) ? slug : idBySlug.get(locales._fallback);
        for (const locale of ['ar', 'fr']) {
          const tr = locales[locale];
          if (!tr) {
            errors.push(`${domain}/${id}/${locale}: no data`);
            continue;
          }
          await pool.query(
            `INSERT INTO startup_translations
               (startup_id, locale, name, country, sub_domain, short_description, technology, why_relevant)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (startup_id, locale) DO UPDATE SET
               name = EXCLUDED.name,
               country = EXCLUDED.country,
               sub_domain = EXCLUDED.sub_domain,
               short_description = EXCLUDED.short_description,
               technology = EXCLUDED.technology,
               why_relevant = EXCLUDED.why_relevant,
               updated_at = now()`,
            [
              id,
              locale,
              tr.name,
              tr.country ?? null,
              tr.sub_domain ?? null,
              tr.short_description,
              tr.technology,
              tr.why_relevant
            ]
          );
          total += 1;
        }
      }
    }

    if (errors.length) {
      await pool.query('ROLLBACK');
      console.log('ERRORS:');
      errors.forEach((e) => console.log(' -', e));
      throw new Error(`${errors.length} errors, rolled back`);
    }

    await pool.query('COMMIT');
    const counts = await pool.query(
      `SELECT locale, count(*)::int FROM startup_translations GROUP BY locale ORDER BY locale`
    );
    console.log('upserted', total, 'rows');
    counts.rows.forEach((r) => console.log(`  ${r.locale}: ${r.count}`));
  } catch (err) {
    try { await pool.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});