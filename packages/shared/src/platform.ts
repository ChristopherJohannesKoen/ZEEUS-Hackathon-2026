import { z } from 'zod';
import {
  ConfidenceBandSchema,
  EvidenceBasisSchema,
  EvaluationStatusSchema,
  OpportunityCodeSchema,
  PriorityBandSchema,
  RiskCodeSchema,
  ScoreInterpretationGuideSchema,
  StartupStageSchema,
  TopicCodeSchema
} from './evaluations';

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

export const ContentStatusSchema = z.enum(['draft', 'published', 'archived']);
export type ContentStatus = z.infer<typeof ContentStatusSchema>;

export const LocaleCodeSchema = z.string().trim().min(2).max(12).default('en');
export type LocaleCode = z.infer<typeof LocaleCodeSchema>;

export const PartnerLeadStatusSchema = z.enum([
  'new',
  'reviewing',
  'contacted',
  'qualified',
  'archived'
]);
export type PartnerLeadStatus = z.infer<typeof PartnerLeadStatusSchema>;

export const ContentEntityTypeSchema = z.enum([
  'site_page',
  'site_setting',
  'knowledge_article',
  'faq_entry',
  'case_study',
  'resource_asset',
  'media_asset'
]);
export type ContentEntityType = z.infer<typeof ContentEntityTypeSchema>;

export const SitePageTypeSchema = z.enum([
  'landing',
  'institutional',
  'methodology',
  'support',
  'legal',
  'resource_hub'
]);
export type SitePageType = z.infer<typeof SitePageTypeSchema>;

export const SiteSectionKindSchema = z.enum([
  'rich_text',
  'feature_grid',
  'step_grid',
  'faq_list',
  'audience_list',
  'logo_strip',
  'cta',
  'quote'
]);
export type SiteSectionKind = z.infer<typeof SiteSectionKindSchema>;

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

export const EvidenceReviewStateSchema = z.enum([
  'draft',
  'review_requested',
  'validated',
  'needs_update'
]);
export type EvidenceReviewState = z.infer<typeof EvidenceReviewStateSchema>;

export const ScenarioRunStatusSchema = z.enum(['draft', 'submitted', 'archived']);
export type ScenarioRunStatus = z.infer<typeof ScenarioRunStatusSchema>;

export const ScenarioConfidenceShiftSchema = z.enum(['down', 'same', 'up']);
export type ScenarioConfidenceShift = z.infer<typeof ScenarioConfidenceShiftSchema>;

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

export const ProgramEvaluationContextSchema = z.object({
  country: z.string().nullable().default(null),
  currentStage: StartupStageSchema,
  businessCategoryMain: z.string().nullable().default(null),
  businessCategorySubcategory: z.string().nullable().default(null),
  extendedNaceCode: z.string().nullable().default(null),
  extendedNaceLabel: z.string().nullable().default(null),
  naceDivision: z.string()
});
export type ProgramEvaluationContext = z.infer<typeof ProgramEvaluationContextSchema>;

export const ProgramDeterministicSummarySchema = z.object({
  financialTotal: z.number().nullable().default(null),
  riskOverall: z.number().nullable().default(null),
  opportunityOverall: z.number().nullable().default(null),
  confidenceBand: ConfidenceBandSchema.nullable().default(null)
});
export type ProgramDeterministicSummary = z.infer<typeof ProgramDeterministicSummarySchema>;

export const ProgramMaterialTopicPreviewSchema = z.object({
  topicCode: TopicCodeSchema,
  title: z.string(),
  score: z.number(),
  priorityBand: PriorityBandSchema,
  recommendation: z.string().nullable().default(null)
});
export type ProgramMaterialTopicPreview = z.infer<typeof ProgramMaterialTopicPreviewSchema>;

export const ProgramRecommendationPreviewSchema = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string(),
  source: z.string(),
  severityBand: z.string(),
  rationale: z.string().nullable().default(null)
});
export type ProgramRecommendationPreview = z.infer<typeof ProgramRecommendationPreviewSchema>;

