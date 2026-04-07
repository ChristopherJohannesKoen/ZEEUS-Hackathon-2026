import Link from 'next/link';
import { Badge, Card, buttonClassName } from '@packages/ui';
import { SiteHeader } from '../components/site-header';
import { getCurrentUser } from '../lib/server-api';

const featureCards = [
  {
    title: 'Excel-parity scoring',
    description:
      'The deterministic core mirrors the workbook logic for Stage I, Stage II, SDG alignment, and dashboard outputs.'
  },
  {
    title: 'Saved evaluations',
    description:
      'Create, resume, score, export, and print startup sustainability assessments in one flow.'
  },
  {
    title: 'Docker-first submission',
    description:
      'Next.js, NestJS, and PostgreSQL stay reproducible with one local Compose-based setup.'
  }
];

export default async function Page() {
  const currentUser = await getCurrentUser();

  return (
    <div className="min-h-screen">
      <SiteHeader currentUser={currentUser} />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <div className="space-y-8">
            <Badge className="bg-[#e8f6c8] text-[#45672e]" tone="emerald">
              Guidance tool, not judgement tool
            </Badge>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
                Sustainability assessment made faster than Excel.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-700">
                ZEEUS helps early-stage ventures understand sustainability impacts, risks,
                opportunities, and SDG relevance without turning the process into compliance theater.
                The SDGs are a map, not a checklist.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className={buttonClassName({ className: 'bg-[#00654A] hover:bg-[#0b7a59]' })}
                href={currentUser ? '/app/evaluate/start' : '/signup'}
              >
                {currentUser ? 'Start evaluation' : 'Create account'}
              </Link>
              <Link className={buttonClassName({ variant: 'secondary' })} href={currentUser ? '/app/evaluations' : '/login'}>
                {currentUser ? 'Open saved evaluations' : 'Login'}
              </Link>
            </div>
          </div>
          <Card className="bg-[#0f2a21] text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-[#b8d88d]">Core flow</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-200">
              <div>Initial inputs and SDG pre-screen</div>
              <div>Stage I inside-out assessment</div>
              <div>Stage II risks and opportunities</div>
              <div>Impact summary, dashboard, and export</div>
            </div>
          </Card>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          {featureCards.map((feature) => (
            <Card className="border-[#d8e8c8]" key={feature.title}>
              <h2 className="text-xl font-bold text-slate-950">{feature.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
