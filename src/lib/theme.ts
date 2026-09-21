export const THEME_STORAGE_KEY = 'deeptech.theme';

export type ThemeSetting = 'system' | 'light' | 'dark' | 'night';
export type ResolvedTheme = 'light' | 'dark' | 'night';

export const themeSettings: ThemeSetting[] = ['system', 'light', 'dark', 'night'];

export function systemIsDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
}

export function resolveTheme(setting: ThemeSetting, prefersDark: boolean): ResolvedTheme {
  if (setting === 'system') return prefersDark ? 'dark' : 'light';
  return setting;
}

export function getStoredTheme(): ThemeSetting | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return value === 'light' || value === 'dark' || value === 'night' || value === 'system'
    ? value
    : null;
}

export function applyTheme(
  setting: ThemeSetting,
  opts: { persist?: boolean } = {}
): ResolvedTheme {
  const resolved = resolveTheme(setting, systemIsDark());
  document.documentElement.setAttribute('data-theme', resolved);
  if (opts.persist) window.localStorage.setItem(THEME_STORAGE_KEY, setting);
  return resolved;
}

let currentSetting: ThemeSetting = 'system';
const listeners = new Set<() => void>();

function readStoredSetting(): ThemeSetting {
  return getStoredTheme() ?? 'system';
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getThemeSnapshot(): ThemeSetting {
  return currentSetting;
}

export function getThemeServerSnapshot(): ThemeSetting {
  return 'system';
}

export function syncThemeFromStorage(): ThemeSetting {
  const value = readStoredSetting();
  if (value !== currentSetting) {
    currentSetting = value;
    listeners.forEach((listener) => listener());
  }
  applyTheme(value);
  return value;
}

export function setThemePreference(value: ThemeSetting) {
  currentSetting = value;
  window.localStorage.setItem(THEME_STORAGE_KEY, value);
  applyTheme(value);
  listeners.forEach((listener) => listener());
}