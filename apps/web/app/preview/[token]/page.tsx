import type { Metadata } from 'next';
import { MarketingShell } from '../../../components/marketing-shell';
import { SitePageSections } from '../../../components/site-page-sections';
import {
  getOptionalCurrentUser,
  getPreviewSitePage,
  getPublicSiteContent
} from '../../../lib/server-api';
import { getSiteSettings } from '../../../lib/site-content';

type PreviewPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const { token } = await params;
  const page = await getPreviewSitePage(token);

  return {
    title: `[Preview] ${page.seoTitle ?? page.title}`,
    description: page.seoDescription ?? page.summary,
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function PreviewSitePage({ params }: PreviewPageProps) {
  const { token } = await params;
  const [currentUser, content, page] = await Promise.all([
    getOptionalCurrentUser(),
    getPublicSiteContent(),
    getPreviewSitePage(token)
  ]);

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
      <section className="mx-auto mb-8 max-w-6xl rounded-3xl border border-dashed border-brand/40 bg-brand-tint px-6 py-4 text-sm text-slate-700">
        Preview mode. This page is being rendered from an unpublished editorial snapshot and is not visible on the public site.
      </section>
      <SitePageSections page={page} />
    </MarketingShell>
  );
}
