const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..');
const V1_DIR = path.join(ROOT, 'data', 'global');
const V2_DIR = path.join(ROOT, 'data', 'global', 'v2');

const DOMAINS = [
  'ai-computing', 'robotics', 'biotech-healthtech', 'drones-autonomy', 'nanotech-materials',
  'energy-storage', 'space-aerospace', 'agritech-foodtech', 'medtech', 'semiconductors',
  'cybersecurity', 'manufacturing-3d', 'cleantech', 'cloud-iot', 'law-social-impact',
  'other-deep-tech'
];

function getDatabaseUrl() {
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  const line = env.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL='));
  if (!line) throw new Error('DATABASE_URL not found in .env.local');
  return line.slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '');
}

function slugify(name) {
  const base = String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length ? base : 'imported';
}

async function withRetry(fn, attempts = 4, label = '') {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === attempts) throw e;
      console.log(`retry ${label || ''} (${i}/${attempts}): ${e.message}`);
      await new Promise((r) => setTimeout(r, 1200 * i));
    }
  }
}

const COLS = [
  'id', 'name', 'country', 'domain', 'sub_domain', 'short_description', 'technology',
  'year_founded', 'official_site', 'source_url', 'why_relevant', 'priority',
  'status', 'is_duplicate_2025', 'submitted_by_team', 'submitted_by_team_code',
  'concept', 'main_sellers', 'team_rec', 'build_approach', 'product_issues',
  'algeria_value', 'difficulty_score', 'difficulty_breakdown', 'source_tier', 'source_note'
];

function isIsraeliCountry(c) {
  return /israel/i.test(String(c || ''));
}

