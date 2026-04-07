import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import {
  buildDashboard,
  buildImpactSummary,
  buildInitialSummary,
  buildReportResponse,
  getScoringVersionInfo,
  scoreFinancialAnswers,
  scoreStage1TopicAnswer,
  scoreStage2OpportunityAnswer,
  scoreStage2RiskAnswer
} from '@packages/scoring';
import type {
  EvaluationContextPayload,
  ImpactDimensionLevel,
  RecommendationActionStatus,
  ReportResponse,
  SessionUser
} from '@packages/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EvaluationsService } from '../src/modules/evaluations/evaluations.service';

const currentUser: SessionUser = {
  id: 'user_owner',
  email: 'owner@example.com',
  name: 'Owner User',
  role: 'owner'
};

function createService(prismaOverrides: Record<string, unknown>) {
  const auditService = {
    log: vi.fn()
  };

  const service = new EvaluationsService(prismaOverrides as never, auditService as never);

  return {
    service,
    auditService
  };
}

function buildEvaluationStateFixture(
  overrides: Partial<{
    currentStage: EvaluationContextPayload['currentStage'];
    recommendationAction: {
      recommendationId: string;
      status: RecommendationActionStatus;
      ownerNote: string | null;
      updatedAt: Date;
    } | null;
    revisionId: string | null;
    revisionNumber: number;
    roiLevel:
      | 'not_evaluated'
      | 'below_industry_average'
      | 'average_or_no_benchmark'
      | 'above_industry_average';
    riskImpact: ImpactDimensionLevel;
  }> = {}
) {
  const now = new Date('2026-04-07T08:00:00.000Z');
  const versionInfo = getScoringVersionInfo();
  const context: EvaluationContextPayload = {
    name: 'EcoGrid Pilot',
    country: 'South Africa',
    naceDivision: 'A',
    offeringType: 'product',
    launched: true,
    currentStage: overrides.currentStage ?? 'validation',
    innovationApproach: 'disruptive'
  };

  const financialPayload = {
    roiLevel: overrides.roiLevel ?? 'below_industry_average',
    sensitivityLevel: 'high_volatility' as const,
    uspLevel: 'no_usp' as const,
    marketGrowthLevel: 'shrinking' as const
  };
  const financial = scoreFinancialAnswers(financialPayload);
  const stage1Topic = scoreStage1TopicAnswer({
    topicCode: 'E1',
    applicable: true,
    magnitude: 'high',
    scale: 'high',
    irreversibility: 'high',
    likelihood: 'very_likely',
    evidenceBasis: 'measured',
    evidenceNote: 'Utility meter exports'
  });
  const stage2Risk = scoreStage2RiskAnswer({
    riskCode: 'climate_policy_risk',
    applicable: true,
    probability: 'very_likely',
    impact: overrides.riskImpact ?? 'high',
    evidenceBasis: 'estimated',
    evidenceNote: 'Exposure based on current logistics footprint'
  });
  const stage2Opportunity = scoreStage2OpportunityAnswer({
    opportunityCode: 'climate_transition_opportunity',
    applicable: true,
    likelihood: 'very_likely',
    impact: 'high',
    evidenceBasis: 'estimated',
    evidenceNote: 'Demand from tenders with sustainability weighting'
  });

  const initialSummary = buildInitialSummary(context);
  const dashboard = buildDashboard(
    'evaluation_1',
    initialSummary,
    financial,
    [stage1Topic],
    [stage2Risk],
    [stage2Opportunity]
  );

  return {
    id: 'evaluation_1',
    userId: currentUser.id,
    name: context.name,
    country: context.country,
    naceDivision: context.naceDivision,
    offeringType: context.offeringType,
    launched: context.launched,
    currentStage: context.currentStage,
    innovationApproach: context.innovationApproach,
    status: 'in_progress' as const,
    currentStep: 'dashboard' as const,
    currentRevisionId: overrides.revisionId ?? null,
    currentRevisionNumber: overrides.revisionNumber ?? 3,
    scoringVersion: versionInfo.scoringVersion,
    catalogVersion: versionInfo.catalogVersion,
    completedAt: null,
    archivedAt: null,
    lastScoredAt: now,
    financialTotal: dashboard.financialTotal,
    riskOverall: dashboard.riskOverall,
    opportunityOverall: dashboard.opportunityOverall,
    confidenceBand: dashboard.confidenceBand,
    relevantTopicCount: dashboard.materialAlerts.filter((item) => item.priorityBand === 'relevant')
      .length,
    highPriorityTopicCount: dashboard.materialAlerts.filter(
      (item) => item.priorityBand === 'high_priority'
    ).length,
    createdAt: now,
    updatedAt: now,
    artifacts: [],
    recommendationActions: overrides.recommendationAction ? [overrides.recommendationAction] : [],
    stage1Financial: {
      ...financialPayload,
      totalScore: financial.totalScore
    },
    stage1TopicAnswers: [
      {
        topicCode: stage1Topic.topicCode,
        applicable: stage1Topic.applicable,
        magnitude: stage1Topic.magnitude,
        scale: stage1Topic.scale,
        irreversibility: stage1Topic.irreversibility,
        likelihood: stage1Topic.likelihood,
        evidenceBasis: stage1Topic.evidenceBasis,
        evidenceNote: stage1Topic.evidenceNote,
        impactScore: stage1Topic.impactScore,
        priorityBand: stage1Topic.priorityBand
      }
    ],
    stage2RiskAnswers: [
      {
        riskCode: stage2Risk.riskCode,
        applicable: stage2Risk.applicable,
        probability: stage2Risk.probability,
        impact: stage2Risk.impact,
        evidenceBasis: stage2Risk.evidenceBasis,
        evidenceNote: stage2Risk.evidenceNote,
        ratingLabel: stage2Risk.ratingLabel,
        ratingScore: stage2Risk.ratingScore
      }
    ],
    stage2OpportunityAnswers: [
      {
        opportunityCode: stage2Opportunity.opportunityCode,
        applicable: stage2Opportunity.applicable,
        likelihood: stage2Opportunity.likelihood,
        impact: stage2Opportunity.impact,
        evidenceBasis: stage2Opportunity.evidenceBasis,
        evidenceNote: stage2Opportunity.evidenceNote,
        ratingLabel: stage2Opportunity.ratingLabel,
        ratingScore: stage2Opportunity.ratingScore
      }
    ]
  };
}