export const ProgramReviewChecklistItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  completed: z.boolean(),
  detail: z.string().nullable().default(null)
});
export type ProgramReviewChecklistItem = z.infer<typeof ProgramReviewChecklistItemSchema>;

export const ProgramSubmissionSummarySchema = z.object({
  id: z.string(),
  evaluationId: z.string(),
  evaluationName: z.string(),
  startupName: z.string(),
  revisionNumber: z.number().int().min(1),
  submissionStatus: ProgramSubmissionStatusSchema,
  evaluationStatus: EvaluationStatusSchema,
  context: ProgramEvaluationContextSchema,
  deterministicSummary: ProgramDeterministicSummarySchema,
  scoreInterpretation: ScoreInterpretationGuideSchema.nullable().default(null),
  topMaterialTopics: z.array(ProgramMaterialTopicPreviewSchema).default([]),
  recommendationsPreview: z.array(ProgramRecommendationPreviewSchema).default([]),
  reviewChecklist: z.array(ProgramReviewChecklistItemSchema).default([]),
  openAssignmentCount: z.number().int().min(0).default(0),
  overdueAssignmentCount: z.number().int().min(0).default(0),
  latestDecisionRationale: z.string().nullable().default(null),
  reportSnapshotHref: z.string().nullable().default(null),
  submittedAt: z.string().nullable().default(null),
  lastReviewedAt: z.string().nullable().default(null)
});
export type ProgramSubmissionSummary = z.infer<typeof ProgramSubmissionSummarySchema>;

export const ProgramEvaluationCandidateSchema = z.object({
  evaluationId: z.string(),
  name: z.string(),
  status: EvaluationStatusSchema,
  currentRevisionNumber: z.number().int().min(0),
  context: ProgramEvaluationContextSchema,
  deterministicSummary: ProgramDeterministicSummarySchema,
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
  decidedAt: z.string().nullable().default(null),
  isOverdue: z.boolean().default(false)
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

export const ProgramStatusBreakdownItemSchema = z.object({
  status: ProgramSubmissionStatusSchema,
  count: z.number().int().min(0)
});
export type ProgramStatusBreakdownItem = z.infer<typeof ProgramStatusBreakdownItemSchema>;

export const ProgramConfidenceBreakdownItemSchema = z.object({
  band: ConfidenceBandSchema,
  count: z.number().int().min(0)
});
export type ProgramConfidenceBreakdownItem = z.infer<typeof ProgramConfidenceBreakdownItemSchema>;

export const ProgramRecurringTopicSchema = z.object({
  topicCode: TopicCodeSchema,
  title: z.string(),
  appearances: z.number().int().min(0),
  highPriorityCount: z.number().int().min(0),
  relevantCount: z.number().int().min(0),
  averageScore: z.number().min(0).max(4)
});
export type ProgramRecurringTopic = z.infer<typeof ProgramRecurringTopicSchema>;

export const ProgramRecommendationPatternSchema = z.object({
  title: z.string(),
  source: z.string(),
  severityBand: z.string(),
  appearances: z.number().int().min(0)
});
export type ProgramRecommendationPattern = z.infer<typeof ProgramRecommendationPatternSchema>;

export const ProgramReviewerWorkloadSchema = z.object({
  reviewerUserId: z.string(),
  reviewerName: z.string(),
  pendingCount: z.number().int().min(0),
  inReviewCount: z.number().int().min(0),
  changesRequestedCount: z.number().int().min(0),
  approvedCount: z.number().int().min(0),
  overdueCount: z.number().int().min(0)
});
export type ProgramReviewerWorkload = z.infer<typeof ProgramReviewerWorkloadSchema>;

export const ProgramCohortSummarySchema = z.object({
  submissionFunnel: z.array(ProgramStatusBreakdownItemSchema).default([]),
  confidenceDistribution: z.array(ProgramConfidenceBreakdownItemSchema).default([]),
  averageFinancialTotal: z.number().nullable().default(null),
  averageRiskOverall: z.number().nullable().default(null),
  averageOpportunityOverall: z.number().nullable().default(null),
  recurringTopics: z.array(ProgramRecurringTopicSchema).default([]),
  recommendationPatterns: z.array(ProgramRecommendationPatternSchema).default([])
});
export type ProgramCohortSummary = z.infer<typeof ProgramCohortSummarySchema>;

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
  availableEvaluations: z.array(ProgramEvaluationCandidateSchema),
  cohortSummary: ProgramCohortSummarySchema,
  reviewerWorkloads: z.array(ProgramReviewerWorkloadSchema)
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
  status: ContentStatusSchema,
  locale: LocaleCodeSchema,
  heroImageUrl: z.string().url().nullable().default(null),
  updatedAt: z.string()
});
export type KnowledgeArticle = z.infer<typeof KnowledgeArticleSchema>;

