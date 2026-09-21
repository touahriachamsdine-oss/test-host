import { getTranslations } from 'next-intl/server';
import { DOMAINS } from '@/data/domains';

async function DomainGroup() {
  const names = await getTranslations('domainNames');
  return (
    <div className="marquee-group" aria-hidden>
      {DOMAINS.map((domain) => (
        <span key={domain.slug} className="mx-6 flex items-center gap-3">
          <span dir="ltr" className="font-mono text-sm font-medium tabular-nums text-signal">
            {domain.code}
          </span>
          <span className="text-sm text-ink/60">{names(domain.slug)}</span>
        </span>
      ))}
    </div>
  );
}

export async function MarqueeStrip() {
  const t = await getTranslations('Domains');
  const group = await DomainGroup();
  return (
    <section
      aria-label={t('title')}
      className="marquee mx-auto mt-12 max-w-6xl py-4 sm:px-6"
    >
      <div dir="ltr" className="marquee-inner marquee-track">
        {group}
        {group}
      </div>
    </section>
  );
}