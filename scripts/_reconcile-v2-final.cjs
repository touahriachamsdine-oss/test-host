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

(async () => {
  const c = new Client({ connectionString: dbUrl() });
  await c.connect();
  const neon = await c.query(
    "SELECT domain, count(*) FILTER (WHERE status = 'verified')::int AS v " +
    "FROM startups GROUP BY domain ORDER BY domain"
  );
  const neonBy = {};
  let neonTotal = 0;
  for (const r of neon.rows) {
    neonBy[r.domain] = r.v;
    neonTotal += r.v;
  }

  let committedTotal = 0;
  let mismatches = 0;
  console.log('slug | committed | neon | delta');
  for (const s of SLUGS) {
    const arr = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'global', 'v2', s + '.json'), 'utf8'));
    const cn = arr.length;
    const nn = neonBy[s] || 0;
    const d = nn - cn;
    committedTotal += cn;
    if (d !== 0) mismatches++;
    console.log('  ' + s + ': committed=' + cn + ' neon=' + nn + ' delta=' + d);
  }

  const extras = [];
  const committedSet = new Set(SLUGS);
  for (const r of neon.rows) {
    if (!committedSet.has(r.domain)) extras.push(r.domain + '=' + r.v);
  }
  console.log('---');
  console.log('committedTotal =', committedTotal);
  console.log('neonTotal =', neonTotal);
  console.log('per-slug mismatches =', mismatches);
  console.log('Neon domains outside committed set =', extras.length === 0 ? 'none' : extras.join(', '));
  const verdict =
    committedTotal === neonTotal && mismatches === 0 && extras.length === 0
      ? 'IN-SYNC: committed files == Neon verified. No honest diff exists.'
      : 'ROWS-CHANGED: Neon differs from committed. Honest regen exists, diff = ' + (neonTotal - committedTotal);
  console.log('VERDICT: ' + verdict);

  await c.end();
  process.exit(0);
})().catch((e) => {
  console.error('FATAL', e.message);
  process.exit(1);
});