function buildReportFixture(
  state: ReturnType<typeof buildEvaluationStateFixture>,
  revisionNumber: number
) {
  const initialSummary = buildInitialSummary({
    name: state.name,
    country: state.country,
    naceDivision: state.naceDivision,
    offeringType: state.offeringType,
    launched: state.launched,
    currentStage: state.currentStage,
    innovationApproach: state.innovationApproach
  });

  const financial = state.stage1Financial
    ? scoreFinancialAnswers({
        roiLevel: state.stage1Financial.roiLevel,
        sensitivityLevel: state.stage1Financial.sensitivityLevel,
        uspLevel: state.stage1Financial.uspLevel,
        marketGrowthLevel: state.stage1Financial.marketGrowthLevel
      })
    : null;
  const topics = state.stage1TopicAnswers.map((item) =>
    scoreStage1TopicAnswer({
      topicCode: item.topicCode,
      applicable: item.applicable,
      magnitude: item.magnitude,
      scale: item.scale,
      irreversibility: item.irreversibility,
      likelihood: item.likelihood,
      evidenceBasis: item.evidenceBasis,
      evidenceNote: item.evidenceNote
    })
  );
  const risks = state.stage2RiskAnswers.map((item) =>
    scoreStage2RiskAnswer({
      riskCode: item.riskCode,
      applicable: item.applicable,
      probability: item.probability,
      impact: item.impact,
      evidenceBasis: item.evidenceBasis,
      evidenceNote: item.evidenceNote
    })
  );
  const opportunities = state.stage2OpportunityAnswers.map((item) =>
    scoreStage2OpportunityAnswer({
      opportunityCode: item.opportunityCode,
      applicable: item.applicable,
      likelihood: item.likelihood,
      impact: item.impact,
      evidenceBasis: item.evidenceBasis,
      evidenceNote: item.evidenceNote
    })
  );
  const dashboard = buildDashboard(state.id, initialSummary, financial, topics, risks, opportunities);
  const actionsById = new Map(
    state.recommendationActions.map((action) => [
      action.recommendationId,
      {
        status: action.status,
        ownerNote: action.ownerNote,
        updatedAt: action.updatedAt.toISOString()
      }
    ])
  );
  const dashboardWithActions: ReportResponse['dashboard'] = {
    ...dashboard,
    recommendations: dashboard.recommendations.map((recommendation) => ({
      ...recommendation,
      action: actionsById.get(recommendation.id)
        ? {
            recommendationId: recommendation.id,
            ...actionsById.get(recommendation.id)!
          }
        : null
    }))
  };
  const impactSummary = buildImpactSummary(initialSummary, topics, risks, opportunities);
  const versionInfo = getScoringVersionInfo();
  const detail = {
    id: state.id,
    name: state.name,
    country: state.country,
    naceDivision: state.naceDivision,
    offeringType: state.offeringType,
    launched: state.launched,
    currentStage: state.currentStage,
    innovationApproach: state.innovationApproach,
    status: state.status,
    currentStep: state.currentStep,
    financialTotal: dashboardWithActions.financialTotal,
    riskOverall: dashboardWithActions.riskOverall,
    opportunityOverall: dashboardWithActions.opportunityOverall,
    confidenceBand: dashboardWithActions.confidenceBand,
    currentRevisionNumber: revisionNumber,
    scoringVersionInfo: versionInfo,
    lastScoredAt: state.lastScoredAt.toISOString(),
    completedAt: null,
    archivedAt: null,
    createdAt: state.createdAt.toISOString(),
    updatedAt: state.updatedAt.toISOString(),
    initialSummary,
    stage1Financial: financial,
    stage1Topics: topics,
    stage2Risks: risks,
    stage2Opportunities: opportunities,
    artifacts: []
  };

  return buildReportResponse({
    evaluation: detail,
    impactSummary,
    dashboard: dashboardWithActions
  });
}

