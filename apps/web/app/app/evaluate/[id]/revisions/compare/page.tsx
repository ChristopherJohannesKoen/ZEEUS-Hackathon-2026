import Link from 'next/link';
import { forbidden, notFound } from 'next/navigation';
import { Badge, Card, buttonClassName } from '@packages/ui';
import { ApiRequestError } from '../../../../../../lib/api-error';
import { formatEnumLabel } from '../../../../../../lib/display';
import {
  compareEvaluationRevisions,
  getEvaluation,
  getEvaluationRevisions
} from '../../../../../../lib/server-api';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ left?: string; right?: string }>;

export default async function EvaluationRevisionComparePage({
  params,
  searchParams
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const query = await searchParams;

  try {
    const [evaluation, revisions] = await Promise.all([getEvaluation(id), getEvaluationRevisions(id)]);

    if (revisions.items.length < 2) {
      return (
        <div className="grid gap-6">
          <Card className="border-surface-border">
            <h1 className="text-3xl font-black text-slate-950">Revision comparison</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              At least two saved revisions are required before a comparison can be generated.
            </p>
            <div className="mt-5">
              <Link
                className={buttonClassName({ variant: 'secondary' })}
                href={`/app/evaluate/${id}/revisions`}
              >
                Back to revisions
              </Link>
            </div>
          </Card>
        </div>
      );
    }

    const defaultLeft = revisions.items[1]?.revisionNumber ?? revisions.items[0]!.revisionNumber;
    const defaultRight = revisions.items[0]!.revisionNumber;
    const left = Number(query.left ?? defaultLeft);
    const right = Number(query.right ?? defaultRight);
    const comparison = await compareEvaluationRevisions(id, left, right);

    return (
      <div className="grid gap-6">
        <section className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
              Revision comparison
            </p>
            <h1 className="mt-2 text-4xl font-black text-slate-950">{evaluation.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Compare startup context, dashboard metrics, topics, risks, opportunities, and
              recommendation coverage between two immutable revisions.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className={buttonClassName({ variant: 'secondary' })}
              href={`/app/evaluate/${id}/revisions`}
            >
              Back to revisions
            </Link>
          </div>
        </section>

        <Card className="border-surface-border bg-[#f4f9ee]">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="amber">Left revision {comparison.leftRevision.revisionNumber}</Badge>
            <Badge tone="emerald">Right revision {comparison.rightRevision.revisionNumber}</Badge>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Left: {comparison.leftRevision.scoringVersionInfo.scoringVersion} /{' '}
            {comparison.leftRevision.scoringVersionInfo.catalogVersion}
            <br />
            Right: {comparison.rightRevision.scoringVersionInfo.scoringVersion} /{' '}
            {comparison.rightRevision.scoringVersionInfo.catalogVersion}
          </p>
        </Card>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-surface-border">
            <h2 className="text-2xl font-black text-slate-950">Context changes</h2>
            <div className="mt-5 grid gap-3">
              {comparison.contextChanges.length === 0 ? (
                <p className="rounded-[28px] bg-[#f7f9f4] p-4 text-sm leading-7 text-slate-600">
                  No startup context fields changed between these revisions.
                </p>
              ) : (
                comparison.contextChanges.map((change) => (
                  <div className="rounded-[28px] bg-[#f7f9f4] p-4" key={change.field}>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{change.label}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {change.leftValue} → {change.rightValue}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="border-surface-border">
            <h2 className="text-2xl font-black text-slate-950">Metric deltas</h2>
            <div className="mt-5 grid gap-3">
              {comparison.metricChanges.map((change) => (
                <div className="rounded-[28px] bg-[#f7f9f4] p-4" key={change.field}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{change.label}</p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {change.leftValue} → {change.rightValue}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Delta {change.delta}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-surface-border">
            <h2 className="text-2xl font-black text-slate-950">Stage I topic changes</h2>
            <div className="mt-5 grid gap-3">
              {comparison.topicChanges.length === 0 ? (
                <p className="rounded-[28px] bg-[#f7f9f4] p-4 text-sm leading-7 text-slate-600">
                  No Stage I topic score or band changed.
                </p>
              ) : (
                comparison.topicChanges.map((change) => (
                  <div className="rounded-[28px] bg-[#f7f9f4] p-4" key={change.code}>
                    <p className="font-semibold text-slate-950">{change.title}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {change.leftBand ? formatEnumLabel(change.leftBand) : 'n/a'} ({change.leftScore ?? 'n/a'}) →
                      {` `}
                      {change.rightBand ? formatEnumLabel(change.rightBand) : 'n/a'} ({change.rightScore ?? 'n/a'})
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="border-surface-border">
            <h2 className="text-2xl font-black text-slate-950">Recommendation changes</h2>
            <div className="mt-5 grid gap-3">
              {comparison.recommendationChanges.length === 0 ? (
                <p className="rounded-[28px] bg-[#f7f9f4] p-4 text-sm leading-7 text-slate-600">
                  Recommendation coverage stayed the same.
                </p>
              ) : (
                comparison.recommendationChanges.map((change) => (
                  <div className="rounded-[28px] bg-[#f7f9f4] p-4" key={change.recommendationId}>
                    <p className="font-semibold text-slate-950">{change.title}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {change.source} / {change.severityBand}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Left {change.leftPresent ? 'present' : 'absent'} / Right{' '}
                      {change.rightPresent ? 'present' : 'absent'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-surface-border">
            <h2 className="text-2xl font-black text-slate-950">Risk changes</h2>
            <div className="mt-5 grid gap-3">
              {comparison.riskChanges.length === 0 ? (
                <p className="rounded-[28px] bg-[#f7f9f4] p-4 text-sm leading-7 text-slate-600">
                  No Stage II risk rating changed.
                </p>
              ) : (
                comparison.riskChanges.map((change) => (
                  <div className="rounded-[28px] bg-[#f7f9f4] p-4" key={change.code}>
                    <p className="font-semibold text-slate-950">{change.title}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {change.leftLabel ?? 'n/a'} ({change.leftScore ?? 'n/a'}) → {change.rightLabel ?? 'n/a'} ({change.rightScore ?? 'n/a'})
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="border-surface-border">
            <h2 className="text-2xl font-black text-slate-950">Opportunity changes</h2>
            <div className="mt-5 grid gap-3">
              {comparison.opportunityChanges.length === 0 ? (
                <p className="rounded-[28px] bg-[#f7f9f4] p-4 text-sm leading-7 text-slate-600">
                  No Stage II opportunity rating changed.
                </p>
              ) : (
                comparison.opportunityChanges.map((change) => (
                  <div className="rounded-[28px] bg-[#f7f9f4] p-4" key={change.code}>
                    <p className="font-semibold text-slate-950">{change.title}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {change.leftLabel ?? 'n/a'} ({change.leftScore ?? 'n/a'}) → {change.rightLabel ?? 'n/a'} ({change.rightScore ?? 'n/a'})
                    </p>
                  </div>
                ))
              )}
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
