import Image from 'next/image';
import Link from 'next/link';
import { Badge, buttonClassName } from '@packages/ui';
import type { MediaAsset, SessionUser, SiteSettings } from '@packages/shared';
import { MarketingFooter } from './marketing-footer';
import { SiteHeader } from './site-header';

export function MarketingShell({
  currentUser,
  settings,
  eyebrow,
  title,
  intro,
  heroPrimaryCtaLabel,
  heroPrimaryCtaHref,
  heroSecondaryCtaLabel,
  heroSecondaryCtaHref,
  heroMedia,
  children
}: {
  currentUser?: SessionUser;
  settings: SiteSettings;
  eyebrow: string;
  title: string;
  intro: string;
  heroPrimaryCtaLabel?: string | null;
  heroPrimaryCtaHref?: string | null;
  heroSecondaryCtaLabel?: string | null;
  heroSecondaryCtaHref?: string | null;
  heroMedia?: MediaAsset | null;
  children: React.ReactNode;
}) {
  const hasHeroMedia = Boolean(heroMedia?.publicUrl);

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader currentUser={currentUser} settings={settings} />
      <main>
        <section className="border-b border-surface-border bg-gradient-to-br from-white via-[#f8fcf0] to-[#edf7e6]">
          <div
            className={`mx-auto max-w-6xl px-6 py-16 text-slate-950 lg:py-20 ${
              hasHeroMedia ? 'grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center' : ''
            }`}
          >
            <div>
              <Badge className="border border-[#d7e7c7] bg-white text-[#00654a]" tone="slate">
                {eyebrow}
              </Badge>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight md:text-5xl">
                {title}
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-600">{intro}</p>
              {heroPrimaryCtaLabel && heroPrimaryCtaHref ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    className={buttonClassName({ className: 'bg-brand hover:bg-brand-dark' })}
                    href={heroPrimaryCtaHref}
                  >
                    {heroPrimaryCtaLabel}
                  </Link>
                  {heroSecondaryCtaLabel && heroSecondaryCtaHref ? (
                    <Link
                      className={buttonClassName({ variant: 'secondary' })}
                      href={heroSecondaryCtaHref}
                    >
                      {heroSecondaryCtaLabel}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
            {heroMedia?.publicUrl ? (
              <div className="overflow-hidden rounded-[34px] border border-white/70 bg-white shadow-card">
                <div className="relative aspect-[1.08/1]">
                  <Image
                    alt={heroMedia.altText}
                    className="object-cover object-center"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    src={heroMedia.publicUrl}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-6 py-12 lg:py-16">{children}</section>
      </main>
      <MarketingFooter settings={settings} />
    </div>
  );
}
