import { z } from 'zod';

export const OfferingTypeSchema = z.enum(['product', 'service']);
export type OfferingType = z.infer<typeof OfferingTypeSchema>;

export const StartupStageSchema = z.enum([
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
]);
export type StartupStage = z.infer<typeof StartupStageSchema>;

export const InnovationApproachSchema = z.enum(['sustaining', 'disruptive']);
export type InnovationApproach = z.infer<typeof InnovationApproachSchema>;

export const EvaluationStatusSchema = z.enum(['draft', 'in_progress', 'completed']);
export type EvaluationStatus = z.infer<typeof EvaluationStatusSchema>;

export const EvaluationStepSchema = z.enum([
  'start',
  'summary',
  'stage_1',
  'stage_2',
  'impact_summary',
  'sdg_alignment',
  'dashboard',
  'report'
]);
export type EvaluationStep = z.infer<typeof EvaluationStepSchema>;

export const TopicCodeSchema = z.enum(['E1', 'E2', 'E3', 'E4', 'E5', 'S1', 'S2', 'S3', 'S4', 'G1']);
export type TopicCode = z.infer<typeof TopicCodeSchema>;

export const RiskCodeSchema = z.enum([
  'climate_policy_risk',
  'water_scarcity_risk',
  'biodiversity_regulation_risk',
  'resource_scarcity_risk',
  'community_stability_risk',
  'consumer_governance_risk'
]);
export type RiskCode = z.infer<typeof RiskCodeSchema>;

export const OpportunityCodeSchema = z.enum([
  'climate_transition_opportunity',
  'water_reputation_opportunity',
  'biodiversity_reputation_opportunity',
  'circular_efficiency_opportunity',
  'community_reputation_opportunity',
  'governance_trust_opportunity'
]);
export type OpportunityCode = z.infer<typeof OpportunityCodeSchema>;

export const PriorityBandSchema = z.enum([
  'not_applicable',
  'very_low',
  'low',
  'relevant',
  'high_priority'
]);
export type PriorityBand = z.infer<typeof PriorityBandSchema>;

export const EvidenceBasisSchema = z.enum(['measured', 'estimated', 'assumed']);
export type EvidenceBasis = z.infer<typeof EvidenceBasisSchema>;

export const ConfidenceBandSchema = z.enum(['high', 'moderate', 'low']);
export type ConfidenceBand = z.infer<typeof ConfidenceBandSchema>;

export const SdgSourceTypeSchema = z.enum(['stage', 'business', 'both']);
export type SdgSourceType = z.infer<typeof SdgSourceTypeSchema>;

export const FinancialRoiLevelSchema = z.enum([
  'not_evaluated',
  'below_industry_average',
  'average_or_no_benchmark',
  'above_industry_average'
]);
export type FinancialRoiLevel = z.infer<typeof FinancialRoiLevelSchema>;

export const FinancialSensitivityLevelSchema = z.enum([
  'not_evaluated',
  'high_volatility',
  'moderate_volatility',
  'low_volatility'
]);
export type FinancialSensitivityLevel = z.infer<typeof FinancialSensitivityLevelSchema>;

export const FinancialUspLevelSchema = z.enum([
  'not_evaluated',
  'no_usp',
  'weak_or_moderate_usp',
  'strong_or_unique_usp'
]);
export type FinancialUspLevel = z.infer<typeof FinancialUspLevelSchema>;

export const FinancialMarketGrowthLevelSchema = z.enum([
  'not_evaluated',
  'shrinking',
  'mature',
  'growing'
]);
export type FinancialMarketGrowthLevel = z.infer<typeof FinancialMarketGrowthLevelSchema>;

export const ImpactDimensionLevelSchema = z.enum(['low', 'moderate', 'significant', 'high', 'na']);
export type ImpactDimensionLevel = z.infer<typeof ImpactDimensionLevelSchema>;

export const ImpactLikelihoodLevelSchema = z.enum([
  'very_unlikely',
  'unlikely',
  'likely',
  'very_likely',
  'na'
]);
export type ImpactLikelihoodLevel = z.infer<typeof ImpactLikelihoodLevelSchema>;

export const RiskProbabilityLevelSchema = z.enum([
  'rare',
  'could_occur',
  'likely',
  'very_likely',
  'na'
]);
export type RiskProbabilityLevel = z.infer<typeof RiskProbabilityLevelSchema>;

export const RiskRatingLabelSchema = z.enum([
  'neutral',
  'sustainable',
  'moderate',
  'severe',
  'critical'
]);
export type RiskRatingLabel = z.infer<typeof RiskRatingLabelSchema>;

export const OpportunityRatingLabelSchema = z.enum([
  'neutral',
  'small',
  'reasonable',
  'sustainable',
  'great'
]);
export type OpportunityRatingLabel = z.infer<typeof OpportunityRatingLabelSchema>;

export const EvaluationContextPayloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2).max(120),
  naceDivision: z.string().trim().min(2).max(200),
  offeringType: OfferingTypeSchema,
  launched: z.boolean(),
  currentStage: StartupStageSchema,
  innovationApproach: InnovationApproachSchema
});
export type EvaluationContextPayload = z.infer<typeof EvaluationContextPayloadSchema>;

