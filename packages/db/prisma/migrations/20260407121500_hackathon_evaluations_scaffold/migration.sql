CREATE TYPE "OfferingType" AS ENUM ('product', 'service');
CREATE TYPE "StartupStage" AS ENUM (
  'ideation',
  'validation',
  'prototype_mvp',
  'pre_launch',
  'launch',
  'product_market_fit',
  'growth_channel_fit',
  'revenue_validation',
  'operational_foundation',
  'early_scale'
);
CREATE TYPE "InnovationApproach" AS ENUM ('sustaining', 'disruptive');
CREATE TYPE "EvaluationStatus" AS ENUM ('draft', 'in_progress', 'completed');
CREATE TYPE "EvaluationStep" AS ENUM (
  'start',
  'summary',
  'stage_1',
  'stage_2',
  'impact_summary',
  'sdg_alignment',
  'dashboard',
  'report'
);
CREATE TYPE "FinancialRoiLevel" AS ENUM (
  'not_evaluated',
  'below_industry_average',
  'average_or_no_benchmark',
  'above_industry_average'
);
CREATE TYPE "FinancialSensitivityLevel" AS ENUM (
  'not_evaluated',
  'high_volatility',
  'moderate_volatility',
  'low_volatility'
);
CREATE TYPE "FinancialUspLevel" AS ENUM (
  'not_evaluated',
  'no_usp',
  'weak_or_moderate_usp',
  'strong_or_unique_usp'
);
CREATE TYPE "FinancialMarketGrowthLevel" AS ENUM (
  'not_evaluated',
  'shrinking',
  'mature',
  'growing'
);
CREATE TYPE "TopicCode" AS ENUM ('E1', 'E2', 'E3', 'E4', 'E5', 'S1', 'S2', 'S3', 'S4', 'G1');
CREATE TYPE "EvidenceBasis" AS ENUM ('measured', 'estimated', 'assumed');
CREATE TYPE "PriorityBand" AS ENUM (
  'not_applicable',
  'very_low',
  'low',
  'relevant',
  'high_priority'
);
CREATE TYPE "ImpactDimensionLevel" AS ENUM ('low', 'moderate', 'significant', 'high', 'na');
CREATE TYPE "ImpactLikelihoodLevel" AS ENUM (
  'very_unlikely',
  'unlikely',
  'likely',
  'very_likely',
  'na'
);
CREATE TYPE "RiskProbabilityLevel" AS ENUM ('rare', 'could_occur', 'likely', 'very_likely', 'na');
CREATE TYPE "RiskCode" AS ENUM (
  'climate_policy_risk',
  'water_scarcity_risk',
  'biodiversity_regulation_risk',
  'resource_scarcity_risk',
  'community_stability_risk',
  'consumer_governance_risk'
);
CREATE TYPE "OpportunityCode" AS ENUM (
  'climate_transition_opportunity',
  'water_reputation_opportunity',
  'biodiversity_reputation_opportunity',
  'circular_efficiency_opportunity',
  'community_reputation_opportunity',
  'governance_trust_opportunity'
);
CREATE TYPE "RiskRatingLabel" AS ENUM ('neutral', 'sustainable', 'moderate', 'severe', 'critical');
CREATE TYPE "OpportunityRatingLabel" AS ENUM (
  'neutral',
  'small',
  'reasonable',
  'sustainable',
  'great'
);
CREATE TYPE "ConfidenceBand" AS ENUM ('high', 'moderate', 'low');
CREATE TYPE "SdgSourceType" AS ENUM ('stage', 'business', 'both');
CREATE TYPE "RecommendationType" AS ENUM ('financial', 'stage1', 'risk', 'opportunity');

CREATE TABLE "Evaluation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "naceDivision" TEXT NOT NULL,
  "offeringType" "OfferingType" NOT NULL,
  "launched" BOOLEAN NOT NULL,
  "currentStage" "StartupStage" NOT NULL,
  "innovationApproach" "InnovationApproach" NOT NULL,
  "status" "EvaluationStatus" NOT NULL DEFAULT 'draft',
  "currentStep" "EvaluationStep" NOT NULL DEFAULT 'start',
  "financialTotal" INTEGER NOT NULL DEFAULT 0,
  "riskOverall" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "opportunityOverall" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "confidenceBand" "ConfidenceBand" NOT NULL DEFAULT 'low',
  "relevantTopicCount" INTEGER NOT NULL DEFAULT 0,
  "highPriorityTopicCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Stage1FinancialAnswer" (
  "evaluationId" TEXT NOT NULL,
  "roiLevel" "FinancialRoiLevel" NOT NULL,
  "sensitivityLevel" "FinancialSensitivityLevel" NOT NULL,
  "uspLevel" "FinancialUspLevel" NOT NULL,
  "marketGrowthLevel" "FinancialMarketGrowthLevel" NOT NULL,
  "totalScore" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Stage1FinancialAnswer_pkey" PRIMARY KEY ("evaluationId")
);

