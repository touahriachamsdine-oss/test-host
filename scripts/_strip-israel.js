const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ISRAEL_DOMAINS = [
  'agritech-foodtech', 'ai-computing', 'cybersecurity', 'drones-autonomy', 'energy-storage',
  'medtech', 'nanotech-materials', 'other-deep-tech', 'semiconductors'
];

function slugify(name) {
  const base = String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length ? base : 'imported';
}

function isIsraeliCountry(c) {
  return /israel/i.test(String(c || ''));
}

const removed = [];

for (const domain of ISRAEL_DOMAINS) {
  const file = path.join(ROOT, 'data', 'global', `${domain}.json`);
  if (!fs.existsSync(file)) continue;
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  const kept = rows.filter((r) => {
    if (isIsraeliCountry(r.country)) {
      removed.push({ domain, name: r.name, slug: slugify(r.name) });
      return false;
    }
    return true;
  });
  fs.writeFileSync(file, JSON.stringify(kept, null, 2) + '\n');
  console.log(`${domain}: ${rows.length} -> ${kept.length}`);
}

const transDir = path.join(ROOT, 'data', 'global', 'translations');
if (fs.existsSync(transDir)) {
  const slugs = new Set(removed.map((r) => r.slug));
  let purged = 0;
  for (const f of fs.readdirSync(transDir)) {
    if (!f.endsWith('.json')) continue;
    const p = path.join(transDir, f);
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    let changed = false;
    for (const key of Object.keys(data)) {
      if (slugs.has(slugify(key)) || slugs.has(key)) {
        delete data[key];
        changed = true;
        purged += 1;
      }
    }
    if (changed) fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
  }
  console.log(`purged translation stanzas: ${purged}`);
}

const glossary = path.join(transDir, '_country-glossary.json');
if (fs.existsSync(glossary)) {
  const data = JSON.parse(fs.readFileSync(glossary, 'utf8'));
  if (data.Israel) {
    delete data.Israel;
    fs.writeFileSync(glossary, JSON.stringify(data, null, 2) + '\n');
    console.log('removed Israel from country glossary');
  }
}

console.log('removed companies:', removed.length);
removed.forEach((r) => console.log(` - ${r.domain} / ${r.name}`));