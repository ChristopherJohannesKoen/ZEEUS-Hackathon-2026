import Link from 'next/link';
import { Badge, Card, EmptyState, buttonClassName } from '@packages/ui';
import { confidenceTone, evaluationStatusTone, formatDate } from '../../../lib/display';
import { getEvaluations } from '../../../lib/server-api';

export const dynamic = 'force-dynamic';

const continueRoute: Record<string, string> = {
  start: 'summary',
  summary: 'summary',
  stage_1: 'stage-1',
  stage_2: 'stage-2',
  impact_summary: 'impact-summary',
  sdg_alignment: 'sdg-alignment',
  dashboard: 'dashboard',
  report: 'dashboard'
};

export default async function EvaluationsPage() {
  const evaluations = await getEvaluations();

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#5c7353]">
            Workspace
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Saved evaluations</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Resume drafts, review completed assessments, or jump straight into the print-ready
            report.
          </p>
        </div>
        <Link className={buttonClassName({ className: 'bg-[#00654A] hover:bg-[#0b7a59]' })} href="/app/evaluate/start">
          Start evaluation
        </Link>
      </section>

      {evaluations.items.length === 0 ? (
        <EmptyState
          action={
            <Link className={buttonClassName({ className: 'bg-[#00654A] hover:bg-[#0b7a59]' })} href="/app/evaluate/start">
              Create the first evaluation
            </Link>
          }
          description="No saved assessments exist yet. Start with the startup context form to generate the initial SDG summary."
          title="Nothing saved yet"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {evaluations.items.map((evaluation) => (
            <Card className="border-[#d7e8c8]" key={evaluation.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={evaluationStatusTone(evaluation.status)}>{evaluation.status}</Badge>
                    <Badge tone={confidenceTone(evaluation.confidenceBand)}>
                      {evaluation.confidenceBand} confidence
                    </Badge>
                  </div>
                  <h2 className="mt-3 text-2xl font-black text-slate-950">{evaluation.name}</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {evaluation.country} · {evaluation.naceDivision}
                  </p>
                </div>
                <Link
                  className={buttonClassName({ variant: 'secondary' })}
                  href={`/app/evaluate/${evaluation.id}/${continueRoute[evaluation.currentStep]}`}
                >
                  Continue
                </Link>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-[#f4f9ee] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#5c7353]">Financial</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{evaluation.financialTotal}</p>
                </div>
                <div className="rounded-2xl bg-[#f4f9ee] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#5c7353]">Risk overall</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{evaluation.riskOverall}</p>
                </div>
                <div className="rounded-2xl bg-[#f4f9ee] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#5c7353]">Opportunity overall</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{evaluation.opportunityOverall}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                <span>Current step {evaluation.currentStep.replace('_', ' ')}</span>
                <span>Updated {formatDate(evaluation.updatedAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
