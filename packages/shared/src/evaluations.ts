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

export const EvaluationStatusSchema = z.enum(['draft', 'in_progress', 'completed', 'archived']);
export type EvaluationStatus = z.infer<typeof EvaluationStatusSchema>;

export const EvaluationLifecycleStatusSchema = EvaluationStatusSchema;
export type EvaluationLifecycleStatus = z.infer<typeof EvaluationLifecycleStatusSchema>;

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

export const RecommendationActionStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'completed',
  'dismissed'
]);
export type RecommendationActionStatus = z.infer<typeof RecommendationActionStatusSchema>;

export const EvaluationArtifactKindSchema = z.enum(['csv', 'pdf', 'ai_explanation']);
export type EvaluationArtifactKind = z.infer<typeof EvaluationArtifactKindSchema>;

export const EvaluationArtifactStatusSchema = z.enum(['pending', 'processing', 'ready', 'failed']);
export type EvaluationArtifactStatus = z.infer<typeof EvaluationArtifactStatusSchema>;

export const ExportArtifactKindSchema = z.enum(['csv', 'pdf']);
export type ExportArtifactKind = z.infer<typeof ExportArtifactKindSchema>;

export const EvaluationNarrativeKindSchema = z.enum([
  'executive_summary',
  'material_topics',
  'risks_opportunities',
  'evidence_guidance'
]);
export type EvaluationNarrativeKind = z.infer<typeof EvaluationNarrativeKindSchema>;

export const EvaluationNarrativeStatusSchema = z.enum(['pending', 'processing', 'ready', 'failed']);
export type EvaluationNarrativeStatus = z.infer<typeof EvaluationNarrativeStatusSchema>;

export const ScoringVersionInfoSchema = z.object({
  scoringVersion: z.string().min(1),
  catalogVersion: z.string().min(1)
});
export type ScoringVersionInfo = z.infer<typeof ScoringVersionInfoSchema>;

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
  evidenceBasis: EvidenceBasisSchema,
  evidenceNote: z.string().trim().max(500).optional().nullable()
});
export type Stage1TopicAnswerInput = z.infer<typeof Stage1TopicAnswerInputSchema>;

export const SaveStage1TopicsPayloadSchema = z.object({
  items: z.array(Stage1TopicAnswerInputSchema).length(10)
});
export type SaveStage1TopicsPayload = z.infer<typeof SaveStage1TopicsPayloadSchema>;

export const SaveStage1PayloadSchema = z.object({
  financial: Stage1FinancialAnswersPayloadSchema,
  topics: z.array(Stage1TopicAnswerInputSchema).length(10)
});
export type SaveStage1Payload = z.infer<typeof SaveStage1PayloadSchema>;

export const Stage2RiskAnswerInputSchema = z.object({
  riskCode: RiskCodeSchema,
  applicable: z.boolean(),
  probability: RiskProbabilityLevelSchema,
  impact: ImpactDimensionLevelSchema,
  evidenceBasis: EvidenceBasisSchema,
  evidenceNote: z.string().trim().max(500).optional().nullable()
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
  evidenceBasis: EvidenceBasisSchema,
  evidenceNote: z.string().trim().max(500).optional().nullable()
});
export type Stage2OpportunityAnswerInput = z.infer<typeof Stage2OpportunityAnswerInputSchema>;

export const SaveStage2OpportunitiesPayloadSchema = z.object({
  items: z.array(Stage2OpportunityAnswerInputSchema).length(6)
});
export type SaveStage2OpportunitiesPayload = z.infer<typeof SaveStage2OpportunitiesPayloadSchema>;

export const SaveStage2PayloadSchema = z.object({
  risks: z.array(Stage2RiskAnswerInputSchema).length(6),
  opportunities: z.array(Stage2OpportunityAnswerInputSchema).length(6)
});
export type SaveStage2Payload = z.infer<typeof SaveStage2PayloadSchema>;

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

export const EvaluationArtifactSummarySchema = z.object({
  id: z.string(),
  evaluationId: z.string(),
  revisionId: z.string().nullable().default(null),
  revisionNumber: z.number().int().min(1).nullable().default(null),
  kind: EvaluationArtifactKindSchema,
  status: EvaluationArtifactStatusSchema,
  filename: z.string(),
  mimeType: z.string(),
  byteSize: z.number().int().nonnegative(),
  checksumSha256: z.string().nullable().default(null),
  requestedAt: z.string(),
  readyAt: z.string().nullable().default(null),
  failedAt: z.string().nullable().default(null),
  errorMessage: z.string().nullable().default(null),
  createdAt: z.string()
});
export type EvaluationArtifactSummary = z.infer<typeof EvaluationArtifactSummarySchema>;

export const EvaluationArtifactListResponseSchema = z.object({
  items: z.array(EvaluationArtifactSummarySchema)
});
export type EvaluationArtifactListResponse = z.infer<typeof EvaluationArtifactListResponseSchema>;

