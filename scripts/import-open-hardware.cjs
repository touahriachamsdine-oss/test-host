/**
 * Imports the "Base_Open_Hardware_Consolidee_Structure v3" catalogue (Global
 * sheet) into the startups table.
 *
 *   node scripts/import-open-hardware.cjs --dry-run
 *   node scripts/import-open-hardware.cjs --apply
 *
 * Every imported row gets an id starting with `oh-`, so a rollback is:
 *   DELETE FROM startups WHERE id LIKE 'oh-%';
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const XLSX = require(process.env.XLSX_PATH || 'xlsx');
const WORKBOOK =
  process.env.OPEN_HARDWARE_FILE ||
  'C:\\Users\\anouar\\Documents\\proto\\spud\\Base_Open_Hardware_Consolidee_Structure v3.xlsx';

const mode = process.argv.includes('--apply') ? 'apply' : 'dry-run';

function readDatabaseUrl() {
  const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  return /^DATABASE_URL=(.*)$/m.exec(env)[1].trim().replace(/^["']|["']$/g, '');
}

/** Source institutions and their real-world location. */
const INSTITUTIONS = {
  cdta: { city: 'Alger', latitude: 36.6889, longitude: 3.0053 },
  crti: { city: 'Chéraga', latitude: 36.7156, longitude: 2.9581 },
  crm: { city: 'Constantine', latitude: 36.365, longitude: 6.6147 },
  dgrsdt: { city: 'Alger', latitude: 36.7509, longitude: 3.0405 },
  setif: { city: 'Sétif', latitude: 36.1898, longitude: 5.4108 }
};

function institutionOf(organism) {
  const value = String(organism || '').toLowerCase();
  if (value.includes('cdta')) return INSTITUTIONS.cdta;
  if (value.includes('crti')) return INSTITUTIONS.crti;
  if (value.includes('crm')) return INSTITUTIONS.crm;
  if (value.includes('setif') || value.includes('sétif')) return INSTITUTIONS.setif;
  return INSTITUTIONS.dgrsdt;
}

const DOMAIN_RULES = [
  [/cyber/i, 'cybersecurity'],
  [/intelligence artificielle|\bia\b|apprentissage/i, 'ai-computing'],
  [/nano/i, 'nanotech-materials'],
  [/robot/i, 'robotics'],
  [/drone|uav|a[ée]rien/i, 'drones-autonomy'],
  [/sant[ée]|m[ée]dical/i, 'medtech'],
  [/biotech|sciences de la vie|biolog/i, 'biotech-healthtech'],
  [/puce|silicium|risc-v|asic|fpga|semi-conduct/i, 'semiconductors'],
  [/fabrication num[ée]rique|cnc|impression 3d|usinage|r[ée]parabilit|electrom[ée]nager|[ée]lectrom[ée]nager/i, 'manufacturing-3d'],
  [/[ée]nergie|puissance/i, 'energy-storage'],
  [/agriculture|alimentation|aquaculture|[ée]levage/i, 'agritech-foodtech'],
  [/espace|spatial|satellite/i, 'space-aerospace'],
  [/environnement|\beau\b|climat|recyclage/i, 'cleantech'],
  [/iot|domotique|connect[ée]|internet|logiciel|informatique|num[ée]rique/i, 'cloud-iot'],
  [/mesure|instrumentation|[ée]lectronique|capteur/i, 'semiconductors']
];

function domainOf(label) {
  for (const [pattern, domain] of DOMAIN_RULES) {
    if (pattern.test(label)) return domain;
  }
  return 'other-deep-tech';
}

function priorityOf(interest) {
  const value = String(interest || '').toLowerCase();
  if (value.includes('fort')) return 'A';
  if (value.includes('moyen')) return 'B';
  return 'C';
}

