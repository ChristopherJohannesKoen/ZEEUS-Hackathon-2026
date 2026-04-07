import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  buildDashboard,
  buildImpactSummary,
  buildInitialSummary,
  buildReportResponse,
  getOpportunityCatalog,
  getRiskCatalog,
  getScoringVersionInfo,
  getStageOneTopicCatalog,
  scoreFinancialAnswers,
  scoreStage1TopicAnswer,
  scoreStage2OpportunityAnswer,
  scoreStage2RiskAnswer
} from '@packages/scoring';
import {
  ReportResponseSchema,
  type CreateEvaluationArtifactPayload,
  type CreateEvaluationPayload,
  type DashboardResponse,
  type EvaluationArtifactListResponse,
  type EvaluationContextPayload,
  type EvaluationDetail,
  type EvaluationListItem,
  type EvaluationListResponse,
  type EvaluationRevisionCompareResponse,
  type EvaluationRevisionDetail,
  type EvaluationRevisionListResponse,
  type EvaluationRevisionSummary,
  type ImpactSummaryResponse,
  type ReportResponse,
  type SaveStage1Payload,
  type SaveStage1TopicsPayload,
  type SaveStage2OpportunitiesPayload,
  type SaveStage2Payload,
  type SaveStage2RisksPayload,
  type SdgAlignmentResponse,
  type SessionUser,
  type Stage1FinancialAnswer,
  type Stage1FinancialAnswersPayload,
  type Stage1TopicAnswer,
  type Stage1TopicAnswerInput,
  type Stage2OpportunityAnswer,
  type Stage2OpportunityAnswerInput,
  type Stage2RiskAnswer,
  type Stage2RiskAnswerInput,
  type UpdateRecommendationActionPayload
} from '@packages/shared';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

const topicOrder = new Map(
  getStageOneTopicCatalog().map((item, index) => [item.topicCode, index] as const)
);
const riskOrder = new Map(getRiskCatalog().map((item, index) => [item.riskCode, index] as const));
const opportunityOrder = new Map(
  getOpportunityCatalog().map((item, index) => [item.opportunityCode, index] as const)
);

const defaultFinancialPayload: Stage1FinancialAnswersPayload = {
  roiLevel: 'not_evaluated',
  sensitivityLevel: 'not_evaluated',
  uspLevel: 'not_evaluated',
  marketGrowthLevel: 'not_evaluated'
};

const defaultArtifactsRoot = path.resolve(process.cwd(), '.artifacts');

const artifactSelect = Prisma.validator<Prisma.EvaluationArtifactSelect>()({
  id: true,
  evaluationId: true,
  revisionId: true,
  kind: true,
  status: true,
  filename: true,
  mimeType: true,
  byteSize: true,
  checksumSha256: true,
  requestedAt: true,
  readyAt: true,
  failedAt: true,
  errorMessage: true,
  createdAt: true,
  revision: {
    select: {
      revisionNumber: true
    }
  }
});

const evaluationStateSelect = Prisma.validator<Prisma.EvaluationSelect>()({
  id: true,
  userId: true,
  name: true,
  country: true,
  naceDivision: true,
  offeringType: true,
  launched: true,
  currentStage: true,
  innovationApproach: true,
  status: true,
  currentStep: true,
  currentRevisionId: true,
  currentRevisionNumber: true,
  scoringVersion: true,
  catalogVersion: true,
  completedAt: true,
  archivedAt: true,
  lastScoredAt: true,
  financialTotal: true,
  riskOverall: true,
  opportunityOverall: true,
  confidenceBand: true,
  relevantTopicCount: true,
  highPriorityTopicCount: true,
  createdAt: true,
  updatedAt: true,
  artifacts: {
    select: artifactSelect,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
  },
  recommendationActions: {
    select: {
      recommendationId: true,
      status: true,
      ownerNote: true,
      updatedAt: true
    }
  },
  stage1Financial: {
    select: {
      roiLevel: true,
      sensitivityLevel: true,
      uspLevel: true,
      marketGrowthLevel: true,
      totalScore: true
    }
  },
  stage1TopicAnswers: {
    select: {
      topicCode: true,
      applicable: true,
      magnitude: true,
      scale: true,
      irreversibility: true,
      likelihood: true,
      evidenceBasis: true,
      evidenceNote: true,
      impactScore: true,
      priorityBand: true
    }
  },
  stage2RiskAnswers: {
    select: {
      riskCode: true,
      applicable: true,
      probability: true,
      impact: true,
      evidenceBasis: true,
      evidenceNote: true,
      ratingLabel: true,
      ratingScore: true
    }
  },
  stage2OpportunityAnswers: {
    select: {
      opportunityCode: true,
      applicable: true,
      likelihood: true,
      impact: true,
      evidenceBasis: true,
      evidenceNote: true,
      ratingLabel: true,
      ratingScore: true
    }
  }
});

const evaluationRevisionSummarySelect = Prisma.validator<Prisma.EvaluationRevisionSelect>()({
  id: true,
  evaluationId: true,
  revisionNumber: true,
  status: true,
  currentStep: true,
  scoringVersion: true,
  catalogVersion: true,
  createdAt: true
});

type EvaluationStateRecord = Prisma.EvaluationGetPayload<{
  select: typeof evaluationStateSelect;
}>;

type EvaluationListRecord = Pick<
  EvaluationStateRecord,
  | 'id'
  | 'name'
  | 'country'
  | 'naceDivision'
  | 'currentStage'
  | 'status'
  | 'currentStep'
  | 'financialTotal'
  | 'riskOverall'
  | 'opportunityOverall'
  | 'confidenceBand'
  | 'currentRevisionNumber'
  | 'scoringVersion'
  | 'catalogVersion'
  | 'lastScoredAt'
  | 'completedAt'
  | 'archivedAt'
  | 'createdAt'
  | 'updatedAt'
>;

type EvaluationRevisionSummaryRecord = Prisma.EvaluationRevisionGetPayload<{
  select: typeof evaluationRevisionSummarySelect;
}>;

type DatabaseClient = Prisma.TransactionClient | PrismaService;
type EvaluationArtifactRecord = EvaluationStateRecord['artifacts'][number];
type EvaluationRecommendationActionRecord = EvaluationStateRecord['recommendationActions'][number];
type EvaluationStage1TopicRecord = EvaluationStateRecord['stage1TopicAnswers'][number];
type EvaluationStage2RiskRecord = EvaluationStateRecord['stage2RiskAnswers'][number];
type EvaluationStage2OpportunityRecord = EvaluationStateRecord['stage2OpportunityAnswers'][number];

type BuildOutputsResult = {
  detail: EvaluationDetail;
  impactSummary: ImpactSummaryResponse;
  dashboard: DashboardResponse;
  report: ReportResponse;
};

