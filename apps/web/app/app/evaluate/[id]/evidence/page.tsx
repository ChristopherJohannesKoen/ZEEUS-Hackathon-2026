import Link from 'next/link';
import { forbidden, notFound } from 'next/navigation';
import { Card, buttonClassName } from '@packages/ui';
import { EvidenceVaultClient } from '../../../../../components/evidence-vault-client';
import { ApiRequestError } from '../../../../../lib/api-error';
import { getEvaluation, getEvaluationEvidence } from '../../../../../lib/server-api';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export default async function EvidencePage({ params }: { params: Params }) {
  const { id } = await params;

  try {
    const [evaluation, evidence] = await Promise.all([getEvaluation(id), getEvaluationEvidence(id)]);

    return (
      <div className="grid gap-6">
        <Card className="border-surface-border">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
            Evidence vault
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{evaluation.name}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Collect supporting notes, links, and source references so the confidence layer and
            partner review workflows have concrete material to work with.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              className={buttonClassName({ variant: 'secondary' })}
              href={`/app/evaluate/${evaluation.id}/dashboard`}
            >
              Back to dashboard
            </Link>
            <Link
              className={buttonClassName({ variant: 'secondary' })}
              href={`/app/evaluate/${evaluation.id}/scenarios`}
            >
              Open scenario lab
            </Link>
          </div>
        </Card>

        <EvidenceVaultClient evaluationId={evaluation.id} items={evidence.items} />
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
