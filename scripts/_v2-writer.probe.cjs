const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// WHERE do the 15 committed per-domain files come from?
// - git said HEAD commit 945c278 introduced them ("4,199 verified")
// - Neon says 4,201 (live, authoritative, served at request time)
// - committed files on disk total 3,819 (already audited)
// This probe: (a) confirm which script builds those 15 files, (b) confirm the
// app reads NEON at runtime (not the committed json), (c) print CONTENT of a
// sample committed domain file so I know the exact schema to regenerate.

const GLOBAL = path.join(ROOT, 'data', 'global');
const V2 = path.join(GLOBAL, 'v2');

function countRowsIn(d) {
  let total = 0;
  const per = [];
  if (!fs.existsSync(d)) return { total: 0, per: ['(missing)'] };
  for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.json'))) {
    let n = -1;
    try { n = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')).length; } catch (e) { n = -1; }
    per.push(`${f}=${n}`);
    if (n > 0) total += n;
  }
  return { total, per };
}

const v2 = countRowsIn(V2 obvious);
const v1per = fs.existsSync(GLOBAL) ? fs.readdirSync(GLOBAL).filter((x) => x.endsWith('.json')).length : 0;
console.log('v2 dir rows:', v2.total);
console.log('v2 per-file:', v2.per.join(' | '));
console.log('v1 dir file count (top-level domain json):', v1per);

// what does the committed SAMPLE row look like (schema for regeneration)?
const sample = path.join(V2, 'manufacturing-3d.json');
if (fs.existsSync(sample))) {
  const arr = JSON.parse(fs.readFileSync(sample, 'utf8'));
  console.log('\nsample manufacturing-3d row[0]:');
  console.log(JSON.stringify(arr[0], null, 2));
  console.log('\nrow keys:', Object.keys(arr[0] || {}).join(', '));
} else {
  console.log('\nno manufacturing-3d.json in v2');
}

// which script writes v2 files? (does generate-v2-content.js read DB or files?)
const GENERATE = path.join(ROOT, 'scripts', 'generate-v2-content.js');
if (fs.existsSync(GENERATE)) {
  const t = fs.readFileSync(GENERATE, 'utf8');
  console.log('\ngenerate-v2-content.js touches:');
  const m = t.match(/writeFileSync[^;]{0,90}/g) || [];
  console.log(m.slice(0, 12).join('\n'));
  console.log('\nreads file or DB?', /@vercel\/postgres|new Client|query\(/.test(t) ? 'maybe DB' : 'files/static');
}
