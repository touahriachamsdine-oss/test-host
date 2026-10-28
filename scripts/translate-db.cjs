/**
 * Translates imported startup rows into fr or ar and upserts startup_translations.
 *
 * Usage: node scripts/translate-db.cjs fr
 *        node scripts/translate-db.cjs ar --limit 50
 *
 * Uses the public Google dictionary endpoint (clients5.google.com) in batches,
 * with an on-disk cache so reruns resume instead of retranslating.
 *
 * Rollback: DELETE FROM startup_translations WHERE startup_id IN
 *           (SELECT id FROM startups WHERE id LIKE 'pt-%' OR id LIKE 'ae-%' OR id LIKE 'oh-%');
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..');
const CACHE_DIR = path.join(ROOT, 'translation-cache');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const W =
  "status = 'verified' AND is_duplicate_2025 = FALSE AND (id LIKE 'pt-%' OR id LIKE 'ae-%' OR id LIKE 'oh-%')";
const CHUNK = Number(process.env.CHUNK || 20);
const DELAY_MS = Number(process.env.DELAY_MS || 250);

const args = process.argv.slice(2);
const locale = args[0];
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg >= 0 ? Number(args[limitArg + 1]) : 0;
const prefixArg = args.indexOf('--prefix');
const PREFIX = prefixArg >= 0 ? args[prefixArg + 1] : '';
const ROW_FILTER = PREFIX
  ? `status = 'verified' AND is_duplicate_2025 = FALSE AND id LIKE '${PREFIX}-%'`
  : W;
if (!['fr', 'ar'].includes(locale)) {
  console.error('usage: node scripts/translate-db.cjs <fr|ar> [--limit N]');
  process.exit(1);
}

function readDatabaseUrl() {
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  return env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function postTranslate(texts, sourceLang = 'en') {
  const body = texts.map((t) => 'q=' + encodeURIComponent(t)).join('&');
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'clients5.google.com',
        path: `/translate_a/t?client=dict-chrome-ex&sl=${sourceLang}&tl=${locale}`,
        method: 'POST',
        headers: {
          'User-Agent': UA,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function flatten(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.flat(Infinity).filter(Boolean).join(' ');
  return String(value);
}

async function translateChunk(texts, sourceLang = 'en') {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const res = await postTranslate(texts, sourceLang);
      if (res.status === 429) {
        await sleep(4000 * (attempt + 1));
        continue;
      }
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      const parsed = JSON.parse(res.body);
      if (!Array.isArray(parsed) || parsed.length !== texts.length) {
        throw new Error(`length mismatch ${Array.isArray(parsed) ? parsed.length : 'n/a'}`);
      }
      return parsed.map((v) => flatten(v));
    } catch (error) {
      if (attempt === 3) {
        const out = [];
        for (const text of texts) {
          try {
            const single = await postTranslate([text], sourceLang);
            const parsed = JSON.parse(single.body);
            out.push(flatten(Array.isArray(parsed) ? parsed[0] : parsed));
          } catch {
            out.push(text);
          }
          await sleep(DELAY_MS);
        }
        return out;
      }
      await sleep(1000 * (attempt + 1));
    }
  }
  return texts;
}

function needsTranslation(text) {
  if (!text) return false;
  const trimmed = String(text).trim();
  if (!trimmed) return false;
  return /[A-Za-z]{3}/.test(trimmed) || /[\u0600-\u06FF]{3}/.test(trimmed);
}

const ARABIC = /[\u0600-\u06FF]/;
const FRENCH_HINTS = /[àâçéèêëîïôûùüÿœ]|\b(le|la|les|des|du|pour|avec|dans|une|est|sont|aux)\b/i;

/**
 * The three source families carry different languages:
 * pt- patents are English, ae- rows come from the Arabic workbooks,
 * oh- rows come from the French open-hardware sheet.
 */
function sourceLang(text) {
  const value = String(text ?? '');
  if (ARABIC.test(value)) return 'ar';
  if (FRENCH_HINTS.test(value)) return 'fr';
  return 'en';
}

const cacheKey = (text) => `${sourceLang(text)}|${text}`;

async function connect() {
  const client = new Client({
    connectionString: readDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
    keepAlive: true
  });
  client.on('error', (error) => console.error('db socket error:', error.message));
  await client.connect();
  return client;
}

