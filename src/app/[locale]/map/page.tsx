import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { Link } from '@/i18n/navigation';
import { getMemberProfile } from '@/lib/members';
import { getCollege } from '@/data/colleges';
import {
  getAlgeriaCities,
  getMapClusters,
  getMapCountries,
  matchCityByPlace
} from '@/lib/map';
import { MapCanvas } from '@/components/MapCanvas';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Map' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function MapPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ country?: string; city?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'Map' });

  const [countries, cities, session] = await Promise.all([
    getMapCountries(),
    getAlgeriaCities(),
    auth()
  ]);

  const country = sp.country && sp.country !== 'all' ? sp.country : null;
  const city = sp.city && sp.city !== 'all' ? sp.city : null;

  const clusters = await getMapClusters({ country, city });

  const profile = session?.user?.id ? await getMemberProfile(session.user.id) : null;
  const college = profile?.collegeId ? getCollege(profile.collegeId) : null;
  const nearCity = college ? matchCityByPlace(cities, college.wilaya) : null;

  const prefix = locale === 'ar' ? '' : `/${locale}`;
  const topLocations = [...clusters].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('title')}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">{t('subtitle')}</p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="text-xs font-medium uppercase tracking-wide text-ink/50">
          {t('countryLabel')}
          <select
            name="country"
            defaultValue={country ?? 'all'}
            className="ring-focus mt-1 block min-w-44 rounded-lg border border-line/60 bg-paper px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
          >
            <option value="all">{t('allCountries')}</option>
            {countries.map((item) => (
              <option key={item.value} value={item.value}>
                {item.value} ({item.count})
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium uppercase tracking-wide text-ink/50">
          {t('cityLabel')}
          <select
            name="city"
            defaultValue={city ?? 'all'}
            className="ring-focus mt-1 block min-w-44 rounded-lg border border-line/60 bg-paper px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
          >
            <option value="all">{t('allCities')}</option>
            {cities.map((item) => (
              <option key={item.city} value={item.city}>
                {item.city} ({item.count})
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="ring-focus rounded-[3px] bg-signal px-4 py-2 text-sm font-medium text-paper"
        >
          {t('apply')}
        </button>

        {nearCity && (
          <Link
            href={`/map?country=Algeria&city=${encodeURIComponent(nearCity)}`}
            className="ring-focus rounded-full border border-signal/50 bg-signal/[0.06] px-3 py-2 text-xs font-medium text-signal"
          >
            {t('nearUniversity', { place: nearCity })}
          </Link>
        )}
      </form>

      <div className="mt-6">
        <MapCanvas clusters={clusters} prefix={prefix} />
      </div>

      <p className="mt-3 text-xs text-ink/45">{t('mapNote')}</p>

      {topLocations.length > 0 && (
        <div className="mt-8 max-w-2xl">
          <h2 className="text-sm font-medium text-ink">{t('topLocations')}</h2>
          <ul className="mt-3 divide-y divide-line/40 rounded-xl border border-line/50">
            {topLocations.map((cluster) => (
              <li key={`${cluster.lat},${cluster.lng}`} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                <Link
                  href={`/startup/${cluster.sampleId}`}
                  className="min-w-0 truncate text-sm text-ink underline decoration-line underline-offset-2 hover:decoration-ink/40"
                >
                  {cluster.city ?? cluster.sampleName}
                </Link>
                <span className="shrink-0 text-xs tabular-nums text-ink/50">
                  {t('projectsCount', { count: cluster.count })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {clusters.length === 0 && (
        <p className="mt-8 rounded-xl border border-line/50 px-4 py-6 text-sm text-ink/55">
          {t('empty')}
        </p>
      )}
    </section>
  );
}
