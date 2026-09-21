const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

function getDatabaseUrl() {
  const line = envContent.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL='));
  if (!line) throw new Error('DATABASE_URL not found in .env.local');
  const url = line.slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '');
  return url;
}

async function main() {
  const dataPath = path.join(__dirname, 'translations-seed-data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const entries = Object.entries(data);

  const pool = new Pool({ connectionString: getDatabaseUrl() });
  try {
    const { rows: existing } = await pool.query(
      'SELECT id FROM startups WHERE id = ANY($1::text[])',
      [entries.map(([id]) => id)]
    );
    const known = new Set(existing.map((r) => r.id));

    await pool.query('BEGIN');
    let inserted = 0;
    let missing = 0;
    for (const [id, locales] of entries) {
      if (!known.has(id)) {
        console.log(`SKIP ${id} (startup not found)`);
        missing += 1;
        continue;
      }
      for (const locale of ['fr', 'ar']) {
        const tr = locales[locale];
        if (!tr) {
          console.log(`SKIP ${id}/${locale} (no data)`);
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
        inserted += 1;
      }
    }
    await pool.query('COMMIT');
    console.log(`upserted ${inserted} rows for ${entries.length} startups (${missing} missing ids)`);
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});