describe('EvaluationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects comparing the same revision number', async () => {
    const prismaService = {
      evaluation: {
        findFirst: vi.fn().mockResolvedValue({ id: 'evaluation_1' })
      }
    };
    const { service } = createService(prismaService);

    await expect(service.compareRevisions(currentUser, 'evaluation_1', 4, 4)).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(prismaService.evaluation.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'evaluation_1',
        userId: currentUser.id
      },
      select: {
        id: true
      }
    });
  });

  it('compares immutable revisions using stored report snapshots', async () => {
    const leftState = buildEvaluationStateFixture({
      currentStage: 'validation',
      revisionNumber: 3,
      roiLevel: 'below_industry_average',
      riskImpact: 'moderate'
    });
    const rightState = buildEvaluationStateFixture({
      currentStage: 'growth_channel_fit',
      revisionNumber: 4,
      roiLevel: 'above_industry_average',
      riskImpact: 'high'
    });
    const leftReport = buildReportFixture(leftState, 3);
    const rightReport = buildReportFixture(rightState, 4);
    const now = new Date('2026-04-07T08:00:00.000Z');
    const versionInfo = getScoringVersionInfo();

    const prismaService = {
      evaluation: {
        findFirst: vi.fn().mockResolvedValue({ id: 'evaluation_1' })
      },
      evaluationRevision: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'revision_3',
            evaluationId: 'evaluation_1',
            revisionNumber: 3,
            status: 'in_progress',
            currentStep: 'impact_summary',
            scoringVersion: versionInfo.scoringVersion,
            catalogVersion: versionInfo.catalogVersion,
            createdAt: now,
            reportSnapshot: leftReport
          },
          {
            id: 'revision_4',
            evaluationId: 'evaluation_1',
            revisionNumber: 4,
            status: 'completed',
            currentStep: 'dashboard',
            scoringVersion: versionInfo.scoringVersion,
            catalogVersion: versionInfo.catalogVersion,
            createdAt: now,
            reportSnapshot: rightReport
          }
        ])
      }
    };

    const { service } = createService(prismaService);
    const result = await service.compareRevisions(currentUser, 'evaluation_1', 3, 4);

    expect(result.leftRevision.revisionNumber).toBe(3);
    expect(result.rightRevision.revisionNumber).toBe(4);
    expect(result.contextChanges).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'currentStage' })])
    );
    expect(result.metricChanges).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'financialTotal' })])
    );
  });

  it('persists recommendation actions and returns a refreshed dashboard view', async () => {
    const initialState = buildEvaluationStateFixture({
      revisionId: null,
      revisionNumber: 3
    });
    const initialReport = buildReportFixture(initialState, 3);
    const recommendationId = initialReport.dashboard.recommendations[0]!.id;
    const refreshedState = buildEvaluationStateFixture({
      revisionId: null,
      revisionNumber: 3,
      recommendationAction: {
        recommendationId,
        status: 'in_progress',
        ownerNote: 'Track this with the operating team.',
        updatedAt: new Date('2026-04-07T08:05:00.000Z')
      }
    });

    const prismaService = {
      evaluation: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce(initialState)
          .mockResolvedValueOnce(refreshedState)
      },
      evaluationRecommendationAction: {
        upsert: vi.fn().mockResolvedValue(undefined)
      }
    };

    const { service, auditService } = createService(prismaService);
    const result = await service.updateRecommendationAction(
      currentUser,
      'evaluation_1',
      recommendationId,
      {
        status: 'in_progress',
        ownerNote: 'Track this with the operating team.'
      }
    );

    expect(prismaService.evaluationRecommendationAction.upsert).toHaveBeenCalledWith({
      where: {
        evaluationId_recommendationId: {
          evaluationId: 'evaluation_1',
          recommendationId
        }
      },
      create: {
        evaluationId: 'evaluation_1',
        recommendationId,
        status: 'in_progress',
        ownerNote: 'Track this with the operating team.',
        updatedByUserId: currentUser.id
      },
      update: {
        status: 'in_progress',
        ownerNote: 'Track this with the operating team.',
        updatedByUserId: currentUser.id
      }
    });
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'evaluation.recommendation_action_updated',
        targetId: 'evaluation_1',
        metadata: expect.objectContaining({
          recommendationId,
          status: 'in_progress'
        })
      })
    );
    expect(result.recommendations.find((item) => item.id === recommendationId)?.action).toEqual(
      expect.objectContaining({
        status: 'in_progress',
        ownerNote: 'Track this with the operating team.'
      })
    );
  });
});
