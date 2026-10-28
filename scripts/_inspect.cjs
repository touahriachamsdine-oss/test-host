const UA = { 'User-Agent': 'startup-ideas-dz/0.2 (research script)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function parse(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=wikitext&format=json&formatversion=2`;
  for (let a = 1; a <= 5; a++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 30000);
    try {
      const r = await fetch(url, { headers: UA, signal: ctl.signal });
      clearTimeout(timer);
      if (r.status === 429) { await sleep(15000 * a); continue; }
      const j = await r.json();
      if (j.error) return null;
      return j.parse?.wikitext || '';
    } catch (e) {
      clearTimeout(timer);
      if (a === 5) return null;
      await sleep(6000 * a);
    }
  }
  return null;
}

(async () => {
  for (const t of ['List of largest law firms by revenue', 'List of social enterprises']) {
    const wt = await parse(t);
    if (wt === null) { console.log(`${t}: NULL`); continue; }
    console.log(`\n############ <${t}>  ${wt.length} chars`);
    const lines = wt.split('\n');
    let inTable = false;
    let shown = 0;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const tl = l.trimStart();
      if (tl.startsWith('{|')) { inTable = true; shown = 0; console.log(`--- table starts at line ${i}`); }
      if (inTable && shown < 22) { console.log(`  ${i}: ${l.slice(0, 160)}`); shown++; }
      if (tl.startsWith('|}')) { inTable = false; console.log(`--- table ends at line ${i}`); }
    }
    if (!/^\{\|/m.test(wt)) {
      console.log('  NO TABLE. first 30 lines:');
      lines.slice(0, 30).forEach((l, i) => console.log(`  ${i}: ${l.slice(0, 200)}`));
    }
    await sleep(3000);
  }
  process.exit(0);
})();
