'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import type { AdminMessages } from './i18n';
import {
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Inbox,
  Users,
  Globe,
  ShieldCheck,
  Layers,
  UsersRound,
  FileSpreadsheet,
  Languages
} from 'lucide-react';

export function AdminNav({
  role,
  teamDomain,
  userName,
  locale,
  messages
}: {
  role: string;
  teamDomain: string | null;
  userName: string;
  locale: Locale;
  messages: AdminMessages;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Africa/Algiers">
      <AdminNavInner role={role} teamDomain={teamDomain} userName={userName} />
    </NextIntlClientProvider>
  );
}

function AdminNavInner({
  role,
  teamDomain,
  userName
}: {
  role: string;
  teamDomain: string | null;
  userName: string;
}) {
  const pathname = usePathname();
  const t = useTranslations('Admin');

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  const items = [
    { href: '/admin/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, roles: ['admin'] },
    { href: '/admin/submit', label: t('nav.submitIdea'), icon: PlusCircle, roles: ['team', 'reviewer', 'admin'] },
    { href: '/admin/review', label: t('nav.reviewQueue'), icon: Inbox, roles: ['reviewer', 'admin'] },
    { href: '/admin/domains', label: t('nav.domainsValidation'), icon: Layers, roles: ['reviewer', 'admin'] },
    { href: '/admin/teams', label: t('nav.teamsQuotas'), icon: UsersRound, roles: ['reviewer', 'admin'] },
    { href: '/admin/import', label: t('nav.importSheet'), icon: FileSpreadsheet, roles: ['reviewer', 'admin'] },
    { href: '/admin/translations', label: t('nav.translations'), icon: Languages, roles: ['reviewer', 'admin'] },
    { href: '/admin/users', label: t('nav.guestAccounts'), icon: Users, roles: ['admin'] }
  ];

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-900">
      <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
          <ShieldCheck size={20} aria-hidden />
        </span>
        <div>
          <p className="text-sm font-bold text-white">{t('brand.title')}</p>
          <p className="text-xs text-slate-400">{t('nav.platformTag')}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items
          .filter((item) => item.roles.includes(role))
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={18} aria-hidden />
              {item.label}
            </Link>
          ))}
      </nav>

      <div className="border-t border-slate-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
            {userName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{userName}</p>
            <p className="truncate text-xs text-slate-400">
              {t(`roles.${role as 'team' | 'reviewer' | 'admin'}`) ?? role}
              {teamDomain ? ` · ${teamDomain}` : ''}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Link
            href="/"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            <Globe size={14} aria-hidden />
            {t('nav.publicSite')}
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600/80 px-3 py-2 text-xs font-medium text-white hover:bg-red-600"
          >
            <LogOut size={14} aria-hidden />
            {t('nav.signOut')}
          </button>
        </div>
      </div>
    </aside>
  );
}