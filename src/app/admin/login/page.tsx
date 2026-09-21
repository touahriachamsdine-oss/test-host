import { Suspense } from 'react';
import { getAdminLocale, getAdminMessages } from '../i18n';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const locale = await getAdminLocale();
  const messages = await getAdminMessages();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Suspense>
        <LoginForm locale={locale} messages={messages} />
      </Suspense>
    </div>
  );
}