import { apiContract } from '@packages/contracts';
import type {
  AuthResponse,
  DashboardResponse,
  EditorialOverview,
  EvidenceAssetListResponse,
  EvaluationArtifactListResponse,
  EvaluationArtifactSummary,
  EvaluationBenchmarkSummary,
  EvaluationDetail,
  EvaluationListResponse,
  EvaluationNarrativeListResponse,
  EvaluationRevisionCompareResponse,
  EvaluationRevisionDetail,
  EvaluationRevisionListResponse,
  ImpactSummaryResponse,
  OrganizationDetail,
  OrganizationListResponse,
  ProgramDetail,
  ProgramListResponse,
  PublicSiteContent,
  ReportResponse,
  ScenarioRunListResponse,
  SessionListResponse,
  SdgAlignmentResponse,
  SdgGoalDetail,
  StageSdgSummary,
  SsoProvidersResponse,
  UserListQuery,
  UserListResponse,
  UserSummary
} from '@packages/shared';
import { initClient, tsRestFetchApi } from '@ts-rest/core';
import { cookies } from 'next/headers';
import { unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiRequestError, toApiError, unwrapContractResponse } from './api-error';
import { isPublicSpaceMode } from './runtime-mode';
import { getSpaceSdgGoal, spacePublicSiteContent } from './space-public-content';

const apiOrigin = process.env.API_ORIGIN ?? 'http://localhost:4000';
const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? 'zeeus_assessment_session';

const serverClient = initClient(apiContract, {
  baseUrl: `${apiOrigin}/api`,
  validateResponse: true,
  throwOnUnknownStatus: true,
  api: async (args) => {
    const headers = { ...args.headers };
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(sessionCookieName);

    if (sessionCookie && !headers.cookie) {
      headers.cookie = `${sessionCookie.name}=${sessionCookie.value}`;
    }

    return tsRestFetchApi({
      ...args,
      headers,
      fetchOptions: {
        ...args.fetchOptions,
        cache: 'no-store'
      }
    });
  }
});

async function executeServerRequest<T>(
  operation: () => Promise<{ status: number; body: unknown; headers: Headers }>,
  expectedStatuses: readonly number[]
) {
  noStore();

  try {
    const response = await operation();
    return unwrapContractResponse<T>(response, expectedStatuses);
  } catch (error) {
    throw toApiError(error);
  }
}

async function protectedServerRequest<T>(
  operation: () => Promise<{ status: number; body: unknown; headers: Headers }>,
  expectedStatuses: readonly number[]
) {
  if (isPublicSpaceMode) {
    redirect('/');
  }

  try {
    return await executeServerRequest<T>(operation, expectedStatuses);
  } catch (error) {
    if (error instanceof ApiRequestError && error.statusCode === 401) {
      redirect('/login');
    }

    throw error;
  }
}

export async function getCurrentUser() {
  if (isPublicSpaceMode) {
    return undefined;
  }

  try {
    const response = await executeServerRequest<AuthResponse>(() => serverClient.auth.me(), [200]);
    return response.user;
  } catch (error) {
    if (error instanceof ApiRequestError && error.statusCode === 401) {
      return undefined;
    }

    throw error;
  }
}

export function getSsoProviders() {
  return executeServerRequest<SsoProvidersResponse>(() => serverClient.auth.ssoProviders(), [200]);
}

export async function requireCurrentUser() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  return currentUser;
}

export function getEvaluations() {
  return protectedServerRequest<EvaluationListResponse>(
    () => serverClient.evaluations.list(),
    [200]
  );
}

export function getEvaluation(evaluationId: string) {
  return protectedServerRequest<EvaluationDetail>(
    () =>
      serverClient.evaluations.get({
        params: { id: evaluationId }
      }),
    [200]
  );
}

export function getEvaluationSummary(evaluationId: string) {
  return protectedServerRequest<StageSdgSummary>(
    () =>
      serverClient.evaluations.getSummary({
        params: { id: evaluationId }
      }),
    [200]
  );
}

export function getImpactSummary(evaluationId: string) {
  return protectedServerRequest<ImpactSummaryResponse>(
    () =>
      serverClient.evaluations.getImpactSummary({
        params: { id: evaluationId }
      }),
    [200]
  );
}

export function getSdgAlignment(evaluationId: string) {
  return protectedServerRequest<SdgAlignmentResponse>(
    () =>
      serverClient.evaluations.getSdgAlignment({
        params: { id: evaluationId }
      }),
    [200]
  );
}

export function getEvaluationDashboard(evaluationId: string) {
  return protectedServerRequest<DashboardResponse>(
    () =>
      serverClient.evaluations.getDashboard({
        params: { id: evaluationId }
      }),
    [200]
  );
}

