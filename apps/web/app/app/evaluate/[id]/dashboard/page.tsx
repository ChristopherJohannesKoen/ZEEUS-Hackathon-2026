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

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-[#d7e8c8] bg-[#0f2a21] text-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b8d88d]">
                  Results dashboard
                </p>
                <h1 className="mt-2 text-3xl font-black">{evaluation.name}</h1>
              </div>
              <Badge tone={confidenceTone(dashboard.confidenceBand)}>
                {dashboard.confidenceBand} confidence
              </Badge>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#cbe6a6]">Financial total</p>
                <p className="mt-3 text-4xl font-black">{dashboard.financialTotal}</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#cbe6a6]">Risk overall</p>
                <p className="mt-3 text-4xl font-black">{dashboard.riskOverall}</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#cbe6a6]">Opportunity overall</p>
                <p className="mt-3 text-4xl font-black">{dashboard.opportunityOverall}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className={buttonClassName({ className: 'bg-white text-slate-950 hover:bg-slate-200' })} href={`/app/report/${evaluation.id}`}>
                Open report
              </Link>
              <a
                className={buttonClassName({ variant: 'secondary', className: 'border border-white/10 bg-white/10 text-white hover:bg-white/15' })}
                href={`/api/evaluations/${evaluation.id}/export.csv`}
              >
                Export CSV
              </a>
            </div>
          </Card>

          <Card className="border-[#d7e8c8]">
            <h2 className="text-xl font-bold text-slate-950">Sensitivity and confidence</h2>
            <div className="mt-5 grid gap-3">
              {dashboard.sensitivityHints.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No near-threshold topics were detected from the saved Stage I answers.
                </p>
              ) : (
                dashboard.sensitivityHints.map((hint) => (
                  <div className="rounded-2xl bg-[#f7f9f4] p-4" key={hint.topicCode}>
                    <p className="font-semibold text-slate-950">{hint.title}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{hint.message}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="border-[#d7e8c8] lg:col-span-1">
            <h2 className="text-xl font-bold text-slate-950">Material alerts</h2>
            <div className="mt-5 grid gap-3">
              {dashboard.materialAlerts.map((topic) => (
                <div className="rounded-2xl bg-[#f7f9f4] p-4" key={topic.topicCode}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{topic.title}</p>
                    <Badge tone={priorityTone(topic.priorityBand)}>{topic.score}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-[#d7e8c8]">
            <h2 className="text-xl font-bold text-slate-950">Top risks</h2>
            <div className="mt-5 grid gap-3">
              {dashboard.topRisks.map((risk) => (
                <div className="rounded-2xl bg-[#f7f9f4] p-4" key={risk.code}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{risk.title}</p>
                    <Badge tone="rose">{risk.score}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{risk.actionWindow}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-[#d7e8c8]">
            <h2 className="text-xl font-bold text-slate-950">Top opportunities</h2>
            <div className="mt-5 grid gap-3">
              {dashboard.topOpportunities.map((item) => (
                <div className="rounded-2xl bg-[#f7f9f4] p-4" key={item.code}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{item.title}</p>
                    <Badge tone="emerald">{item.score}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{item.actionWindow}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <Card className="border-[#d7e8c8]">
          <h2 className="text-xl font-bold text-slate-950">Recommendations</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {dashboard.recommendations.map((recommendation) => (
              <div className="rounded-2xl bg-[#f7f9f4] p-4" key={recommendation.id}>
                <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">
                  {recommendation.source} · {recommendation.severityBand}
                </p>
                <h3 className="mt-2 font-bold text-slate-950">{recommendation.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{recommendation.text}</p>
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
