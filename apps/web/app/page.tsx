import Link from 'next/link';
import { Badge } from '@packages/ui';
import { SiteHeader } from '../components/site-header';
import { ZeeusLogo } from '../components/zeeus-logo';
import { isPublicSpaceMode } from '../lib/runtime-mode';
import { getCurrentUser, getPublicSiteContent } from '../lib/server-api';

const workflowSteps = [
  {
    id: '01',
    title: 'Enter startup context',
    description:
      'Capture country, NACE division, offering type, startup stage, and innovation approach.'
  },
  {
    id: '02',
    title: 'Run Stage I assessment',
    description:
      'Score the financial indicators and the inside-out environmental, social, and governance topics.'
  },
  {
    id: '03',
    title: 'Run Stage II assessment',
    description:
      'Rate the external risks and opportunities with the deterministic matrix logic from the workbook.'
  },
  {
    id: '04',
    title: 'Review dashboard and exports',
    description:
      'Inspect material topics, SDG alignment, recommendations, confidence hints, and the print-ready report.'
  }
];

const principles = [
  {
    title: 'Guidance tool, not a judgment tool',
    description:
      'The platform helps founders spot sustainability hot spots early without turning the process into compliance theatre.'
  },
  {
    title: 'SDGs are a map, not a checklist',
    description:
      'Stage and business-category suggestions act as an early compass reading before the full materiality view is generated.'
  },
  {
    title: 'Deterministic scoring first',
    description:
      'The core outputs stay fixed for the same inputs. AI is intentionally kept out of canonical scores and materiality.'
  }
];

