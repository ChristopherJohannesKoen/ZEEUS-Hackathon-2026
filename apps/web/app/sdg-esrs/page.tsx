import Link from 'next/link';
import { Card, buttonClassName } from '@packages/ui';
import { MarketingShell } from '../../components/marketing-shell';
import { getCurrentUser, getPublicSiteContent } from '../../lib/server-api';

export default async function SdgEsrsPage() {
  const [currentUser, content] = await Promise.all([getCurrentUser(), getPublicSiteContent()]);
  const article = content.articles.find((item) => item.slug === 'sdg-esrs-explainer');

  return (
    <MarketingShell
      currentUser={currentUser}
      eyebrow="SDGs and ESRS"
      title={article?.title ?? 'SDGs, ESRS, and double materiality'}
      intro={
        article?.summary ??
        'Use the SDGs as a directional map, then refine them through the assessment workflow.'
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-surface-border">
          <p className="text-sm leading-8 text-slate-700">{article?.body}</p>
        </Card>
        <div className="grid gap-4">
          {[6, 8, 9, 12, 13, 16, 17].map((goal) => (
            <Card className="border-surface-border bg-[#f4f9ee]" key={goal}>
              <h2 className="text-lg font-bold text-slate-950">SDG {goal} target explorer</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Review official targets and use them as a structured discussion aid when reading the
                assessment outputs.
              </p>
              <div className="mt-4">
                <Link className={buttonClassName({ variant: 'secondary' })} href={`/sdg/${goal}`}>
                  Open SDG {goal}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </MarketingShell>
  );
}
