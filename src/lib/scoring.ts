// ─────────────────────────────────────────────────────────────────────────────
// Scoring helpers — all deterministic, frontend-only
// These functions mirror exactly what the backend will compute later.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  ESGTopicAssessment,
  FinancialIndicators,
  Stage1Data,
  Stage2Data,
  ComputedTopicScore,
  PriorityBand,
  DashboardSummary,
  RiskRating,
  OpportunityRating,
  Evaluation,
} from "@/types/evaluation";
import { RISK_MATRIX, OPPORTUNITY_MATRIX, RISK_RATING_LABELS, OPPORTUNITY_RATING_LABELS, RISK_DEFINITIONS, OPPORTUNITY_DEFINITIONS } from "@/data/risks-opportunities";
import { ESG_TOPICS } from "@/data/esg-topics";

// ─── E/S/G Impact Score ───────────────────────────────────────────────────────
export function calcImpactScore(t: ESGTopicAssessment): number {
  if (!t.applicable) return 0;
  const avg = (t.magnitude + t.scale + t.irreversibility) / 3;
  return avg * t.likelihood;
}

// ─── Priority Band ────────────────────────────────────────────────────────────
export function scoreToBand(score: number, applicable: boolean): PriorityBand {
  if (!applicable || score === 0) return "na";
  if (score > 0 && score < 1) return "verylow";
  if (score >= 1 && score < 2) return "low";
  if (score >= 2 && score < 2.5) return "relevant";
  return "high";
}

export function bandLabel(band: PriorityBand): string {
  const map: Record<PriorityBand, string> = {
    na: "Not Applicable",
    verylow: "Very Low",
    low: "Low",
    relevant: "Relevant",
    high: "High Priority",
  };
  return map[band];
}

export function bandColor(band: PriorityBand): string {
  const map: Record<PriorityBand, string> = {
    na: "bg-gray-100 text-gray-500",
    verylow: "bg-emerald-50 text-emerald-700",
    low: "bg-green-100 text-green-700",
    relevant: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700",
  };
  return map[band];
}

// ─── Compute all E/S/G topic scores ──────────────────────────────────────────
export function computeTopicScores(assessments: Record<string, ESGTopicAssessment>): ComputedTopicScore[] {
  return Object.values(assessments).map((t) => {
    const rawScore = calcImpactScore(t);
    const band = scoreToBand(rawScore, t.applicable);
    return {
      topicId: t.topicId,
      rawScore: parseFloat(rawScore.toFixed(2)),
      band,
      label: bandLabel(band),
    };
  });
}

// ─── Financial total score ────────────────────────────────────────────────────
export function calcFinancialTotal(f: FinancialIndicators): number {
  return f.roiIrrNpv + f.sensitivityAnalysis + f.uspStrategicFit + f.marketGrowth;
}

export function calcFinancialNormalized(f: FinancialIndicators): number {
  return Math.round((calcFinancialTotal(f) / 12) * 100);
}

export function financialScoreLabel(normalized: number): string {
  if (normalized === 0) return "Not evaluated";
  if (normalized < 33) return "Early Stage";
  if (normalized < 66) return "Developing";
  return "Strong";
}

// ─── Risk/Opportunity ratings ─────────────────────────────────────────────────
export function calcRiskRating(probability: number, impact: number): { score: number; label: RiskRating } {
  const score = RISK_MATRIX[probability]?.[impact] ?? 0;
  return { score, label: RISK_RATING_LABELS[score] as RiskRating };
}

export function calcOpportunityRating(likelihood: number, impact: number): { score: number; label: OpportunityRating } {
  const score = OPPORTUNITY_MATRIX[likelihood]?.[impact] ?? 0;
  return { score, label: OPPORTUNITY_RATING_LABELS[score] as OpportunityRating };
}

// ─── Overall Stage II aggregates ──────────────────────────────────────────────
export function calcOverallRisk(stage2: Stage2Data): { score: number; label: RiskRating } {
  const applicable = Object.values(stage2.risks).filter((r) => r.applicable && r.ratingScore > 0);
  if (applicable.length === 0) return { score: 0, label: "Neutral" };
  const avg = applicable.reduce((sum, r) => sum + r.ratingScore, 0) / applicable.length;
  const score = parseFloat(avg.toFixed(1));
  const rounded = Math.round(score);
  return { score, label: RISK_RATING_LABELS[Math.min(rounded, 4)] as RiskRating };
}

