import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import { usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const localeLabels: Record<string, string> = {
  ar: 'العربية',
  fr: 'Français',
  en: 'English'
};

export function LangSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('LangSwitcher');

  return (
    <div className="ms-1 flex h-11 items-center gap-1 rounded-md border border-transparent px-2 transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:border-line/70 hover:bg-line/10 motion-reduce:transition-none">
      <Globe size={14} className="text-ink/40" aria-hidden />
      <select
        aria-label={t('ariaLabel')}
        className="ring-focus bg-transparent text-sm font-medium text-ink/70 focus:outline-none"
        value={locale}
        onChange={(e) => {
          const next = e.target.value;
          if (next === locale) return;
          document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;SameSite=Lax`;
          window.location.href = next === routing.defaultLocale ? pathname : `/${next}${pathname}`;
        }}
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeLabels[loc]}
          </option>
        ))}
      </select>
    </div>
  );
}