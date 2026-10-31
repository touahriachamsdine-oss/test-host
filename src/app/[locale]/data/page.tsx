import { getTranslations } from 'next-intl/server';
import { Download, FileJson, Database } from 'lucide-react';
import { getPublicStats } from '@/lib/public-startups';
import { DATASET_LICENSE, DATASET_SCHEMA, DATASET_VERSION } from '@/lib/dataset';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Data' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function DataPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Data' });
  const stats = await getPublicStats();
  const number = new Intl.NumberFormat(locale as Locale).format;

  const tiles = [
    { label: t('entriesLabel'), value: number(stats.entries) },
    { label: t('domainsLabel'), value: number(stats.domains) },
    { label: t('countriesLabel'), value: number(stats.countries) },
    { label: t('mappedLabel'), value: number(stats.mapped) }
  ];

  const examples = [
    '/api/data/startups?perPage=100',
    '/api/data/startups?domain=health&perPage=100',
    '/api/data/startups?country=Algeria&buildable=easy',
    '/api/data/startups?buildable=open-hardware&format=csv'
  ];

  return (
    <section className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('title')}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">{t('subtitle')}</p>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-line/50 bg-paper/70 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-wide text-ink/45">{tile.label}</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{tile.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page */}
        <a
          href="/api/data/startups?format=csv"
          className="ring-focus group rounded-2xl border border-line/60 bg-paper p-5 transition-colors hover:border-signal/50"
        >
          <Download size={18} aria-hidden className="text-signal" />
          <h2 className="mt-3 text-sm font-medium text-ink">{t('downloadCsv')}</h2>
          <p className="mt-1 text-xs leading-5 text-ink/55">{t('downloadCsvHint')}</p>
        </a>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page */}
        <a
          href="/api/data/startups?perPage=100"
          className="ring-focus group rounded-2xl border border-line/60 bg-paper p-5 transition-colors hover:border-signal/50"
        >
          <FileJson size={18} aria-hidden className="text-signal" />
          <h2 className="mt-3 text-sm font-medium text-ink">{t('downloadJson')}</h2>
          <p className="mt-1 text-xs leading-5 text-ink/55">{t('downloadJsonHint')}</p>
        </a>
      </div>

      <div className="mt-6 rounded-xl border border-line/50 bg-surface/30 px-4 py-3 text-xs leading-5 text-ink/55">
        <span className="font-medium text-ink/70">{t('licenseLabel')}:</span> {DATASET_LICENSE} ·{' '}
        <span className="font-medium text-ink/70">{t('versionLabel')}:</span> {DATASET_VERSION} ·{' '}
        {t('licenseNote')}
      </div>

      <div className="mt-10">
        <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
          <Database size={15} aria-hidden className="text-ink/50" />
          {t('schemaTitle')}
        </h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-line/50">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line/60 bg-surface/40 text-start">
                <th className="px-3 py-2 text-start text-[11px] uppercase tracking-wide text-ink/45">
                  {t('columnName')}
                </th>
                <th className="px-3 py-2 text-start text-[11px] uppercase tracking-wide text-ink/45">
                  {t('columnType')}
                </th>
                <th className="px-3 py-2 text-start text-[11px] uppercase tracking-wide text-ink/45">
                  {t('columnNote')}
                </th>
              </tr>
            </thead>
            <tbody>
              {DATASET_SCHEMA.map((column) => (
                <tr key={column.name} className="border-b border-line/40 last:border-0">
                  <td className="px-3 py-2 font-mono text-xs text-ink">{column.name}</td>
                  <td className="px-3 py-2 text-xs text-ink/55">{column.type}</td>
                  <td className="px-3 py-2 text-xs text-ink/65">{column.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-medium text-ink">{t('apiTitle')}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">{t('apiText')}</p>
        <ul className="mt-3 space-y-2">
          {examples.map((example) => (
            <li key={example}>
              <code className="block overflow-x-auto rounded-lg border border-line/50 bg-paper px-3 py-2 font-mono text-xs text-ink/75">
                {example}
              </code>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
