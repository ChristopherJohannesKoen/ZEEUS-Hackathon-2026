import { forbidden, notFound } from 'next/navigation';
import { Badge, Card, buttonClassName } from '@packages/ui';
import Link from 'next/link';
import { ApiRequestError } from '../../../../../lib/api-error';
import { confidenceTone, formatDate } from '../../../../../lib/display';
import { getEvaluation, getEvaluationSummary } from '../../../../../lib/server-api';
import { EvaluationContextForm } from '../../../../../components/evaluation-context-form';
import { EvaluationProgress } from '../../../../../components/evaluation-progress';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export default async function EvaluationSummaryPage({ params }: { params: Params }) {
  const { id } = await params;

  try {
    const [evaluation, summary] = await Promise.all([getEvaluation(id), getEvaluationSummary(id)]);

    return (
      <div className="grid gap-6">
        <EvaluationProgress currentStep="summary" evaluationId={evaluation.id} />

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-[#d7e8c8]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
                  Initial summary
                </p>
                <h1 className="mt-2 text-3xl font-black text-slate-950">{evaluation.name}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  This is an early compass reading based on the startup stage and business activity.
                </p>
              </div>
              <Badge tone={confidenceTone(evaluation.confidenceBand)}>
                {evaluation.confidenceBand} confidence
              </Badge>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-[#f4f9ee] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">Stage</p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">{summary.currentStage.replace('_', ' ')}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{summary.phaseGoal}</p>
              </div>
              <div className="rounded-3xl bg-[#f4f9ee] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">What to consider</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{summary.whatToConsider}</p>
              </div>
            </div>

            {summary.phaseConsideration ? (
              <div className="mt-4 rounded-3xl border border-[#dce8ce] bg-white p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">Phase consideration</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{summary.phaseConsideration}</p>
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-[#dce8ce] bg-white p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">Stage SDGs</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {summary.stageSdgs.map((sdg) => (
                    <Badge key={`stage-${sdg.number}`} tone="emerald">
                      SDG {sdg.number}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-[#dce8ce] bg-white p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">Business SDGs</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {summary.businessSdgs.map((sdg) => (
                    <Badge key={`business-${sdg.number}`} tone="amber">
                      SDG {sdg.number}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link className={buttonClassName({ className: 'bg-[#00654A] hover:bg-[#0b7a59]' })} href={`/app/evaluate/${evaluation.id}/stage-1`}>
                Continue to Stage I
              </Link>
              <Link className={buttonClassName({ variant: 'secondary' })} href={`/app/evaluate/${evaluation.id}/dashboard`}>
                View dashboard
              </Link>
            </div>

            <p className="mt-5 text-xs uppercase tracking-[0.2em] text-slate-500">
              Last updated {formatDate(evaluation.updatedAt)}
            </p>
          </Card>

          <EvaluationContextForm
            evaluationId={evaluation.id}
            initialValue={{
              name: evaluation.name,
              country: evaluation.country,
              naceDivision: evaluation.naceDivision,
              offeringType: evaluation.offeringType,
              launched: evaluation.launched,
              currentStage: evaluation.currentStage,
              innovationApproach: evaluation.innovationApproach
            }}
            mode="edit"
          />
        </section>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiRequestError) {
      if (error.statusCode === 404) {
        notFound();
      }

      if (error.statusCode === 403) {
        forbidden();
      }
    }

    throw error;
  }
}
