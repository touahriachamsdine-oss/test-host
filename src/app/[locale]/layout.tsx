import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { SessionProvider } from 'next-auth/react';
import {
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  IBM_Plex_Sans_Arabic
} from 'next/font/google';

import { routing } from '@/i18n/routing';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AmbientBackground } from '@/components/AmbientBackground';
import '../../globals.css';

const plex = IBM_Plex_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex',
  display: 'swap'
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-arabic',
  display: 'swap'
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap'
});

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
        className={`${plex.variable} ${plexArabic.variable} ${plexMono.variable} font-sans bg-paper text-ink antialiased`}
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
            <main>{children}</main>
            <Footer />
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}