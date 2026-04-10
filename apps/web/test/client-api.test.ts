import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockBrowserClient = {
  auth: {
    csrf: vi.fn()
  },
  evaluations: {
    updateContext: vi.fn()
  }
};

vi.mock('@ts-rest/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ts-rest/core')>();

  return {
    ...actual,
    initClient: vi.fn(() => mockBrowserClient)
  };
});

function contractResponse(body: unknown, status = 200, headers = new Headers()) {
  return {
    status,
    body,
    headers
  };
}

function evaluationResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'evaluation_1',
    name: 'Updated assessment',
    country: 'South Africa',
    businessCategoryMain: 'Manufacturing',
    businessCategorySubcategory: 'Food products',
    extendedNaceCode: '10.11',
    extendedNaceLabel: '10.11 Processing and preserving of meat',
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
    mockBrowserClient.auth.csrf.mockReset();
    mockBrowserClient.evaluations.updateContext.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retries an unsafe request once when the server returns csrf_invalid', async () => {
    const firstCsrfToken = 'csrf-token-one-1234567890abcdef123456';
    const secondCsrfToken = 'csrf-token-two-1234567890abcdef123456';
    mockBrowserClient.auth.csrf
      .mockResolvedValueOnce(contractResponse({ csrfToken: firstCsrfToken }))
      .mockResolvedValueOnce(contractResponse({ csrfToken: secondCsrfToken }));
    mockBrowserClient.evaluations.updateContext
      .mockResolvedValueOnce(
        contractResponse(
          {
            statusCode: 403,
            message: 'A valid CSRF token is required.',
            code: 'csrf_invalid',
            errors: []
          },
          403
        )
      )
      .mockResolvedValueOnce(contractResponse(evaluationResponse()));

    const { updateEvaluationContext } = await import('../lib/client-api');

    await expect(
      updateEvaluationContext('evaluation_1', {
        name: 'Updated assessment',
        country: 'South Africa',
        businessCategoryMain: 'Manufacturing',
        businessCategorySubcategory: 'Food products',
        extendedNaceCode: '10.11',
        extendedNaceLabel: '10.11 Processing and preserving of meat',
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

    expect(mockBrowserClient.auth.csrf).toHaveBeenCalledTimes(2);
    expect(mockBrowserClient.evaluations.updateContext).toHaveBeenCalledTimes(2);
    expect(mockBrowserClient.evaluations.updateContext.mock.calls[0]?.[0]).toMatchObject({
      params: { id: 'evaluation_1' },
      headers: { 'x-csrf-token': firstCsrfToken }
    });
    expect(mockBrowserClient.evaluations.updateContext.mock.calls[1]?.[0]).toMatchObject({
      params: { id: 'evaluation_1' },
      headers: { 'x-csrf-token': secondCsrfToken }
    });
  });

  it('does not replay a generic forbidden mutation', async () => {
    mockBrowserClient.auth.csrf.mockResolvedValueOnce(
      contractResponse({ csrfToken: 'csrf-token-1234567890abcdef123456' })
    );
    mockBrowserClient.evaluations.updateContext.mockResolvedValueOnce(
      contractResponse(
        {
          statusCode: 403,
          message: 'You do not have permission to modify this evaluation.',
          code: 'forbidden',
          errors: []
        },
        403
      )
    );

    const { updateEvaluationContext } = await import('../lib/client-api');

    await expect(
      updateEvaluationContext('evaluation_1', {
        name: 'Updated assessment',
        country: 'South Africa',
        businessCategoryMain: 'Manufacturing',
        businessCategorySubcategory: 'Food products',
        extendedNaceCode: '10.11',
        extendedNaceLabel: '10.11 Processing and preserving of meat',
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

    expect(mockBrowserClient.auth.csrf).toHaveBeenCalledTimes(1);
    expect(mockBrowserClient.evaluations.updateContext).toHaveBeenCalledTimes(1);
  });
});
