import { Badge } from '@packages/ui';
import type { SessionUser } from '@packages/shared';
import { MarketingFooter } from './marketing-footer';
import { SiteHeader } from './site-header';

export function MarketingShell({
  currentUser,
  eyebrow,
  title,
  intro,
  children
}: {
  currentUser?: SessionUser;
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader currentUser={currentUser} />
      <main>
        <section className="border-b border-surface-border bg-gradient-to-br from-white via-[#f8fcf0] to-[#edf7e6]">
          <div className="mx-auto max-w-6xl px-6 py-16 text-slate-950 lg:py-20">
            <Badge className="border border-[#d7e7c7] bg-white text-[#00654a]" tone="slate">
              {eyebrow}
            </Badge>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight md:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-600">{intro}</p>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-6 py-12 lg:py-16">{children}</section>
      </main>
      <MarketingFooter />
    </div>
  );
}
