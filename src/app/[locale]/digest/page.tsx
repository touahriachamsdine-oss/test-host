import { getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { auth } from '@/auth';
import { getMemberProfile } from '@/lib/members';
import { getMemberInterests } from '@/lib/interests';
import { getDigestPreview } from '@/lib/digest';
import { Link } from '@/i18n/navigation';
import { Mail } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Digest' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function DigestPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return redirect({ href: '/login?callbackUrl=%2Fdigest', locale });
  }

  const t = await getTranslations({ locale, namespace: 'Digest' });
  const names = await getTranslations({ locale, namespace: 'domainNames' });
  const profile = await getMemberProfile(session.user.id);
  if (!profile) {
    return redirect({ href: '/login?callbackUrl=%2Fdigest', locale });
  }

  const projects = await getMemberInterests(session.user.id, 24);
  const preview = await getDigestPreview(session.user.id, projects);
  const domainName = (domain: string) => (names.has(domain) ? names(domain) : domain);

  return (
    <section className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-signal/10 text-signal">
        <Mail size={18} aria-hidden />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">{t('title')}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">{t('subtitle')}</p>

      <div className="mt-6 rounded-xl border border-line/60 bg-surface/30 px-4 py-3 text-sm">
        {profile.digestOptIn ? (
          <p className="text-ink/70">{t('optInOn')}</p>
        ) : (
          <p className="flex flex-wrap items-center gap-2 text-ink/70">
            {t('optInOff')}
            <Link href="/profile" className="font-medium text-signal underline underline-offset-2">
              {t('turnOn')}
            </Link>
          </p>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-medium text-ink">{t('projectsTitle')}</h2>
        {preview.projects.length === 0 ? (
          <p className="mt-3 rounded-xl border border-line/50 px-4 py-5 text-sm text-ink/55">
            {t('projectsEmpty')}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line/40 rounded-xl border border-line/50">
            {preview.projects.map((project) => (
              <li key={project.id} className="px-4 py-3">
                <Link
                  href={`/startup/${project.id}`}
                  className="text-sm font-medium text-ink underline decoration-line underline-offset-2"
                >
                  {project.name}
                </Link>
                <p className="mt-0.5 text-xs text-ink/45">
                  {domainName(project.domain)} · {t('peopleCount', { count: project.total })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-medium text-ink">{t('suggestionsTitle')}</h2>
        <ul className="mt-3 space-y-3">
          {preview.suggestions.map((project) => (
            <li key={project.id} className="rounded-xl border border-line/50 px-4 py-3">
              <Link
                href={`/startup/${project.id}`}
                className="text-sm font-medium text-ink underline decoration-line underline-offset-2"
              >
                {project.name}
              </Link>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink/55">
                {project.shortDescription}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-ink/40">
                {domainName(project.domain)} · {project.country}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-8 text-xs leading-5 text-ink/45">{t('deliveryNote')}</p>
    </section>
  );
}
