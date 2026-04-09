import { notFound } from 'next/navigation';
import { Card } from '@packages/ui';
import { MarketingShell } from '../../../components/marketing-shell';
import { ApiRequestError } from '../../../lib/api-error';
import {
  getOptionalCurrentUser,
  getPublicSiteContent,
  getSdgGoal
} from '../../../lib/server-api';
import { getSiteSettings } from '../../../lib/site-content';

type Params = Promise<{ goalNumber: string }>;

export default async function SdgGoalPage({ params }: { params: Params }) {
  const { goalNumber } = await params;

  try {
    const [currentUser, goal, content] = await Promise.all([
      getOptionalCurrentUser(),
      getSdgGoal(Number(goalNumber)),
      getPublicSiteContent()
    ]);

    return (
      <MarketingShell
        currentUser={currentUser}
        settings={getSiteSettings(content)}
        eyebrow={`SDG ${goal.goalNumber}`}
        title={goal.goalTitle}
        intro={goal.summary}
      >
        <div className="grid gap-4">
          {goal.targets.map((target) => (
            <Card className="border-surface-border" key={target.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
                  Target {target.targetCode}
                </p>
                <a
                  className="text-sm font-semibold text-brand-dark"
                  href={target.officialUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open official goal page
                </a>
              </div>
              <h2 className="mt-3 text-xl font-bold text-slate-950">{target.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{target.description}</p>
            </Card>
          ))}
        </div>
      </MarketingShell>
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.statusCode === 404) {
      notFound();
    }

    throw error;
  }
}