export const EvaluationArtifactParamsSchema = z.object({
  id: z.string(),
  artifactId: z.string()
});
export type EvaluationArtifactParams = z.infer<typeof EvaluationArtifactParamsSchema>;

export const CreateEvaluationArtifactPayloadSchema = z.object({
  kind: ExportArtifactKindSchema
});
export type CreateEvaluationArtifactPayload = z.infer<typeof CreateEvaluationArtifactPayloadSchema>;

export const EvaluationNarrativeSummarySchema = z.object({
  id: z.string(),
  evaluationId: z.string(),
  revisionId: z.string().nullable().default(null),
  revisionNumber: z.number().int().min(1).nullable().default(null),
  kind: EvaluationNarrativeKindSchema,
  status: EvaluationNarrativeStatusSchema,
  provider: z.string().nullable().default(null),
  model: z.string().nullable().default(null),
  promptVersion: z.string().nullable().default(null),
  inputTokens: z.number().int().nonnegative().nullable().default(null),
  outputTokens: z.number().int().nonnegative().nullable().default(null),
  estimatedCostUsd: z.number().nonnegative().nullable().default(null),
  content: z.string().nullable().default(null),
  requestedAt: z.string(),
  readyAt: z.string().nullable().default(null),
  failedAt: z.string().nullable().default(null),
  errorMessage: z.string().nullable().default(null),
  createdAt: z.string()
});
export type EvaluationNarrativeSummary = z.infer<typeof EvaluationNarrativeSummarySchema>;

export const EvaluationNarrativeListResponseSchema = z.object({
  items: z.array(EvaluationNarrativeSummarySchema)
});
export type EvaluationNarrativeListResponse = z.infer<typeof EvaluationNarrativeListResponseSchema>;

export const CreateEvaluationNarrativePayloadSchema = z.object({
  kind: EvaluationNarrativeKindSchema
});
export type CreateEvaluationNarrativePayload = z.infer<
  typeof CreateEvaluationNarrativePayloadSchema
>;

export const EvaluationRecommendationActionStateSchema = z.object({
  recommendationId: z.string(),
  status: RecommendationActionStatusSchema,
  ownerNote: z.string().nullable().default(null),
  updatedAt: z.string()
});
export type EvaluationRecommendationActionState = z.infer<
  typeof EvaluationRecommendationActionStateSchema
>;

export const UpdateRecommendationActionPayloadSchema = z.object({
  status: RecommendationActionStatusSchema,
  ownerNote: z.string().trim().max(1000).nullable().optional()
});
export type UpdateRecommendationActionPayload = z.infer<
  typeof UpdateRecommendationActionPayloadSchema
>;

export const EvaluationRecommendationActionParamsSchema = z.object({
  id: z.string(),
  revisionNumber: z.coerce.number().int().min(1),
  recommendationId: z.string()
});
export type EvaluationRecommendationActionParams = z.infer<
  typeof EvaluationRecommendationActionParamsSchema
>;

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
  currentRevisionNumber: z.number().int().min(0),
  scoringVersionInfo: ScoringVersionInfoSchema,
  lastScoredAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  archivedAt: z.string().nullable(),
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
  stage2Opportunities: z.array(Stage2OpportunityAnswerSchema),
  artifacts: z.array(EvaluationArtifactSummarySchema)
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
  evidenceToCollect: z.string().nullable().default(null),
  source: z.enum(['financial', 'stage1', 'risk', 'opportunity']),
  severityBand: z.string(),
  action: EvaluationRecommendationActionStateSchema.nullable().default(null)
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

export const EvaluationRevisionSummarySchema = z.object({
  id: z.string(),
  evaluationId: z.string(),
  revisionNumber: z.number().int().min(1),
  status: EvaluationStatusSchema,
  currentStep: EvaluationStepSchema,
  scoringVersionInfo: ScoringVersionInfoSchema,
  createdAt: z.string()
});
export type EvaluationRevisionSummary = z.infer<typeof EvaluationRevisionSummarySchema>;

export const EvaluationRevisionListResponseSchema = z.object({
  items: z.array(EvaluationRevisionSummarySchema)
});
export type EvaluationRevisionListResponse = z.infer<typeof EvaluationRevisionListResponseSchema>;

export const EvaluationRevisionParamsSchema = z.object({
  id: z.string(),
  revisionNumber: z.coerce.number().int().min(1)
});
export type EvaluationRevisionParams = z.infer<typeof EvaluationRevisionParamsSchema>;

export const EvaluationRevisionDetailSchema = EvaluationRevisionSummarySchema.extend({
  report: ReportResponseSchema
});
export type EvaluationRevisionDetail = z.infer<typeof EvaluationRevisionDetailSchema>;

