import { initContract } from '@ts-rest/core';
import {
  ApiErrorSchema,
  AuthPayloadSchema,
  AuthResponseSchema,
  BreakGlassLoginPayloadSchema,
    CreateEvaluationArtifactPayloadSchema,
    CreateEvaluationNarrativePayloadSchema,
    CreateEvaluationPayloadSchema,
  CsrfResponseSchema,
  DashboardResponseSchema,
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
  ForgotPasswordPayloadSchema,
  ForgotPasswordResponseSchema,
  HealthResponseSchema,
  ImpactSummaryResponseSchema,
  OkResponseSchema,
  ReportResponseSchema,
  ResetPasswordPayloadSchema,
  RevokeSessionResponseSchema,
  SaveStage1PayloadSchema,
  SaveStage1TopicsPayloadSchema,
  SaveStage2PayloadSchema,
  SaveStage2OpportunitiesPayloadSchema,
  SaveStage2RisksPayloadSchema,
  SessionIdParamsSchema,
  SessionListResponseSchema,
  SdgAlignmentResponseSchema,
  SsoProvidersResponseSchema,
  SignupPayloadSchema,
  Stage1FinancialAnswerSchema,
  Stage1FinancialAnswersPayloadSchema,
  Stage1TopicAnswerSchema,
  Stage2OpportunityAnswerSchema,
  Stage2RiskAnswerSchema,
  StageSdgSummarySchema,
  StepUpPayloadSchema,
  StepUpResponseSchema,
  UpdateEvaluationContextPayloadSchema,
  UpdateRecommendationActionPayloadSchema,
  UpdateProfilePayloadSchema,
  UpdateRolePayloadSchema,
  UserIdParamsSchema,
  UserListQuerySchema,
  UserListResponseSchema,
  UserSummarySchema
} from '@packages/shared';
import { z } from 'zod';

const c = initContract();

const csrfHeaderSchema = z.object({
  'x-csrf-token': z.string().min(1)
});

const idempotencyHeaderSchema = z.object({
  'idempotency-key': z.string().min(1)
});

const commonResponses = c.responses({
  400: ApiErrorSchema,
  401: ApiErrorSchema,
  403: ApiErrorSchema,
  404: ApiErrorSchema,
  409: ApiErrorSchema,
  429: ApiErrorSchema,
  500: ApiErrorSchema,
  503: ApiErrorSchema
});

