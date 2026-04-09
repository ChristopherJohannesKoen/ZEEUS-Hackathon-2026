import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status
  });
}

function evaluationResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'evaluation_1',
    name: 'Updated assessment',
    country: 'South Africa',
    naceDivision: '10 Manufacture of food products',
    currentStage: 'validation',
    status: 'draft',
    currentStep: 'summary',
    financialTotal: 0,
    riskOverall: 0,
    opportunityOverall: 0,
    confidenceBand: 'low',
    currentRevisionNumber: 1,
    scoringVersionInfo: {
      scoringVersion: '2026.04.ready-software.2',
      catalogVersion: 'workbook-catalog'
    },
    lastScoredAt: '2026-01-01T00:00:00.000Z',
    completedAt: null,
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    offeringType: 'product',
    launched: true,
    innovationApproach: 'disruptive',
    initialSummary: {
      currentStage: 'validation',
      phaseGoal: 'Validate the business model.',
      phaseConsideration: null,
      whatToConsider: 'Check the strongest sustainability assumptions first.',
      stageSdgs: [],
      businessSdgs: [],
      mergedSdgs: []
    },
    stage1Financial: null,
    stage1Topics: [],
    stage2Risks: [],
    stage2Opportunities: [],
    artifacts: [],
    ...overrides
  };
}

describe('clientApiRequest', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('retries an unsafe request once when the server returns csrf_invalid', async () => {
    const firstCsrfToken = 'csrf-token-one-1234567890abcdef123456';
    const secondCsrfToken = 'csrf-token-two-1234567890abcdef123456';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ csrfToken: firstCsrfToken }))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            statusCode: 403,
            message: 'A valid CSRF token is required.',
            code: 'csrf_invalid',
            errors: []
          },
          403
        )
      )
      .mockResolvedValueOnce(jsonResponse({ csrfToken: secondCsrfToken }))
      .mockResolvedValueOnce(jsonResponse(evaluationResponse()));

    vi.stubGlobal('fetch', fetchMock);

    const { updateEvaluationContext } = await import('../lib/client-api');

    await expect(
      updateEvaluationContext('evaluation_1', {
        name: 'Updated assessment',
        country: 'South Africa',
        naceDivision: '10 Manufacture of food products',
        offeringType: 'product',
        launched: true,
        currentStage: 'validation',
        innovationApproach: 'disruptive'
      })
    ).resolves.toMatchObject({
      id: 'evaluation_1',
      name: 'Updated assessment'
    });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get('X-CSRF-Token')).toBe(
      firstCsrfToken
    );
    expect(new Headers(fetchMock.mock.calls[3]?.[1]?.headers).get('X-CSRF-Token')).toBe(
      secondCsrfToken
    );
  });

  it('does not replay a generic forbidden mutation', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ csrfToken: 'csrf-token-1234567890abcdef123456' }))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            statusCode: 403,
            message: 'You do not have permission to modify this evaluation.',
            code: 'forbidden',
            errors: []
          },
          403
        )
      );

    vi.stubGlobal('fetch', fetchMock);

    const { updateEvaluationContext } = await import('../lib/client-api');

    await expect(
      updateEvaluationContext('evaluation_1', {
        name: 'Updated assessment',
        country: 'South Africa',
        naceDivision: '10 Manufacture of food products',
        offeringType: 'product',
        launched: true,
        currentStage: 'validation',
        innovationApproach: 'disruptive'
      })
    ).rejects.toMatchObject({
      code: 'forbidden',
      statusCode: 403
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
