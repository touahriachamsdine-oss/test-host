import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

const SECTIONS = ['usage', 'accounts', 'content', 'ip', 'privacy', 'cookies', 'liability', 'contact'] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Policy');
  return {
    title: t('title'),
    description: t('intro')
  };
}

export default async function PolicyPage() {
  const t = await getTranslations('Policy');

  return (
    <section className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6">
      <div className="card-soft overflow-hidden rounded-2xl p-6 sm:p-10">
        <p dir="ltr" className="font-mono text-sm leading-5 text-ink/50">
          {t('lastUpdated')}
        </p>
        <h1 className="mt-3 text-[32px] font-semibold leading-10 tracking-tight text-ink">
          {t('title')}
        </h1>
        <p className="mt-3 text-base leading-[26px] text-ink/70">{t('intro')}</p>

        <div className="mt-10 divide-y divide-line/50 border-t border-line/50">
          {SECTIONS.map((section) => (
            <section key={section} className="py-6">
              <h2 className="text-base font-semibold leading-6 text-ink">
                {t(`${section}.title`)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink/70">{t(`${section}.body`)}</p>
              {section === 'contact' && (
                <p className="mt-3 text-sm font-medium text-signal">{t('contact.credit')}</p>
              )}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}