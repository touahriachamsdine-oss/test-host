import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { getUnit } from '@/data/units';
import { getVerifiedByDomains } from '@/lib/public-startups';
import { getMemberSavedIdsSafe } from '@/lib/savedIds';
import { DomainExplorer } from '@/components/DomainExplorer';
import { SavedProvider } from '@/components/SavedProvider';
import { UnitNav } from '@/components/UnitNav';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const unit = getUnit(slug);
  if (!unit) return {};
  const names = await getTranslations('unitNames');
  return { title: names(slug) };
}

export default async function UnitPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const unit = getUnit(slug);
  if (!unit) notFound();

  const names = await getTranslations('unitNames');
  const taglines = await getTranslations('unitTaglines');
  const descriptions = await getTranslations('unitDescriptions');
  const unitsT = await getTranslations('Units');
  const domainNames = await getTranslations('domainNames');
  const locale = (await getLocale()) as Locale;

  const startups = await getVerifiedByDomains(unit.domains, locale);
  const initialIds = await getMemberSavedIdsSafe();
  const Icon = unit.icon;

  return (
    <section className="mx-auto grid max-w-6xl grid-guard px-4 pb-16 pt-10 sm:px-6">
      <Link
        href="/units"
        className="inline-flex items-center gap-2 rounded-[3px] text-sm text-ink/60 underline underline-offset-2 ring-focus transition-[color,transform] duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:text-ink active:scale-[0.99] motion-reduce:active:scale-100"
      >
        <span aria-hidden>←</span>
        {unitsT('backToUnits')}
      </Link>

      <header className="mt-6 pb-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span dir="ltr" className="font-mono text-sm font-medium leading-5 text-signal">
            {unit.code}
          </span>
          <h1 className="text-[32px] font-semibold leading-10 tracking-tight text-ink">
            {names(unit.slug)}
          </h1>
          <Icon size={22} aria-hidden className="text-ink/35" />
        </div>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">{taglines(unit.slug)}</p>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-ink/75">
          {descriptions(unit.slug)}
        </p>

        <p className="mt-4 text-sm text-ink/60">{unitsT('count', { count: startups.length })}</p>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-ink/45">{unitsT('focusLabel')}</span>
          {unit.domains.map((domain) => (
            <Link
              key={domain}
              href={`/domain/${domain}`}
              className="ring-focus rounded-full border border-line/60 px-2.5 py-0.5 text-xs text-ink/60 transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:border-signal hover:text-signal"
            >
              {domainNames(domain)}
            </Link>
          ))}
        </div>
      </header>

      <UnitNav current={unit.slug} />

      <SavedProvider initialIds={initialIds}>
        <DomainExplorer startups={startups} />
      </SavedProvider>
    </section>
  );
}
