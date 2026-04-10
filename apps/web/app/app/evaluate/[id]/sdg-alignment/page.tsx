import Link from 'next/link';
import { forbidden, notFound } from 'next/navigation';
import { Badge, Card, buttonClassName } from '@packages/ui';
import { ApiRequestError } from '../../../../../lib/api-error';
import { getEvaluation, getSdgAlignment } from '../../../../../lib/server-api';
import { EvaluationProgress } from '../../../../../components/evaluation-progress';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export default async function SdgAlignmentPage({ params }: { params: Params }) {
  const { id } = await params;

  try {
    const [evaluation, alignment] = await Promise.all([getEvaluation(id), getSdgAlignment(id)]);

    return (
      <div className="grid gap-6">
        <EvaluationProgress currentStep="sdg_alignment" evaluationId={evaluation.id} />

        <Card className="border-[#d7e8c8]">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
            SDG alignment
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Merged stage and business SDGs
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Stage and NACE suggestions are de-duplicated, tagged, and linked to both the official UN
            goal pages and the in-app SDG target explorer.
          </p>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {alignment.items.map((sdg) => (
            <Card className="border-[#d7e8c8]" key={`${sdg.number}-${sdg.sourceType}`}>
              <div className="flex items-center justify-between gap-3">
                <Badge
                  tone={
                    sdg.sourceType === 'both'
                      ? 'emerald'
                      : sdg.sourceType === 'stage'
                        ? 'amber'
                        : 'slate'
                  }
                >
                  {sdg.sourceType}
                </Badge>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  SDG {sdg.number}
                </span>
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-950">{sdg.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {sdg.sourceType === 'both'
                  ? 'Suggested by both startup stage and business category.'
                  : sdg.sourceType === 'stage'
                    ? 'Suggested from the startup stage and current maturity profile.'
                    : 'Suggested from the NACE business category and sector footprint.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  className={buttonClassName({ variant: 'secondary' })}
                  href={`/sdg/${sdg.number}`}
                >
                  Explore targets
                </Link>
                <a
                  className="inline-flex text-sm font-semibold text-[#00654A] hover:text-[#0b7a59]"
                  href={sdg.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open official goal page
                </a>
              </div>
            </Card>
          ))}
        </div>

        <div>
          <Link
            className={buttonClassName({ className: 'bg-[#00654A] hover:bg-[#0b7a59]' })}
            href={`/app/evaluate/${evaluation.id}/dashboard`}
          >
            Continue to dashboard
          </Link>
        </div>
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
