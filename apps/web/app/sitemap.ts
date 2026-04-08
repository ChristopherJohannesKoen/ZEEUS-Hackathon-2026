import type { MetadataRoute } from 'next';

const publicRoutes = [
  '',
  '/how-it-works',
  '/methodology',
  '/faq',
  '/sdg-esrs',
  '/resources',
  '/partners',
  '/contact'
];

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? 'http://localhost:3000';

  return publicRoutes.map((route) => ({
    url: `${origin}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.7
  }));
}
