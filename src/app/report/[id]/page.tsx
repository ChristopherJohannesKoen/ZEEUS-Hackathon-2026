"use client";
import { use } from "react";
import Link from "next/link";
import { useEvaluationStore } from "@/store/evaluationStore";
import { computeDashboardSummary, calcImpactScore, generateCSV, downloadCSV, scoreToBand } from "@/lib/scoring";
import { ESG_TOPICS, FINANCIAL_KPIS } from "@/data/esg-topics";
import { RISK_DEFINITIONS, OPPORTUNITY_DEFINITIONS } from "@/data/risks-opportunities";
import { SDG_DEFINITIONS } from "@/data/sdgs";
import { ZeeusLogo } from "@/components/layout/ZeeusLogo";
import { PriorityChip, RiskChip, OpportunityChip, ConfidenceChip } from "@/components/ui/Badge";
import { ScoreBar, ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import {
  Printer, ArrowLeft, Download,
  DollarSign, Leaf, Users, Shield, TrendingUp, Globe2, Lightbulb, AlertTriangle
} from "lucide-react";

interface Props { params: Promise<{ id: string }> }

function ReportSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-8 print-break">
      <div className="flex items-center gap-2 mb-4 border-b-2 border-zeeus-green2 pb-2">
        <div className="text-brand">{icon}</div>
        <h2 className="text-lg font-black text-zeeus-dark">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function ReportPage({ params }: Props) {
  const { id } = use(params);
  const { getEvaluation } = useEvaluationStore();
  const evaluation = getEvaluation(id);

  if (!evaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Evaluation not found.</p>
          <Link href="/app/evaluations" className="text-brand font-semibold">← Back to evaluations</Link>
        </div>
      </div>
    );
  }

  const summary = evaluation?.stage1 && evaluation?.stage2
    ? computeDashboardSummary(evaluation as import('@/types/evaluation').Evaluation)
    : null;

  const ctx = evaluation.context;
  const envTopics = ESG_TOPICS.filter((t) => t.category === "E");
  const socTopics = ESG_TOPICS.filter((t) => t.category === "S" || t.category === "G");

  function getTopicScore(topicId: string, section: "environmental" | "social") {
    const a = evaluation!.stage1?.[section]?.[topicId];
    return a ? calcImpactScore(a) : 0;
  }

  function handleExportCSV() {
    const csv = generateCSV(evaluation as import('@/types/evaluation').Evaluation);
    downloadCSV(csv, `${ctx.name.replace(/\s+/g, "_")}_evaluation.csv`);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print toolbar */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-surface-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/app/evaluate/${id}/dashboard`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Download size={14} />} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Printer size={14} />}
            onClick={() => window.print()}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report content */}
      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Cover */}
        <div className="mb-10 pb-8 border-b-4 border-zeeus-green2">
          <div className="flex items-start justify-between mb-6">
            <ZeeusLogo />
            <div className="text-right text-xs text-gray-400">
              <p>Generated: {formatDate(evaluation.updatedAt)}</p>
              <p>Evaluation ID: {evaluation.id}</p>
            </div>
          </div>

          <h1 className="text-3xl font-black text-zeeus-dark mb-2">
            Sustainability Evaluation Report
          </h1>
          <h2 className="text-xl font-bold text-gray-700 mb-4">{ctx.name}</h2>

          <div className="grid grid-cols-3 gap-4 mt-6">
            {summary ? [
              { label: "Financial Score", value: `${summary.financialNormalized}%` },
              { label: "Overall Risk", value: summary.riskOverallLabel },
              { label: "Overall Opportunity", value: summary.opportunityOverallLabel },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-surface-border p-3 text-center">
                <div className="text-xl font-black text-brand-dark">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            )) : null}
          </div>

          <div className="mt-6 rounded-xl bg-brand/5 border border-brand/15 p-4 text-xs text-gray-600 leading-relaxed">
            <strong className="text-brand-dark">Guidance tool, not a judgment tool.</strong>{" "}
            This report is generated by the ZEEUS Sustainability by Design (SbyD) Tool.
            Scores reflect qualitative assessments based on founder inputs aligned with ESRS dual materiality principles
            and UN SDG relevance. They are intended to guide design decisions, not to replace formal ESG reporting or legal compliance.
          </div>
        </div>

        {/* 1. Startup Context */}
        <ReportSection title="1. Startup Context" icon={<Globe2 size={18} />}>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {[
              ["Startup Name", ctx.name],
              ["Country", ctx.country],
              ["NACE Division", `${ctx.naceCode} — ${ctx.naceLabel}`],
              ["Offering Type", ctx.offeringType],
              ["Launched", ctx.launched ? "Yes" : "Not yet"],
              ["Current Stage", ctx.stage],
              ["Innovation Approach", ctx.innovationApproach],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className="font-semibold text-gray-600 min-w-[140px]">{label}:</span>
                <span className="text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        </ReportSection>

        {/* 2. Stage I – Financial */}
        {evaluation.stage1 && (
          <ReportSection title="2. Stage I — Financial Indicators" icon={<DollarSign size={18} />}>
            <div className="mb-3 flex items-center gap-3">
              <span className="text-sm text-gray-600">Total Financial Score:</span>
              <span className="text-xl font-black text-brand-dark">{evaluation.stage1.financial.roiIrrNpv + evaluation.stage1.financial.sensitivityAnalysis + evaluation.stage1.financial.uspStrategicFit + evaluation.stage1.financial.marketGrowth} / 12</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left font-semibold text-gray-600 py-2 pr-4">KPI</th>
                  <th className="text-left font-semibold text-gray-600 py-2">Level (0–3)</th>
                  <th className="text-left font-semibold text-gray-600 py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {FINANCIAL_KPIS.map((kpi) => {
                  const level = evaluation.stage1!.financial[kpi.id as keyof typeof evaluation.stage1.financial];
                  return (
                    <tr key={kpi.id} className="border-b border-surface-border/50">
                      <td className="py-2 pr-4 font-medium text-gray-800">{kpi.title}</td>
                      <td className="py-2 pr-4">
                        <span className="font-bold text-brand-dark">{level}</span>
                      </td>
                      <td className="py-2 text-xs text-gray-500">{kpi.levels[level as 0|1|2|3]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ReportSection>
        )}

        {/* 3. Stage I – Environmental */}
        {evaluation.stage1 && (
          <ReportSection title="3. Stage I — Environmental Indicators (E1–E5)" icon={<Leaf size={18} />}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left font-semibold text-gray-600 py-2 pr-4">Topic</th>
                  <th className="text-left font-semibold text-gray-600 py-2">Score</th>
                  <th className="text-left font-semibold text-gray-600 py-2">Priority</th>
                  <th className="text-left font-semibold text-gray-600 py-2">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {envTopics.map((topic) => {
                  const score = getTopicScore(topic.id, "environmental");
                  const a = evaluation.stage1!.environmental[topic.id];
                  if (!a) return null;
                  const band = a.applicable ? scoreToBand(score, true) : "na" as const;
                  return (
                    <tr key={topic.id} className="border-b border-surface-border/50">
                      <td className="py-2 pr-4">
                        <span className="font-bold text-gray-700">{topic.code}</span>
                        <span className="text-gray-600 ml-2">{topic.title}</span>
                      </td>
                      <td className="py-2 pr-4 font-bold text-brand-dark">{a.applicable ? score.toFixed(2) : "N/A"}</td>
                      <td className="py-2 pr-4"><PriorityChip band={band} /></td>
                      <td className="py-2 text-xs text-gray-500 capitalize">{a.evidenceBasis}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ReportSection>
        )}

        {/* 4. Stage I – Social & Governance */}
        {evaluation.stage1 && (
          <ReportSection title="4. Stage I — Social & Governance (S1–S4, G1)" icon={<Users size={18} />}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left font-semibold text-gray-600 py-2 pr-4">Topic</th>
                  <th className="text-left font-semibold text-gray-600 py-2">Score</th>
                  <th className="text-left font-semibold text-gray-600 py-2">Priority</th>
                  <th className="text-left font-semibold text-gray-600 py-2">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {socTopics.map((topic) => {
                  const score = getTopicScore(topic.id, "social");
                  const a = evaluation.stage1!.social[topic.id];
                  if (!a) return null;
                  const band = a.applicable ? scoreToBand(score, true) : "na" as const;
                  return (
                    <tr key={topic.id} className="border-b border-surface-border/50">
                      <td className="py-2 pr-4">
                        <span className="font-bold text-gray-700">{topic.code}</span>
                        <span className="text-gray-600 ml-2">{topic.title}</span>
                      </td>
                      <td className="py-2 pr-4 font-bold text-brand-dark">{a.applicable ? score.toFixed(2) : "N/A"}</td>
                      <td className="py-2 pr-4"><PriorityChip band={band} /></td>
                      <td className="py-2 text-xs text-gray-500 capitalize">{a.evidenceBasis}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ReportSection>
        )}

        {/* 5. Stage II – Risks */}
        {evaluation.stage2 && (
          <ReportSection title="5. Stage II — Risks" icon={<Shield size={18} />}>
            {summary && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-gray-600">Overall Risk:</span>
                <span className="text-lg font-black text-gray-900">{summary.riskOverallScore.toFixed(1)}/4</span>
                <RiskChip label={summary.riskOverallLabel} />
              </div>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left font-semibold text-gray-600 py-2 pr-4">Risk</th>
                  <th className="text-left font-semibold text-gray-600 py-2">Prob.</th>
                  <th className="text-left font-semibold text-gray-600 py-2">Impact</th>
                  <th className="text-left font-semibold text-gray-600 py-2">Rating</th>
                </tr>
              </thead>
              <tbody>
                {RISK_DEFINITIONS.map((def) => {
                  const r = evaluation.stage2!.risks[def.id];
                  if (!r || !r.applicable) return null;
                  return (
                    <tr key={def.id} className="border-b border-surface-border/50">
                      <td className="py-2 pr-4">
                        <span className="font-bold text-gray-500">{def.id}</span>
                        <span className="text-gray-700 ml-2">{def.title}</span>
                      </td>
                      <td className="py-2 pr-4 text-xs text-gray-600">{["N/A","Rare","Could occur","Likely","Very likely"][r.probability]}</td>
                      <td className="py-2 pr-4 text-xs text-gray-600">{["N/A","Low","Moderate","Significant","High"][r.impact]}</td>
                      <td className="py-2"><RiskChip label={r.ratingLabel} score={r.ratingScore} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ReportSection>
        )}

        {/* 6. Stage II – Opportunities */}
        {evaluation.stage2 && (
          <ReportSection title="6. Stage II — Opportunities" icon={<TrendingUp size={18} />}>
            {summary && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-gray-600">Overall Opportunity:</span>
                <span className="text-lg font-black text-gray-900">{summary.opportunityOverallScore.toFixed(1)}/4</span>
                <OpportunityChip label={summary.opportunityOverallLabel} />
              </div>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left font-semibold text-gray-600 py-2 pr-4">Opportunity</th>
                  <th className="text-left font-semibold text-gray-600 py-2">Likelihood</th>
                  <th className="text-left font-semibold text-gray-600 py-2">Impact</th>
                  <th className="text-left font-semibold text-gray-600 py-2">Rating</th>
                </tr>
              </thead>
              <tbody>
                {OPPORTUNITY_DEFINITIONS.map((def) => {
                  const o = evaluation.stage2!.opportunities[def.id];
                  if (!o || !o.applicable) return null;
                  return (
                    <tr key={def.id} className="border-b border-surface-border/50">
                      <td className="py-2 pr-4">
                        <span className="font-bold text-gray-500">{def.id}</span>
                        <span className="text-gray-700 ml-2">{def.title}</span>
                      </td>
                      <td className="py-2 pr-4 text-xs text-gray-600">{["N/A","Rare","Could occur","Likely","Very likely"][o.likelihood]}</td>
                      <td className="py-2 pr-4 text-xs text-gray-600">{["N/A","Low","Moderate","Significant","High"][o.impact]}</td>
                      <td className="py-2"><OpportunityChip label={o.ratingLabel} score={o.ratingScore} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ReportSection>
        )}

        {/* 7. SDG Alignment */}
        {evaluation.sdgAlignment && evaluation.sdgAlignment.length > 0 && (
          <ReportSection title="7. SDG Alignment" icon={<Globe2 size={18} />}>
            <div className="flex flex-wrap gap-2">
              {evaluation.sdgAlignment.map(({ sdgNumber, source }) => {
                const def = SDG_DEFINITIONS.find((s) => s.number === sdgNumber);
                return (
                  <div
                    key={sdgNumber}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: def?.color ?? "#39B54A" }}
                  >
                    SDG {sdgNumber}
                    <span className="opacity-70">({source})</span>
                  </div>
                );
              })}
            </div>
          </ReportSection>
        )}

        {/* 8. Recommendations & Sensitivity */}
        {summary && (
          <ReportSection title="8. Recommendations & Confidence" icon={<Lightbulb size={18} />}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-gray-600">Assessment Confidence:</span>
              <ConfidenceChip level={summary.confidenceBand} />
            </div>
            <h3 className="font-bold text-gray-700 mb-2 text-sm">Recommendations:</h3>
            <ul className="space-y-2 mb-4">
              {summary.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-brand mt-0.5">•</span>
                  {rec}
                </li>
              ))}
            </ul>

            {summary.sensitivityHints.length > 0 && (
              <>
                <h3 className="font-bold text-gray-700 mb-2 text-sm">Sensitivity Notes:</h3>
                <ul className="space-y-1.5">
                  {summary.sensitivityHints.map((hint, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
                      <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
                      {hint}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </ReportSection>
        )}

        {/* Footer */}
        <div className="border-t border-surface-border pt-6 text-center text-xs text-gray-400">
          <ZeeusLogo className="justify-center mb-2" />
          <p>ZEEUS — Zero Emissions Entrepreneurship for Universal Sustainability</p>
          <p>Developed by TUAS – Trier University of Applied Sciences, IfaS. Funded by the European Union (EIT).</p>
          <p className="mt-2">
            This is a guidance tool. Scores are based on self-reported inputs and do not constitute formal ESG disclosure.
          </p>
        </div>
      </div>
    </div>
  );
}
