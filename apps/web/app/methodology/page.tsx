import Link from 'next/link';
import { Card, buttonClassName } from '@packages/ui';
import { MarketingShell } from '../../components/marketing-shell';
import { getCurrentUser, getPublicSiteContent } from '../../lib/server-api';

export default async function MethodologyPage() {
  const [currentUser, content] = await Promise.all([getCurrentUser(), getPublicSiteContent()]);
  const article = content.articles.find((item) => item.slug === 'methodology');

  return (
    <MarketingShell
      currentUser={currentUser}
      eyebrow="Methodology"
      title={article?.title ?? 'Methodology and scoring logic'}
      intro={article?.summary ?? 'Deterministic scoring and clear thresholds remain the foundation.'}
    >
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-surface-border">
          <div className="prose prose-slate max-w-none">
            <p>{article?.body}</p>
          </div>
        </Card>
        <div className="grid gap-4">
          <Card className="border-surface-border bg-[#f4f9ee]">
            <h2 className="text-xl font-black text-slate-950">Priority bands</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-700">
              <p>`0` = Not applicable</p>
              <p>`&gt;0 to &lt;1` = Very low</p>
              <p>`&gt;=1 to &lt;2` = Low</p>
              <p>`&gt;=2 to &lt;2.5` = Relevant</p>
              <p>`&gt;=2.5` = High priority</p>
            </div>
          </Card>
          <Card className="border-surface-border">
            <h2 className="text-xl font-black text-slate-950">Why this matters</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Startups need clear logic without compliance theater. ZEEUS keeps the formulas fixed,
              then improves clarity, evidence collection, and decision support around them.
            </p>
            <div className="mt-5">
              <Link className={buttonClassName({ variant: 'secondary' })} href="/faq">
                Open FAQ
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </MarketingShell>
  );
}
