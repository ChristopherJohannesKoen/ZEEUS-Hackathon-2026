import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MarketingShell } from '../../components/marketing-shell';
import { SitePageSections } from '../../components/site-page-sections';
import { getOptionalCurrentUser, getPublicSiteContent } from '../../lib/server-api';
import { getSitePage, getSiteSettings } from '../../lib/site-content';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const [{ slug }, content] = await Promise.all([params, getPublicSiteContent()]);
  const page = getSitePage(content, slug);

  if (!page) {
    return {};
  }

  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? page.summary,
    alternates: {
      canonical: page.canonicalUrl ?? `/${page.slug}`
    },
    openGraph: {
      title: page.seoTitle ?? page.title,
      description: page.seoDescription ?? page.summary,
      images: page.heroMediaAsset?.publicUrl ? [{ url: page.heroMediaAsset.publicUrl }] : undefined
    },
    twitter: {
      title: page.seoTitle ?? page.title,
      description: page.seoDescription ?? page.summary
    }
  };
}

export default async function GenericSitePage({ params }: PageProps) {
  const [{ slug }, currentUser, content] = await Promise.all([
    params,
    getOptionalCurrentUser(),
    getPublicSiteContent()
  ]);
  const page = getSitePage(content, slug);

  if (!page) {
    notFound();
  }

  return (
    <MarketingShell
      currentUser={currentUser}
      settings={getSiteSettings(content)}
      eyebrow={page.heroEyebrow ?? page.title}
      title={page.heroTitle ?? page.title}
      intro={page.heroBody ?? page.summary}
      heroPrimaryCtaLabel={page.heroPrimaryCtaLabel}
      heroPrimaryCtaHref={page.heroPrimaryCtaHref}
      heroSecondaryCtaLabel={page.heroSecondaryCtaLabel}
      heroSecondaryCtaHref={page.heroSecondaryCtaHref}
      heroMedia={page.heroMediaAsset}
    >
      <SitePageSections page={page} />
    </MarketingShell>
  );
}
