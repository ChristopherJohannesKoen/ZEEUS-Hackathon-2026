import { forbidden, notFound } from 'next/navigation';
import { ApiRequestError } from '../../../../../lib/api-error';
import { getEvaluation } from '../../../../../lib/server-api';
import { EvaluationProgress } from '../../../../../components/evaluation-progress';
import { StageOneForm } from '../../../../../components/stage-one-form';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export default async function StageOnePage({ params }: { params: Params }) {
  const { id } = await params;

  try {
    const evaluation = await getEvaluation(id);

    return (
      <div className="grid gap-6">
        <EvaluationProgress currentStep="stage_1" evaluationId={evaluation.id} />
        <StageOneForm evaluation={evaluation} />
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
