import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MarketingShell } from '../components/marketing-shell';
import { SitePageSections } from '../components/site-page-sections';
import { getOptionalCurrentUser, getPublicSiteContent } from '../lib/server-api';
import { getSitePage, getSiteSettings } from '../lib/site-content';

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublicSiteContent();
  const homePage = getSitePage(content, 'home');

  if (!homePage) {
    return {};
  }

  return {
    title: homePage.seoTitle ?? homePage.title,
    description: homePage.seoDescription ?? homePage.summary,
    alternates: {
      canonical: homePage.canonicalUrl ?? '/'
    },
    openGraph: {
      title: homePage.seoTitle ?? homePage.title,
      description: homePage.seoDescription ?? homePage.summary,
      images: homePage.heroMediaAsset?.publicUrl
        ? [{ url: homePage.heroMediaAsset.publicUrl }]
        : undefined
    },
    twitter: {
      title: homePage.seoTitle ?? homePage.title,
      description: homePage.seoDescription ?? homePage.summary
    }
  };
}

export default async function Page() {
  const [currentUser, content] = await Promise.all([
    getOptionalCurrentUser(),
    getPublicSiteContent()
  ]);
  const homePage = getSitePage(content, 'home');

  if (!homePage) {
    notFound();
  }

  return (
    <MarketingShell
      currentUser={currentUser}
      settings={getSiteSettings(content)}
      eyebrow={homePage.heroEyebrow ?? homePage.title}
      title={homePage.heroTitle ?? homePage.title}
      intro={homePage.heroBody ?? homePage.summary}
      heroPrimaryCtaLabel={homePage.heroPrimaryCtaLabel}
      heroPrimaryCtaHref={currentUser ? '/app/evaluate/start' : homePage.heroPrimaryCtaHref}
      heroSecondaryCtaLabel={homePage.heroSecondaryCtaLabel}
      heroSecondaryCtaHref={homePage.heroSecondaryCtaHref}
      heroMedia={homePage.heroMediaAsset}
    >
      <SitePageSections page={homePage} />
    </MarketingShell>
  );
}
