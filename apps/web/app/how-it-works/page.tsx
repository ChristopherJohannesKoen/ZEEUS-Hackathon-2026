import Link from 'next/link';
import { Card, buttonClassName } from '@packages/ui';
import { MarketingShell } from '../../components/marketing-shell';
import { getCurrentUser, getPublicSiteContent } from '../../lib/server-api';

export default async function HowItWorksPage() {
  const [currentUser, content] = await Promise.all([getCurrentUser(), getPublicSiteContent()]);
  const article = content.articles.find((item) => item.slug === 'how-it-works');

  return (
    <MarketingShell
      currentUser={currentUser}
      eyebrow="How it works"
      title={article?.title ?? 'How ZEEUS works'}
      intro={
        article?.summary ??
        'The platform keeps the workbook logic intact while making the workflow easier to save, revisit, and explain.'
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-surface-border">
          <div className="prose prose-slate max-w-none">
            <p>{article?.body}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className={buttonClassName({ className: 'bg-brand hover:bg-brand-dark' })}
              href={currentUser ? '/app/evaluate/start' : '/signup'}
            >
              Start evaluation
            </Link>
            <Link className={buttonClassName({ variant: 'secondary' })} href="/methodology">
              View methodology
            </Link>
          </div>
        </Card>

        <div className="grid gap-4">
          {[
            [
              '1. Startup context',
              'Capture country, NACE division, stage, offering type, and innovation approach.'
            ],
            [
              '2. Stage I',
              'Score financial, environmental, social, and governance topics with deterministic logic.'
            ],
            ['3. Stage II', 'Rate risks and opportunities with the workbook matrices.'],
            ['4. Outputs', 'Review SDGs, recommendations, dashboard metrics, and official exports.']
          ].map(([title, description]) => (
            <Card className="border-surface-border bg-[#f4f9ee]" key={title}>
              <h2 className="text-lg font-bold text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
            </Card>
          ))}
        </div>
      </div>
    </MarketingShell>
  );
}
