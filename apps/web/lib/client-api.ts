'use client';

import { apiContract } from '@packages/contracts';
import type {
  AuthPayload,
  AuthResponse,
  BreakGlassLoginPayload,
  CaseStudy,
  ContentEntityType,
  ContentRevisionListResponse,
  CreateEvidenceAssetPayload,
  CreateProgramSubmissionPayload,
  CreateEvaluationArtifactPayload,
  CreateEvaluationNarrativePayload,
  CreateReviewAssignmentPayload,
  CreateReviewCommentPayload,
  CreateEvaluationPayload,
  CreateScenarioRunPayload,
  EditorialOverview,
  EvidenceAssetSummary,
  EvaluationArtifactSummary,
  EvaluationBenchmarkSummary,
  EvaluationDetail,
  EvaluationNarrativeListResponse,
  EvaluationNarrativeSummary,
  FaqEntry,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  KnowledgeArticle,
  MediaAsset,
  OkResponse,
  OrganizationDetail,
  OrganizationListResponse,
  PartnerLeadSummary,
  ProgramDetail,
  ProgramListResponse,
  PublicSiteContent,
  ResourceAssetSummary,
  SaveStage1Payload,
  SaveStage2Payload,
  ResetPasswordPayload,
  RevokeSessionResponse,
  Role,
  DashboardResponse,
  ScenarioRunSummary,
  SdgGoalDetail,
  SitePage,
  SitePagePreviewToken,
  SiteSetting,
  StepUpResponse,
  SubmitPartnerInterestPayload,
  UpdateMediaAssetPayload,
  UpdatePartnerLeadPayload,
  UpdateEvaluationContextPayload,
  UpdateProgramSubmissionStatusPayload,
  UpdateRecommendationActionPayload,
  UpdateProfilePayload,
  UpsertCaseStudyPayload,
  UpsertFaqEntryPayload,
  UpsertKnowledgeArticlePayload,
  UpsertResourceAssetPayload,
  UpsertSitePagePayload,
  UpsertSiteSettingPayload,
  UserSummary
} from '@packages/shared';
import { ApiErrorSchema } from '@packages/shared';
import { initClient } from '@ts-rest/core';
import { toApiError, unwrapContractResponse } from './api-error';

const unsafeMethods = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const browserClient = initClient(apiContract, {
  baseUrl: '/api',
  credentials: 'same-origin',
  validateResponse: true,
  throwOnUnknownStatus: true
});

let csrfTokenCache: string | undefined;
let csrfTokenPromise: Promise<string> | undefined;
type MutationHeaders = {
  'idempotency-key'?: string;
  'x-csrf-token'?: string;
};

function clearCsrfToken() {
  csrfTokenCache = undefined;
  csrfTokenPromise = undefined;
}

function createIdempotencyKey() {
  return (
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

async function withApiErrors<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    throw toApiError(error);
  }
}

async function fetchCsrfToken(forceRefresh = false) {
  if (!forceRefresh && csrfTokenCache) {
    return csrfTokenCache;
  }

  if (!csrfTokenPromise || forceRefresh) {
    csrfTokenPromise = withApiErrors(async () => {
      const response = await browserClient.auth.csrf();
      const payload = unwrapContractResponse<{ csrfToken: string }>(response, [200]);
      csrfTokenCache = payload.csrfToken;
      return payload.csrfToken;
    }).finally(() => {
      csrfTokenPromise = undefined;
    });
  }

  return csrfTokenPromise;
}

