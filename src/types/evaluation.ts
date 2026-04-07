// ─────────────────────────────────────────────────────────────────────────────
// Core domain types for the Startup Sustainability Evaluation Tool (SbyD)
// All types are frontend-only. IDs, relations, and DTOs mirror what a
// NestJS + PostgreSQL backend would expose.
// ─────────────────────────────────────────────────────────────────────────────

export type EvaluationStatus = "draft" | "in_progress" | "completed";

export type OfferingType = "Product" | "Service";

export type InnovationApproach = "Sustaining" | "Disruptive";

export type StartupStage =
  | "Ideation"
  | "Validation (Problem/Solution Fit)"
  | "Prototype / MVP"
  | "Pre-Launch / Market Entry"
  | "Launch / Early Commercial Activity"
  | "Post Launch"
  | "Product-Market Fit (PMF)"
  | "Growth & Channel Fit"
  | "Revenue Validation / Business Model Fit"
  | "Operational Foundation"
  | "Early Scale / Fundraising Readiness";

// ─── Startup Context ──────────────────────────────────────────────────────────
export interface StartupContext {
  name: string;
  country: string;
  naceCode: string;        // e.g. "62" (NACE division)
  naceLabel: string;       // e.g. "Computer programming, consultancy..."
  offeringType: OfferingType;
  launched: boolean;
  stage: StartupStage;
  innovationApproach: InnovationApproach;
}

// ─── Financial KPI Levels ─────────────────────────────────────────────────────
export type FinancialLevel = 0 | 1 | 2 | 3;
// 0=Not evaluated, 1=Below average, 2=Average, 3=Above average

export interface FinancialIndicators {
  roiIrrNpv: FinancialLevel;           // Economic KPIs
  sensitivityAnalysis: FinancialLevel; // Robustness
  uspStrategicFit: FinancialLevel;     // Positioning
  marketGrowth: FinancialLevel;        // Market Growth
}

// ─── ESG Dimension Scales ─────────────────────────────────────────────────────
export type DimensionScore = 0 | 1 | 2 | 3 | 4; // 0=N/A, 1=Low, 2=Moderate, 3=Significant, 4=High
export type LikelihoodValue = 0 | 0.25 | 0.5 | 0.75 | 1;
export type EvidenceBasis = "measured" | "estimated" | "assumed";

export interface ESGTopicAssessment {
  topicId: string;           // e.g. "E1", "S2", "G1"
  applicable: boolean;
  magnitude: DimensionScore;
  scale: DimensionScore;
  irreversibility: DimensionScore;
  likelihood: LikelihoodValue;
  evidenceBasis: EvidenceBasis;
  notes?: string;
}

// Impact Score = ((Magnitude + Scale + Irreversibility) / 3) * Likelihood
export interface ComputedTopicScore {
  topicId: string;
  rawScore: number;           // 0–4
  band: PriorityBand;
  label: string;
}

export type PriorityBand = "na" | "verylow" | "low" | "relevant" | "high";

// ─── Stage I ─────────────────────────────────────────────────────────────────
export interface Stage1Data {
  financial: FinancialIndicators;
  environmental: Record<string, ESGTopicAssessment>; // keyed by E1–E5
  social: Record<string, ESGTopicAssessment>;         // keyed by S1–S4, G1
}

// ─── Stage II – Risk/Opportunity ─────────────────────────────────────────────
export type RiskImpactLevel = 0 | 1 | 2 | 3 | 4; // 0=N/A, 1=Low, 2=Moderate, 3=Significant, 4=High
export type ProbabilityLevel = 0 | 1 | 2 | 3 | 4; // 0=N/A, 1=Rare, 2=Could occur, 3=Likely, 4=Very likely
export type RiskRating = "Neutral" | "Sustainable" | "Moderate" | "Severe" | "Critical";
export type OpportunityRating = "Neutral" | "Small" | "Reasonable" | "Sustainable" | "Great";

export interface RiskItem {
  itemId: string;
  applicable: boolean;
  probability: ProbabilityLevel;
  impact: RiskImpactLevel;
  // derived:
  ratingScore: number;   // 0–4
  ratingLabel: RiskRating;
}

export interface OpportunityItem {
  itemId: string;
  applicable: boolean;
  likelihood: ProbabilityLevel;
  impact: RiskImpactLevel;
  // derived:
  ratingScore: number;
  ratingLabel: OpportunityRating;
}

export interface Stage2Data {
  risks: Record<string, RiskItem>;
  opportunities: Record<string, OpportunityItem>;
}

// ─── SDG ──────────────────────────────────────────────────────────────────────
export type SDGSource = "Stage" | "Business" | "Both";

export interface SDGTarget {
  id: string;
  text: string;
}

export interface SDGDefinition {
  number: number;
  title: string;
  summary: string;
  color: string;
  targets: SDGTarget[];
}

export interface SDGAlignment {
  sdgNumber: number;
  source: SDGSource;
}

// ─── Full Evaluation ──────────────────────────────────────────────────────────
export interface Evaluation {
  id: string;
  userId: string;
  status: EvaluationStatus;
  createdAt: string;   // ISO date
  updatedAt: string;
  context: StartupContext;
  stage1?: Stage1Data;
  stage2?: Stage2Data;
  sdgAlignment?: SDGAlignment[];
}

// ─── Computed/Derived (frontend only) ────────────────────────────────────────
export interface DashboardSummary {
  financialTotalScore: number;        // 0–12 (sum of 4 KPIs * max 3)
  financialNormalized: number;        // 0–100
  environmentalScores: ComputedTopicScore[];
  socialScores: ComputedTopicScore[];
  materialTopics: ComputedTopicScore[];
  highPriorityTopics: ComputedTopicScore[];
  riskOverallScore: number;           // 0–4
  riskOverallLabel: RiskRating;
  opportunityOverallScore: number;
  opportunityOverallLabel: OpportunityRating;
  topRisks: { id: string; label: string; score: number; rating: RiskRating }[];
  topOpportunities: { id: string; label: string; score: number; rating: OpportunityRating }[];
  confidenceBand: "High" | "Moderate" | "Low";
  sensitivityHints: string[];
  recommendations: string[];
}

// ─── Mock User ────────────────────────────────────────────────────────────────
export interface MockUser {
  id: string;
  name: string;
  email: string;
  organisation?: string;
  avatarInitials: string;
}
