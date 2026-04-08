import type { MetadataRoute } from 'next';
import { resolveSiteOrigin } from '../lib/runtime-mode';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/'
    },
    sitemap: `${resolveSiteOrigin()}/sitemap.xml`
  };
}
