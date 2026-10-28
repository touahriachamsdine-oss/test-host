// Second-pass country resolution for rows still at "Unknown".
//
// Wikidata P17 (country) is absent for many companies, but P159 (headquarters
// location) usually points at a city, and P131 links that city to its country.
// This walks HQ -> administrative entity -> country for the remaining rows.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'data', 'global', '_sources');
const CACHE = path.join(SRC, '_country-cache.json');
const QMAP = path.join(SRC, '_wikidata-country-map.json');
const { isTrustedCountry } = require('./lib/countries');

const UA = { 'User-Agent': 'startup-ideas-dz/0.2 (research script)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WD = 'https://www.wikidata.org/w/api.php';

function dbUrl() {
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  return env.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL=')).slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '');
}

async function getJson(url, tries = 6) {
  for (let a = 1; a <= tries; a++) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 30000);
    try {
      const r = await fetch(url, { headers: UA, signal: ctl.signal });
      clearTimeout(t);
      if (r.status === 429) { await sleep(20000 * a); continue; }
      if (!r.ok) return null;
      return await r.json();
    } catch (e) {
      clearTimeout(t);
      if (a === tries) return null;
      await sleep(4000 * a);
    }
  }
  return null;
}

const chunk = (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };

async function claims(qids) {
  const out = new Map();
  for (const batch of chunk(qids, 45)) {
    const j = await getJson(`${WD}?action=wbgetentities&format=json&ids=${batch.join('|')}&props=claims`);
    if (!j) continue;
    for (const [qid, ent] of Object.entries(j.entities || {})) {
      const c = ent.claims || {};
      const pick = (p) => {
        const v = c[p]?.[0]?.mainsnak?.datavalue?.value;
        return v && typeof v === 'object' && v.id ? v.id : null;
      };
      out.set(qid, { p17: pick('P17'), p495: pick('P495'), p159: pick('P159'), p131: pick('P131') });
    }
    await sleep(200);
  }
  return out;
}

async function labels(qids) {
  const out = new Map();
  for (const batch of chunk([...new Set(qids)].filter(Boolean), 45)) {
    const j = await getJson(`${WD}?action=wbgetentities&format=json&ids=${batch.join('|')}&props=labels&languages=en`);
    if (!j) continue;
    for (const [qid, ent] of Object.entries(j.entities || {})) {
      out.set(qid, ent.labels?.en?.value || null);
    }
    await sleep(200);
  }
  return out;
}

(async () => {
  const cache = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  const qmap = fs.existsSync(QMAP) ? JSON.parse(fs.readFileSync(QMAP, 'utf8')) : {};

  const { Client } = require('pg');
  const client = new Client({ connectionString: dbUrl() });
  await client.connect();
  const { rows: unknowns } = await client.query("SELECT id, name FROM startups WHERE country = 'Unknown' OR country IS NULL");
  console.log(`rows still Unknown: ${unknowns.length}`);

  const byName = new Map();
  for (const r of unknowns) {
    const entry = cache[r.name];
    if (entry && entry.qid) byName.set(r.id, { name: r.name, qid: entry.qid });
  }
  console.log(`  with a Wikidata id: ${byName.size}`);

  const c = await claims([...byName.values()].map((v) => v.qid));

  // BFS over HQ cities and their P131 parents so the whole containment tree is
  // resolved in one pass rather than depth by depth.
  const hqClaims = new Map();
  let frontier = [...c.values()].map((v) => v.p159).filter(Boolean);
  const seen = new Set();
  for (let depth = 0; depth < 4 && frontier.length; depth++) {
    const next = [];
    for (const qid of frontier) {
      if (seen.has(qid)) continue;
      seen.add(qid);
      next.push(qid);
    }
    if (!next.length) break;
    const level = await claims(next);
    for (const [qid, ent] of level) {
      hqClaims.set(qid, ent);
      if (ent.p131) frontier.push(ent.p131);
    }
    console.log(`    depth ${depth}: resolved ${next.length} admin entities (total ${hqClaims.size})`);
  }

  const needLabels = new Set();
  for (const ent of c.values()) { if (ent.p17) needLabels.add(ent.p17); if (ent.p495) needLabels.add(ent.p495); }
  for (const ent of hqClaims.values()) { if (ent.p17) needLabels.add(ent.p17); if (ent.p495) needLabels.add(ent.p495); }
  const lbl = await labels([...needLabels]);

  let hits = 0;
  const failed = [];
  for (const [id, info] of byName) {
    const ent = c.get(info.qid);
    let country = null;
    if (ent) {
      const direct = ent.p17 && lbl.get(ent.p17);
      const origin = ent.p495 && lbl.get(ent.p495);
      country = direct || origin || null;
      if (!country && ent.p159) {
        // HQ is usually a city, whose own P17 is absent. Walk P131
        // (located in the administrative territorial entity) until a country
        // turns up, e.g. Dublin -> County Dublin -> Ireland.
        let cur = ent.p159;
        const seen = new Set();
        for (let depth = 0; depth < 4 && cur && !seen.has(cur); depth++) {
          seen.add(cur);
          const node = hqClaims.get(cur);
          if (!node) break;
          const viaP17 = node.p17 && lbl.get(node.p17);
          if (viaP17) { country = viaP17; break; }
          cur = node.p131;
        }
      }
    }
    if (country && isTrustedCountry(country)) {
      await client.query('UPDATE startups SET country=$2, updated_at=now() WHERE id=$1', [id, country]);
      const e = cache[info.name];
      if (e) { e.country = country; e.qsource = 'wikidata-hq'; }
      hits++;
    } else {
      failed.push(info.name);
    }
  }

  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));
  for (const [qid, name] of Object.entries(lbl)) if (name) qmap[qid] = name;
  fs.writeFileSync(QMAP, JSON.stringify(qmap, null, 1));

  console.log(`\nresolved via HQ chain: ${hits}`);
  console.log(`still unresolved: ${failed.length}`);
  const t = await client.query("SELECT count(*)::int AS c FROM startups WHERE country='Unknown'");
  const total = await client.query('SELECT count(*)::int AS c FROM startups');
  console.log(`\ncountry 'Unknown' now: ${t.rows[0].c} / ${total.rows[0].c} (${((t.rows[0].c / total.rows[0].c) * 100).toFixed(1)}%)`);
  await client.end();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });