const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..');

const DOMAIN = {
  slug: 'law-social-impact',
  label_en: 'Law, LegalTech & Social Impact',
  label_ar: 'القانون والتقنية القانونية والأثر الاجتماعي'
};
const TEAM = { code: 'T16', name: 'Law, LegalTech & Social Impact', domain_slug: DOMAIN.slug, quota: 500 };

function dbUrl() {
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  return env
    .split(/\r?\n/)
    .find((l) => l.startsWith('DATABASE_URL='))
    .slice('DATABASE_URL='.length)
    .trim()
    .replace(/^"|"$/g, '');
}

(async () => {
  const c = new Client({ connectionString: dbUrl() });
  await c.connect();

  await c.query(
    `INSERT INTO domain_meta (slug, label_en, label_ar, validation_status, priority_tier)
     VALUES ($1, $2, $3, 'VALIDATED', 'A')
     ON CONFLICT (slug) DO UPDATE SET
       label_en = EXCLUDED.label_en, label_ar = EXCLUDED.label_ar,
       validation_status = EXCLUDED.validation_status, priority_tier = EXCLUDED.priority_tier,
       updated_at = now()`,
    [DOMAIN.slug, DOMAIN.label_en, DOMAIN.label_ar]
  );
  console.log('domain_meta upserted:', DOMAIN.slug);

  await c.query(
    `INSERT INTO teams (code, name, domain_slug, quota)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (code) DO UPDATE SET
       name = EXCLUDED.name, domain_slug = EXCLUDED.domain_slug, quota = EXCLUDED.quota,
       updated_at = now()`,
    [TEAM.code, TEAM.name, TEAM.domain_slug, TEAM.quota]
  );
  console.log('team upserted:', TEAM.code);

  const d = await c.query('SELECT slug, label_en, validation_status, priority_tier FROM domain_meta ORDER BY slug');
  console.log(`\ndomain_meta now ${d.rowCount} rows:`);
  d.rows.forEach((r) => console.log(`  ${r.slug.padEnd(22)} ${r.validation_status}/${r.priority_tier}  ${r.label_en}`));

  const t = await c.query('SELECT code, domain_slug, quota FROM teams ORDER BY code');
  console.log(`\nteams now ${t.rowCount} rows`);

  await c.end();
  process.exit(0);
})().catch((e) => {
  console.error('FATAL', e.message);
  process.exit(1);
});