export const FaqEntrySchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  category: z.string(),
  status: ContentStatusSchema,
  locale: LocaleCodeSchema,
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
  naceDivision: z.string(),
  status: ContentStatusSchema,
  locale: LocaleCodeSchema,
  heroImageUrl: z.string().url().nullable().default(null),
  updatedAt: z.string()
});
export type CaseStudy = z.infer<typeof CaseStudySchema>;

export const PublicResourceAssetSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  category: ResourceAssetCategorySchema,
  href: z.string(),
  fileLabel: z.string(),
  fileName: z.string().nullable().default(null),
  mimeType: z.string().nullable().default(null),
  byteSize: z.number().int().nonnegative().nullable().default(null),
  updatedAt: z.string()
});
export type PublicResourceAsset = z.infer<typeof PublicResourceAssetSchema>;

export const ResourceAssetSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  category: ResourceAssetCategorySchema,
  fileLabel: z.string(),
  status: ContentStatusSchema,
  locale: LocaleCodeSchema,
  externalUrl: z.string().url().nullable().default(null),
  fileName: z.string().nullable().default(null),
  mimeType: z.string().nullable().default(null),
  byteSize: z.number().int().nonnegative().nullable().default(null),
  hasBinary: z.boolean().default(false),
  sortOrder: z.number().int().min(0),
  updatedAt: z.string()
});
export type ResourceAssetSummary = z.infer<typeof ResourceAssetSummarySchema>;

export const SiteNavigationItemSchema = z.object({
  label: z.string(),
  href: z.string(),
  group: z.string().nullable().default(null)
});
export type SiteNavigationItem = z.infer<typeof SiteNavigationItemSchema>;

export const SiteFooterColumnSchema = z.object({
  title: z.string(),
  links: z.array(SiteNavigationItemSchema)
});
export type SiteFooterColumn = z.infer<typeof SiteFooterColumnSchema>;

export const SitePageSectionItemSchema = z.object({
  title: z.string(),
  description: z.string().nullable().default(null),
  label: z.string().nullable().default(null),
  href: z.string().nullable().default(null),
  eyebrow: z.string().nullable().default(null),
  value: z.string().nullable().default(null),
  microcopy: z.string().nullable().default(null)
});
export type SitePageSectionItem = z.infer<typeof SitePageSectionItemSchema>;

export const SitePageSectionSchema = z.object({
  id: z.string(),
  kind: SiteSectionKindSchema,
  eyebrow: z.string().nullable().default(null),
  title: z.string().nullable().default(null),
  body: z.string().nullable().default(null),
  quote: z.string().nullable().default(null),
  ctaLabel: z.string().nullable().default(null),
  ctaHref: z.string().nullable().default(null),
  items: z.array(SitePageSectionItemSchema).default([])
});
export type SitePageSection = z.infer<typeof SitePageSectionSchema>;