export default async function Page() {
  const [currentUser, content] = await Promise.all([getCurrentUser(), getPublicSiteContent()]);
  const publicPreviewMode = isPublicSpaceMode;
  const primaryHref = publicPreviewMode
    ? '/methodology'
    : currentUser
      ? '/app/evaluate/start'
      : '/signup';
  const primaryLabel = publicPreviewMode
    ? 'Explore methodology'
    : currentUser
      ? 'Start evaluation'
      : 'Create account';
  const secondaryHref = publicPreviewMode
    ? '/partners'
    : currentUser
      ? '/app/evaluations'
      : '/login';
  const secondaryLabel = publicPreviewMode
    ? 'View partner programs'
    : currentUser
      ? 'Open workspace'
      : 'Sign in';

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader currentUser={currentUser} />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand to-brand-dark" />
          <div className="pattern-circles absolute inset-0 opacity-40" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-24">
            <div className="space-y-8">
              <Badge className="border border-white/25 bg-white/10 text-white" tone="slate">
                Sustainability by Design
              </Badge>
              <div className="space-y-5">
                <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white md:text-6xl">
                  Build a startup that works for people, planet, and long-term growth.
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-white/85">
                  ZEEUS turns the Excel-based SbyD workflow into a reproducible web platform with
                  saved evaluations, deterministic scoring, SDG alignment, dashboard outputs, and
                  exportable reports.
                </p>
                <p className="max-w-3xl text-sm font-medium uppercase tracking-[0.24em] text-[#d9ef9b]">
                  The SDGs are a map, not a checklist.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  className="btn-primary bg-white text-brand-dark hover:bg-brand-lime hover:text-brand-dark"
                  href={primaryHref}
                >
                  {primaryLabel}
                </Link>
                <Link
                  className="btn-secondary border-white/30 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                  href={secondaryHref}
                >
                  {secondaryLabel}
                </Link>
              </div>
              {publicPreviewMode ? (
                <p className="max-w-3xl text-sm leading-7 text-white/75">
                  This Space hosts the public website preview. Authenticated founder and reviewer
                  workflows stay on the full stack deployment.
                </p>
              ) : null}
            </div>

            <div className="card-surface relative overflow-hidden border-white/15 bg-white/10 p-8 text-white shadow-[0_24px_80px_-48px_rgba(0,0,0,0.45)]">
              <div className="pattern-dots absolute inset-0 opacity-20" />
              <div className="relative space-y-6">
                <ZeeusLogo dark />
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d9ef9b]">
                    Core submission fit
                  </p>
                  <ul className="grid gap-3 text-sm text-white/85">
                    <li>Deterministic Excel-parity scoring</li>
                    <li>Saved evaluations in PostgreSQL</li>
                    <li>Dashboard, CSV export, and print-to-PDF report</li>
                    <li>Docker-first full-stack setup for reproducible judging</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
                Workflow
              </p>
              <h2 className="mt-3 text-4xl font-black text-slate-950">
                A cleaner version of the workbook flow
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                The wizard keeps the original assessment logic intact, then makes the outputs faster
                to review, save, and explain.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {workflowSteps.map((step) => (
                <div
                  className="card-surface group p-6 transition hover:-translate-y-1 hover:shadow-card-hover"
                  key={step.id}
                >
                  <div className="text-5xl font-black text-[#e0e9d5] transition group-hover:text-brand/20">
                    {step.id}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-950">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-surface-border bg-white py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-3">
            {principles.map((principle) => (
              <div className="space-y-3" key={principle.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-dark">
                  Principle
                </p>
                <h3 className="text-xl font-bold text-slate-950">{principle.title}</h3>
                <p className="text-sm leading-7 text-slate-600">{principle.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-surface-border bg-surface py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
                  Learn the method
                </p>
                <h2 className="mt-3 text-4xl font-black text-slate-950">
                  Public guidance, not hidden implementation notes
                </h2>
              </div>
              <Link className="btn-secondary" href="/methodology">
                Open methodology
              </Link>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {content.articles.slice(0, 3).map((article) => (
                <Link
                  className="card-surface p-6 transition hover:-translate-y-1 hover:shadow-card-hover"
                  href={
                    article.slug === 'how-it-works'
                      ? '/how-it-works'
                      : article.slug === 'methodology'
                        ? '/methodology'
                        : article.slug === 'sdg-esrs-explainer'
                          ? '/sdg-esrs'
                          : '/partners'
                  }
                  key={article.id}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
                    {article.category.replaceAll('_', ' ')}
                  </p>
                  <h3 className="mt-4 text-xl font-bold text-slate-950">{article.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{article.summary}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-surface-border bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
                  Example journeys
                </p>
                <h2 className="mt-3 text-4xl font-black text-slate-950">
                  Founder workflows backed by evidence and scenarios
                </h2>
              </div>
              <Link className="btn-secondary" href="/case-studies">
                View case studies
              </Link>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {content.caseStudies.map((study) => (
                <div className="card-surface p-6" key={study.id}>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
                    {study.startupName}
                  </p>
                  <h3 className="mt-4 text-2xl font-black text-slate-950">{study.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{study.summary}</p>
                  <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-500">
                    {study.stage} / {study.naceDivision}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-surface-border bg-surface py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
                  Dual audience
                </p>
                <h2 className="mt-3 text-4xl font-black text-slate-950">
                  Founder workspace plus partner review console
                </h2>
              </div>
              <Link className="btn-secondary" href="/partners">
                Explore partner programs
              </Link>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {content.partnerPrograms.map((program) => (
                <div className="card-surface p-6" key={program.id}>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
                    {program.cohortLabel}
                  </p>
                  <h3 className="mt-4 text-2xl font-black text-slate-950">{program.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{program.summary}</p>
                  <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-500">
                    {program.submissionCount} submissions / {program.reviewerCount} reviewers
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-brand-dark py-16">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-3xl font-black text-white">
              Sustainability is not extra work. It is better design earlier.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/75">
              Start with the core assessment, preserve the scoring logic, and use the web workflow
              to move faster than the spreadsheet without losing rigor.
            </p>
            <div className="mt-8">
              <Link
                className="btn-primary bg-brand-lime text-brand-dark hover:bg-white"
                href={primaryHref}
              >
                {publicPreviewMode
                  ? 'Review the public method'
                  : currentUser
                    ? 'Create a new evaluation'
                    : 'Start with an account'}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
