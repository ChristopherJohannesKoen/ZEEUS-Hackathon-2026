import Link from 'next/link';
import { Badge, Card, buttonClassName } from '@packages/ui';
import { confidenceTone, evaluationStatusTone, formatDate, roleTone } from '../../lib/display';
import { getEvaluations, requireCurrentUser } from '../../lib/server-api';

export default async function DashboardPage() {
  const currentUser = await requireCurrentUser();
  const evaluations = await getEvaluations();

  const completedCount = evaluations.items.filter((item) => item.status === 'completed').length;
  const inProgressCount = evaluations.items.filter((item) => item.status === 'in_progress').length;
  const archivedCount = evaluations.items.filter((item) => item.status === 'archived').length;

  return (
    <div className="grid gap-8">
      <section className="overflow-hidden rounded-[32px] bg-gradient-to-br from-brand to-brand-dark p-8 text-white">
        <div className="pattern-circles -mx-8 -my-8 px-8 py-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              className="border border-white/20 bg-white/10 text-white"
              tone={roleTone(currentUser.role)}
            >
              {currentUser.role}
            </Badge>
            <span className="text-xs uppercase tracking-[0.3em] text-[#d9ef9b]">
              Assessment workspace
            </span>
          </div>
          <div className="mt-6 space-y-3">
            <h1 className="text-4xl font-black tracking-tight">
              Welcome back, {currentUser.name}.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-white/80">
              Continue saved assessments, review materiality outputs, and move directly into the
              dashboard and report flow for startup sustainability guidance and export.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className={buttonClassName({
                className: 'bg-white text-brand-dark hover:bg-brand-lime hover:text-brand-dark'
              })}
              href="/app/evaluate/start"
            >
              New evaluation
            </Link>
            <Link
              className={buttonClassName({
                variant: 'ghost',
                className: 'border border-white/20 text-white hover:bg-white/10 hover:text-white'
              })}
              href="/app/evaluations"
            >
              View all evaluations
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="border-surface-border">
          <p className="text-xs uppercase tracking-[0.25em] text-[#5c7353]">Total</p>
          <p className="mt-4 text-4xl font-black text-slate-950">{evaluations.items.length}</p>
          <p className="mt-2 text-sm text-slate-600">Saved evaluations across the full wizard.</p>
        </Card>
        <Card className="border-surface-border">
          <p className="text-xs uppercase tracking-[0.25em] text-[#5c7353]">Completed</p>
          <p className="mt-4 text-4xl font-black text-slate-950">{completedCount}</p>
          <p className="mt-2 text-sm text-slate-600">Ready for dashboard review and export.</p>
        </Card>
        <Card className="border-surface-border">
          <p className="text-xs uppercase tracking-[0.25em] text-[#5c7353]">In progress</p>
          <p className="mt-4 text-4xl font-black text-slate-950">{inProgressCount}</p>
          <p className="mt-2 text-sm text-slate-600">
            Active drafts moving through the assessment steps.
          </p>
        </Card>
        <Card className="border-surface-border">
          <p className="text-xs uppercase tracking-[0.25em] text-[#5c7353]">Archived</p>
          <p className="mt-4 text-4xl font-black text-slate-950">{archivedCount}</p>
          <p className="mt-2 text-sm text-slate-600">
            Frozen snapshots retained for reporting and review.
          </p>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-surface-border">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#5c7353]">Recent activity</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Latest evaluations</h2>
            </div>
            <Link className={buttonClassName({ variant: 'secondary' })} href="/app/evaluations">
              Open list
            </Link>
          </div>

          {evaluations.items.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-surface-border bg-[#fbfdf8] p-8">
              <h3 className="text-lg font-bold text-slate-950">No evaluations yet</h3>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                Start with the startup context form to generate the initial SDG summary and unlock
                the rest of the workflow.
              </p>
              <div className="mt-5">
                <Link
                  className={buttonClassName({ className: 'bg-brand hover:bg-brand-dark' })}
                  href="/app/evaluate/start"
                >
                  Start evaluation
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {evaluations.items.slice(0, 4).map((evaluation) => (
                <div
                  className="rounded-[28px] border border-surface-border bg-[#fbfdf8] p-5"
                  key={evaluation.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={evaluationStatusTone(evaluation.status)}>
                          {evaluation.status}
                        </Badge>
                        <Badge tone={confidenceTone(evaluation.confidenceBand)}>
                          {evaluation.confidenceBand} confidence
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-slate-950">{evaluation.name}</h3>
                      <p className="text-sm text-slate-600">
                        {evaluation.country} / {evaluation.naceDivision}
                      </p>
                    </div>
                    <Link
                      className={buttonClassName({ variant: 'secondary' })}
                      href={`/app/evaluate/${evaluation.id}/dashboard`}
                    >
                      Open
                    </Link>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#5c7353]">Financial</p>
                      <p className="mt-2 text-2xl font-black text-slate-950">
                        {evaluation.financialTotal}/12
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#5c7353]">
                        Risk overall
                      </p>
                      <p className="mt-2 text-2xl font-black text-slate-950">
                        {evaluation.riskOverall.toFixed(1)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#5c7353]">
                        Opportunity overall
                      </p>
                      <p className="mt-2 text-2xl font-black text-slate-950">
                        {evaluation.opportunityOverall.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                    Updated {formatDate(evaluation.updatedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="grid gap-6">
          <Card className="border-surface-border bg-[#f4f9ee]">
            <p className="text-xs uppercase tracking-[0.25em] text-[#5c7353]">Program readiness</p>
            <h2 className="mt-3 text-2xl font-black text-slate-950">Deterministic by design</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              The platform preserves the fixed scoring logic from the workbook, keeps saved answers
              in PostgreSQL, and supports dashboard and export outputs without moving the core logic
              into AI.
            </p>
          </Card>

          <Card className="border-surface-border">
            <p className="text-xs uppercase tracking-[0.25em] text-[#5c7353]">Working principle</p>
            <h2 className="mt-3 text-2xl font-black text-slate-950">Guidance, not judgment</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Complete Stage I to identify material topics, then Stage II to map the downside risks
              and upside opportunities. The dashboard and report views are generated from those
              saved answers automatically.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
