'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Check, ChevronRight } from 'lucide-react';

export const EVAL_STEPS = [
  { key: 'summary', label: 'Summary', shortLabel: 'Summary' },
  { key: 'stage-1', label: 'Stage I — Assessment', shortLabel: 'Stage I' },
  { key: 'stage-2', label: 'Stage II — Risks & Opportunities', shortLabel: 'Stage II' },
  { key: 'impact-summary', label: 'Impact Summary', shortLabel: 'Impact' },
  { key: 'sdg-alignment', label: 'SDG Alignment', shortLabel: 'SDGs' },
  { key: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard' }
];

interface EvalNavProps {
  evalId: string;
  currentStep: string;
  completedSteps?: string[];
}

export function EvalNav({ evalId, currentStep, completedSteps = [] }: EvalNavProps) {
  const currentIndex = EVAL_STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="w-full bg-white border-b border-surface-border px-4 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Desktop stepper */}
        <nav className="hidden md:flex items-center h-14 gap-0" aria-label="Evaluation flow">
          {EVAL_STEPS.map((step, index) => {
            const isDone = completedSteps.includes(step.key) || index < currentIndex;
            const isActive = step.key === currentStep;
            const isPending = !isDone && !isActive;
            return (
              <div key={step.key} className="flex items-center">
                <Link
                  href={`/app/evaluate/${evalId}/${step.key}`}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                    isActive && 'text-brand-dark bg-brand/10',
                    isDone && 'text-brand hover:bg-brand/5',
                    isPending && 'text-gray-400 hover:text-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                      isActive && 'bg-brand-dark text-white',
                      isDone && 'bg-brand text-white',
                      isPending && 'bg-surface-border text-gray-400'
                    )}
                  >
                    {isDone ? <Check size={10} strokeWidth={3} /> : index + 1}
                  </span>
                  {step.shortLabel}
                </Link>
                {index < EVAL_STEPS.length - 1 && (
                  <ChevronRight size={12} className="text-gray-300 mx-1" />
                )}
              </div>
            );
          })}
        </nav>

        {/* Mobile mini stepper */}
        <div className="flex md:hidden items-center justify-between h-12">
          <span className="text-sm font-semibold text-brand-dark">
            {currentIndex + 1}/{EVAL_STEPS.length} — {EVAL_STEPS[currentIndex]?.label}
          </span>
          <div className="flex gap-1">
            {EVAL_STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i < currentIndex && 'bg-brand w-3',
                  i === currentIndex && 'bg-brand-dark w-5',
                  i > currentIndex && 'bg-surface-border w-3'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
