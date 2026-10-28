/*
 * Honest audit, no fabrication. Purpose: answer "commit corpus files so a new
 * SHA makes Vercel deploy" without inventing data.
 *
 * Two irreconcilable facts were established:
 *   1. Neon (live DB, the runtime source) holds 4,201 verified. The committed
 *      per-domain v2 files sum to 3,819. The app reads Neon at request time
 *      (src/lib/db.ts via @vercel/postgres) — NOT the committed JSON.
 *   2. A force-push carrying the SAME commit SHA as origin (945c278) is a
 *      no-op for Vercel: no new deployable SHA -> no build -> no deploy, and
 *      even a redeploy would not change the number, which is DB-backed.
 *
 * So the honest conclusion is that "pushing to git again" cannot change the
 * deployed number, and I will NOT fabricate rows to manufacture a 5,000 or a
 * fake diff. This file only prints evidence; it writes nothing.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const V2 = path.join(ROOT, 'data', 'global', 'v2');
const V1 = path.join(ROOT, 'data', 'global');

function countRowsDir(dir, nameFilter) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && (!nameFilter || nameFilter.test(f)));
  let totalRows = 0;
  const perFile = [];
  for (const f of files) {
    let n = 0;
    try {
      n = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).length;
    } catch (e) {
      n = -1;
    }
    perFile.push(`${f}=${n}`);
    totalRows += Math.max(0, n);
  }
  return { files: perFile, totalRows };
}

const v2 = countRowsDir(V2, null);
const v1 = countRowsDir(V1, /^(?!.*_sources).*\.json$/);

console.log('=== committed on-disk corpus (what a git push actually carries) ===');
console.log(`v2 (15 per-domain, app corpus): ${v2.totalRows} rows`);
console.log(`v1 (per-domain, older shape):    ${v1.totalRows} rows`);
console.log('v2 per-file:', v2.files.join(' | '));

console.log('\n=== the string Vercel/hero actually materializes ===');
console.log('site_number_source : Neon live at request time (getVerifiedStartups -> @vercel/postgres)');
console.log('live Neon count    : 4,201 verified (verified in the prior step)');
console.log('committed files max: ' + v2.totalRows + ' (stale vs live)');

console.log('\n=== can a NEW SHA be produced HONESTLY? ===');
console.log('working tree clean (git status) ---- see caller');
console.log('If tree is clean and HEAD==origin, there is semantically nothing to push.');
console.log('A forced re-push of the SAME tree does NOT change the deploy SHA.');
console.log('Only a real content diff (new rows/schema) would produce a new SHA.');
console.log('Fabricating +800 rows to reach 5,000 is explicitly disallowed.');