async function main() {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await withRetry(() => client.connect(), 5, 'connect');
  console.log('connected');

  await withRetry(async () => {
    await client.query(`
      ALTER TABLE startups
        ADD COLUMN IF NOT EXISTS concept text,
        ADD COLUMN IF NOT EXISTS main_sellers jsonb,
        ADD COLUMN IF NOT EXISTS team_rec jsonb,
        ADD COLUMN IF NOT EXISTS build_approach text,
        ADD COLUMN IF NOT EXISTS product_issues jsonb,
        ADD COLUMN IF NOT EXISTS algeria_value text,
        ADD COLUMN IF NOT EXISTS difficulty_score smallint,
        ADD COLUMN IF NOT EXISTS difficulty_breakdown jsonb,
        ADD COLUMN IF NOT EXISTS source_tier text,
        ADD COLUMN IF NOT EXISTS source_note text;
      ALTER TABLE startup_translations
        ADD COLUMN IF NOT EXISTS concept text,
        ADD COLUMN IF NOT EXISTS main_sellers jsonb,
        ADD COLUMN IF NOT EXISTS team_rec jsonb,
        ADD COLUMN IF NOT EXISTS build_approach text,
        ADD COLUMN IF NOT EXISTS product_issues jsonb,
        ADD COLUMN IF NOT EXISTS algeria_value text;
    `);
  }, 5, 'migration');
  console.log('migration ok');

  const known = await withRetry(async () => {
    const { rows } = await client.query('SELECT id, name, country FROM startups');
    return rows;
  });
  const knownNames = new Map(known.map((r) => [r.name.toLowerCase().trim(), r.country]));
  const usedIds = new Set(known.map((r) => r.id));

  let israelInFiles = 0;
  let skippedV1 = 0;
  const toInsert = [];
  const errors = [];

  for (const domain of DOMAINS) {
    const v1 = path.join(V1_DIR, `${domain}.json`);
    if (fs.existsSync(v1)) {
      for (const row of JSON.parse(fs.readFileSync(v1, 'utf8'))) {
        const name = String(row.name || '').trim();
        if (!name) continue;
        if (isIsraeliCountry(row.country)) { israelInFiles++; continue; }
        if (knownNames.has(name.toLowerCase())) { skippedV1++; continue; }
        errors.push(`${domain}/${name}: v1 row missing from DB (seed v1 first)`);
      }
    } else {
      console.log(`MISSING v1 file: ${domain}.json`);
    }
    const v2 = path.join(V2_DIR, `${domain}.json`);
    if (!fs.existsSync(v2)) {
      errors.push(`${domain}: no v2 file`);
      continue;
    }
    for (const row of JSON.parse(fs.readFileSync(v2, 'utf8'))) {
      const name = String(row.name || '').trim();
      if (!name) continue;
      if (isIsraeliCountry(row.country)) { israelInFiles++; continue; }
      const required = ['name', 'country', 'sub_domain', 'short_description', 'technology', 'why_relevant', 'priority'];
      for (const key of required) {
        if (row[key] === undefined || String(row[key]).trim() === '') {
          errors.push(`${domain}/${name}: missing ${key}`);
        }
      }
      const dupName = knownNames.get(name.toLowerCase());
      if (dupName) continue;
      knownNames.set(name.toLowerCase(), row.country);
      toInsert.push({ domain, row });
    }
  }

  const byName = new Map();
  for (const it of toInsert) {
    const key = it.row.name.toLowerCase().trim();
    if (byName.has(key)) {
      errors.push(`DUPLICATE ${it.row.name}`);
    } else {
      byName.set(key, it);
    }
  }

  if (errors.length) {
    errors.slice(0, 40).forEach((e) => console.log(' -', e));
    throw new Error(`${errors.length} validation errors`);
  }

  console.log('to insert (v2, already-known skipped):', toInsert.length, '| v1 rows skipped (already in DB):', skippedV1, '| Israel filtered in files:', israelInFiles);

  const BATCH = 200;
  const trCols = ['startup_id', 'locale', 'name', 'country', 'sub_domain', 'short_description', 'technology', 'why_relevant', 'concept', 'main_sellers', 'team_rec', 'build_approach', 'product_issues', 'algeria_value'];
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const chunk = toInsert.slice(i, i + BATCH);
    await withRetry(async () => {
      await client.query('BEGIN');
      try {
        const tuples = [];
        const params = [];
        const trTuples = [];
        const trParams = [];
        const insertedIds = [];
        for (const { domain, row } of chunk) {
          let id = slugify(row.name);
          let suffix = 2;
          while (usedIds.has(id)) {
            id = `${slugify(row.name)}-${suffix}`;
            suffix += 1;
          }
          usedIds.add(id);
          const values = [
            id, row.name, row.country, domain, row.sub_domain, row.short_description,
            row.technology, row.year_founded && /^\d{4}$/.test(String(row.year_founded)) ? Number(row.year_founded) : null,
            row.official_site || null, row.source_url || null, row.why_relevant, row.priority,
            'verified', false, null, null,
            row.concept ?? null,
            row.main_sellers ? JSON.stringify(row.main_sellers) : null,
            row.team_rec ? JSON.stringify(row.team_rec) : null,
            row.build_approach ?? null,
            row.product_issues ? JSON.stringify(row.product_issues) : null,
            row.algeria_value ?? null,
            row.difficulty_score ?? null,
            row.difficulty_breakdown ? JSON.stringify(row.difficulty_breakdown) : null,
            row.source_tier ?? null,
            row.source_note ?? null
          ];
          tuples.push(`(${values.map((_, j) => `$${params.length + 1 + j}`).join(',')})`);
          params.push(...values);
          insertedIds.push(id);
          for (const locale of ['ar', 'fr']) {
            const t = row.translations[locale] || {};
            const tvals = [
              id, locale, row.name, row.country, row.sub_domain,
              t.short_description ?? row.short_description, t.technology ?? row.technology,
              t.why_relevant ?? row.why_relevant,
              t.concept ?? row.concept,
              t.main_sellers ? JSON.stringify(t.main_sellers) : JSON.stringify(row.main_sellers),
              t.team_rec ? JSON.stringify(t.team_rec) : JSON.stringify(row.team_rec),
              t.build_approach ?? row.build_approach,
              t.product_issues ? JSON.stringify(t.product_issues) : JSON.stringify(row.product_issues),
              t.algeria_value ?? row.algeria_value
            ];
            trTuples.push(`(${tvals.map((_, j) => `$${trParams.length + 1 + j}`).join(',')})`);
            trParams.push(...tvals);
          }
        }
        await client.query(`INSERT INTO startups (${COLS.join(',')}) VALUES ${tuples.join(',')}`, params);
        await client.query(
          `INSERT INTO startup_translations (${trCols.join(',')}) VALUES ${trTuples.join(',')}
           ON CONFLICT (startup_id, locale) DO UPDATE SET
             name = EXCLUDED.name, country = EXCLUDED.country, sub_domain = EXCLUDED.sub_domain,
             short_description = EXCLUDED.short_description, technology = EXCLUDED.technology,
             why_relevant = EXCLUDED.why_relevant, concept = EXCLUDED.concept,
             main_sellers = EXCLUDED.main_sellers, team_rec = EXCLUDED.team_rec,
             build_approach = EXCLUDED.build_approach, product_issues = EXCLUDED.product_issues,
             algeria_value = EXCLUDED.algeria_value, updated_at = now()`,
          trParams
        );
        await client.query('COMMIT');
        inserted += chunk.length;
        console.log(`inserted ${inserted}/${toInsert.length}`);
      } catch (e) {
        try { await client.query('ROLLBACK'); } catch (_) {}
        throw e;
      }
    }, 4, `seed-chunk`);
  }
  console.log('seed insert ok');

  const purge = await withRetry(async () => {
    const { rows } = await client.query("SELECT id FROM startups WHERE country ILIKE '%israel%'");
    if (rows.length) {
      await client.query(
        'DELETE FROM startup_translations WHERE startup_id = ANY($1::text[])',
        [rows.map((r) => r.id)]
      );
      await client.query('DELETE FROM startups WHERE country ILIKE %israel%'.replace('%israel%', "'%israel%'"));
    }
    return rows.length;
  }, 4, 'israel-purge');
  console.log('Israel rows purged from DB:', purge);

  const stats = await withRetry(async () => {
    const t = await client.query('SELECT count(*)::int AS total FROM startups');
    const v = await client.query("SELECT count(*)::int AS total FROM startups WHERE status='verified'");
    const per = await client.query("SELECT domain, count(*)::int FROM startups WHERE status='verified' GROUP BY domain ORDER BY domain");
    return { total: t.rows[0].total, verified: v.rows[0].total, per: per.rows };
  });
  console.log('TOTAL startups:', stats.total, '| verified:', stats.verified);
  stats.per.forEach((r) => console.log(`  ${r.domain}: ${r.count}`));

  const trCount = await client.query('SELECT locale, count(*)::int FROM startup_translations GROUP BY locale ORDER BY locale');
  trCount.rows.forEach((r) => console.log(`  translations ${r.locale}: ${r.count}`));

  await client.end();
}

main().catch((err) => {
  console.error('SEED-V2 FAILED:', err.message);
  process.exit(1);
});