import Link from 'next/link';
import { forbidden, notFound } from 'next/navigation';
import { Badge, Card, buttonClassName } from '@packages/ui';
import { ArtifactActions } from '../../../../../components/artifact-actions';
import { EvaluationLifecycleActions } from '../../../../../components/evaluation-lifecycle-actions';
import { EvaluationProgress } from '../../../../../components/evaluation-progress';
import { NarrativeActionsPanel } from '../../../../../components/narrative-actions-panel';
import { RecommendationActionsBoard } from '../../../../../components/recommendation-actions-board';
import { ApiRequestError } from '../../../../../lib/api-error';
import { confidenceTone, priorityTone } from '../../../../../lib/display';
import {
  getEvaluation,
  getEvaluationBenchmarks,
  getEvaluationDashboard,
  getEvaluationNarratives
} from '../../../../../lib/server-api';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export default async function DashboardPage({ params }: { params: Params }) {
  const { id } = await params;

  try {
    const [evaluation, dashboard, narratives, benchmarks] = await Promise.all([
      getEvaluation(id),
      getEvaluationDashboard(id),
      getEvaluationNarratives(id),
      getEvaluationBenchmarks(id)
    ]);

    return (
      <div className="grid gap-6">
        <EvaluationProgress currentStep="dashboard" evaluationId={evaluation.id} />

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden border-surface-border bg-gradient-to-br from-brand to-brand-dark p-0 text-white">
            <div className="pattern-circles p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d9ef9b]">
                    Results dashboard
                  </p>
                  <h1 className="mt-2 text-3xl font-black">{evaluation.name}</h1>
                  <p className="mt-2 text-sm text-white/75">
                    Deterministic summary across financial indicators, impacts, risks, and
                    opportunities.
                  </p>
                </div>
                <Badge
                  className="border border-white/20 bg-white/10 text-white"
                  tone={confidenceTone(dashboard.confidenceBand)}
                >
                  {dashboard.confidenceBand} confidence
                </Badge>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-[28px] bg-white/10 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#d9ef9b]">
                    Financial total
                  </p>
                  <p className="mt-3 text-4xl font-black">{dashboard.financialTotal}/12</p>
                </div>
                <div className="rounded-[28px] bg-white/10 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#d9ef9b]">Risk overall</p>
                  <p className="mt-3 text-4xl font-black">{dashboard.riskOverall.toFixed(1)}</p>
                </div>
                <div className="rounded-[28px] bg-white/10 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#d9ef9b]">
                    Opportunity overall
                  </p>
                  <p className="mt-3 text-4xl font-black">
                    {dashboard.opportunityOverall.toFixed(1)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  className={buttonClassName({
                    className: 'bg-white text-brand-dark hover:bg-brand-lime hover:text-brand-dark'
                  })}
                  href={`/app/report/${evaluation.id}`}
                >
                  Open report
                </Link>
                <Link
                  className={buttonClassName({
                    className:
                      'border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white'
                  })}
                  href={`/app/evaluate/${evaluation.id}/benchmarks`}
                >
                  Open benchmarks
                </Link>
              </div>
              <div className="mt-4">
                <ArtifactActions evaluationId={evaluation.id} />
              </div>
            </div>
          </Card>

          <Card className="border-surface-border">
            <p className="text-xs uppercase tracking-[0.25em] text-[#58724d]">
              Sensitivity and confidence
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Explain near-threshold topics
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              These hints do not change the canonical scores. They help explain where a small shift
              in assumptions could move a topic into a higher priority band.
            </p>
            <div className="mt-5 grid gap-3">
              {dashboard.sensitivityHints.length === 0 ? (
                <div className="rounded-[28px] bg-[#f7f9f4] p-5 text-sm leading-7 text-slate-600">
                  No near-threshold topics were detected from the saved answers.
                </div>
              ) : (
                dashboard.sensitivityHints.map((hint) => (
                  <div className="rounded-[28px] bg-[#f7f9f4] p-5" key={hint.topicCode}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-950">{hint.title}</p>
                      <Badge tone={priorityTone(hint.currentBand)}>{hint.currentBand}</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{hint.message}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>

        <Card className="border-surface-border">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#58724d]">Lifecycle</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Freeze, reopen, and review revisions
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Completed evaluations are preserved as immutable snapshots. Reopening starts a new
                draft revision without mutating the completed result.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <EvaluationLifecycleActions evaluationId={evaluation.id} status={evaluation.status} />
          </div>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr_0.9fr]">
          <Card className="border-surface-border">
            <h2 className="text-xl font-bold text-slate-950">Environmental topics</h2>
            <div className="mt-5 grid gap-3">
              {dashboard.environmentalTopics.map((topic) => (
                <div className="rounded-[28px] bg-[#f7f9f4] p-4" key={topic.topicCode}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{topic.title}</p>
                    <Badge tone={priorityTone(topic.priorityBand)}>{topic.score}</Badge>
                  </div>
                  {topic.recommendation ? (
                    <p className="mt-3 text-sm leading-7 text-slate-600">{topic.recommendation}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-surface-border">
            <h2 className="text-xl font-bold text-slate-950">Social and governance topics</h2>
            <div className="mt-5 grid gap-3">
              {dashboard.socialTopics.map((topic) => (
                <div className="rounded-[28px] bg-[#f7f9f4] p-4" key={topic.topicCode}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{topic.title}</p>
                    <Badge tone={priorityTone(topic.priorityBand)}>{topic.score}</Badge>
                  </div>
                  {topic.recommendation ? (
                    <p className="mt-3 text-sm leading-7 text-slate-600">{topic.recommendation}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-6">
            <Card className="border-surface-border">
              <h2 className="text-xl font-bold text-slate-950">Material alerts</h2>
              <div className="mt-5 grid gap-3">
                {dashboard.materialAlerts.map((topic) => (
                  <div className="rounded-[28px] bg-[#f7f9f4] p-4" key={topic.topicCode}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-950">{topic.title}</p>
                      <Badge tone={priorityTone(topic.priorityBand)}>{topic.score}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-surface-border bg-[#f4f9ee]">
              <p className="text-xs uppercase tracking-[0.25em] text-[#58724d]">Confidence panel</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                {dashboard.confidenceBand} confidence
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Confidence is derived from the saved evidence basis across Stage I and Stage II. It
                does not modify scores; it only helps explain how sturdy the current inputs are.
              </p>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-surface-border">
            <h2 className="text-xl font-bold text-slate-950">Top risks</h2>
            <div className="mt-5 grid gap-3">
              {dashboard.topRisks.map((risk) => (
                <div className="rounded-[28px] bg-[#fff5f5] p-4" key={risk.code}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{risk.title}</p>
                    <Badge tone="rose">{risk.score}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{risk.actionWindow}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    {risk.ratingLabel}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-surface-border">
            <h2 className="text-xl font-bold text-slate-950">Top opportunities</h2>
            <div className="mt-5 grid gap-3">
              {dashboard.topOpportunities.map((item) => (
                <div className="rounded-[28px] bg-[#f4f9ee] p-4" key={item.code}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{item.title}</p>
                    <Badge tone="emerald">{item.score}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.actionWindow}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    {item.ratingLabel}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <Card className="border-surface-border">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#58724d]">Benchmarking</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Compare this revision to prior work and seeded baselines
              </h2>
            </div>
            <Link
              className={buttonClassName({ variant: 'secondary' })}
              href={`/app/evaluate/${evaluation.id}/benchmarks`}
            >
              View benchmark workspace
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {benchmarks.metrics.map((metric) => (
              <div className="rounded-[28px] bg-[#f7f9f4] p-5" key={metric.label}>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{metric.label}</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{metric.current}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Previous {metric.previous ?? 'n/a'} / Reference {metric.reference ?? 'n/a'}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3">
            {benchmarks.takeaways.map((takeaway) => (
              <div className="rounded-[28px] bg-[#f4f9ee] px-5 py-4 text-sm leading-7 text-slate-700" key={takeaway}>
                {takeaway}
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-surface-border">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#58724d]">Recommendations</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">What to do next</h2>
            </div>
            <Link
              className={buttonClassName({ variant: 'secondary' })}
              href={`/app/report/${evaluation.id}`}
            >
              View report
            </Link>
          </div>

          <div className="mt-6">
            <RecommendationActionsBoard
              evaluationId={evaluation.id}
              revisionNumber={evaluation.currentRevisionNumber}
              recommendations={dashboard.recommendations}
            />
          </div>
        </Card>

        <Card className="border-surface-border">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#58724d]">AI explanations</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Generate revision-scoped narrative guidance
              </h2>
            </div>
          </div>
          <div className="mt-6">
            <NarrativeActionsPanel
              evaluationId={evaluation.id}
              narratives={narratives.items}
            />
          </div>
        </Card>
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