async function executeMutation<T>({
  call,
  expectedStatuses,
  idempotent = false,
  method,
  requireCsrf,
  clearCsrfAfter = false
}: {
  call: (headers: MutationHeaders) => Promise<{ status: number; body: unknown; headers: Headers }>;
  expectedStatuses: readonly number[];
  idempotent?: boolean;
  method: string;
  requireCsrf?: boolean;
  clearCsrfAfter?: boolean;
}) {
  return withApiErrors(async () => {
    const shouldSendCsrf = requireCsrf ?? unsafeMethods.has(method);
    const idempotencyKey = idempotent ? createIdempotencyKey() : undefined;

    const run = async (forceCsrfRefresh = false) => {
      const headers: MutationHeaders = {};

      if (idempotencyKey) {
        headers['idempotency-key'] = idempotencyKey;
      }

      if (shouldSendCsrf) {
        headers['x-csrf-token'] = await fetchCsrfToken(forceCsrfRefresh);
      }

      return call(headers);
    };

    const isRetryableCsrfError = (error: unknown) => {
      const apiError = toApiError(error);
      return shouldSendCsrf && apiError.statusCode === 403 && apiError.code === 'csrf_invalid'
        ? apiError
        : null;
    };

    let response;
    try {
      response = await run(false);
    } catch (error) {
      if (!isRetryableCsrfError(error)) {
        throw error;
      }

      clearCsrfToken();
      response = await run(true);
    }

    const parsedError = ApiErrorSchema.safeParse(response.body);

    if (
      shouldSendCsrf &&
      response.status === 403 &&
      parsedError.success &&
      parsedError.data.code === 'csrf_invalid'
    ) {
      clearCsrfToken();
      response = await run(true);
    }

    const payload = unwrapContractResponse<T>(response, expectedStatuses);

    if (clearCsrfAfter) {
      clearCsrfToken();
    }

    return payload;
  });
}

export function signIn(body: AuthPayload) {
  return executeMutation<AuthResponse>({
    method: 'POST',
    requireCsrf: false,
    clearCsrfAfter: true,
    expectedStatuses: [200],
    call: () => browserClient.auth.login({ body })
  });
}

export function breakGlassSignIn(body: BreakGlassLoginPayload) {
  return executeMutation<AuthResponse>({
    method: 'POST',
    requireCsrf: false,
    clearCsrfAfter: true,
    expectedStatuses: [200],
    call: () => browserClient.auth.breakGlassLogin({ body })
  });
}

export function signUp(body: { name: string; email: string; password: string }) {
  return executeMutation<AuthResponse>({
    method: 'POST',
    requireCsrf: false,
    clearCsrfAfter: true,
    expectedStatuses: [201],
    idempotent: true,
    call: (headers) =>
      browserClient.auth.signup({
        body,
        headers: {
          'idempotency-key': headers['idempotency-key']!
        }
      })
  });
}

export function requestPasswordReset(body: ForgotPasswordPayload) {
  return executeMutation<ForgotPasswordResponse>({
    method: 'POST',
    requireCsrf: false,
    expectedStatuses: [200],
    call: () => browserClient.auth.forgotPassword({ body })
  });
}

export function resetPassword(body: ResetPasswordPayload) {
  return executeMutation<AuthResponse>({
    method: 'POST',
    requireCsrf: false,
    clearCsrfAfter: true,
    expectedStatuses: [200],
    idempotent: true,
    call: (headers) =>
      browserClient.auth.resetPassword({
        body,
        headers: {
          'idempotency-key': headers['idempotency-key']!
        }
      })
  });
}

