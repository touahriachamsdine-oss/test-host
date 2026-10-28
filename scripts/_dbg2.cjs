const fs = require('fs');
const UA = { 'User-Agent': 'startup-ideas-dz/0.2 (research script)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  for (let a = 1; a <= 5; a++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 30000);
    try {
      const r = await fetch(url, { headers: UA, signal: ctl.signal });
      clearTimeout(timer);
      if (r.status === 429) { await sleep(12000 * a); continue; }
      return await r.json();
    } catch (e) {
      clearTimeout(timer);
      if (a === 5) throw e;
      await sleep(4000 * a);
    }
  }
}

const rows = JSON.parse(fs.readFileSync('data/global/_sources/lawfirms.json', 'utf8'));
const names = rows.map((r) => r.name).slice(0, 40);

(async () => {
  for (const size of [20, 40]) {
    const chunk = names.slice(0, size);
    const url =
      'https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2' +
      `&prop=categories|pageprops&cllimit=max&redirects=1&titles=${encodeURIComponent(chunk.join('|'))}`;
    const j = await get(url);
    const pages = j.query?.pages || [];
    const withPP = pages.filter((p) => p.pageprops && p.pageprops.wikibase_shortdesc).length;
    const withCat = pages.filter((p) => (p.categories || []).length).length;
    const withItem = pages.filter((p) => p.pageprops?.wikibase_item).length;
    console.log(`batch=${size}  pages=${pages.length}  withPageprops=${withPP}  withItem=${withItem}  withCats=${withCat}`);
    if (pages[0] && !pages[0].pageprops) console.log('   sample keys:', Object.keys(pages[0]));
    await sleep(1500);
  }
  process.exit(0);
})();
