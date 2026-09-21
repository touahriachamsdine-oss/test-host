import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { SessionProvider } from 'next-auth/react';
import en from '../../messages/en.json';
import { Navbar } from './Navbar';

vi.mock('@/i18n/navigation', async () => {
  const React = await import('react');
  return {
    Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
      React.createElement('a', { href: String(href), ...props }, children),
    usePathname: () => '/',
    useRouter: () => ({ replace: vi.fn() })
  };
});

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true });
}

function renderNavbar() {
  return render(
    <SessionProvider session={null}>
      <NextIntlClientProvider locale="en" messages={en}>
        <Navbar />
      </NextIntlClientProvider>
    </SessionProvider>
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

describe('Navbar responsive behavior', () => {
  it('small viewport: toggle present, closed panel off the a11y tree, opening exposes links', () => {
    setViewport(375);
    renderNavbar();

    const toggle = screen.getByRole('button', { name: 'Open menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'nav-menu');

    const panel = screen.getByTestId('nav-panel');
    expect(panel).toHaveAttribute('inert');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(within(panel).queryByRole('link')).not.toBeInTheDocument();

    const closedCount = screen.getAllByRole('link').length;

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAttribute('aria-label', 'Close menu');
    expect(panel).not.toHaveAttribute('inert');
    expect(panel).not.toHaveAttribute('aria-hidden');
    expect(within(panel).getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getAllByRole('link').length).toBeGreaterThan(closedCount);
  });

  it('large viewport: toggle is lg-only and the desktop links container is exposed', () => {
    setViewport(1280);
    renderNavbar();

    const toggle = screen.getByRole('button', { name: 'Open menu' });
    expect(toggle).toHaveClass('lg:hidden');

    const desktop = screen.getByTestId('nav-desktop');
    expect(desktop).not.toHaveAttribute('inert');
    expect(desktop).not.toHaveAttribute('aria-hidden');
    expect(within(desktop).getByRole('link', { name: 'Browse' })).toBeInTheDocument();

    const panel = screen.getByTestId('nav-panel');
    expect(panel).toHaveClass('lg:hidden');
    expect(panel).toHaveAttribute('inert');
  });
});