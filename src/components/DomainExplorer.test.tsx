import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import en from '../../messages/en.json';
import type { Startup } from '@/data/startups';
import { DomainExplorer } from './DomainExplorer';

vi.mock('@/i18n/navigation', async () => {
  const React = await import('react');
  return {
    Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
      React.createElement('a', { href: String(href), ...props }, children),
    usePathname: () => '/'
  };
});

const STARTUP: Startup = {
  id: 'kabas-ai',
  name: 'KABAS AI',
  country: 'Algeria',
  domain: 'ai-computing',
  subDomain: 'Generative AI',
  shortDescription: 'A sovereign Arabic large language model trained on-premises.',
  technology: 'LLM fine-tuning, RAG',
  yearFounded: 2024,
  whyRelevant: 'Addresses digital sovereignty and Arabic NLP gaps.',
  priority: 'A',
  status: 'verified'
};

function renderExplorer() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <DomainExplorer startups={[STARTUP]} />
    </NextIntlClientProvider>
  );
}

afterEach(() => cleanup());

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
});

describe('DomainExplorer inputs and primary buttons', () => {
  it('search input carries the glass backing and a focus glow ring', () => {
    renderExplorer();
    const search = screen.getByRole('searchbox', { name: 'Search startups…' });
    expect(search).toHaveClass('field-glass');
    expect(search).toHaveClass('ring-focus');
  });

  it('mobile filter trigger carries a focus glow ring and a gated press scale', () => {
    renderExplorer();
    const trigger = screen.getByRole('button', { name: 'Filters' });
    expect(trigger).toHaveClass('ring-focus');
    expect(trigger).toHaveClass('active:scale-[0.99]');
    expect(trigger).toHaveClass('motion-reduce:active:scale-100');
  });

  it('sheet show-results button carries a focus glow ring and a gated press scale', () => {
    renderExplorer();
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));

    const show = screen.getByRole('button', { name: /Show results:/ });
    expect(show).toHaveClass('ring-focus');
    expect(show).toHaveClass('active:scale-[0.99]');
    expect(show).toHaveClass('motion-reduce:active:scale-100');
  });
});