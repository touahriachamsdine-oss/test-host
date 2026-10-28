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
  const a = await c.query(
    "SELECT count(*) FILTER (WHERE status='verified')::int AS v, " +
    "count(*) FILTER (WHERE status='verified' AND NOT (domain = ANY($1::text[])))::int AS outside " +
    "FROM startups",
    [SLUGS]
  );
  console.log('NEON VERIFIED:', a.rows[0].v);
  console.log('  of which outside the 15 committed slugs:', a.rows[0].outsideNan);
  await c.end();
  process.exit(0);
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
