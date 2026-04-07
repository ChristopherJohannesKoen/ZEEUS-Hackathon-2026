import Link from 'next/link';
import { cn } from '@packages/ui';

const stepDefinitions = [
  { key: 'summary', label: 'Summary' },
  { key: 'stage_1', label: 'Stage I' },
  { key: 'stage_2', label: 'Stage II' },
  { key: 'impact_summary', label: 'Impact Summary' },
  { key: 'sdg_alignment', label: 'SDG Alignment' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'report', label: 'Report' }
] as const;

export function EvaluationProgress({
  currentStep,
  evaluationId
}: {
  currentStep:
    | 'summary'
    | 'stage_1'
    | 'stage_2'
    | 'impact_summary'
    | 'sdg_alignment'
    | 'dashboard'
    | 'report';
  evaluationId: string;
}) {
  const routeMap: Record<(typeof stepDefinitions)[number]['key'], string> = {
    summary: `/app/evaluate/${evaluationId}/summary`,
    stage_1: `/app/evaluate/${evaluationId}/stage-1`,
    stage_2: `/app/evaluate/${evaluationId}/stage-2`,
    impact_summary: `/app/evaluate/${evaluationId}/impact-summary`,
    sdg_alignment: `/app/evaluate/${evaluationId}/sdg-alignment`,
    dashboard: `/app/evaluate/${evaluationId}/dashboard`,
    report: `/app/report/${evaluationId}`
  };

  return (
    <div className="grid gap-3 rounded-[28px] border border-[#cfe5b4] bg-[#f6fbef] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#3b6a2b]">
        Assessment Flow
      </p>
      <div className="grid gap-2 md:grid-cols-7">
        {stepDefinitions.map((step, index) => {
          const isActive = step.key === currentStep;
          const isComplete = stepDefinitions.findIndex((entry) => entry.key === currentStep) > index;

          return (
            <Link
              className={cn(
                'rounded-2xl border px-3 py-3 text-sm font-semibold transition',
                isActive && 'border-[#3FA535] bg-[#3FA535] text-white',
                isComplete && 'border-[#8CC63F] bg-[#eaf5d4] text-[#295022]',
                !isActive && !isComplete && 'border-[#d9e8c8] bg-white text-[#57754d]'
              )}
              href={routeMap[step.key]}
              key={step.key}
            >
              {step.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
