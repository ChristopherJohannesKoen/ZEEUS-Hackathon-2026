import Link from 'next/link';
import { Badge, Card, buttonClassName } from '@packages/ui';
import { getOrganization, getOrganizations } from '../../../lib/server-api';

export const dynamic = 'force-dynamic';

export default async function OrganizationPage() {
  const organizations = await getOrganizations();
  const primaryOrganization = organizations.items[0];
  const organization = primaryOrganization ? await getOrganization(primaryOrganization.id) : null;

  return (
    <div className="grid gap-6">
      <Card className="border-surface-border">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
          Organization workspace
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">
          {organization?.name ?? 'No organization configured'}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          ZEEUS now supports an organization layer for founder collaboration, evidence ownership,
          partner program submissions, and co-branded reporting.
        </p>
      </Card>

      {!organization ? (
        <Card className="border-dashed border-surface-border bg-[#fbfdf8]">
          <p className="text-sm leading-7 text-slate-600">
            No organization membership is available for this user yet.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-surface-border">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="emerald">{organization.role}</Badge>
              <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                {organization.memberCount} members / {organization.programCount} programs
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{organization.description}</p>
            {organization.websiteUrl ? (
              <a
                className="mt-4 inline-flex text-sm font-semibold text-brand-dark"
                href={organization.websiteUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open organization website
              </a>
            ) : null}
          </Card>

          <div className="grid gap-4">
            <Card className="border-surface-border">
              <h2 className="text-xl font-black text-slate-950">Members</h2>
              <div className="mt-4 grid gap-3">
                {organization.members.map((member) => (
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
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-slate-950">Programs</h2>
                <Link className={buttonClassName({ variant: 'secondary' })} href="/app/programs">
                  Open program console
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                {organization.programs.map((program) => (
                  <div className="rounded-[24px] bg-[#fbfdf8] px-4 py-4" key={program.id}>
                    <p className="font-semibold text-slate-950">{program.name}</p>
                    <p className="mt-2 text-sm text-slate-600">{program.summary}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
