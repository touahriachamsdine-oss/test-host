import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import { getTranslations } from 'next-intl/server';
import { getAdminLocale } from './i18n';
import '../../globals.css';
import './admin.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap'
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: 'Admin' });
  return {
    title: t('metadata.title'),
    robots: { index: false, follow: false }
  };
}

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const locale = await getAdminLocale();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body
        className={`${cairo.variable} font-sans min-h-screen bg-slate-950 text-slate-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}