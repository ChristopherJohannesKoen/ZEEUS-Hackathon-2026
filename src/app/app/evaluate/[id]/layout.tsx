'use client';
import { use } from 'react';
import { notFound } from 'next/navigation';
import { useEvaluationStore } from '@/store/evaluationStore';
import { EvalNav } from '@/components/features/evaluation/EvalNav';
import { usePathname } from 'next/navigation';
import { EVAL_STEPS } from '@/components/features/evaluation/EvalNav';

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default function EvalLayout({ children, params }: Props) {
  const { id } = use(params);
  const { getEvaluation } = useEvaluationStore();
  const pathname = usePathname();
  const evaluation = getEvaluation(id);

  if (!evaluation) {
    notFound();
  }

  // Determine current step from pathname
  const currentStep = EVAL_STEPS.find((s) => pathname.includes(s.key))?.key ?? 'summary';

  return (
    <div className="flex flex-col min-h-full">
      <EvalNav evalId={id} currentStep={currentStep} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
