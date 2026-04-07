import Link from 'next/link';
import { Badge, Card, EmptyState, buttonClassName } from '@packages/ui';
import { confidenceTone, evaluationStatusTone, formatDate, roleTone } from '../../lib/display';
import { getEvaluations, requireCurrentUser } from '../../lib/server-api';

export default async function DashboardPage() {
  const currentUser = await requireCurrentUser();
  const evaluations = await getEvaluations();

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-[32px] bg-[#0f2a21] p-8 text-white">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={roleTone(currentUser.role)}>{currentUser.role}</Badge>
          <span className="text-xs uppercase tracking-[0.3em] text-[#b8d88d]">
            Single-tenant assessment workspace
          </span>
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-black tracking-tight">Welcome back, {currentUser.name}.</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-300">
            Use the wizard to capture startup context, inside-out impacts, outside-in risks and
            opportunities, then move straight into the SDG alignment, dashboard, and report views.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className={buttonClassName({ className: 'bg-white text-slate-950 hover:bg-slate-200' })}
            href="/app/evaluate/start"
          >
            Start evaluation
          </Link>
          <Link
            className={buttonClassName({
              variant: 'ghost',
              className: 'text-white hover:bg-white/10 hover:text-white'
            })}
            href="/app/settings"
          >
            Update profile
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Evaluations</p>
          <p className="mt-4 text-4xl font-black text-slate-950">
            {evaluations.items.length}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Saved assessments available to resume or export.
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Role</p>
          <p className="mt-4 text-4xl font-black text-slate-950">{currentUser.role}</p>
          <p className="mt-2 text-sm text-slate-600">
            Owner can reassign roles. Admin can review users.
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Submission mode</p>
          <p className="mt-4 text-4xl font-black text-slate-950">Deterministic</p>
          <p className="mt-2 text-sm text-slate-600">
            AI stays out of scoring and out of final materiality decisions.
          </p>
        </Card>
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Recent activity</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Latest evaluations</h2>
          </div>
          <Link className={buttonClassName({ variant: 'secondary' })} href="/app/evaluate/start">
            New evaluation
          </Link>
        </div>
        {evaluations.items.length === 0 ? (
          <EmptyState
            action={
              <Link className={buttonClassName({})} href="/app/evaluate/start">
                Create the first evaluation
              </Link>
            }
            description="Create the first assessment to unlock the summary, dashboard, and report flow."
            title="No evaluations yet"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {evaluations.items.slice(0, 4).map((evaluation) => (
              <Card key={evaluation.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-2">
                    <Badge tone={evaluationStatusTone(evaluation.status)}>{evaluation.status}</Badge>
                    <Badge tone={confidenceTone(evaluation.confidenceBand)}>
                      {evaluation.confidenceBand} confidence
                    </Badge>
                    <h3 className="text-xl font-bold text-slate-950">{evaluation.name}</h3>
                  </div>
                  <Link
                    className={buttonClassName({ variant: 'ghost' })}
                    href={`/app/evaluate/${evaluation.id}/dashboard`}
                  >
                    View
                  </Link>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {evaluation.country} · {evaluation.naceDivision}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <span>Updated {formatDate(evaluation.updatedAt)}</span>
                  <span>Financial {evaluation.financialTotal}</span>
                  <span>Risk {evaluation.riskOverall}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
