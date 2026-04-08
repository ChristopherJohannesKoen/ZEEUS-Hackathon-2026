import { z } from 'zod';
import { EvidenceBasisSchema, EvaluationStatusSchema, TopicCodeSchema } from './evaluations';

export const OrganizationRoleSchema = z.enum(['owner', 'manager', 'member', 'reviewer']);
export type OrganizationRole = z.infer<typeof OrganizationRoleSchema>;

export const ProgramRoleSchema = z.enum(['manager', 'reviewer', 'member']);
export type ProgramRole = z.infer<typeof ProgramRoleSchema>;

export const ProgramStatusSchema = z.enum(['active', 'draft', 'archived']);
export type ProgramStatus = z.infer<typeof ProgramStatusSchema>;

export const ProgramSubmissionStatusSchema = z.enum([
  'draft',
  'submitted',
  'in_review',
  'changes_requested',
  'approved',
  'archived'
]);
export type ProgramSubmissionStatus = z.infer<typeof ProgramSubmissionStatusSchema>;

export const ReviewAssignmentStatusSchema = z.enum([
  'pending',
  'in_review',
  'changes_requested',
  'approved'
]);
export type ReviewAssignmentStatus = z.infer<typeof ReviewAssignmentStatusSchema>;

export const KnowledgeArticleCategorySchema = z.enum([
  'how_it_works',
  'methodology',
  'sdg_esrs',
  'partner',
  'contact'
]);
export type KnowledgeArticleCategory = z.infer<typeof KnowledgeArticleCategorySchema>;

export const ResourceAssetCategorySchema = z.enum([
  'manual',
  'faq',
  'methodology',
  'sample_report',
  'workflow_asset'
]);
export type ResourceAssetCategory = z.infer<typeof ResourceAssetCategorySchema>;

export const EvidenceAssetKindSchema = z.enum(['file', 'link', 'note']);
export type EvidenceAssetKind = z.infer<typeof EvidenceAssetKindSchema>;

export const ScenarioRunStatusSchema = z.enum(['draft', 'submitted', 'archived']);
export type ScenarioRunStatus = z.infer<typeof ScenarioRunStatusSchema>;

export const OrganizationSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable().default(null),
  websiteUrl: z.string().url().nullable().default(null),
  role: OrganizationRoleSchema,
  memberCount: z.number().int().min(0),
  programCount: z.number().int().min(0),
  createdAt: z.string()
});
export type OrganizationSummary = z.infer<typeof OrganizationSummarySchema>;

export const OrganizationMemberSummarySchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: OrganizationRoleSchema,
  joinedAt: z.string()
});
export type OrganizationMemberSummary = z.infer<typeof OrganizationMemberSummarySchema>;

export const ProgramBrandingSchema = z.object({
  primaryLabel: z.string(),
  partnerLabel: z.string().nullable().default(null),
  coBrandingLabel: z.string().nullable().default(null),
  watermarkLabel: z.string().nullable().default(null)
});
export type ProgramBranding = z.infer<typeof ProgramBrandingSchema>;

export const ProgramSummarySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  slug: z.string(),
  name: z.string(),
  summary: z.string(),
  cohortLabel: z.string(),
  status: ProgramStatusSchema,
  role: ProgramRoleSchema.nullable().default(null),
  submissionCount: z.number().int().min(0),
  reviewerCount: z.number().int().min(0),
  branding: ProgramBrandingSchema.nullable().default(null),
  createdAt: z.string()
});
export type ProgramSummary = z.infer<typeof ProgramSummarySchema>;

export const ProgramMemberSummarySchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: ProgramRoleSchema,
  joinedAt: z.string()
});
export type ProgramMemberSummary = z.infer<typeof ProgramMemberSummarySchema>;

export const ProgramSubmissionSummarySchema = z.object({
  id: z.string(),
  evaluationId: z.string(),
  evaluationName: z.string(),
  startupName: z.string(),
  revisionNumber: z.number().int().min(1),
  submissionStatus: ProgramSubmissionStatusSchema,
  evaluationStatus: EvaluationStatusSchema,
  submittedAt: z.string().nullable().default(null),
  lastReviewedAt: z.string().nullable().default(null)
});
export type ProgramSubmissionSummary = z.infer<typeof ProgramSubmissionSummarySchema>;

export const ProgramEvaluationCandidateSchema = z.object({
  evaluationId: z.string(),
  name: z.string(),
  status: EvaluationStatusSchema,
  currentRevisionNumber: z.number().int().min(0),
  updatedAt: z.string()
});
export type ProgramEvaluationCandidate = z.infer<typeof ProgramEvaluationCandidateSchema>;