export function calcOverallOpportunity(stage2: Stage2Data): { score: number; label: OpportunityRating } {
  const applicable = Object.values(stage2.opportunities).filter((o) => o.applicable && o.ratingScore > 0);
  if (applicable.length === 0) return { score: 0, label: "Neutral" };
  const avg = applicable.reduce((sum, o) => sum + o.ratingScore, 0) / applicable.length;
  const score = parseFloat(avg.toFixed(1));
  const rounded = Math.round(score);
  return { score, label: OPPORTUNITY_RATING_LABELS[Math.min(rounded, 4)] as OpportunityRating };
}

// ─── Confidence band based on evidence basis ─────────────────────────────────
export function calcConfidenceBand(stage1: Stage1Data): "High" | "Moderate" | "Low" {
  const all = [
    ...Object.values(stage1.environmental),
    ...Object.values(stage1.social),
  ].filter((t) => t.applicable);

  if (all.length === 0) return "Low";
  const measured = all.filter((t) => t.evidenceBasis === "measured").length;
  const estimated = all.filter((t) => t.evidenceBasis === "estimated").length;
  const total = all.length;
  const qualityScore = (measured * 3 + estimated * 2) / (total * 3);
  if (qualityScore >= 0.66) return "High";
  if (qualityScore >= 0.33) return "Moderate";
  return "Low";
}

// ─── Sensitivity hints ────────────────────────────────────────────────────────
export function calcSensitivityHints(stage1: Stage1Data): string[] {
  const hints: string[] = [];
  const allTopics = [
    ...Object.values(stage1.environmental),
    ...Object.values(stage1.social),
  ];

  allTopics.forEach((t) => {
    const score = calcImpactScore(t);
    const def = ESG_TOPICS.find((e) => e.id === t.topicId);
    const title = def?.title ?? t.topicId;

    // Near threshold hints
    if (score >= 1.7 && score < 2) {
      hints.push(`${title} is close to becoming a relevant topic — consider reviewing your inputs.`);
    } else if (score >= 2.2 && score < 2.5) {
      hints.push(`${title} is approaching high-priority status — one step up in likelihood or magnitude would change your result.`);
    }

    // Evidence basis hints
    if (t.applicable && t.evidenceBasis === "assumed" && score >= 2) {
      hints.push(`${title} score is based on assumed inputs — measurement would increase confidence.`);
    }
  });

  return [...new Set(hints)].slice(0, 5); // max 5 hints
}

// ─── Recommendations ─────────────────────────────────────────────────────────
export function generateRecommendations(summary: Partial<DashboardSummary>): string[] {
  const recs: string[] = [];

  if ((summary.highPriorityTopics?.length ?? 0) > 0) {
    const names = summary.highPriorityTopics!.map((t) => {
      const def = ESG_TOPICS.find((e) => e.id === t.topicId);
      return def?.title ?? t.topicId;
    });
    recs.push(`Prioritize ${names.join(", ")} — these topics have the highest potential for strategic impact. Build measurable action plans.`);
  }

  if ((summary.financialNormalized ?? 0) < 50) {
    recs.push("Strengthen your financial case: run a sensitivity analysis, refine your USP, and gather market evidence to increase investor confidence.");
  }

  if (summary.riskOverallLabel === "Critical" || summary.riskOverallLabel === "Severe") {
    recs.push("Address high-severity risks now. Consider scenario planning, risk mitigation roadmaps, and early stakeholder engagement.");
  }

  if (summary.opportunityOverallLabel === "Great" || summary.opportunityOverallLabel === "Sustainable") {
    recs.push("Your opportunity landscape looks strong — prioritize the top-rated opportunities and align them with your growth roadmap and pitch deck.");
  }

  if (summary.confidenceBand === "Low") {
    recs.push("Many inputs are based on assumptions. As you prototype, replace assumed scores with estimated or measured data to strengthen your case.");
  }

  if ((summary.materialTopics?.length ?? 0) > 0) {
    recs.push("Share your material topics with your design team — each one is an opportunity to improve product-market fit and reduce future compliance burden.");
  }

  if (recs.length === 0) {
    recs.push("Your evaluation looks balanced. Keep monitoring material topics, update your SDG alignment as you scale, and revisit this assessment after your next milestone.");
  }

  return recs;
}

