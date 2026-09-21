import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { SessionProvider } from 'next-auth/react';
import en from '../../messages/en.json';
import { LoginForm, RegisterForm } from './MemberAuthForms';

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn()
}));

vi.mock('next-auth/react', async () => {
  const actual = await vi.importActual<typeof import('next-auth/react')>('next-auth/react');
  return {
    ...actual,
    signIn: mocks.signIn
  };
});

vi.mock('@/i18n/navigation', async () => {
  const React = await import('react');
  return {
    Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
      React.createElement('a', { href: String(href), ...props }, children),
    useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
    usePathname: () => '/login'
  };
});

function renderForm(ui: React.ReactNode) {
  return render(
    <SessionProvider
      session={{
        user: { id: 'm1', name: 'Member', email: 'm@dz.local', role: 'member', teamDomain: null },
        expires: new Date(Date.now() + 60_000).toISOString()
      }}
    >
      <NextIntlClientProvider locale="en" messages={en}>
        {ui}
      </NextIntlClientProvider>
    </SessionProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  mocks.signIn.mockReset();
  mocks.push.mockReset();
  mocks.refresh.mockReset();
});

describe('LoginForm', () => {
  it('submits member-credentials then redirects to the sanitized callbackUrl', async () => {
    mocks.signIn.mockResolvedValue({ error: undefined, code: undefined, status: 200, ok: true, url: null });
    renderForm(<LoginForm callbackUrl="/saved" />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.dz' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(mocks.signIn).toHaveBeenCalledWith('member-credentials', {
        email: 'a@b.dz',
        password: 'secret123',
        redirect: false
      })
    );
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/saved'));
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it('shows the localized invalid-credentials error and does not redirect', async () => {
    mocks.signIn.mockResolvedValue({
      error: 'CredentialsSignin',
      code: undefined,
      status: 401,
      ok: false,
      url: null
    });
    renderForm(<LoginForm callbackUrl="/saved" />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.dz' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByText('Incorrect email or password. Please try again.')
    ).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('links to the create-account page', () => {
    renderForm(<LoginForm callbackUrl="/" />);
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/register'
    );
  });
});

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) } as unknown as Response)
    );
  });

  it('posts to /api/register, auto sign-in and redirects to /saved', async () => {
    mocks.signIn.mockResolvedValue({ error: undefined, code: undefined, status: 200, ok: true, url: null });
    renderForm(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Nadia Belkacem' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'nadia@example.dz' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create an account' }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Nadia Belkacem',
            email: 'nadia@example.dz',
            password: 'secret123'
          })
        })
      )
    );
    await waitFor(() =>
      expect(mocks.signIn).toHaveBeenCalledWith(
        'member-credentials',
        expect.objectContaining({ email: 'nadia@example.dz', password: 'secret123', redirect: false })
      )
    );
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/saved'));
  });

  it('rejects a weak password before hitting the network', async () => {
    renderForm(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Nadia' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'nadia@example.dz' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create an account' }));

    expect(
      await screen.findByText('Your password must be at least 8 characters.')
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows a friendly email-taken error with a link to sign in', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: 'email_taken' })
      } as unknown as Response)
    );
    renderForm(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Nadia' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'nadia@example.dz' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create an account' }));

    expect(await screen.findByText('An account with this email already exists.')).toBeInTheDocument();
    expect(within(screen.getByRole('alert')).getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('surfaces the rate-limited message from the register API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: 'rate_limited' })
      } as unknown as Response)
    );
    renderForm(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Nadia' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'nadia@example.dz' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create an account' }));

    expect(
      await screen.findByText('Too many attempts. Please try again in an hour.')
    ).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
