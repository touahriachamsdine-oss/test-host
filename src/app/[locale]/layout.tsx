import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { SessionProvider } from 'next-auth/react';

import { routing } from '@/i18n/routing';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AmbientBackground } from '@/components/AmbientBackground';
import { PageTracker } from '@/components/PageTracker';
import { ServiceWorker } from '@/components/ServiceWorker';
import '../../globals.css';

const plexVariable = '--font-plex';
const plexArabicVariable = '--font-plex-arabic';
const plexMonoVariable = '--font-plex-mono';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return {
    title: t('title'),
    description: t('description')
  };
}

export default async function LocaleLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body
        className={`${plexVariable} ${plexArabicVariable} ${plexMonoVariable} font-sans bg-paper text-ink antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='deeptech.theme';var s=localStorage.getItem(k);var d;if(!s||s==='system'){d=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'}else{d=s}document.documentElement.setAttribute('data-theme',d)}catch(e){document.documentElement.setAttribute('data-theme','light')}})();`
          }}
        />
        <AmbientBackground />
        <NextIntlClientProvider>
          <SessionProvider>
            <Navbar />
            <PageTracker />
            <main>{children}</main>
            <Footer />
            <ServiceWorker />
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}