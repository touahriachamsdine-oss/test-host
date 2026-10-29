import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import en from '../../messages/en.json';
import { SaveButton } from './SaveButton';
import { SavedProvider } from './SavedProvider';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  useSession: vi.fn()
}));

const signedOut: () => void = () => {};

vi.mock('@/i18n/navigation', async () => {
  const React = await import('react');
  return {
    Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
      React.createElement('a', { href: String(href), ...props }, children),
    useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
    usePathname: () => '/startup/x1'
  };
});

vi.mock('next-auth/react', () => ({
  useSession: mocks.useSession,
  signIn: vi.fn(),
  signOut: vi.fn()
}));

function renderButton(id = 'x1', initialIds: string[] = []) {
  return render(
    <SavedProvider initialIds={initialIds}>
      <NextIntlClientProvider locale="en" messages={en}>
        <SaveButton id={id} />
      </NextIntlClientProvider>
    </SavedProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  mocks.push.mockReset();
  mocks.refresh.mockReset();
});

beforeEach(() => {
  mocks.useSession.mockReturnValue({
    data: null,
    status: 'unauthenticated',
    update: signedOut
  });
});

describe('SaveButton when signed out', () => {
  it('shows a sign-in-to-save label and opens the auth gate modal', () => {
    renderButton();
    const button = screen.getByRole('button');
    expect(button).toHaveClass('ring-focus');
    expect(button).toHaveClass('active:scale-[0.99]');
    expect(button).toHaveClass('motion-reduce:active:scale-100');
    expect(button.textContent).toContain('Sign in to save');

    fireEvent.click(button);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('/login?callbackUrl=%2Fstartup%2Fx1');
    expect(hrefs).toContain('/register?callbackUrl=%2Fstartup%2Fx1');
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

describe('SaveButton when signed in', () => {
  beforeEach(() => {
    mocks.useSession.mockReturnValue({
      data: {
        user: {
          id: 'm1',
          name: 'Member',
          email: 'm@dz.local',
          role: 'member',
          teamDomain: null
        },
        expires: new Date(Date.now() + 60_000).toISOString()
      },
      status: 'authenticated',
      update: signedOut
    });
  });

  it('optimistically toggles to saved via the server API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ saved: true }) } as unknown as Response)
    );
    renderButton('x1', []);

    const button = screen.getByRole('button');
    expect(button.textContent).toContain('I want to build this in Algeria');

    fireEvent.click(button);
    await waitFor(() =>
      expect(screen.getByText('Saved to my list ✓')).toBeInTheDocument()
    );

    expect(fetch).toHaveBeenCalledWith(
      '/api/me/saved',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupId: 'x1' })
      })
    );
  });

  it('keeps the token-paced keyed transition on the swap', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ saved: true }) } as unknown as Response)
    );
    renderButton('x1', []);

    fireEvent.click(screen.getByRole('button'));
    const swap = await screen.findByText('Saved to my list ✓');
    expect(swap.closest('span')).toHaveClass('page-enter');
  });
});