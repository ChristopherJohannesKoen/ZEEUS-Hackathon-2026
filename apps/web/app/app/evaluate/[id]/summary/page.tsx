import Link from 'next/link';
import { forbidden, notFound } from 'next/navigation';
import { Badge, Card, buttonClassName } from '@packages/ui';
import { ApiRequestError } from '../../../../../lib/api-error';
import { confidenceTone, formatDate, formatEnumLabel } from '../../../../../lib/display';
import { getEvaluation, getEvaluationSummary } from '../../../../../lib/server-api';
import { EvaluationContextForm } from '../../../../../components/evaluation-context-form';
import { EvaluationProgress } from '../../../../../components/evaluation-progress';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

function sdgTone(sourceType: 'stage' | 'business' | 'both') {
  if (sourceType === 'both') return 'emerald';
  if (sourceType === 'stage') return 'amber';
  return 'slate';
}

export default async function EvaluationSummaryPage({ params }: { params: Params }) {
  const { id } = await params;

  try {
    const [evaluation, summary] = await Promise.all([getEvaluation(id), getEvaluationSummary(id)]);

    return (
      <div className="grid gap-6">
        <EvaluationProgress currentStep="summary" evaluationId={evaluation.id} />

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-surface-border">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
                  Initial summary
                </p>
                <h1 className="mt-2 text-3xl font-black text-slate-950">{evaluation.name}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  This is the early compass reading generated from the startup stage and the NACE
                  business category before the full materiality workflow.
                </p>
              </div>
              <Badge tone={confidenceTone(evaluation.confidenceBand)}>
                {evaluation.confidenceBand} confidence
              </Badge>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] bg-[#f4f9ee] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">Stage focus</p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">
                  {formatEnumLabel(summary.currentStage)}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{summary.phaseGoal}</p>
              </div>
              <div className="rounded-[28px] bg-[#f4f9ee] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">
                  What to consider
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{summary.whatToConsider}</p>
              </div>
            </div>

            {summary.phaseConsideration ? (
              <div className="mt-4 rounded-[28px] border border-surface-border bg-white p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">
                  Phase consideration
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {summary.phaseConsideration}
                </p>
              </div>
            ) : null}

            <div className="mt-6 rounded-[28px] border border-surface-border bg-[#fbfdf8] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">
                    Initial SDG screening
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Stage and business-category suggestions are merged and tagged so you can see
                    where the strongest SDG signals are coming from.
                  </p>
                </div>
                <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-dark">
                  {summary.mergedSdgs.length} SDGs identified
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {summary.mergedSdgs.map((sdg) => (
                  <a
                    href={sdg.url}
                    key={`${sdg.number}-${sdg.sourceType}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Badge tone={sdgTone(sdg.sourceType)}>
                      SDG {sdg.number} · {sdg.sourceType}
                    </Badge>
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] border border-surface-border bg-white p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">Stage SDGs</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {summary.stageSdgs.map((sdg) => (
                    <Badge key={`stage-${sdg.number}`} tone="amber">
                      SDG {sdg.number}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-[28px] border border-surface-border bg-white p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">Business SDGs</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {summary.businessSdgs.map((sdg) => (
                    <Badge key={`business-${sdg.number}`} tone="slate">
                      SDG {sdg.number}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className={buttonClassName({ className: 'bg-brand hover:bg-brand-dark' })}
                href={`/app/evaluate/${evaluation.id}/stage-1`}
              >
                Continue to Stage I
              </Link>
              <Link
                className={buttonClassName({ variant: 'secondary' })}
                href={`/app/evaluate/${evaluation.id}/dashboard`}
              >
                View dashboard
              </Link>
            </div>

            <p className="mt-5 text-xs uppercase tracking-[0.2em] text-slate-500">
              Last updated {formatDate(evaluation.updatedAt)}
            </p>
          </Card>

          <div className="grid gap-6">
            <Card className="border-surface-border bg-[#f4f9ee]">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
                Evaluation path
              </p>
              <div className="mt-5 grid gap-3">
                {[
                  ['Stage I', 'Financial, environmental, social, and governance indicators'],
                  ['Stage II', 'Risks and opportunities'],
                  ['Impact Summary', 'Relevant and high-priority topics'],
                  ['SDG Alignment', 'Merged stage and business SDG output'],
                  ['Dashboard', 'Results, recommendations, and export']
                ].map(([title, description], index) => (
                  <div className="flex items-start gap-3" key={title}>
                    <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-950">{title}</p>
                      <p className="text-sm leading-6 text-slate-600">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
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
          </div>
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
