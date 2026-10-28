const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..');
const V2 = path.join(ROOT, 'data', 'global', 'v2');

const SLUGS = [
  'agritech-foodtech', 'ai-computing', 'biotech-healthtech', 'cleantech', 'cloud-iot',
  'cybersecurity', 'drones-autonomy', 'energy-storage', 'manufacturing-3d', 'medtech',
  'nanotech-materials', 'other-deep-tech', 'robotics', 'semiconductors', 'space-aerospace',
  'law-social-impact'
];

const TOP = [
  'name', 'country', 'sub_domain', 'short_description', 'technology', 'year_founded',
  'official_site', 'source_url', 'why_relevant', 'priority', 'concept', 'main_sellers',
  'team_rec', 'build_approach', 'product_issues', 'algeria_value', 'difficulty_score',
  'difficulty_breakdown', 'source_tier', 'source_note'
];

const TR = [
  'short_description', 'technology', 'why_relevant', 'concept', 'main_sellers', 'team_rec',
  'build_approach', 'product_issues', 'algeria_value'
];

const ARR = new Set(['main_sellers', 'team_rec', 'product_issues', 'difficulty_breakdown']);

function dbUrl() {
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  const l = env.split(/\r?\n/).find((x) => x.startsWith('DATABASE_URL='));
  return l.slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '');
}

function pick(v) {
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch (_) { return v; }
}

(async () => {
  const c = new Client({ connectionString: dbUrl() });
  await c.connect();
  console.log('connected');

  const rows = (await c.query("SELECT * FROM startups WHERE status = 'verified'")).rows;
  const docs = (await c.query('SELECT * FROM startup_translations')).rows;
  const docBy = new Map();
  for (const d of docs) {
    const k = String(d.startup_id) + '|' + d.locale;
    docBy.set(k, d);
  }

  const bySlug = {};
  let israel = 0;
  let total = 0;
  const warn = new Set();
  for (const r of rows) {
    if (/israel/i.test(String(r.country || ''))) { israel++; continue; }
    let slug = String(r.domain || '').trim();
    if (!SLUGS.includes(slug)) { warn.add(slug || '(null)'); slug = 'other-deep-tech'; }
    if (!bySlug[slug]) bySlug[slug] = [];
    const o = {};
    for (const k of TOP) {
      let v = r[k] !== undefined && r[k] !== null ? r[k] : null;
      if (ARR.has(k) && typeof v === 'string') v = pick(v);
      o[k] = v;
    }
    const trans = {};
    for (const loc of ['ar', 'fr']) {
      const d = docBy.get(String(r.id) + '|' + loc) || {};
      const t = {};
      for (const k of TR) {
        let v = d[k] != null ? d[k] : (r[k] != null ? r[k] : null);
        if (ARR.has(k) && typeof v === 'string') v = pick(v);
        t[k] = v;
      }
      trans[loc] = t;
    }
    o.translations = trans;
    bySlug[slug].push(o);
    total++;
  }

  fs.mkdirSync(V2, { recursive: true });
  let fileTotal = 0;
  for (const s of SLUGS) {
    const arr = bySlug[s] || [];
    fs.writeFileSync(path.join(V2, s + '.json'), JSON.stringify(arr, null, 1));
    fileTotal += arr.length;
  }

  console.log('NEON verified:', rows.length, '| exported:', total, '| Israel:', israel);
  console.log('Slugs in Neon outside committed set:', warn.size ? Array.from(warn).join(', ') : 'none');
  console.log('WRITTEN TOTAL:', fileTotal, '| expected 4201');
  await c.end();
  process.exit(0);
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
