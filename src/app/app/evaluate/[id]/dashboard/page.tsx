"use client";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEvaluationStore } from "@/store/evaluationStore";
import { computeDashboardSummary, generateCSV, downloadCSV } from "@/lib/scoring";
import { ESG_TOPICS } from "@/data/esg-topics";
import { RISK_DEFINITIONS, OPPORTUNITY_DEFINITIONS } from "@/data/risks-opportunities";
import { Card, ScoreCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PriorityChip, RiskChip, OpportunityChip, ConfidenceChip } from "@/components/ui/Badge";
import { ScoreBar, ProgressBar } from "@/components/ui/ProgressBar";
import {
  DollarSign, Leaf, Users, Shield, TrendingUp,
  FileText, Download, Lightbulb, AlertTriangle,
  Info, Eye, BarChart3, CheckCircle,
} from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

interface Props { params: Promise<{ id: string }> }

export default function DashboardPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { getEvaluation } = useEvaluationStore();
  const evaluation = getEvaluation(id);

  if (!evaluation?.stage1 || !evaluation?.stage2) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <BarChart3 size={40} className="text-gray-200 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-700 mb-2">Complete your evaluation first</h2>
        <p className="text-gray-500 mb-6">Finish Stage I and Stage II to unlock your full dashboard.</p>
        <Link href={`/app/evaluate/${id}/stage-1`}>
          <Button variant="primary">Go to Stage I</Button>
        </Link>
      </div>
    );
  }

  const summary = computeDashboardSummary(evaluation!);
  if (!summary) return null;

  const { financialNormalized, environmentalScores, socialScores,
    materialTopics, highPriorityTopics, riskOverallScore, riskOverallLabel,
    opportunityOverallScore, opportunityOverallLabel, topRisks, topOpportunities,
    confidenceBand, sensitivityHints, recommendations } = summary;

  // Radar chart data
  const radarData = [
    ...environmentalScores.map((t) => {
      const def = ESG_TOPICS.find((e) => e.id === t.topicId);
      return { topic: t.topicId, score: t.rawScore, fullMark: 4, name: def?.title ?? t.topicId };
    }),
    ...socialScores.map((t) => {
      const def = ESG_TOPICS.find((e) => e.id === t.topicId);
      return { topic: t.topicId, score: t.rawScore, fullMark: 4, name: def?.title ?? t.topicId };
    }),
  ];

  function handleExportCSV() {
    const csv = generateCSV(evaluation!);
    downloadCSV(csv, `${evaluation!.context.name.replace(/\s+/g, "_")}_evaluation.csv`);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Results Dashboard</h1>
          <p className="text-sm text-gray-500">{evaluation.context.name} · {evaluation.context.stage}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
          <Link href={`/app/report/${id}`}>
            <Button variant="secondary" size="sm" leftIcon={<FileText size={14} />}>
              Full Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Top score cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <ScoreCard
          label="Financial Score"
          value={financialNormalized}
          unit="%"
          color={financialNormalized >= 66 ? "brand" : financialNormalized >= 33 ? "amber" : "gray"}
        >
          <ProgressBar value={financialNormalized} size="sm" className="mt-3"
            color={financialNormalized >= 66 ? "brand" : financialNormalized >= 33 ? "amber" : "red"} />
        </ScoreCard>

        <ScoreCard
          label="Risk Level"
          value={riskOverallScore.toFixed(1)}
          max={4}
          color={riskOverallScore >= 3 ? "red" : riskOverallScore >= 2 ? "amber" : "brand"}
        >
          <div className="mt-2">
            <RiskChip label={riskOverallLabel} />
          </div>
        </ScoreCard>

        <ScoreCard
          label="Opportunity Level"
          value={opportunityOverallScore.toFixed(1)}
          max={4}
          color="brand"
        >
          <div className="mt-2">
            <OpportunityChip label={opportunityOverallLabel} />
          </div>
        </ScoreCard>

        <ScoreCard label="Confidence" value={confidenceBand} color={confidenceBand === "High" ? "brand" : confidenceBand === "Moderate" ? "amber" : "gray"}>
          <div className="mt-2">
            <ConfidenceChip level={confidenceBand} />
          </div>
        </ScoreCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left: E/S/G topics */}
        <div className="lg:col-span-2 space-y-5">
          {/* Environmental */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Leaf size={16} className="text-brand" />
              <h2 className="font-bold text-gray-900">Environmental (E1–E5)</h2>
            </div>
            <div className="space-y-3">
              {environmentalScores.map((t) => {
                const def = ESG_TOPICS.find((e) => e.id === t.topicId);
                return (
                  <div key={t.topicId} className="flex items-center gap-3">
                    <div className="w-6 text-xs font-bold text-gray-400">{t.topicId}</div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-700 mb-1">{def?.title}</div>
                      <ScoreBar score={t.rawScore} />
                    </div>
                    <PriorityChip band={t.band} score={t.rawScore} />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Social & Governance */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-brand" />
              <h2 className="font-bold text-gray-900">Social & Governance (S1–S4, G1)</h2>
            </div>
            <div className="space-y-3">
              {socialScores.map((t) => {
                const def = ESG_TOPICS.find((e) => e.id === t.topicId);
                return (
                  <div key={t.topicId} className="flex items-center gap-3">
                    <div className="w-6 text-xs font-bold text-gray-400">{t.topicId}</div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-700 mb-1">{def?.title}</div>
                      <ScoreBar score={t.rawScore} />
                    </div>
                    <PriorityChip band={t.band} score={t.rawScore} />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Top Risks */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-red-500" />
              <h2 className="font-bold text-gray-900">Top Risks</h2>
              <RiskChip label={riskOverallLabel} score={riskOverallScore} />
            </div>
            <div className="space-y-2">
              {topRisks.length === 0 ? (
                <p className="text-xs text-gray-400">No applicable risks assessed yet.</p>
              ) : topRisks.map((r) => {
                const def = RISK_DEFINITIONS.find((d) => d.id === r.id);
                return (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-red-50/50 border border-red-100">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-gray-500">{r.id}</div>
                      <div className="text-sm font-semibold text-gray-800 truncate">{r.label}</div>
                      <div className="text-[11px] text-gray-500">{def?.category}</div>
                    </div>
                    <RiskChip label={r.rating} score={r.score} />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Top Opportunities */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-brand" />
              <h2 className="font-bold text-gray-900">Top Opportunities</h2>
              <OpportunityChip label={opportunityOverallLabel} score={opportunityOverallScore} />
            </div>
            <div className="space-y-2">
              {topOpportunities.length === 0 ? (
                <p className="text-xs text-gray-400">No applicable opportunities assessed yet.</p>
              ) : topOpportunities.map((o) => {
                const def = OPPORTUNITY_DEFINITIONS.find((d) => d.id === o.id);
                return (
                  <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl bg-green-50/50 border border-green-100">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-gray-500">{o.id}</div>
                      <div className="text-sm font-semibold text-gray-800 truncate">{o.label}</div>
                      <div className="text-[11px] text-gray-500">{def?.category}</div>
                    </div>
                    <OpportunityChip label={o.rating} score={o.score} />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Radar chart */}
          <Card>
            <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
              <Eye size={14} className="text-brand" />
              Impact Profile
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius={60}>
                  <PolarGrid stroke="#E5EDDF" />
                  <PolarAngleAxis dataKey="topic" tick={{ fontSize: 9, fill: "#6B7280" }} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#39B54A"
                    fill="#39B54A"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip formatter={(v: unknown) => typeof v === "number" ? v.toFixed(2) : String(v)} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recommendations */}
          <Card className="bg-brand/5 border-l-4 border-l-brand">
            <h3 className="font-bold text-brand-dark mb-3 text-sm flex items-center gap-2">
              <Lightbulb size={14} />
              Recommendations
            </h3>
            <ul className="space-y-2.5">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                  <CheckCircle size={11} className="text-brand mt-0.5 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </Card>

          {/* Sensitivity / confidence panel */}
          <Card>
            <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
              <Info size={14} className="text-amber-600" />
              Sensitivity & Confidence
            </h3>
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Evidence basis</p>
              <ConfidenceChip level={confidenceBand} />
            </div>
            {sensitivityHints.length > 0 ? (
              <div className="space-y-2">
                {sensitivityHints.map((hint, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-50 rounded-lg p-2">
                    <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
                    {hint}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No near-threshold sensitivities detected.</p>
            )}
            <p className="text-[10px] text-gray-400 mt-3 italic">
              Sensitivity hints do not change your scores. They are explanatory only.
            </p>
          </Card>

          {/* Material topics summary */}
          {materialTopics.length > 0 && (
            <Card>
              <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-600" />
                Material Topics ({materialTopics.length})
              </h3>
              <div className="space-y-1.5">
                {materialTopics.map((t) => {
                  const def = ESG_TOPICS.find((e) => e.id === t.topicId);
                  return (
                    <div key={t.topicId} className="flex items-center justify-between">
                      <span className="text-xs text-gray-700">{t.topicId} — {def?.title}</span>
                      <PriorityChip band={t.band} />
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Navigation actions */}
          <div className="flex flex-col gap-2">
            <Link href={`/app/evaluate/${id}/sdg-alignment`} className="btn-secondary text-sm text-center">
              SDG Alignment →
            </Link>
            <Link href={`/app/report/${id}`} className="btn-primary text-sm text-center flex items-center justify-center gap-2">
              <FileText size={14} />
              View Full Report
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
