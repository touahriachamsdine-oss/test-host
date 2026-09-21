import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import en from '../../messages/en.json';
import { FilterPanel, type StartupFilterState } from './FilterPanel';

function makeFilters(): StartupFilterState {
  return {
    filtered: [],
    search: '',
    setSearch: vi.fn(),
    countries: [],
    toggleCountry: vi.fn(),
    priorities: [],
    togglePriority: vi.fn(),
    yearRange: { min: 2020, max: 2025 },
    setYearMin: vi.fn(),
    setYearMax: vi.fn(),
    minYear: 2020,
    maxYear: 2025,
    availableCountries: ['Algeria'],
    clearAll: vi.fn(),
    activeCount: 0
  };
}

afterEach(() => cleanup());

describe('FilterPanel', () => {
  it('country search input carries the glass backing and a focus glow ring', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <FilterPanel filters={makeFilters()} />
      </NextIntlClientProvider>
    );
    const input = screen.getByRole('searchbox', { name: 'Search countries…' });
    expect(input).toHaveClass('field-glass');
    expect(input).toHaveClass('ring-focus');
  });

  it('keeps aria-invalid untouched on the country search input', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <FilterPanel filters={makeFilters()} />
      </NextIntlClientProvider>
    );
    const input = screen.getByRole('searchbox', { name: 'Search countries…' });
    expect(input).not.toHaveAttribute('aria-invalid');
  });
});