import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@packages/ui';
import { MarketingFooter } from '../components/marketing-footer';
import { SiteHeader } from '../components/site-header';
import { ZeeusLogo } from '../components/zeeus-logo';
import {
  landingAudience,
  landingExploreItems,
  landingFaqs,
  landingOutputs,
  landingReassuranceItems,
  landingWhyMatters,
  landingWorkflowSteps
} from '../lib/landing-page-content';
import { isPublicSpaceMode } from '../lib/runtime-mode';
import { getCurrentUser } from '../lib/server-api';

export default async function Page() {
  const currentUser = await getCurrentUser();
  const publicPreviewMode = isPublicSpaceMode;
  const primaryHref = publicPreviewMode
    ? '/how-it-works'
    : currentUser
      ? '/app/evaluate/start'
      : '/signup';
  const primaryLabel = publicPreviewMode ? 'Explore the workflow' : 'Start evaluation';
  const workspaceHref = publicPreviewMode
    ? '/resources'
    : currentUser
      ? '/app/evaluations'
      : '/login';
  const workspaceLabel = publicPreviewMode
    ? 'Open resources'
    : currentUser
      ? 'Open workspace'
      : 'Sign in';

  return (
    <div className="min-h-screen bg-[#fcfef9]">
      <SiteHeader currentUser={currentUser} />

      <main>
        <section className="relative overflow-hidden border-b border-surface-border bg-[linear-gradient(135deg,#ffffff_0%,#f8fcf0_45%,#edf7e6_100%)]">
          <div className="absolute inset-y-0 right-0 hidden w-[38%] bg-[radial-gradient(circle_at_top,rgba(57,181,74,0.18),transparent_70%)] lg:block" />
          <div className="pattern-brand-outline absolute -left-16 top-20 hidden h-80 w-80 opacity-20 lg:block" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:items-center lg:py-20">
            <div className="space-y-7">
              <ZeeusLogo className="rounded-[28px] bg-white/90 px-4 py-4 shadow-card" priority />

              <div className="space-y-4">
                <Badge className="border border-[#d8e7c5] bg-white text-[#00654a]" tone="slate">
                  Startup Sustainability Evaluation Tool
                </Badge>
                <h1 className="max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-6xl">
                  Build your startup with sustainability in mind from day one
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-slate-700">
                  The Sustainability by Design tool helps founders explore how their idea connects
                  to sustainability, strategy, and long-term business resilience. It translates the
                  UN Sustainable Development Goals and ESRS double materiality into a practical,
                  startup-friendly workflow so you can identify what matters early, avoid costly
                  blind spots, and grow with greater confidence.
                </p>
              </div>

              <div className="max-w-3xl rounded-[30px] border border-[#dfead2] bg-white/78 p-6 shadow-card">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#00654a]">
                  A guidance tool, not a judgment tool.
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  This tool is designed to help you reflect, prioritise, and make better-informed
                  decisions, not to pass or fail your venture.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link className="btn-primary bg-brand-dark hover:bg-brand" href={primaryHref}>
                  {primaryLabel}
                </Link>
                <Link className="btn-secondary" href="#how-it-works">
                  See how it works
                </Link>
                <Link
                  className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white"
                  href={workspaceHref}
                >
                  {workspaceLabel}
                </Link>
              </div>

              <div className="max-w-3xl space-y-3 text-sm leading-7 text-slate-600">
                <p className="font-semibold text-[#00654a]">
                  Developed by IfaS at Trier University of Applied Sciences as part of the ZEEUS
                  project.
                </p>
                <p>
                  No advanced sustainability background required. Start with your startup context,
                  complete the assessment in stages, and review your dashboard, material topics, SDG
                  alignment, and recommendations.
                </p>
                {publicPreviewMode ? (
                  <p className="text-[#58724d]">
                    This public preview focuses on the public guidance experience. Authenticated
                    founder and programme workflows remain available in the full stack deployment.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-8 top-12 hidden h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(185,224,33,0.28),transparent_70%)] lg:block" />
              <div className="relative overflow-hidden rounded-[38px] border border-white/60 bg-white shadow-[0_28px_90px_-48px_rgba(0,101,74,0.35)]">
                <div className="relative aspect-[1.05/1] overflow-hidden">
                  <Image
                    alt="Sustainability and innovation materials on a desk"
                    className="object-cover object-center"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    src="/brand/zeeus/imagery/hero-application.png"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#052a1f]/85 via-[#0e4b39]/20 to-white/5" />
                  <div className="absolute bottom-6 left-6 right-6 rounded-[28px] border border-white/12 bg-[#07382b]/78 p-6 text-white backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b9e021]">
                      What you can explore
                    </p>
                    <ul className="mt-4 grid gap-3 text-sm leading-6 text-white/82">
                      {landingExploreItems.map((item) => (
                        <li className="flex items-start gap-3" key={item}>
                          <span className="mt-2 h-2 w-2 rounded-full bg-[#b9e021]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-surface-border bg-white">
          <div className="mx-auto grid max-w-7xl gap-4 px-6 py-8 md:grid-cols-2 xl:grid-cols-4">
            {landingReassuranceItems.map((item) => (
              <div
                className="rounded-[28px] border border-surface-border bg-[#f7fbf2] p-5 shadow-card"
                key={item.title}
              >
                <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#fcfef9] py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#58724d]">
                Why this matters
              </p>
              <h2 className="text-4xl font-black text-slate-950">
                Sustainability matters early because startup decisions harden fast
              </h2>
              <p className="text-sm leading-8 text-slate-600">
                Startups make decisions early that shape products, operations, suppliers, market
                positioning, and long-term resilience. Many sustainability-related issues are
                easiest to address at the design stage, before processes harden, costs rise, and
                trade-offs become more expensive.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {landingWhyMatters.map((item) => (
                <article
                  className="rounded-[30px] border border-surface-border bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
                  key={item.title}
                >
                  <h3 className="text-xl font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-surface-border bg-white py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-2">
            <div className="rounded-[34px] border border-[#d9e8ca] bg-[#f4faee] p-8 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00654a]">
                What it is
              </p>
              <h2 className="mt-4 text-3xl font-black text-slate-950">
                A structured founder workflow grounded in SDGs and ESRS double materiality
              </h2>
              <p className="mt-4 text-sm leading-8 text-slate-600">
                The tool helps you understand which sustainability topics may be relevant for your
                business model, explore your venture through impact and business-risk lenses,
                identify material topics and aligned SDGs, and build awareness without forcing full
                reporting-level complexity onto an early-stage team.
              </p>
            </div>
            <div className="rounded-[34px] border border-surface-border bg-[#fffdfa] p-8 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00654a]">
                What it is not
              </p>
              <h2 className="mt-4 text-3xl font-black text-slate-950">
                Not a pass-fail test, not a compliance verdict
              </h2>
              <div className="mt-5 grid gap-3 text-sm leading-7 text-slate-600">
                <p>
                  It is not a replacement for detailed technical studies or a full life-cycle
                  assessment.
                </p>
                <p>
                  It is not a final compliance declaration or a judgment on whether your startup
                  idea is good or bad.
                </p>
                <p>
                  It is a guidance tool designed to help you see the road ahead more clearly and
                  make better-informed decisions.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f9fcf5] py-20" id="how-it-works">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#58724d]">
                How it works
              </p>
              <h2 className="text-4xl font-black text-slate-950">
                Move from startup context to dashboard insights in five clear steps
              </h2>
              <p className="text-sm leading-8 text-slate-600">
                Enter your startup context, review relevant SDGs, complete Stage I and Stage II,
                then use the resulting dashboard, material topics, recommendations, and export-ready
                outputs to guide next decisions.
              </p>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-5">
              {landingWorkflowSteps.map((step) => (
                <article
                  className="rounded-[30px] border border-surface-border bg-white p-6 shadow-card"
                  key={step.step}
                >
                  <p className="text-4xl font-black text-[#d6e5c7]">{step.step}</p>
                  <h3 className="mt-4 text-lg font-bold text-slate-950">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#58724d]">
                    {step.microcopy}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-10">
              <Link className="btn-primary bg-brand-dark hover:bg-brand" href={primaryHref}>
                {primaryLabel}
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-surface-border bg-white py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#58724d]">
                Frameworks
              </p>
              <h2 className="text-4xl font-black text-slate-950">
                Built on globally recognised sustainability frameworks
              </h2>
              <p className="text-sm leading-8 text-slate-600">
                The tool combines the UN Sustainable Development Goals and ESRS double materiality
                in a startup-friendly format. Rather than forcing founders through full reporting
                complexity, it uses those frameworks to support smarter early-stage decisions.
              </p>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              <article className="rounded-[32px] border border-surface-border bg-[#f6fbf1] p-8 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00654a]">
                  UN Sustainable Development Goals
                </p>
                <h3 className="mt-4 text-2xl font-black text-slate-950">SDGs as a strategic map</h3>
                <p className="mt-4 text-sm leading-8 text-slate-600">
                  SDGs help frame the broader sustainability areas your startup may touch, from
                  energy and water to waste, labour, trust, and innovation. The tool uses your
                  startup context to surface SDGs that may be relevant now and helpful for your
                  growth narrative later.
                </p>
              </article>
              <article className="rounded-[32px] border border-surface-border bg-[#fbfdf8] p-8 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00654a]">
                  ESRS double materiality
                </p>
                <h3 className="mt-4 text-2xl font-black text-slate-950">
                  Inside-out impacts and outside-in exposure
                </h3>
                <p className="mt-4 text-sm leading-8 text-slate-600">
                  Double materiality looks at sustainability from two directions at once: how your
                  startup may affect people and the environment, and how environmental, social,
                  governance, and economic developments may affect your startup.
                </p>
              </article>
            </div>

            <p className="mt-8 max-w-4xl text-sm leading-8 text-slate-600">
              The workflow structures those topics across environmental, social, governance, and
              economic dimensions so founders can focus on material issues, practical actions, and
              future resilience rather than framework jargon.
            </p>
          </div>
        </section>

        <section className="bg-[#fcfef9] py-20" id="what-you-get">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#58724d]">
                What you get
              </p>
              <h2 className="text-4xl font-black text-slate-950">
                Practical outputs you can use immediately
              </h2>
              <p className="text-sm leading-8 text-slate-600">
                The tool does more than collect inputs. It turns your responses into outputs that
                help you focus your attention, shape next steps, and communicate sustainability
                relevance more clearly.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              {landingOutputs.map((item) => (
                <article
                  className="rounded-[30px] border border-surface-border bg-white p-6 shadow-card"
                  key={item.title}
                >
                  <h3 className="text-xl font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-surface-border bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[34px] border border-[#d7e7c7] bg-[#f6fbf1] p-8 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00654a]">
                  Designed for honest reflection
                </p>
                <h2 className="mt-4 text-3xl font-black text-slate-950">
                  Better awareness early leads to stronger choices later
                </h2>
                <p className="mt-4 text-sm leading-8 text-slate-600">
                  This tool works best when used openly and realistically. It is intended to support
                  awareness, not inflated claims. Genuine inputs produce outputs that can guide
                  smarter design, clearer positioning, and more resilient growth.
                </p>
              </div>
              <div className="rounded-[34px] border border-surface-border bg-[#063e30] p-8 text-white shadow-card">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b9e021]">
                  Built for founders, researchers, and entrepreneurship ecosystems
                </p>
                <div className="mt-5 grid gap-3">
                  {landingAudience.map((item) => (
                    <div
                      className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/82"
                      key={item}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#fcfef9] py-20" id="about-zeeus">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#58724d]">
                About ZEEUS
              </p>
              <h2 className="text-4xl font-black text-slate-950">
                A wider mission around innovation, sustainability, and Seed Factories
              </h2>
              <p className="text-sm leading-8 text-slate-600">
                ZEEUS, Zero Emissions Entrepreneurship for Universal Sustainability, is an
                international initiative focused on strengthening innovation and entrepreneurship
                capacity within higher education institutions by supporting sustainable,
                impact-driven venture creation.
              </p>
              <p className="text-sm leading-8 text-slate-600">
                The project supports sustainable entrepreneurship through training, mentoring,
                digital tools, and cross-border collaboration between Europe and Africa. It
                contributes to more resilient, scalable innovation ecosystems and encourages earlier
                sustainability awareness in venture creation.
              </p>
              <p className="text-sm leading-8 text-slate-600">
                A central element of that mission is the development of Seed Factories as one-stop
                support environments for students, researchers, staff, and entrepreneurs, helping
                promising ideas move toward practical impact.
              </p>
            </div>

            <div className="space-y-5">
              <div className="rounded-[34px] border border-surface-border bg-white p-8 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00654a]">
                  Developed within the ZEEUS project
                </p>
                <h3 className="mt-4 text-2xl font-black text-slate-950">
                  IfaS at Trier University of Applied Sciences
                </h3>
                <p className="mt-4 text-sm leading-8 text-slate-600">
                  The Sustainability by Design tool was developed by the Institute for Applied
                  Material Flow Management, drawing on sustainability assessment expertise and the
                  broader aims of the ZEEUS project.
                </p>
              </div>

              <div className="rounded-[34px] border border-surface-border bg-white p-6 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00654a]">
                  Supported by a wider innovation ecosystem
                </p>
                <div className="mt-5 overflow-hidden rounded-[28px] border border-surface-border bg-white p-4">
                  <Image
                    alt="ZEEUS support strip showing Climate-KIC, European Union, and EIT Higher Education Initiative support"
                    className="h-auto w-full object-contain"
                    height={921}
                    sizes="(max-width: 1024px) 100vw, 38vw"
                    src="/brand/zeeus/support/logo-combo-version-2.png"
                    width={1311}
                  />
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Part of a broader effort to support sustainable entrepreneurship, innovation
                  capacity, and practical tools for emerging ventures.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-surface-border bg-white py-20" id="faq">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#58724d]">
                FAQ
              </p>
              <h2 className="text-4xl font-black text-slate-950">
                Straight answers for founders starting early
              </h2>
              <p className="text-sm leading-8 text-slate-600">
                The tool is meant to guide, not overwhelm. These answers capture the core questions
                founders tend to have before beginning the workflow.
              </p>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              {landingFaqs.map((item) => (
                <article
                  className="rounded-[30px] border border-surface-border bg-[#f8fcf3] p-6 shadow-card"
                  key={item.question}
                >
                  <h3 className="text-xl font-bold text-slate-950">{item.question}</h3>
                  <p className="mt-4 text-sm leading-8 text-slate-600">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-brand-dark py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b9e021]">
              Final step
            </p>
            <h2 className="mt-4 text-4xl font-black text-white">
              Start exploring what matters for your startup
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-white/75">
              Use the Sustainability by Design tool to identify relevant sustainability topics,
              reflect on risks and opportunities, and build a clearer picture of how your venture
              can grow with resilience and purpose.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                className="btn-primary bg-brand-lime text-brand-dark hover:bg-white"
                href={primaryHref}
              >
                {primaryLabel}
              </Link>
              <Link
                className="btn-secondary border-white/25 bg-white/8 text-white hover:bg-white/14 hover:text-white"
                href="#how-it-works"
              >
                Learn how it works
              </Link>
            </div>
            <p className="mt-5 text-sm text-white/65">
              Built to support reflection, clarity, and better decision-making, step by step.
            </p>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
