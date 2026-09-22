import type { PublicStartup } from './db';

export interface StartupTranslationRow {
  startup_id: string;
  name: string;
  country: string | null;
  sub_domain: string | null;
  short_description: string;
  technology: string;
  why_relevant: string;
  history: string | null;
  hq_city: string | null;
  concept?: string | null;
  main_sellers?: unknown;
  team_rec?: unknown;
  build_approach?: string | null;
  product_issues?: string | null;
  algeria_value?: string | null;
}

function mapTeamRec(value: unknown): Array<{ role: string; count: number }> | null {
  if (!Array.isArray(value)) return null;
  return value.map((r) => {
    const pair = Array.isArray(r) ? (r as unknown[]) : [r];
    return { role: String(pair[0] ?? ''), count: Number(pair[1]) || 1 };
  });
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
    whyRelevant: tr.why_relevant,
    history: tr.history ?? startup.history,
    hqCity: tr.hq_city ?? startup.hqCity,
    concept: tr.concept ?? startup.concept,
    mainSellers: Array.isArray(tr.main_sellers)
      ? tr.main_sellers.map(String)
      : startup.mainSellers,
    teamRec: mapTeamRec(tr.team_rec) ?? startup.teamRec,
    buildApproach: tr.build_approach ?? startup.buildApproach,
    productIssues: tr.product_issues ?? startup.productIssues,
    algeriaValue: tr.algeria_value ?? startup.algeriaValue
  };
}