(async () => {
  let client = await connect();

  const rows = (
    await client.query(
      `SELECT s.* FROM startups s
         LEFT JOIN startup_translations t ON t.startup_id = s.id AND t.locale = $1
        WHERE ${ROW_FILTER} AND t.startup_id IS NULL
        ORDER BY s.id ${LIMIT ? `LIMIT ${LIMIT}` : ''}`,
      [locale]
    )
  ).rows;
  console.log(`rows to translate (${locale}):`, rows.length);
  if (!rows.length) {
    await client.end();
    return;
  }

  const fields = [
    'short_description',
    'why_relevant',
    'technology',
    'sub_domain',
    'country',
    'hq_city',
    'concept',
    'build_approach',
    'product_issues',
    'algeria_value'
  ];

  const unique = new Map();
  const add = (text) => {
    if (!needsTranslation(text)) return;
    const key = String(text);
    if (!unique.has(key)) unique.set(key, true);
  };
  for (const row of rows) {
    for (const field of fields) add(row[field]);
    if (row.id.startsWith('pt-')) add(row.name);
    if (Array.isArray(row.main_sellers)) row.main_sellers.forEach(add);
    if (Array.isArray(row.team_rec)) {
      for (const pair of row.team_rec) add(Array.isArray(pair) ? pair[0] : pair && pair.role);
    }
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cacheFile = path.join(CACHE_DIR, `${locale}.v2.json`);
  const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : {};
  const pending = [...unique.keys()].filter((text) => !(cacheKey(text) in cache));
  console.log(`unique texts: ${unique.size} | cached: ${unique.size - pending.length} | pending: ${pending.length}`);

  const byLang = { en: [], fr: [], ar: [] };
  for (const text of pending) byLang[sourceLang(text)].push(text);

  const started = Date.now();
  let translated = 0;
  for (const [sourceLanguage, list] of Object.entries(byLang)) {
    if (!list.length) continue;
    console.log(`  ${sourceLanguage} -> ${locale}: ${list.length} texts`);
    for (let i = 0; i < list.length; i += CHUNK) {
      const slice = list.slice(i, i + CHUNK);
      const out = await translateChunk(slice, sourceLanguage);
      slice.forEach((text, index) => {
        cache[cacheKey(text)] = out[index] || text;
      });
      translated += slice.length;
      if (i % (CHUNK * 10) === 0) {
        fs.writeFileSync(cacheFile, JSON.stringify(cache));
        const rate = translated / ((Date.now() - started) / 1000);
        console.log(`  ${translated}/${pending.length} (${rate.toFixed(1)}/s)`);
      }
      await sleep(DELAY_MS);
    }
  }
  fs.writeFileSync(cacheFile, JSON.stringify(cache));
  console.log('translation pass done, cache entries:', Object.keys(cache).length);

  // The translation phase can take many minutes; Neon drops idle sockets, so
  // close the read connection and open a fresh one for writing.
  await client.end().catch(() => {});
  client = await connect();

  async function upsert(sql, values) {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        return await client.query(sql, values);
      } catch (error) {
        console.error(`  db write failed (${error.message}); reconnecting`);
        await client.end().catch(() => {});
        await sleep(2000 * (attempt + 1));
        client = await connect();
      }
    }
    throw new Error('db write failed after retries');
  }

  const tr = (text) => (needsTranslation(text) && cache[cacheKey(text)] ? cache[cacheKey(text)] : text || '');

  let written = 0;
  const BATCH = 20;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const values = [];
    const placeholders = [];
    slice.forEach((row, index) => {
      const team = Array.isArray(row.team_rec)
        ? row.team_rec.map((pair) => {
            const role = Array.isArray(pair) ? pair[0] : pair && pair.role;
            const count = Array.isArray(pair) ? Number(pair[1]) || 1 : 1;
            return [tr(role), count];
          })
        : null;
      const sellers = Array.isArray(row.main_sellers) ? row.main_sellers.map((s) => tr(s)) : null;
      const base = index * 15;
      placeholders.push(
        `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},` +
          `$${base + 9},$${base + 10},$${base + 11}::jsonb,$${base + 12}::jsonb,$${base + 13},$${base + 14}::jsonb,$${base + 15})`
      );
      values.push(
        row.id,
        locale,
        row.id.startsWith('pt-') ? tr(row.name) : row.name,
        tr(row.country),
        tr(row.sub_domain) || null,
        tr(row.short_description),
        tr(row.technology),
        tr(row.why_relevant),
        tr(row.hq_city) || null,
        tr(row.concept) || null,
        JSON.stringify(sellers),
        JSON.stringify(team),
        tr(row.build_approach) || null,
        JSON.stringify(tr(row.product_issues) || ''),
        tr(row.algeria_value) || null
      );
    });

    await upsert(
      `INSERT INTO startup_translations
         (startup_id, locale, name, country, sub_domain, short_description, technology, why_relevant,
          hq_city, concept, main_sellers, team_rec, build_approach, product_issues, algeria_value)
       VALUES ${placeholders.join(',')}
       ON CONFLICT (startup_id, locale) DO UPDATE SET
         name = EXCLUDED.name, country = EXCLUDED.country, sub_domain = EXCLUDED.sub_domain,
         short_description = EXCLUDED.short_description, technology = EXCLUDED.technology,
         why_relevant = EXCLUDED.why_relevant, hq_city = EXCLUDED.hq_city, concept = EXCLUDED.concept,
         main_sellers = EXCLUDED.main_sellers, team_rec = EXCLUDED.team_rec,
         build_approach = EXCLUDED.build_approach, product_issues = EXCLUDED.product_issues,
         algeria_value = EXCLUDED.algeria_value, updated_at = now()`,
      values
    );
    written += slice.length;
    if (written % 400 === 0) console.log(`  upserted ${written}/${rows.length}`);
  }

  const total = await client.query(
    `SELECT COUNT(*)::int n FROM startup_translations WHERE locale = $1`,
    [locale]
  );
  console.log(`done (${locale}): upserted ${written} | translations in table: ${total.rows[0].n}`);
  await client.end();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
