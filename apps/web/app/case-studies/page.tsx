import { Card } from '@packages/ui';
import { MarketingShell } from '../../components/marketing-shell';
import { getCurrentUser, getPublicSiteContent } from '../../lib/server-api';

export default async function CaseStudiesPage() {
  const [currentUser, content] = await Promise.all([getCurrentUser(), getPublicSiteContent()]);

  return (
    <MarketingShell
      currentUser={currentUser}
      eyebrow="Case studies"
      title="Example startup journeys"
      intro="Use these examples to understand how founders can move from assumptions to better evidence without changing the deterministic backbone."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {content.caseStudies.map((study) => (
          <Card className="border-surface-border" key={study.id}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
              {study.startupName}
            </p>
            <h2 className="mt-3 text-2xl font-black text-slate-950">{study.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{study.summary}</p>
            <p className="mt-4 text-sm leading-7 text-slate-700">{study.story}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-500">
              {study.stage} / {study.naceDivision}
            </p>
          </Card>
        ))}
      </div>
    </MarketingShell>
  );
}