export const MediaAssetSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  altText: z.string(),
  caption: z.string().nullable().default(null),
  attribution: z.string().nullable().default(null),
  rights: z.string().nullable().default(null),
  mimeType: z.string(),
  fileName: z.string(),
  byteSize: z.number().int().nonnegative(),
  width: z.number().int().positive().nullable().default(null),
  height: z.number().int().positive().nullable().default(null),
  focalPointX: z.number().min(0).max(1).nullable().default(null),
  focalPointY: z.number().min(0).max(1).nullable().default(null),
  storageKey: z.string().nullable().default(null),
  publicUrl: z.string().nullable().default(null),
  locale: LocaleCodeSchema,
  status: ContentStatusSchema,
  updatedAt: z.string()
});
export type MediaAsset = z.infer<typeof MediaAssetSchema>;

export const SitePageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  locale: LocaleCodeSchema,
  title: z.string(),
  summary: z.string(),
  pageType: SitePageTypeSchema,
  status: ContentStatusSchema,
  heroEyebrow: z.string().nullable().default(null),
  heroTitle: z.string().nullable().default(null),
  heroBody: z.string().nullable().default(null),
  heroPrimaryCtaLabel: z.string().nullable().default(null),
  heroPrimaryCtaHref: z.string().nullable().default(null),
  heroSecondaryCtaLabel: z.string().nullable().default(null),
  heroSecondaryCtaHref: z.string().nullable().default(null),
  heroMediaAssetId: z.string().nullable().default(null),
  heroMediaAsset: MediaAssetSchema.nullable().default(null),
  navigationLabel: z.string().nullable().default(null),
  navigationGroup: z.string().nullable().default(null),
  showInPrimaryNav: z.boolean().default(false),
  showInFooter: z.boolean().default(false),
  canonicalUrl: z.string().nullable().default(null),
  seoTitle: z.string().nullable().default(null),
  seoDescription: z.string().nullable().default(null),
  sections: z.array(SitePageSectionSchema).default([]),
  sortOrder: z.number().int().min(0),
  updatedAt: z.string()
});
export type SitePage = z.infer<typeof SitePageSchema>;

export const SiteSettingSchema = z.object({
  id: z.string(),
  key: z.string(),
  locale: LocaleCodeSchema,
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  value: z.unknown(),
  updatedAt: z.string()
});
export type SiteSetting = z.infer<typeof SiteSettingSchema>;

export const SiteSettingsSchema = z.object({
  announcement: z.string().nullable().default(null),
  primaryNavigation: z.array(SiteNavigationItemSchema).default([]),
  footerColumns: z.array(SiteFooterColumnSchema).default([]),
  footerNote: z.string().nullable().default(null),
  fundingNote: z.string().nullable().default(null),
  contactEmail: z.string().email().nullable().default(null),
  contactLinks: z.array(SiteNavigationItemSchema).default([])
});
export type SiteSettings = z.infer<typeof SiteSettingsSchema>;

