import { EvaluationContextForm } from '../../../../components/evaluation-context-form';

export const dynamic = 'force-dynamic';

export default function StartEvaluationPage() {
  return (
    <div className="grid gap-6">
      <section className="max-w-4xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
          New evaluation
        </p>
        <h1 className="text-4xl font-black tracking-tight text-slate-950">Start with the startup context</h1>
        <p className="text-sm leading-7 text-slate-600">
          Capture the essentials first. The next screen turns these inputs into an early SDG
          pre-screen before the full Stage I and Stage II workflow begins.
        </p>
      </section>
      <EvaluationContextForm mode="create" />
    </div>
  );
}
