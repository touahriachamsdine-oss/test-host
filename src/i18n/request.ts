import * as rootParams from 'next/root-params';
import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ locale }) => {
  // Read the `[locale]` segment unless an explicit override was provided
  // (e.g. from a Server Action).
  if (!locale) {
    const paramValue = await rootParams.locale();
    if (hasLocale(routing.locales, paramValue)) {
      locale = paramValue;
    } else {
      // Runtime validation for unknown locales
      notFound();
    }
  }

  return {
    locale,
    timeZone: 'Africa/Algiers',
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});