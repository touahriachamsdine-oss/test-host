const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const finalPath = path.join(ROOT, 'data', 'global', '_sources', 'final.json');
const cachePath = path.join(ROOT, 'data', 'global', '_sources', '_country-cache.json');
const rows = JSON.parse(fs.readFileSync(finalPath, 'utf8'));
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
const source = process.argv[2] || 'automobiles';
const limit = parseInt(process.argv[3] || '40', 10);
const group = rows.filter((r) => r.country === 'Unknown' && r.source === source);
console.log('unknown', source, ':', group.length);
let known = 0, failed = 0;
const bad = [];
for (const r of group) {
  const cats = cache[r.name]?.cats || [];
  let country = null;
  for (const cat of cats) {
    const lc = cat.toLowerCase();
    const adj = Object.keys(NATIONALITY).find((k) => new RegExp('^' + k + '\\b').test(lc));
    if (adj) { country = NATIONALITY[adj]; break; }
  }
  if (country) known++;
  else { failed++; if (bad.length < limit) bad.push(r.name + ' -> ' + JSON.stringify(cats.slice(0, 6))); }
}
console.log('known via prefix-adj:', known, 'failed:', failed);
console.log(bad.join('\n'));