import { Badge, Card } from '@packages/ui';
import type { ReportResponse } from '@packages/shared';
import { confidenceTone, formatDate, priorityTone } from '../lib/display';
import { PrintReportButton } from './print-report-button';
import { ZeeusLogo } from './zeeus-logo';

export function ReportDocument({
  report,
  showToolbar = false
}: {
  report: ReportResponse;
  showToolbar?: boolean;
}) {
  return (
    <div className="grid gap-6 print:gap-4">
      {showToolbar ? (
        <section className="no-print flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
              Full report
            </p>
            <h1 className="mt-2 text-4xl font-black text-slate-950">{report.evaluation.name}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Print-friendly report view for PDF export and submission review.
            </p>
          </div>
          <PrintReportButton evaluationId={report.evaluation.id} />
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[32px] border border-surface-border bg-gradient-to-br from-brand to-brand-dark p-0 text-white">
        <div className="pattern-circles p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <ZeeusLogo dark />
            <div className="space-y-2 text-right text-xs uppercase tracking-[0.2em] text-white/70">
              <p>Generated {formatDate(report.evaluation.updatedAt)}</p>
              <p>Evaluation ID {report.evaluation.id}</p>
              {report.programBranding?.partnerLabel ? (
                <p>Partner {report.programBranding.partnerLabel}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d9ef9b]">
                Sustainability assessment report
              </p>
              <h2 className="mt-2 text-3xl font-black">{report.evaluation.name}</h2>
              <p className="mt-3 text-sm text-white/80">
                {report.evaluation.country} / {report.evaluation.naceDivision}
              </p>
              {report.evaluation.businessCategoryMain ? (
                <p className="mt-2 text-sm text-white/80">
                  {report.evaluation.businessCategoryMain}
                  {report.evaluation.businessCategorySubcategory
                    ? ` / ${report.evaluation.businessCategorySubcategory}`
                    : ''}
                </p>
              ) : null}
              {report.programBranding ? (
                <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-white/70">
                  <span>{report.programBranding.primaryLabel}</span>
                  {report.programBranding.coBrandingLabel ? (
                    <span>/ {report.programBranding.coBrandingLabel}</span>
                  ) : null}
                  {report.programBranding.watermarkLabel ? (
                    <span>/ {report.programBranding.watermarkLabel}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
            <Badge
              className="border border-white/20 bg-white/10 text-white"
              tone={confidenceTone(report.dashboard.confidenceBand)}
            >
              {report.dashboard.confidenceBand} confidence
            </Badge>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[28px] bg-white/10 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#d9ef9b]">Financial total</p>
              <p className="mt-3 text-4xl font-black">{report.dashboard.financialTotal}/12</p>
            </div>
            <div className="rounded-[28px] bg-white/10 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#d9ef9b]">Risk overall</p>
              <p className="mt-3 text-4xl font-black">{report.dashboard.riskOverall.toFixed(1)}</p>
            </div>
            <div className="rounded-[28px] bg-white/10 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#d9ef9b]">
                Opportunity overall
              </p>
              <p className="mt-3 text-4xl font-black">
                {report.dashboard.opportunityOverall.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Card className="border-surface-border">
        <h2 className="text-xl font-bold text-slate-950">Startup context</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-[#f7f9f4] p-4">
            Stage: {report.evaluation.currentStage.replaceAll('_', ' ')}
          </div>
          <div className="rounded-2xl bg-[#f7f9f4] p-4">
            Business: {report.evaluation.businessCategoryMain ?? report.evaluation.naceDivision}
          </div>
          <div className="rounded-2xl bg-[#f7f9f4] p-4">
            Offering: {report.evaluation.offeringType}
          </div>
          <div className="rounded-2xl bg-[#f7f9f4] p-4">
            Launched: {report.evaluation.launched ? 'Yes' : 'No'}
          </div>
          <div className="rounded-2xl bg-[#f7f9f4] p-4">
            Innovation: {report.evaluation.innovationApproach}
          </div>
        </div>
        {report.evaluation.extendedNaceLabel ? (
          <div className="mt-4 rounded-2xl bg-[#f7f9f4] p-4 text-sm leading-7 text-slate-600">
            Extended NACE: {report.evaluation.extendedNaceCode} /{' '}
            {report.evaluation.extendedNaceLabel}
          </div>
        ) : null}
      </Card>

      <Card className="border-surface-border">
        <h2 className="text-xl font-bold text-slate-950">Stage I and materiality</h2>
        <div className="mt-5 grid gap-3">
          {report.evaluation.stage1Topics.map((topic) => (
            <div className="rounded-[28px] bg-[#f7f9f4] p-4" key={topic.topicCode}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold text-slate-950">{topic.title}</h3>
                <Badge tone={priorityTone(topic.priorityBand)}>
                  {topic.priorityBand.replaceAll('_', ' ')}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">Impact score: {topic.impactScore}</p>
              {topic.interpretation ? (
                <p className="mt-2 text-sm text-slate-600">{topic.interpretation}</p>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-surface-border">
        <h2 className="text-xl font-bold text-slate-950">Workbook interpretation guide</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {report.dashboard.scoreInterpretation.bands.map((band) => (
            <div className="rounded-[28px] bg-[#f7f9f4] p-4" key={band.key}>
              <p className="text-xs uppercase tracking-[0.2em] text-[#5d7355]">
                {band.scoreRangeLabel}
              </p>
              <p className="mt-2 font-bold text-slate-950">{band.title}</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">{band.interpretation}</p>
            </div>
          ))}
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-surface-border">
          <h2 className="text-xl font-bold text-slate-950">Stage II highlights</h2>
          <div className="mt-5 grid gap-3">
            {report.dashboard.topRisks.map((risk) => (
              <div className="rounded-[28px] bg-[#fff5f5] p-4" key={risk.code}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-slate-950">{risk.title}</p>
                  <Badge tone="rose">{risk.score}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">{risk.actionWindow}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-surface-border">
          <h2 className="text-xl font-bold text-slate-950">Opportunities</h2>
          <div className="mt-5 grid gap-3">
            {report.dashboard.topOpportunities.map((item) => (
              <div className="rounded-[28px] bg-[#f4f9ee] p-4" key={item.code}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-slate-950">{item.title}</p>
                  <Badge tone="emerald">{item.score}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.actionWindow}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card className="border-surface-border">
        <h2 className="text-xl font-bold text-slate-950">Recommendations and SDG alignment</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <div className="grid gap-3">
            {report.dashboard.recommendations.map((recommendation) => (
              <div className="rounded-[28px] bg-[#f7f9f4] p-4" key={recommendation.id}>
                <p className="text-xs uppercase tracking-[0.2em] text-[#5d7355]">
                  {recommendation.source} / {recommendation.severityBand}
                </p>
                <p className="mt-2 font-bold text-slate-950">{recommendation.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{recommendation.text}</p>
                {recommendation.rationale ? (
                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    {recommendation.rationale}
                  </p>
                ) : null}
                {recommendation.action ? (
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                    Action: {recommendation.action.status.replaceAll('_', ' ')}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          <div className="rounded-[28px] bg-[#f4f9ee] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">Relevant SDGs</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {report.sdgAlignment.items.map((sdg) => (
                <Badge key={`${sdg.number}-${sdg.sourceType}`} tone="emerald">
                  SDG {sdg.number}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {report.submissionReviewState ? (
        <Card className="border-surface-border">
          <h2 className="text-xl font-bold text-slate-950">Program review context</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] bg-[#f7f9f4] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">Program</p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {report.submissionReviewState.programName}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Submission state:{' '}
                {report.submissionReviewState.submissionStatus.replaceAll('_', ' ')}
              </p>
              {report.submissionReviewState.lastReviewedAt ? (
                <p className="mt-2 text-sm text-slate-600">
                  Last reviewed {formatDate(report.submissionReviewState.lastReviewedAt)}
                </p>
              ) : null}
            </div>
            <div className="rounded-[28px] bg-[#f4f9ee] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">Reviewer states</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {report.submissionReviewState.reviewerStatusSummary.map((item) => (
                  <Badge key={item.status} tone="slate">
                    {item.status.replaceAll('_', ' ')}: {item.count}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="border-surface-border">
        <h2 className="text-xl font-bold text-slate-950">Evidence appendix</h2>
        {report.evidenceSummary.items.length === 0 ? (
          <p className="mt-4 text-sm leading-7 text-slate-600">
            No revision-linked evidence has been attached yet.
          </p>
        ) : (
          <div className="mt-5 grid gap-3">
            {report.evidenceSummary.items.map((item) => (
              <div className="rounded-[28px] bg-[#f7f9f4] p-4" key={item.id}>
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#5d7355]">
                  <span>{item.kind}</span>
                  <span>/</span>
                  <span>{item.evidenceBasis}</span>
                  {item.linkedTopicCode ? (
                    <>
                      <span>/</span>
                      <span>{item.linkedTopicCode}</span>
                    </>
                  ) : null}
                </div>
                <p className="mt-2 font-bold text-slate-950">{item.title}</p>
                <div className="mt-2 grid gap-1 text-sm text-slate-600">
                  {item.ownerName ? <p>Owner: {item.ownerName}</p> : null}
                  {item.sourceDate ? <p>Source date: {item.sourceDate}</p> : null}
                  {item.fileName ? <p>File: {item.fileName}</p> : null}
                  {item.sourceUrl ? <p>Source: {item.sourceUrl}</p> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
