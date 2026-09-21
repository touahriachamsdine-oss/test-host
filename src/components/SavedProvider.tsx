'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';

type SavedContextValue = {
  ids: string[];
  toggleSaved: (id: string) => void;
};

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({
  initialIds,
  children
}: {
  initialIds: string[];
  children: React.ReactNode;
}) {
  const [ids, setIds] = useState(initialIds);
  const router = useRouter();
  const pathname = usePathname();

  const redirectToLogin = useCallback(() => {
    setIds([]);
    router.push(`/login?callbackUrl=${encodeURIComponent(pathname || '/')}`);
  }, [pathname, router]);

  const revertToggle = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleSaved = useCallback(
    (id: string) => {
      setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
      fetch('/api/me/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupId: id })
      })
        .then((res) => {
          if (res.status === 401) {
            redirectToLogin();
            return;
          }
          if (!res.ok) revertToggle(id);
        })
        .catch(() => revertToggle(id));
    },
    [redirectToLogin, revertToggle]
  );

  const value = useMemo(() => ({ ids, toggleSaved }), [ids, toggleSaved]);

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved(): SavedContextValue {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved must be used within a SavedProvider');
  return ctx;
}