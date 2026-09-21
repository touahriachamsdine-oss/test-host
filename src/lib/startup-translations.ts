import type { PublicStartup } from './db';

export interface StartupTranslationRow {
  startup_id: string;
  name: string;
  country: string | null;
  sub_domain: string | null;
  short_description: string;
  technology: string;
  why_relevant: string;
}

export function applyStartupTranslation(
  startup: PublicStartup,
  tr: StartupTranslationRow | null | undefined
): PublicStartup {
  if (!tr) return startup;
  return {
    ...startup,
    name: tr.name,
    country: tr.country ?? startup.country,
    subDomain: tr.sub_domain ?? startup.subDomain,
    shortDescription: tr.short_description,
    technology: tr.technology,
    whyRelevant: tr.why_relevant
  };
}