export const PartnerLeadSummarySchema = z.object({
  id: z.string(),
  organizationId: z.string().nullable().default(null),
  programId: z.string().nullable().default(null),
  name: z.string(),
  organizationName: z.string(),
  email: z.string().email(),
  websiteUrl: z.string().nullable().default(null),
  message: z.string(),
  status: PartnerLeadStatusSchema,
  assigneeName: z.string().nullable().default(null),
  assigneeEmail: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
  sourcePage: z.string(),
  resolvedAt: z.string().nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type PartnerLeadSummary = z.infer<typeof PartnerLeadSummarySchema>;

export const ContentRevisionSummarySchema = z.object({
  id: z.string(),
  entityType: ContentEntityTypeSchema,
  entityId: z.string(),
  locale: LocaleCodeSchema.nullable().default(null),
  changeSummary: z.string().nullable().default(null),
  snapshot: z.unknown(),
  createdByUserId: z.string().nullable().default(null),
  createdAt: z.string()
});
export type ContentRevisionSummary = z.infer<typeof ContentRevisionSummarySchema>;

export const ContentRevisionListResponseSchema = z.object({
  items: z.array(ContentRevisionSummarySchema)
});
export type ContentRevisionListResponse = z.infer<typeof ContentRevisionListResponseSchema>;

export const SitePagePreviewTokenSchema = z.object({
  sitePageId: z.string(),
  slug: z.string(),
  token: z.string(),
  previewUrl: z.string(),
  expiresAt: z.string()
});
export type SitePagePreviewToken = z.infer<typeof SitePagePreviewTokenSchema>;

export const ReferenceMetadataSchema = z.object({
  scoringVersion: z.string(),
  catalogVersion: z.string(),
  workbookPath: z.string(),
  workbookSha256: z.string(),
  extractedAt: z.string(),
  sheetCount: z.number().int().min(1)
});
export type ReferenceMetadata = z.infer<typeof ReferenceMetadataSchema>;

export const PublicSiteContentSchema = z.object({
  referenceMetadata: ReferenceMetadataSchema,
  sitePages: z.array(SitePageSchema),
  settings: SiteSettingsSchema,
  mediaAssets: z.array(MediaAssetSchema),
  articles: z.array(KnowledgeArticleSchema),
  faqEntries: z.array(FaqEntrySchema),
  caseStudies: z.array(CaseStudySchema),
  resources: z.array(PublicResourceAssetSchema),
  partnerPrograms: z.array(ProgramSummarySchema)
});
export type PublicSiteContent = z.infer<typeof PublicSiteContentSchema>;

export const EditorialOverviewSchema = z.object({
  referenceMetadata: ReferenceMetadataSchema,
  sitePages: z.array(SitePageSchema),
  siteSettings: z.array(SiteSettingSchema),
  mediaAssets: z.array(MediaAssetSchema),
  articles: z.array(KnowledgeArticleSchema),
  faqEntries: z.array(FaqEntrySchema),
  caseStudies: z.array(CaseStudySchema),
  resources: z.array(ResourceAssetSummarySchema),
  partnerLeads: z.array(PartnerLeadSummarySchema),
  partnerInterestCount: z.number().int().min(0)
});
export type EditorialOverview = z.infer<typeof EditorialOverviewSchema>;

export const ContentItemParamsSchema = z.object({
  contentId: z.string()
});
export type ContentItemParams = z.infer<typeof ContentItemParamsSchema>;

export const ResourceAssetParamsSchema = z.object({
  resourceId: z.string()
});
export type ResourceAssetParams = z.infer<typeof ResourceAssetParamsSchema>;

export const SitePageParamsSchema = z.object({
  contentId: z.string()
});
export type SitePageParams = z.infer<typeof SitePageParamsSchema>;

export const SitePageSlugParamsSchema = z.object({
  slug: z.string()
});
export type SitePageSlugParams = z.infer<typeof SitePageSlugParamsSchema>;

export const SiteSettingParamsSchema = z.object({
  contentId: z.string()
});
export type SiteSettingParams = z.infer<typeof SiteSettingParamsSchema>;

export const MediaAssetParamsSchema = z.object({
  mediaId: z.string()
});
export type MediaAssetParams = z.infer<typeof MediaAssetParamsSchema>;

export const PartnerLeadParamsSchema = z.object({
  leadId: z.string()
});
export type PartnerLeadParams = z.infer<typeof PartnerLeadParamsSchema>;

export const ContentRevisionParamsSchema = z.object({
  entityType: ContentEntityTypeSchema,
  entityId: z.string()
});
export type ContentRevisionParams = z.infer<typeof ContentRevisionParamsSchema>;

export const ContentRevisionItemParamsSchema = z.object({
  contentId: z.string(),
  revisionId: z.string()
});
export type ContentRevisionItemParams = z.infer<typeof ContentRevisionItemParamsSchema>;

export const SitePagePreviewTokenParamsSchema = z.object({
  token: z.string().min(16)
});
export type SitePagePreviewTokenParams = z.infer<typeof SitePagePreviewTokenParamsSchema>;

export const LocaleQuerySchema = z.object({
  locale: LocaleCodeSchema.optional()
});
export type LocaleQuery = z.infer<typeof LocaleQuerySchema>;

export const UpsertKnowledgeArticlePayloadSchema = z.object({
  slug: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(160),
  summary: z.string().trim().min(10).max(500),
  body: z.string().trim().min(20).max(20000),
  category: KnowledgeArticleCategorySchema,
  status: ContentStatusSchema,
  locale: LocaleCodeSchema,
  heroImageUrl: z.string().url().nullable().optional()
});
export type UpsertKnowledgeArticlePayload = z.infer<typeof UpsertKnowledgeArticlePayloadSchema>;

export const UpsertFaqEntryPayloadSchema = z.object({
  question: z.string().trim().min(6).max(240),
  answer: z.string().trim().min(12).max(4000),
  category: z.string().trim().min(2).max(80),
  status: ContentStatusSchema,
  locale: LocaleCodeSchema,
  sortOrder: z.number().int().min(0)
});
export type UpsertFaqEntryPayload = z.infer<typeof UpsertFaqEntryPayloadSchema>;

export const UpsertCaseStudyPayloadSchema = z.object({
  slug: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(160),
  startupName: z.string().trim().min(2).max(160),
  summary: z.string().trim().min(10).max(500),
  story: z.string().trim().min(20).max(12000),
  stage: z.string().trim().min(2).max(120),
  naceDivision: z.string().trim().min(2).max(200),
  status: ContentStatusSchema,
  locale: LocaleCodeSchema,
  heroImageUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().min(0)
});
export type UpsertCaseStudyPayload = z.infer<typeof UpsertCaseStudyPayloadSchema>;

export const UpsertResourceAssetPayloadSchema = z.object({
  slug: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(500),
  category: ResourceAssetCategorySchema,
  fileLabel: z.string().trim().min(2).max(80),
  status: ContentStatusSchema,
  locale: LocaleCodeSchema,
  externalUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().min(0)
});
export type UpsertResourceAssetPayload = z.infer<typeof UpsertResourceAssetPayloadSchema>;

export const UpsertSitePagePayloadSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  locale: LocaleCodeSchema,
  title: z.string().trim().min(2).max(160),
  summary: z.string().trim().min(10).max(500),
  pageType: SitePageTypeSchema,
  status: ContentStatusSchema,
  heroEyebrow: z.string().trim().max(120).nullable().optional(),
  heroTitle: z.string().trim().max(240).nullable().optional(),
  heroBody: z.string().trim().max(4000).nullable().optional(),
  heroPrimaryCtaLabel: z.string().trim().max(120).nullable().optional(),
  heroPrimaryCtaHref: z.string().trim().max(400).nullable().optional(),
  heroSecondaryCtaLabel: z.string().trim().max(120).nullable().optional(),
  heroSecondaryCtaHref: z.string().trim().max(400).nullable().optional(),
  heroMediaAssetId: z.string().nullable().optional(),
  navigationLabel: z.string().trim().max(120).nullable().optional(),
  navigationGroup: z.string().trim().max(80).nullable().optional(),
  showInPrimaryNav: z.boolean().default(false),
  showInFooter: z.boolean().default(false),
  canonicalUrl: z.string().trim().max(400).nullable().optional(),
  seoTitle: z.string().trim().max(160).nullable().optional(),
  seoDescription: z.string().trim().max(400).nullable().optional(),
  sections: z.array(SitePageSectionSchema).default([]),
  sortOrder: z.number().int().min(0)
});
export type UpsertSitePagePayload = z.infer<typeof UpsertSitePagePayloadSchema>;

