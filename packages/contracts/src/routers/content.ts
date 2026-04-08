import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  CaseStudySchema,
  ContentItemParamsSchema,
  EditorialOverviewSchema,
  FaqEntrySchema,
  KnowledgeArticleSchema,
  OkResponseSchema,
  PublicSiteContentSchema,
  ResourceAssetParamsSchema,
  ResourceAssetSummarySchema,
  SdgGoalDetailSchema,
  SdgGoalParamsSchema,
  SubmitPartnerInterestPayloadSchema,
  UpsertCaseStudyPayloadSchema,
  UpsertFaqEntryPayloadSchema,
  UpsertKnowledgeArticlePayloadSchema,
  UpsertResourceAssetPayloadSchema
} from '@packages/shared';
import { csrfHeaderSchema, idempotencyHeaderSchema } from '../shared';

const c = initContract();

export const contentContract = c.router(
  {
    site: {
      method: 'GET',
      path: '/site',
      responses: {
        200: PublicSiteContentSchema
      }
    },
    sdgGoal: {
      method: 'GET',
      path: '/sdgs/:goalNumber',
      pathParams: SdgGoalParamsSchema,
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
