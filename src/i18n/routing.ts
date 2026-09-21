import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ar', 'fr', 'en'],
  defaultLocale: 'ar',
  // Root path = Arabic (default locale), other locales get a prefix like /fr, /en
  localePrefix: 'as-needed'
});

export type Locale = (typeof routing.locales)[number];