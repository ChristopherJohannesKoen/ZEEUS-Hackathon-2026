import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  CaseStudySchema,
  ContentRevisionItemParamsSchema,
  ContentRevisionListResponseSchema,
  ContentRevisionParamsSchema,
  ContentItemParamsSchema,
  EditorialOverviewSchema,
  FaqEntrySchema,
  KnowledgeArticleSchema,
  LocaleQuerySchema,
  MediaAssetParamsSchema,
  MediaAssetSchema,
  OkResponseSchema,
  PartnerLeadParamsSchema,
  PartnerLeadSummarySchema,
  PublicSiteContentSchema,
  ResourceAssetParamsSchema,
  ResourceAssetSummarySchema,
  SdgGoalDetailSchema,
  SdgGoalParamsSchema,
  SitePageParamsSchema,
  SitePagePreviewTokenParamsSchema,
  SitePagePreviewTokenSchema,
  SitePageSchema,
  SiteSettingParamsSchema,
  SiteSettingSchema,
  SubmitPartnerInterestPayloadSchema,
  UpdateMediaAssetPayloadSchema,
  UpdatePartnerLeadPayloadSchema,
  UpsertCaseStudyPayloadSchema,
  UpsertFaqEntryPayloadSchema,
  UpsertKnowledgeArticlePayloadSchema,
  UpsertResourceAssetPayloadSchema,
  UpsertSitePagePayloadSchema,
  UpsertSiteSettingPayloadSchema
} from '@packages/shared';
import { csrfHeaderSchema, idempotencyHeaderSchema } from '../shared';

const c = initContract();