export const EvaluationIdParamsSchema = z.object({
  id: z.string()
});
export type EvaluationIdParams = z.infer<typeof EvaluationIdParamsSchema>;

export const CreateEvaluationPayloadSchema = EvaluationContextPayloadSchema;
export type CreateEvaluationPayload = z.infer<typeof CreateEvaluationPayloadSchema>;

export const UpdateEvaluationContextPayloadSchema = EvaluationContextPayloadSchema;
export type UpdateEvaluationContextPayload = z.infer<typeof UpdateEvaluationContextPayloadSchema>;

export const Stage1FinancialAnswersPayloadSchema = z.object({
  roiLevel: FinancialRoiLevelSchema,
  sensitivityLevel: FinancialSensitivityLevelSchema,
  uspLevel: FinancialUspLevelSchema,
  marketGrowthLevel: FinancialMarketGrowthLevelSchema
});
export type Stage1FinancialAnswersPayload = z.infer<typeof Stage1FinancialAnswersPayloadSchema>;

export const Stage1TopicAnswerInputSchema = z.object({
  topicCode: TopicCodeSchema,
  applicable: z.boolean(),
  magnitude: ImpactDimensionLevelSchema,
  scale: ImpactDimensionLevelSchema,
  irreversibility: ImpactDimensionLevelSchema,
  likelihood: ImpactLikelihoodLevelSchema,
  evidenceBasis: EvidenceBasisSchema
});
export type Stage1TopicAnswerInput = z.infer<typeof Stage1TopicAnswerInputSchema>;

export const SaveStage1TopicsPayloadSchema = z.object({
  items: z.array(Stage1TopicAnswerInputSchema).length(10)
});
export type SaveStage1TopicsPayload = z.infer<typeof SaveStage1TopicsPayloadSchema>;

export const Stage2RiskAnswerInputSchema = z.object({
  riskCode: RiskCodeSchema,
  applicable: z.boolean(),
  probability: RiskProbabilityLevelSchema,
  impact: ImpactDimensionLevelSchema,
  evidenceBasis: EvidenceBasisSchema
});
export type Stage2RiskAnswerInput = z.infer<typeof Stage2RiskAnswerInputSchema>;

export const SaveStage2RisksPayloadSchema = z.object({
  items: z.array(Stage2RiskAnswerInputSchema).length(6)
});
export type SaveStage2RisksPayload = z.infer<typeof SaveStage2RisksPayloadSchema>;

export const Stage2OpportunityAnswerInputSchema = z.object({
  opportunityCode: OpportunityCodeSchema,
  applicable: z.boolean(),
  likelihood: RiskProbabilityLevelSchema,
  impact: ImpactDimensionLevelSchema,
  evidenceBasis: EvidenceBasisSchema
});
export type Stage2OpportunityAnswerInput = z.infer<typeof Stage2OpportunityAnswerInputSchema>;

export const SaveStage2OpportunitiesPayloadSchema = z.object({
  items: z.array(Stage2OpportunityAnswerInputSchema).length(6)
});
export type SaveStage2OpportunitiesPayload = z.infer<typeof SaveStage2OpportunitiesPayloadSchema>;

export const SdgReferenceSchema = z.object({
  number: z.number().int().min(1).max(17),
  title: z.string(),
  sourceType: SdgSourceTypeSchema,
  url: z.string().url()
});
export type SdgReference = z.infer<typeof SdgReferenceSchema>;

export const StageSdgSummarySchema = z.object({
  currentStage: StartupStageSchema,
  phaseGoal: z.string(),
  phaseConsideration: z.string().nullable(),
  whatToConsider: z.string(),
  stageSdgs: z.array(SdgReferenceSchema),
  businessSdgs: z.array(SdgReferenceSchema),
  mergedSdgs: z.array(SdgReferenceSchema)
});
export type StageSdgSummary = z.infer<typeof StageSdgSummarySchema>;

export const FinancialIndicatorResultSchema = z.object({
  id: z.enum(['roi', 'sensitivity', 'usp', 'market_growth']),
  label: z.string(),
  level: z.string(),
  score: z.number().min(0).max(3),
  recommendation: z.string().nullable()
});
export type FinancialIndicatorResult = z.infer<typeof FinancialIndicatorResultSchema>;

export const Stage1FinancialAnswerSchema = Stage1FinancialAnswersPayloadSchema.extend({
  totalScore: z.number().min(0).max(12),
  items: z.array(FinancialIndicatorResultSchema).length(4)
});
export type Stage1FinancialAnswer = z.infer<typeof Stage1FinancialAnswerSchema>;

export const Stage1TopicAnswerSchema = Stage1TopicAnswerInputSchema.extend({
  title: z.string(),
  question: z.string(),
  impactScore: z.number().min(0).max(4),
  priorityBand: PriorityBandSchema,
  sdgNumbers: z.array(z.number().int().min(1).max(17))
});
export type Stage1TopicAnswer = z.infer<typeof Stage1TopicAnswerSchema>;

