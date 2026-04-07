import Link from 'next/link';
import { forbidden, notFound } from 'next/navigation';
import { Badge, Card, buttonClassName } from '@packages/ui';
import type { MaterialTopicSummary, Recommendation } from '@packages/shared';
import { ApiRequestError } from '../../../../../../lib/api-error';
import {
  confidenceTone,
  evaluationStatusTone,
  formatDate,
  priorityTone
} from '../../../../../../lib/display';
import { getEvaluationRevision } from '../../../../../../lib/server-api';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string; revisionNumber: string }>;

export default async function EvaluationRevisionDetailPage({ params }: { params: Params }) {
  const { id, revisionNumber } = await params;
  const parsedRevisionNumber = Number(revisionNumber);

  try {
    const revision = await getEvaluationRevision(id, parsedRevisionNumber);
    const report = revision.report;

    return (
      <div className="grid gap-6">
        <section className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
              Immutable snapshot
            </p>
            <h1 className="mt-2 text-4xl font-black text-slate-950">
              Revision {revision.revisionNumber}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              This view renders the saved report snapshot for the selected revision number.
            </p>
          </div>
          <Link
            className={buttonClassName({ variant: 'secondary' })}
            href={`/app/evaluate/${id}/revisions`}
          >
            Back to revisions
          </Link>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-surface-border bg-gradient-to-br from-brand to-brand-dark text-white">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border border-white/20 bg-white/10 text-white" tone="slate">
                Revision {revision.revisionNumber}
              </Badge>
              <Badge
                className="border border-white/20 bg-white/10 text-white"
                tone={evaluationStatusTone(revision.status)}
              >
                {revision.status}
              </Badge>
              <Badge
                className="border border-white/20 bg-white/10 text-white"
                tone={confidenceTone(report.dashboard.confidenceBand)}
              >
                {report.dashboard.confidenceBand} confidence
              </Badge>
            </div>
            <h2 className="mt-5 text-3xl font-black">{report.evaluation.name}</h2>
            <p className="mt-3 text-sm text-white/80">
              Saved {formatDate(revision.createdAt)} / step {report.evaluation.currentStep}
            </p>
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
            <h2 className="text-2xl font-black text-slate-950">Version metadata</h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[28px] bg-[#f7f9f4] p-4 text-sm text-slate-700">
                Scoring version: {revision.scoringVersionInfo.scoringVersion}
              </div>
              <div className="rounded-[28px] bg-[#f7f9f4] p-4 text-sm text-slate-700">
                Catalog version: {revision.scoringVersionInfo.catalogVersion}
              </div>
              <div className="rounded-[28px] bg-[#f7f9f4] p-4 text-sm text-slate-700">
                Current step at save: {revision.currentStep}
              </div>
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-surface-border">
            <h2 className="text-2xl font-black text-slate-950">Material topics</h2>
            <div className="mt-5 grid gap-3">
              {report.dashboard.materialAlerts.map((topic: MaterialTopicSummary) => (
                <div className="rounded-[28px] bg-[#f7f9f4] p-4" key={topic.topicCode}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{topic.title}</p>
                    <Badge tone={priorityTone(topic.priorityBand)}>{topic.score}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-surface-border">
            <h2 className="text-2xl font-black text-slate-950">Recommendations</h2>
            <div className="mt-5 grid gap-3">
              {report.dashboard.recommendations.map((recommendation: Recommendation) => (
                <div className="rounded-[28px] bg-[#f7f9f4] p-4" key={recommendation.id}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {recommendation.source} / {recommendation.severityBand}
                  </p>
                  <h3 className="mt-2 font-bold text-slate-950">{recommendation.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{recommendation.text}</p>
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
