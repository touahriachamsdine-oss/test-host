import { getDomain } from '@/data/domains';

export function referenceCode(domainSlug?: string, refNo?: number): string {
  const abbr = domainSlug ? getDomain(domainSlug)?.code : undefined;
  if (!abbr) return refNo != null ? String(refNo).padStart(3, '0') : '';
  if (refNo == null) return abbr;
  return `${abbr} · ${String(refNo).padStart(3, '0')}`;
}