export function getEvaluationReport(evaluationId: string) {
  return protectedServerRequest<ReportResponse>(
    () =>
      serverClient.evaluations.getReport({
        params: { id: evaluationId }
      }),
    [200]
  );
}

export function getEvaluationRevisions(evaluationId: string) {
  return protectedServerRequest<EvaluationRevisionListResponse>(
    () =>
      serverClient.evaluations.listRevisions({
        params: { id: evaluationId }
      }),
    [200]
  );
}

export function getEvaluationRevision(evaluationId: string, revisionNumber: number) {
  return protectedServerRequest<EvaluationRevisionDetail>(
    () =>
      serverClient.evaluations.getRevision({
        params: { id: evaluationId, revisionNumber }
      }),
    [200]
  );
}

export function compareEvaluationRevisions(
  evaluationId: string,
  leftRevisionNumber: number,
  rightRevisionNumber: number
) {
  return protectedServerRequest<EvaluationRevisionCompareResponse>(
    () =>
      serverClient.evaluations.compareRevisions({
        params: { id: evaluationId },
        query: {
          left: leftRevisionNumber,
          right: rightRevisionNumber
        }
      }),
    [200]
  );
}

export function getEvaluationArtifacts(evaluationId: string) {
  return protectedServerRequest<EvaluationArtifactListResponse>(
    () =>
      serverClient.evaluations.listArtifacts({
        params: { id: evaluationId }
      }),
    [200]
  );
}

export function getEvaluationArtifact(evaluationId: string, artifactId: string) {
  return protectedServerRequest<EvaluationArtifactSummary>(
    () =>
      serverClient.evaluations.getArtifact({
        params: { id: evaluationId, artifactId }
      }),
    [200]
  );
}

export function getEvaluationNarratives(evaluationId: string) {
  return protectedServerRequest<EvaluationNarrativeListResponse>(
    () =>
      serverClient.evaluations.listNarratives({
        params: { id: evaluationId }
      }),
    [200]
  );
}

export function getEvaluationBenchmarks(evaluationId: string, revisionNumber?: number) {
  return protectedServerRequest<EvaluationBenchmarkSummary>(
    () =>
      serverClient.evaluations.getBenchmarks({
        params: { id: evaluationId },
        query: revisionNumber ? { revisionNumber } : {}
      }),
    [200]
  );
}

export function getEvaluationEvidence(evaluationId: string) {
  return protectedServerRequest<EvidenceAssetListResponse>(
    () =>
      serverClient.evaluations.listEvidence({
        params: { id: evaluationId }
      }),
    [200]
  );
}

export function getEvaluationScenarios(evaluationId: string) {
  return protectedServerRequest<ScenarioRunListResponse>(
    () =>
      serverClient.evaluations.listScenarios({
        params: { id: evaluationId }
      }),
    [200]
  );
}

export function getOrganizations() {
  return protectedServerRequest<OrganizationListResponse>(
    () => serverClient.organizations.list(),
    [200]
  );
}

export function getOrganization(organizationId: string) {
  return protectedServerRequest<OrganizationDetail>(
    () =>
      serverClient.organizations.get({
        params: { organizationId }
      }),
    [200]
  );
}

export function getPrograms() {
  return protectedServerRequest<ProgramListResponse>(() => serverClient.programs.list(), [200]);
}

export function getProgram(programId: string) {
  return protectedServerRequest<ProgramDetail>(
    () =>
      serverClient.programs.get({
        params: { programId }
      }),
    [200]
  );
}

export function getPublicSiteContent() {
  if (isPublicSpaceMode) {
    return Promise.resolve(spacePublicSiteContent);
  }

  return executeServerRequest<PublicSiteContent>(() => serverClient.content.site(), [200]);
}

export function getEditorialOverview() {
  return protectedServerRequest<EditorialOverview>(
    () => serverClient.content.getEditorialOverview(),
    [200]
  );
}

export function getSdgGoal(goalNumber: number) {
  if (isPublicSpaceMode) {
    const goal = getSpaceSdgGoal(goalNumber);

    if (!goal) {
      throw new ApiRequestError(
        'SDG goal not available in the public preview.',
        404,
        [],
        undefined
      );
    }

    return Promise.resolve(goal);
  }

  return executeServerRequest<SdgGoalDetail>(
    () =>
      serverClient.content.sdgGoal({
        params: { goalNumber }
      }),
    [200]
  );
}

export function getUsers(query: Partial<UserListQuery> = {}) {
  return protectedServerRequest<UserListResponse>(
    () => serverClient.admin.listUsers({ query }),
    [200]
  );
}

export function getUserProfile() {
  return protectedServerRequest<UserSummary>(() => serverClient.users.me(), [200]);
}

export function getSessions() {
  return protectedServerRequest<SessionListResponse>(() => serverClient.auth.listSessions(), [200]);
}
