import Link from 'next/link';
import { forbidden, notFound } from 'next/navigation';
import { Badge, Card, buttonClassName } from '@packages/ui';
import { EvaluationProgress } from '../../../../../components/evaluation-progress';
import { ApiRequestError } from '../../../../../lib/api-error';
import { priorityTone } from '../../../../../lib/display';
import {
  getEvaluation,
  getEvaluationBenchmarks,
  getEvaluationRevisions
} from '../../../../../lib/server-api';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ revisionNumber?: string }>;

export default async function EvaluationBenchmarksPage({
  params,
  searchParams
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const query = await searchParams;

  try {
    const evaluation = await getEvaluation(id);
    const revisionNumber = query.revisionNumber
      ? Number(query.revisionNumber)
      : evaluation.currentRevisionNumber;

    const [benchmarks, revisions] = await Promise.all([
      getEvaluationBenchmarks(id, revisionNumber),
      getEvaluationRevisions(id)
    ]);

    return (
      <div className="grid gap-6">
        <EvaluationProgress currentStep="dashboard" evaluationId={evaluation.id} />

        <section className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
              Benchmark workspace
            </p>
            <h1 className="mt-2 text-4xl font-black text-slate-950">{evaluation.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Compare the selected revision against earlier saved revisions and a seeded reference
              profile for the same workbook stage and business context.
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
            <Badge tone="emerald">Revision {benchmarks.revisionNumber}</Badge>
            <Badge tone="slate">{benchmarks.referenceProfile.label}</Badge>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {benchmarks.referenceProfile.stageLabel} /{' '}
            {benchmarks.referenceProfile.businessCategoryMain ??
              benchmarks.referenceProfile.naceDivision}
            {benchmarks.referenceProfile.extendedNaceCode
              ? ` / ${benchmarks.referenceProfile.extendedNaceCode}`
              : ''}
          </p>
          {benchmarks.referenceProfile.businessCategorySubcategory ||
          benchmarks.referenceProfile.extendedNaceLabel ? (
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
              {benchmarks.referenceProfile.businessCategorySubcategory ??
                benchmarks.referenceProfile.extendedNaceLabel}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            {revisions.items.map((revision) => (
              <Link
                className={buttonClassName({
                  variant:
                    revision.revisionNumber === benchmarks.revisionNumber ? 'secondary' : 'ghost'
                })}
                href={`/app/evaluate/${evaluation.id}/benchmarks?revisionNumber=${revision.revisionNumber}`}
                key={revision.id}
              >
                Revision {revision.revisionNumber}
              </Link>
            ))}
          </div>
        </Card>

        <Card className="border-surface-border bg-[#fbfdf8]">
          <p className="text-xs uppercase tracking-[0.25em] text-[#58724d]">
            How to read the benchmark
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Compare movement through score interpretation bands
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            The benchmark workspace keeps the same workbook score language as the founder-facing
            report. Use it to see where the current revision moved relative to prior saved work and
            the seeded reference profile for a similar startup context.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {benchmarks.scoreInterpretation.bands.map((band) => (
              <div className="rounded-[24px] border border-[#dce7d3] bg-white p-4" key={band.key}>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{band.key}</p>
                <p className="mt-2 font-bold text-slate-950">{band.title}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                  {band.scoreRangeLabel}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{band.interpretation}</p>
              </div>
            ))}
          </div>
        </Card>

        <section className="grid gap-6 lg:grid-cols-3">
          {benchmarks.metrics.map((metric) => (
            <Card className="border-surface-border" key={metric.label}>
              <p className="text-xs uppercase tracking-[0.22em] text-[#58724d]">{metric.label}</p>
              <p className="mt-3 text-4xl font-black text-slate-950">{metric.current}</p>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Previous: {metric.previous ?? 'n/a'}</p>
                <p>Best: {metric.best ?? 'n/a'}</p>
                <p>Reference: {metric.reference ?? 'n/a'}</p>
                <p>Delta vs previous: {metric.deltaFromPrevious ?? 'n/a'}</p>
                <p>Delta vs reference: {metric.deltaFromReference ?? 'n/a'}</p>
              </div>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-surface-border">
            <h2 className="text-2xl font-black text-slate-950">Topic shifts</h2>
            <div className="mt-5 grid gap-3">
              {benchmarks.topicShifts.map((shift) => (
                <div className="rounded-[28px] bg-[#f7f9f4] p-4" key={shift.topicCode}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-950">{shift.title}</p>
                    <Badge tone={priorityTone(shift.currentBand)}>{shift.currentBand}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    Previous: {shift.previousBand ?? 'n/a'} / Reference:{' '}
                    {shift.referenceBand ?? 'n/a'}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-surface-border">
            <h2 className="text-2xl font-black text-slate-950">Benchmark takeaways</h2>
            <div className="mt-5 grid gap-3">
              {benchmarks.takeaways.map((takeaway) => (
                <div
                  className="rounded-[28px] bg-[#f4f9ee] px-5 py-4 text-sm leading-7 text-slate-700"
                  key={takeaway}
                >
                  {takeaway}
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
