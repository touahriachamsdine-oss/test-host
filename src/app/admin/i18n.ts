import { cookies } from 'next/headers';
import { hasLocale } from 'next-intl';
import { routing, type Locale } from '../../i18n/routing';
import en from '../../../messages/en.json';
import fr from '../../../messages/fr.json';
import ar from '../../../messages/ar.json';

const adminMessages: Record<Locale, typeof en> = { en, fr, ar };

export type AdminMessages = typeof en;

export const adminFallbackLocale: Locale = 'fr';
const ADMIN_LOCALE_COOKIE = 'NEXT_LOCALE';

export async function getAdminLocale(): Promise<Locale> {
  const cookieValue = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value;
  if (cookieValue && hasLocale(routing.locales, cookieValue)) {
    return cookieValue;
  }
  return adminFallbackLocale;
}

export async function getAdminMessages() {
  const locale = await getAdminLocale();
  return adminMessages[locale];
}