export const UpsertSiteSettingPayloadSchema = z.object({
  key: z.string().trim().min(2).max(120),
  locale: LocaleCodeSchema,
  title: z.string().trim().max(160).nullable().optional(),
  description: z.string().trim().max(500).nullable().optional(),
  value: z.unknown()
});
export type UpsertSiteSettingPayload = z.infer<typeof UpsertSiteSettingPayloadSchema>;

export const UpdatePartnerLeadPayloadSchema = z.object({
  status: PartnerLeadStatusSchema,
  assigneeName: z.string().trim().max(120).nullable().optional(),
  assigneeEmail: z.string().email().nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional()
});
export type UpdatePartnerLeadPayload = z.infer<typeof UpdatePartnerLeadPayloadSchema>;

export const UploadMediaAssetPayloadSchema = z.object({
  slug: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(160),
  altText: z.string().trim().min(2).max(240),
  caption: z.string().trim().max(500).nullable().optional(),
  attribution: z.string().trim().max(240).nullable().optional(),
  rights: z.string().trim().max(240).nullable().optional(),
  locale: LocaleCodeSchema,
  status: ContentStatusSchema
});
export type UploadMediaAssetPayload = z.infer<typeof UploadMediaAssetPayloadSchema>;

export const UpdateMediaAssetPayloadSchema = z.object({
  title: z.string().trim().min(2).max(160),
  altText: z.string().trim().min(2).max(240),
  caption: z.string().trim().max(500).nullable().optional(),
  attribution: z.string().trim().max(240).nullable().optional(),
  rights: z.string().trim().max(240).nullable().optional(),
  locale: LocaleCodeSchema,
  status: ContentStatusSchema,
  focalPointX: z.number().min(0).max(1).nullable().optional(),
  focalPointY: z.number().min(0).max(1).nullable().optional()
});
export type UpdateMediaAssetPayload = z.infer<typeof UpdateMediaAssetPayloadSchema>;

export const SubmitPartnerInterestPayloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  organizationName: z.string().trim().min(2).max(160),
  email: z.string().email(),
  websiteUrl: z.string().url().nullable().optional(),
  message: z.string().trim().min(12).max(4000)
});
export type SubmitPartnerInterestPayload = z.infer<typeof SubmitPartnerInterestPayloadSchema>;

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
  linkedRiskCode: RiskCodeSchema.nullable().default(null),
  linkedOpportunityCode: OpportunityCodeSchema.nullable().default(null),
  linkedRecommendationId: z.string().nullable().default(null),
  reviewState: EvidenceReviewStateSchema,
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
  linkedRiskCode: RiskCodeSchema.optional().nullable(),
  linkedOpportunityCode: OpportunityCodeSchema.optional().nullable(),
  linkedRecommendationId: z.string().trim().max(120).optional().nullable(),
  reviewState: EvidenceReviewStateSchema.optional().default('draft'),
  scenarioId: z.string().optional().nullable()
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
  status: ProgramSubmissionStatusSchema,
  rationale: z.string().trim().max(4000).nullable().optional()
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

export const ScenarioAssumptionsSchema = z.object({
  financialDelta: z.number().min(-4).max(4),
  riskDelta: z.number().min(-2).max(2),
  opportunityDelta: z.number().min(-2).max(2),
  confidenceShift: ScenarioConfidenceShiftSchema,
  impactedTopicCodes: z.array(TopicCodeSchema).max(4)
});
export type ScenarioAssumptions = z.infer<typeof ScenarioAssumptionsSchema>;

export const ScenarioMetricDeltaSchema = z.object({
  key: z.enum(['financial_total', 'risk_overall', 'opportunity_overall']),
  label: z.string(),
  currentValue: z.number(),
  scenarioValue: z.number(),
  delta: z.number()
});
export type ScenarioMetricDelta = z.infer<typeof ScenarioMetricDeltaSchema>;

export const ScenarioTopicDeltaSchema = z.object({
  topicCode: TopicCodeSchema,
  title: z.string(),
  currentBand: PriorityBandSchema,
  scenarioBand: PriorityBandSchema,
  note: z.string()
});
export type ScenarioTopicDelta = z.infer<typeof ScenarioTopicDeltaSchema>;

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
  assumptions: ScenarioAssumptionsSchema,
  advisorySummary: z.string(),
  metricDeltas: z.array(ScenarioMetricDeltaSchema),
  topicDeltas: z.array(ScenarioTopicDeltaSchema),
  projectedConfidenceBand: ConfidenceBandSchema,
  takeaways: z.array(z.string()),
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
  hypothesis: z.string().trim().min(8).max(2000),
  assumptions: ScenarioAssumptionsSchema
});
export type CreateScenarioRunPayload = z.infer<typeof CreateScenarioRunPayloadSchema>;