export const contentContract = c.router(
  {
    site: {
      method: 'GET',
      path: '/site',
      query: LocaleQuerySchema,
      responses: {
        200: PublicSiteContentSchema
      }
    },
    sdgGoal: {
      method: 'GET',
      path: '/sdgs/:goalNumber',
      pathParams: SdgGoalParamsSchema,
      query: LocaleQuerySchema,
      responses: {
        200: SdgGoalDetailSchema
      }
    },
    downloadResource: {
      method: 'GET',
      path: '/resources/:resourceId/download',
      pathParams: ResourceAssetParamsSchema,
      responses: {
        200: c.otherResponse({
          contentType: 'application/octet-stream',
          body: z.string()
        })
      }
    },
    submitPartnerInterest: {
      method: 'POST',
      path: '/partner-interest',
      body: SubmitPartnerInterestPayloadSchema,
      headers: idempotencyHeaderSchema,
      responses: {
        200: OkResponseSchema
      }
    },
    getEditorialOverview: {
      method: 'GET',
      path: '/admin/overview',
      responses: {
        200: EditorialOverviewSchema
      }
    },
    createSitePage: {
      method: 'POST',
      path: '/admin/site-pages',
      body: UpsertSitePagePayloadSchema,
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        201: SitePageSchema
      }
    },
    updateSitePage: {
      method: 'PUT',
      path: '/admin/site-pages/:contentId',
      pathParams: SitePageParamsSchema,
      body: UpsertSitePagePayloadSchema,
      headers: csrfHeaderSchema,
      responses: {
        200: SitePageSchema
      }
    },
    listContentRevisions: {
      method: 'GET',
      path: '/admin/revisions/:entityType/:entityId',
      pathParams: ContentRevisionParamsSchema,
      responses: {
        200: ContentRevisionListResponseSchema
      }
    },
    restoreSitePageRevision: {
      method: 'POST',
      path: '/admin/site-pages/:contentId/revisions/:revisionId/restore',
      pathParams: ContentRevisionItemParamsSchema,
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      body: z.object({}).optional(),
      responses: {
        200: SitePageSchema
      }
    },
    createSitePagePreviewToken: {
      method: 'POST',
      path: '/admin/site-pages/:contentId/preview-token',
      pathParams: SitePageParamsSchema,
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      body: z.object({}).optional(),
      responses: {
        201: SitePagePreviewTokenSchema
      }
    },
    previewSitePage: {
      method: 'GET',
      path: '/preview/:token',
      pathParams: SitePagePreviewTokenParamsSchema,
      responses: {
        200: SitePageSchema
      }
    },
    createSiteSetting: {
      method: 'POST',
      path: '/admin/site-settings',
      body: UpsertSiteSettingPayloadSchema,
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        201: SiteSettingSchema
      }
    },
    updateSiteSetting: {
      method: 'PUT',
      path: '/admin/site-settings/:contentId',
      pathParams: SiteSettingParamsSchema,
      body: UpsertSiteSettingPayloadSchema,
      headers: csrfHeaderSchema,
      responses: {
        200: SiteSettingSchema
      }
    },
    uploadMediaAsset: {
      method: 'POST',
      path: '/admin/media',
      body: z.any(),
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        201: MediaAssetSchema
      }
    },
    updateMediaAsset: {
      method: 'PUT',
      path: '/admin/media/:mediaId',
      pathParams: MediaAssetParamsSchema,
      body: UpdateMediaAssetPayloadSchema,
      headers: csrfHeaderSchema,
      responses: {
        200: MediaAssetSchema
      }
    },
    getMediaAssetFile: {
      method: 'GET',
      path: '/media/:mediaId/file',
      pathParams: MediaAssetParamsSchema,
      responses: {
        200: c.otherResponse({
          contentType: 'application/octet-stream',
          body: z.string()
        })
      }
    },
    updatePartnerLead: {
      method: 'PUT',
      path: '/admin/partner-leads/:leadId',
      pathParams: PartnerLeadParamsSchema,
      body: UpdatePartnerLeadPayloadSchema,
      headers: csrfHeaderSchema,
      responses: {
        200: PartnerLeadSummarySchema
      }
    },
    exportPartnerLeadsCsv: {
      method: 'GET',
      path: '/admin/partner-leads/export',
      responses: {
        200: c.otherResponse({
          contentType: 'text/csv',
          body: z.string()
        })
      }
    },
    createKnowledgeArticle: {
      method: 'POST',
      path: '/admin/articles',
      body: UpsertKnowledgeArticlePayloadSchema,
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        201: KnowledgeArticleSchema
      }
    },
    updateKnowledgeArticle: {
      method: 'PUT',
      path: '/admin/articles/:contentId',
      pathParams: ContentItemParamsSchema,
      body: UpsertKnowledgeArticlePayloadSchema,
      headers: csrfHeaderSchema,
      responses: {
        200: KnowledgeArticleSchema
      }
    },
    createFaqEntry: {
      method: 'POST',
      path: '/admin/faqs',
      body: UpsertFaqEntryPayloadSchema,
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        201: FaqEntrySchema
      }
    },
    updateFaqEntry: {
      method: 'PUT',
      path: '/admin/faqs/:contentId',
      pathParams: ContentItemParamsSchema,
      body: UpsertFaqEntryPayloadSchema,
      headers: csrfHeaderSchema,
      responses: {
        200: FaqEntrySchema
      }
    },
    createCaseStudy: {
      method: 'POST',
      path: '/admin/case-studies',
      body: UpsertCaseStudyPayloadSchema,
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        201: CaseStudySchema
      }
    },
    updateCaseStudy: {
      method: 'PUT',
      path: '/admin/case-studies/:contentId',
      pathParams: ContentItemParamsSchema,
      body: UpsertCaseStudyPayloadSchema,
      headers: csrfHeaderSchema,
      responses: {
        200: CaseStudySchema
      }
    },
    createResourceAsset: {
      method: 'POST',
      path: '/admin/resources',
      body: UpsertResourceAssetPayloadSchema,
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        201: ResourceAssetSummarySchema
      }
    },
    updateResourceAsset: {
      method: 'PUT',
      path: '/admin/resources/:resourceId',
      pathParams: ResourceAssetParamsSchema,
      body: UpsertResourceAssetPayloadSchema,
      headers: csrfHeaderSchema,
      responses: {
        200: ResourceAssetSummarySchema
      }
    },
    uploadResourceAsset: {
      method: 'POST',
      path: '/admin/resources/:resourceId/upload',
      pathParams: ResourceAssetParamsSchema,
      body: z.any(),
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        201: ResourceAssetSummarySchema
      }
    }
  },
  {
    pathPrefix: '/content',
    strictStatusCodes: true
  }
);
