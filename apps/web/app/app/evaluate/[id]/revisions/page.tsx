import Link from 'next/link';
import { forbidden, notFound } from 'next/navigation';
import { Badge, Card, buttonClassName } from '@packages/ui';
import type { EvaluationArtifactSummary, EvaluationRevisionSummary } from '@packages/shared';
import { ArtifactActions } from '../../../../../components/artifact-actions';
import { ApiRequestError } from '../../../../../lib/api-error';
import {
  confidenceTone,
  evaluationStatusTone,
  formatDate,
  formatEnumLabel
} from '../../../../../lib/display';
import { getEvaluation, getEvaluationRevisions } from '../../../../../lib/server-api';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export default async function EvaluationRevisionsPage({ params }: { params: Params }) {
  const { id } = await params;

  try {
    const [evaluation, revisions] = await Promise.all([
      getEvaluation(id),
      getEvaluationRevisions(id)
    ]);

    return (
      <div className="grid gap-6">
        <section className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
              Revision history
            </p>
            <h1 className="mt-2 text-4xl font-black text-slate-950">{evaluation.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Completed states are preserved as immutable report snapshots. Reopening the evaluation
              creates a fresh draft revision instead of changing the old one.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className={buttonClassName({ variant: 'secondary' })}
              href={`/app/evaluate/${evaluation.id}/dashboard`}
            >
              Back to dashboard
            </Link>
          </div>
        </section>

        <Card className="border-surface-border bg-[#f4f9ee]">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={evaluationStatusTone(evaluation.status)}>{evaluation.status}</Badge>
            <Badge tone={confidenceTone(evaluation.confidenceBand)}>
              {evaluation.confidenceBand} confidence
            </Badge>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Current revision {evaluation.currentRevisionNumber}
            </span>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Scoring version {evaluation.scoringVersionInfo.scoringVersion} / catalog version{' '}
            {evaluation.scoringVersionInfo.catalogVersion}
          </p>
          <div className="mt-5">
            <ArtifactActions evaluationId={evaluation.id} />
          </div>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-surface-border">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-slate-950">Saved revisions</h2>
              {revisions.items.length >= 2 ? (
                <Link
                  className={buttonClassName({ variant: 'secondary' })}
                  href={`/app/evaluate/${evaluation.id}/revisions/compare?left=${revisions.items[1]?.revisionNumber}&right=${revisions.items[0]?.revisionNumber}`}
                >
                  Compare latest two
                </Link>
              ) : null}
            </div>
            <div className="mt-6 grid gap-4">
              {revisions.items.map((revision: EvaluationRevisionSummary) => (
                <div className="rounded-[28px] bg-[#f7f9f4] p-5" key={revision.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={evaluationStatusTone(revision.status)}>
                          {revision.status}
                        </Badge>
                        <Badge tone="slate">Revision {revision.revisionNumber}</Badge>
                      </div>
                      <h3 className="mt-3 text-xl font-bold text-slate-950">
                        Snapshot {revision.revisionNumber}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        Step {formatEnumLabel(revision.currentStep)} / saved{' '}
                        {formatDate(revision.createdAt)}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                        {revision.scoringVersionInfo.scoringVersion} /{' '}
                        {revision.scoringVersionInfo.catalogVersion}
                      </p>
                    </div>
                    <Link
                      className={buttonClassName({ variant: 'secondary' })}
                      href={`/app/evaluate/${evaluation.id}/revisions/${revision.revisionNumber}`}
                    >
                      View snapshot
                    </Link>
                    {revision.revisionNumber !== revisions.items[0]?.revisionNumber ? (
                      <Link
                        className={buttonClassName({ variant: 'ghost' })}
                        href={`/app/evaluate/${evaluation.id}/revisions/compare?left=${revision.revisionNumber}&right=${revisions.items[0]?.revisionNumber}`}
                      >
                        Compare to latest
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-surface-border">
            <h2 className="text-2xl font-black text-slate-950">Generated artifacts</h2>
            <div className="mt-6 grid gap-4">
              {evaluation.artifacts.length === 0 ? (
                <div className="rounded-[28px] bg-[#f7f9f4] p-5 text-sm leading-7 text-slate-600">
                  No report artifacts have been generated yet.
                </div>
              ) : (
                evaluation.artifacts.map((artifact: EvaluationArtifactSummary) => (
                  <div className="rounded-[28px] bg-[#f7f9f4] p-5" key={artifact.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="slate">{artifact.kind}</Badge>
                      <Badge tone={artifact.status === 'ready' ? 'emerald' : 'amber'}>
                        {artifact.status}
                      </Badge>
                    </div>
                    <p className="mt-3 font-semibold text-slate-950">{artifact.filename}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {artifact.mimeType} / {artifact.byteSize} bytes
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                      {formatDate(artifact.createdAt)}
                    </p>
                    {artifact.status === 'ready' ? (
                      <div className="mt-4">
                        <a
                          className={buttonClassName({ variant: 'secondary' })}
                          href={`/api/evaluations/${evaluation.id}/artifacts/${artifact.id}/download`}
                        >
                          Download
                        </a>
                      </div>
                    ) : null}
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
