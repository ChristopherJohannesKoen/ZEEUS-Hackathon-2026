import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  CreateEvidenceAssetPayloadSchema,
  CreateEvaluationArtifactPayloadSchema,
  CreateEvaluationNarrativePayloadSchema,
  CreateEvaluationPayloadSchema,
  CreateScenarioRunPayloadSchema,
  DashboardResponseSchema,
  EvidenceAssetListResponseSchema,
  EvidenceAssetParamsSchema,
  EvidenceAssetSummarySchema,
  EvaluationArtifactListResponseSchema,
  EvaluationArtifactParamsSchema,
  EvaluationArtifactSummarySchema,
  EvaluationBenchmarkQuerySchema,
  EvaluationBenchmarkSummarySchema,
  EvaluationDetailSchema,
  EvaluationIdParamsSchema,
  EvaluationListResponseSchema,
  EvaluationNarrativeListResponseSchema,
  EvaluationNarrativeSummarySchema,
  EvaluationRecommendationActionParamsSchema,
  EvaluationRevisionCompareQuerySchema,
  EvaluationRevisionCompareResponseSchema,
  EvaluationRevisionDetailSchema,
  EvaluationRevisionListResponseSchema,
  EvaluationRevisionParamsSchema,
  ImpactSummaryResponseSchema,
  ReportResponseSchema,
  SaveStage1PayloadSchema,
  SaveStage2PayloadSchema,
  ScenarioRunListResponseSchema,
  ScenarioRunSummarySchema,
  SdgAlignmentResponseSchema,
  StageSdgSummarySchema,
  UpdateEvaluationContextPayloadSchema,
  UpdateRecommendationActionPayloadSchema
} from '@packages/shared';
import { csrfHeaderSchema, idempotencyHeaderSchema } from '../shared';

const c = initContract();