export const EvaluationRevisionCompareQuerySchema = z.object({
  left: z.coerce.number().int().min(1),
  right: z.coerce.number().int().min(1)
});
export type EvaluationRevisionCompareQuery = z.infer<typeof EvaluationRevisionCompareQuerySchema>;

export const EvaluationCompareFieldChangeSchema = z.object({
  field: z.string(),
  label: z.string(),
  leftValue: z.string().nullable(),
  rightValue: z.string().nullable()
});
export type EvaluationCompareFieldChange = z.infer<typeof EvaluationCompareFieldChangeSchema>;

export const EvaluationCompareMetricSchema = z.object({
  field: z.string(),
  label: z.string(),
  leftValue: z.number().nullable(),
  rightValue: z.number().nullable(),
  delta: z.number().nullable()
});
export type EvaluationCompareMetric = z.infer<typeof EvaluationCompareMetricSchema>;

export const EvaluationCompareTopicChangeSchema = z.object({
  code: z.string(),
  title: z.string(),
  leftBand: z.string().nullable(),
  rightBand: z.string().nullable(),
  leftScore: z.number().nullable(),
  rightScore: z.number().nullable()
});
export type EvaluationCompareTopicChange = z.infer<typeof EvaluationCompareTopicChangeSchema>;

export const EvaluationCompareRatedItemChangeSchema = z.object({
  code: z.string(),
  title: z.string(),
  leftLabel: z.string().nullable(),
  rightLabel: z.string().nullable(),
  leftScore: z.number().nullable(),
  rightScore: z.number().nullable()
});
export type EvaluationCompareRatedItemChange = z.infer<
  typeof EvaluationCompareRatedItemChangeSchema
>;

export const EvaluationCompareRecommendationChangeSchema = z.object({
  recommendationId: z.string(),
  title: z.string(),
  source: z.enum(['financial', 'stage1', 'risk', 'opportunity']),
  severityBand: z.string(),
  leftPresent: z.boolean(),
  rightPresent: z.boolean(),
  leftStatus: RecommendationActionStatusSchema.nullable(),
  rightStatus: RecommendationActionStatusSchema.nullable()
});
export type EvaluationCompareRecommendationChange = z.infer<
  typeof EvaluationCompareRecommendationChangeSchema
>;

export const EvaluationRevisionCompareResponseSchema = z.object({
  evaluationId: z.string(),
  leftRevision: EvaluationRevisionSummarySchema,
  rightRevision: EvaluationRevisionSummarySchema,
  contextChanges: z.array(EvaluationCompareFieldChangeSchema),
  metricChanges: z.array(EvaluationCompareMetricSchema),
  topicChanges: z.array(EvaluationCompareTopicChangeSchema),
  riskChanges: z.array(EvaluationCompareRatedItemChangeSchema),
  opportunityChanges: z.array(EvaluationCompareRatedItemChangeSchema),
  recommendationChanges: z.array(EvaluationCompareRecommendationChangeSchema)
});
export type EvaluationRevisionCompareResponse = z.infer<
  typeof EvaluationRevisionCompareResponseSchema
>;

export const EvaluationBenchmarkQuerySchema = z.object({
  revisionNumber: z.coerce.number().int().min(1).optional()
});
export type EvaluationBenchmarkQuery = z.infer<typeof EvaluationBenchmarkQuerySchema>;

export const EvaluationBenchmarkMetricSchema = z.object({
  label: z.string(),
  current: z.number(),
  previous: z.number().nullable().default(null),
  best: z.number().nullable().default(null),
  reference: z.number().nullable().default(null),
  deltaFromPrevious: z.number().nullable().default(null),
  deltaFromReference: z.number().nullable().default(null)
});
export type EvaluationBenchmarkMetric = z.infer<typeof EvaluationBenchmarkMetricSchema>;

export const EvaluationBenchmarkTopicShiftSchema = z.object({
  topicCode: TopicCodeSchema,
  title: z.string(),
  currentBand: PriorityBandSchema,
  previousBand: PriorityBandSchema.nullable().default(null),
  referenceBand: PriorityBandSchema.nullable().default(null)
});
export type EvaluationBenchmarkTopicShift = z.infer<typeof EvaluationBenchmarkTopicShiftSchema>;

export const EvaluationBenchmarkSummarySchema = z.object({
  evaluationId: z.string(),
  revisionNumber: z.number().int().min(1),
  referenceProfile: z.object({
    stage: StartupStageSchema,
    naceDivision: z.string(),
    label: z.string()
  }),
  metrics: z.array(EvaluationBenchmarkMetricSchema),
  topicShifts: z.array(EvaluationBenchmarkTopicShiftSchema),
  takeaways: z.array(z.string())
});
export type EvaluationBenchmarkSummary = z.infer<typeof EvaluationBenchmarkSummarySchema>;
