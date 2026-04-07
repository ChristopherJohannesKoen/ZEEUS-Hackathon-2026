import Link from 'next/link';
import { buttonClassName } from '@packages/ui';
import { EvaluationsListClient } from '../../../components/evaluations-list-client';
import { getEvaluations } from '../../../lib/server-api';

export const dynamic = 'force-dynamic';

export default async function EvaluationsPage() {
  const evaluations = await getEvaluations();

  return (
    <div className="grid gap-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
            Workspace
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Saved evaluations</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Resume drafts, inspect completed dashboards, and keep the startup assessment flow in a
            single persistent workspace instead of a spreadsheet folder.
          </p>
        </div>
        <Link
          className={buttonClassName({ className: 'bg-brand hover:bg-brand-dark' })}
          href="/app/evaluate/start"
        >
          Start evaluation
        </Link>
      </section>

      <EvaluationsListClient evaluations={evaluations.items} />
    </div>
  );
}
