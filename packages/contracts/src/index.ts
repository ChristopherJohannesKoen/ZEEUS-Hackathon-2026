import { initContract } from '@ts-rest/core';
import {
  ApiErrorSchema,
  AuthPayloadSchema,
  AuthResponseSchema,
  BreakGlassLoginPayloadSchema,
  CreateEvidenceAssetPayloadSchema,
  CreateProgramSubmissionPayloadSchema,
  CreateEvaluationArtifactPayloadSchema,
  CreateEvaluationNarrativePayloadSchema,
  CreateReviewAssignmentPayloadSchema,
  CreateReviewCommentPayloadSchema,
  CreateEvaluationPayloadSchema,
  CreateScenarioRunPayloadSchema,
  EvidenceAssetListResponseSchema,
  EvidenceAssetParamsSchema,
  EvidenceAssetSummarySchema,
  CsrfResponseSchema,
  DashboardResponseSchema,
  OrganizationDetailSchema,
  OrganizationListResponseSchema,
  OrganizationParamsSchema,
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
  ProgramDetailSchema,
  ProgramListResponseSchema,
  ProgramSubmissionParamsSchema,
  ProgramParamsSchema,
  PublicSiteContentSchema,
  ReportResponseSchema,
  ResetPasswordPayloadSchema,
  RevokeSessionResponseSchema,
  SaveStage1PayloadSchema,
  SaveStage2PayloadSchema,
  ScenarioRunListResponseSchema,
  ScenarioRunSummarySchema,
  SessionIdParamsSchema,
  SessionListResponseSchema,
  SdgAlignmentResponseSchema,
  SdgGoalDetailSchema,
  SdgGoalParamsSchema,
  SsoProvidersResponseSchema,
  SignupPayloadSchema,
  StageSdgSummarySchema,
  StepUpPayloadSchema,
  StepUpResponseSchema,
  UpdateEvaluationContextPayloadSchema,
  UpdateProgramSubmissionStatusPayloadSchema,
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

const apiContractInternal: any = c.router(
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
        pathPrefix: '/evaluations'
      }
    ),
    content: c.router(
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
        }
      },
      {
        pathPrefix: '/content'
      }
    ),
    organizations: c.router(
      {
        list: {
          method: 'GET',
          path: '/',
          responses: {
            200: OrganizationListResponseSchema
          }
        },
        get: {
          method: 'GET',
          path: '/:organizationId',
          pathParams: OrganizationParamsSchema,
          responses: {
            200: OrganizationDetailSchema
          }
        }
      },
      {
        pathPrefix: '/organizations'
      }
    ),
    programs: c.router(
      {
        list: {
          method: 'GET',
          path: '/',
          responses: {
            200: ProgramListResponseSchema
          }
        },
        get: {
          method: 'GET',
          path: '/:programId',
          pathParams: ProgramParamsSchema,
          responses: {
            200: ProgramDetailSchema
          }
        },
        createSubmission: {
          method: 'POST',
          path: '/:programId/submissions',
          pathParams: ProgramParamsSchema,
          body: CreateProgramSubmissionPayloadSchema,
          headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
          responses: {
            201: ProgramDetailSchema
          }
        },
        updateSubmissionStatus: {
          method: 'PUT',
          path: '/:programId/submissions/:submissionId',
          pathParams: ProgramSubmissionParamsSchema,
          body: UpdateProgramSubmissionStatusPayloadSchema,
          headers: csrfHeaderSchema,
          responses: {
            200: ProgramDetailSchema
          }
        },
        createReviewAssignment: {
          method: 'POST',
          path: '/:programId/submissions/:submissionId/assignments',
          pathParams: ProgramSubmissionParamsSchema,
          body: CreateReviewAssignmentPayloadSchema,
          headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
          responses: {
            201: ProgramDetailSchema
          }
        },
        createReviewComment: {
          method: 'POST',
          path: '/:programId/submissions/:submissionId/comments',
          pathParams: ProgramSubmissionParamsSchema,
          body: CreateReviewCommentPayloadSchema,
          headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
          responses: {
            201: ProgramDetailSchema
          }
        }
      },
      {
        pathPrefix: '/programs'
      }
    )
  },
  {
    strictStatusCodes: true,
    commonResponses
  }
);

export const apiContract = apiContractInternal;
