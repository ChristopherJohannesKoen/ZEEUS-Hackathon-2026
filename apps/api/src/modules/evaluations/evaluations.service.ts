import { Injectable, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import {
  buildDashboard,
  buildImpactSummary,
  buildInitialSummary,
  buildReportResponse,
  getOpportunityCatalog,
  getRiskCatalog,
  getStageOneTopicCatalog,
  scoreFinancialAnswers,
  scoreStage1TopicAnswer,
  scoreStage2OpportunityAnswer,
  scoreStage2RiskAnswer
} from '@packages/scoring';
import type {
  CreateEvaluationPayload,
  DashboardResponse,
  EvaluationContextPayload,
  EvaluationDetail,
  EvaluationListItem,
  EvaluationListResponse,
  ImpactSummaryResponse,
  ReportResponse,
  SaveStage1TopicsPayload,
  SaveStage2OpportunitiesPayload,
  SaveStage2RisksPayload,
  SdgAlignmentResponse,
  SessionUser,
  Stage1FinancialAnswer,
  Stage1FinancialAnswersPayload,
  Stage1TopicAnswer,
  Stage2OpportunityAnswer,
  Stage2RiskAnswer
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
  financialTotal: true,
  riskOverall: true,
  opportunityOverall: true,
  confidenceBand: true,
  relevantTopicCount: true,
  highPriorityTopicCount: true,
  createdAt: true,
  updatedAt: true,
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
      ratingLabel: true,
      ratingScore: true
    }
  }
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
  | 'createdAt'
  | 'updatedAt'
>;