export function logout() {
  return executeMutation<OkResponse>({
    method: 'POST',
    clearCsrfAfter: true,
    expectedStatuses: [200],
    call: (headers) =>
      browserClient.auth.logout({
        headers: {
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function logoutAll() {
  return executeMutation<OkResponse>({
    method: 'POST',
    clearCsrfAfter: true,
    expectedStatuses: [200],
    call: (headers) =>
      browserClient.auth.logoutAll({
        headers: {
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function completeStepUp(password: string) {
  return executeMutation<StepUpResponse>({
    method: 'POST',
    expectedStatuses: [200],
    call: (headers) =>
      browserClient.auth.stepUp({
        body: { password },
        headers: {
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function revokeSession(sessionId: string) {
  return executeMutation<RevokeSessionResponse>({
    method: 'DELETE',
    expectedStatuses: [200],
    call: (headers) =>
      browserClient.auth.revokeSession({
        params: { sessionId },
        headers: {
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function updateProfile(body: UpdateProfilePayload) {
  return executeMutation<UserSummary>({
    method: 'PATCH',
    expectedStatuses: [200],
    call: (headers) =>
      browserClient.users.updateMe({
        body,
        headers: {
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function createEvaluation(body: CreateEvaluationPayload) {
  return executeMutation<EvaluationDetail>({
    method: 'POST',
    expectedStatuses: [201],
    idempotent: true,
    call: (headers) =>
      browserClient.evaluations.create({
        body,
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function updateEvaluationContext(
  evaluationId: string,
  body: UpdateEvaluationContextPayload
) {
  return executeMutation<EvaluationDetail>({
    method: 'PATCH',
    expectedStatuses: [200],
    call: (headers) =>
      browserClient.evaluations.updateContext({
        params: { id: evaluationId },
        body,
        headers: {
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function saveStage1(evaluationId: string, body: SaveStage1Payload) {
  return executeMutation<EvaluationDetail>({
    method: 'PUT',
    expectedStatuses: [200],
    idempotent: true,
    call: (headers) =>
      browserClient.evaluations.saveStage1({
        params: { id: evaluationId },
        body,
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function saveStage2(evaluationId: string, body: SaveStage2Payload) {
  return executeMutation<EvaluationDetail>({
    method: 'PUT',
    expectedStatuses: [200],
    idempotent: true,
    call: (headers) =>
      browserClient.evaluations.saveStage2({
        params: { id: evaluationId },
        body,
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function completeEvaluation(evaluationId: string) {
  return executeMutation<EvaluationDetail>({
    method: 'POST',
    expectedStatuses: [200],
    idempotent: true,
    call: (headers) =>
      browserClient.evaluations.complete({
        params: { id: evaluationId },
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function reopenEvaluation(evaluationId: string) {
  return executeMutation<EvaluationDetail>({
    method: 'POST',
    expectedStatuses: [200],
    idempotent: true,
    call: (headers) =>
      browserClient.evaluations.reopen({
        params: { id: evaluationId },
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function archiveEvaluation(evaluationId: string) {
  return executeMutation<EvaluationDetail>({
    method: 'POST',
    expectedStatuses: [200],
    idempotent: true,
    call: (headers) =>
      browserClient.evaluations.archive({
        params: { id: evaluationId },
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function unarchiveEvaluation(evaluationId: string) {
  return executeMutation<EvaluationDetail>({
    method: 'POST',
    expectedStatuses: [200],
    idempotent: true,
    call: (headers) =>
      browserClient.evaluations.unarchive({
        params: { id: evaluationId },
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function requestEvaluationArtifact(
  evaluationId: string,
  body: CreateEvaluationArtifactPayload
) {
  return executeMutation<EvaluationArtifactSummary>({
    method: 'POST',
    expectedStatuses: [201],
    idempotent: true,
    call: (headers) =>
      browserClient.evaluations.createArtifact({
        params: { id: evaluationId },
        body,
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function getEvaluationArtifactStatus(evaluationId: string, artifactId: string) {
  return withApiErrors(async () => {
    const response = await browserClient.evaluations.getArtifact({
      params: { id: evaluationId, artifactId }
    });
    return unwrapContractResponse<EvaluationArtifactSummary>(response, [200]);
  });
}

export function createEvaluationNarrative(
  evaluationId: string,
  body: CreateEvaluationNarrativePayload
) {
  return executeMutation<EvaluationNarrativeSummary>({
    method: 'POST',
    expectedStatuses: [201],
    idempotent: true,
    call: (headers) =>
      browserClient.evaluations.createNarrative({
        params: { id: evaluationId },
        body,
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function listEvaluationNarratives(evaluationId: string) {
  return withApiErrors(async () => {
    const response = await browserClient.evaluations.listNarratives({
      params: { id: evaluationId }
    });
    return unwrapContractResponse<EvaluationNarrativeListResponse>(response, [200]);
  });
}

export function getEvaluationBenchmarks(evaluationId: string, revisionNumber?: number) {
  return withApiErrors(async () => {
    const response = await browserClient.evaluations.getBenchmarks({
      params: { id: evaluationId },
      query: revisionNumber ? { revisionNumber } : {}
    });
    return unwrapContractResponse<EvaluationBenchmarkSummary>(response, [200]);
  });
}

export function createEvidenceAsset(evaluationId: string, body: CreateEvidenceAssetPayload) {
  return executeMutation<EvidenceAssetSummary>({
    method: 'POST',
    expectedStatuses: [201],
    idempotent: true,
    call: (headers) =>
      browserClient.evaluations.createEvidence({
        params: { id: evaluationId },
        body,
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export async function uploadEvidenceFile(evaluationId: string, body: FormData) {
  return withApiErrors(async () => {
    const csrfToken = await fetchCsrfToken();
    const response = await fetch(`/api/evaluations/${evaluationId}/evidence/upload`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'x-csrf-token': csrfToken,
        'idempotency-key': createIdempotencyKey()
      },
      body
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        typeof payload?.message === 'string' ? payload.message : 'Unable to upload evidence.'
      );
    }

    return payload as EvidenceAssetSummary;
  });
}

export function createScenarioRun(evaluationId: string, body: CreateScenarioRunPayload) {
  return executeMutation<ScenarioRunSummary>({
    method: 'POST',
    expectedStatuses: [201],
    idempotent: true,
    call: (headers) =>
      browserClient.evaluations.createScenario({
        params: { id: evaluationId },
        body,
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function getSiteContent() {
  return withApiErrors(async () => {
    const response = await browserClient.content.site();
    return unwrapContractResponse<PublicSiteContent>(response, [200]);
  });
}

export function submitPartnerInterest(body: SubmitPartnerInterestPayload) {
  return executeMutation<OkResponse>({
    method: 'POST',
    requireCsrf: false,
    expectedStatuses: [200],
    idempotent: true,
    call: (headers) =>
      browserClient.content.submitPartnerInterest({
        body,
        headers: {
          'idempotency-key': headers['idempotency-key']!
        }
      })
  });
}

export function getSdgGoal(goalNumber: number) {
  return withApiErrors(async () => {
    const response = await browserClient.content.sdgGoal({
      params: { goalNumber }
    });
    return unwrapContractResponse<SdgGoalDetail>(response, [200]);
  });
}

export function getEditorialOverview() {
  return withApiErrors(async () => {
    const response = await browserClient.content.getEditorialOverview();
    return unwrapContractResponse<EditorialOverview>(response, [200]);
  });
}

export function createSitePage(body: UpsertSitePagePayload) {
  return executeMutation<SitePage>({
    method: 'POST',
    expectedStatuses: [201],
    idempotent: true,
    call: (headers) =>
      browserClient.content.createSitePage({
        body,
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function updateSitePage(contentId: string, body: UpsertSitePagePayload) {
  return executeMutation<SitePage>({
    method: 'PUT',
    expectedStatuses: [200],
    call: (headers) =>
      browserClient.content.updateSitePage({
        params: { contentId },
        body,
        headers: {
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function getContentRevisions(entityType: ContentEntityType, entityId: string) {
  return withApiErrors(async () => {
    const response = await browserClient.content.listContentRevisions({
      params: {
        entityType,
        entityId
      }
    });
    return unwrapContractResponse<ContentRevisionListResponse>(response, [200]);
  });
}

export function restoreSitePageRevision(contentId: string, revisionId: string) {
  return executeMutation<SitePage>({
    method: 'POST',
    expectedStatuses: [200],
    idempotent: true,
    call: (headers) =>
      browserClient.content.restoreSitePageRevision({
        params: { contentId, revisionId },
        body: {},
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function createSitePagePreviewToken(contentId: string) {
  return executeMutation<SitePagePreviewToken>({
    method: 'POST',
    expectedStatuses: [201],
    idempotent: true,
    call: (headers) =>
      browserClient.content.createSitePagePreviewToken({
        params: { contentId },
        body: {},
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function createSiteSetting(body: UpsertSiteSettingPayload) {
  return executeMutation<SiteSetting>({
    method: 'POST',
    expectedStatuses: [201],
    idempotent: true,
    call: (headers) =>
      browserClient.content.createSiteSetting({
        body,
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function updateSiteSetting(contentId: string, body: UpsertSiteSettingPayload) {
  return executeMutation<SiteSetting>({
    method: 'PUT',
    expectedStatuses: [200],
    call: (headers) =>
      browserClient.content.updateSiteSetting({
        params: { contentId },
        body,
        headers: {
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export async function uploadSiteMediaAsset(body: FormData) {
  return withApiErrors(async () => {
    const csrfToken = await fetchCsrfToken();
    const response = await fetch('/api/content/admin/media', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'x-csrf-token': csrfToken,
        'idempotency-key': createIdempotencyKey()
      },
      body
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        typeof payload?.message === 'string' ? payload.message : 'Unable to upload media asset.'
      );
    }

    return payload as MediaAsset;
  });
}

export function updateSiteMediaAsset(mediaId: string, body: UpdateMediaAssetPayload) {
  return executeMutation<MediaAsset>({
    method: 'PUT',
    expectedStatuses: [200],
    call: (headers) =>
      browserClient.content.updateMediaAsset({
        params: { mediaId },
        body,
        headers: {
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function updatePartnerLead(leadId: string, body: UpdatePartnerLeadPayload) {
  return executeMutation<PartnerLeadSummary>({
    method: 'PUT',
    expectedStatuses: [200],
    call: (headers) =>
      browserClient.content.updatePartnerLead({
        params: { leadId },
        body,
        headers: {
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function createKnowledgeArticle(body: UpsertKnowledgeArticlePayload) {
  return executeMutation<KnowledgeArticle>({
    method: 'POST',
    expectedStatuses: [201],
    idempotent: true,
    call: (headers) =>
      browserClient.content.createKnowledgeArticle({
        body,
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function updateKnowledgeArticle(contentId: string, body: UpsertKnowledgeArticlePayload) {
  return executeMutation<KnowledgeArticle>({
    method: 'PUT',
    expectedStatuses: [200],
    call: (headers) =>
      browserClient.content.updateKnowledgeArticle({
        params: { contentId },
        body,
        headers: {
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function createFaqEntry(body: UpsertFaqEntryPayload) {
  return executeMutation<FaqEntry>({
    method: 'POST',
    expectedStatuses: [201],
    idempotent: true,
    call: (headers) =>
      browserClient.content.createFaqEntry({
        body,
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function updateFaqEntry(contentId: string, body: UpsertFaqEntryPayload) {
  return executeMutation<FaqEntry>({
    method: 'PUT',
    expectedStatuses: [200],
    call: (headers) =>
      browserClient.content.updateFaqEntry({
        params: { contentId },
        body,
        headers: {
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function createCaseStudy(body: UpsertCaseStudyPayload) {
  return executeMutation<CaseStudy>({
    method: 'POST',
    expectedStatuses: [201],
    idempotent: true,
    call: (headers) =>
      browserClient.content.createCaseStudy({
        body,
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function updateCaseStudy(contentId: string, body: UpsertCaseStudyPayload) {
  return executeMutation<CaseStudy>({
    method: 'PUT',
    expectedStatuses: [200],
    call: (headers) =>
      browserClient.content.updateCaseStudy({
        params: { contentId },
        body,
        headers: {
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function createResourceAsset(body: UpsertResourceAssetPayload) {
  return executeMutation<ResourceAssetSummary>({
    method: 'POST',
    expectedStatuses: [201],
    idempotent: true,
    call: (headers) =>
      browserClient.content.createResourceAsset({
        body,
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function updateResourceAsset(resourceId: string, body: UpsertResourceAssetPayload) {
  return executeMutation<ResourceAssetSummary>({
    method: 'PUT',
    expectedStatuses: [200],
    call: (headers) =>
      browserClient.content.updateResourceAsset({
        params: { resourceId },
        body,
        headers: {
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export async function uploadResourceAsset(resourceId: string, body: FormData) {
  return withApiErrors(async () => {
    const csrfToken = await fetchCsrfToken();
    const response = await fetch(`/api/content/admin/resources/${resourceId}/upload`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'x-csrf-token': csrfToken,
        'idempotency-key': createIdempotencyKey()
      },
      body
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        typeof payload?.message === 'string' ? payload.message : 'Unable to upload resource.'
      );
    }

    return payload as ResourceAssetSummary;
  });
}

export function getOrganizations() {
  return withApiErrors(async () => {
    const response = await browserClient.organizations.list();
    return unwrapContractResponse<OrganizationListResponse>(response, [200]);
  });
}

export function getOrganization(organizationId: string) {
  return withApiErrors(async () => {
    const response = await browserClient.organizations.get({
      params: { organizationId }
    });
    return unwrapContractResponse<OrganizationDetail>(response, [200]);
  });
}

export function getPrograms() {
  return withApiErrors(async () => {
    const response = await browserClient.programs.list();
    return unwrapContractResponse<ProgramListResponse>(response, [200]);
  });
}

export function getProgram(programId: string) {
  return withApiErrors(async () => {
    const response = await browserClient.programs.get({
      params: { programId }
    });
    return unwrapContractResponse<ProgramDetail>(response, [200]);
  });
}

export function createProgramSubmission(programId: string, body: CreateProgramSubmissionPayload) {
  return executeMutation<ProgramDetail>({
    method: 'POST',
    expectedStatuses: [201],
    idempotent: true,
    call: (headers) =>
      browserClient.programs.createSubmission({
        params: { programId },
        body,
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function updateProgramSubmissionStatus(
  programId: string,
  submissionId: string,
  body: UpdateProgramSubmissionStatusPayload
) {
  return executeMutation<ProgramDetail>({
    method: 'PUT',
    expectedStatuses: [200],
    call: (headers) =>
      browserClient.programs.updateSubmissionStatus({
        params: { programId, submissionId },
        body,
        headers: {
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function createReviewAssignment(
  programId: string,
  submissionId: string,
  body: CreateReviewAssignmentPayload
) {
  return executeMutation<ProgramDetail>({
    method: 'POST',
    expectedStatuses: [201],
    idempotent: true,
    call: (headers) =>
      browserClient.programs.createReviewAssignment({
        params: { programId, submissionId },
        body,
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function createReviewComment(
  programId: string,
  submissionId: string,
  body: CreateReviewCommentPayload
) {
  return executeMutation<ProgramDetail>({
    method: 'POST',
    expectedStatuses: [201],
    idempotent: true,
    call: (headers) =>
      browserClient.programs.createReviewComment({
        params: { programId, submissionId },
        body,
        headers: {
          'idempotency-key': headers['idempotency-key']!,
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function updateRecommendationAction(
  evaluationId: string,
  revisionNumber: number,
  recommendationId: string,
  body: UpdateRecommendationActionPayload
) {
  return executeMutation<DashboardResponse>({
    method: 'PUT',
    expectedStatuses: [200],
    call: (headers) =>
      browserClient.evaluations.updateRecommendationAction({
        params: { id: evaluationId, revisionNumber, recommendationId },
        body,
        headers: {
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}

export function updateUserRole(userId: string, role: Role) {
  return executeMutation<UserSummary>({
    method: 'PATCH',
    expectedStatuses: [200],
    call: (headers) =>
      browserClient.admin.updateUserRole({
        params: { id: userId },
        body: { role },
        headers: {
          'x-csrf-token': headers['x-csrf-token']!
        }
      })
  });
}
