import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Startup Ideas DZ — verified projects to build',
    short_name: 'Ideas DZ',
    description:
      'A trilingual directory of 12,660 verified projects with the team, budget and build plan for an MVP.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f7f4ec',
    theme_color: '#1f6f5c',
    lang: 'ar',
    dir: 'rtl',
    categories: ['education', 'productivity', 'business'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      }
    ]
  };
}