export const ReviewAssignmentSummarySchema = z.object({
  id: z.string(),
  submissionId: z.string(),
  reviewerUserId: z.string(),
  reviewerName: z.string(),
  status: ReviewAssignmentStatusSchema,
  dueAt: z.string().nullable().default(null),
  decidedAt: z.string().nullable().default(null)
});
export type ReviewAssignmentSummary = z.infer<typeof ReviewAssignmentSummarySchema>;

export const ReviewCommentSummarySchema = z.object({
  id: z.string(),
  submissionId: z.string(),
  authorUserId: z.string(),
  authorName: z.string(),
  body: z.string(),
  createdAt: z.string()
});
export type ReviewCommentSummary = z.infer<typeof ReviewCommentSummarySchema>;

export const OrganizationDetailSchema = OrganizationSummarySchema.extend({
  members: z.array(OrganizationMemberSummarySchema),
  programs: z.array(ProgramSummarySchema)
});
export type OrganizationDetail = z.infer<typeof OrganizationDetailSchema>;

export const ProgramDetailSchema = ProgramSummarySchema.extend({
  description: z.string(),
  publicBlurb: z.string().nullable().default(null),
  members: z.array(ProgramMemberSummarySchema),
  submissions: z.array(ProgramSubmissionSummarySchema),
  reviewAssignments: z.array(ReviewAssignmentSummarySchema),
  reviewComments: z.array(ReviewCommentSummarySchema),
  availableEvaluations: z.array(ProgramEvaluationCandidateSchema)
});
export type ProgramDetail = z.infer<typeof ProgramDetailSchema>;

export const OrganizationListResponseSchema = z.object({
  items: z.array(OrganizationSummarySchema)
});
export type OrganizationListResponse = z.infer<typeof OrganizationListResponseSchema>;

export const ProgramListResponseSchema = z.object({
  items: z.array(ProgramSummarySchema)
});
export type ProgramListResponse = z.infer<typeof ProgramListResponseSchema>;

export const OrganizationParamsSchema = z.object({
  organizationId: z.string()
});
export type OrganizationParams = z.infer<typeof OrganizationParamsSchema>;

export const ProgramParamsSchema = z.object({
  programId: z.string()
});
export type ProgramParams = z.infer<typeof ProgramParamsSchema>;

export const KnowledgeArticleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  body: z.string(),
  category: KnowledgeArticleCategorySchema,
  updatedAt: z.string()
});
export type KnowledgeArticle = z.infer<typeof KnowledgeArticleSchema>;

export const FaqEntrySchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  category: z.string(),
  sortOrder: z.number().int().min(0)
});
export type FaqEntry = z.infer<typeof FaqEntrySchema>;

export const CaseStudySchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  startupName: z.string(),
  summary: z.string(),
  story: z.string(),
  stage: z.string(),
  naceDivision: z.string()
});
export type CaseStudy = z.infer<typeof CaseStudySchema>;

export const ResourceAssetSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: ResourceAssetCategorySchema,
  href: z.string(),
  fileLabel: z.string()
});
export type ResourceAsset = z.infer<typeof ResourceAssetSchema>;

export const PublicSiteContentSchema = z.object({
  articles: z.array(KnowledgeArticleSchema),
  faqEntries: z.array(FaqEntrySchema),
  caseStudies: z.array(CaseStudySchema),
  resources: z.array(ResourceAssetSchema),
  partnerPrograms: z.array(ProgramSummarySchema)
});
export type PublicSiteContent = z.infer<typeof PublicSiteContentSchema>;

export const SdgTargetSchema = z.object({
  id: z.string(),
  goalNumber: z.number().int().min(1).max(17),
  goalTitle: z.string(),
  targetCode: z.string(),
  title: z.string(),
  description: z.string(),
  officialUrl: z.string().url()
});
export type SdgTarget = z.infer<typeof SdgTargetSchema>;

export const SdgGoalParamsSchema = z.object({
  goalNumber: z.coerce.number().int().min(1).max(17)
});
export type SdgGoalParams = z.infer<typeof SdgGoalParamsSchema>;

export const SdgGoalDetailSchema = z.object({
  goalNumber: z.number().int().min(1).max(17),
  goalTitle: z.string(),
  summary: z.string(),
  officialUrl: z.string().url(),
  targets: z.array(SdgTargetSchema)
});
export type SdgGoalDetail = z.infer<typeof SdgGoalDetailSchema>;

