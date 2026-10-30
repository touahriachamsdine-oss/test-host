'use client';

import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import { Link, usePathname } from '@/i18n/navigation';
import { LangSwitcher } from './LangSwitcher';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const t = useTranslations('Navbar');
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const links = [
    { href: '/' as const, label: t('home'), active: pathname === '/' },
    { href: '/browse' as const, label: t('browse'), active: pathname.startsWith('/browse') },
    {
      href: '/collaborate' as const,
      label: t('collaborate'),
      active: pathname.startsWith('/collaborate')
    },
    { href: '/saved' as const, label: t('saved'), active: pathname.startsWith('/saved') }
  ];

  const name = session?.user?.name ?? session?.user?.email ?? '';
  const initial = name.trim().charAt(0).toLocaleUpperCase();

  const authControl =
    status === 'loading' ? null : status === 'authenticated' ? (
      <div className="flex items-center gap-2">
        <span
          title={name}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-signal bg-signal/10 text-sm font-semibold text-signal"
        >
          {initial}
        </span>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="ring-focus rounded-md px-3 py-2 text-sm text-ink/70 transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:bg-line/20 hover:text-ink motion-reduce:transition-none"
        >
          {t('signOut')}
        </button>
      </div>
    ) : (
      <Link
        href="/login"
        className="ring-focus rounded-md px-3 py-2 text-sm text-ink/60 transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:bg-line/20 hover:text-ink motion-reduce:transition-none"
      >
        {t('signIn')}
      </Link>
    );

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-[var(--dur-base)] ease-[var(--ease-standard)] motion-reduce:transition-none print:hidden ${
        scrolled ? 'bg-paper/75 backdrop-blur-md shadow-[0_8px_24px_-20px_rgb(0_0_0/0.35)]' : 'bg-transparent'
      }`}
    >
      <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="ring-focus flex min-w-0 items-baseline gap-1.5">
          <span className="text-base font-semibold tracking-tight text-ink">{t('brand')}</span>
          <span className="font-mono text-sm font-medium text-signal">{t('brandTag')}</span>
          <span className="hidden font-mono text-sm font-medium tabular-nums text-ink/40 sm:inline">
            {t('edition')}
          </span>
        </Link>

        <nav
          data-testid="nav-desktop"
          aria-label={t('brand')}
          className="hidden items-center gap-1 sm:gap-2 lg:flex"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.active ? 'page' : undefined}
              className={`ring-focus rounded-[3px] border-b-2 px-2.5 py-1.5 text-sm transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] motion-reduce:transition-none ${
                link.active
                  ? 'border-signal font-medium text-ink shadow-[0_0_0_1px_color-mix(in_srgb,var(--signal)_20%,transparent),0_0_12px_-2px_var(--signal)]'
                  : 'border-transparent text-ink/60 hover:text-ink'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="ms-1">{authControl}</div>
          <LangSwitcher />
          <ThemeToggle />
        </nav>

        <button
          type="button"
          data-testid="nav-toggle"
          aria-expanded={open}
          aria-controls="nav-menu"
          aria-label={open ? t('closeMenu') : t('openMenu')}
          onClick={() => setOpen((value) => !value)}
          className="ring-focus inline-flex h-11 w-11 items-center justify-center rounded-md text-ink/70 transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:bg-line/20 hover:text-ink motion-reduce:transition-none lg:hidden"
        >
          {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
        </button>

        <div
          id="nav-menu"
          data-testid="nav-panel"
          inert={!open}
          aria-hidden={open ? undefined : true}
          className={`absolute start-0 end-0 top-full mt-2 rounded-2xl bg-paper/90 p-2 shadow-[0_20px_40px_-24px_rgb(0_0_0/0.35)] backdrop-blur-md transition-[opacity,transform] duration-[var(--dur-base)] ease-[var(--ease-standard)] motion-reduce:transition-none lg:hidden ${
            open
              ? 'visible translate-y-0 opacity-100'
              : 'invisible -translate-y-1 opacity-0 pointer-events-none'
          }`}
        >
          <nav aria-label={t('brand')} className="flex flex-col">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.active ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={`ring-focus rounded-[3px] px-3 py-2.5 text-sm transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] motion-reduce:transition-none ${
                  link.active
                    ? 'font-medium text-ink shadow-[inset_0_-2px_0_var(--signal)]'
                    : 'text-ink/70 hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-1 flex items-center justify-between gap-2 pt-2">
            <div className="min-w-0">{authControl}</div>
            <div className="flex shrink-0 items-center gap-1">
              <LangSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}