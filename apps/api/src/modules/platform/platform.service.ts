import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import type {
  ContentStatus,
  CreateEvidenceAssetPayload,
  CreateProgramSubmissionPayload,
  CreateReviewAssignmentPayload,
  CreateReviewCommentPayload,
  CreateScenarioRunPayload,
  EvidenceAssetListResponse,
  EvidenceAssetSummary,
  EditorialOverview,
  FaqEntry,
  KnowledgeArticle,
  OrganizationDetail,
  OrganizationListResponse,
  ProgramDetail,
  ProgramListResponse,
  PublicSiteContent,
  PublicResourceAsset,
  PriorityBand,
  ResourceAssetSummary,
  ScenarioAssumptions,
  ScenarioMetricDelta,
  ScenarioTopicDelta,
  SubmitPartnerInterestPayload,
  ScenarioRunListResponse,
  ScenarioRunSummary,
  SdgGoalDetail,
  SessionUser,
  TopicCode,
  UpdateProgramSubmissionStatusPayload,
  UpsertCaseStudyPayload,
  UpsertFaqEntryPayload,
  UpsertKnowledgeArticlePayload,
  UpsertResourceAssetPayload
} from '@packages/shared';
import { ReportResponseSchema } from '@packages/shared';
import { Prisma } from '@prisma/client';
import { buildScenarioProjection } from './scenario-projections';
import { AuditService } from '../audit/audit.service';
import { EvaluationStorageService } from '../evaluations/evaluation-storage.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlatformService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
    private readonly evaluationStorageService: EvaluationStorageService
  ) {}

  async getSiteContent(): Promise<PublicSiteContent> {
    const [articles, faqEntries, caseStudies, resources, programs] = await Promise.all([
      this.prismaService.knowledgeArticle.findMany({
        where: {
          status: 'published',
          locale: 'en'
        },
        orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }]
      }),
      this.prismaService.faqEntry.findMany({
        where: {
          status: 'published',
          locale: 'en'
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
      }),
      this.prismaService.caseStudy.findMany({
        where: {
          status: 'published',
          locale: 'en'
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
      }),
      this.prismaService.resourceAsset.findMany({
        where: {
          status: 'published',
          locale: 'en'
        },
        orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }]
      }),
      this.prismaService.program.findMany({
        where: {
          isPublic: true,
          status: 'active'
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
        status: article.status as ContentStatus,
        locale: article.locale,
        heroImageUrl: article.heroImageUrl,
        updatedAt: article.updatedAt.toISOString()
      })),
      faqEntries: faqEntries.map((entry: (typeof faqEntries)[number]) => ({
        id: entry.id,
        question: entry.question,
        answer: entry.answer,
        category: entry.category,
        status: entry.status as ContentStatus,
        locale: entry.locale,
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
        naceDivision: study.naceDivision,
        status: study.status as ContentStatus,
        locale: study.locale,
        heroImageUrl: study.heroImageUrl
      })),
      resources: resources.map((resource: (typeof resources)[number]) =>
        this.serializePublicResource(resource)
      ),
      partnerPrograms: programs.map((program: (typeof programs)[number]) =>
        this.serializeProgramSummary(program, null)
      )
    };
  }

  async getSdgGoal(goalNumber: number): Promise<SdgGoalDetail> {
    const targets = await this.prismaService.sdgTarget.findMany({
      where: {
        goalNumber,
        status: 'published',
        locale: 'en'
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

  async getEditorialOverview(currentUser: SessionUser): Promise<EditorialOverview> {
    this.assertEditorialAccess(currentUser);

    const [articles, faqEntries, caseStudies, resources, partnerInterestCount] = await Promise.all([
      this.prismaService.knowledgeArticle.findMany({
        orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }]
      }),
      this.prismaService.faqEntry.findMany({
        orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { updatedAt: 'desc' }]
      }),
      this.prismaService.caseStudy.findMany({
        orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }]
      }),
      this.prismaService.resourceAsset.findMany({
        orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }]
      }),
      this.prismaService.partnerInterestLead.count()
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
        status: article.status as ContentStatus,
        locale: article.locale,
        heroImageUrl: article.heroImageUrl,
        updatedAt: article.updatedAt.toISOString()
      })),
      faqEntries: faqEntries.map((entry: (typeof faqEntries)[number]) => ({
        id: entry.id,
        question: entry.question,
        answer: entry.answer,
        category: entry.category,
        status: entry.status as ContentStatus,
        locale: entry.locale,
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
        naceDivision: study.naceDivision,
        status: study.status as ContentStatus,
        locale: study.locale,
        heroImageUrl: study.heroImageUrl,
        updatedAt: study.updatedAt.toISOString()
      })),
      resources: resources.map((resource: (typeof resources)[number]) =>
        this.serializeResource(resource)
      ),
      partnerInterestCount
    };
  }

  async createKnowledgeArticle(
    currentUser: SessionUser,
    payload: UpsertKnowledgeArticlePayload
  ): Promise<KnowledgeArticle> {
    this.assertEditorialAccess(currentUser);
    const article = await this.prismaService.knowledgeArticle.create({
      data: {
        slug: payload.slug,
        title: payload.title,
        summary: payload.summary,
        body: payload.body,
        category: payload.category,
        status: payload.status,
        locale: payload.locale,
        heroImageUrl: payload.heroImageUrl ?? null
      }
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.context_updated',
      targetType: 'knowledge_article',
      targetId: article.id,
      metadata: {
        slug: article.slug,
        status: article.status
      }
    });

    return {
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
      status: article.status as ContentStatus,
      locale: article.locale,
      heroImageUrl: article.heroImageUrl,
      updatedAt: article.updatedAt.toISOString()
    };
  }

  async updateKnowledgeArticle(
    currentUser: SessionUser,
    contentId: string,
    payload: UpsertKnowledgeArticlePayload
  ): Promise<KnowledgeArticle> {
    this.assertEditorialAccess(currentUser);
    const article = await this.prismaService.knowledgeArticle.update({
      where: { id: contentId },
      data: {
        slug: payload.slug,
        title: payload.title,
        summary: payload.summary,
        body: payload.body,
        category: payload.category,
        status: payload.status,
        locale: payload.locale,
        heroImageUrl: payload.heroImageUrl ?? null
      }
    });

    return {
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
      status: article.status as ContentStatus,
      locale: article.locale,
      heroImageUrl: article.heroImageUrl,
      updatedAt: article.updatedAt.toISOString()
    };
  }

  async createFaqEntry(
    currentUser: SessionUser,
    payload: UpsertFaqEntryPayload
  ): Promise<FaqEntry> {
    this.assertEditorialAccess(currentUser);
    const entry = await this.prismaService.faqEntry.create({
      data: {
        question: payload.question,
        answer: payload.answer,
        category: payload.category,
        status: payload.status,
        locale: payload.locale,
        sortOrder: payload.sortOrder
      }
    });

    return {
      id: entry.id,
      question: entry.question,
      answer: entry.answer,
      category: entry.category,
      status: entry.status as ContentStatus,
      locale: entry.locale,
      sortOrder: entry.sortOrder
    };
  }

  async updateFaqEntry(
    currentUser: SessionUser,
    contentId: string,
    payload: UpsertFaqEntryPayload
  ): Promise<FaqEntry> {
    this.assertEditorialAccess(currentUser);
    const entry = await this.prismaService.faqEntry.update({
      where: { id: contentId },
      data: {
        question: payload.question,
        answer: payload.answer,
        category: payload.category,
        status: payload.status,
        locale: payload.locale,
        sortOrder: payload.sortOrder
      }
    });

    return {
      id: entry.id,
      question: entry.question,
      answer: entry.answer,
      category: entry.category,
      status: entry.status as ContentStatus,
      locale: entry.locale,
      sortOrder: entry.sortOrder
    };
  }

  async createCaseStudy(
    currentUser: SessionUser,
    payload: UpsertCaseStudyPayload
  ): Promise<PublicSiteContent['caseStudies'][number]> {
    this.assertEditorialAccess(currentUser);
    const study = await this.prismaService.caseStudy.create({
      data: {
        slug: payload.slug,
        title: payload.title,
        startupName: payload.startupName,
        summary: payload.summary,
        story: payload.story,
        stage: payload.stage,
        naceDivision: payload.naceDivision,
        status: payload.status,
        locale: payload.locale,
        heroImageUrl: payload.heroImageUrl ?? null,
        sortOrder: payload.sortOrder
      }
    });

    return {
      id: study.id,
      slug: study.slug,
      title: study.title,
      startupName: study.startupName,
      summary: study.summary,
      story: study.story,
      stage: study.stage,
      naceDivision: study.naceDivision,
      status: study.status as ContentStatus,
      locale: study.locale,
      heroImageUrl: study.heroImageUrl,
      updatedAt: study.updatedAt.toISOString()
    };
  }

  async updateCaseStudy(
    currentUser: SessionUser,
    contentId: string,
    payload: UpsertCaseStudyPayload
  ): Promise<PublicSiteContent['caseStudies'][number]> {
    this.assertEditorialAccess(currentUser);
    const study = await this.prismaService.caseStudy.update({
      where: { id: contentId },
      data: {
        slug: payload.slug,
        title: payload.title,
        startupName: payload.startupName,
        summary: payload.summary,
        story: payload.story,
        stage: payload.stage,
        naceDivision: payload.naceDivision,
        status: payload.status,
        locale: payload.locale,
        heroImageUrl: payload.heroImageUrl ?? null,
        sortOrder: payload.sortOrder
      }
    });

    return {
      id: study.id,
      slug: study.slug,
      title: study.title,
      startupName: study.startupName,
      summary: study.summary,
      story: study.story,
      stage: study.stage,
      naceDivision: study.naceDivision,
      status: study.status as ContentStatus,
      locale: study.locale,
      heroImageUrl: study.heroImageUrl,
      updatedAt: study.updatedAt.toISOString()
    };
  }

  async createResourceAsset(
    currentUser: SessionUser,
    payload: UpsertResourceAssetPayload
  ): Promise<ResourceAssetSummary> {
    this.assertEditorialAccess(currentUser);
    const resource = await this.prismaService.resourceAsset.create({
      data: {
        slug: payload.slug,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        fileLabel: payload.fileLabel,
        status: payload.status,
        locale: payload.locale,
        externalUrl: payload.externalUrl ?? null,
        sortOrder: payload.sortOrder
      }
    });

    return this.serializeResource(resource);
  }

  async updateResourceAsset(
    currentUser: SessionUser,
    resourceId: string,
    payload: UpsertResourceAssetPayload
  ): Promise<ResourceAssetSummary> {
    this.assertEditorialAccess(currentUser);
    const resource = await this.prismaService.resourceAsset.update({
      where: { id: resourceId },
      data: {
        slug: payload.slug,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        fileLabel: payload.fileLabel,
        status: payload.status,
        locale: payload.locale,
        externalUrl: payload.externalUrl ?? null,
        sortOrder: payload.sortOrder
      }
    });

    return this.serializeResource(resource);
  }

  async uploadResourceBinary(
    currentUser: SessionUser,
    resourceId: string,
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    }
  ): Promise<ResourceAssetSummary> {
    this.assertEditorialAccess(currentUser);

    if (!file?.buffer?.byteLength) {
      throw new BadRequestException('Resource upload is missing a file.');
    }

    const current = await this.prismaService.resourceAsset.findUnique({
      where: {
        id: resourceId
      }
    });

    if (!current) {
      throw new NotFoundException('Resource asset not found.');
    }

    const checksumSha256 = createHash('sha256').update(file.buffer).digest('hex');
    const fileName = file.originalname || `${current.slug}.bin`;
    const mimeType = file.mimetype || 'application/octet-stream';
    const storageKey = this.evaluationStorageService.buildStorageKey(
      checksumSha256,
      fileName,
      'content-resources'
    );

    await this.evaluationStorageService.writeObject(storageKey, file.buffer, mimeType);

    const resource = await this.prismaService.resourceAsset.update({
      where: {
        id: resourceId
      },
      data: {
        storageKey,
        fileName,
        mimeType,
        byteSize: file.size
      }
    });

    return this.serializeResource(resource);
  }

  async downloadResource(resourceId: string) {
    const resource = await this.prismaService.resourceAsset.findFirst({
      where: {
        id: resourceId,
        status: 'published',
        locale: 'en'
      }
    });

    if (!resource) {
      throw new NotFoundException('Resource asset not found.');
    }

    if (resource.externalUrl) {
      return {
        type: 'redirect' as const,
        location: resource.externalUrl
      };
    }

    if (!resource.storageKey || !resource.fileName || !resource.mimeType) {
      throw new BadRequestException('This resource does not have a binary asset.');
    }

    return {
      type: 'binary' as const,
      fileName: resource.fileName,
      mimeType: resource.mimeType,
      content: await this.evaluationStorageService.readObject(resource.storageKey)
    };
  }

  async submitPartnerInterest(payload: SubmitPartnerInterestPayload) {
    const lead = await this.prismaService.partnerInterestLead.create({
      data: {
        name: payload.name,
        organizationName: payload.organizationName,
        email: payload.email,
        websiteUrl: payload.websiteUrl ?? null,
        message: payload.message
      }
    });

    await this.auditService.log({
      actorId: null,
      action: 'evaluation.context_updated',
      targetType: 'partner_interest_lead',
      targetId: lead.id,
      metadata: {
        email: lead.email,
        organizationName: lead.organizationName
      }
    });

    return {
      ok: true as const
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

  async getOrganization(
    currentUser: SessionUser,
    organizationId: string
  ): Promise<OrganizationDetail> {
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
      members: membership.organization.members.map(
        (item: (typeof membership.organization.members)[number]) => ({
          userId: item.user.id,
          name: item.user.name,
          email: item.user.email,
          role: item.role as 'owner' | 'manager' | 'member' | 'reviewer',
          joinedAt: item.joinedAt.toISOString()
        })
      ),
      programs: membership.organization.programs.map(
        (program: (typeof membership.organization.programs)[number]) =>
          this.serializeProgramSummary(
            program,
            this.findProgramRole(program.members, currentUser.id)
          )
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
    const availableEvaluations = await this.prismaService.evaluation.findMany({
      where: {
        organizationId: program.organizationId,
        OR: [
          {
            userId: currentUser.id
          },
          {
            organization: {
              members: {
                some: {
                  userId: currentUser.id,
                  role: {
                    in: ['owner', 'manager', 'member']
                  }
                }
              }
            }
          }
        ],
        currentRevisionId: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        status: true,
        currentRevisionNumber: true,
        updatedAt: true
      },
      orderBy: [{ updatedAt: 'desc' }]
    });

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
        lastReviewedAt: submission.lastReviewedAt ? submission.lastReviewedAt.toISOString() : null
      })),
      reviewAssignments: program.submissions.flatMap(
        (submission: (typeof program.submissions)[number]) =>
          submission.reviewAssignments.map(
            (assignment: (typeof submission.reviewAssignments)[number]) => ({
              id: assignment.id,
              submissionId: submission.id,
              reviewerUserId: assignment.reviewer.id,
              reviewerName: assignment.reviewer.name,
              status: assignment.status as
                | 'pending'
                | 'in_review'
                | 'changes_requested'
                | 'approved',
              dueAt: assignment.dueAt ? assignment.dueAt.toISOString() : null,
              decidedAt: assignment.decidedAt ? assignment.decidedAt.toISOString() : null
            })
          )
      ),
      reviewComments: program.submissions.flatMap(
        (submission: (typeof program.submissions)[number]) =>
          submission.reviewComments.map((comment: (typeof submission.reviewComments)[number]) => ({
            id: comment.id,
            submissionId: submission.id,
            authorUserId: comment.author.id,
            authorName: comment.author.name,
            body: comment.body,
            createdAt: comment.createdAt.toISOString()
          }))
      ),
      availableEvaluations: availableEvaluations.map(
        (evaluation: (typeof availableEvaluations)[number]) => ({
          evaluationId: evaluation.id,
          name: evaluation.name,
          status: evaluation.status,
          currentRevisionNumber: evaluation.currentRevisionNumber,
          updatedAt: evaluation.updatedAt.toISOString()
        })
      )
    };
  }

  async listEvidence(
    currentUser: SessionUser,
    evaluationId: string
  ): Promise<EvidenceAssetListResponse> {
    await this.assertWorkspaceEvaluationAccess(currentUser, evaluationId);

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
    const evaluation = await this.assertWorkspaceEvaluationAccess(currentUser, evaluationId);

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
        linkedRiskCode: payload.linkedRiskCode ?? null,
        linkedOpportunityCode: payload.linkedOpportunityCode ?? null,
        linkedRecommendationId: payload.linkedRecommendationId ?? null,
        reviewState: payload.reviewState ?? 'draft',
        scenarioId: payload.scenarioId ?? null,
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

  async uploadEvidenceFile(
    currentUser: SessionUser,
    evaluationId: string,
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
    payload: Omit<CreateEvidenceAssetPayload, 'kind' | 'sourceUrl'>
  ): Promise<EvidenceAssetSummary> {
    if (!file?.buffer?.byteLength) {
      throw new BadRequestException('Evidence upload is missing a file.');
    }

    const evaluation = await this.assertWorkspaceEvaluationAccess(currentUser, evaluationId);
    const checksumSha256 = createHash('sha256').update(file.buffer).digest('hex');
    const fileName = file.originalname || `${payload.title}.bin`;
    const mimeType = file.mimetype || 'application/octet-stream';
    const storageKey = this.evaluationStorageService.buildStorageKey(
      checksumSha256,
      fileName,
      'evidence'
    );

    await this.evaluationStorageService.writeObject(storageKey, file.buffer, mimeType);

    const item = await this.prismaService.evidenceAsset.create({
      data: {
        evaluationId,
        revisionId: evaluation.currentRevisionId,
        kind: 'file',
        title: payload.title,
        description: payload.description ?? null,
        ownerName: payload.ownerName ?? null,
        sourceDate: payload.sourceDate ? new Date(payload.sourceDate) : null,
        evidenceBasis: payload.evidenceBasis,
        confidenceWeight: payload.confidenceWeight ?? null,
        linkedTopicCode: payload.linkedTopicCode ?? null,
        linkedRiskCode: payload.linkedRiskCode ?? null,
        linkedOpportunityCode: payload.linkedOpportunityCode ?? null,
        linkedRecommendationId: payload.linkedRecommendationId ?? null,
        reviewState: payload.reviewState ?? 'draft',
        scenarioId: payload.scenarioId ?? null,
        storageKey,
        fileName,
        mimeType,
        byteSize: file.size,
        createdByUserId: currentUser.id
      }
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evidence.created',
      targetType: 'evidence_asset',
      targetId: item.id,
      metadata: {
        evaluationId,
        byteSize: file.size,
        mimeType
      }
    });

    return this.serializeEvidence(item);
  }

  async downloadEvidence(
    currentUser: SessionUser,
    evaluationId: string,
    evidenceId: string,
    response: {
      setHeader(name: string, value: string): void;
      write(chunk: Buffer): void;
      end(): void;
    }
  ) {
    await this.assertWorkspaceEvaluationAccess(currentUser, evaluationId);
    const item = await this.prismaService.evidenceAsset.findFirst({
      where: {
        id: evidenceId,
        evaluationId
      }
    });

    if (!item) {
      throw new NotFoundException('Evidence asset not found.');
    }

    if (!item.storageKey || !item.fileName || !item.mimeType) {
      throw new BadRequestException('This evidence item does not have a binary upload.');
    }

    const binary = await this.evaluationStorageService.readObject(item.storageKey);
    response.setHeader('Content-Type', item.mimeType);
    response.setHeader('Content-Disposition', `attachment; filename="${item.fileName}"`);
    response.write(binary);
    response.end();
  }

  async createProgramSubmission(
    currentUser: SessionUser,
    programId: string,
    payload: CreateProgramSubmissionPayload
  ): Promise<ProgramDetail> {
    const access = await this.getProgramAccess(programId, currentUser.id);
    const evaluation = await this.assertWorkspaceEvaluationAccess(
      currentUser,
      payload.evaluationId
    );

    const revisionNumber = payload.revisionNumber ?? evaluation.currentRevisionNumber;

    if (!revisionNumber || revisionNumber < 1) {
      throw new BadRequestException('A saved revision is required before submission.');
    }

    const revision = await this.prismaService.evaluationRevision.findUnique({
      where: {
        evaluationId_revisionNumber: {
          evaluationId: evaluation.id,
          revisionNumber
        }
      },
      select: {
        id: true,
        revisionNumber: true
      }
    });

    if (!revision) {
      throw new NotFoundException('Requested revision not found.');
    }

    const existing = await this.prismaService.programSubmission.findFirst({
      where: {
        programId,
        evaluationId: evaluation.id,
        revisionNumber
      },
      select: {
        id: true
      }
    });

    if (!existing) {
      await this.prismaService.programSubmission.create({
        data: {
          programId,
          organizationId: evaluation.organizationId ?? access.program.organizationId,
          evaluationId: evaluation.id,
          revisionId: revision.id,
          revisionNumber: revision.revisionNumber,
          status: 'submitted',
          submittedAt: new Date()
        }
      });

      await this.auditService.log({
        actorId: currentUser.id,
        action: 'evaluation.context_updated',
        targetType: 'program_submission',
        targetId: `${programId}:${evaluation.id}:${revision.revisionNumber}`,
        metadata: {
          programId,
          evaluationId: evaluation.id,
          revisionNumber: revision.revisionNumber
        }
      });
    }

    return this.getProgram(currentUser, programId);
  }

  async updateProgramSubmissionStatus(
    currentUser: SessionUser,
    programId: string,
    submissionId: string,
    payload: UpdateProgramSubmissionStatusPayload
  ): Promise<ProgramDetail> {
    const access = await this.getProgramAccess(programId, currentUser.id);

    if (!access.canReview) {
      throw new ForbiddenException('Only reviewers and managers can update submission state.');
    }

    if (access.role !== 'manager' && payload.status === 'archived') {
      throw new ForbiddenException('Only program managers can archive submissions.');
    }

    await this.assertProgramSubmission(programId, submissionId);

    await this.prismaService.programSubmission.update({
      where: {
        id: submissionId
      },
      data: {
        status: payload.status,
        submittedAt: payload.status === 'submitted' ? new Date() : undefined,
        lastReviewedAt:
          payload.status === 'in_review' ||
          payload.status === 'changes_requested' ||
          payload.status === 'approved'
            ? new Date()
            : undefined
      }
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.context_updated',
      targetType: 'program_submission',
      targetId: submissionId,
      metadata: {
        programId,
        submissionStatus: payload.status
      }
    });

    return this.getProgram(currentUser, programId);
  }

  async createReviewAssignment(
    currentUser: SessionUser,
    programId: string,
    submissionId: string,
    payload: CreateReviewAssignmentPayload
  ): Promise<ProgramDetail> {
    const access = await this.getProgramAccess(programId, currentUser.id);

    if (access.role !== 'manager') {
      throw new ForbiddenException('Only program managers can assign reviewers.');
    }

    await this.assertProgramSubmission(programId, submissionId);

    const reviewerMember = await this.prismaService.programMember.findFirst({
      where: {
        programId,
        userId: payload.reviewerUserId
      },
      select: {
        role: true
      }
    });

    if (!reviewerMember || !['reviewer', 'manager'].includes(reviewerMember.role)) {
      throw new BadRequestException(
        'Reviewer must be a manager or reviewer member of this program.'
      );
    }

    const existing = await this.prismaService.reviewAssignment.findFirst({
      where: {
        submissionId,
        reviewerUserId: payload.reviewerUserId
      },
      select: {
        id: true
      }
    });

    if (existing) {
      await this.prismaService.reviewAssignment.update({
        where: {
          id: existing.id
        },
        data: {
          dueAt: payload.dueAt ? new Date(payload.dueAt) : null,
          status: 'pending'
        }
      });
    } else {
      await this.prismaService.reviewAssignment.create({
        data: {
          submissionId,
          reviewerUserId: payload.reviewerUserId,
          dueAt: payload.dueAt ? new Date(payload.dueAt) : null,
          status: 'pending'
        }
      });
    }

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.context_updated',
      targetType: 'review_assignment',
      targetId: submissionId,
      metadata: {
        programId,
        reviewerUserId: payload.reviewerUserId
      }
    });

    return this.getProgram(currentUser, programId);
  }

  async createReviewComment(
    currentUser: SessionUser,
    programId: string,
    submissionId: string,
    payload: CreateReviewCommentPayload
  ): Promise<ProgramDetail> {
    await this.getProgramAccess(programId, currentUser.id);
    await this.assertProgramSubmission(programId, submissionId);

    await this.prismaService.reviewComment.create({
      data: {
        submissionId,
        authorUserId: currentUser.id,
        body: payload.body
      }
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.context_updated',
      targetType: 'review_comment',
      targetId: submissionId,
      metadata: {
        programId
      }
    });

    return this.getProgram(currentUser, programId);
  }

  async listScenarios(
    currentUser: SessionUser,
    evaluationId: string
  ): Promise<ScenarioRunListResponse> {
    await this.assertWorkspaceEvaluationAccess(currentUser, evaluationId);

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
    const evaluation = await this.assertWorkspaceEvaluationAccess(currentUser, evaluationId);
    const report = await this.getScenarioBaseReport(evaluation.currentRevisionId, evaluationId);
    const projection = buildScenarioProjection(report, payload.assumptions);

    const item = await this.prismaService.scenarioRun.create({
      data: {
        evaluationId,
        baseRevisionId: evaluation.currentRevisionId,
        baseRevisionNumber: evaluation.currentRevisionNumber,
        name: payload.name,
        status: 'draft',
        focusArea: payload.focusArea,
        geography: payload.geography ?? null,
        dependency: payload.dependency ?? null,
        timeframe: payload.timeframe ?? null,
        hypothesis: payload.hypothesis,
        advisorySummary: projection.advisorySummary,
        assumptions: payload.assumptions,
        metricDeltas: projection.metricDeltas,
        topicDeltas: projection.topicDeltas,
        projectedConfidenceBand: projection.projectedConfidenceBand,
        takeaways: projection.takeaways,
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

  private async assertWorkspaceEvaluationAccess(currentUser: SessionUser, evaluationId: string) {
    const evaluation = await this.prismaService.evaluation.findFirst({
      where: {
        id: evaluationId,
        OR: [
          {
            userId: currentUser.id
          },
          {
            organization: {
              members: {
                some: {
                  userId: currentUser.id,
                  role: {
                    in: ['owner', 'manager', 'member']
                  }
                }
              }
            }
          }
        ]
      },
      select: {
        id: true,
        organizationId: true,
        currentRevisionId: true,
        currentRevisionNumber: true
      }
    });

    if (!evaluation) {
      throw new ForbiddenException('Evaluation access denied.');
    }

    return evaluation;
  }

  private async assertProgramSubmission(programId: string, submissionId: string) {
    const submission = await this.prismaService.programSubmission.findFirst({
      where: {
        id: submissionId,
        programId
      },
      select: {
        id: true
      }
    });

    if (!submission) {
      throw new NotFoundException('Program submission not found.');
    }
  }

  private assertEditorialAccess(currentUser: SessionUser) {
    if (!['owner', 'admin'].includes(currentUser.role)) {
      throw new ForbiddenException('Editorial access denied.');
    }
  }

  private async getScenarioBaseReport(revisionId: string | null, evaluationId: string) {
    if (revisionId) {
      const revision = await this.prismaService.evaluationRevision.findUnique({
        where: {
          id: revisionId
        },
        select: {
          reportSnapshot: true
        }
      });

      if (revision) {
        return ReportResponseSchema.parse(revision.reportSnapshot);
      }
    }

    const revision = await this.prismaService.evaluationRevision.findFirst({
      where: {
        evaluationId
      },
      orderBy: [{ revisionNumber: 'desc' }],
      select: {
        reportSnapshot: true
      }
    });

    if (!revision) {
      throw new BadRequestException('A saved revision is required before creating a scenario.');
    }

    return ReportResponseSchema.parse(revision.reportSnapshot);
  }

  private async getProgramAccess(programId: string, userId: string) {
    const program = await this.prismaService.program.findFirst({
      where: {
        id: programId,
        OR: [
          {
            members: {
              some: {
                userId
              }
            }
          },
          {
            organization: {
              members: {
                some: {
                  userId
                }
              }
            }
          }
        ]
      },
      select: {
        id: true,
        organizationId: true,
        members: {
          select: {
            userId: true,
            role: true
          }
        },
        organization: {
          select: {
            members: {
              select: {
                userId: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!program) {
      throw new ForbiddenException('Program access denied.');
    }

    const programRole = this.findProgramRole(program.members, userId);
    const organizationRole =
      program.organization.members.find(
        (member: (typeof program.organization.members)[number]) => member.userId === userId
      )?.role ?? null;
    const effectiveRole =
      programRole ??
      (organizationRole === 'owner' || organizationRole === 'manager' ? 'manager' : null);

    return {
      program,
      role: effectiveRole,
      canReview: effectiveRole === 'manager' || effectiveRole === 'reviewer'
    };
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

  private serializePublicResource(resource: {
    id: string;
    slug: string;
    title: string;
    description: string;
    category: string;
    fileLabel: string;
    externalUrl: string | null;
    fileName: string | null;
    mimeType: string | null;
    byteSize: number | null;
    updatedAt: Date;
  }): PublicResourceAsset {
    return {
      id: resource.id,
      slug: resource.slug,
      title: resource.title,
      description: resource.description,
      category: resource.category as
        | 'manual'
        | 'faq'
        | 'methodology'
        | 'sample_report'
        | 'workflow_asset',
      href: resource.externalUrl ?? `/api/content/resources/${resource.id}/download`,
      fileLabel: resource.fileLabel,
      fileName: resource.fileName,
      mimeType: resource.mimeType,
      byteSize: resource.byteSize,
      updatedAt: resource.updatedAt.toISOString()
    };
  }

  private serializeResource(resource: {
    id: string;
    slug: string;
    title: string;
    description: string;
    category: string;
    fileLabel: string;
    status: string;
    locale: string;
    externalUrl: string | null;
    fileName: string | null;
    mimeType: string | null;
    byteSize: number | null;
    storageKey?: string | null;
    sortOrder: number;
    updatedAt: Date;
  }): ResourceAssetSummary {
    return {
      id: resource.id,
      slug: resource.slug,
      title: resource.title,
      description: resource.description,
      category: resource.category as
        | 'manual'
        | 'faq'
        | 'methodology'
        | 'sample_report'
        | 'workflow_asset',
      fileLabel: resource.fileLabel,
      status: resource.status as ContentStatus,
      locale: resource.locale,
      externalUrl: resource.externalUrl,
      fileName: resource.fileName,
      mimeType: resource.mimeType,
      byteSize: resource.byteSize,
      hasBinary: Boolean(resource.storageKey && resource.fileName),
      sortOrder: resource.sortOrder,
      updatedAt: resource.updatedAt.toISOString()
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
    linkedTopicCode: 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'S1' | 'S2' | 'S3' | 'S4' | 'G1' | null;
    linkedRiskCode:
      | 'climate_policy_risk'
      | 'water_scarcity_risk'
      | 'biodiversity_regulation_risk'
      | 'resource_scarcity_risk'
      | 'community_stability_risk'
      | 'consumer_governance_risk'
      | null;
    linkedOpportunityCode:
      | 'climate_transition_opportunity'
      | 'water_reputation_opportunity'
      | 'biodiversity_reputation_opportunity'
      | 'circular_efficiency_opportunity'
      | 'community_reputation_opportunity'
      | 'governance_trust_opportunity'
      | null;
    linkedRecommendationId: string | null;
    reviewState: string;
    storageKey?: string | null;
    fileName?: string | null;
    mimeType?: string | null;
    byteSize?: number | null;
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
      linkedRiskCode: item.linkedRiskCode,
      linkedOpportunityCode: item.linkedOpportunityCode,
      linkedRecommendationId: item.linkedRecommendationId,
      reviewState: item.reviewState as 'draft' | 'review_requested' | 'validated' | 'needs_update',
      fileName: item.fileName ?? null,
      mimeType: item.mimeType ?? null,
      byteSize: item.byteSize ?? null,
      hasBinary: Boolean(item.fileName && item.storageKey),
      createdAt: item.createdAt.toISOString()
    };
  }

  private serializeScenario(item: {
    id: string;
    evaluationId: string;
    baseRevisionId: string | null;
    baseRevisionNumber: number | null;
    name: string;
    status: string;
    focusArea: string;
    geography: string | null;
    dependency: string | null;
    timeframe: string | null;
    hypothesis: string;
    assumptions: Prisma.JsonValue | null;
    advisorySummary: string;
    metricDeltas: Prisma.JsonValue | null;
    topicDeltas: Prisma.JsonValue | null;
    projectedConfidenceBand: 'high' | 'moderate' | 'low';
    takeaways: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }): ScenarioRunSummary {
    return {
      id: item.id,
      evaluationId: item.evaluationId,
      baseRevisionId: item.baseRevisionId,
      baseRevisionNumber: item.baseRevisionNumber,
      name: item.name,
      status: item.status as 'draft' | 'submitted' | 'archived',
      focusArea: item.focusArea,
      geography: item.geography,
      dependency: item.dependency,
      timeframe: item.timeframe,
      hypothesis: item.hypothesis,
      assumptions: this.parseScenarioAssumptions(item.assumptions),
      advisorySummary: item.advisorySummary,
      metricDeltas: this.parseScenarioMetricDeltas(item.metricDeltas),
      topicDeltas: this.parseScenarioTopicDeltas(item.topicDeltas),
      projectedConfidenceBand: item.projectedConfidenceBand,
      takeaways: this.parseScenarioTakeaways(item.takeaways),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    };
  }

  private parseScenarioAssumptions(
    value: Prisma.JsonValue | null | undefined
  ): ScenarioAssumptions {
    const parsed = value && typeof value === 'object' ? value : {};

    return {
      financialDelta:
        typeof (parsed as Record<string, unknown>).financialDelta === 'number'
          ? ((parsed as Record<string, unknown>).financialDelta as number)
          : 0,
      riskDelta:
        typeof (parsed as Record<string, unknown>).riskDelta === 'number'
          ? ((parsed as Record<string, unknown>).riskDelta as number)
          : 0,
      opportunityDelta:
        typeof (parsed as Record<string, unknown>).opportunityDelta === 'number'
          ? ((parsed as Record<string, unknown>).opportunityDelta as number)
          : 0,
      confidenceShift:
        (parsed as Record<string, unknown>).confidenceShift === 'down' ||
        (parsed as Record<string, unknown>).confidenceShift === 'up'
          ? ((parsed as Record<string, unknown>).confidenceShift as 'down' | 'up')
          : 'same',
      impactedTopicCodes: Array.isArray((parsed as Record<string, unknown>).impactedTopicCodes)
        ? (((parsed as Record<string, unknown>).impactedTopicCodes as string[]).filter(
            Boolean
          ) as Array<'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'S1' | 'S2' | 'S3' | 'S4' | 'G1'>)
        : []
    };
  }

  private parseScenarioMetricDeltas(
    value: Prisma.JsonValue | null | undefined
  ): ScenarioMetricDelta[] {
    return Array.isArray(value)
      ? (value as Array<Record<string, unknown>>).map(
          (item): ScenarioMetricDelta => ({
            key:
              item.key === 'risk_overall' || item.key === 'opportunity_overall'
                ? item.key
                : 'financial_total',
            label: typeof item.label === 'string' ? item.label : 'Metric',
            currentValue: typeof item.currentValue === 'number' ? item.currentValue : 0,
            scenarioValue: typeof item.scenarioValue === 'number' ? item.scenarioValue : 0,
            delta: typeof item.delta === 'number' ? item.delta : 0
          })
        )
      : [];
  }

  private parseScenarioTopicDeltas(
    value: Prisma.JsonValue | null | undefined
  ): ScenarioTopicDelta[] {
    return Array.isArray(value)
      ? (value as Array<Record<string, unknown>>).map(
          (item): ScenarioTopicDelta => ({
            topicCode: typeof item.topicCode === 'string' ? (item.topicCode as TopicCode) : 'E1',
            title: typeof item.title === 'string' ? item.title : 'Topic',
            currentBand:
              typeof item.currentBand === 'string'
                ? (item.currentBand as PriorityBand)
                : 'not_applicable',
            scenarioBand:
              typeof item.scenarioBand === 'string'
                ? (item.scenarioBand as PriorityBand)
                : 'not_applicable',
            note: typeof item.note === 'string' ? item.note : 'No note'
          })
        )
      : [];
  }

  private parseScenarioTakeaways(value: Prisma.JsonValue | null | undefined) {
    return Array.isArray(value)
      ? (value as Array<unknown>).filter((item): item is string => typeof item === 'string')
      : [];
  }
}