export const Stage2RiskAnswerSchema = Stage2RiskAnswerInputSchema.extend({
  group: z.string(),
  title: z.string(),
  question: z.string(),
  ratingLabel: RiskRatingLabelSchema,
  ratingScore: z.number().min(0).max(4),
  sdgNumbers: z.array(z.number().int().min(1).max(17))
});
export type Stage2RiskAnswer = z.infer<typeof Stage2RiskAnswerSchema>;

export const Stage2OpportunityAnswerSchema = Stage2OpportunityAnswerInputSchema.extend({
  group: z.string(),
  title: z.string(),
  question: z.string(),
  ratingLabel: OpportunityRatingLabelSchema,
  ratingScore: z.number().min(0).max(4),
  sdgNumbers: z.array(z.number().int().min(1).max(17))
});
export type Stage2OpportunityAnswer = z.infer<typeof Stage2OpportunityAnswerSchema>;

export const EvaluationListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  naceDivision: z.string(),
  currentStage: StartupStageSchema,
  status: EvaluationStatusSchema,
  currentStep: EvaluationStepSchema,
  financialTotal: z.number().min(0).max(12),
  riskOverall: z.number().min(0),
  opportunityOverall: z.number().min(0),
  confidenceBand: ConfidenceBandSchema,
  createdAt: z.string(),
  updatedAt: z.string()
});
export type EvaluationListItem = z.infer<typeof EvaluationListItemSchema>;

export const EvaluationListResponseSchema = z.object({
  items: z.array(EvaluationListItemSchema)
});
export type EvaluationListResponse = z.infer<typeof EvaluationListResponseSchema>;

export const EvaluationDetailSchema = EvaluationListItemSchema.extend({
  offeringType: OfferingTypeSchema,
  launched: z.boolean(),
  innovationApproach: InnovationApproachSchema,
  initialSummary: StageSdgSummarySchema,
  stage1Financial: Stage1FinancialAnswerSchema.nullable(),
  stage1Topics: z.array(Stage1TopicAnswerSchema),
  stage2Risks: z.array(Stage2RiskAnswerSchema),
  stage2Opportunities: z.array(Stage2OpportunityAnswerSchema)
});
export type EvaluationDetail = z.infer<typeof EvaluationDetailSchema>;

export const MaterialTopicSummarySchema = z.object({
  topicCode: TopicCodeSchema,
  title: z.string(),
  score: z.number().min(0).max(4),
  priorityBand: PriorityBandSchema,
  recommendation: z.string().nullable(),
  sdgNumbers: z.array(z.number().int().min(1).max(17))
});
export type MaterialTopicSummary = z.infer<typeof MaterialTopicSummarySchema>;

export const RecommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string(),
  source: z.enum(['financial', 'stage1', 'risk', 'opportunity']),
  severityBand: z.string()
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

export const ImpactSummaryResponseSchema = z.object({
  relevantTopics: z.array(MaterialTopicSummarySchema),
  highPriorityTopics: z.array(MaterialTopicSummarySchema),
  whatToConsiderNext: z.array(z.string()),
  relevantSdgs: z.array(SdgReferenceSchema)
});
export type ImpactSummaryResponse = z.infer<typeof ImpactSummaryResponseSchema>;

export const SdgAlignmentResponseSchema = z.object({
  items: z.array(SdgReferenceSchema)
});
export type SdgAlignmentResponse = z.infer<typeof SdgAlignmentResponseSchema>;

export const DashboardRiskCardSchema = z.object({
  code: z.string(),
  title: z.string(),
  ratingLabel: z.string(),
  score: z.number(),
  actionWindow: z.string()
});
export type DashboardRiskCard = z.infer<typeof DashboardRiskCardSchema>;

export const SensitivityHintSchema = z.object({
  topicCode: TopicCodeSchema,
  title: z.string(),
  currentBand: PriorityBandSchema,
  projectedBand: PriorityBandSchema,
  message: z.string()
});
export type SensitivityHint = z.infer<typeof SensitivityHintSchema>;

export const DashboardResponseSchema = z.object({
  evaluationId: z.string(),
  financialTotal: z.number().min(0).max(12),
  environmentalTopics: z.array(MaterialTopicSummarySchema),
  socialTopics: z.array(MaterialTopicSummarySchema),
  materialAlerts: z.array(MaterialTopicSummarySchema),
  riskOverall: z.number().min(0),
  opportunityOverall: z.number().min(0),
  topRisks: z.array(DashboardRiskCardSchema),
  topOpportunities: z.array(DashboardRiskCardSchema),
  recommendations: z.array(RecommendationSchema),
  confidenceBand: ConfidenceBandSchema,
  sensitivityHints: z.array(SensitivityHintSchema)
});
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;

export const ReportResponseSchema = z.object({
  evaluation: EvaluationDetailSchema,
  impactSummary: ImpactSummaryResponseSchema,
  sdgAlignment: SdgAlignmentResponseSchema,
  dashboard: DashboardResponseSchema
});
export type ReportResponse = z.infer<typeof ReportResponseSchema>;
