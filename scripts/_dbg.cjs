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

(async () => {
  const titles = ['Kirkland & Ellis', 'Verizon', 'Cevital'];

  const a = 'https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1&prop=categories|pageprops&cllimit=max&redirects=1&titles=' + encodeURIComponent(titles.join('|'));
  const b = 'https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1&prop=categories|pageprops&cllimit=max&titles=' + encodeURIComponent(titles.join('|'));

  console.log('=== WITH duplicate redirects param (as written) ===');
  const ja = await get(a);
  console.log(JSON.stringify(ja, null, 1).slice(0, 1200));

  console.log('\n=== WITHOUT duplicate redirects param ===');
  const jb = await get(b);
  console.log(JSON.stringify(jb, null, 1).slice(0, 1800));

  process.exit(0);
})();
