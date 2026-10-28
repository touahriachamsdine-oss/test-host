const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..');
const SLUGS = [
  'agritech-foodtech', 'ai-computing', 'biotech-healthtech', 'cleantech', 'cloud-iot',
  'cybersecurity', 'drones-autonomy', 'energy-storage', 'manufacturing-3d', 'medtech',
  'nanotech-materials', 'other-deep-tech', 'robotics', 'semiconductors', 'space-aerospace'
];

function dbUrl() {
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  const line = env.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL='));
  return line.slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '');
}

function slugFile(slug) {
  return path.join(ROOT, 'data', 'global', 'v2', slug + '.json');
}

(async () => {
  const c = new Client({ connectionString: dbUrl() });
  await c.connect();

  const neon = await c.query(
    "SELECT domain, count(*) FILTER (WHERE status = 'verified')::int AS v, count(*)::int AS alln " +
    "FROM startups GROUP BY domain ORDER BY domain"
  );
  const neonMap = {};
  let neonVerified = 0;
  for (const r of neon.rows) {
    neonMap[r.domain] = { verified: r.v, all: r.alln };
    neonVerified += r.v;
  }

  console.log('NEON verified total:', neonVerified);
  console.log('--- per committed slug: committed-file vs neon ---');
  let committedTotal = 0;
  let delta = 0;
  const errs = [];
  for (const s of SLUGS) {
    const fp = slugFile(s);
    if (!fs.existsSync(fp)) { errs.push(s + ': FILE MISSING'); continue; }
    const rows = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const cn = rows.length;
    committedTotal += cn;
    const nn = neonMap[s] ? neonMap[s].verified : 0;
    const d = nn - cn;
    if (d !== 0) delta += d;
    console.log(
      '  ' + s.padEnd(20) +
      ' committed=' + String(cn).padStart(4) +
      ' neon=' + String(nn).padStart(4) +
      (d === 0 ? '' : (d > 0 ? '  <<< NEON AHEAD +' + d : '  <<< committed ahead ' + d))
    );
  }
  const outside = neon.rows.filter((r) => !SLUGS.includes(r.domain));
  console.log('---');
  console.log('COMMITTED total:', committedTotal);
  console.log('DELTA (neon - committed):', delta);
  console.log('Neon domains NOT among committed slugs:', JSON.stringify(outside.map((r) => r.domain + '=' + r.verified)));
  for (const e of errs) console.log('ERR:', e);
  await c.end();
  if (delta !== 0) process.exitCode = 2;
  else if (outside.length) process.exitCode = 3;
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
