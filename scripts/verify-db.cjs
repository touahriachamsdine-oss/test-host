// Post-seed integrity verification against the live database.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
function getDatabaseUrl() {
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  const line = env.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL='));
  return line.slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '');
}

(async () => {
  const { Client } = require('pg');
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();
  const q = async (sql) => (await client.query(sql)).rows;

  const total = await q('SELECT count(*)::int AS c FROM startups');
  console.log(`TOTAL startups: ${total[0].c} ${total[0].c >= 5000 ? 'OK (>=5000)' : 'BELOW TARGET'}`);

  const domains = await q("SELECT domain, count(*)::int AS c FROM startups GROUP BY domain ORDER BY domain");
  console.log(`\ndomains in use: ${domains.length}`);
  domains.forEach((d) => console.log(`  ${String(d.c).padStart(5)}  ${d.domain}`));

  const meta = await q('SELECT slug FROM domain_meta ORDER BY slug');
  const used = new Set(domains.map((d) => d.domain));
  console.log(`\ndomain_meta rows: ${meta.length}`);
  const missingMeta = [...used].filter((d) => !meta.some((m) => m.slug === d));
  console.log(`domains used but absent from domain_meta: ${missingMeta.length ? missingMeta.join(', ') : 'none'}`);
  const orphanMeta = meta.filter((m) => !used.has(m.slug)).map((m) => m.slug);
  console.log(`domain_meta rows with no startups: ${orphanMeta.length ? orphanMeta.join(', ') : 'none'}`);

  const teams = await q('SELECT code, domain_slug, quota FROM teams ORDER BY code');
  console.log(`\nteams: ${teams.length}`);
  teams.forEach((t) => console.log(`  ${t.code} -> ${t.domain_slug} (quota ${t.quota})`));

  console.log('\n--- Israel exclusion ---');
  const il = await q("SELECT id, name, country FROM startups WHERE country ILIKE '%israel%' OR country ILIKE '%tel aviv%' OR country ILIKE '%haifa%' OR country ILIKE '%jerusalem%' OR country ILIKE '%rehovot%' OR country ILIKE '%ramat gan%' OR country ILIKE '%givatayim%'");
  console.log(`rows matching Israel markers: ${il.length}${il.length ? ' ' + JSON.stringify(il.slice(0, 10)) : ' OK'}`);

  console.log('\n--- uniqueness ---');
  const dupNames = await q('SELECT lower(trim(name)) AS n, count(*)::int AS c FROM startups GROUP BY 1 HAVING count(*) > 1 ORDER BY c DESC');
  console.log(`duplicate names: ${dupNames.length}`);
  dupNames.slice(0, 10).forEach((d) => console.log(`  ${d.c}x ${d.n}`));
  const dupIds = await q('SELECT id, count(*)::int AS c FROM startups GROUP BY 1 HAVING count(*) > 1');
  console.log(`duplicate ids: ${dupIds.length}`);

  console.log('\n--- translations ---');
  const tr = await q('SELECT locale, count(*)::int AS c FROM startup_translations GROUP BY locale ORDER BY locale');
  tr.forEach((t) => console.log(`  ${t.locale}: ${t.c}`));
  const verified = (await q("SELECT count(*)::int AS c FROM startups WHERE status='verified'"))[0].c;
  for (const t of tr) {
    console.log(`  ${t.locale} covers all verified (${verified}): ${t.c >= verified ? 'OK' : 'MISSING ' + (verified - t.c)}`);
  }
  const noTr = await q(`SELECT s.id, s.name FROM startups s LEFT JOIN startup_translations t ON t.startup_id = s.id AND t.locale = 'ar' WHERE t.startup_id IS NULL`);
  console.log(`  startups missing an ar translation: ${noTr.length}`);
  noTr.slice(0, 10).forEach((r) => console.log(`    ${r.id} ${r.name}`));

  console.log('\n--- required content fields ---');
  for (const col of ['country', 'sub_domain', 'short_description', 'technology', 'why_relevant', 'source_url']) {
    const r = await q(`SELECT count(*)::int AS c FROM startups WHERE ${col} IS NULL OR btrim(${col}::text) = ''`);
    console.log(`  empty ${col}: ${r[0].c}`);
  }

  console.log('\n--- country quality ---');
  const unk = await q("SELECT count(*)::int AS c FROM startups WHERE country = 'Unknown' OR country IS NULL");
  console.log(`  country 'Unknown': ${unk[0].c} / ${total[0].c} (${((unk[0].c / total[0].c) * 100).toFixed(1)}%)`);
  const longest = await q('SELECT name, country FROM startups ORDER BY length(country) DESC LIMIT 12');
  console.log('  longest country values (guard against scraped junk):');
  longest.forEach((r) => console.log(`    ${String(r.country).length}  ${r.name} => "${r.country}"`));

  console.log('\n--- new domain spot check ---');
  const law = await q("SELECT name, country, status, source_tier FROM startups WHERE domain='law-social-impact' ORDER BY name LIMIT 8");
  law.forEach((r) => console.log(`  ${r.name} | ${r.country} | ${r.status} | ${r.source_tier}`));
  const lawTotal = await q("SELECT count(*)::int AS c FROM startups WHERE domain='law-social-impact'");
  console.log(`  law-social-impact total: ${lawTotal[0].c}`);

  await client.end();
})().catch((e) => { console.error('VERIFY FAILED:', e.message); process.exit(1); });