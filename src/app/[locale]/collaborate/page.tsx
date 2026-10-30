import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Users } from 'lucide-react';
import { auth } from '@/auth';
import { getMemberProfile } from '@/lib/members';
import { getCollegeBoard, getMemberInterests, type BoardProject } from '@/lib/interests';
import { collegeLabel } from '@/data/colleges';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Collaborate');
  return { title: t('title'), description: t('subtitle') };
}

function ProjectItem({
  project,
  meta
}: {
  project: BoardProject;
  meta: string;
}) {
  return (
    <li className="rounded-[10px] border border-line/50 p-4">
      <Link
        href={`/startup/${project.id}`}
        className="text-base font-medium text-ink underline-offset-2 hover:text-signal hover:underline"
      >
        {project.name}
      </Link>
      <p className="mt-1 line-clamp-2 text-sm leading-5 text-ink/60">{project.shortDescription}</p>
      <p className="mt-2 font-mono text-xs uppercase tracking-wide text-ink/45">{meta}</p>
    </li>
  );
}

export default async function CollaboratePage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('Collaborate');
  const domainNames = await getTranslations('domainNames');
  const session = await auth();

  if (!session?.user?.id) {
    const query = `?callbackUrl=${encodeURIComponent('/collaborate')}`;
    return (
      <section className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6">
        <header>
          <h1 className="text-[32px] font-semibold leading-10 tracking-tight text-ink">
            {t('title')}
          </h1>
          <p className="mt-2 max-w-xl text-base leading-[26px] text-ink/70">{t('subtitle')}</p>
        </header>

        <div className="mt-8 rounded-2xl border border-line/60 p-6 sm:p-8">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-signal/10 text-signal">
            <Users size={18} aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-ink">{t('signInTitle')}</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">{t('signInText')}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/login${query}`}
              className="ring-focus inline-flex h-11 items-center justify-center rounded-[6px] bg-signal px-5 text-sm font-medium text-paper hover:bg-signal/90"
            >
              {t('signIn')}
            </Link>
            <Link
              href={`/register${query}`}
              className="ring-focus inline-flex h-11 items-center justify-center rounded-[6px] border border-line/70 px-5 text-sm font-medium text-ink hover:bg-line/20"
            >
              {t('register')}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const [profile, interests] = await Promise.all([
    getMemberProfile(session.user.id),
    getMemberInterests(session.user.id)
  ]);
  const board = profile?.collegeId ? await getCollegeBoard(profile.collegeId) : [];

  return (
    <section className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6">
      <header>
        <h1 className="text-[32px] font-semibold leading-10 tracking-tight text-ink">
          {t('title')}
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-[26px] text-ink/70">{t('subtitle')}</p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-sm font-medium uppercase tracking-wide text-ink/50">
            {t('yourProjects')}
          </h2>
          {interests.length === 0 ? (
            <p className="mt-3 rounded-[10px] border border-line/50 p-4 text-sm leading-6 text-ink/60">
              {t('yourProjectsEmpty')}
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {interests.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  meta={`${domainNames(project.domain)} · ${t('totalPeople', { count: project.total })}`}
                />
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm font-medium uppercase tracking-wide text-ink/50">
            {profile?.collegeId
              ? t('collegeBoard', { college: collegeLabel(profile.collegeId, locale) })
              : t('collegeBoardGeneric')}
          </h2>
          {!profile?.collegeId ? (
            <p className="mt-3 rounded-[10px] border border-line/50 p-4 text-sm leading-6 text-ink/60">
              {t('noCollege')}
            </p>
          ) : board.length === 0 ? (
            <p className="mt-3 rounded-[10px] border border-line/50 p-4 text-sm leading-6 text-ink/60">
              {t('collegeBoardEmpty')}
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {board.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  meta={`${domainNames(project.domain)} · ${t('classmates', { count: project.classmates })}`}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="mt-8 text-xs leading-5 text-ink/45">{t('privacy')}</p>
    </section>
  );
}