CREATE TABLE "Stage1TopicAnswer" (
  "id" TEXT NOT NULL,
  "evaluationId" TEXT NOT NULL,
  "topicCode" "TopicCode" NOT NULL,
  "applicable" BOOLEAN NOT NULL DEFAULT true,
  "magnitude" "ImpactDimensionLevel" NOT NULL,
  "scale" "ImpactDimensionLevel" NOT NULL,
  "irreversibility" "ImpactDimensionLevel" NOT NULL,
  "likelihood" "ImpactLikelihoodLevel" NOT NULL,
  "evidenceBasis" "EvidenceBasis" NOT NULL,
  "impactScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "priorityBand" "PriorityBand" NOT NULL DEFAULT 'not_applicable',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Stage1TopicAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Stage2RiskAnswer" (
  "id" TEXT NOT NULL,
  "evaluationId" TEXT NOT NULL,
  "riskCode" "RiskCode" NOT NULL,
  "applicable" BOOLEAN NOT NULL DEFAULT true,
  "probability" "RiskProbabilityLevel" NOT NULL,
  "impact" "ImpactDimensionLevel" NOT NULL,
  "evidenceBasis" "EvidenceBasis" NOT NULL,
  "ratingLabel" "RiskRatingLabel" NOT NULL DEFAULT 'neutral',
  "ratingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Stage2RiskAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Stage2OpportunityAnswer" (
  "id" TEXT NOT NULL,
  "evaluationId" TEXT NOT NULL,
  "opportunityCode" "OpportunityCode" NOT NULL,
  "applicable" BOOLEAN NOT NULL DEFAULT true,
  "likelihood" "RiskProbabilityLevel" NOT NULL,
  "impact" "ImpactDimensionLevel" NOT NULL,
  "evidenceBasis" "EvidenceBasis" NOT NULL,
  "ratingLabel" "OpportunityRatingLabel" NOT NULL DEFAULT 'neutral',
  "ratingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Stage2OpportunityAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SdgMapping" (
  "id" TEXT NOT NULL,
  "sourceType" "SdgSourceType" NOT NULL,
  "startupStage" "StartupStage",
  "naceDivisionCode" TEXT,
  "naceDivisionLabel" TEXT,
  "sdgNumber" INTEGER NOT NULL,
  "sdgName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SdgMapping_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecommendationTemplate" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "recommendationType" "RecommendationType" NOT NULL,
  "severityBand" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecommendationTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Evaluation_userId_updatedAt_idx" ON "Evaluation"("userId", "updatedAt");
CREATE UNIQUE INDEX "Stage1TopicAnswer_evaluationId_topicCode_key" ON "Stage1TopicAnswer"("evaluationId", "topicCode");
CREATE INDEX "Stage1TopicAnswer_priorityBand_idx" ON "Stage1TopicAnswer"("priorityBand");
CREATE UNIQUE INDEX "Stage2RiskAnswer_evaluationId_riskCode_key" ON "Stage2RiskAnswer"("evaluationId", "riskCode");
CREATE INDEX "Stage2RiskAnswer_ratingLabel_idx" ON "Stage2RiskAnswer"("ratingLabel");
CREATE UNIQUE INDEX "Stage2OpportunityAnswer_evaluationId_opportunityCode_key" ON "Stage2OpportunityAnswer"("evaluationId", "opportunityCode");
CREATE INDEX "Stage2OpportunityAnswer_ratingLabel_idx" ON "Stage2OpportunityAnswer"("ratingLabel");
CREATE INDEX "SdgMapping_sourceType_startupStage_sdgNumber_idx" ON "SdgMapping"("sourceType", "startupStage", "sdgNumber");
CREATE INDEX "SdgMapping_sourceType_naceDivisionCode_sdgNumber_idx" ON "SdgMapping"("sourceType", "naceDivisionCode", "sdgNumber");
CREATE UNIQUE INDEX "RecommendationTemplate_code_recommendationType_severityBand_key" ON "RecommendationTemplate"("code", "recommendationType", "severityBand");

ALTER TABLE "Evaluation"
  ADD CONSTRAINT "Evaluation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Stage1FinancialAnswer"
  ADD CONSTRAINT "Stage1FinancialAnswer_evaluationId_fkey"
  FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Stage1TopicAnswer"
  ADD CONSTRAINT "Stage1TopicAnswer_evaluationId_fkey"
  FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Stage2RiskAnswer"
  ADD CONSTRAINT "Stage2RiskAnswer_evaluationId_fkey"
  FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Stage2OpportunityAnswer"
  ADD CONSTRAINT "Stage2OpportunityAnswer_evaluationId_fkey"
  FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
