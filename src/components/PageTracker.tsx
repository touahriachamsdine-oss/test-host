'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

function startupIdFromPath(pathname: string): string | undefined {
  const match = pathname.match(/\/startup\/([^/?#]+)/);
  if (!match) return undefined;
  const id = decodeURIComponent(match[1]);
  return id === 'undefined' ? undefined : id;
}

export function PageTracker() {
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) return;
    const payload = JSON.stringify({
      path: pathname,
      startupId: startupIdFromPath(pathname),
      locale
    });
    const timer = window.setTimeout(() => {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }, 400);
    return () => window.clearTimeout(timer);
  }, [pathname, locale]);

  return null;
}
