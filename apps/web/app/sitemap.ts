import type { MetadataRoute } from 'next';
import { resolveSiteOrigin } from '../lib/runtime-mode';
import { getPublicSiteContent } from '../lib/server-api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = resolveSiteOrigin();
  const content = await getPublicSiteContent();
  const dynamicRoutes = content.sitePages
    .filter((page) => page.status === 'published')
    .map((page) => (page.slug === 'home' ? '' : `/${page.slug}`));
  const publicRoutes = Array.from(
    new Set(['', '/faq', '/resources', '/case-studies', ...dynamicRoutes])
  );

  return publicRoutes.map((route) => ({
    url: `${origin}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.7
  }));
}
