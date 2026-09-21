'use client';

import { useMemo, useState } from 'react';
import type { Startup, StartupPriority } from '@/data/startups';

export interface YearRange {
  min: number;
  max: number;
}

export function useStartupFilters(source: Startup[]) {
  const verified = useMemo(() => source.filter((s) => s.status === 'verified'), [source]);

  const availableCountries = useMemo(
    () => Array.from(new Set(verified.map((s) => s.country))).sort((a, b) => a.localeCompare(b)),
    [verified]
  );

  const years = useMemo(() => verified.map((s) => s.yearFounded), [verified]);
  const minYear = years.length ? Math.min(...years) : 2020;
  const maxYear = years.length ? Math.max(...years) : 2025;

  const [search, setSearch] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<StartupPriority[]>([]);
  const [yearRange, setYearRange] = useState<YearRange>({ min: minYear, max: maxYear });

  const toggleCountry = (country: string) =>
    setCountries((prev) =>
      prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]
    );

  const togglePriority = (priority: StartupPriority) =>
    setPriorities((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
    );

  const setYearMin = (min: number) =>
    setYearRange((prev) => ({ min: Math.min(min, prev.max), max: prev.max }));

  const setYearMax = (max: number) =>
    setYearRange((prev) => ({ min: prev.min, max: Math.max(max, prev.min) }));

  const clearAll = () => {
    setSearch('');
    setCountries([]);
    setPriorities([]);
    setYearRange({ min: minYear, max: maxYear });
  };

  const activeCount =
    (search.trim() ? 1 : 0) +
    countries.length +
    priorities.length +
    (yearRange.min !== minYear || yearRange.max !== maxYear ? 1 : 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return verified.filter((s) => {
      if (q) {
        const haystack = [s.name, s.shortDescription, s.technology, s.subDomain ?? '', s.country]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (countries.length && !countries.includes(s.country)) return false;
      if (priorities.length && !priorities.includes(s.priority)) return false;
      if (s.yearFounded < yearRange.min || s.yearFounded > yearRange.max) return false;
      return true;
    });
  }, [verified, search, countries, priorities, yearRange]);

  return {
    filtered,
    search,
    setSearch,
    countries,
    toggleCountry,
    priorities,
    togglePriority,
    yearRange,
    setYearMin,
    setYearMax,
    minYear,
    maxYear,
    availableCountries,
    clearAll,
    activeCount
  };
}