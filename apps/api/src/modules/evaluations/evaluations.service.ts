import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
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
  type CreateEvaluationPayload,
  type DashboardResponse,
  type EvaluationContextPayload,
  type EvaluationDetail,
  type EvaluationListItem,
  type EvaluationListResponse,
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
  type Stage2RiskAnswerInput
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

const artifactSelect = Prisma.validator<Prisma.EvaluationArtifactSelect>()({
  id: true,
  kind: true,
  status: true,
  filename: true,
  mimeType: true,
  byteSize: true,
  createdAt: true
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
        return this.readCurrentDetail(transaction, evaluationId, currentUser.id);
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
      return persisted.detail;
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.completed',
      targetType: 'evaluation',
      targetId: evaluationId
    });

    return result;
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
      return persisted.detail;
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.reopened',
      targetType: 'evaluation',
      targetId: evaluationId
    });

    return result;
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
      return persisted.detail;
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.archived',
      targetType: 'evaluation',
      targetId: evaluationId
    });

    return result;
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
      return persisted.detail;
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.unarchived',
      targetType: 'evaluation',
      targetId: evaluationId
    });

    return result;
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
    const evaluation = await this.getOwnedEvaluationState(
      this.prismaService,
      evaluationId,
      currentUser.id
    );
    const report = await this.getCurrentReportFromState(evaluation);
    const csv = this.buildCsvReport(report);
    await this.recordArtifact(evaluation.id, evaluation.currentRevisionId, currentUser.id, {
      kind: 'csv',
      filename: `evaluation-${evaluation.id}.csv`,
      mimeType: 'text/csv',
      byteSize: Buffer.byteLength(csv, 'utf8')
    });
    response.write(csv);
    response.end();
  }

  async exportPdf(currentUser: SessionUser, evaluationId: string, response: Response) {
    const evaluation = await this.getOwnedEvaluationState(
      this.prismaService,
      evaluationId,
      currentUser.id
    );
    const report = await this.getCurrentReportFromState(evaluation);
    const pdf = this.buildPdfReport(report);
    await this.recordArtifact(evaluation.id, evaluation.currentRevisionId, currentUser.id, {
      kind: 'pdf',
      filename: `evaluation-${evaluation.id}.pdf`,
      mimeType: 'application/pdf',
      byteSize: pdf.byteLength
    });
    response.write(pdf);
    response.end();
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
      revisionId: revision.id
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
    const dashboard = buildDashboard(
      evaluation.id,
      initialSummary,
      stage1Financial,
      stage1Topics,
      stage2Risks,
      stage2Opportunities
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
    return {
      ...report,
      evaluation: {
        ...report.evaluation,
        artifacts: evaluation.artifacts.map((item: EvaluationArtifactRecord) =>
          this.serializeArtifactSummary(item)
        )
      }
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
      kind: artifact.kind,
      status: artifact.status,
      filename: artifact.filename,
      mimeType: artifact.mimeType,
      byteSize: artifact.byteSize,
      createdAt: artifact.createdAt.toISOString()
    };
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

  private async recordArtifact(
    evaluationId: string,
    revisionId: string | null,
    createdByUserId: string,
    input: {
      kind: 'csv' | 'pdf' | 'ai_explanation';
      filename: string;
      mimeType: string;
      byteSize: number;
    }
  ) {
    await this.prismaService.evaluationArtifact.create({
      data: {
        evaluationId,
        revisionId,
        createdByUserId,
        kind: input.kind,
        filename: input.filename,
        mimeType: input.mimeType,
        byteSize: input.byteSize,
        status: 'ready'
      }
    });
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
