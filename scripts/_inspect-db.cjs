const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
function dbUrl() {
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  return env.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL=')).slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '');
}
(async () => {
  const { Client } = require('pg');
  const c = new Client({ connectionString: dbUrl() });
  await c.connect();
  for (const t of ['domain_meta', 'teams']) {
    const cols = await c.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`, [t]);
    console.log(`${t}: ${cols.rows.map((r) => `${r.column_name}:${r.data_type}`).join(', ')}`);
  }
  const dm = await c.query('SELECT * FROM domain_meta LIMIT 2');
  console.log('\ndomain_meta sample:', JSON.stringify(dm.rows, null, 1));
  const tm = await c.query('SELECT * FROM teams LIMIT 2');
  console.log('\nteams sample:', JSON.stringify(tm.rows, null, 1));

  const bad = await c.query("SELECT id, name, country FROM startups WHERE length(country) > 30 ORDER BY length(country) DESC");
  console.log(`\nDB rows with country longer than 30 chars (malformed): ${bad.rowCount}`);
  bad.rows.slice(0, 30).forEach((r) => console.log(`  ${r.id} | ${r.name} => "${r.country}"`));

  const nu = await c.query("SELECT id, name, status FROM startups WHERE source_url IS NULL OR btrim(source_url)=''");
  console.log(`\nrows with empty source_url: ${nu.rowCount}`);
  nu.rows.forEach((r) => console.log(`  ${r.id} | ${r.name} | ${r.status}`));

  const nt = await c.query(`SELECT s.id, s.name, s.status FROM startups s LEFT JOIN startup_translations t ON t.startup_id=s.id AND t.locale='ar' WHERE t.startup_id IS NULL`);
  console.log(`\nrows missing ar translation: ${nt.rowCount}`);
  nt.rows.forEach((r) => console.log(`  ${r.id} | ${r.name} | ${r.status}`));
  await c.end();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });