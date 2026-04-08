import type { MetadataRoute } from 'next';
import { resolveSiteOrigin } from '../lib/runtime-mode';

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
  const origin = resolveSiteOrigin();

  return publicRoutes.map((route) => ({
    url: `${origin}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.7
  }));
}
