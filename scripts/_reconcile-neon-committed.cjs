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
  const raw = line.slice('DATABASE_URL='.length).trim();
  return raw.replace(/^"|"$/g, '');
}

(async () => {
  const c = new Client({ connectionString: dbUrl() });
  await c.connect();
  const { rows } = await c.query(
    "SELECT domain, count(*)::int AS n FROM startups WHERE status = 'verified' GROUP BY domain"
  );
  const neon = {};
  let neonTotal = 0;
  for (const r of rows) { neon[r.domain] = r.n; neonTotal += r.n; }

  let committedTotal = 0;
  let gaps = 0;
  console.log('PER-SLUG: committed-v2-file  vs  neon-verified');
  for (const s of SLUGS) {
    const fp = path.join(ROOT, 'data', 'global', 'v2', s + '.json');
    const fileRows = fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, 'utf8')) : [];
    const cn = fileRows.length;
    const nn = neon[s] || 0;
    const d = nn - cn;
    committedTotal += cn;
    if (d !== 0) {
      gaps += d;
      console.log('  ' + s + ': committed=' + cn + ' neon=' + nn + '  GAP=' + d);
    } else {
      console.log('  ' + s + ': committed=' + cn + ' neon=' + nn + '  (in sync)');
    }
  }
  console.log('---');
  console.log('COMMITTED TOTAL:', committedTotal);
  console.log('NEON VERIFIED TOTAL:', neonTotal);
  console.log('NET GAP (neon - committed):', gaps);
  console.log(gaps === 0 ? 'VERDICT: committed == Neon. No corpus diff exists.' : 'VERDICT: committed is STALE by ' + gaps + ' rows. Real diff EXISTS.');
  await c.end();
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
