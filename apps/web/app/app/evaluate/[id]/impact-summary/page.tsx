import Link from 'next/link';
import { forbidden, notFound } from 'next/navigation';
import { Badge, Card, buttonClassName } from '@packages/ui';
import { ApiRequestError } from '../../../../../lib/api-error';
import { priorityTone } from '../../../../../lib/display';
import { getEvaluation, getImpactSummary } from '../../../../../lib/server-api';
import { EvaluationProgress } from '../../../../../components/evaluation-progress';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export default async function ImpactSummaryPage({ params }: { params: Params }) {
  const { id } = await params;

  try {
    const [evaluation, summary] = await Promise.all([getEvaluation(id), getImpactSummary(id)]);

    return (
      <div className="grid gap-6">
        <EvaluationProgress currentStep="impact_summary" evaluationId={evaluation.id} />

        <Card className="border-[#d7e8c8]">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
            Impact summary
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">What matters most right now</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            This output is generated from the saved answers and keeps relevant topics distinct from
            high-priority topics.
          </p>
        </Card>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-[#d7e8c8]">
            <h2 className="text-xl font-bold text-slate-950">High-priority topics</h2>
            <div className="mt-5 grid gap-3">
              {summary.highPriorityTopics.length === 0 ? (
                <p className="text-sm text-slate-600">No topics are above the 2.5 threshold yet.</p>
              ) : (
                summary.highPriorityTopics.map((topic) => (
                  <div className="rounded-2xl bg-[#f7f9f4] p-4" key={topic.topicCode}>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold text-slate-950">{topic.title}</h3>
                      <Badge tone={priorityTone(topic.priorityBand)}>{topic.score}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{topic.recommendation}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="border-[#d7e8c8]">
            <h2 className="text-xl font-bold text-slate-950">Relevant topics</h2>
            <div className="mt-5 grid gap-3">
              {summary.relevantTopics.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No topics are currently in the relevant band.
                </p>
              ) : (
                summary.relevantTopics.map((topic) => (
                  <div className="rounded-2xl bg-[#f7f9f4] p-4" key={topic.topicCode}>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold text-slate-950">{topic.title}</h3>
                      <Badge tone={priorityTone(topic.priorityBand)}>{topic.score}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{topic.recommendation}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-[#d7e8c8]">
            <h2 className="text-xl font-bold text-slate-950">What to consider next</h2>
            <div className="mt-5 grid gap-3">
              {summary.whatToConsiderNext.map((item) => (
                <div
                  className="rounded-2xl bg-[#f7f9f4] p-4 text-sm leading-7 text-slate-700"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-[#d7e8c8]">
            <h2 className="text-xl font-bold text-slate-950">Relevant SDGs</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {summary.relevantSdgs.map((sdg) => (
                <Badge key={sdg.number} tone="emerald">
                  SDG {sdg.number}
                </Badge>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className={buttonClassName({ className: 'bg-[#00654A] hover:bg-[#0b7a59]' })}
                href={`/app/evaluate/${evaluation.id}/sdg-alignment`}
              >
                Continue to SDG alignment
              </Link>
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
