import Link from 'next/link';
import { Card, buttonClassName } from '@packages/ui';
import { MarketingShell } from '../../components/marketing-shell';
import { getCurrentUser, getPublicSiteContent } from '../../lib/server-api';

export default async function PartnersPage() {
  const [currentUser, content] = await Promise.all([getCurrentUser(), getPublicSiteContent()]);
  const article = content.articles.find((item) => item.slug === 'partner-programs');

  return (
    <MarketingShell
      currentUser={currentUser}
      eyebrow="Partner programs"
      title={article?.title ?? 'Partner and program workflows'}
      intro={
        article?.summary ??
        'Support cohorts, reviewer workflows, and co-branded outputs on top of immutable evaluation revisions.'
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="border-surface-border">
          <p className="text-sm leading-8 text-slate-700">{article?.body}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className={buttonClassName({ className: 'bg-brand hover:bg-brand-dark' })}
              href={currentUser ? '/app/programs' : '/login'}
            >
              {currentUser ? 'Open program console' : 'Sign in to program console'}
            </Link>
            <Link className={buttonClassName({ variant: 'secondary' })} href="/contact">
              Contact support
            </Link>
          </div>
        </Card>

        <div className="grid gap-4">
          {content.partnerPrograms.map((program) => (
            <Card className="border-surface-border bg-[#f4f9ee]" key={program.id}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
                {program.cohortLabel}
              </p>
              <h2 className="mt-3 text-xl font-bold text-slate-950">{program.name}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{program.summary}</p>
            </Card>
          ))}
        </div>
      </div>
    </MarketingShell>
  );
}
