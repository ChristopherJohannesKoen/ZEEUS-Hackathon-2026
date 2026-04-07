import { forbidden, notFound } from 'next/navigation';
import { Badge, Card } from '@packages/ui';
import { ApiRequestError } from '../../../../lib/api-error';
import { priorityTone } from '../../../../lib/display';
import { getEvaluationReport } from '../../../../lib/server-api';
import { PrintReportButton } from '../../../../components/print-report-button';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export default async function ReportPage({ params }: { params: Params }) {
  const { id } = await params;

  try {
    const report = await getEvaluationReport(id);

    return (
      <div className="grid gap-6 print:gap-4">
        <section className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
              Full report
            </p>
            <h1 className="mt-2 text-4xl font-black text-slate-950">{report.evaluation.name}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {report.evaluation.country} · {report.evaluation.naceDivision}
            </p>
          </div>
          <div className="print:hidden">
            <PrintReportButton />
          </div>
        </section>

        <Card className="border-[#d7e8c8]">
          <h2 className="text-xl font-bold text-slate-950">Startup context</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-[#f7f9f4] p-4">Stage: {report.evaluation.currentStage.replace('_', ' ')}</div>
            <div className="rounded-2xl bg-[#f7f9f4] p-4">Offering: {report.evaluation.offeringType}</div>
            <div className="rounded-2xl bg-[#f7f9f4] p-4">Launched: {report.evaluation.launched ? 'Yes' : 'No'}</div>
            <div className="rounded-2xl bg-[#f7f9f4] p-4">Innovation: {report.evaluation.innovationApproach}</div>
          </div>
        </Card>

        <Card className="border-[#d7e8c8]">
          <h2 className="text-xl font-bold text-slate-950">Stage I and materiality</h2>
          <div className="mt-5 grid gap-3">
            {report.evaluation.stage1Topics.map((topic) => (
              <div className="rounded-2xl bg-[#f7f9f4] p-4" key={topic.topicCode}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-slate-950">{topic.title}</h3>
                  <Badge tone={priorityTone(topic.priorityBand)}>{topic.priorityBand.replace('_', ' ')}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">Impact score: {topic.impactScore}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-[#d7e8c8]">
          <h2 className="text-xl font-bold text-slate-950">Stage II highlights</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">Top risks</p>
              <div className="mt-3 grid gap-3">
                {report.dashboard.topRisks.map((risk) => (
                  <div className="rounded-2xl bg-[#f7f9f4] p-4" key={risk.code}>
                    <p className="font-bold text-slate-950">{risk.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{risk.actionWindow}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">Top opportunities</p>
              <div className="mt-3 grid gap-3">
                {report.dashboard.topOpportunities.map((item) => (
                  <div className="rounded-2xl bg-[#f7f9f4] p-4" key={item.code}>
                    <p className="font-bold text-slate-950">{item.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.actionWindow}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-[#d7e8c8]">
          <h2 className="text-xl font-bold text-slate-950">Recommendations and SDGs</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <div className="grid gap-3">
              {report.dashboard.recommendations.map((recommendation) => (
                <div className="rounded-2xl bg-[#f7f9f4] p-4" key={recommendation.id}>
                  <p className="font-bold text-slate-950">{recommendation.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{recommendation.text}</p>
                </div>
              ))}
            </div>
            <div className="rounded-3xl bg-[#f7f9f4] p-5">
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
