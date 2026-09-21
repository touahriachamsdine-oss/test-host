export interface DomainCandidate {
  slug: string;
  code: string;
  labelEn: string;
  labelAr: string;
  labelFr: string;
}

export const IMPORTABLE_FIELDS: string[] = [
  'name',
  'country',
  'domain',
  'subDomain',
  'shortDescription',
  'technology',
  'yearFounded',
  'officialSite',
  'sourceUrl',
  'whyRelevant',
  'priority',
  'isDuplicate2025'
];

const FIELD_ALIASES: Record<string, string[]> = {
  name: ['name', 'nom', 'إسم', 'الاسم', 'اسم', 'societe', 'société', 'entreprise', 'company', 'startup', 'start-up', 'raison', 'title'],
  country: ['country', 'pays', 'بلد', 'البلد', 'دولة'],
  domain: ['domain', 'domaine', 'مجال', 'المجال', 'secteur', 'sector', 'code', 'category', 'categorie', 'catégorie', 'grappe'],
  subDomain: ['subdomain', 'sous-domaine', 'sub-domaine', 'specialite', 'spécialité', 'specialty', 'اختصاص', 'التخصص', 'niche'],
  shortDescription: ['shortdescription', 'description', 'desc', 'descriptif', 'pitch', 'الوصف', 'وصف'],
  technology: ['technology', 'techno', 'technologie', 'تقنية', 'التقنية', 'التكنولوجيا', 'tech', 'stack'],
  yearFounded: ['year', 'yearfounded', 'foundedyear', 'annee', 'annee de creation', 'année', 'création', 'creation', 'fondation', 'سنة', 'العام', 'سنة التأسيس', 'سن'],
  officialSite: ['officialsite', 'site', 'website', 'siteweb', 'site officiel', 'موقع', 'الموقع', 'web'],
  sourceUrl: ['source', 'sourceurl', 'lien', 'link', 'url source', 'source link', 'مصدر', 'المصدر', 'رابط'],
  whyRelevant: ['why', 'whyrelevant', 'pertinent', 'pertinence', 'pourquoi', 'importance', 'interet', 'intérêt', 'impact', 'لماذا', 'الأهمية'],
  priority: ['priority', 'priorite', 'priorité', 'palier', 'niveau', 'tier', 'أولوية', 'الأولوية'],
  isDuplicate2025: ['duplicate', 'doublon', 'duplicata', 'isduplicate2025', 'doublon2025', 'مكرر', 'تكرار', 'existant']
};

export function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();
}

export function keyOfCell(value: string): string | null {
  const key = normalizeKey(value);
  if (!key) return null;
  for (const field of IMPORTABLE_FIELDS) {
    const aliases = FIELD_ALIASES[field];
    if (aliases.some((a) => normalizeKey(a) === key)) return field;
  }
  return null;
}

export function parseDelimited(text: string): {
  rows: string[][];
  lineNumbers: number[];
  delimiter: string;
} {
  const rawLines = text.split(/\r?\n/);
  const first = rawLines.find((l) => l.trim().length > 0) ?? '';
  const hasTab = first.includes('\t');
  const semis = (first.match(/;/g) ?? []).length;
  const commas = (first.match(/,/g) ?? []).length;
  const pipes = (first.match(/\|/g) ?? []).length;
  const delimiter =
    hasTab ? '\t'
    : pipes > Math.max(semis, commas) ? '|'
    : semis > commas ? ';'
    : ',';

  const rows: string[][] = [];
  const lineNumbers: number[] = [];

  rawLines.forEach((line, idx) => {
    const cells: string[] = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cell += '"';
            i += 1;
          } else {
            inQuotes = false;
          }
        } else {
          cell += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        cells.push(cell);
        cell = '';
      } else {
        cell += ch;
      }
    }
    cells.push(cell);
    rows.push(cells);
    lineNumbers.push(idx + 1);
  });

  return { rows, lineNumbers, delimiter };
}

export function buildImportRows(text: string): {
  data: { line: number; row: Record<string, string> }[];
  delimiter: string;
  hasHeader: boolean;
  mapping: Record<string, number | null>;
  headerRow: string[];
} {
  const { rows, lineNumbers, delimiter } = parseDelimited(text);
  const nonEmpty: { cells: string[]; line: number }[] = [];
  rows.forEach((cells, i) => {
    if (cells.some((c) => c.trim().length > 0)) {
      nonEmpty.push({ cells, line: lineNumbers[i] });
    }
  });

  let hasHeader = false;
  let mapping: Record<string, number | null> = {};
  let headerRow: string[] = [];
  let startIndex = 0;

  if (nonEmpty.length > 0) {
    const probe = nonEmpty[0].cells;
    const recognized = probe.map((c) => keyOfCell(c));
    const uniqueMatched = recognized.filter((k) => k !== null && k !== undefined);
    if (uniqueMatched.length >= 3) {
      hasHeader = true;
      headerRow = probe;
      startIndex = 1;
      const used = new Set<string>();
      probe.forEach((cell, col) => {
        const key = keyOfCell(cell);
        if (key && !used.has(key)) {
          mapping[key] = col;
          used.add(key);
        }
      });
    } else {
      mapping = {};
      IMPORTABLE_FIELDS.forEach((field, col) => {
        mapping[field] = col;
      });
    }
  } else {
    mapping = {};
    IMPORTABLE_FIELDS.forEach((field, col) => {
      mapping[field] = col;
    });
  }

  const data: { line: number; row: Record<string, string> }[] = [];
  nonEmpty.slice(startIndex).forEach(({ cells, line }) => {
    const row: Record<string, string> = {};
    for (const field of IMPORTABLE_FIELDS) {
      const col = mapping[field];
      if (col != null && cells[col] !== undefined) {
        row[field] = cells[col].trim();
      } else {
        row[field] = '';
      }
    }
    data.push({ line, row });
  });

  return {
    data,
    delimiter: delimiter === '\t' ? 'tab' : delimiter,
    hasHeader,
    mapping,
    headerRow
  };
}

export function resolveDomain(
  candidates: DomainCandidate[],
  value: string
): DomainCandidate | undefined {
  const needle = normalizeKey(value);
  if (!needle) return undefined;
  return candidates.find((c) => {
    const options = [c.slug, c.code, c.labelEn, c.labelFr, c.labelAr].map((s) => normalizeKey(s ?? ''));
    return options.includes(needle);
  });
}

export function parseDuplicateValue(value: string): boolean | undefined {
  const v = normalizeKey(value);
  if (!v) return undefined;
  if (['oui', 'yes', 'true', '1', 'o', 'نعم', 'y'].includes(v)) return true;
  if (['non', 'no', 'false', '0', 'n', 'لا'].includes(v)) return false;
  return undefined;
}