export const EvidenceAssetSummarySchema = z.object({
  id: z.string(),
  evaluationId: z.string(),
  revisionId: z.string().nullable().default(null),
  scenarioId: z.string().nullable().default(null),
  kind: EvidenceAssetKindSchema,
  title: z.string(),
  description: z.string().nullable().default(null),
  sourceUrl: z.string().url().nullable().default(null),
  ownerName: z.string().nullable().default(null),
  sourceDate: z.string().nullable().default(null),
  evidenceBasis: EvidenceBasisSchema,
  confidenceWeight: z.number().min(0).max(1).nullable().default(null),
  linkedTopicCode: TopicCodeSchema.nullable().default(null),
  linkedRecommendationId: z.string().nullable().default(null),
  fileName: z.string().nullable().default(null),
  mimeType: z.string().nullable().default(null),
  byteSize: z.number().int().nonnegative().nullable().default(null),
  hasBinary: z.boolean().default(false),
  createdAt: z.string()
});
export type EvidenceAssetSummary = z.infer<typeof EvidenceAssetSummarySchema>;

export const EvidenceAssetListResponseSchema = z.object({
  items: z.array(EvidenceAssetSummarySchema)
});
export type EvidenceAssetListResponse = z.infer<typeof EvidenceAssetListResponseSchema>;

export const CreateEvidenceAssetPayloadSchema = z.object({
  kind: EvidenceAssetKindSchema,
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
  ownerName: z.string().trim().max(120).optional().nullable(),
  sourceDate: z.string().optional().nullable(),
  evidenceBasis: EvidenceBasisSchema,
  confidenceWeight: z.number().min(0).max(1).optional().nullable(),
  linkedTopicCode: TopicCodeSchema.optional().nullable(),
  linkedRecommendationId: z.string().trim().max(120).optional().nullable()
});
export type CreateEvidenceAssetPayload = z.infer<typeof CreateEvidenceAssetPayloadSchema>;

export const EvidenceAssetParamsSchema = z.object({
  id: z.string(),
  evidenceId: z.string()
});
export type EvidenceAssetParams = z.infer<typeof EvidenceAssetParamsSchema>;

export const CreateProgramSubmissionPayloadSchema = z.object({
  evaluationId: z.string(),
  revisionNumber: z.number().int().min(1).optional().nullable()
});
export type CreateProgramSubmissionPayload = z.infer<typeof CreateProgramSubmissionPayloadSchema>;

export const ProgramSubmissionParamsSchema = z.object({
  programId: z.string(),
  submissionId: z.string()
});
export type ProgramSubmissionParams = z.infer<typeof ProgramSubmissionParamsSchema>;

export const UpdateProgramSubmissionStatusPayloadSchema = z.object({
  status: ProgramSubmissionStatusSchema
});
export type UpdateProgramSubmissionStatusPayload = z.infer<
  typeof UpdateProgramSubmissionStatusPayloadSchema
>;

export const CreateReviewAssignmentPayloadSchema = z.object({
  reviewerUserId: z.string(),
  dueAt: z.string().optional().nullable()
});
export type CreateReviewAssignmentPayload = z.infer<typeof CreateReviewAssignmentPayloadSchema>;

export const CreateReviewCommentPayloadSchema = z.object({
  body: z.string().trim().min(2).max(4000)
});
export type CreateReviewCommentPayload = z.infer<typeof CreateReviewCommentPayloadSchema>;

export const ScenarioRunSummarySchema = z.object({
  id: z.string(),
  evaluationId: z.string(),
  baseRevisionId: z.string().nullable().default(null),
  baseRevisionNumber: z.number().int().min(1).nullable().default(null),
  name: z.string(),
  status: ScenarioRunStatusSchema,
  focusArea: z.string(),
  geography: z.string().nullable().default(null),
  dependency: z.string().nullable().default(null),
  timeframe: z.string().nullable().default(null),
  hypothesis: z.string(),
  advisorySummary: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type ScenarioRunSummary = z.infer<typeof ScenarioRunSummarySchema>;

export const ScenarioRunListResponseSchema = z.object({
  items: z.array(ScenarioRunSummarySchema)
});
export type ScenarioRunListResponse = z.infer<typeof ScenarioRunListResponseSchema>;

export const CreateScenarioRunPayloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  focusArea: z.string().trim().min(2).max(120),
  geography: z.string().trim().max(120).optional().nullable(),
  dependency: z.string().trim().max(120).optional().nullable(),
  timeframe: z.string().trim().max(120).optional().nullable(),
  hypothesis: z.string().trim().min(8).max(2000)
});
export type CreateScenarioRunPayload = z.infer<typeof CreateScenarioRunPayloadSchema>;
