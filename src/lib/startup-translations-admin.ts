import 'server-only';
import {
  query,
  withTransaction,
  ForbiddenError,
  NotFoundError,
  type Actor,
  type UserRole
} from '@/lib/db';
import { logAudit } from '@/lib/audit';

export type TranslationLocale = 'fr' | 'ar';

export interface AdminTranslation {
  startupId: string;
  locale: TranslationLocale;
  name: string;
  country: string | null;
  subDomain: string | null;
  shortDescription: string;
  technology: string;
  whyRelevant: string;
}

function assertRole(actor: Actor, roles: UserRole[]): void {
  if (!roles.includes(actor.role)) {
    throw new ForbiddenError();
  }
}

function mapTranslation(row: Record<string, unknown>): AdminTranslation {
  return {
    startupId: String(row.startup_id),
    locale: String(row.locale) as TranslationLocale,
    name: String(row.name),
    country: row.country ? String(row.country) : null,
    subDomain: row.sub_domain ? String(row.sub_domain) : null,
    shortDescription: String(row.short_description),
    technology: String(row.technology),
    whyRelevant: String(row.why_relevant)
  };
}

async function getTranslationRow(
  startupId: string,
  locale: TranslationLocale
): Promise<AdminTranslation | null> {
  const rows = await query(
    `SELECT startup_id, locale, name, country, sub_domain, short_description,
            technology, why_relevant
     FROM startup_translations WHERE startup_id = $1 AND locale = $2`,
    [startupId, locale]
  );
  return rows.length ? mapTranslation(rows[0]) : null;
}

export async function listStartupTranslationsForAdmin(
  actor: Actor
): Promise<AdminTranslation[]> {
  assertRole(actor, ['reviewer', 'admin']);
  const rows = await query(
    `SELECT startup_id, locale, name, country, sub_domain, short_description,
            technology, why_relevant
     FROM startup_translations ORDER BY startup_id, locale`
  );
  return rows.map(mapTranslation);
}

export async function upsertStartupTranslation(
  actor: Actor,
  input: {
    startupId: string;
    locale: TranslationLocale;
    name: string;
    country?: string;
    subDomain?: string;
    shortDescription: string;
    technology: string;
    whyRelevant: string;
  }
): Promise<AdminTranslation> {
  assertRole(actor, ['reviewer', 'admin']);

  const startupRows = await query<{ id: string }>(
    `SELECT id FROM startups WHERE id = $1`,
    [input.startupId]
  );
  if (!startupRows.length) throw new NotFoundError('Startup not found');

  const before = await getTranslationRow(input.startupId, input.locale);
  const afterData = {
    name: input.name,
    country: input.country?.trim() ? input.country.trim() : null,
    subDomain: input.subDomain?.trim() ? input.subDomain.trim() : null,
    shortDescription: input.shortDescription?.trim(),
    technology: input.technology?.trim(),
    whyRelevant: input.whyRelevant?.trim(),
    locale: input.locale
  };

  await withTransaction(async (client) => {
    void (await client.query(
      `INSERT INTO startup_translations
         (startup_id, locale, name, country, sub_domain, short_description, technology, why_relevant)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (startup_id, locale) DO UPDATE SET
         name = EXCLUDED.name, country = EXCLUDED.country, sub_domain = EXCLUDED.sub_domain,
         short_description = EXCLUDED.short_description, technology = EXCLUDED.technology,
         why_relevant = EXCLUDED.why_relevant, updated_at = now()`,
      [
        input.startupId,
        input.locale,
        afterData.name,
        afterData.country,
        afterData.subDomain,
        afterData.shortDescription,
        afterData.technology,
        afterData.whyRelevant
      ]
    ));
    await logAudit({
      actorId: actor.id,
      action: 'translation_upsert',
      entityType: 'startup',
      entityId: input.startupId,
      beforeData: before ?? null,
      afterData
    }, client);
  });

  const after = await getTranslationRow(input.startupId, input.locale);
  if (!after) throw new Error('Failed to save translation');
  return after;
}

export async function deleteStartupTranslation(
  actor: Actor,
  startupId: string,
  locale: TranslationLocale
): Promise<boolean> {
  assertRole(actor, ['reviewer', 'admin']);

  const before = await getTranslationRow(startupId, locale);
  if (!before) return false;

  await withTransaction(async (client) => {
    void (await client.query(
      `DELETE FROM startup_translations WHERE startup_id = $1 AND locale = $2`,
      [startupId, locale]
    ));
    await logAudit({
      actorId: actor.id,
      action: 'translation_delete',
      entityType: 'startup',
      entityId: startupId,
      beforeData: before,
      afterData: null
    }, client);
  });

  return true;
}