function difficultyOf(level) {
  const value = String(level || '').toLowerCase();
  if (value.includes('très')) return { score: 20, technical: 18, capital: 15, market: 25, regulatory: 8 };
  if (value.includes('moins')) return { score: 65, technical: 62, capital: 60, market: 68, regulatory: 20 };
  if (value.includes('difficilement')) return { score: 85, technical: 85, capital: 82, market: 80, regulatory: 25 };
  return { score: 40, technical: 35, capital: 38, market: 47, regulatory: 12 };
}

/** Turns "PFE Master/Ingénieur ; mécatronique–commande–IA" into team rows. */
function teamOf(type) {
  const value = String(type || '').toLowerCase();
  const team = [];
  if (/pfe|licence|master|ing[ée]nieur/.test(value)) {
    team.push(['PFE student (Master/Engineer)', 2]);
    team.push(['Academic supervisor', 1]);
  } else {
    team.push(['Research engineer', 2]);
    team.push(['Project lead', 1]);
  }
  if (/m[ée]catronique/.test(value)) team.push(['Mechatronics engineer', 1]);
  if (/commande/.test(value)) team.push(['Control engineer', 1]);
  if (/\bia\b|intelligence/.test(value)) team.push(['ML engineer', 1]);
  if (/[ée]lectronique/.test(value)) team.push(['Electronics engineer', 1]);
  if (/m[ée]canique/.test(value)) team.push(['Mechanical designer', 1]);
  if (/hydraulique/.test(value)) team.push(['Hydraulics technician', 1]);
  if (/thermique/.test(value)) team.push(['Thermal engineer', 1]);
  if (/automatisme|automatisation/.test(value)) team.push(['Automation engineer', 1]);
  if (/recherche/.test(value)) team.push(['Research engineer', 1]);
  return team;
}

