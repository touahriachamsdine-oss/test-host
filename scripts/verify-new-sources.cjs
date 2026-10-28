// Enforces the project's content-integrity rule on newly fetched source lists:
// a candidate is kept only if its Wikipedia article actually denotes a
// real organization. Rejects disambiguation pages, redirects, and topics.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'data', 'global', '_sources');
const UA = { 'User-Agent': 'startup-ideas-dz/0.2 (research script)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TARGETS = ['lawfirms', 'socialent', 'food', 'railways', 'telecom', 'mining', 'vc'];

// Categories that indicate the subject is a business, institution or operator.
const ORG_CAT = /(compan(y|ies)|corporation|corporate|business(es)?|firms?|industry|industries|manufactur(er|ers|ing)|manufacturer|conglomerate|enterprise(s)?|start-?ups?|unicorn|holding(s)?|group(s)?|bank(s|ing)?|brand(s)?|retail(er|ers)?|chain(s)?|operator(s)?|airline(s)?|railway compan|railroad compan|transport compan|operator|mining compan|holding compan|venture capital|private equity|software compan|technology compan|telecommunications compan|food compan|beverage compan|pharmaceutical compan|chemical compan|energy compan|shipping compan|logistics compan|insurance compan|asset management|social enterprise|non-?profit|charit|foundation|association|organization|organisation|institute|laborator(y|ies)|university|think tank|cooperativ|collective|advocacy|labor union|trade union|political party|agencies? compan)/i;

// Short descriptions that explicitly name an organizational entity.
const ORG_DESC =
  /(company|corporation|firm|firm(s)?|group|holding|bank|brand|university|institute|organization|organisation|association|foundation|charity|venture capital|private equity|operator|manufacturer|producer|retailer|chain|agency|cooperative|collective|enterprise|start-?up|platform|provider|carrier|airline|railway|tramway|metro|shipping line|trust|fund|union|society|tank|think tank|non-?profit|service|software|technology)/i;

const BLOCK_DESC =
  /^(disambiguation|redirect|soft redirect|wiktionary|list of|index of|outline of|timeline of|history of|glossary|template|category|portal|file|image|media|wiki|help|usage of|comparison of)\b/i;

const NO_ITEM_CATS =
  /^(All article disambiguation pages|Disambiguation pages|Wikipedia disambiguation pages|Redirects to Wiktionary|Redirects with short description|Redirects with no description present|Redirects from|Wiktionary|Set indices|All redirect pages|Main page|Main_Page|Wikipedia:|Template:|Help:|Portal:|File:)/i;

async function query(titles) {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2' +
    `&prop=categories|pageprops&cllimit=max&redirects=1&titles=${encodeURIComponent(titles.join('|'))}`;
  for (let a = 1; a <= 6; a++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 30000);
    try {
      const r = await fetch(url, { headers: UA, signal: ctl.signal });
      clearTimeout(timer);
      if (r.status === 429) { await sleep(15000 * a); continue; }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      clearTimeout(timer);
      if (a === 6) throw e;
      await sleep(5000 * a);
    }
  }
  throw new Error('exhausted');
}

function judge(page) {
  if (page.missing) return { ok: false, why: 'no-article' };
  const pp = page.pageprops || {};
  if (pp.disambiguation !== undefined) return { ok: false, why: 'disambiguation' };
  // Wikidata presence is the baseline for "a real, notable, citable subject".
  if (!pp.wikibase_item) return { ok: false, why: 'no-wikidata-item' };

  const cats = (page.categories || []).map((c) => c.title.replace(/^Category:/, ''));
  if (!cats.length) return { ok: false, why: 'no-categories' };
  if (cats.some((c) => NO_ITEM_CATS.test(c))) return { ok: false, why: 'meta-page' };

  // pageprops.wikibase-shortdesc is only present for some pages, so categories
  // carry the decision whenever the short description is absent.
  const desc = String(pp['wikibase-shortdesc'] || '');
  if (BLOCK_DESC.test(desc)) return { ok: false, why: `desc:${desc}` };
  if (desc && ORG_DESC.test(desc)) return { ok: true, why: 'desc', cats, desc };
  if (cats.some((c) => ORG_CAT.test(c))) return { ok: true, why: 'cats', cats, desc };
  if (desc && !ORG_DESC.test(desc)) return { ok: false, why: `not-an-org:${desc}` };
  return { ok: false, why: 'no-org-signal' };
}

async function verify(names) {
  const verdict = new Map();
  const BATCH = 40;
  for (let i = 0; i < names.length; i += BATCH) {
    const chunk = names.slice(i, i + BATCH);
    const j = await query(chunk);
    const norm = {};
    for (const r of j.query.redirects || []) norm[r.from] = r.to;
    for (const p of j.query.pages) {
      const key = p.title;
      verdict.set(key, judge(p));
    }
    // map the requested spelling onto whichever page answered for it
    for (const requested of chunk) {
      if (!verdict.has(requested)) {
        const resolved = norm[requested];
        verdict.set(requested, resolved && verdict.has(resolved) ? verdict.get(resolved) : { ok: false, why: 'unresolved' });
      }
    }
    if ((i / BATCH) % 10 === 0 || i + BATCH >= names.length) {
      console.log(`   verified ${Math.min(i + BATCH, names.length)}/${names.length}`);
    }
    await sleep(250);
  }
  return verdict;
}

(async () => {
  const report = {};
  const out = {};
  for (const label of TARGETS) {
    const file = path.join(SRC, `${label}.json`);
    if (!fs.existsSync(file)) { console.log(`skip ${label} (no file)`); continue; }
    const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
    const byName = new Map();
    for (const r of rows) {
      const n = String(r.name || '').trim();
      if (n.length > 1 && !byName.has(n.toLowerCase())) byName.set(n.toLowerCase(), n);
    }
    const names = [...byName.values()];
    console.log(`\n${label}: ${names.length} unique candidates -> verifying`);
    const verdict = await verify(names);

    const kept = [];
    const dropped = {};
    for (const n of names) {
      const v = verdict.get(n) || { ok: false, why: 'unresolved' };
      if (v.ok) {
        kept.push({ name: n, shortdesc: v.desc, cats: (v.cats || []).slice(0, 8) });
      } else {
        dropped[v.why] = (dropped[v.why] || 0) + 1;
      }
    }
    out[label] = kept;
    report[label] = { candidates: names.length, kept: kept.length, dropped };
    console.log(`   KEPT ${kept.length}/${names.length}`);
    const top = Object.entries(dropped).sort((a, b) => b[1] - a[1]).slice(0, 8);
    top.forEach(([w, c]) => console.log(`      dropped ${String(c).padStart(4)}  ${w}`));
    fs.writeFileSync(path.join(SRC, `_verified-${label}.json`), JSON.stringify(kept, null, 1));
  }

  console.log('\n=== SUMMARY ===');
  let tk = 0;
  let tc = 0;
  for (const [label, r] of Object.entries(report)) {
    console.log(`${String(r.kept).padStart(5)} / ${String(r.candidates).padStart(5)}  ${label}`);
    tk += r.kept;
    tc += r.candidates;
  }
  console.log(`${String(tk).padStart(5)} / ${String(tc).padStart(5)}  TOTAL verified organizations`);
  process.exit(0);
})().catch((e) => {
  console.error('FATAL', e.message);
  process.exit(1);
});
