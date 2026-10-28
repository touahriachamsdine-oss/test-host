export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://test-host-pi.vercel.app').replace(/\/+$/, '');

const PREFIX: Record<string, string> = { ar: '', fr: '/fr', en: '/en' };

export function localizedPath(locale: string, path: string): string {
  const prefix = PREFIX[locale] ?? '';
  const clean = path === '/' ? '' : path;
  return `${SITE_URL}${prefix}${clean}`;
}

/**
 * hreflang set for a path without its locale prefix.
 * Arabic is the default locale, so it lives at the unprefixed URL.
 */
export function alternatesFor(path: string) {
  return {
    canonical: localizedPath('ar', path),
    languages: {
      ar: localizedPath('ar', path),
      fr: localizedPath('fr', path),
      en: localizedPath('en', path),
      'x-default': localizedPath('ar', path)
    }
  };
}
