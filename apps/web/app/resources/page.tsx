import Link from 'next/link';
import { getWorkbookGuidance } from '@packages/scoring';
import { Badge, Card, buttonClassName } from '@packages/ui';
import { MarketingShell } from '../../components/marketing-shell';
import { getOptionalCurrentUser, getPublicSiteContent } from '../../lib/server-api';
import { getSiteSettings } from '../../lib/site-content';

const resourceCategoryLabels = {
  manual: 'Manuals and onboarding',
  faq: 'FAQ source pack',
  methodology: 'Methodology and score interpretation',
  sample_report: 'Sample reports',
  workflow_asset: 'Workflow assets and brand support'
} as const;

function groupByCategory<T extends { category: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const nextGroup = groups[item.category] ?? [];
    nextGroup.push(item);
    groups[item.category] = nextGroup;
    return groups;
  }, {});
}

export default async function ResourcesPage() {
  const [currentUser, content] = await Promise.all([
    getOptionalCurrentUser(),
    getPublicSiteContent()
  ]);
  const workbookGuidance = getWorkbookGuidance();
  const resourcesByCategory = groupByCategory(content.resources);
  const articlesByCategory = groupByCategory(content.articles);
  const faqByCategory = groupByCategory(content.faqEntries);

  return (
    <MarketingShell
      currentUser={currentUser}
      settings={getSiteSettings(content)}
      eyebrow="Reference hub"
      title="Guides, manuals, score interpretation, and source-pack downloads"
      intro="This hub brings the official ZEEUS source pack together with the workbook-parity guidance used in the live application so founders, reviewers, and programme teams can read the same method in one place."
    >
      <div className="grid gap-6">
        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]" data-testid="resource-reference-metadata">
          <Card className="border-surface-border bg-[#fbfdf8]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
              Canonical source
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Active workbook and reference-pack metadata
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Public pages, the founder workflow, reviewer views, and reports all read from the
              same workbook-derived catalog version shown here.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-[24px] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Scoring version
                </p>
                <p className="mt-2 font-bold text-slate-950">
                  {content.referenceMetadata.scoringVersion}
                </p>
              </div>
              <div className="rounded-[24px] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Catalog version
                </p>
                <p className="mt-2 font-bold text-slate-950">
                  {content.referenceMetadata.catalogVersion}
                </p>
              </div>
              <div className="rounded-[24px] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Workbook digest
                </p>
                <p className="mt-2 break-all text-sm font-semibold text-slate-950">
                  {content.referenceMetadata.workbookSha256}
                </p>
              </div>
              <div className="rounded-[24px] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sheets parsed</p>
                <p className="mt-2 font-bold text-slate-950">
                  {content.referenceMetadata.sheetCount}
                </p>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  Extracted {new Date(content.referenceMetadata.extractedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-surface-border">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
              Traceability
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              How the site stays aligned with the source pack
            </h2>
            <div className="mt-4 grid gap-3 text-sm leading-7 text-slate-600">
              <p>Workbook-driven scoring logic remains deterministic across founder, reviewer, and report surfaces.</p>
              <p>Source-pack downloads below remain available as original assets for manual verification and institutional review.</p>
              <p>Editorial summaries can add context, but score bands, matrix legends, and workbook thresholds come from the scoring catalog rather than ad hoc page copy.</p>
            </div>
            <p className="mt-4 rounded-[24px] bg-[#f7f9f4] px-4 py-4 text-xs leading-6 text-slate-500">
              {content.referenceMetadata.workbookPath}
            </p>
          </Card>
        </section>

        <section className="grid gap-4" data-testid="resource-core-downloads">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
              Core downloads
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Official source-pack documents
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Download the user manual, FAQ pack, score interpretation sheet, tool-and-example
              archive, introduction material, and the brand-guidelines kit directly from the seeded
              reference library.
            </p>
          </div>

          {Object.entries(resourcesByCategory).map(([category, resources]) => (
            <div className="grid gap-4" key={category}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-950">
                  {resourceCategoryLabels[category as keyof typeof resourceCategoryLabels] ??
                    category}
                </h3>
                <Badge tone="slate">{resources.length} items</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {resources.map((resource) => (
                  <Card
                    className="border-surface-border"
                    data-testid={`resource-card-${resource.slug}`}
                    id={resource.id}
                    key={resource.id}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
                      {resource.category.replaceAll('_', ' ')}
                    </p>
                    <h4 className="mt-3 text-xl font-bold text-slate-950">{resource.title}</h4>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{resource.description}</p>
                    <div className="mt-4 grid gap-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {resource.fileName ? <p>File: {resource.fileName}</p> : null}
                      {resource.mimeType ? <p>Type: {resource.mimeType}</p> : null}
                      {resource.byteSize !== null ? (
                        <p>Size: {(resource.byteSize / 1024).toFixed(1)} KB</p>
                      ) : null}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        className={buttonClassName({
                          className: 'bg-brand hover:bg-brand-dark'
                        })}
                        href={resource.href}
                        target={resource.href.startsWith('http') ? '_blank' : undefined}
                        rel={resource.href.startsWith('http') ? 'noreferrer' : undefined}
                      >
                        Download {resource.fileLabel}
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section
          className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]"
          data-testid="resource-methodology-library"
        >
          <Card className="border-surface-border bg-[#fbfdf8]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
              Knowledge library
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Editorial guidance built on the same source pack
            </h2>
            <div className="mt-5 grid gap-4">
              {Object.entries(articlesByCategory).map(([category, articles]) => (
                <div className="rounded-[24px] bg-white p-5" key={category}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Badge tone="emerald">{category.replaceAll('_', ' ')}</Badge>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {articles.length} articles
                    </span>
                  </div>
                  <div className="mt-4 grid gap-4">
                    {articles.map((article) => (
                      <div key={article.id}>
                        <h3 className="text-lg font-bold text-slate-950">{article.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{article.summary}</p>
                        <p className="mt-3 text-sm leading-7 text-slate-700">{article.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-surface-border">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
              Workbook guidance
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Interpretation text used by the live workflow
            </h2>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[24px] bg-[#f7f9f4] p-4">
                <p className="text-sm font-bold text-slate-950">Initial summary</p>
                <div className="mt-3 grid gap-3">
                  {workbookGuidance.initialSummaryExplanationBlocks.map((block) => (
                    <div key={block.title}>
                      <p className="font-semibold text-slate-950">{block.title}</p>
                      <p className="mt-1 text-sm leading-7 text-slate-600">{block.body}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] bg-[#f7f9f4] p-4">
                <p className="text-sm font-bold text-slate-950">Score interpretation bands</p>
                <div className="mt-3 grid gap-3">
                  {workbookGuidance.scoreInterpretation.bands.map((band) => (
                    <div key={band.key}>
                      <p className="font-semibold text-slate-950">
                        {band.title} ({band.key})
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                        {band.scoreRangeLabel}
                      </p>
                      <p className="mt-1 text-sm leading-7 text-slate-600">{band.interpretation}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] bg-[#f7f9f4] p-4">
                <p className="text-sm font-bold text-slate-950">Stage II matrix legends</p>
                <div className="mt-3 grid gap-4">
                  {[
                    {
                      title: 'Risks',
                      entries: workbookGuidance.riskMatrixLegend.entries
                    },
                    {
                      title: 'Opportunities',
                      entries: workbookGuidance.opportunityMatrixLegend.entries
                    }
                  ].map((legend) => (
                    <div key={legend.title}>
                      <p className="font-semibold text-slate-950">{legend.title}</p>
                      <div className="mt-2 grid gap-2">
                        {legend.entries.map((entry) => (
                          <p
                            className="text-sm leading-7 text-slate-600"
                            key={`${legend.title}-${entry.label}`}
                          >
                            <span className="font-semibold text-slate-950">{entry.label}:</span>{' '}
                            {entry.whatItMeans}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="grid gap-4" data-testid="resource-faq-library">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
              FAQ by topic
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              The practical language that supports founders and reviewers
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(faqByCategory).map(([category, entries]) => (
              <Card className="border-surface-border" key={category}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
                  {category}
                </p>
                <div className="mt-4 grid gap-4">
                  {entries.map((entry) => (
                    <div key={entry.id}>
                      <h3 className="font-bold text-slate-950">{entry.question}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{entry.answer}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-4" data-testid="resource-related-pages">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
              Related public pages
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Institutional pages connected to the reference library
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {content.sitePages
              .filter((page) =>
                [
                  'methodology',
                  'how-it-works',
                  'partners',
                  'about-zeeus',
                  'seed-factories'
                ].includes(page.slug)
              )
              .map((page) => (
                <Card className="border-surface-border bg-[#f7fbf2]" key={page.id}>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
                    {page.pageType.replaceAll('_', ' ')}
                  </p>
                  <h3 className="mt-3 text-lg font-bold text-slate-950">{page.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{page.summary}</p>
                  <div className="mt-5">
                    <Link
                      className={buttonClassName({ variant: 'secondary' })}
                      href={`/${page.slug === 'home' ? '' : page.slug}`}
                    >
                      Open page
                    </Link>
                  </div>
                </Card>
              ))}
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