type DatabaseClient = Prisma.TransactionClient | PrismaService;

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
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      items: evaluations.map((evaluation: EvaluationListRecord) =>
        this.serializeEvaluationListItem(evaluation)
      )
    };
  }

  async createEvaluation(
    currentUser: SessionUser,
    payload: CreateEvaluationPayload
  ): Promise<EvaluationDetail> {
    const evaluation = await this.prismaService.$transaction(async (transaction) => {
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
        data: getStageOneTopicCatalog().map((topic) => {
          const scored = scoreStage1TopicAnswer({
            topicCode: topic.topicCode,
            applicable: false,
            magnitude: 'na',
            scale: 'na',
            irreversibility: 'na',
            likelihood: 'na',
            evidenceBasis: 'assumed'
          });

          return {
            evaluationId: created.id,
            topicCode: scored.topicCode,
            applicable: scored.applicable,
            magnitude: scored.magnitude,
            scale: scored.scale,
            irreversibility: scored.irreversibility,
            likelihood: scored.likelihood,
            evidenceBasis: scored.evidenceBasis,
            impactScore: scored.impactScore,
            priorityBand: scored.priorityBand
          };
        })
      });

      await transaction.stage2RiskAnswer.createMany({
        data: getRiskCatalog().map((risk) => {
          const scored = scoreStage2RiskAnswer({
            riskCode: risk.riskCode,
            applicable: false,
            probability: 'na',
            impact: 'na',
            evidenceBasis: 'assumed'
          });

          return {
            evaluationId: created.id,
            riskCode: scored.riskCode,
            applicable: scored.applicable,
            probability: scored.probability,
            impact: scored.impact,
            evidenceBasis: scored.evidenceBasis,
            ratingLabel: scored.ratingLabel,
            ratingScore: scored.ratingScore
          };
        })
      });

      await transaction.stage2OpportunityAnswer.createMany({
        data: getOpportunityCatalog().map((opportunity) => {
          const scored = scoreStage2OpportunityAnswer({
            opportunityCode: opportunity.opportunityCode,
            applicable: false,
            likelihood: 'na',
            impact: 'na',
            evidenceBasis: 'assumed'
          });

          return {
            evaluationId: created.id,
            opportunityCode: scored.opportunityCode,
            applicable: scored.applicable,
            likelihood: scored.likelihood,
            impact: scored.impact,
            evidenceBasis: scored.evidenceBasis,
            ratingLabel: scored.ratingLabel,
            ratingScore: scored.ratingScore
          };
        })
      });

      await this.refreshEvaluationSummary(transaction, created.id, {
        currentStep: 'summary',
        status: 'draft'
      });

      return this.getOwnedEvaluationState(transaction, created.id, currentUser.id);
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.created',
      targetType: 'evaluation',
      targetId: evaluation.id
    });

    return this.serializeEvaluationDetail(evaluation);
  }

  async getEvaluation(currentUser: SessionUser, evaluationId: string): Promise<EvaluationDetail> {
    const evaluation = await this.getOwnedEvaluationState(
      this.prismaService,
      evaluationId,
      currentUser.id
    );
    return this.serializeEvaluationDetail(evaluation);
  }

  async updateContext(
    currentUser: SessionUser,
    evaluationId: string,
    payload: EvaluationContextPayload
  ): Promise<EvaluationDetail> {
    const evaluation = await this.prismaService.$transaction(async (transaction) => {
      await this.assertEvaluationOwnership(transaction, evaluationId, currentUser.id);
      await transaction.evaluation.update({
        where: { id: evaluationId },
        data: {
          ...payload,
          currentStep: 'summary',
          status: 'draft'
        }
      });
      await this.refreshEvaluationSummary(transaction, evaluationId, {
        currentStep: 'summary',
        status: 'draft'
      });
      return this.getOwnedEvaluationState(transaction, evaluationId, currentUser.id);
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.context_updated',
      targetType: 'evaluation',
      targetId: evaluationId
    });

    return this.serializeEvaluationDetail(evaluation);
  }

  async getSummary(currentUser: SessionUser, evaluationId: string) {
    const evaluation = await this.getOwnedEvaluationState(
      this.prismaService,
      evaluationId,
      currentUser.id
    );
    return buildInitialSummary(this.toContextPayload(evaluation));
  }

  async saveStage1Financial(
    currentUser: SessionUser,
    evaluationId: string,
    payload: Stage1FinancialAnswersPayload
  ): Promise<Stage1FinancialAnswer> {
    const scored = scoreFinancialAnswers(payload);

    await this.prismaService.$transaction(async (transaction) => {
      await this.assertEvaluationOwnership(transaction, evaluationId, currentUser.id);
      await transaction.stage1FinancialAnswer.upsert({
        where: {
          evaluationId
        },
        create: {
          evaluationId,
          ...payload,
          totalScore: scored.totalScore
        },
        update: {
          ...payload,
          totalScore: scored.totalScore
        }
      });
      await this.refreshEvaluationSummary(transaction, evaluationId, {
        currentStep: 'stage_1',
        status: 'in_progress'
      });
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.stage_1_saved',
      targetType: 'evaluation',
      targetId: evaluationId,
      metadata: {
        section: 'financial'
      }
    });

    return scored;
  }

  async saveStage1Topics(
    currentUser: SessionUser,
    evaluationId: string,
    payload: SaveStage1TopicsPayload
  ): Promise<{ items: Stage1TopicAnswer[] }> {
    const scoredItems = payload.items.map((item) => scoreStage1TopicAnswer(item));

    await this.prismaService.$transaction(async (transaction) => {
      await this.assertEvaluationOwnership(transaction, evaluationId, currentUser.id);

      for (const item of scoredItems) {
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
            impactScore: item.impactScore,
            priorityBand: item.priorityBand
          }
        });
      }

      await this.refreshEvaluationSummary(transaction, evaluationId, {
        currentStep: 'stage_2',
        status: 'in_progress'
      });
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.stage_1_saved',
      targetType: 'evaluation',
      targetId: evaluationId,
      metadata: {
        section: 'topics'
      }
    });

    return {
      items: scoredItems.sort(
        (left, right) =>
          (topicOrder.get(left.topicCode) ?? Number.MAX_SAFE_INTEGER) -
          (topicOrder.get(right.topicCode) ?? Number.MAX_SAFE_INTEGER)
      )
    };
  }

  async saveStage2Risks(
    currentUser: SessionUser,
    evaluationId: string,
    payload: SaveStage2RisksPayload
  ): Promise<{ items: Stage2RiskAnswer[] }> {
    const scoredItems = payload.items.map((item) => scoreStage2RiskAnswer(item));

    await this.prismaService.$transaction(async (transaction) => {
      await this.assertEvaluationOwnership(transaction, evaluationId, currentUser.id);

      for (const item of scoredItems) {
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
            ratingLabel: item.ratingLabel,
            ratingScore: item.ratingScore
          },
          update: {
            applicable: item.applicable,
            probability: item.probability,
            impact: item.impact,
            evidenceBasis: item.evidenceBasis,
            ratingLabel: item.ratingLabel,
            ratingScore: item.ratingScore
          }
        });
      }

      await this.refreshEvaluationSummary(transaction, evaluationId, {
        currentStep: 'stage_2',
        status: 'in_progress'
      });
    });

    return {
      items: scoredItems.sort(
        (left, right) =>
          (riskOrder.get(left.riskCode) ?? Number.MAX_SAFE_INTEGER) -
          (riskOrder.get(right.riskCode) ?? Number.MAX_SAFE_INTEGER)
      )
    };
  }

  async saveStage2Opportunities(
    currentUser: SessionUser,
    evaluationId: string,
    payload: SaveStage2OpportunitiesPayload
  ): Promise<{ items: Stage2OpportunityAnswer[] }> {
    const scoredItems = payload.items.map((item) => scoreStage2OpportunityAnswer(item));

    await this.prismaService.$transaction(async (transaction) => {
      await this.assertEvaluationOwnership(transaction, evaluationId, currentUser.id);

      for (const item of scoredItems) {
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
            ratingLabel: item.ratingLabel,
            ratingScore: item.ratingScore
          },
          update: {
            applicable: item.applicable,
            likelihood: item.likelihood,
            impact: item.impact,
            evidenceBasis: item.evidenceBasis,
            ratingLabel: item.ratingLabel,
            ratingScore: item.ratingScore
          }
        });
      }

      await this.refreshEvaluationSummary(transaction, evaluationId, {
        currentStep: 'dashboard',
        status: 'completed'
      });
    });

    return {
      items: scoredItems.sort(
        (left, right) =>
          (opportunityOrder.get(left.opportunityCode) ?? Number.MAX_SAFE_INTEGER) -
          (opportunityOrder.get(right.opportunityCode) ?? Number.MAX_SAFE_INTEGER)
      )
    };
  }

  async getImpactSummary(
    currentUser: SessionUser,
    evaluationId: string
  ): Promise<ImpactSummaryResponse> {
    const evaluation = await this.getOwnedEvaluationState(
      this.prismaService,
      evaluationId,
      currentUser.id
    );
    const detail = this.serializeEvaluationDetail(evaluation);
    return buildImpactSummary(
      detail.initialSummary,
      detail.stage1Topics,
      detail.stage2Risks,
      detail.stage2Opportunities
    );
  }

  async getSdgAlignment(
    currentUser: SessionUser,
    evaluationId: string
  ): Promise<SdgAlignmentResponse> {
    const evaluation = await this.getOwnedEvaluationState(
      this.prismaService,
      evaluationId,
      currentUser.id
    );
    const initialSummary = buildInitialSummary(this.toContextPayload(evaluation));
    return {
      items: initialSummary.mergedSdgs
    };
  }

  async getDashboard(currentUser: SessionUser, evaluationId: string): Promise<DashboardResponse> {
    const evaluation = await this.getOwnedEvaluationState(
      this.prismaService,
      evaluationId,
      currentUser.id
    );
    const detail = this.serializeEvaluationDetail(evaluation);
    return buildDashboard(
      evaluation.id,
      detail.initialSummary,
      detail.stage1Financial,
      detail.stage1Topics,
      detail.stage2Risks,
      detail.stage2Opportunities
    );
  }

  async getReport(currentUser: SessionUser, evaluationId: string): Promise<ReportResponse> {
    const evaluation = await this.getOwnedEvaluationState(
      this.prismaService,
      evaluationId,
      currentUser.id
    );
    const detail = this.serializeEvaluationDetail(evaluation);
    const impactSummary = buildImpactSummary(
      detail.initialSummary,
      detail.stage1Topics,
      detail.stage2Risks,
      detail.stage2Opportunities
    );
    const dashboard = buildDashboard(
      detail.id,
      detail.initialSummary,
      detail.stage1Financial,
      detail.stage1Topics,
      detail.stage2Risks,
      detail.stage2Opportunities
    );

    return buildReportResponse({
      evaluation: detail,
      impactSummary,
      dashboard
    });
  }

  async exportCsv(currentUser: SessionUser, evaluationId: string, response: Response) {
    const report = await this.getReport(currentUser, evaluationId);
    response.write(this.buildCsvReport(report));
    response.end();
  }

  private async refreshEvaluationSummary(
    client: DatabaseClient,
    evaluationId: string,
    progressOverride?: Pick<Prisma.EvaluationUpdateInput, 'currentStep' | 'status'>
  ) {
    const evaluation = await this.getEvaluationState(client, evaluationId);
    const detail = this.serializeEvaluationDetail(evaluation);
    const dashboard = buildDashboard(
      detail.id,
      detail.initialSummary,
      detail.stage1Financial,
      detail.stage1Topics,
      detail.stage2Risks,
      detail.stage2Opportunities
    );

    await client.evaluation.update({
      where: {
        id: evaluationId
      },
      data: {
        financialTotal: dashboard.financialTotal,
        riskOverall: dashboard.riskOverall,
        opportunityOverall: dashboard.opportunityOverall,
        confidenceBand: dashboard.confidenceBand,
        relevantTopicCount: dashboard.materialAlerts.filter(
          (item) => item.priorityBand === 'relevant'
        ).length,
        highPriorityTopicCount: dashboard.materialAlerts.filter(
          (item) => item.priorityBand === 'high_priority'
        ).length,
        ...progressOverride
      }
    });
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
      createdAt: evaluation.createdAt.toISOString(),
      updatedAt: evaluation.updatedAt.toISOString()
    };
  }

  private serializeEvaluationDetail(evaluation: EvaluationStateRecord): EvaluationDetail {
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
      .map((item: EvaluationStateRecord['stage1TopicAnswers'][number]) =>
        scoreStage1TopicAnswer({
          topicCode: item.topicCode,
          applicable: item.applicable,
          magnitude: item.magnitude,
          scale: item.scale,
          irreversibility: item.irreversibility,
          likelihood: item.likelihood,
          evidenceBasis: item.evidenceBasis
        })
      )
      .sort(
        (left: Stage1TopicAnswer, right: Stage1TopicAnswer) =>
          (topicOrder.get(left.topicCode) ?? Number.MAX_SAFE_INTEGER) -
          (topicOrder.get(right.topicCode) ?? Number.MAX_SAFE_INTEGER)
      );
    const stage2Risks = evaluation.stage2RiskAnswers
      .map((item: EvaluationStateRecord['stage2RiskAnswers'][number]) =>
        scoreStage2RiskAnswer({
          riskCode: item.riskCode,
          applicable: item.applicable,
          probability: item.probability,
          impact: item.impact,
          evidenceBasis: item.evidenceBasis
        })
      )
      .sort(
        (left: Stage2RiskAnswer, right: Stage2RiskAnswer) =>
          (riskOrder.get(left.riskCode) ?? Number.MAX_SAFE_INTEGER) -
          (riskOrder.get(right.riskCode) ?? Number.MAX_SAFE_INTEGER)
      );
    const stage2Opportunities = evaluation.stage2OpportunityAnswers
      .map((item: EvaluationStateRecord['stage2OpportunityAnswers'][number]) =>
        scoreStage2OpportunityAnswer({
          opportunityCode: item.opportunityCode,
          applicable: item.applicable,
          likelihood: item.likelihood,
          impact: item.impact,
          evidenceBasis: item.evidenceBasis
        })
      )
      .sort(
        (left: Stage2OpportunityAnswer, right: Stage2OpportunityAnswer) =>
          (opportunityOrder.get(left.opportunityCode) ?? Number.MAX_SAFE_INTEGER) -
          (opportunityOrder.get(right.opportunityCode) ?? Number.MAX_SAFE_INTEGER)
      );

    return {
      ...this.serializeEvaluationListItem(evaluation),
      offeringType: evaluation.offeringType,
      launched: evaluation.launched,
      innovationApproach: evaluation.innovationApproach,
      initialSummary,
      stage1Financial,
      stage1Topics,
      stage2Risks,
      stage2Opportunities
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
    }

    for (const risk of report.evaluation.stage2Risks) {
      pushSection('stage2_risk', `${risk.riskCode}.applicable`, risk.applicable);
      pushSection('stage2_risk', `${risk.riskCode}.probability`, risk.probability);
      pushSection('stage2_risk', `${risk.riskCode}.impact`, risk.impact);
      pushSection('stage2_risk', `${risk.riskCode}.ratingScore`, risk.ratingScore);
      pushSection('stage2_risk', `${risk.riskCode}.ratingLabel`, risk.ratingLabel);
      pushSection('stage2_risk', `${risk.riskCode}.evidenceBasis`, risk.evidenceBasis);
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

  private escapeCsvCell(value: string) {
    return `"${value.replaceAll('"', '""')}"`;
  }
}
