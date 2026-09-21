import 'server-only';
import { query, withTransaction, type Actor } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { importRowSchema } from '@/lib/validation';
import { DOMAINS } from '@/data/domains';
import frMessages from '../../messages/fr.json';
import type { DomainCandidate } from '@/lib/import-parse';
import { resolveDomain, parseDuplicateValue } from '@/lib/import-parse';

export interface ImportOutcomeRow {
  line: number;
  name?: string;
  reason: string;
}

export interface ImportResult {
  imported: number;
  skipped: ImportOutcomeRow[];
  errors: ImportOutcomeRow[];
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length ? base : 'imported';
}

function withScheme(value: string): string {
  const v = value.trim();
  if (!v) return v;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export async function getImportCandidates(): Promise<DomainCandidate[]> {
  const metaRows = await query<{ slug: string; label_en: string; label_ar: string }>(
    `SELECT slug, label_en, label_ar FROM domain_meta`
  );
  const metaBySlug = new Map(metaRows.map((r) => [r.slug, r]));
  const frNames = frMessages.domainNames as unknown as Record<string, string>;

  return DOMAINS.map((d) => {
    const meta = metaBySlug.get(d.slug);
    return {
      slug: d.slug,
      code: d.code,
      labelEn: meta?.label_en ?? d.slug,
      labelAr: meta?.label_ar ?? d.slug,
      labelFr: frNames[d.slug] ?? d.slug
    };
  });
}

export async function importStartupRows(
  actor: Actor,
  items: { line: number; row: Record<string, unknown> }[]
): Promise<ImportResult> {
  if (actor.role !== 'reviewer' && actor.role !== 'admin') {
    throw new Error('Forbidden');
  }

  const candidates = await getImportCandidates();

  const teamRows = await query<{ domain_slug: string; code: string }>(
    `SELECT domain_slug, code FROM teams`
  );
  const teamByDomain = new Map(teamRows.map((r) => [r.domain_slug, r.code]));

  const existing = await query<{ id: string; name: string }>(`SELECT id, name FROM startups`);
  const knownNames = new Set(existing.map((r) => r.name.toLowerCase().trim()));
  const usedIds = new Set(existing.map((r) => r.id));

  const errors: ImportOutcomeRow[] = [];
  const skipped: ImportOutcomeRow[] = [];
  const inserts: {
    id: string;
    line: number;
    name: string;
    country: string;
    domain: string;
    subDomain: string;
    shortDescription: string;
    technology: string;
    yearFounded: number | null;
    officialSite: string;
    sourceUrl: string;
    whyRelevant: string;
    priority: string;
    isDuplicate2025: boolean;
    teamCode: string | null;
  }[] = [];

  for (const item of items) {
    const { line, row } = item;
    const str = (v: unknown): string =>
      typeof v === 'string' ? v.trim() : v == null ? '' : String(v);
    const cell = (key: string): string => str((row as Record<string, unknown>)[key]);

    const rawName = cell('name');

    if (!rawName) {
      if (!cell('shortDescription') && !cell('domain')) continue;
      errors.push({ line, reason: 'name_required' });
      continue;
    }

    const resolved = resolveDomain(candidates, cell('domain'));
    if (!resolved) {
      errors.push({ line, reason: `unknown_domain: ${cell('domain') || '(vide)'}` });
      continue;
    }

    const yearRaw = cell('yearFounded');
    const yearFounded =
      yearRaw === '' ? null : Number(yearRaw.replace(/[^\d-]/g, '')) || null;

    const parsed = importRowSchema.safeParse({
      name: rawName,
      country: cell('country') || 'Algeria',
      domain: resolved.slug,
      subDomain: cell('subDomain'),
      shortDescription: cell('shortDescription'),
      technology: cell('technology'),
      yearFounded,
      officialSite: withScheme(cell('officialSite')),
      sourceUrl: withScheme(cell('sourceUrl')),
      whyRelevant: cell('whyRelevant'),
      priority: (cell('priority') || 'C').toUpperCase(),
      isDuplicate2025: parseDuplicateValue(cell('isDuplicate2025')) ?? false
    });

    if (!parsed.success) {
      const first = parsed.error.issues[0];
      errors.push({ line, reason: `${first.path.join('.')}: ${first.message}` });
      continue;
    }

    const d = parsed.data;
    const normalizedName = d.name.toLowerCase().trim();
    if (knownNames.has(normalizedName)) {
      skipped.push({ line, name: d.name, reason: 'duplicate_name' });
      continue;
    }
    knownNames.add(normalizedName);

    let id = slugify(d.name);
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${slugify(d.name)}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);

    inserts.push({
      id,
      line,
      name: d.name,
      country: d.country,
      domain: d.domain,
      subDomain: d.subDomain ?? '',
      shortDescription: d.shortDescription,
      technology: d.technology ?? '',
      yearFounded: d.yearFounded,
      officialSite: d.officialSite ?? '',
      sourceUrl: d.sourceUrl ?? '',
      whyRelevant: d.whyRelevant ?? '',
      priority: d.priority,
      isDuplicate2025: d.isDuplicate2025,
      teamCode: teamByDomain.get(d.domain) ?? null
    });
  }

  let imported = 0;
  if (inserts.length > 0) {
    await withTransaction(async (client) => {
      for (const ins of inserts) {
        await client.query(
          `INSERT INTO startups (
             id, name, country, domain, sub_domain, short_description, technology,
             year_founded, official_site, source_url, why_relevant, priority, status,
             is_duplicate_2025, submitted_by_team, submitted_by_team_code
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending',$13,$14,$15)`,
          [
            ins.id,
            ins.name,
            ins.country,
            ins.domain,
            ins.subDomain || null,
            ins.shortDescription,
            ins.technology || '',
            ins.yearFounded,
            ins.officialSite || null,
            ins.sourceUrl || null,
            ins.whyRelevant || '',
            ins.priority,
            ins.isDuplicate2025,
            actor.id,
            ins.teamCode
          ]
        );
      }
      await logAudit(
        {
          actorId: actor.id,
          action: 'bulk_import',
          entityType: 'startup',
          entityId: `import/${Date.now()}`,
          afterData: { imported: inserts.length, skipped, errors }
        },
        client
      );
    });
    imported = inserts.length;
  }

  return { imported, skipped, errors };
}