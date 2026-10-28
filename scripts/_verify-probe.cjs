// Inspects what Wikipedia actually returns for candidate names, so we can build
// a reliable "is this a real organization?" filter instead of trusting prose scraping.
const UA = { 'User-Agent': 'startup-ideas-dz/0.2 (research script)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SAMPLES = [
  'railhead',
  'Bakers',
  'All Joy Foods',
  'Cevital',
  'TransNamib',
  'Hong Kong Tramways',
  '1789 Capital',
  'Kirkland & Ellis',
  'Aarong',
  'Ashoka',
  'BRAC',
  'Adex Mining',
  'Verizon',
  'Latham & Watkins',
  'DLA Piper',
  'Skadden, Arps, Slate, Meagher & Flom',
  'Peak Tram'
];

async function info(titles) {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1' +
    `&prop=categories|pageprops&cllimit=max&titles=${encodeURIComponent(titles.join('|'))}`;
  for (let a = 1; a <= 5; a++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 30000);
    try {
      const r = await fetch(url, { headers: UA, signal: ctl.signal });
      clearTimeout(timer);
      if (r.status === 429) { await sleep(15000 * a); continue; }
      return await r.json();
    } catch (e) {
      clearTimeout(timer);
      if (a === 5) throw e;
      await sleep(6000 * a);
    }
  }
  throw new Error('exhausted');
}

(async () => {
  const j = await info(SAMPLES);
  const norm = {};
  for (const r of j.query.redirects || []) norm[r.from] = r.to;
  for (const p of j.query.pages) {
    const title = norm[p.title] || p.title;
    const cats = (p.categories || []).map((c) => c.title.replace(/^Category:/, ''));
    console.log(`\n${title}`);
    console.log(`   pageprops: ${JSON.stringify(p.pageprops || {})}`);
    console.log(`   cats: ${cats.slice(0, 12).join(' / ') || '(none)'}`);
  }
  process.exit(0);
})().catch((e) => {
  console.error('FATAL', e.message);
  process.exit(1);
});
