"use client";
import { use } from "react";
import Link from "next/link";
import { useEvaluationStore } from "@/store/evaluationStore";
import { computeDashboardSummary, calcImpactScore, scoreToBand } from "@/lib/scoring";
import { ESG_TOPICS } from "@/data/esg-topics";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PriorityChip, ConfidenceChip } from "@/components/ui/Badge";
import { ScoreBar } from "@/components/ui/ProgressBar";
import {
  ArrowRight, Leaf, Users, AlertCircle, CheckCircle2, Info, TrendingUp
} from "lucide-react";

interface Props { params: Promise<{ id: string }> }

export default function ImpactSummaryPage({ params }: Props) {
  const { id } = use(params);
  const { getEvaluation } = useEvaluationStore();
  const evaluation = getEvaluation(id);

  if (!evaluation?.stage1) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <p className="text-gray-500">Please complete Stage I first.</p>
        <Link href={`/app/evaluate/${id}/stage-1`}>
          <Button className="mt-4">Go to Stage I</Button>
        </Link>
      </div>
    );
  }

  const summary = evaluation?.stage1 && evaluation?.stage2
    ? computeDashboardSummary(evaluation as import('@/types/evaluation').Evaluation)
    : null;

  const envTopics = ESG_TOPICS.filter((t) => t.category === "E");
  const socTopics = ESG_TOPICS.filter((t) => t.category === "S" || t.category === "G");

  function getScore(topicId: string) {
    const section = envTopics.find((t) => t.id === topicId) ? "environmental" : "social";
    const assessment = evaluation!.stage1![section as "environmental" | "social"][topicId];
    return assessment ? calcImpactScore(assessment) : 0;
  }

  const allTopicScores = summary ? [...summary.environmentalScores, ...summary.socialScores] : [];
  const materialTopics = allTopicScores.filter((t) => t.rawScore >= 2);
  const highPriorityTopics = allTopicScores.filter((t) => t.band === "high");
  const lowTopics = allTopicScores.filter((t) => t.band === "low" || t.band === "verylow");
  const naTopics = allTopicScores.filter((t) => t.band === "na");

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-black text-gray-900 mb-1">Impact Summary</h1>
          <p className="text-sm text-gray-500">
            Auto-generated from your Stage I inputs for {evaluation.context.name}.
          </p>
        </div>
        <Link href={`/app/evaluate/${id}/sdg-alignment`}>
          <Button variant="primary" rightIcon={<ArrowRight size={15} />}>
            SDG Alignment
          </Button>
        </Link>
      </div>

      {/* Confidence indicator */}
      {summary && (
        <div className="flex items-center gap-3 rounded-xl bg-surface-muted border border-surface-border p-3 mb-6">
          <Info size={15} className="text-brand flex-shrink-0" />
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="text-gray-600">Assessment confidence:</span>
            <ConfidenceChip level={summary.confidenceBand} />
            <span className="text-xs text-gray-500">
              {summary.confidenceBand === "Low"
                ? "Many inputs are assumed — adding measured/estimated data will improve confidence."
                : summary.confidenceBand === "Moderate"
                ? "Mix of estimated and assumed inputs — review key topics carefully."
                : "Good input quality — most topics based on measured or estimated data."}
            </span>
          </div>
        </div>
      )}

      {/* High priority alerts */}
      {highPriorityTopics.length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-red-600" />
            <h2 className="font-bold text-red-800">
              {highPriorityTopics.length} High-Priority {highPriorityTopics.length === 1 ? "Topic" : "Topics"}
            </h2>
          </div>
          <div className="space-y-2">
            {highPriorityTopics.map((t) => {
              const def = ESG_TOPICS.find((e) => e.id === t.topicId);
              return (
                <div key={t.topicId} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-red-100">
                  <div>
                    <span className="font-bold text-sm text-red-900">{t.topicId} — {def?.title}</span>
                    <p className="text-xs text-red-700 mt-0.5 italic">"{def?.question}"</p>
                  </div>
                  <PriorityChip band={t.band} score={t.rawScore} />
                </div>
              );
            })}
          </div>
          <p className="text-xs text-red-700 mt-3">
            These topics require strategic action. Build measurable plans and embed them in your product design now.
          </p>
        </div>
      )}

      {/* Material topics */}
      {materialTopics.filter((t) => t.band !== "high").length > 0 && (
        <Card className="mb-6">
          <h2 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
            <AlertCircle size={15} className="text-amber-600" />
            Relevant Material Topics
          </h2>
          <div className="space-y-2">
            {materialTopics.filter((t) => t.band !== "high").map((t) => {
              const def = ESG_TOPICS.find((e) => e.id === t.topicId);
              return (
                <div key={t.topicId} className="flex items-center justify-between">
                  <span className="text-sm text-gray-800">{t.topicId} — {def?.title}</span>
                  <div className="flex items-center gap-3">
                    <ScoreBar score={t.rawScore} className="w-24" />
                    <PriorityChip band={t.band} score={t.rawScore} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Environmental topics */}
      <Card className="mb-6">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Leaf size={15} className="text-brand" />
          Environmental (E1–E5)
        </h2>
        <div className="space-y-3">
          {envTopics.map((topic) => {
            const score = getScore(topic.id);
            const assessment = evaluation.stage1!.environmental[topic.id];
            if (!assessment) return null;
            const band = assessment.applicable ? scoreToBand(score, true) : "na" as const;
            return (
              <div key={topic.id} className="flex items-center gap-3">
                <div className="w-8 text-xs font-bold text-gray-500">{topic.id}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-800 font-medium">{topic.title}</span>
                  </div>
                  <ScoreBar score={score} />
                </div>
                <PriorityChip band={band} score={assessment.applicable ? score : undefined} />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Social & Governance */}
      <Card className="mb-6">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users size={15} className="text-brand" />
          Social & Governance (S1–S4, G1)
        </h2>
        <div className="space-y-3">
          {socTopics.map((topic) => {
            const score = getScore(topic.id);
            const assessment = evaluation.stage1!.social[topic.id];
            if (!assessment) return null;
            const band = assessment.applicable ? scoreToBand(score, true) : "na" as const;
            return (
              <div key={topic.id} className="flex items-center gap-3">
                <div className="w-8 text-xs font-bold text-gray-500">{topic.id}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-800 font-medium">{topic.title}</span>
                  </div>
                  <ScoreBar score={score} />
                </div>
                <PriorityChip band={band} score={assessment.applicable ? score : undefined} />
              </div>
            );
          })}
        </div>
      </Card>

      {/* What to consider */}
      <Card className="mb-6 bg-brand/5 border-l-4 border-l-brand">
        <h2 className="font-bold text-brand-dark mb-3 flex items-center gap-2">
          <CheckCircle2 size={15} className="text-brand" />
          What to consider next
        </h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {materialTopics.length > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-brand mt-0.5">→</span>
              Review the {materialTopics.length} material topic{materialTopics.length > 1 ? "s" : ""} and set near-term improvement targets.
            </li>
          )}
          {highPriorityTopics.length > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-brand mt-0.5">→</span>
              Build explicit design choices around {highPriorityTopics.map(t => t.topicId).join(", ")} — these are your hot spots.
            </li>
          )}
          {naTopics.length > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">→</span>
              {naTopics.length} topics marked N/A — revisit as your model scales.
            </li>
          )}
          <li className="flex items-start gap-2">
            <span className="text-brand mt-0.5">→</span>
            Use your SDG Alignment to frame your sustainability narrative with recognised language.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand mt-0.5">→</span>
            Check your Dashboard for top risks and opportunities requiring strategic focus.
          </li>
        </ul>
      </Card>

      <div className="flex justify-between items-center mt-6 pt-6 border-t border-surface-border">
        <Link href={`/app/evaluate/${id}/stage-2`} className="btn-secondary text-sm">
          ← Back to Stage II
        </Link>
        <Link href={`/app/evaluate/${id}/sdg-alignment`}>
          <Button variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
            Continue to SDG Alignment
          </Button>
        </Link>
      </div>
    </div>
  );
}
