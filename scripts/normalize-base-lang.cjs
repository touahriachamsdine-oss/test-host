/**
 * Normalises the source language of imported rows to English.
 *
 * The three imported families carry different source languages:
 *   pt-  patents  -> English
 *   ae-  Arabic workbooks -> Arabic
 *   oh-  open hardware    -> French
 *
 * This script translates the Arabic/French cells of the base `startups` rows
 * into English so the default (English) site reads correctly. French and
 * Arabic pages keep using `startup_translations`, which were produced from the
 * original source text and stay valid.
 *
 * Usage: node scripts/normalize-base-lang.cjs [--prefix ae|oh] [--limit N]
 *
 * Rollback: rows are not backed up; re-run scripts/import-*.cjs to restore, or
 * keep a dump with: pg_dump -t startups --data-only > startups_backup.sql
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..');
const CACHE_DIR = path.join(ROOT, 'translation-cache');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const CHUNK = Number(process.env.CHUNK || 15);
const DELAY_MS = Number(process.env.DELAY_MS || 250);

const args = process.argv.slice(2);
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg >= 0 ? Number(args[limitArg + 1]) : 0;
const prefixArg = args.indexOf('--prefix');
const PREFIX = prefixArg >= 0 ? args[prefixArg + 1] : '';
const ROW_FILTER = PREFIX
  ? `status = 'verified' AND id LIKE '${PREFIX}-%'`
  : "status = 'verified' AND (id LIKE 'ae-%' OR id LIKE 'oh-%')";

function readDatabaseUrl() {
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  return env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ARABIC = /[\u0600-\u06FF]/;
const FRENCH_HINTS =
  /[àâçéèêëîïôûùüÿœ]|\b(le|la|les|des|du|pour|avec|dans|une|est|sont|aux|machinisme|fabrication|impression|plasturgie|prototypage|agricole|entreprises?|num[ée]rique|r[ée]seau|capteurs?|donn[ée]es|mod[èe]le|gestion|bureau|logiciel|mat[ée]riel|traitement|stockage|[ée]nergie|syst[èe]me|atelier|pilotage)\b/i;

function sourceLang(text) {
  const value = String(text ?? '');
  if (!value.trim()) return null;
  if (ARABIC.test(value)) return 'ar';
  if (FRENCH_HINTS.test(value)) return 'fr';
  return null;
}

function flatten(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.flat(Infinity).filter(Boolean).join(' ');
  return String(value);
}

function postTranslate(texts, sl) {
  const body = texts.map((t) => 'q=' + encodeURIComponent(t)).join('&');
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'clients5.google.com',
        path: `/translate_a/t?client=dict-chrome-ex&sl=${sl}&tl=en`,
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

async function translateChunk(texts, sl) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const res = await postTranslate(texts, sl);
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
            const single = await postTranslate([text], sl);
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

const FIELDS = [
  'name',
  'short_description',
  'technology',
  'why_relevant',
  'sub_domain',
  'country',
  'hq_city',
  'concept',
  'build_approach',
  'product_issues',
  'algeria_value',
  'history'
];

(async () => {
  let client = await connect();
  const rows = (
    await client.query(
      `SELECT id, ${FIELDS.join(', ')}, main_sellers, team_rec
       FROM startups WHERE ${ROW_FILTER} ORDER BY id ${LIMIT ? `LIMIT ${LIMIT}` : ''}`
    )
  ).rows;
  console.log('rows to normalise:', rows.length);

  const unique = new Map();
  for (const row of rows) {
    for (const field of FIELDS) {
      const lang = sourceLang(row[field]);
      if (lang) unique.set(`${lang}|${row[field]}`, { lang, text: row[field] });
    }
    for (const seller of Array.isArray(row.main_sellers) ? row.main_sellers : []) {
      const lang = sourceLang(seller);
      if (lang) unique.set(`${lang}|${seller}`, { lang, text: seller });
    }
    for (const pair of Array.isArray(row.team_rec) ? row.team_rec : []) {
      const role = Array.isArray(pair) ? pair[0] : pair && pair.role;
      const lang = sourceLang(role);
      if (lang) unique.set(`${lang}|${role}`, { lang, text: role });
    }
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cacheFile = path.join(CACHE_DIR, 'en.json');
  const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : {};
  const pending = [...unique.keys()].filter((key) => !(key in cache));
  console.log(`unique texts: ${unique.size} | cached: ${unique.size - pending.length} | pending: ${pending.length}`);

  const byLang = { ar: [], fr: [] };
  for (const key of pending) byLang[unique.get(key).lang].push(unique.get(key).text);

  const started = Date.now();
  let done = 0;
  for (const [lang, list] of Object.entries(byLang)) {
    if (!list.length) continue;
    console.log(`  ${lang} -> en: ${list.length} texts`);
    for (let i = 0; i < list.length; i += CHUNK) {
      const slice = list.slice(i, i + CHUNK);
      const out = await translateChunk(slice, lang);
      slice.forEach((text, index) => {
        cache[`${lang}|${text}`] = out[index] || text;
      });
      done += slice.length;
      if (i % (CHUNK * 10) === 0) {
        fs.writeFileSync(cacheFile, JSON.stringify(cache));
        const rate = done / ((Date.now() - started) / 1000);
        console.log(`  ${done}/${pending.length} (${rate.toFixed(1)}/s)`);
      }
      await sleep(DELAY_MS);
    }
  }
  fs.writeFileSync(cacheFile, JSON.stringify(cache));
  console.log('translation pass done, cache entries:', Object.keys(cache).length);

  await client.end().catch(() => {});
  client = await connect();

  const en = (text) => {
    if (!text) return text;
    const lang = sourceLang(text);
    if (!lang) return text;
    return cache[`${lang}|${text}`] || text;
  };

  let written = 0;
  const BATCH = 15;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const values = [];
    const tuples = [];
    slice.forEach((row, index) => {
      const base = index * 15;
      tuples.push(
        `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},` +
          `$${base + 9},$${base + 10},$${base + 11}::jsonb,$${base + 12},$${base + 13}::jsonb,$${base + 14}::jsonb,$${base + 15})`
      );

      const name = en(row.name);
      let description = en(row.short_description) || '';
      // Many ae- rows repeat the brand name as their description; fall back to
      // the technology line, then to the relevance note.
      if (!description.trim() || description.trim() === name.trim()) {
        const tech = (en(row.technology) || '').trim();
        const why = (en(row.why_relevant) || '').trim();
        description = tech.length >= 15 ? tech : why.slice(0, 240);
      }

      const sellers = Array.isArray(row.main_sellers) ? row.main_sellers.map((s) => en(s)) : null;
      const team = Array.isArray(row.team_rec)
        ? row.team_rec.map((pair) =>
            Array.isArray(pair) ? [en(pair[0]), Number(pair[1]) || 1] : pair
          )
        : null;

      values.push(
        row.id,
        name,
        description,
        en(row.technology) || null,
        en(row.why_relevant) || null,
        en(row.sub_domain) || null,
        en(row.country) || null,
        en(row.hq_city) || null,
        en(row.concept) || null,
        en(row.build_approach) || null,
        JSON.stringify(en(row.product_issues) || ''),
        en(row.algeria_value) || null,
        JSON.stringify(sellers),
        JSON.stringify(team),
        en(row.history) || null
      );
    });

    await client.query(
      `UPDATE startups AS s SET
         name = v.name, short_description = v.short_description, technology = v.technology,
         why_relevant = v.why_relevant, sub_domain = v.sub_domain, country = v.country,
         hq_city = v.hq_city, concept = v.concept, build_approach = v.build_approach,
         product_issues = v.product_issues, algeria_value = v.algeria_value,
         main_sellers = v.main_sellers, team_rec = v.team_rec, history = v.history
       FROM (VALUES ${tuples.join(',')}) AS v(id, name, short_description, technology, why_relevant,
         sub_domain, country, hq_city, concept, build_approach, product_issues, algeria_value,
         main_sellers, team_rec, history)
       WHERE s.id = v.id`,
      values
    );
    written += slice.length;
    if (written % 300 === 0) console.log(`  updated ${written}/${rows.length}`);
  }

  console.log(`done: ${written} base rows normalised to English`);
  await client.end();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
