/**
 * Imports the patent workbooks and the Arabic micro-enterprise catalogue.
 *
 *   node scripts/import-excels.cjs --dry-run
 *   node scripts/import-excels.cjs --apply
 *
 * Rollback: DELETE FROM startups WHERE id LIKE 'pt-%' OR id LIKE 'ae-%';
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const XLSX = require(process.env.XLSX_PATH || 'xlsx');
const { countryOf, domainOf, JURISDICTIONS, SHEET_DOMAIN } = require('./lib/geo.cjs');
const { templateFor } = require('./lib/analysis-templates.cjs');

const SOURCE_DIR = process.env.SPUD_DIR || 'C:\\Users\\anouar\\Documents\\proto\\spud';
const mode = process.argv.includes('--apply') ? 'apply' : 'dry-run';

const PATENT_FILES = ['1.', '2.', '4.', '5.'];
const ARABIC_FILE = 'الملف';

const COLUMNS = [
  'id', 'name', 'country', 'domain', 'sub_domain', 'short_description', 'technology',
  'year_founded', 'official_site', 'source_url', 'why_relevant', 'priority', 'status',
  'is_duplicate_2025', 'hq_city', 'latitude', 'longitude', 'concept', 'main_sellers',
  'team_rec', 'build_approach', 'product_issues', 'algeria_value', 'difficulty_score',
  'difficulty_breakdown', 'source_tier', 'source_note'
];

function readDatabaseUrl() {
  const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  return /^DATABASE_URL=(.*)$/m.exec(env)[1].trim().replace(/^["']|["']$/g, '');
}

function slugify(text, max = 48) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, max);
}

function tidy(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function pick(row, keys) {
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim()) return tidy(value);
  }
  return '';
}

function cleanLinks(raw) {
  return String(raw || '')
    .split(/[\s,;]+/)
    .map((link) => link.trim())
    .filter((link) => /^https?:\/\//i.test(link) && !/^https?:\/\/(link|lien)$/i.test(link));
}

function yearOf(raw) {
  const match = /(19|20)\d{2}/.exec(String(raw || ''));
  return match ? Number(match[0]) : null;
}

function patentRows(fileName, sheetName, rows, seen, taken) {
  const out = [];
  for (const row of rows) {
    const title = pick(row, ['L’intitulé*', 'Title', 'Titre']);
    if (!title || title.length < 6) continue;
    const nameKey = title.toLowerCase().slice(0, 120);
    if (seen.has(nameKey)) continue;
    seen.add(nameKey);

    const number = pick(row, ['Numéro de brevet*', 'Application Number', 'Display Key', 'Lens ID']);
    const abstract = pick(row, ['Abrégé si nécessaire', 'Abstract']);
    const legal = pick(row, ['Statut*', 'Legal Status']);
    const keywords = pick(row, ['Mots clés', 'CPC Classifications']);
    const applicants = pick(row, ['Applicants']);
    const jurisdiction = pick(row, ['Jurisdiction']);
    const links = cleanLinks(pick(row, ['lien*', 'URL']));
    const published = yearOf(pick(row, ['Publication Date']));

    const prefix = jurisdiction || (/^([A-Z]{2})\b/.exec(number) || [])[1] || '';
    const place = JURISDICTIONS[prefix] || {
      en: /^[A-Z]{2}/.test(prefix) ? prefix : 'International',
      lat: null,
      lng: null
    };

    const domain = SHEET_DOMAIN[sheetName] || domainOf(sheetName + ' ' + title + ' ' + abstract);
    const template = templateFor(domain);
    const free = /expired|inactive|public domain|domaine public/i.test(legal);

    let id = 'pt-' + (slugify(number || title, 40) || 'x');
    let n = 2;
    while (taken.has(id)) id = 'pt-' + (slugify(number || title, 40) || 'x') + '-' + n++;
    taken.add(id);

    out.push({
      id,
      name: title.slice(0, 160),
      country: place.en,
      domain,
      subDomain: sheetName,
      shortDescription: (abstract || title).slice(0, 600),
      technology: keywords.slice(0, 200) || sheetName,
      yearFounded: published,
      officialSite: links[0] || null,
      sourceUrl: links[1] || links[0] || null,
      whyRelevant:
        `Patent published in ${number || 'the public record'}` +
        (legal ? ` with legal status ${legal}` : '') +
        (prefix ? ` (${prefix})` : '') +
        `. ${free ? 'Free to reuse' : 'Needs a freedom-to-operate check'}: verify the Algerian status with INAPI before building.`,
      priority: free ? 'A' : 'B',
      status: 'verified',
      hqCity: place.en,
      latitude: place.lat,
      longitude: place.lng,
      concept: abstract ? abstract.slice(0, 400) : null,
      mainSellers: applicants ? [applicants.slice(0, 200)] : null,
      teamRec: template.team,
      buildApproach: template.build,
      productIssues: template.issues,
      algeriaValue:
        `A published design in ${sheetName.toLowerCase()} that an Algerian team can reproduce, improve and manufacture locally.`,
      difficultyScore: free ? 45 : 65,
      difficultyBreakdown: {
        technical: 55,
        capital: free ? 45 : 60,
        market: 50,
        regulatory: free ? 25 : 70
      },
      sourceTier: 'S2',
      sourceNote: `Imported from ${fileName} / ${sheetName}; analysis fields platform-generated.`
    });
  }
  return out;
}

function arabicRows(fileName, sheetName, rows, seen, taken) {
  const out = [];
  for (const raw of rows) {
    const row = {};
    for (const [key, value] of Object.entries(raw)) row[tidy(key)] = value;

    let name = pick(row, ['اسم الشركة /المشروع', 'اسم الشركة', 'اسم المشروع']);
    let country = pick(row, ['البلد', 'البلد ']);
    let sector = pick(row, ['مجال النشاط', 'المجال', 'القطاع']);
    let description = pick(row, ['وصف المشروع بصفة مختصرة', 'وصف النشاط', 'الوصف']);

    if (!name) {
      const values = Object.values(raw).map(tidy);
      if (values[1] && values[1].length > 2) {
        name = values[1];
        country = country || values[2];
        sector = sector || values[3];
        description = description || values[4];
      }
    }
    if (!name || name.length < 3) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const place = countryOf(country);
    const domain = SHEET_DOMAIN[sheetName] || domainOf(sheetName + ' ' + sector + ' ' + description);
    const template = templateFor(domain);
    const business = pick(row, ['نموذج الاعمال ان وجد / رابط امشروع', 'نموذج الأعمال']);
    const source = pick(row, ['المصدر الرابط المرجعي', 'المصدر']);
    const year = yearOf(pick(row, ['سنة التأسيس']));
    const feasibility = pick(row, ['قابلية التاسيس في السوق الجزائرية', 'قابلية التأسيس']);
    const notes = pick(row, ['ملاحظات']);

    let id = 'ae-' + (slugify(name, 48) || 'x');
    let n = 2;
    while (taken.has(id)) id = 'ae-' + (slugify(name, 48) || 'x') + '-' + n++;
    taken.add(id);

    out.push({
      id,
      name: name.slice(0, 160),
      country: place.en,
      domain,
      subDomain: sector || sheetName,
      shortDescription: (description || name).slice(0, 600),
      technology: sector || sheetName,
      yearFounded: year,
      officialSite: cleanLinks(business)[0] || null,
      sourceUrl: cleanLinks(source)[0] || null,
      whyRelevant:
        `Micro-enterprise model documented in ${place.en}` +
        (sector ? ` (${sector})` : '') +
        (feasibility ? `. Algerian market feasibility: ${feasibility}` : '') +
        '.',
      priority: /عالية|مرتفعة|قابل/.test(feasibility) ? 'A' : 'B',
      status: 'verified',
      hqCity: place.en,
      latitude: place.lat,
      longitude: place.lng,
      concept: description ? description.slice(0, 400) : null,
      mainSellers: null,
      teamRec: template.team,
      buildApproach: template.build,
      productIssues: template.issues,
      algeriaValue: notes || `A small-scale model from ${place.en} that can be adapted to the Algerian market.`,
      difficultyScore: 40,
      difficultyBreakdown: { technical: 35, capital: 45, market: 45, regulatory: 25 },
      sourceTier: 'S3',
      sourceNote: `Imported from ${fileName} / ${sheetName}; analysis fields platform-generated.`
    });
  }
  return out;
}

function fileMatching(files, prefix) {
  return files.find((file) => file.startsWith(prefix) && file.toLowerCase().endsWith('.xlsx'));
}

function collect() {
  const files = fs.readdirSync(SOURCE_DIR).filter((f) => f.toLowerCase().endsWith('.xlsx'));
  const seen = new Set();
  const taken = new Set();
  const rows = [];

  for (const prefix of PATENT_FILES) {
    const file = fileMatching(files, prefix);
    if (!file) continue;
    const wb = XLSX.readFile(path.join(SOURCE_DIR, file), { cellDates: false });
    for (const sheet of wb.SheetNames) {
      const ws = wb.Sheets[sheet];
      if (!ws || !ws['!ref']) continue;
      const sheetRows = XLSX.utils.sheet_to_json(ws, { defval: '', blankrows: true });
      if (!sheetRows.length) continue;
      const parsed = patentRows(file, sheet, sheetRows, seen, taken);
      if (parsed.length) {
        rows.push(...parsed);
        console.log(`  ${file} / ${sheet}: ${parsed.length}`);
      }
    }
  }

  const arabicFile = fileMatching(files, ARABIC_FILE);
  if (arabicFile) {
    const wb = XLSX.readFile(path.join(SOURCE_DIR, arabicFile), { cellDates: false });
    for (const sheet of wb.SheetNames) {
      const ws = wb.Sheets[sheet];
      if (!ws || !ws['!ref']) continue;
      const sheetRows = XLSX.utils.sheet_to_json(ws, { defval: '', blankrows: true });
      if (!sheetRows.length) continue;
      const parsed = arabicRows(arabicFile, sheet, sheetRows, seen, taken);
      if (parsed.length) {
        rows.push(...parsed);
        console.log(`  ${arabicFile} / ${sheet}: ${parsed.length}`);
      }
    }
  }

  return rows;
}

async function main() {
  console.log('reading workbooks...');
  const rows = collect();

  const byDomain = {};
  const byCountry = {};
  for (const row of rows) {
    byDomain[row.domain] = (byDomain[row.domain] || 0) + 1;
    byCountry[row.country] = (byCountry[row.country] || 0) + 1;
  }
  console.log('\nprepared:', rows.length);
  console.log('by domain:', JSON.stringify(byDomain));
  console.log('top countries:', JSON.stringify(Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 10)));
  console.log('sample patent:', JSON.stringify(rows.find((r) => r.id.startsWith('pt-')), null, 1).slice(0, 900));
  console.log('sample enterprise:', JSON.stringify(rows.find((r) => r.id.startsWith('ae-')), null, 1).slice(0, 900));

  if (mode !== 'apply') {
    console.log('\nDRY RUN — nothing written. Re-run with --apply.');
    return;
  }

  const client = new Client({ connectionString: readDatabaseUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();

  const existing = await client.query('SELECT lower(name) AS name FROM startups');
  const existingNames = new Set(existing.rows.map((r) => r.name));
  const fresh = rows.filter((row) => !existingNames.has(row.name.toLowerCase()));
  console.log('\nskipped as duplicates of existing rows:', rows.length - fresh.length);

  let inserted = 0;
  const BATCH = 40;
  for (let i = 0; i < fresh.length; i += BATCH) {
    const batch = fresh.slice(i, i + BATCH);
    const values = [];
    const tuples = batch.map((row, rowIndex) => {
      const placeholders = COLUMNS.map((column, columnIndex) => {
        const index = rowIndex * COLUMNS.length + columnIndex + 1;
        values.push(
          column === 'is_duplicate_2025' ? false : toSqlValue(row[toCamel(column)], column)
        );
        return `$${index}`;
      });
      return '(' + placeholders.join(',') + ')';
    });
    const result = await client.query(
      `INSERT INTO startups (${COLUMNS.join(',')}) VALUES ${tuples.join(',')}
       ON CONFLICT (id) DO NOTHING`,
      values
    );
    inserted += result.rowCount;
    if ((i / BATCH) % 10 === 0) console.log(`  ${Math.min(i + BATCH, fresh.length)} / ${fresh.length}`);
  }

  console.log('inserted:', inserted);
  const after = await client.query("SELECT count(*)::int AS n FROM startups WHERE id LIKE 'pt-%' OR id LIKE 'ae-%'");
  console.log('pt-/ae- rows now:', after.rows[0].n);
  await client.end();
}

function toCamel(column) {
  return column.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function toSqlValue(value, column) {
  if (column === 'product_issues' && typeof value === 'string') return JSON.stringify(value);
  if (value === undefined || value === null) return null;
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) return JSON.stringify(value);
  return value;
}

main().catch((error) => {
  console.error('FAILED:', error.message);
  process.exit(1);
});
