import Link from 'next/link';
import { forbidden, notFound } from 'next/navigation';
import { Badge, Card, buttonClassName } from '@packages/ui';
import { ApiRequestError } from '../../../../../lib/api-error';
import { confidenceTone, priorityTone } from '../../../../../lib/display';
import { getEvaluation, getEvaluationDashboard } from '../../../../../lib/server-api';
import { EvaluationProgress } from '../../../../../components/evaluation-progress';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export default async function DashboardPage({ params }: { params: Params }) {
  const { id } = await params;

  try {
    const [evaluation, dashboard] = await Promise.all([
      getEvaluation(id),
      getEvaluationDashboard(id)
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
                <a
                  className={buttonClassName({
                    variant: 'ghost',
                    className:
                      'border border-white/20 text-white hover:bg-white/10 hover:text-white'
                  })}
                  href={`/api/evaluations/${evaluation.id}/export.csv`}
                >
                  Export CSV
                </a>
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

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {dashboard.recommendations.map((recommendation) => (
              <div className="rounded-[28px] bg-[#f7f9f4] p-5" key={recommendation.id}>
                <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">
                  {recommendation.source} · {recommendation.severityBand}
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-950">{recommendation.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{recommendation.text}</p>
              </div>
            ))}
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