function slugOf(reference, index) {
  const base = String(reference || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return 'oh-' + (base || 'row-' + index);
}

function cell(row, key) {
  return String(row[key] == null ? '' : row[key]).replace(/\s+/g, ' ').trim();
}

function buildRows() {
  const wb = XLSX.readFile(WORKBOOK);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets['Global'], { defval: '' });
  const seen = new Set();
  const out = [];

  rows.forEach((row, index) => {
    const title = cell(row, 'Titre du Projet');
    if (!title) return;

    let id = slugOf(cell(row, 'Réf / ID'), index + 1);
    let suffix = 2;
    while (seen.has(id)) id = slugOf(cell(row, 'Réf / ID'), index + 1) + '-' + suffix++;
    seen.add(id);

    const domainLabel = cell(row, 'Domaine S&T');
    const description = String(row['Description & Spécifications'] || '').replace(/\s+/g, ' ').trim();
    const links = String(row["Lien d'Accès (Dépôt / CAO)"] || '')
      .split(/[\s,;]+/)
      .filter((link) => /^https?:\/\//i.test(link));
    const institution = institutionOf(cell(row, 'Organisme Source'));
    const difficulty = difficultyOf(cell(row, 'Niveau de Difficulté'));
    const budget = cell(row, 'Budget Prototype Estimé (DZD)');
    const interest = cell(row, 'Intérêt Éco. / Besoin');
    const sector = cell(row, 'Secteur / Public Cible');
    const partners = cell(row, 'Partenaires Potentiels');
    const assignment = cell(row, 'Affectation Recommandée');
    const projectType = cell(row, 'Type de Projet Recommandé');
    const organism = cell(row, 'Organisme Source');

    out.push({
      id,
      name: title.slice(0, 120),
      country: 'Algeria',
      domain: domainOf(domainLabel + ' ' + title),
      subDomain: domainLabel || null,
      shortDescription: (description || title).slice(0, 600),
      technology: domainLabel || 'Open hardware',
      yearFounded: null,
      officialSite: links[0] || null,
      sourceUrl: links[1] || links[0] || null,
      whyRelevant:
        `Open-hardware project catalogued by ${organism || 'the national research network'}` +
        (assignment ? ` and recommended for ${assignment}` : '') +
        (sector ? `. Target users: ${sector}` : '.'),
      priority: priorityOf(interest),
      status: 'verified',
      hqCity: institution.city,
      latitude: institution.latitude,
      longitude: institution.longitude,
      concept: description ? description.slice(0, 400) : null,
      mainSellers: partners ? partners.split(/;|\u2022|\|/).map((p) => p.trim()).filter(Boolean) : null,
      teamRec: teamOf(projectType),
      buildApproach: description || null,
      productIssues:
        `Open-hardware build: the main risks are sourcing the ${domainLabel || 'components'} parts locally, ` +
        `hitting machining and calibration tolerances, and certifying the prototype` +
        (budget ? ` within a ${budget} budget` : '') +
        (interest ? `. Economic need: ${interest}` : '.'),
      algeriaValue: sector ? `Serves ${sector}` + (partners ? `; potential partners: ${partners}` : '.') : null,
      difficultyScore: difficulty.score,
      difficultyBreakdown: {
        technical: difficulty.technical,
        capital: difficulty.capital,
        market: difficulty.market,
        regulatory: difficulty.regulatory
      },
      sourceTier: 'S3',
      sourceNote:
        'Imported from Base_Open_Hardware_Consolidee_Structure v3 (Global sheet); analysis fields are platform-generated.'
    });
  });

  return out;
}

async function main() {
  const rows = buildRows();
  const byDomain = {};
  const byCity = {};
  for (const row of rows) {
    byDomain[row.domain] = (byDomain[row.domain] || 0) + 1;
    byCity[row.hqCity] = (byCity[row.hqCity] || 0) + 1;
  }
  console.log('rows prepared:', rows.length);
  console.log('by domain:', JSON.stringify(byDomain));
  console.log('by city:', JSON.stringify(byCity));
  console.log('sample:', JSON.stringify(rows[0], null, 1));
  console.log('sample team:', JSON.stringify(rows[0].teamRec));

  if (mode !== 'apply') {
    console.log('\nDRY RUN — nothing written. Re-run with --apply to insert.');
    return;
  }

  const client = new Client({ connectionString: readDatabaseUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();

  const existing = await client.query("SELECT count(*)::int AS n FROM startups WHERE id LIKE 'oh-%'");
  console.log('existing oh- rows:', existing.rows[0].n);

  let inserted = 0;
  for (const row of rows) {
    const result = await client.query(
      `INSERT INTO startups (
         id, name, country, domain, sub_domain, short_description, technology, year_founded,
         official_site, source_url, why_relevant, priority, status, is_duplicate_2025,
         hq_city, latitude, longitude, concept, main_sellers, team_rec, build_approach,
         product_issues, algeria_value, difficulty_score, difficulty_breakdown, source_tier, source_note
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,FALSE,
         $14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26
       )
       ON CONFLICT (id) DO NOTHING`,
      [
        row.id, row.name, row.country, row.domain, row.subDomain, row.shortDescription,
        row.technology, row.yearFounded, row.officialSite, row.sourceUrl, row.whyRelevant,
        row.priority, row.status,
        row.hqCity, row.latitude, row.longitude, row.concept,
        row.mainSellers ? JSON.stringify(row.mainSellers) : null,
        JSON.stringify(row.teamRec),
        row.buildApproach, JSON.stringify(row.productIssues), row.algeriaValue,
        row.difficultyScore, JSON.stringify(row.difficultyBreakdown),
        row.sourceTier, row.sourceNote
      ]
    );
    inserted += result.rowCount;
  }

  console.log('inserted:', inserted);
  const after = await client.query("SELECT count(*)::int AS n FROM startups WHERE id LIKE 'oh-%'");
  console.log('oh- rows now:', after.rows[0].n);
  await client.end();
}

main().catch((error) => {
  console.error('FAILED:', error.message);
  process.exit(1);
});
