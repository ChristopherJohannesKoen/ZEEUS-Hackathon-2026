import { forbidden, notFound } from 'next/navigation';
import { Badge, Card } from '@packages/ui';
import { ProgramWorkflowClient } from '../../../../components/program-workflow-client';
import { ApiRequestError } from '../../../../lib/api-error';
import { getProgram } from '../../../../lib/server-api';

export const dynamic = 'force-dynamic';

type Params = Promise<{ programId: string }>;

export default async function ProgramDetailPage({ params }: { params: Params }) {
  const { programId } = await params;

  try {
    const program = await getProgram(programId);

    return (
      <div className="grid gap-6">
        <Card className="border-surface-border">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="emerald">{program.status}</Badge>
            {program.role ? <Badge tone="slate">{program.role}</Badge> : null}
          </div>
          <h1 className="mt-3 text-3xl font-black text-slate-950">{program.name}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{program.description}</p>
          <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-500">
            {program.cohortLabel}
          </p>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-surface-border">
            <h2 className="text-xl font-black text-slate-950">Members</h2>
            <div className="mt-4 grid gap-3">
              {program.members.map((member) => (
                <div className="rounded-[24px] bg-[#f4f9ee] px-4 py-4" key={member.userId}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{member.name}</p>
                      <p className="text-sm text-slate-600">{member.email}</p>
                    </div>
                    <Badge tone="slate">{member.role}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-surface-border">
            <h2 className="text-xl font-black text-slate-950">Submissions</h2>
            <div className="mt-4 grid gap-3">
              {program.submissions.map((submission) => (
                <div className="rounded-[24px] bg-[#fbfdf8] px-4 py-4" key={submission.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="emerald">{submission.submissionStatus}</Badge>
                    <Badge tone="slate">{submission.evaluationStatus}</Badge>
                  </div>
                  <p className="mt-3 font-semibold text-slate-950">{submission.startupName}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Revision {submission.revisionNumber} / Submitted{' '}
                    {submission.submittedAt ?? 'not yet'}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <ProgramWorkflowClient program={program} />
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