@Injectable()
export class EvaluationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async listEvaluations(currentUser: SessionUser): Promise<EvaluationListResponse> {
    const evaluations: EvaluationListRecord[] = await this.prismaService.evaluation.findMany({
      where: {
        userId: currentUser.id
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        name: true,
        country: true,
        naceDivision: true,
        currentStage: true,
        status: true,
        currentStep: true,
        financialTotal: true,
        riskOverall: true,
        opportunityOverall: true,
        confidenceBand: true,
        currentRevisionNumber: true,
        scoringVersion: true,
        catalogVersion: true,
        lastScoredAt: true,
        completedAt: true,
        archivedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      items: evaluations.map((evaluation) => this.serializeEvaluationListItem(evaluation))
    };
  }

  async createEvaluation(
    currentUser: SessionUser,
    payload: CreateEvaluationPayload
  ): Promise<EvaluationDetail> {
    const result = await this.prismaService.$transaction(async (transaction) => {
      const created = await transaction.evaluation.create({
        data: {
          userId: currentUser.id,
          ...payload,
          status: 'draft',
          currentStep: 'summary'
        },
        select: {
          id: true
        }
      });

      const financial = scoreFinancialAnswers(defaultFinancialPayload);
      await transaction.stage1FinancialAnswer.create({
        data: {
          evaluationId: created.id,
          ...defaultFinancialPayload,
          totalScore: financial.totalScore
        }
      });

      await transaction.stage1TopicAnswer.createMany({
        data: getStageOneTopicCatalog().map((topic) => ({
          evaluationId: created.id,
          topicCode: topic.topicCode,
          applicable: false,
          magnitude: 'na',
          scale: 'na',
          irreversibility: 'na',
          likelihood: 'na',
          evidenceBasis: 'assumed',
          evidenceNote: null,
          impactScore: 0,
          priorityBand: 'not_applicable'
        }))
      });

      await transaction.stage2RiskAnswer.createMany({
        data: getRiskCatalog().map((risk) => ({
          evaluationId: created.id,
          riskCode: risk.riskCode,
          applicable: false,
          probability: 'na',
          impact: 'na',
          evidenceBasis: 'assumed',
          evidenceNote: null,
          ratingLabel: 'neutral',
          ratingScore: 0
        }))
      });

      await transaction.stage2OpportunityAnswer.createMany({
        data: getOpportunityCatalog().map((opportunity) => ({
          evaluationId: created.id,
          opportunityCode: opportunity.opportunityCode,
          applicable: false,
          likelihood: 'na',
          impact: 'na',
          evidenceBasis: 'assumed',
          evidenceNote: null,
          ratingLabel: 'neutral',
          ratingScore: 0
        }))
      });

      return this.persistRevisionSnapshot(transaction, created.id, currentUser.id);
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.created',
      targetType: 'evaluation',
      targetId: result.detail.id
    });
    await this.logRevisionCreated(
      currentUser.id,
      result.detail.id,
      result.revisionId,
      result.revisionNumber
    );

    return result.detail;
  }

  async getEvaluation(currentUser: SessionUser, evaluationId: string): Promise<EvaluationDetail> {
    const report = await this.getCurrentReport(currentUser, evaluationId);
    return report.evaluation;
  }

  async updateContext(
    currentUser: SessionUser,
    evaluationId: string,
    payload: EvaluationContextPayload
  ): Promise<EvaluationDetail> {
    const result = await this.prismaService.$transaction(async (transaction) => {
      await this.assertEvaluationEditable(transaction, evaluationId, currentUser.id);
      await transaction.evaluation.update({
        where: { id: evaluationId },
        data: {
          ...payload,
          status: 'draft',
          currentStep: 'summary',
          completedAt: null,
          archivedAt: null
        }
      });

      return this.persistRevisionSnapshot(transaction, evaluationId, currentUser.id);
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.context_updated',
      targetType: 'evaluation',
      targetId: evaluationId
    });
    await this.logRevisionCreated(
      currentUser.id,
      evaluationId,
      result.revisionId,
      result.revisionNumber
    );

    return result.detail;
  }

  async getSummary(currentUser: SessionUser, evaluationId: string) {
    const report = await this.getCurrentReport(currentUser, evaluationId);
    return report.evaluation.initialSummary;
  }

  async saveStage1(
    currentUser: SessionUser,
    evaluationId: string,
    payload: SaveStage1Payload
  ): Promise<EvaluationDetail> {
    const result = await this.prismaService.$transaction(async (transaction) => {
      await this.assertEvaluationEditable(transaction, evaluationId, currentUser.id);

      const scoredFinancial = scoreFinancialAnswers(payload.financial);
      await transaction.stage1FinancialAnswer.upsert({
        where: {
          evaluationId
        },
        create: {
          evaluationId,
          ...payload.financial,
          totalScore: scoredFinancial.totalScore
        },
        update: {
          ...payload.financial,
          totalScore: scoredFinancial.totalScore
        }
      });

      const scoredTopics = payload.topics.map((item) => scoreStage1TopicAnswer(item));
      for (const item of scoredTopics) {
        await transaction.stage1TopicAnswer.upsert({
          where: {
            evaluationId_topicCode: {
              evaluationId,
              topicCode: item.topicCode
            }
          },
          create: {
            evaluationId,
            topicCode: item.topicCode,
            applicable: item.applicable,
            magnitude: item.magnitude,
            scale: item.scale,
            irreversibility: item.irreversibility,
            likelihood: item.likelihood,
            evidenceBasis: item.evidenceBasis,
            evidenceNote: item.evidenceNote ?? null,
            impactScore: item.impactScore,
            priorityBand: item.priorityBand
          },
          update: {
            applicable: item.applicable,
            magnitude: item.magnitude,
            scale: item.scale,
            irreversibility: item.irreversibility,
            likelihood: item.likelihood,
            evidenceBasis: item.evidenceBasis,
            evidenceNote: item.evidenceNote ?? null,
            impactScore: item.impactScore,
            priorityBand: item.priorityBand
          }
        });
      }

      await transaction.evaluation.update({
        where: { id: evaluationId },
        data: {
          currentStep: 'stage_2',
          status: 'in_progress',
          completedAt: null,
          archivedAt: null
        }
      });

      return this.persistRevisionSnapshot(transaction, evaluationId, currentUser.id);
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.stage_1_saved',
      targetType: 'evaluation',
      targetId: evaluationId,
      metadata: {
        section: 'combined'
      }
    });
    await this.logRevisionCreated(
      currentUser.id,
      evaluationId,
      result.revisionId,
      result.revisionNumber
    );

    return result.detail;
  }

  async saveStage1Financial(
    currentUser: SessionUser,
    evaluationId: string,
    payload: Stage1FinancialAnswersPayload
  ): Promise<Stage1FinancialAnswer> {
    const state = await this.getOwnedEvaluationState(
      this.prismaService,
      evaluationId,
      currentUser.id
    );
    const detail = await this.saveStage1(currentUser, evaluationId, {
      financial: payload,
      topics: state.stage1TopicAnswers.map((item: EvaluationStage1TopicRecord) =>
        this.toStage1TopicInput(item)
      )
    });

    if (!detail.stage1Financial) {
      throw new NotFoundException('Stage I financial answers are unavailable.');
    }

    return detail.stage1Financial;
  }

  async saveStage1Topics(
    currentUser: SessionUser,
    evaluationId: string,
    payload: SaveStage1TopicsPayload
  ): Promise<{ items: Stage1TopicAnswer[] }> {
    const state = await this.getOwnedEvaluationState(
      this.prismaService,
      evaluationId,
      currentUser.id
    );
    const detail = await this.saveStage1(currentUser, evaluationId, {
      financial: state.stage1Financial
        ? {
            roiLevel: state.stage1Financial.roiLevel,
            sensitivityLevel: state.stage1Financial.sensitivityLevel,
            uspLevel: state.stage1Financial.uspLevel,
            marketGrowthLevel: state.stage1Financial.marketGrowthLevel
          }
        : defaultFinancialPayload,
      topics: payload.items
    });

    return {
      items: detail.stage1Topics
    };
  }

  async saveStage2(
    currentUser: SessionUser,
    evaluationId: string,
    payload: SaveStage2Payload
  ): Promise<EvaluationDetail> {
    const result = await this.prismaService.$transaction(async (transaction) => {
      await this.assertEvaluationEditable(transaction, evaluationId, currentUser.id);

      const scoredRisks = payload.risks.map((item) => scoreStage2RiskAnswer(item));
      for (const item of scoredRisks) {
        await transaction.stage2RiskAnswer.upsert({
          where: {
            evaluationId_riskCode: {
              evaluationId,
              riskCode: item.riskCode
            }
          },
          create: {
            evaluationId,
            riskCode: item.riskCode,
            applicable: item.applicable,
            probability: item.probability,
            impact: item.impact,
            evidenceBasis: item.evidenceBasis,
            evidenceNote: item.evidenceNote ?? null,
            ratingLabel: item.ratingLabel,
            ratingScore: item.ratingScore
          },
          update: {
            applicable: item.applicable,
            probability: item.probability,
            impact: item.impact,
            evidenceBasis: item.evidenceBasis,
            evidenceNote: item.evidenceNote ?? null,
            ratingLabel: item.ratingLabel,
            ratingScore: item.ratingScore
          }
        });
      }

      const scoredOpportunities = payload.opportunities.map((item) =>
        scoreStage2OpportunityAnswer(item)
      );
      for (const item of scoredOpportunities) {
        await transaction.stage2OpportunityAnswer.upsert({
          where: {
            evaluationId_opportunityCode: {
              evaluationId,
              opportunityCode: item.opportunityCode
            }
          },
          create: {
            evaluationId,
            opportunityCode: item.opportunityCode,
            applicable: item.applicable,
            likelihood: item.likelihood,
            impact: item.impact,
            evidenceBasis: item.evidenceBasis,
            evidenceNote: item.evidenceNote ?? null,
            ratingLabel: item.ratingLabel,
            ratingScore: item.ratingScore
          },
          update: {
            applicable: item.applicable,
            likelihood: item.likelihood,
            impact: item.impact,
            evidenceBasis: item.evidenceBasis,
            evidenceNote: item.evidenceNote ?? null,
            ratingLabel: item.ratingLabel,
            ratingScore: item.ratingScore
          }
        });
      }

      await transaction.evaluation.update({
        where: { id: evaluationId },
        data: {
          currentStep: 'impact_summary',
          status: 'in_progress',
          completedAt: null,
          archivedAt: null
        }
      });

      return this.persistRevisionSnapshot(transaction, evaluationId, currentUser.id);
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.stage_2_saved',
      targetType: 'evaluation',
      targetId: evaluationId,
      metadata: {
        section: 'combined'
      }
    });
    await this.logRevisionCreated(
      currentUser.id,
      evaluationId,
      result.revisionId,
      result.revisionNumber
    );

    return result.detail;
  }

  async saveStage2Risks(
    currentUser: SessionUser,
    evaluationId: string,
    payload: SaveStage2RisksPayload
  ): Promise<{ items: Stage2RiskAnswer[] }> {
    const state = await this.getOwnedEvaluationState(
      this.prismaService,
      evaluationId,
      currentUser.id
    );
    const detail = await this.saveStage2(currentUser, evaluationId, {
      risks: payload.items,
      opportunities: state.stage2OpportunityAnswers.map((item: EvaluationStage2OpportunityRecord) =>
        this.toStage2OpportunityInput(item)
      )
    });

    return {
      items: detail.stage2Risks
    };
  }

  async saveStage2Opportunities(
    currentUser: SessionUser,
    evaluationId: string,
    payload: SaveStage2OpportunitiesPayload
  ): Promise<{ items: Stage2OpportunityAnswer[] }> {
    const state = await this.getOwnedEvaluationState(
      this.prismaService,
      evaluationId,
      currentUser.id
    );
    const detail = await this.saveStage2(currentUser, evaluationId, {
      risks: state.stage2RiskAnswers.map((item: EvaluationStage2RiskRecord) =>
        this.toStage2RiskInput(item)
      ),
      opportunities: payload.items
    });

    return {
      items: detail.stage2Opportunities
    };
  }

  async completeEvaluation(
    currentUser: SessionUser,
    evaluationId: string
  ): Promise<EvaluationDetail> {
    const result = await this.prismaService.$transaction(async (transaction) => {
      const evaluation = await this.getOwnedEvaluationMetadata(
        transaction,
        evaluationId,
        currentUser.id
      );

      if (evaluation.status === 'archived') {
        throw new BadRequestException('Archived evaluations must be unarchived before completion.');
      }

      if (evaluation.status === 'completed') {
        return {
          detail: await this.readCurrentDetail(transaction, evaluationId, currentUser.id),
          revisionId: null,
          revisionNumber: null
        };
      }

      await transaction.evaluation.update({
        where: { id: evaluationId },
        data: {
          status: 'completed',
          currentStep: 'dashboard',
          completedAt: new Date(),
          archivedAt: null
        }
      });

      const persisted = await this.persistRevisionSnapshot(
        transaction,
        evaluationId,
        currentUser.id
      );
      return persisted;
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.completed',
      targetType: 'evaluation',
      targetId: evaluationId
    });
    await this.logRevisionCreated(
      currentUser.id,
      evaluationId,
      result.revisionId,
      result.revisionNumber
    );

    return result.detail;
  }

  async reopenEvaluation(
    currentUser: SessionUser,
    evaluationId: string
  ): Promise<EvaluationDetail> {
    const result = await this.prismaService.$transaction(async (transaction) => {
      await this.assertEvaluationOwnership(transaction, evaluationId, currentUser.id);
      await transaction.evaluation.update({
        where: { id: evaluationId },
        data: {
          status: 'draft',
          currentStep: 'summary',
          completedAt: null,
          archivedAt: null
        }
      });

      const persisted = await this.persistRevisionSnapshot(
        transaction,
        evaluationId,
        currentUser.id
      );
      return persisted;
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.reopened',
      targetType: 'evaluation',
      targetId: evaluationId
    });
    await this.logRevisionCreated(
      currentUser.id,
      evaluationId,
      result.revisionId,
      result.revisionNumber
    );

    return result.detail;
  }

  async archiveEvaluation(
    currentUser: SessionUser,
    evaluationId: string
  ): Promise<EvaluationDetail> {
    const result = await this.prismaService.$transaction(async (transaction) => {
      const evaluation = await this.getOwnedEvaluationMetadata(
        transaction,
        evaluationId,
        currentUser.id
      );

      if (evaluation.status !== 'completed') {
        throw new BadRequestException('Only completed evaluations can be archived.');
      }

      await transaction.evaluation.update({
        where: { id: evaluationId },
        data: {
          status: 'archived',
          currentStep: 'report',
          archivedAt: new Date()
        }
      });

      const persisted = await this.persistRevisionSnapshot(
        transaction,
        evaluationId,
        currentUser.id
      );
      return persisted;
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.archived',
      targetType: 'evaluation',
      targetId: evaluationId
    });
    await this.logRevisionCreated(
      currentUser.id,
      evaluationId,
      result.revisionId,
      result.revisionNumber
    );

    return result.detail;
  }

  async unarchiveEvaluation(
    currentUser: SessionUser,
    evaluationId: string
  ): Promise<EvaluationDetail> {
    const result = await this.prismaService.$transaction(async (transaction) => {
      const evaluation = await this.getOwnedEvaluationMetadata(
        transaction,
        evaluationId,
        currentUser.id
      );

      if (evaluation.status !== 'archived') {
        throw new BadRequestException('Evaluation is not archived.');
      }

      await transaction.evaluation.update({
        where: { id: evaluationId },
        data: {
          status: 'completed',
          currentStep: 'dashboard',
          archivedAt: null
        }
      });

      const persisted = await this.persistRevisionSnapshot(
        transaction,
        evaluationId,
        currentUser.id
      );
      return persisted;
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.unarchived',
      targetType: 'evaluation',
      targetId: evaluationId
    });
    await this.logRevisionCreated(
      currentUser.id,
      evaluationId,
      result.revisionId,
      result.revisionNumber
    );

    return result.detail;
  }

  async listRevisions(
    currentUser: SessionUser,
    evaluationId: string
  ): Promise<EvaluationRevisionListResponse> {
    await this.assertEvaluationOwnership(this.prismaService, evaluationId, currentUser.id);
    const revisions = await this.prismaService.evaluationRevision.findMany({
      where: {
        evaluationId
      },
      orderBy: [{ revisionNumber: 'desc' }],
      select: evaluationRevisionSummarySelect
    });

    return {
      items: revisions.map((revision: EvaluationRevisionSummaryRecord) =>
        this.serializeRevisionSummary(revision)
      )
    };
  }

  async getRevision(
    currentUser: SessionUser,
    evaluationId: string,
    revisionNumber: number
  ): Promise<EvaluationRevisionDetail> {
    await this.assertEvaluationOwnership(this.prismaService, evaluationId, currentUser.id);
    const revision = await this.prismaService.evaluationRevision.findUnique({
      where: {
        evaluationId_revisionNumber: {
          evaluationId,
          revisionNumber
        }
      },
      select: {
        ...evaluationRevisionSummarySelect,
        reportSnapshot: true
      }
    });

    if (!revision) {
      throw new NotFoundException('Evaluation revision not found.');
    }

    return {
      ...this.serializeRevisionSummary(revision),
      report: ReportResponseSchema.parse(revision.reportSnapshot as unknown)
    };
  }

  async compareRevisions(
    currentUser: SessionUser,
    evaluationId: string,
    leftRevisionNumber: number,
    rightRevisionNumber: number
  ): Promise<EvaluationRevisionCompareResponse> {
    await this.assertEvaluationOwnership(this.prismaService, evaluationId, currentUser.id);

    if (leftRevisionNumber === rightRevisionNumber) {
      throw new BadRequestException('Choose two different revision numbers to compare.');
    }

    const revisions = await this.prismaService.evaluationRevision.findMany({
      where: {
        evaluationId,
        revisionNumber: {
          in: [leftRevisionNumber, rightRevisionNumber]
        }
      },
      select: {
        ...evaluationRevisionSummarySelect,
        reportSnapshot: true
      }
    });

    const leftRevision = revisions.find(
      (item: EvaluationRevisionSummaryRecord & { reportSnapshot: Prisma.JsonValue }) =>
        item.revisionNumber === leftRevisionNumber
    );
    const rightRevision = revisions.find(
      (item: EvaluationRevisionSummaryRecord & { reportSnapshot: Prisma.JsonValue }) =>
        item.revisionNumber === rightRevisionNumber
    );

    if (!leftRevision || !rightRevision) {
      throw new NotFoundException('One or both evaluation revisions were not found.');
    }

    const leftReport = ReportResponseSchema.parse(leftRevision.reportSnapshot as unknown);
    const rightReport = ReportResponseSchema.parse(rightRevision.reportSnapshot as unknown);

    return {
      evaluationId,
      leftRevision: this.serializeRevisionSummary(leftRevision),
      rightRevision: this.serializeRevisionSummary(rightRevision),
      contextChanges: this.buildContextChanges(leftReport, rightReport),
      metricChanges: this.buildMetricChanges(leftReport, rightReport),
      topicChanges: this.buildTopicChanges(leftReport, rightReport),
      riskChanges: this.buildRatedItemChanges(
        leftReport.evaluation.stage2Risks,
        rightReport.evaluation.stage2Risks,
        'riskCode'
      ),
      opportunityChanges: this.buildRatedItemChanges(
        leftReport.evaluation.stage2Opportunities,
        rightReport.evaluation.stage2Opportunities,
        'opportunityCode'
      ),
      recommendationChanges: this.buildRecommendationChanges(leftReport, rightReport)
    };
  }

  async createArtifact(
    currentUser: SessionUser,
    evaluationId: string,
    payload: CreateEvaluationArtifactPayload
  ) {
    const evaluation = await this.getOwnedEvaluationState(
      this.prismaService,
      evaluationId,
      currentUser.id
    );
    const existing = await this.prismaService.evaluationArtifact.findFirst({
      where: {
        evaluationId,
        revisionId: evaluation.currentRevisionId,
        kind: payload.kind,
        status: 'ready'
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: artifactSelect
    });

    if (existing && existing.checksumSha256) {
      const storagePath = this.resolveArtifactStoragePath(
        existing.checksumSha256,
        existing.filename
      );

      try {
        await readFile(storagePath);
        return this.serializeArtifactSummary(existing);
      } catch {
        // Fall through and regenerate if the binary no longer exists on disk.
      }
    }

    const report = await this.getCurrentReportFromState(evaluation);
    const filename = `evaluation-${evaluation.id}-revision-${evaluation.currentRevisionNumber}.${payload.kind}`;
    const pendingArtifact = await this.prismaService.evaluationArtifact.create({
      data: {
        evaluationId,
        revisionId: evaluation.currentRevisionId,
        createdByUserId: currentUser.id,
        kind: payload.kind,
        filename,
        mimeType: payload.kind === 'csv' ? 'text/csv' : 'application/pdf',
        byteSize: 0,
        status: 'pending',
        requestedAt: new Date()
      },
      select: artifactSelect
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'artifact.requested',
      targetType: 'evaluation_artifact',
      targetId: pendingArtifact.id,
      metadata: {
        evaluationId,
        revisionId: evaluation.currentRevisionId,
        kind: payload.kind
      }
    });

    try {
      const content =
        payload.kind === 'csv'
          ? Buffer.from(this.buildCsvReport(report), 'utf8')
          : this.buildPdfReport(report);
      const checksumSha256 = createHash('sha256').update(content).digest('hex');
      const storagePath = this.resolveArtifactStoragePath(checksumSha256, filename);
      await mkdir(path.dirname(storagePath), { recursive: true });
      await writeFile(storagePath, content);

      const readyArtifact = await this.prismaService.evaluationArtifact.update({
        where: {
          id: pendingArtifact.id
        },
        data: {
          status: 'ready',
          byteSize: content.byteLength,
          checksumSha256,
          storageKey: storagePath,
          readyAt: new Date(),
          failedAt: null,
          errorMessage: null
        },
        select: artifactSelect
      });

      await this.auditService.log({
        actorId: currentUser.id,
        action: 'artifact.ready',
        targetType: 'evaluation_artifact',
        targetId: readyArtifact.id,
        metadata: {
          evaluationId,
          revisionId: evaluation.currentRevisionId,
          kind: payload.kind,
          byteSize: content.byteLength
        }
      });

      return this.serializeArtifactSummary(readyArtifact);
    } catch (error) {
      await this.prismaService.evaluationArtifact.update({
        where: {
          id: pendingArtifact.id
        },
        data: {
          status: 'failed',
          failedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Artifact generation failed.'
        }
      });

      await this.auditService.log({
        actorId: currentUser.id,
        action: 'artifact.failed',
        targetType: 'evaluation_artifact',
        targetId: pendingArtifact.id,
        metadata: {
          evaluationId,
          revisionId: evaluation.currentRevisionId,
          kind: payload.kind,
          error: error instanceof Error ? error.message : 'Artifact generation failed.'
        }
      });

      throw error;
    }
  }

  async listArtifacts(
    currentUser: SessionUser,
    evaluationId: string
  ): Promise<EvaluationArtifactListResponse> {
    await this.assertEvaluationOwnership(this.prismaService, evaluationId, currentUser.id);
    const artifacts = await this.prismaService.evaluationArtifact.findMany({
      where: {
        evaluationId
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: artifactSelect
    });

    return {
      items: artifacts.map((artifact: EvaluationArtifactRecord) =>
        this.serializeArtifactSummary(artifact)
      )
    };
  }

  async getArtifact(currentUser: SessionUser, evaluationId: string, artifactId: string) {
    const artifact = await this.getOwnedArtifactRecord(evaluationId, artifactId, currentUser.id);
    return this.serializeArtifactSummary(artifact);
  }

  async downloadArtifact(
    currentUser: SessionUser,
    evaluationId: string,
    artifactId: string,
    response: Response
  ) {
    const artifact = await this.getOwnedArtifactRecord(evaluationId, artifactId, currentUser.id);

    if (artifact.status !== 'ready' || !artifact.checksumSha256) {
      throw new BadRequestException('The requested artifact is not ready yet.');
    }

    const storagePath = this.resolveArtifactStoragePath(artifact.checksumSha256, artifact.filename);
    const binary = await readFile(storagePath);
    response.setHeader('Content-Type', artifact.mimeType);
    response.setHeader('Content-Disposition', `attachment; filename="${artifact.filename}"`);
    response.write(binary);
    response.end();
  }

  async updateRecommendationAction(
    currentUser: SessionUser,
    evaluationId: string,
    recommendationId: string,
    payload: UpdateRecommendationActionPayload
  ): Promise<DashboardResponse> {
    const evaluation = await this.getOwnedEvaluationState(
      this.prismaService,
      evaluationId,
      currentUser.id
    );
    const report = await this.getCurrentReportFromState(evaluation);
    const recommendation = report.dashboard.recommendations.find(
      (item) => item.id === recommendationId
    );

    if (!recommendation) {
      throw new NotFoundException('Recommendation not found for this evaluation.');
    }

    await this.prismaService.evaluationRecommendationAction.upsert({
      where: {
        evaluationId_recommendationId: {
          evaluationId,
          recommendationId
        }
      },
      create: {
        evaluationId,
        recommendationId,
        status: payload.status,
        ownerNote: payload.ownerNote ?? null,
        updatedByUserId: currentUser.id
      },
      update: {
        status: payload.status,
        ownerNote: payload.ownerNote ?? null,
        updatedByUserId: currentUser.id
      }
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.recommendation_action_updated',
      targetType: 'evaluation',
      targetId: evaluationId,
      metadata: {
        recommendationId,
        status: payload.status
      }
    });

    const refreshedReport = await this.getCurrentReport(currentUser, evaluationId);
    return refreshedReport.dashboard;
  }

  async getImpactSummary(
    currentUser: SessionUser,
    evaluationId: string
  ): Promise<ImpactSummaryResponse> {
    const report = await this.getCurrentReport(currentUser, evaluationId);
    return report.impactSummary;
  }

  async getSdgAlignment(
    currentUser: SessionUser,
    evaluationId: string
  ): Promise<SdgAlignmentResponse> {
    const report = await this.getCurrentReport(currentUser, evaluationId);
    return report.sdgAlignment;
  }

  async getDashboard(currentUser: SessionUser, evaluationId: string): Promise<DashboardResponse> {
    const report = await this.getCurrentReport(currentUser, evaluationId);
    return report.dashboard;
  }

  async getReport(currentUser: SessionUser, evaluationId: string): Promise<ReportResponse> {
    return this.getCurrentReport(currentUser, evaluationId);
  }

  async exportCsv(currentUser: SessionUser, evaluationId: string, response: Response) {
    const artifact = await this.createArtifact(currentUser, evaluationId, { kind: 'csv' });
    await this.downloadArtifact(currentUser, evaluationId, artifact.id, response);
  }

  async exportPdf(currentUser: SessionUser, evaluationId: string, response: Response) {
    const artifact = await this.createArtifact(currentUser, evaluationId, { kind: 'pdf' });
    await this.downloadArtifact(currentUser, evaluationId, artifact.id, response);
  }

  private async persistRevisionSnapshot(
    client: DatabaseClient,
    evaluationId: string,
    createdByUserId: string
  ) {
    const evaluation = await this.getEvaluationState(client, evaluationId);
    const versionInfo = getScoringVersionInfo();
    const now = new Date();
    const nextRevisionNumber = evaluation.currentRevisionNumber + 1;
    const outputs = this.buildOutputsFromState(evaluation, {
      revisionNumber: nextRevisionNumber,
      scoringVersionInfo: versionInfo,
      lastScoredAt: now.toISOString(),
      updatedAt: now.toISOString()
    });

    const revision = await client.evaluationRevision.create({
      data: {
        evaluationId,
        revisionNumber: nextRevisionNumber,
        status: evaluation.status,
        currentStep: evaluation.currentStep,
        scoringVersion: versionInfo.scoringVersion,
        catalogVersion: versionInfo.catalogVersion,
        detailSnapshot: outputs.detail as Prisma.InputJsonValue,
        impactSummarySnapshot: outputs.impactSummary as Prisma.InputJsonValue,
        dashboardSnapshot: outputs.dashboard as Prisma.InputJsonValue,
        reportSnapshot: outputs.report as Prisma.InputJsonValue,
        createdByUserId
      },
      select: {
        id: true
      }
    });

    await client.evaluation.update({
      where: {
        id: evaluationId
      },
      data: {
        financialTotal: outputs.dashboard.financialTotal,
        riskOverall: outputs.dashboard.riskOverall,
        opportunityOverall: outputs.dashboard.opportunityOverall,
        confidenceBand: outputs.dashboard.confidenceBand,
        relevantTopicCount: outputs.dashboard.materialAlerts.filter(
          (item) => item.priorityBand === 'relevant'
        ).length,
        highPriorityTopicCount: outputs.dashboard.materialAlerts.filter(
          (item) => item.priorityBand === 'high_priority'
        ).length,
        currentRevisionId: revision.id,
        currentRevisionNumber: nextRevisionNumber,
        scoringVersion: versionInfo.scoringVersion,
        catalogVersion: versionInfo.catalogVersion,
        lastScoredAt: now
      }
    });

    return {
      detail: outputs.detail,
      report: outputs.report,
      revisionId: revision.id,
      revisionNumber: nextRevisionNumber
    };
  }

  private buildOutputsFromState(
    evaluation: EvaluationStateRecord,
    overrides?: {
      revisionNumber?: number;
      scoringVersionInfo?: {
        scoringVersion: string;
        catalogVersion: string;
      };
      lastScoredAt?: string | null;
      updatedAt?: string;
    }
  ): BuildOutputsResult {
    const initialSummary = buildInitialSummary(this.toContextPayload(evaluation));
    const stage1Financial = evaluation.stage1Financial
      ? scoreFinancialAnswers({
          roiLevel: evaluation.stage1Financial.roiLevel,
          sensitivityLevel: evaluation.stage1Financial.sensitivityLevel,
          uspLevel: evaluation.stage1Financial.uspLevel,
          marketGrowthLevel: evaluation.stage1Financial.marketGrowthLevel
        })
      : null;
    const stage1Topics = evaluation.stage1TopicAnswers
      .map((item: EvaluationStage1TopicRecord) =>
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
      )
      .sort(
        (left: Stage1TopicAnswer, right: Stage1TopicAnswer) =>
          (topicOrder.get(left.topicCode) ?? Number.MAX_SAFE_INTEGER) -
          (topicOrder.get(right.topicCode) ?? Number.MAX_SAFE_INTEGER)
      );
    const stage2Risks = evaluation.stage2RiskAnswers
      .map((item: EvaluationStage2RiskRecord) =>
        scoreStage2RiskAnswer({
          riskCode: item.riskCode,
          applicable: item.applicable,
          probability: item.probability,
          impact: item.impact,
          evidenceBasis: item.evidenceBasis,
          evidenceNote: item.evidenceNote
        })
      )
      .sort(
        (left: Stage2RiskAnswer, right: Stage2RiskAnswer) =>
          (riskOrder.get(left.riskCode) ?? Number.MAX_SAFE_INTEGER) -
          (riskOrder.get(right.riskCode) ?? Number.MAX_SAFE_INTEGER)
      );
    const stage2Opportunities = evaluation.stage2OpportunityAnswers
      .map((item: EvaluationStage2OpportunityRecord) =>
        scoreStage2OpportunityAnswer({
          opportunityCode: item.opportunityCode,
          applicable: item.applicable,
          likelihood: item.likelihood,
          impact: item.impact,
          evidenceBasis: item.evidenceBasis,
          evidenceNote: item.evidenceNote
        })
      )
      .sort(
        (left: Stage2OpportunityAnswer, right: Stage2OpportunityAnswer) =>
          (opportunityOrder.get(left.opportunityCode) ?? Number.MAX_SAFE_INTEGER) -
          (opportunityOrder.get(right.opportunityCode) ?? Number.MAX_SAFE_INTEGER)
      );
    const dashboard = this.attachRecommendationActionsToDashboard(
      buildDashboard(
        evaluation.id,
        initialSummary,
        stage1Financial,
        stage1Topics,
        stage2Risks,
        stage2Opportunities
      ),
      evaluation.recommendationActions
    );
    const scoringVersionInfo = overrides?.scoringVersionInfo ?? {
      scoringVersion: evaluation.scoringVersion,
      catalogVersion: evaluation.catalogVersion
    };
    const detail: EvaluationDetail = {
      id: evaluation.id,
      name: evaluation.name,
      country: evaluation.country,
      naceDivision: evaluation.naceDivision,
      currentStage: evaluation.currentStage,
      status: evaluation.status,
      currentStep: evaluation.currentStep,
      financialTotal: dashboard.financialTotal,
      riskOverall: dashboard.riskOverall,
      opportunityOverall: dashboard.opportunityOverall,
      confidenceBand: dashboard.confidenceBand,
      currentRevisionNumber: overrides?.revisionNumber ?? evaluation.currentRevisionNumber,
      scoringVersionInfo,
      lastScoredAt:
        overrides?.lastScoredAt ??
        (evaluation.lastScoredAt ? evaluation.lastScoredAt.toISOString() : null),
      completedAt: evaluation.completedAt ? evaluation.completedAt.toISOString() : null,
      archivedAt: evaluation.archivedAt ? evaluation.archivedAt.toISOString() : null,
      createdAt: evaluation.createdAt.toISOString(),
      updatedAt: overrides?.updatedAt ?? evaluation.updatedAt.toISOString(),
      offeringType: evaluation.offeringType,
      launched: evaluation.launched,
      innovationApproach: evaluation.innovationApproach,
      initialSummary,
      stage1Financial,
      stage1Topics,
      stage2Risks,
      stage2Opportunities,
      artifacts: evaluation.artifacts.map((item: EvaluationArtifactRecord) =>
        this.serializeArtifactSummary(item)
      )
    };
    const impactSummary = buildImpactSummary(
      initialSummary,
      stage1Topics,
      stage2Risks,
      stage2Opportunities
    );
    const report = buildReportResponse({
      evaluation: detail,
      impactSummary,
      dashboard
    });

    return {
      detail,
      impactSummary,
      dashboard,
      report
    };
  }

  private async getCurrentReport(
    currentUser: SessionUser,
    evaluationId: string
  ): Promise<ReportResponse> {
    const evaluation = await this.getOwnedEvaluationState(
      this.prismaService,
      evaluationId,
      currentUser.id
    );
    return this.getCurrentReportFromState(evaluation);
  }

  private async getCurrentReportFromState(
    evaluation: EvaluationStateRecord
  ): Promise<ReportResponse> {
    if (!evaluation.currentRevisionId) {
      return this.buildOutputsFromState(evaluation).report;
    }

    const revision = await this.prismaService.evaluationRevision.findUnique({
      where: {
        id: evaluation.currentRevisionId
      },
      select: {
        reportSnapshot: true
      }
    });

    if (!revision) {
      return this.buildOutputsFromState(evaluation).report;
    }

    const report = ReportResponseSchema.parse(revision.reportSnapshot as unknown);
    const dashboard = this.attachRecommendationActionsToDashboard(
      report.dashboard,
      evaluation.recommendationActions
    );
    return {
      ...report,
      evaluation: {
        ...report.evaluation,
        artifacts: evaluation.artifacts.map((item: EvaluationArtifactRecord) =>
          this.serializeArtifactSummary(item)
        )
      },
      dashboard
    };
  }

  private async readCurrentDetail(client: DatabaseClient, evaluationId: string, userId: string) {
    const evaluation = await this.getOwnedEvaluationState(client, evaluationId, userId);
    const report = await this.getCurrentReportFromState(evaluation);
    return report.evaluation;
  }

  private async assertEvaluationEditable(
    client: DatabaseClient,
    evaluationId: string,
    userId: string
  ) {
    const evaluation = await this.getOwnedEvaluationMetadata(client, evaluationId, userId);

    if (evaluation.status === 'completed') {
      throw new BadRequestException('Completed evaluations must be reopened before editing.');
    }

    if (evaluation.status === 'archived') {
      throw new BadRequestException('Archived evaluations must be unarchived before editing.');
    }

    return evaluation;
  }

  private async assertEvaluationOwnership(
    client: DatabaseClient,
    evaluationId: string,
    userId: string
  ) {
    const evaluation = await client.evaluation.findFirst({
      where: {
        id: evaluationId,
        userId
      },
      select: {
        id: true
      }
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluation not found.');
    }
  }

  private async getOwnedEvaluationMetadata(
    client: DatabaseClient,
    evaluationId: string,
    userId: string
  ) {
    const evaluation = await client.evaluation.findFirst({
      where: {
        id: evaluationId,
        userId
      },
      select: {
        id: true,
        status: true
      }
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluation not found.');
    }

    return evaluation;
  }

  private async getOwnedEvaluationState(
    client: DatabaseClient,
    evaluationId: string,
    userId: string
  ) {
    const evaluation = await client.evaluation.findFirst({
      where: {
        id: evaluationId,
        userId
      },
      select: evaluationStateSelect
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluation not found.');
    }

    return evaluation;
  }

  private async getEvaluationState(client: DatabaseClient, evaluationId: string) {
    const evaluation = await client.evaluation.findUnique({
      where: {
        id: evaluationId
      },
      select: evaluationStateSelect
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluation not found.');
    }

    return evaluation;
  }

  private async getOwnedArtifactRecord(evaluationId: string, artifactId: string, userId: string) {
    const artifact = await this.prismaService.evaluationArtifact.findFirst({
      where: {
        id: artifactId,
        evaluationId,
        evaluation: {
          userId
        }
      },
      select: artifactSelect
    });

    if (!artifact) {
      throw new NotFoundException('Evaluation artifact not found.');
    }

    return artifact;
  }

  private serializeEvaluationListItem(evaluation: EvaluationListRecord): EvaluationListItem {
    return {
      id: evaluation.id,
      name: evaluation.name,
      country: evaluation.country,
      naceDivision: evaluation.naceDivision,
      currentStage: evaluation.currentStage,
      status: evaluation.status,
      currentStep: evaluation.currentStep,
      financialTotal: evaluation.financialTotal,
      riskOverall: Number(evaluation.riskOverall.toFixed(2)),
      opportunityOverall: Number(evaluation.opportunityOverall.toFixed(2)),
      confidenceBand: evaluation.confidenceBand,
      currentRevisionNumber: evaluation.currentRevisionNumber,
      scoringVersionInfo: {
        scoringVersion: evaluation.scoringVersion,
        catalogVersion: evaluation.catalogVersion
      },
      lastScoredAt: evaluation.lastScoredAt ? evaluation.lastScoredAt.toISOString() : null,
      completedAt: evaluation.completedAt ? evaluation.completedAt.toISOString() : null,
      archivedAt: evaluation.archivedAt ? evaluation.archivedAt.toISOString() : null,
      createdAt: evaluation.createdAt.toISOString(),
      updatedAt: evaluation.updatedAt.toISOString()
    };
  }

  private serializeRevisionSummary(
    revision: EvaluationRevisionSummaryRecord
  ): EvaluationRevisionSummary {
    return {
      id: revision.id,
      evaluationId: revision.evaluationId,
      revisionNumber: revision.revisionNumber,
      status: revision.status,
      currentStep: revision.currentStep,
      scoringVersionInfo: {
        scoringVersion: revision.scoringVersion,
        catalogVersion: revision.catalogVersion
      },
      createdAt: revision.createdAt.toISOString()
    };
  }

  private serializeArtifactSummary(
    artifact: EvaluationArtifactRecord
  ): EvaluationDetail['artifacts'][number] {
    return {
      id: artifact.id,
      evaluationId: artifact.evaluationId,
      revisionId: artifact.revisionId,
      revisionNumber: artifact.revision?.revisionNumber ?? null,
      kind: artifact.kind,
      status: artifact.status,
      filename: artifact.filename,
      mimeType: artifact.mimeType,
      byteSize: artifact.byteSize,
      checksumSha256: artifact.checksumSha256,
      requestedAt: artifact.requestedAt.toISOString(),
      readyAt: artifact.readyAt ? artifact.readyAt.toISOString() : null,
      failedAt: artifact.failedAt ? artifact.failedAt.toISOString() : null,
      errorMessage: artifact.errorMessage,
      createdAt: artifact.createdAt.toISOString()
    };
  }

  private attachRecommendationActionsToDashboard(
    dashboard: DashboardResponse,
    actions: EvaluationRecommendationActionRecord[]
  ): DashboardResponse {
    const actionsByRecommendationId = new Map(
      actions.map((action) => [
        action.recommendationId,
        {
          recommendationId: action.recommendationId,
          status: action.status,
          ownerNote: action.ownerNote,
          updatedAt: action.updatedAt.toISOString()
        }
      ])
    );

    return {
      ...dashboard,
      recommendations: dashboard.recommendations.map((recommendation) => ({
        ...recommendation,
        action: actionsByRecommendationId.get(recommendation.id) ?? null
      }))
    };
  }

  private resolveArtifactStoragePath(checksumSha256: string, filename: string) {
    const artifactsRoot = process.env.ARTIFACTS_DIR
      ? path.resolve(process.env.ARTIFACTS_DIR)
      : defaultArtifactsRoot;
    const extension = path.extname(filename);
    return path.join(artifactsRoot, checksumSha256.slice(0, 2), `${checksumSha256}${extension}`);
  }

  private async logRevisionCreated(
    actorId: string,
    evaluationId: string,
    revisionId: string | null,
    revisionNumber: number | null
  ) {
    if (!revisionId || !revisionNumber) {
      return;
    }

    await this.auditService.log({
      actorId,
      action: 'evaluation.revision_created',
      targetType: 'evaluation_revision',
      targetId: revisionId,
      metadata: {
        evaluationId,
        revisionNumber
      }
    });
  }

  private buildContextChanges(leftReport: ReportResponse, rightReport: ReportResponse) {
    const fields = [
      ['name', 'Startup name'],
      ['country', 'Country'],
      ['naceDivision', 'NACE division'],
      ['offeringType', 'Offering type'],
      ['launched', 'Launched'],
      ['currentStage', 'Current stage'],
      ['innovationApproach', 'Innovation approach'],
      ['status', 'Lifecycle status']
    ] as const;

    return fields
      .map(([field, label]) => ({
        field,
        label,
        leftValue: String(leftReport.evaluation[field]),
        rightValue: String(rightReport.evaluation[field])
      }))
      .filter((change) => change.leftValue !== change.rightValue);
  }

  private buildMetricChanges(leftReport: ReportResponse, rightReport: ReportResponse) {
    const metrics = [
      [
        'financialTotal',
        'Financial total',
        leftReport.dashboard.financialTotal,
        rightReport.dashboard.financialTotal
      ],
      [
        'riskOverall',
        'Risk overall',
        leftReport.dashboard.riskOverall,
        rightReport.dashboard.riskOverall
      ],
      [
        'opportunityOverall',
        'Opportunity overall',
        leftReport.dashboard.opportunityOverall,
        rightReport.dashboard.opportunityOverall
      ],
      [
        'relevantTopicCount',
        'Relevant topics',
        leftReport.impactSummary.relevantTopics.length,
        rightReport.impactSummary.relevantTopics.length
      ],
      [
        'highPriorityTopicCount',
        'High-priority topics',
        leftReport.impactSummary.highPriorityTopics.length,
        rightReport.impactSummary.highPriorityTopics.length
      ]
    ] as const;

    return metrics
      .map(([field, label, leftValue, rightValue]) => ({
        field,
        label,
        leftValue,
        rightValue,
        delta: Number((rightValue - leftValue).toFixed(2))
      }))
      .filter((change) => change.delta !== 0);
  }

  private buildTopicChanges(leftReport: ReportResponse, rightReport: ReportResponse) {
    const leftByCode = new Map(
      leftReport.evaluation.stage1Topics.map((item) => [item.topicCode, item])
    );
    const rightByCode = new Map(
      rightReport.evaluation.stage1Topics.map((item) => [item.topicCode, item])
    );
    const codes = new Set([...leftByCode.keys(), ...rightByCode.keys()]);

    return [...codes]
      .map((code) => {
        const left = leftByCode.get(code);
        const right = rightByCode.get(code);
        return {
          code,
          title: right?.title ?? left?.title ?? code,
          leftBand: left?.priorityBand ?? null,
          rightBand: right?.priorityBand ?? null,
          leftScore: left?.impactScore ?? null,
          rightScore: right?.impactScore ?? null
        };
      })
      .filter(
        (change) => change.leftBand !== change.rightBand || change.leftScore !== change.rightScore
      );
  }

  private buildRatedItemChanges<
    TKey extends 'riskCode' | 'opportunityCode',
    TItem extends {
      title: string;
      ratingLabel: string;
      ratingScore: number;
    } & Record<TKey, string>
  >(leftItems: TItem[], rightItems: TItem[], keyField: TKey) {
    const leftByCode = new Map(leftItems.map((item) => [String(item[keyField]), item]));
    const rightByCode = new Map(rightItems.map((item) => [String(item[keyField]), item]));
    const codes = new Set([...leftByCode.keys(), ...rightByCode.keys()]);

    return [...codes]
      .map((code) => {
        const left = leftByCode.get(code);
        const right = rightByCode.get(code);
        return {
          code,
          title: right?.title ?? left?.title ?? code,
          leftLabel: left?.ratingLabel ?? null,
          rightLabel: right?.ratingLabel ?? null,
          leftScore: left?.ratingScore ?? null,
          rightScore: right?.ratingScore ?? null
        };
      })
      .filter(
        (change) => change.leftLabel !== change.rightLabel || change.leftScore !== change.rightScore
      );
  }

  private buildRecommendationChanges(leftReport: ReportResponse, rightReport: ReportResponse) {
    const leftById = new Map(
      leftReport.dashboard.recommendations.map((recommendation) => [
        recommendation.id,
        recommendation
      ])
    );
    const rightById = new Map(
      rightReport.dashboard.recommendations.map((recommendation) => [
        recommendation.id,
        recommendation
      ])
    );
    const ids = new Set([...leftById.keys(), ...rightById.keys()]);

    return [...ids]
      .map((id) => {
        const left = leftById.get(id);
        const right = rightById.get(id);
        return {
          recommendationId: id,
          title: right?.title ?? left?.title ?? id,
          source: right?.source ?? left?.source ?? 'stage1',
          severityBand: right?.severityBand ?? left?.severityBand ?? 'default',
          leftPresent: Boolean(left),
          rightPresent: Boolean(right),
          leftStatus: left?.action?.status ?? null,
          rightStatus: right?.action?.status ?? null
        };
      })
      .filter(
        (change) =>
          !change.leftPresent || !change.rightPresent || change.leftStatus !== change.rightStatus
      );
  }

  private toStage1TopicInput(item: EvaluationStage1TopicRecord): Stage1TopicAnswerInput {
    return {
      topicCode: item.topicCode,
      applicable: item.applicable,
      magnitude: item.magnitude,
      scale: item.scale,
      irreversibility: item.irreversibility,
      likelihood: item.likelihood,
      evidenceBasis: item.evidenceBasis,
      evidenceNote: item.evidenceNote
    };
  }

  private toStage2RiskInput(item: EvaluationStage2RiskRecord): Stage2RiskAnswerInput {
    return {
      riskCode: item.riskCode,
      applicable: item.applicable,
      probability: item.probability,
      impact: item.impact,
      evidenceBasis: item.evidenceBasis,
      evidenceNote: item.evidenceNote
    };
  }

  private toStage2OpportunityInput(
    item: EvaluationStage2OpportunityRecord
  ): Stage2OpportunityAnswerInput {
    return {
      opportunityCode: item.opportunityCode,
      applicable: item.applicable,
      likelihood: item.likelihood,
      impact: item.impact,
      evidenceBasis: item.evidenceBasis,
      evidenceNote: item.evidenceNote
    };
  }

  private toContextPayload(
    evaluation: Pick<
      EvaluationStateRecord,
      | 'name'
      | 'country'
      | 'naceDivision'
      | 'offeringType'
      | 'launched'
      | 'currentStage'
      | 'innovationApproach'
    >
  ): EvaluationContextPayload {
    return {
      name: evaluation.name,
      country: evaluation.country,
      naceDivision: evaluation.naceDivision,
      offeringType: evaluation.offeringType,
      launched: evaluation.launched,
      currentStage: evaluation.currentStage,
      innovationApproach: evaluation.innovationApproach
    };
  }

  private buildCsvReport(report: ReportResponse) {
    const rows: string[][] = [];
    const pushSection = (
      section: string,
      field: string,
      value: string | number | boolean | null
    ) => {
      rows.push([section, field, value === null ? '' : String(value)]);
    };

    pushSection('evaluation', 'id', report.evaluation.id);
    pushSection('evaluation', 'name', report.evaluation.name);
    pushSection('evaluation', 'country', report.evaluation.country);
    pushSection('evaluation', 'naceDivision', report.evaluation.naceDivision);
    pushSection('evaluation', 'offeringType', report.evaluation.offeringType);
    pushSection('evaluation', 'launched', report.evaluation.launched);
    pushSection('evaluation', 'currentStage', report.evaluation.currentStage);
    pushSection('evaluation', 'innovationApproach', report.evaluation.innovationApproach);
    pushSection('evaluation', 'status', report.evaluation.status);
    pushSection('evaluation', 'currentStep', report.evaluation.currentStep);
    pushSection('evaluation', 'confidenceBand', report.dashboard.confidenceBand);
    pushSection('evaluation', 'financialTotal', report.dashboard.financialTotal);
    pushSection('evaluation', 'riskOverall', report.dashboard.riskOverall);
    pushSection('evaluation', 'opportunityOverall', report.dashboard.opportunityOverall);
    pushSection('evaluation', 'revisionNumber', report.evaluation.currentRevisionNumber);
    pushSection(
      'evaluation',
      'scoringVersion',
      report.evaluation.scoringVersionInfo.scoringVersion
    );
    pushSection(
      'evaluation',
      'catalogVersion',
      report.evaluation.scoringVersionInfo.catalogVersion
    );

    if (report.evaluation.stage1Financial) {
      for (const item of report.evaluation.stage1Financial.items) {
        pushSection('stage1_financial', `${item.id}.level`, item.level);
        pushSection('stage1_financial', `${item.id}.score`, item.score);
      }
    }

    for (const topic of report.evaluation.stage1Topics) {
      pushSection('stage1_topic', `${topic.topicCode}.applicable`, topic.applicable);
      pushSection('stage1_topic', `${topic.topicCode}.magnitude`, topic.magnitude);
      pushSection('stage1_topic', `${topic.topicCode}.scale`, topic.scale);
      pushSection('stage1_topic', `${topic.topicCode}.irreversibility`, topic.irreversibility);
      pushSection('stage1_topic', `${topic.topicCode}.likelihood`, topic.likelihood);
      pushSection('stage1_topic', `${topic.topicCode}.impactScore`, topic.impactScore);
      pushSection('stage1_topic', `${topic.topicCode}.priorityBand`, topic.priorityBand);
      pushSection('stage1_topic', `${topic.topicCode}.evidenceBasis`, topic.evidenceBasis);
      pushSection('stage1_topic', `${topic.topicCode}.evidenceNote`, topic.evidenceNote ?? null);
    }

    for (const risk of report.evaluation.stage2Risks) {
      pushSection('stage2_risk', `${risk.riskCode}.applicable`, risk.applicable);
      pushSection('stage2_risk', `${risk.riskCode}.probability`, risk.probability);
      pushSection('stage2_risk', `${risk.riskCode}.impact`, risk.impact);
      pushSection('stage2_risk', `${risk.riskCode}.ratingScore`, risk.ratingScore);
      pushSection('stage2_risk', `${risk.riskCode}.ratingLabel`, risk.ratingLabel);
      pushSection('stage2_risk', `${risk.riskCode}.evidenceBasis`, risk.evidenceBasis);
      pushSection('stage2_risk', `${risk.riskCode}.evidenceNote`, risk.evidenceNote ?? null);
    }

    for (const opportunity of report.evaluation.stage2Opportunities) {
      pushSection(
        'stage2_opportunity',
        `${opportunity.opportunityCode}.applicable`,
        opportunity.applicable
      );
      pushSection(
        'stage2_opportunity',
        `${opportunity.opportunityCode}.likelihood`,
        opportunity.likelihood
      );
      pushSection(
        'stage2_opportunity',
        `${opportunity.opportunityCode}.impact`,
        opportunity.impact
      );
      pushSection(
        'stage2_opportunity',
        `${opportunity.opportunityCode}.ratingScore`,
        opportunity.ratingScore
      );
      pushSection(
        'stage2_opportunity',
        `${opportunity.opportunityCode}.ratingLabel`,
        opportunity.ratingLabel
      );
      pushSection(
        'stage2_opportunity',
        `${opportunity.opportunityCode}.evidenceBasis`,
        opportunity.evidenceBasis
      );
      pushSection(
        'stage2_opportunity',
        `${opportunity.opportunityCode}.evidenceNote`,
        opportunity.evidenceNote ?? null
      );
    }

    for (const sdg of report.sdgAlignment.items) {
      pushSection('sdg_alignment', `${sdg.number}`, `${sdg.title} (${sdg.sourceType})`);
    }

    for (const recommendation of report.dashboard.recommendations) {
      pushSection('recommendation', `${recommendation.id}.title`, recommendation.title);
      pushSection('recommendation', `${recommendation.id}.source`, recommendation.source);
      pushSection('recommendation', `${recommendation.id}.severity`, recommendation.severityBand);
      pushSection('recommendation', `${recommendation.id}.text`, recommendation.text);
    }

    return [['section', 'field', 'value'], ...rows]
      .map((row) => row.map((value) => this.escapeCsvCell(value)).join(','))
      .join('\n');
  }

  private buildPdfReport(report: ReportResponse) {
    const lines = this.buildPdfLines(report);
    const linesPerPage = 42;
    const pages: string[][] = [];

    for (let index = 0; index < lines.length; index += linesPerPage) {
      pages.push(lines.slice(index, index + linesPerPage));
    }

    return this.createPdfDocument(pages);
  }

  private buildPdfLines(report: ReportResponse) {
    const lines = [
      'ZEEUS Sustainability Assessment Report',
      '',
      `Startup: ${report.evaluation.name}`,
      `Country: ${report.evaluation.country}`,
      `NACE: ${report.evaluation.naceDivision}`,
      `Stage: ${report.evaluation.currentStage}`,
      `Status: ${report.evaluation.status}`,
      `Revision: ${report.evaluation.currentRevisionNumber}`,
      `Scoring version: ${report.evaluation.scoringVersionInfo.scoringVersion}`,
      `Catalog version: ${report.evaluation.scoringVersionInfo.catalogVersion}`,
      '',
      'Dashboard',
      `Financial total: ${report.dashboard.financialTotal}/12`,
      `Risk overall: ${report.dashboard.riskOverall}`,
      `Opportunity overall: ${report.dashboard.opportunityOverall}`,
      `Confidence: ${report.dashboard.confidenceBand}`,
      '',
      'Material topics'
    ];

    for (const topic of report.dashboard.materialAlerts) {
      lines.push(`- ${topic.topicCode}: ${topic.title} (${topic.priorityBand}, ${topic.score})`);
    }

    lines.push('', 'Top risks');
    for (const risk of report.dashboard.topRisks) {
      lines.push(`- ${risk.title}: ${risk.ratingLabel} (${risk.score})`);
    }

    lines.push('', 'Top opportunities');
    for (const opportunity of report.dashboard.topOpportunities) {
      lines.push(`- ${opportunity.title}: ${opportunity.ratingLabel} (${opportunity.score})`);
    }

    lines.push('', 'Recommendations');
    for (const recommendation of report.dashboard.recommendations) {
      lines.push(`- ${recommendation.title}: ${recommendation.text}`);
    }

    lines.push('', 'Relevant SDGs');
    for (const sdg of report.sdgAlignment.items) {
      lines.push(`- SDG ${sdg.number}: ${sdg.title} (${sdg.sourceType})`);
    }

    return lines;
  }

  private createPdfDocument(pages: string[][]) {
    const catalogId = 1;
    const pagesId = 2;
    const fontId = 3;
    const pageIds: number[] = [];
    const contentIds: number[] = [];
    let nextId = 4;

    for (const _page of pages) {
      pageIds.push(nextId++);
      contentIds.push(nextId++);
    }

    const objects = new Map<number, string>();
    objects.set(catalogId, `<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
    objects.set(
      pagesId,
      `<< /Type /Pages /Count ${pages.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >>`
    );
    objects.set(fontId, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

    pages.forEach((pageLines, index) => {
      const pageId = pageIds[index]!;
      const contentId = contentIds[index]!;
      const content = this.buildPdfPageContent(pageLines);
      objects.set(
        contentId,
        `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`
      );
      objects.set(
        pageId,
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`
      );
    });

    let pdf = '%PDF-1.4\n';
    const offsets = new Map<number, number>();

    for (const id of [...objects.keys()].sort((left, right) => left - right)) {
      offsets.set(id, Buffer.byteLength(pdf, 'utf8'));
      pdf += `${id} 0 obj\n${objects.get(id)}\nendobj\n`;
    }

    const xrefOffset = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.size + 1}\n`;
    pdf += '0000000000 65535 f \n';

    for (let id = 1; id <= objects.size; id += 1) {
      const offset = offsets.get(id) ?? 0;
      pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${objects.size + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(pdf, 'utf8');
  }

  private buildPdfPageContent(lines: string[]) {
    const commands = ['BT', '/F1 12 Tf', '14 TL', '50 760 Td'];

    lines.forEach((line, index) => {
      if (index > 0) {
        commands.push('T*');
      }

      commands.push(`(${this.escapePdfText(line)}) Tj`);
    });

    commands.push('ET');
    return commands.join('\n');
  }

  private escapePdfText(value: string) {
    return value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
  }

  private escapeCsvCell(value: string) {
    return `"${value.replaceAll('"', '""')}"`;
  }
}
