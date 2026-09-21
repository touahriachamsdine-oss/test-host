const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

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

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

async function main() {
  const transDir = path.join(root, 'data', 'global', 'translations');
  const originalFile = path.join(root, 'data', 'original', 'enrichment.json');

  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();
  try {
    const { rows: all } = await client.query('SELECT id, name FROM startups');
    const byId = new Set(all.map((r) => r.id));
    const idBySlug = new Map(all.map((r) => [slugify(r.name), r.id]));

    const errors = [];
    let startupUpdates = 0;
    let transUpdates = 0;
    let processed = 0;

    const starRows = [];      // [id, history, hq_city, lat, lng]
    const transRows = [];     // [startup_id, locale, history, hq_city]

    const addStartup = (id, e, source) => {
      if (!byId.has(id)) {
        errors.push(`${source}/${id}: startup not found`);
        return;
      }
      starRows.push([id, e.history ?? null, e.hq_city ?? null, num(e.latitude), num(e.longitude)]);
      startupUpdates += 1;
    };

    const addTranslations = (id, locales, source) => {
      if (!locales) {
        errors.push(`${source}/${id}: no translation entry`);
        return;
      }
      for (const locale of ['ar', 'fr']) {
        const tr = locales[locale];
        if (!tr || (tr.history == null && tr.hq_city == null)) continue;
        transRows.push([id, locale, tr.history ?? null, tr.hq_city ?? null]);
        transUpdates += 1;
      }
    };

    for (const [domain, file] of Object.entries(DOMAIN_FILES)) {
      const rows = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
      const trans = JSON.parse(fs.readFileSync(path.join(transDir, `${domain}.json`), 'utf8'));

      for (const row of rows) {
        const slug = slugify(row.name);
        if (!byId.has(slug)) {
          errors.push(`${domain}/${slug}: startup not found`);
          continue;
        }
        addStartup(slug, row, domain);
        addTranslations(slug, trans[slug], domain);
        processed += 1;
      }
    }

    if (fs.existsSync(originalFile)) {
      const originals = JSON.parse(fs.readFileSync(originalFile, 'utf8'));
      for (const [id, e] of Object.entries(originals)) {
        addStartup(id, e, 'original');
        addTranslations(id, e, 'original');
        processed += 1;
      }
    }

    if (errors.length) {
      console.log('ERRORS:');
      errors.forEach((e) => console.log(' -', e));
      throw new Error(`${errors.length} errors, aborting`);
    }

    await client.query('BEGIN');

    for (let i = 0; i < starRows.length; i += 400) {
      const chunk = starRows.slice(i, i + 400);
      const ph = chunk.map((_, j) => `($${j * 5 + 1}, $${j * 5 + 2}, $${j * 5 + 3}, $${j * 5 + 4}::double precision, $${j * 5 + 5}::double precision)`).join(',');
      const vals = chunk.flat();
      await client.query(
        `UPDATE startups AS s SET
           history = COALESCE(v.history, s.history),
           hq_city = COALESCE(v.hq_city, s.hq_city),
           latitude = COALESCE(v.latitude, s.latitude),
           longitude = COALESCE(v.longitude, s.longitude)
         FROM (VALUES ${ph}) AS v(id, history, hq_city, latitude, longitude)
         WHERE s.id = v.id`,
        vals
      );
    }

    for (let i = 0; i < transRows.length; i += 400) {
      const chunk = transRows.slice(i, i + 400);
      const ph = chunk.map((_, j) => `($${j * 4 + 1}, $${j * 4 + 2}, $${j * 4 + 3}, $${j * 4 + 4})`).join(',');
      const vals = chunk.flat();
      await client.query(
        `UPDATE startup_translations AS t SET
           history = COALESCE(v.history, t.history),
           hq_city = COALESCE(v.hq_city, t.hq_city),
           updated_at = now()
         FROM (VALUES ${ph}) AS v(startup_id, locale, history, hq_city)
         WHERE t.startup_id = v.startup_id AND t.locale = v.locale`,
        vals
      );
    }

    await client.query('COMMIT');

    const counts = await client.query(
      `SELECT
         (SELECT count(*)::int FROM startups WHERE history IS NOT NULL) AS with_history,
         (SELECT count(*)::int FROM startups WHERE hq_city IS NOT NULL) AS with_city,
         (SELECT count(*)::int FROM startups WHERE latitude IS NOT NULL AND longitude IS NOT NULL) AS with_coords,
         (SELECT count(*)::int FROM startup_translations WHERE history IS NOT NULL) AS trans_history
       `
    );
    console.log('processed', processed, 'startups');
    console.log('startup rows updated:', startupUpdates);
    console.log('translation rows updated:', transUpdates);
    counts.rows.forEach((r) =>
      console.log(
        `  startups with history: ${r.with_history}, city: ${r.with_city}, coords: ${r.with_coords}, translation history: ${r.trans_history}`
      )
    );
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});