export const evaluationsContract = c.router(
  {
    list: {
      method: 'GET',
      path: '/',
      responses: {
        200: EvaluationListResponseSchema
      }
    },
    create: {
      method: 'POST',
      path: '/',
      body: CreateEvaluationPayloadSchema,
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        201: EvaluationDetailSchema
      }
    },
    get: {
      method: 'GET',
      path: '/:id',
      pathParams: EvaluationIdParamsSchema,
      responses: {
        200: EvaluationDetailSchema
      }
    },
    updateContext: {
      method: 'PATCH',
      path: '/:id/context',
      pathParams: EvaluationIdParamsSchema,
      body: UpdateEvaluationContextPayloadSchema,
      headers: csrfHeaderSchema,
      responses: {
        200: EvaluationDetailSchema
      }
    },
    getSummary: {
      method: 'GET',
      path: '/:id/summary',
      pathParams: EvaluationIdParamsSchema,
      responses: {
        200: StageSdgSummarySchema
      }
    },
    saveStage1: {
      method: 'PUT',
      path: '/:id/stage-1',
      pathParams: EvaluationIdParamsSchema,
      body: SaveStage1PayloadSchema,
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        200: EvaluationDetailSchema
      }
    },
    saveStage2: {
      method: 'PUT',
      path: '/:id/stage-2',
      pathParams: EvaluationIdParamsSchema,
      body: SaveStage2PayloadSchema,
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        200: EvaluationDetailSchema
      }
    },
    getImpactSummary: {
      method: 'GET',
      path: '/:id/impact-summary',
      pathParams: EvaluationIdParamsSchema,
      responses: {
        200: ImpactSummaryResponseSchema
      }
    },
    getSdgAlignment: {
      method: 'GET',
      path: '/:id/sdg-alignment',
      pathParams: EvaluationIdParamsSchema,
      responses: {
        200: SdgAlignmentResponseSchema
      }
    },
    getDashboard: {
      method: 'GET',
      path: '/:id/dashboard',
      pathParams: EvaluationIdParamsSchema,
      responses: {
        200: DashboardResponseSchema
      }
    },
    getReport: {
      method: 'GET',
      path: '/:id/report',
      pathParams: EvaluationIdParamsSchema,
      responses: {
        200: ReportResponseSchema
      }
    },
    complete: {
      method: 'POST',
      path: '/:id/complete',
      pathParams: EvaluationIdParamsSchema,
      body: c.noBody(),
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        200: EvaluationDetailSchema
      }
    },
    reopen: {
      method: 'POST',
      path: '/:id/reopen',
      pathParams: EvaluationIdParamsSchema,
      body: c.noBody(),
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        200: EvaluationDetailSchema
      }
    },
    archive: {
      method: 'POST',
      path: '/:id/archive',
      pathParams: EvaluationIdParamsSchema,
      body: c.noBody(),
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        200: EvaluationDetailSchema
      }
    },
    unarchive: {
      method: 'POST',
      path: '/:id/unarchive',
      pathParams: EvaluationIdParamsSchema,
      body: c.noBody(),
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        200: EvaluationDetailSchema
      }
    },
    listRevisions: {
      method: 'GET',
      path: '/:id/revisions',
      pathParams: EvaluationIdParamsSchema,
      responses: {
        200: EvaluationRevisionListResponseSchema
      }
    },
    getRevision: {
      method: 'GET',
      path: '/:id/revisions/:revisionNumber',
      pathParams: EvaluationRevisionParamsSchema,
      responses: {
        200: EvaluationRevisionDetailSchema
      }
    },
    compareRevisions: {
      method: 'GET',
      path: '/:id/revisions/compare',
      pathParams: EvaluationIdParamsSchema,
      query: EvaluationRevisionCompareQuerySchema,
      responses: {
        200: EvaluationRevisionCompareResponseSchema
      }
    },
    createArtifact: {
      method: 'POST',
      path: '/:id/artifacts',
      pathParams: EvaluationIdParamsSchema,
      body: CreateEvaluationArtifactPayloadSchema,
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        201: EvaluationArtifactSummarySchema
      }
    },
    listArtifacts: {
      method: 'GET',
      path: '/:id/artifacts',
      pathParams: EvaluationIdParamsSchema,
      responses: {
        200: EvaluationArtifactListResponseSchema
      }
    },
    getArtifact: {
      method: 'GET',
      path: '/:id/artifacts/:artifactId',
      pathParams: EvaluationArtifactParamsSchema,
      responses: {
        200: EvaluationArtifactSummarySchema
      }
    },
    downloadArtifact: {
      method: 'GET',
      path: '/:id/artifacts/:artifactId/download',
      pathParams: EvaluationArtifactParamsSchema,
      responses: {
        200: c.otherResponse({
          contentType: 'application/octet-stream',
          body: z.string()
        })
      }
    },
    updateRecommendationAction: {
      method: 'PUT',
      path: '/:id/revisions/:revisionNumber/recommendations/:recommendationId',
      pathParams: EvaluationRecommendationActionParamsSchema,
      body: UpdateRecommendationActionPayloadSchema,
      headers: csrfHeaderSchema,
      responses: {
        200: DashboardResponseSchema
      }
    },
    createNarrative: {
      method: 'POST',
      path: '/:id/narratives',
      pathParams: EvaluationIdParamsSchema,
      body: CreateEvaluationNarrativePayloadSchema,
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        201: EvaluationNarrativeSummarySchema
      }
    },
    listNarratives: {
      method: 'GET',
      path: '/:id/narratives',
      pathParams: EvaluationIdParamsSchema,
      responses: {
        200: EvaluationNarrativeListResponseSchema
      }
    },
    getBenchmarks: {
      method: 'GET',
      path: '/:id/benchmarks',
      pathParams: EvaluationIdParamsSchema,
      query: EvaluationBenchmarkQuerySchema,
      responses: {
        200: EvaluationBenchmarkSummarySchema
      }
    },
    listEvidence: {
      method: 'GET',
      path: '/:id/evidence',
      pathParams: EvaluationIdParamsSchema,
      responses: {
        200: EvidenceAssetListResponseSchema
      }
    },
    createEvidence: {
      method: 'POST',
      path: '/:id/evidence',
      pathParams: EvaluationIdParamsSchema,
      body: CreateEvidenceAssetPayloadSchema,
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        201: EvidenceAssetSummarySchema
      }
    },
    uploadEvidence: {
      method: 'POST',
      path: '/:id/evidence/upload',
      pathParams: EvaluationIdParamsSchema,
      body: z.any(),
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        201: EvidenceAssetSummarySchema
      }
    },
    downloadEvidence: {
      method: 'GET',
      path: '/:id/evidence/:evidenceId/download',
      pathParams: EvidenceAssetParamsSchema,
      responses: {
        200: c.otherResponse({
          contentType: 'application/octet-stream',
          body: z.string()
        })
      }
    },
    listScenarios: {
      method: 'GET',
      path: '/:id/scenarios',
      pathParams: EvaluationIdParamsSchema,
      responses: {
        200: ScenarioRunListResponseSchema
      }
    },
    createScenario: {
      method: 'POST',
      path: '/:id/scenarios',
      pathParams: EvaluationIdParamsSchema,
      body: CreateScenarioRunPayloadSchema,
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        201: ScenarioRunSummarySchema
      }
    }
  },
  {
    pathPrefix: '/evaluations',
    strictStatusCodes: true
  }
);
