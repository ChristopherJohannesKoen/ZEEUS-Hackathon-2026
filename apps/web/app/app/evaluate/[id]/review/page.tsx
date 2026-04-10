import Link from 'next/link';
import { forbidden, notFound } from 'next/navigation';
import { Badge, Card, buttonClassName } from '@packages/ui';
import { ArtifactActions } from '../../../../../components/artifact-actions';
import { EvaluationLifecycleActions } from '../../../../../components/evaluation-lifecycle-actions';
import { EvaluationProgress } from '../../../../../components/evaluation-progress';
import { ApiRequestError } from '../../../../../lib/api-error';
import { confidenceTone, priorityTone } from '../../../../../lib/display';
import { getEvaluationReport } from '../../../../../lib/server-api';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export default async function EvaluationReviewPage({ params }: { params: Params }) {
  const { id } = await params;

  try {
    const report = await getEvaluationReport(id);

    return (
      <div className="grid gap-6">
        <EvaluationProgress currentStep="review" evaluationId={report.evaluation.id} />

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-surface-border bg-gradient-to-br from-brand to-brand-dark text-white">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border border-white/20 bg-white/10 text-white" tone="slate">
                Review before completion
              </Badge>
              <Badge
                className="border border-white/20 bg-white/10 text-white"
                tone={confidenceTone(report.dashboard.confidenceBand)}
              >
                {report.dashboard.confidenceBand} confidence
              </Badge>
            </div>
            <h1 className="mt-5 text-3xl font-black">{report.evaluation.name}</h1>
            <p className="mt-3 text-sm leading-7 text-white/80">
              Confirm the startup context, material topics, risks, opportunities, and recommended
              next actions before freezing the current revision as a completed assessment.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              <span>{report.evaluation.initialSummary.stageLabel}</span>
              <span>
                {report.evaluation.businessCategoryMain ?? report.evaluation.naceDivision}
              </span>
              {report.evaluation.extendedNaceCode ? (
                <span>{report.evaluation.extendedNaceCode}</span>
              ) : null}
              {report.evaluation.country ? <span>{report.evaluation.country}</span> : null}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[28px] bg-white/10 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#d9ef9b]">Financial</p>
                <p className="mt-2 text-3xl font-black">{report.dashboard.financialTotal}/12</p>
              </div>
              <div className="rounded-[28px] bg-white/10 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#d9ef9b]">Risk overall</p>
                <p className="mt-2 text-3xl font-black">{report.dashboard.riskOverall}</p>
              </div>
              <div className="rounded-[28px] bg-white/10 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#d9ef9b]">
                  Opportunity overall
                </p>
                <p className="mt-2 text-3xl font-black">{report.dashboard.opportunityOverall}</p>
              </div>
            </div>
          </Card>

          <Card className="border-surface-border">
            <p className="text-xs uppercase tracking-[0.25em] text-[#58724d]">Completion gate</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Freeze the current deterministic result
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Completing the evaluation preserves the current report snapshot as an immutable
              revision. Reopening later starts a new draft revision instead of mutating the
              completed result.
            </p>
            <div className="mt-5">
              <EvaluationLifecycleActions
                evaluationId={report.evaluation.id}
                mode="review"
                status={report.evaluation.status}
              />
            </div>
            <div className="mt-5">
              <ArtifactActions evaluationId={report.evaluation.id} />
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-surface-border bg-[#fbfdf8]">
            <p className="text-xs uppercase tracking-[0.25em] text-[#58724d]">
              Score interpretation
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Review the output in workbook bands
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {report.dashboard.scoreInterpretation.subtitle ??
                'Use the same deterministic band guidance shown throughout the workbook-parity flow when deciding whether a revision is ready to freeze.'}
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {report.dashboard.scoreInterpretation.bands.map((band) => (
                <div className="rounded-[24px] bg-white p-4" key={band.key}>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{band.key}</p>
                  <p className="mt-2 font-bold text-slate-950">{band.title}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                    {band.scoreRangeLabel}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{band.interpretation}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-surface-border">
            <p className="text-xs uppercase tracking-[0.25em] text-[#58724d]">
              Stage II matrix legend
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Risk and opportunity bands</h2>
            <div className="mt-5 grid gap-3">
              {[
                {
                  title: 'Risks',
                  entries: report.dashboard.riskMatrixLegend.entries
                },
                {
                  title: 'Opportunities',
                  entries: report.dashboard.opportunityMatrixLegend.entries
                }
              ].map((legend) => (
                <div className="rounded-[24px] bg-[#f7f9f4] p-4" key={legend.title}>
                  <p className="text-sm font-bold text-slate-950">{legend.title}</p>
                  <div className="mt-3 grid gap-2">
                    {legend.entries.map((entry) => (
                      <p
                        className="text-sm leading-7 text-slate-600"
                        key={`${legend.title}-${entry.label}`}
                      >
                        <span className="font-semibold text-slate-950">{entry.label}:</span>{' '}
                        {entry.whatItMeans}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-surface-border">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-slate-950">Material topics</h2>
              <Link
                className={buttonClassName({ variant: 'secondary' })}
                href={`/app/evaluate/${report.evaluation.id}/impact-summary`}
              >
                Adjust topics
              </Link>
            </div>
            <div className="mt-5 grid gap-3">
              {report.dashboard.materialAlerts.map((topic) => (
                <div className="rounded-[28px] bg-[#f7f9f4] p-4" key={topic.topicCode}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{topic.title}</p>
                    <Badge tone={priorityTone(topic.priorityBand)}>{topic.score}</Badge>
                  </div>
                  {topic.recommendation ? (
                    <p className="mt-3 text-sm leading-7 text-slate-600">{topic.recommendation}</p>
                  ) : null}
                  {topic.interpretation ? (
                    <p className="mt-2 text-xs leading-6 text-slate-500">{topic.interpretation}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-surface-border">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-slate-950">Recommendations</h2>
              <Link
                className={buttonClassName({ variant: 'secondary' })}
                href={`/app/evaluate/${report.evaluation.id}/dashboard`}
              >
                Back to dashboard
              </Link>
            </div>
            <div className="mt-5 grid gap-3">
              {report.dashboard.recommendations.map((recommendation) => (
                <div className="rounded-[28px] bg-[#f7f9f4] p-4" key={recommendation.id}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {recommendation.source} / {recommendation.severityBand}
                  </p>
                  <h3 className="mt-2 font-bold text-slate-950">{recommendation.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{recommendation.text}</p>
                  {recommendation.rationale ? (
                    <p className="mt-2 text-xs leading-6 text-slate-500">
                      {recommendation.rationale}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>
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
