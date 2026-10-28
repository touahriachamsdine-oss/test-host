// Promotes the Wikipedia-verified candidate lists into the shape the build
// pipeline expects, so only proven organizations enter the merge stage.
//
//   data/global/_sources/_verified-<label>.json   (written by verify-new-sources.cjs)
//     -> data/global/_sources/<label>.json
//
// The raw scrape is preserved once as _raw-<label>.json (ignored by build-v2.js
// because that filename is not a key in SOURCE_META).
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'data', 'global', '_sources');

const SOURCES = {
  lawfirms: { domain: 'law-social-impact', industry: 'law firm' },
  socialent: { domain: 'law-social-impact', industry: 'social enterprise' },
  food: { domain: 'agritech-foodtech', industry: 'food and beverage manufacturing' },
  railways: { domain: 'manufacturing-3d', industry: 'railway operations and rolling stock' },
  telecom: { domain: 'cloud-iot', industry: 'telecommunications' },
  mining: { domain: 'nanotech-materials', industry: 'mining and critical minerals' },
  vc: { domain: 'other-deep-tech', industry: 'venture capital' }
};

let grandTotal = 0;
for (const [label, meta] of Object.entries(SOURCES)) {
  const verifiedPath = path.join(SRC, `_verified-${label}.json`);
  if (!fs.existsSync(verifiedPath)) {
    console.log(`skip ${label}: no verified file`);
    continue;
  }
  const verified = JSON.parse(fs.readFileSync(verifiedPath, 'utf8'));

  const rawPath = path.join(SRC, `${label}.json`);
  const rawBackup = path.join(SRC, `_raw-${label}.json`);
  if (fs.existsSync(rawPath) && !fs.existsSync(rawBackup)) {
    fs.copyFileSync(rawPath, rawBackup);
    console.log(`   backed up raw ${label}.json -> _raw-${label}.json`);
  }

  const rows = verified.map((v) => ({
    name: v.name,
    industry: meta.industry,
    domain: meta.domain
  }));

  fs.writeFileSync(rawPath, JSON.stringify(rows, null, 1));
  console.log(`${label}: ${rows.length} verified rows -> ${label}.json (${meta.domain})`);
  grandTotal += rows.length;
}

console.log(`total promoted: ${grandTotal}`);