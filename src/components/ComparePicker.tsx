'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface Suggestion {
  id: string;
  name: string;
  country: string;
}

export function ComparePicker({ a, b }: { a: string | null; b: string | null }) {
  const t = useTranslations('Compare');
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [slot, setSlot] = useState<'a' | 'b'>(a ? 'b' : 'a');

  useEffect(() => {
    const trimmed = query.trim();
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (trimmed.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`/api/startups?q=${encodeURIComponent(trimmed)}`);
        const data = (await response.json()) as { startups?: Suggestion[] };
        if (!cancelled) setResults((data.startups ?? []).slice(0, 8));
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, trimmed.length < 2 ? 0 : 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  function choose(id: string) {
    const nextA = slot === 'a' ? id : a;
    const nextB = slot === 'b' ? id : b;
    const params = new URLSearchParams();
    if (nextA) params.set('a', nextA);
    if (nextB) params.set('b', nextB);
    setQuery('');
    setResults([]);
    setSlot(nextA && nextB ? 'a' : nextA ? 'b' : 'a');
    router.push(`/compare?${params.toString()}`);
  }

  function clear(target: 'a' | 'b') {
    const nextA = target === 'a' ? null : a;
    const nextB = target === 'b' ? null : b;
    const params = new URLSearchParams();
    if (nextA) params.set('a', nextA);
    if (nextB) params.set('b', nextB);
    setSlot(target);
    router.push(`/compare${params.size ? `?${params.toString()}` : ''}`);
  }

  return (
    <div className="mt-6 max-w-2xl">
      <div className="flex items-center gap-2 text-xs text-ink/50">
        <span>{t('addingSlot', { slot: slot === 'a' ? 'A' : 'B' })}</span>
      </div>

      <label className="mt-1.5 flex items-center gap-2 rounded-xl border border-line/60 bg-paper px-3 py-2">
        <Search size={15} aria-hidden className="text-ink/40" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/35"
        />
        {loading && <span className="text-xs text-ink/40">…</span>}
      </label>

      {results.length > 0 && (
        <ul className="mt-2 divide-y divide-line/40 overflow-hidden rounded-xl border border-line/60 bg-paper">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => choose(item.id)}
                className="block w-full px-3 py-2 text-start text-sm text-ink hover:bg-line/15"
              >
                <span className="font-medium">{item.name}</span>
                <span className="ms-2 text-xs text-ink/45">{item.country}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        {a && (
          <button
            type="button"
            onClick={() => clear('a')}
            className="inline-flex items-center gap-1 rounded-full border border-line/60 px-2.5 py-1 text-ink/60 hover:text-ink"
          >
            {t('removeA')} <X size={11} aria-hidden />
          </button>
        )}
        {b && (
          <button
            type="button"
            onClick={() => clear('b')}
            className="inline-flex items-center gap-1 rounded-full border border-line/60 px-2.5 py-1 text-ink/60 hover:text-ink"
          >
            {t('removeB')} <X size={11} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
