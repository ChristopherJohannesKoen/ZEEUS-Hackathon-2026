import Link from 'next/link';
import { forbidden, notFound } from 'next/navigation';
import { Card, buttonClassName } from '@packages/ui';
import { ScenarioLabClient } from '../../../../../components/scenario-lab-client';
import { ApiRequestError } from '../../../../../lib/api-error';
import { getEvaluation, getEvaluationScenarios } from '../../../../../lib/server-api';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export default async function ScenariosPage({ params }: { params: Params }) {
  const { id } = await params;

  try {
    const [evaluation, scenarios] = await Promise.all([
      getEvaluation(id),
      getEvaluationScenarios(id)
    ]);

    return (
      <div className="grid gap-6">
        <Card className="border-surface-border">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
            Scenario lab
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{evaluation.name}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Compare advisory cases for geography, dependency, or time horizon without overwriting
            the canonical saved revision.
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
              href={`/app/evaluate/${evaluation.id}/evidence`}
            >
              Open evidence vault
            </Link>
          </div>
        </Card>

        <ScenarioLabClient evaluationId={evaluation.id} items={scenarios.items} />
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
