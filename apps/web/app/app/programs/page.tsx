import Link from 'next/link';
import { Badge, Card, buttonClassName } from '@packages/ui';
import { getPrograms } from '../../../lib/server-api';

export const dynamic = 'force-dynamic';

export default async function ProgramsPage() {
  const programs = await getPrograms();

  return (
    <div className="grid gap-6">
      <Card className="border-surface-border">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
          Partner console
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Programs and cohort workflows</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Programs separate review state from evaluation state so reviewers can request changes or
          approve submissions without mutating canonical scoring outputs.
        </p>
      </Card>

      <div className="grid gap-4">
        {programs.items.map((program) => (
          <Card className="border-surface-border" key={program.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="emerald">{program.status}</Badge>
                  {program.role ? <Badge tone="slate">{program.role}</Badge> : null}
                </div>
                <h2 className="mt-3 text-2xl font-black text-slate-950">{program.name}</h2>
                <p className="mt-2 text-sm text-slate-500">{program.cohortLabel}</p>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{program.summary}</p>
              </div>
              <Link
                className={buttonClassName({ className: 'bg-brand hover:bg-brand-dark' })}
                href={`/app/programs/${program.id}`}
              >
                Open program
              </Link>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-[24px] bg-[#f4f9ee] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Submissions</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{program.submissionCount}</p>
              </div>
              <div className="rounded-[24px] bg-[#f4f9ee] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Reviewers</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{program.reviewerCount}</p>
              </div>
              <div className="rounded-[24px] bg-[#f4f9ee] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Branding</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {program.branding?.partnerLabel ?? program.branding?.primaryLabel ?? 'ZEEUS'}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