// ─── Full dashboard summary from evaluation ───────────────────────────────────
export function computeDashboardSummary(evaluation: Evaluation): DashboardSummary | null {
  if (!evaluation.stage1 || !evaluation.stage2) return null;

  const { stage1, stage2 } = evaluation;

  const financialTotalScore = calcFinancialTotal(stage1.financial);
  const financialNormalized = calcFinancialNormalized(stage1.financial);
  const environmentalScores = computeTopicScores(stage1.environmental);
  const socialScores = computeTopicScores(stage1.social);
  const allTopics = [...environmentalScores, ...socialScores];
  const materialTopics = allTopics.filter((t) => t.rawScore >= 2);
  const highPriorityTopics = allTopics.filter((t) => t.band === "high");

  const { score: riskOverallScore, label: riskOverallLabel } = calcOverallRisk(stage2);
  const { score: opportunityOverallScore, label: opportunityOverallLabel } = calcOverallOpportunity(stage2);

  const topRisks = Object.values(stage2.risks)
    .filter((r) => r.applicable && r.ratingScore > 0)
    .sort((a, b) => b.ratingScore - a.ratingScore)
    .slice(0, 3)
    .map((r) => {
      const def = RISK_DEFINITIONS.find((d) => d.id === r.itemId);
      return { id: r.itemId, label: def?.title ?? r.itemId, score: r.ratingScore, rating: r.ratingLabel };
    });

  const topOpportunities = Object.values(stage2.opportunities)
    .filter((o) => o.applicable && o.ratingScore > 0)
    .sort((a, b) => b.ratingScore - a.ratingScore)
    .slice(0, 3)
    .map((o) => {
      const def = OPPORTUNITY_DEFINITIONS.find((d) => d.id === o.itemId);
      return { id: o.itemId, label: def?.title ?? o.itemId, score: o.ratingScore, rating: o.ratingLabel };
    });

  const confidenceBand = calcConfidenceBand(stage1);
  const sensitivityHints = calcSensitivityHints(stage1);

  const partial = {
    financialNormalized,
    highPriorityTopics,
    materialTopics,
    riskOverallLabel,
    opportunityOverallLabel,
    confidenceBand,
  };
  const recommendations = generateRecommendations(partial);

  return {
    financialTotalScore,
    financialNormalized,
    environmentalScores,
    socialScores,
    materialTopics,
    highPriorityTopics,
    riskOverallScore,
    riskOverallLabel,
    opportunityOverallScore,
    opportunityOverallLabel,
    topRisks,
    topOpportunities,
    confidenceBand,
    sensitivityHints,
    recommendations,
  };
}

// ─── CSV Export helper ────────────────────────────────────────────────────────
export function generateCSV(evaluation: Evaluation): string {
  const rows: string[] = [];
  rows.push("Section,Item,Value");

  // Context
  const ctx = evaluation.context;
  rows.push(`Context,Startup Name,${ctx.name}`);
  rows.push(`Context,Country,${ctx.country}`);
  rows.push(`Context,NACE Division,"${ctx.naceCode} – ${ctx.naceLabel}"`);
  rows.push(`Context,Offering Type,${ctx.offeringType}`);
  rows.push(`Context,Stage,${ctx.stage}`);
  rows.push(`Context,Innovation Approach,${ctx.innovationApproach}`);

  if (evaluation.stage1) {
    const { financial, environmental, social } = evaluation.stage1;
    rows.push(`Stage I – Financial,ROI/IRR/NPV,${financial.roiIrrNpv}`);
    rows.push(`Stage I – Financial,Sensitivity Analysis,${financial.sensitivityAnalysis}`);
    rows.push(`Stage I – Financial,USP / Strategic Fit,${financial.uspStrategicFit}`);
    rows.push(`Stage I – Financial,Market Growth,${financial.marketGrowth}`);
    rows.push(`Stage I – Financial,Total Score,${calcFinancialTotal(financial)} / 12`);

    Object.values(environmental).forEach((t) => {
      const score = calcImpactScore(t).toFixed(2);
      rows.push(`Stage I – Environmental,${t.topicId} Score,${t.applicable ? score : "N/A"}`);
    });

    Object.values(social).forEach((t) => {
      const score = calcImpactScore(t).toFixed(2);
      rows.push(`Stage I – Social/Governance,${t.topicId} Score,${t.applicable ? score : "N/A"}`);
    });
  }

  if (evaluation.stage2) {
    Object.values(evaluation.stage2.risks).forEach((r) => {
      rows.push(`Stage II – Risks,${r.itemId} Rating,${r.applicable ? r.ratingLabel : "N/A"}`);
    });
    Object.values(evaluation.stage2.opportunities).forEach((o) => {
      rows.push(`Stage II – Opportunities,${o.itemId} Rating,${o.applicable ? o.ratingLabel : "N/A"}`);
    });
  }

  return rows.join("\n");
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
