import type { MetadataRoute } from 'next';
import { DOMAINS } from '@/data/domains';
import { getAllStartupIds } from '@/lib/public-startups';
import { alternatesFor } from '@/lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const ids = await getAllStartupIds();

  const staticPaths = ['/', '/browse', ...DOMAINS.map((domain) => `/domain/${domain.slug}`)];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => {
    const alternates = alternatesFor(path);
    return {
      url: alternates.canonical,
      lastModified: now,
      changeFrequency: path === '/' ? 'daily' : 'weekly',
      priority: path === '/' ? 1 : 0.8,
      alternates: { languages: alternates.languages }
    };
  });

  const startupEntries: MetadataRoute.Sitemap = ids.map((id) => {
    const alternates = alternatesFor(`/startup/${id}`);
    return {
      url: alternates.canonical,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
      alternates: { languages: alternates.languages }
    };
  });

  return [...staticEntries, ...startupEntries];
}
