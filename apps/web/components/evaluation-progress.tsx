import Link from 'next/link';
import { cn } from '@packages/ui';

const stepDefinitions = [
  { key: 'summary', label: 'Summary', shortLabel: 'Summary' },
  { key: 'stage_1', label: 'Stage I assessment', shortLabel: 'Stage I' },
  { key: 'stage_2', label: 'Stage II risks and opportunities', shortLabel: 'Stage II' },
  { key: 'impact_summary', label: 'Impact Summary', shortLabel: 'Impact' },
  { key: 'sdg_alignment', label: 'SDG Alignment', shortLabel: 'SDGs' },
  { key: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard' },
  { key: 'report', label: 'Report', shortLabel: 'Report' }
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
    <div className="grid gap-3 rounded-[28px] border border-surface-border bg-[#f7fbf3] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#3b6a2b]">
        Assessment Flow
      </p>
      <div className="hidden items-center gap-1 overflow-x-auto md:flex">
        {stepDefinitions.map((step, index) => {
          const currentIndex = stepDefinitions.findIndex((entry) => entry.key === currentStep);
          const isActive = step.key === currentStep;
          const isComplete = currentIndex > index;

          return (
            <div className="flex items-center gap-1" key={step.key}>
              <Link
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition',
                  isActive && 'bg-brand/10 text-brand-dark',
                  isComplete && 'text-brand-dark hover:bg-brand/5',
                  !isActive && !isComplete && 'text-slate-400 hover:text-slate-600'
                )}
                href={routeMap[step.key]}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                    isActive && 'bg-brand-dark text-white',
                    isComplete && 'bg-brand text-white',
                    !isActive && !isComplete && 'bg-surface-border text-slate-500'
                  )}
                >
                  {isComplete ? '✓' : index + 1}
                </span>
                {step.shortLabel}
              </Link>
              {index < stepDefinitions.length - 1 ? (
                <span className="px-1 text-slate-300">›</span>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between md:hidden">
        <span className="text-sm font-semibold text-brand-dark">
          {stepDefinitions.findIndex((entry) => entry.key === currentStep) + 1}/{stepDefinitions.length}
          {' · '}
          {stepDefinitions.find((entry) => entry.key === currentStep)?.label}
        </span>
        <div className="flex gap-1">
          {stepDefinitions.map((step, index) => {
            const currentIndex = stepDefinitions.findIndex((entry) => entry.key === currentStep);
            return (
              <span
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  index < currentIndex && 'w-3 bg-brand',
                  index === currentIndex && 'w-5 bg-brand-dark',
                  index > currentIndex && 'w-3 bg-surface-border'
                )}
                key={step.key}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
