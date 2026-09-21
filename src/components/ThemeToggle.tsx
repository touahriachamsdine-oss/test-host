'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Monitor, Moon, MoonStar, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  applyTheme,
  getThemeServerSnapshot,
  getThemeSnapshot,
  setThemePreference,
  subscribeTheme,
  syncThemeFromStorage,
  type ThemeSetting
} from '@/lib/theme';

const options: { value: ThemeSetting; icon: typeof Sun }[] = [
  { value: 'system', icon: Monitor },
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'night', icon: MoonStar }
];

export function ThemeToggle() {
  const t = useTranslations('Theme');
  const setting = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  );

  useEffect(() => {
    const stored = syncThemeFromStorage();
    if (stored !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <div
      className="ms-1 flex items-center divide-x divide-line/70 rounded-md border border-line/70"
      role="group"
      aria-label={t('label')}
    >
      {options.map((o) => {
        const Icon = o.icon;
        const active = setting === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            aria-label={t(o.value)}
            onClick={() => setThemePreference(o.value)}
            className={`ring-focus focus:z-10 flex h-11 w-11 items-center justify-center transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] motion-reduce:transition-none ${
              active ? 'bg-ink text-paper' : 'text-ink/60 hover:bg-line/20 hover:text-ink'
            }`}
          >
            <Icon size={16} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}