export const apiContract = c.router(
  {
    health: c.router({
      status: {
        method: 'GET',
        path: '/health',
        responses: {
          200: HealthResponseSchema
        },
        summary: 'API and database health status'
      }
    }),
    auth: c.router(
      {
        signup: {
          method: 'POST',
          path: '/signup',
          body: SignupPayloadSchema,
          headers: idempotencyHeaderSchema,
          responses: {
            201: AuthResponseSchema
          }
        },
        login: {
          method: 'POST',
          path: '/login',
          body: AuthPayloadSchema,
          responses: {
            200: AuthResponseSchema
          }
        },
        logout: {
          method: 'POST',
          path: '/logout',
          body: c.noBody(),
          headers: csrfHeaderSchema,
          responses: {
            200: OkResponseSchema
          }
        },
        csrf: {
          method: 'GET',
          path: '/csrf',
          responses: {
            200: CsrfResponseSchema
          }
        },
        me: {
          method: 'GET',
          path: '/me',
          responses: {
            200: AuthResponseSchema
          }
        },
        ssoProviders: {
          method: 'GET',
          path: '/sso/providers',
          responses: {
            200: SsoProvidersResponseSchema
          }
        },
        listSessions: {
          method: 'GET',
          path: '/sessions',
          responses: {
            200: SessionListResponseSchema
          }
        },
        revokeSession: {
          method: 'DELETE',
          path: '/sessions/:sessionId',
          pathParams: SessionIdParamsSchema,
          headers: csrfHeaderSchema,
          responses: {
            200: RevokeSessionResponseSchema
          }
        },
        forgotPassword: {
          method: 'POST',
          path: '/password/forgot',
          body: ForgotPasswordPayloadSchema,
          responses: {
            200: ForgotPasswordResponseSchema
          }
        },
        resetPassword: {
          method: 'POST',
          path: '/password/reset',
          body: ResetPasswordPayloadSchema,
          headers: idempotencyHeaderSchema,
          responses: {
            200: AuthResponseSchema
          }
        },
        breakGlassLogin: {
          method: 'POST',
          path: '/break-glass/login',
          body: BreakGlassLoginPayloadSchema,
          responses: {
            200: AuthResponseSchema
          }
        },
        stepUp: {
          method: 'POST',
          path: '/step-up',
          body: StepUpPayloadSchema,
          headers: csrfHeaderSchema,
          responses: {
            200: StepUpResponseSchema
          }
        },
        logoutAll: {
          method: 'POST',
          path: '/logout-all',
          body: c.noBody(),
          headers: csrfHeaderSchema,
          responses: {
            200: OkResponseSchema
          }
        }
      },
      {
        pathPrefix: '/auth'
      }
    ),
    users: c.router(
      {
        me: {
          method: 'GET',
          path: '/me',
          responses: {
            200: UserSummarySchema
          }
        },
        updateMe: {
          method: 'PATCH',
          path: '/me',
          body: UpdateProfilePayloadSchema,
          headers: csrfHeaderSchema,
          responses: {
            200: UserSummarySchema
          }
        }
      },
      {
        pathPrefix: '/users'
      }
    ),
    admin: c.router(
      {
        listUsers: {
          method: 'GET',
          path: '/users',
          query: UserListQuerySchema,
          responses: {
            200: UserListResponseSchema
          }
        },
        updateUserRole: {
          method: 'PATCH',
          path: '/users/:id/role',
          pathParams: UserIdParamsSchema,
          body: UpdateRolePayloadSchema,
          headers: csrfHeaderSchema,
          responses: {
            200: UserSummarySchema
          }
        }
      },
      {
        pathPrefix: '/admin'
      }
    ),
    evaluations: c.router(
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
        saveStage1Financial: {
          method: 'PUT',
          path: '/:id/stage-1/financial',
          pathParams: EvaluationIdParamsSchema,
          body: Stage1FinancialAnswersPayloadSchema,
          headers: csrfHeaderSchema,
          responses: {
            200: Stage1FinancialAnswerSchema
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
        saveStage1Topics: {
          method: 'PUT',
          path: '/:id/stage-1/topics',
          pathParams: EvaluationIdParamsSchema,
          body: SaveStage1TopicsPayloadSchema,
          headers: csrfHeaderSchema,
          responses: {
            200: z.object({
              items: z.array(Stage1TopicAnswerSchema)
            })
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
        saveStage2Risks: {
          method: 'PUT',
          path: '/:id/stage-2/risks',
          pathParams: EvaluationIdParamsSchema,
          body: SaveStage2RisksPayloadSchema,
          headers: csrfHeaderSchema,
          responses: {
            200: z.object({
              items: z.array(Stage2RiskAnswerSchema)
            })
          }
        },
        saveStage2Opportunities: {
          method: 'PUT',
          path: '/:id/stage-2/opportunities',
          pathParams: EvaluationIdParamsSchema,
          body: SaveStage2OpportunitiesPayloadSchema,
          headers: csrfHeaderSchema,
          responses: {
            200: z.object({
              items: z.array(Stage2OpportunityAnswerSchema)
            })
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
        exportPdf: {
          method: 'GET',
          path: '/:id/export.pdf',
          pathParams: EvaluationIdParamsSchema,
          responses: {
            200: c.otherResponse({
              contentType: 'application/pdf',
              body: z.string()
            })
          }
        },
        exportCsv: {
          method: 'GET',
          path: '/:id/export.csv',
          pathParams: EvaluationIdParamsSchema,
          responses: {
            200: c.otherResponse({
              contentType: 'text/csv',
              body: z.string()
            })
          }
        }
      },
      {
        pathPrefix: '/evaluations'
      }
    )
  },
  {
    strictStatusCodes: true,
    commonResponses
  }
);

export type ApiContract = typeof apiContract;
