import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateEvidenceAssetPayload,
  CreateScenarioRunPayload,
  EvidenceAssetListResponse,
  EvidenceAssetSummary,
  OrganizationDetail,
  OrganizationListResponse,
  ProgramDetail,
  ProgramListResponse,
  PublicSiteContent,
  ScenarioRunListResponse,
  ScenarioRunSummary,
  SdgGoalDetail,
  SessionUser
} from '@packages/shared';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlatformService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async getSiteContent(): Promise<PublicSiteContent> {
    const [articles, faqEntries, caseStudies, resourceArticle, programs] = await Promise.all([
      this.prismaService.knowledgeArticle.findMany({
        where: {
          slug: {
            not: 'resources-downloads'
          }
        },
        orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }]
      }),
      this.prismaService.faqEntry.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
      }),
      this.prismaService.caseStudy.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
      }),
      this.prismaService.knowledgeArticle.findUnique({
        where: {
          slug: 'resources-downloads'
        }
      }),
      this.prismaService.program.findMany({
        where: {
          isPublic: true
        },
        include: {
          members: {
            select: {
              role: true
            }
          },
          submissions: {
            select: {
              id: true
            }
          }
        },
        orderBy: [{ createdAt: 'desc' }]
      })
    ]);

    return {
      articles: articles.map((article: (typeof articles)[number]) => ({
        id: article.id,
        slug: article.slug,
        title: article.title,
        summary: article.summary,
        body: article.body,
        category: article.category as
          | 'how_it_works'
          | 'methodology'
          | 'sdg_esrs'
          | 'partner'
          | 'contact',
        updatedAt: article.updatedAt.toISOString()
      })),
      faqEntries: faqEntries.map((entry: (typeof faqEntries)[number]) => ({
        id: entry.id,
        question: entry.question,
        answer: entry.answer,
        category: entry.category,
        sortOrder: entry.sortOrder
      })),
      caseStudies: caseStudies.map((study: (typeof caseStudies)[number]) => ({
        id: study.id,
        slug: study.slug,
        title: study.title,
        startupName: study.startupName,
        summary: study.summary,
        story: study.story,
        stage: study.stage,
        naceDivision: study.naceDivision
      })),
      resources: this.parseResourceAssets(resourceArticle?.body),
      partnerPrograms: programs.map((program: (typeof programs)[number]) =>
        this.serializeProgramSummary(program, null)
      )
    };
  }

  async getSdgGoal(goalNumber: number): Promise<SdgGoalDetail> {
    const targets = await this.prismaService.sdgTarget.findMany({
      where: {
        goalNumber
      },
      orderBy: [{ sortOrder: 'asc' }, { targetCode: 'asc' }]
    });

    if (targets.length === 0) {
      throw new NotFoundException('SDG goal not found.');
    }

    return {
      goalNumber,
      goalTitle: targets[0].goalTitle,
      summary: targets[0].goalSummary,
      officialUrl: `https://sdgs.un.org/goals/goal${goalNumber}`,
      targets: targets.map((target: (typeof targets)[number]) => ({
        id: target.id,
        goalNumber: target.goalNumber,
        goalTitle: target.goalTitle,
        targetCode: target.targetCode,
        title: target.title,
        description: target.description,
        officialUrl: target.officialUrl
      }))
    };
  }

  async listOrganizations(currentUser: SessionUser): Promise<OrganizationListResponse> {
    const memberships = await this.prismaService.organizationMember.findMany({
      where: {
        userId: currentUser.id
      },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                members: true,
                programs: true
              }
            }
          }
        }
      },
      orderBy: [{ joinedAt: 'asc' }]
    });

    return {
      items: memberships.map((membership: (typeof memberships)[number]) => ({
        id: membership.organization.id,
        slug: membership.organization.slug,
        name: membership.organization.name,
        description: membership.organization.description,
        websiteUrl: membership.organization.websiteUrl,
        role: membership.role as 'owner' | 'manager' | 'member' | 'reviewer',
        memberCount: membership.organization._count.members,
        programCount: membership.organization._count.programs,
        createdAt: membership.organization.createdAt.toISOString()
      }))
    };
  }

  async getOrganization(currentUser: SessionUser, organizationId: string): Promise<OrganizationDetail> {
    const membership = await this.prismaService.organizationMember.findFirst({
      where: {
        organizationId,
        userId: currentUser.id
      },
      include: {
        organization: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              },
              orderBy: [{ joinedAt: 'asc' }]
            },
            programs: {
              include: {
                members: {
                  select: {
                    role: true,
                    userId: true
                  }
                },
                submissions: {
                  select: {
                    id: true
                  }
                }
              },
              orderBy: [{ createdAt: 'desc' }]
            }
          }
        }
      }
    });

    if (!membership) {
      throw new ForbiddenException('Organization access denied.');
    }

    return {
      id: membership.organization.id,
      slug: membership.organization.slug,
      name: membership.organization.name,
      description: membership.organization.description,
      websiteUrl: membership.organization.websiteUrl,
      role: membership.role as 'owner' | 'manager' | 'member' | 'reviewer',
      memberCount: membership.organization.members.length,
      programCount: membership.organization.programs.length,
      createdAt: membership.organization.createdAt.toISOString(),
      members: membership.organization.members.map((item: (typeof membership.organization.members)[number]) => ({
        userId: item.user.id,
        name: item.user.name,
        email: item.user.email,
        role: item.role as 'owner' | 'manager' | 'member' | 'reviewer',
        joinedAt: item.joinedAt.toISOString()
      })),
      programs: membership.organization.programs.map((program: (typeof membership.organization.programs)[number]) =>
        this.serializeProgramSummary(program, this.findProgramRole(program.members, currentUser.id))
      )
    };
  }

  async listPrograms(currentUser: SessionUser): Promise<ProgramListResponse> {
    const programs = await this.prismaService.program.findMany({
      where: {
        OR: [
          {
            members: {
              some: {
                userId: currentUser.id
              }
            }
          },
          {
            organization: {
              members: {
                some: {
                  userId: currentUser.id
                }
              }
            }
          }
        ]
      },
      include: {
        members: {
          select: {
            role: true,
            userId: true
          }
        },
        submissions: {
          select: {
            id: true
          }
        }
      },
      orderBy: [{ createdAt: 'desc' }]
    });

    return {
      items: programs.map((program: (typeof programs)[number]) =>
        this.serializeProgramSummary(program, this.findProgramRole(program.members, currentUser.id))
      )
    };
  }

  async getProgram(currentUser: SessionUser, programId: string): Promise<ProgramDetail> {
    const program = await this.prismaService.program.findFirst({
      where: {
        id: programId,
        OR: [
          {
            members: {
              some: {
                userId: currentUser.id
              }
            }
          },
          {
            organization: {
              members: {
                some: {
                  userId: currentUser.id
                }
              }
            }
          }
        ]
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: [{ joinedAt: 'asc' }]
        },
        submissions: {
          include: {
            evaluation: {
              select: {
                id: true,
                name: true,
                status: true
              }
            },
            reviewAssignments: {
              include: {
                reviewer: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              },
              orderBy: [{ createdAt: 'asc' }]
            },
            reviewComments: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              },
              orderBy: [{ createdAt: 'asc' }]
            }
          },
          orderBy: [{ createdAt: 'desc' }]
        }
      }
    });

    if (!program) {
      throw new ForbiddenException('Program access denied.');
    }

    const baseSummary = this.serializeProgramSummary(
      program,
      this.findProgramRole(program.members, currentUser.id)
    );

    return {
      ...baseSummary,
      description: program.description,
      publicBlurb: program.publicBlurb,
      members: program.members.map((item: (typeof program.members)[number]) => ({
        userId: item.user.id,
        name: item.user.name,
        email: item.user.email,
        role: item.role as 'manager' | 'reviewer' | 'member',
        joinedAt: item.joinedAt.toISOString()
      })),
      submissions: program.submissions.map((submission: (typeof program.submissions)[number]) => ({
        id: submission.id,
        evaluationId: submission.evaluation.id,
        evaluationName: submission.evaluation.name,
        startupName: submission.evaluation.name,
        revisionNumber: submission.revisionNumber,
        submissionStatus: submission.status as
          | 'draft'
          | 'submitted'
          | 'in_review'
          | 'changes_requested'
          | 'approved'
          | 'archived',
        evaluationStatus: submission.evaluation.status,
        submittedAt: submission.submittedAt ? submission.submittedAt.toISOString() : null,
        lastReviewedAt: submission.lastReviewedAt
          ? submission.lastReviewedAt.toISOString()
          : null
      })),
      reviewAssignments: program.submissions.flatMap((submission: (typeof program.submissions)[number]) =>
        submission.reviewAssignments.map((assignment: (typeof submission.reviewAssignments)[number]) => ({
          id: assignment.id,
          submissionId: submission.id,
          reviewerUserId: assignment.reviewer.id,
          reviewerName: assignment.reviewer.name,
          status: assignment.status as 'pending' | 'in_review' | 'changes_requested' | 'approved',
          dueAt: assignment.dueAt ? assignment.dueAt.toISOString() : null,
          decidedAt: assignment.decidedAt ? assignment.decidedAt.toISOString() : null
        }))
      ),
      reviewComments: program.submissions.flatMap((submission: (typeof program.submissions)[number]) =>
        submission.reviewComments.map((comment: (typeof submission.reviewComments)[number]) => ({
          id: comment.id,
          submissionId: submission.id,
          authorUserId: comment.author.id,
          authorName: comment.author.name,
          body: comment.body,
          createdAt: comment.createdAt.toISOString()
        }))
      )
    };
  }

  async listEvidence(currentUser: SessionUser, evaluationId: string): Promise<EvidenceAssetListResponse> {
    await this.assertOwnedEvaluation(currentUser.id, evaluationId);

    const items = await this.prismaService.evidenceAsset.findMany({
      where: {
        evaluationId
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
    });

    return {
      items: items.map((item: (typeof items)[number]) => this.serializeEvidence(item))
    };
  }

  async createEvidence(
    currentUser: SessionUser,
    evaluationId: string,
    payload: CreateEvidenceAssetPayload
  ): Promise<EvidenceAssetSummary> {
    const evaluation = await this.assertOwnedEvaluation(currentUser.id, evaluationId);

    const item = await this.prismaService.evidenceAsset.create({
      data: {
        evaluationId,
        revisionId: evaluation.currentRevisionId,
        kind: payload.kind,
        title: payload.title,
        description: payload.description ?? null,
        sourceUrl: payload.sourceUrl ?? null,
        ownerName: payload.ownerName ?? null,
        sourceDate: payload.sourceDate ? new Date(payload.sourceDate) : null,
        evidenceBasis: payload.evidenceBasis,
        confidenceWeight: payload.confidenceWeight ?? null,
        linkedTopicCode: payload.linkedTopicCode ?? null,
        linkedRecommendationId: payload.linkedRecommendationId ?? null,
        createdByUserId: currentUser.id
      }
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evidence.created',
      targetType: 'evidence_asset',
      targetId: item.id,
      metadata: {
        evaluationId
      }
    });

    return this.serializeEvidence(item);
  }

  async listScenarios(currentUser: SessionUser, evaluationId: string): Promise<ScenarioRunListResponse> {
    await this.assertOwnedEvaluation(currentUser.id, evaluationId);

    const items = await this.prismaService.scenarioRun.findMany({
      where: {
        evaluationId
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }]
    });

    return {
      items: items.map((item: (typeof items)[number]) => this.serializeScenario(item))
    };
  }

  async createScenario(
    currentUser: SessionUser,
    evaluationId: string,
    payload: CreateScenarioRunPayload
  ): Promise<ScenarioRunSummary> {
    const evaluation = await this.assertOwnedEvaluation(currentUser.id, evaluationId);
    const revisionLabel =
      evaluation.currentRevisionNumber > 0 ? `revision ${evaluation.currentRevisionNumber}` : 'draft';
    const advisorySummary = [
      `Scenario focus: ${payload.focusArea}.`,
      payload.geography ? `Geography: ${payload.geography}.` : null,
      payload.dependency ? `Dependency: ${payload.dependency}.` : null,
      `Compare this advisory case against ${revisionLabel} before changing the canonical assessment.`,
      payload.hypothesis
    ]
      .filter(Boolean)
      .join(' ');

    const item = await this.prismaService.scenarioRun.create({
      data: {
        evaluationId,
        baseRevisionId: evaluation.currentRevisionId,
        name: payload.name,
        status: 'draft',
        focusArea: payload.focusArea,
        geography: payload.geography ?? null,
        dependency: payload.dependency ?? null,
        timeframe: payload.timeframe ?? null,
        hypothesis: payload.hypothesis,
        advisorySummary,
        assumptions: {
          comparisonMode: 'advisory_only',
          generatedFromRevisionNumber: evaluation.currentRevisionNumber
        },
        createdByUserId: currentUser.id
      }
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'scenario.created',
      targetType: 'scenario_run',
      targetId: item.id,
      metadata: {
        evaluationId,
        baseRevisionId: evaluation.currentRevisionId
      }
    });

    return this.serializeScenario(item);
  }

  private async assertOwnedEvaluation(userId: string, evaluationId: string) {
    const evaluation = await this.prismaService.evaluation.findFirst({
      where: {
        id: evaluationId,
        userId
      },
      select: {
        id: true,
        currentRevisionId: true,
        currentRevisionNumber: true
      }
    });

    if (!evaluation) {
      throw new ForbiddenException('Evaluation access denied.');
    }

    return evaluation;
  }

  private parseResourceAssets(body?: string | null) {
    if (!body) {
      return [];
    }

    try {
      const parsed = JSON.parse(body);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private findProgramRole(
    members: Array<{ role: string; userId: string }>,
    userId: string
  ): 'manager' | 'reviewer' | 'member' | null {
    const membership = members.find((item) => item.userId === userId);
    if (!membership) {
      return null;
    }

    return membership.role as 'manager' | 'reviewer' | 'member';
  }

  private serializeProgramSummary(
    program: {
      id: string;
      organizationId: string;
      slug: string;
      name: string;
      summary: string;
      cohortLabel: string;
      status: string;
      primaryLabel: string;
      partnerLabel: string | null;
      coBrandingLabel: string | null;
      watermarkLabel: string | null;
      createdAt: Date;
      members: Array<{ role: string; userId?: string }>;
      submissions: Array<{ id: string }>;
    },
    role: 'manager' | 'reviewer' | 'member' | null
  ) {
    return {
      id: program.id,
      organizationId: program.organizationId,
      slug: program.slug,
      name: program.name,
      summary: program.summary,
      cohortLabel: program.cohortLabel,
      status: program.status as 'active' | 'draft' | 'archived',
      role,
      submissionCount: program.submissions.length,
      reviewerCount: program.members.filter((item) => item.role === 'reviewer').length,
      branding: {
        primaryLabel: program.primaryLabel,
        partnerLabel: program.partnerLabel,
        coBrandingLabel: program.coBrandingLabel,
        watermarkLabel: program.watermarkLabel
      },
      createdAt: program.createdAt.toISOString()
    };
  }

  private serializeEvidence(item: {
    id: string;
    evaluationId: string;
    revisionId: string | null;
    scenarioId: string | null;
    kind: string;
    title: string;
    description: string | null;
    sourceUrl: string | null;
    ownerName: string | null;
    sourceDate: Date | null;
    evidenceBasis: 'measured' | 'estimated' | 'assumed';
    confidenceWeight: number | null;
    linkedTopicCode:
      | 'E1'
      | 'E2'
      | 'E3'
      | 'E4'
      | 'E5'
      | 'S1'
      | 'S2'
      | 'S3'
      | 'S4'
      | 'G1'
      | null;
    linkedRecommendationId: string | null;
    createdAt: Date;
  }): EvidenceAssetSummary {
    return {
      id: item.id,
      evaluationId: item.evaluationId,
      revisionId: item.revisionId,
      scenarioId: item.scenarioId,
      kind: item.kind as 'file' | 'link' | 'note',
      title: item.title,
      description: item.description,
      sourceUrl: item.sourceUrl,
      ownerName: item.ownerName,
      sourceDate: item.sourceDate ? item.sourceDate.toISOString().slice(0, 10) : null,
      evidenceBasis: item.evidenceBasis,
      confidenceWeight: item.confidenceWeight,
      linkedTopicCode: item.linkedTopicCode,
      linkedRecommendationId: item.linkedRecommendationId,
      createdAt: item.createdAt.toISOString()
    };
  }

  private serializeScenario(item: {
    id: string;
    evaluationId: string;
    baseRevisionId: string | null;
    name: string;
    status: string;
    focusArea: string;
    geography: string | null;
    dependency: string | null;
    timeframe: string | null;
    hypothesis: string;
    advisorySummary: string;
    createdAt: Date;
    updatedAt: Date;
  }): ScenarioRunSummary {
    return {
      id: item.id,
      evaluationId: item.evaluationId,
      baseRevisionId: item.baseRevisionId,
      baseRevisionNumber: null,
      name: item.name,
      status: item.status as 'draft' | 'submitted' | 'archived',
      focusArea: item.focusArea,
      geography: item.geography,
      dependency: item.dependency,
      timeframe: item.timeframe,
      hypothesis: item.hypothesis,
      advisorySummary: item.advisorySummary,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    };
  }
}
