import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { getReferenceMetadata } from '@packages/scoring';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  ContentEntityType,
  ContentRevisionListResponse,
  ContentRevisionSummary,
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
  MediaAsset,
  OrganizationDetail,
  OrganizationListResponse,
  PartnerLeadSummary,
  ProgramDetail,
  ProgramListResponse,
  ReportResponse,
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
  SitePage,
  SitePagePreviewToken,
  SiteSetting,
  SiteSettings,
  TopicCode,
  UpdateMediaAssetPayload,
  UpdatePartnerLeadPayload,
  UpdateProgramSubmissionStatusPayload,
  UpsertCaseStudyPayload,
  UpsertFaqEntryPayload,
  UpsertKnowledgeArticlePayload,
  UpsertResourceAssetPayload,
  UpsertSitePagePayload,
  UpsertSiteSettingPayload
} from '@packages/shared';
import {
  ContentEntityTypeSchema,
  ReportResponseSchema,
  SitePageSchema,
  UploadMediaAssetPayloadSchema
} from '@packages/shared';
import { Prisma } from '@prisma/client';
import { buildScenarioProjection } from './scenario-projections';
import { AuditService } from '../audit/audit.service';
import { EvaluationStorageService } from '../evaluations/evaluation-storage.service';
import { PrismaService } from '../prisma/prisma.service';

const referenceResourceFallbacks: Record<string, string> = {
  'zeeus-introduction': 'references/Hackathon_User Guidlines/1) Introduction_ZEEUS.pdf',
  'zeeus-user-manual': 'references/Hackathon_User Guidlines/2) Usermanual_ZEEUS.pdf',
  'zeeus-faq': 'references/Hackathon_User Guidlines/3) FAQ_ZEEUS.pdf',
  'zeeus-score-interpretation':
    'references/Hackathon_User Guidlines/4) Score Interpretation_ZEEUS.pdf',
  'zeeus-tool-example-pack': 'references/Hackathon_User Guidlines/5) Tool & Example.zip',
  'zeeus-guidelines-kit': 'references/Hackathon_User Guidlines/6) GUIDELINES KIT- ZEEUS.pdf',
  'zeeus-tool-introduction-transcript':
    'references/Hackathon_User Guidlines/Tool_Introduction_Video.txt'
};

@Injectable()
export class PlatformService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
    private readonly evaluationStorageService: EvaluationStorageService
  ) {}

  async getSiteContent(locale?: string): Promise<PublicSiteContent> {
    const resolvedLocale = this.resolveLocale(locale);
    const preferredLocales = this.getPreferredLocales(resolvedLocale);
    const [
      sitePagesRaw,
      siteSettingsRaw,
      mediaAssetsRaw,
      articlesRaw,
      faqEntriesRaw,
      caseStudiesRaw,
      resourcesRaw,
      programs
    ] = await Promise.all([
      this.prismaService.sitePage.findMany({
        where: {
          status: 'published',
          locale: { in: preferredLocales }
        },
        include: {
          heroMediaAsset: true
        },
        orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }]
      }),
      this.prismaService.siteSetting.findMany({
        where: {
          locale: { in: preferredLocales }
        },
        orderBy: [{ key: 'asc' }, { updatedAt: 'desc' }]
      }),
      this.prismaService.mediaAsset.findMany({
        where: {
          status: 'published',
          locale: { in: preferredLocales }
        },
        orderBy: [{ createdAt: 'asc' }]
      }),
      this.prismaService.knowledgeArticle.findMany({
        where: {
          status: 'published',
          locale: { in: preferredLocales }
        },
        orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }]
      }),
      this.prismaService.faqEntry.findMany({
        where: {
          status: 'published',
          locale: { in: preferredLocales }
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
      }),
      this.prismaService.caseStudy.findMany({
        where: {
          status: 'published',
          locale: { in: preferredLocales }
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
      }),
      this.prismaService.resourceAsset.findMany({
        where: {
          status: 'published',
          locale: { in: preferredLocales }
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

    const sitePages = this.pickPreferredLocale<(typeof sitePagesRaw)[number], string>(
      sitePagesRaw,
      (item) => item.slug,
      resolvedLocale
    );
    const siteSettings = this.pickPreferredLocale(
      siteSettingsRaw as (typeof siteSettingsRaw)[number][],
      (item) => item.key,
      resolvedLocale
    );
    const mediaAssets = this.pickPreferredLocale<(typeof mediaAssetsRaw)[number], string>(
      mediaAssetsRaw,
      (item) => item.slug,
      resolvedLocale
    );
    const articles = this.pickPreferredLocale<(typeof articlesRaw)[number], string>(
      articlesRaw,
      (item) => item.slug,
      resolvedLocale
    );
    const faqEntries = this.pickPreferredLocale(
      faqEntriesRaw as (typeof faqEntriesRaw)[number][],
      (item) => `${item.category}:${item.sortOrder}`,
      resolvedLocale
    );
    const caseStudies = this.pickPreferredLocale<(typeof caseStudiesRaw)[number], string>(
      caseStudiesRaw,
      (item) => item.slug,
      resolvedLocale
    );
    const resources = this.pickPreferredLocale<(typeof resourcesRaw)[number], string>(
      resourcesRaw,
      (item) => item.slug,
      resolvedLocale
    );

    return {
      referenceMetadata: this.buildReferenceMetadata(),
      sitePages: sitePages.map((page: (typeof sitePages)[number]) => this.serializeSitePage(page)),
      settings: this.serializeSiteSettings(siteSettings),
      mediaAssets: mediaAssets.map((asset: (typeof mediaAssets)[number]) =>
        this.serializeMediaAsset(asset)
      ),
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
        this.serializePublicResource(resource)
      ),
      partnerPrograms: programs.map((program: (typeof programs)[number]) =>
        this.serializeProgramSummary(program, null)
      )
    };
  }

  async getSdgGoal(goalNumber: number, locale?: string): Promise<SdgGoalDetail> {
    const resolvedLocale = this.resolveLocale(locale);
    const targets = this.pickPreferredLocale<
      Awaited<ReturnType<typeof this.prismaService.sdgTarget.findMany>>[number],
      string
    >(
      await this.prismaService.sdgTarget.findMany({
        where: {
          goalNumber,
          status: 'published',
          locale: { in: this.getPreferredLocales(resolvedLocale) }
        },
        orderBy: [{ sortOrder: 'asc' }, { targetCode: 'asc' }]
      }),
      (item) => item.targetCode,
      resolvedLocale
    );

    if (targets.length === 0) {
      throw new NotFoundException('SDG goal not found.');
    }

    const firstTarget = targets[0]!;

    return {
      goalNumber,
      goalTitle: firstTarget.goalTitle,
      summary: firstTarget.goalSummary,
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

    const [
      sitePages,
      siteSettings,
      mediaAssets,
      articles,
      faqEntries,
      caseStudies,
      resources,
      partnerLeads
    ] = await Promise.all([
      this.prismaService.sitePage.findMany({
        include: {
          heroMediaAsset: true
        },
        orderBy: [{ locale: 'asc' }, { sortOrder: 'asc' }, { updatedAt: 'desc' }]
      }),
      this.prismaService.siteSetting.findMany({
        orderBy: [{ locale: 'asc' }, { key: 'asc' }, { updatedAt: 'desc' }]
      }),
      this.prismaService.mediaAsset.findMany({
        orderBy: [{ locale: 'asc' }, { createdAt: 'asc' }]
      }),
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
      this.prismaService.partnerInterestLead.findMany({
        orderBy: [{ createdAt: 'desc' }]
      })
    ]);

    return {
      referenceMetadata: this.buildReferenceMetadata(),
      sitePages: sitePages.map((page: (typeof sitePages)[number]) => this.serializeSitePage(page)),
      siteSettings: siteSettings.map((setting: (typeof siteSettings)[number]) =>
        this.serializeSiteSetting(setting)
      ),
      mediaAssets: mediaAssets.map((asset: (typeof mediaAssets)[number]) =>
        this.serializeMediaAsset(asset)
      ),
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
      partnerLeads: partnerLeads.map((lead: (typeof partnerLeads)[number]) =>
        this.serializePartnerLead(lead)
      ),
      partnerInterestCount: partnerLeads.length
    };
  }

  async createSitePage(
    currentUser: SessionUser,
    payload: UpsertSitePagePayload
  ): Promise<SitePage> {
    this.assertEditorialAccess(currentUser);
    const page = await this.prismaService.sitePage.create({
      data: this.buildSitePageData(payload),
      include: {
        heroMediaAsset: true
      }
    });
    const serialized = this.serializeSitePage(page);

    await this.recordContentRevision('site_page', page.id, serialized, currentUser.id, 'Created');

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'content.site_page_upserted',
      targetType: 'site_page',
      targetId: page.id,
      metadata: {
        slug: page.slug,
        locale: page.locale,
        status: page.status
      }
    });

    return serialized;
  }

  async updateSitePage(
    currentUser: SessionUser,
    contentId: string,
    payload: UpsertSitePagePayload
  ): Promise<SitePage> {
    this.assertEditorialAccess(currentUser);
    const page = await this.prismaService.sitePage.update({
      where: { id: contentId },
      data: this.buildSitePageData(payload),
      include: {
        heroMediaAsset: true
      }
    });
    const serialized = this.serializeSitePage(page);

    await this.recordContentRevision('site_page', page.id, serialized, currentUser.id, 'Updated');

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'content.site_page_upserted',
      targetType: 'site_page',
      targetId: page.id,
      metadata: {
        slug: page.slug,
        locale: page.locale,
        status: page.status
      }
    });

    return serialized;
  }

  async listContentRevisions(
    currentUser: SessionUser,
    entityType: ContentEntityType,
    entityId: string
  ): Promise<ContentRevisionListResponse> {
    this.assertEditorialAccess(currentUser);
    const revisions = await this.prismaService.contentRevision.findMany({
      where: {
        entityType,
        entityId
      },
      orderBy: [{ createdAt: 'desc' }]
    });

    return {
      items: revisions.map((revision: Parameters<typeof this.serializeContentRevision>[0]) =>
        this.serializeContentRevision(revision)
      )
    };
  }

  async restoreSitePageRevision(
    currentUser: SessionUser,
    contentId: string,
    revisionId: string
  ): Promise<SitePage> {
    this.assertEditorialAccess(currentUser);
    const revision = await this.prismaService.contentRevision.findFirst({
      where: {
        id: revisionId,
        entityType: 'site_page',
        entityId: contentId
      }
    });

    if (!revision) {
      throw new NotFoundException('Content revision not found.');
    }

    const snapshot = SitePageSchema.parse(revision.snapshot);
    const page = await this.prismaService.sitePage.update({
      where: { id: contentId },
      data: this.buildSitePageData({
        slug: snapshot.slug,
        locale: snapshot.locale,
        title: snapshot.title,
        summary: snapshot.summary,
        pageType: snapshot.pageType,
        status: snapshot.status,
        heroEyebrow: snapshot.heroEyebrow,
        heroTitle: snapshot.heroTitle,
        heroBody: snapshot.heroBody,
        heroPrimaryCtaLabel: snapshot.heroPrimaryCtaLabel,
        heroPrimaryCtaHref: snapshot.heroPrimaryCtaHref,
        heroSecondaryCtaLabel: snapshot.heroSecondaryCtaLabel,
        heroSecondaryCtaHref: snapshot.heroSecondaryCtaHref,
        heroMediaAssetId: snapshot.heroMediaAssetId,
        navigationLabel: snapshot.navigationLabel,
        navigationGroup: snapshot.navigationGroup,
        showInPrimaryNav: snapshot.showInPrimaryNav,
        showInFooter: snapshot.showInFooter,
        canonicalUrl: snapshot.canonicalUrl,
        seoTitle: snapshot.seoTitle,
        seoDescription: snapshot.seoDescription,
        sections: snapshot.sections,
        sortOrder: snapshot.sortOrder
      }),
      include: {
        heroMediaAsset: true
      }
    });
    const serialized = this.serializeSitePage(page);

    await this.recordContentRevision(
      'site_page',
      page.id,
      serialized,
      currentUser.id,
      `Restored from revision ${revision.createdAt.toISOString()}`
    );

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'content.site_page_upserted',
      targetType: 'site_page',
      targetId: page.id,
      metadata: {
        restoredRevisionId: revision.id,
        slug: page.slug,
        locale: page.locale
      }
    });

    return serialized;
  }

  async createSitePagePreviewToken(
    currentUser: SessionUser,
    contentId: string
  ): Promise<SitePagePreviewToken> {
    this.assertEditorialAccess(currentUser);
    const page = await this.prismaService.sitePage.findUnique({
      where: { id: contentId }
    });

    if (!page) {
      throw new NotFoundException('Site page not found.');
    }

    const token = `${randomUUID().replaceAll('-', '')}${randomUUID().replaceAll('-', '')}`;
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await this.prismaService.sitePagePreviewToken.create({
      data: {
        sitePageId: page.id,
        tokenHash,
        expiresAt,
        createdByUserId: currentUser.id
      }
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'content.site_page_upserted',
      targetType: 'site_page_preview_token',
      targetId: page.id,
      metadata: {
        slug: page.slug,
        locale: page.locale,
        expiresAt: expiresAt.toISOString()
      }
    });

    return {
      sitePageId: page.id,
      slug: page.slug,
      token,
      previewUrl: `/preview/${token}`,
      expiresAt: expiresAt.toISOString()
    };
  }

  async getPreviewSitePage(token: string): Promise<SitePage> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const preview = await this.prismaService.sitePagePreviewToken.findFirst({
      where: {
        tokenHash,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        sitePage: {
          include: {
            heroMediaAsset: true
          }
        }
      }
    });

    if (!preview) {
      throw new NotFoundException('Preview token is invalid or expired.');
    }

    return this.serializeSitePage(preview.sitePage);
  }

  async createSiteSetting(
    currentUser: SessionUser,
    payload: UpsertSiteSettingPayload
  ): Promise<SiteSetting> {
    this.assertEditorialAccess(currentUser);
    const setting = await this.prismaService.siteSetting.create({
      data: {
        key: payload.key,
        locale: payload.locale,
        title: payload.title ?? null,
        description: payload.description ?? null,
        value: (payload.value ?? null) as Prisma.InputJsonValue
      }
    });
    const serialized = this.serializeSiteSetting(setting);

    await this.recordContentRevision(
      'site_setting',
      setting.id,
      serialized,
      currentUser.id,
      'Created'
    );

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'content.site_setting_upserted',
      targetType: 'site_setting',
      targetId: setting.id,
      metadata: {
        key: setting.key,
        locale: setting.locale
      }
    });

    return serialized;
  }

  async updateSiteSetting(
    currentUser: SessionUser,
    contentId: string,
    payload: UpsertSiteSettingPayload
  ): Promise<SiteSetting> {
    this.assertEditorialAccess(currentUser);
    const setting = await this.prismaService.siteSetting.update({
      where: { id: contentId },
      data: {
        key: payload.key,
        locale: payload.locale,
        title: payload.title ?? null,
        description: payload.description ?? null,
        value: (payload.value ?? null) as Prisma.InputJsonValue
      }
    });
    const serialized = this.serializeSiteSetting(setting);

    await this.recordContentRevision(
      'site_setting',
      setting.id,
      serialized,
      currentUser.id,
      'Updated'
    );

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'content.site_setting_upserted',
      targetType: 'site_setting',
      targetId: setting.id,
      metadata: {
        key: setting.key,
        locale: setting.locale
      }
    });

    return serialized;
  }

  async uploadMediaAsset(
    currentUser: SessionUser,
    payload: Record<string, string | undefined>,
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    }
  ): Promise<MediaAsset> {
    this.assertEditorialAccess(currentUser);

    if (!file?.buffer?.byteLength) {
      throw new BadRequestException('Media upload is missing a file.');
    }

    const parsed = UploadMediaAssetPayloadSchema.parse({
      slug: payload.slug,
      title: payload.title,
      altText: payload.altText,
      caption: payload.caption ?? null,
      attribution: payload.attribution ?? null,
      rights: payload.rights ?? null,
      locale: payload.locale ?? 'en',
      status: payload.status ?? 'draft'
    });

    const checksumSha256 = createHash('sha256').update(file.buffer).digest('hex');
    const fileName = file.originalname || `${parsed.slug}.bin`;
    const mimeType = file.mimetype || 'application/octet-stream';
    const storageKey = this.evaluationStorageService.buildStorageKey(
      checksumSha256,
      fileName,
      'content-media'
    );

    await this.evaluationStorageService.writeObject(storageKey, file.buffer, mimeType);

    const asset = await this.prismaService.mediaAsset.create({
      data: {
        slug: parsed.slug,
        title: parsed.title,
        altText: parsed.altText,
        caption: parsed.caption ?? null,
        attribution: parsed.attribution ?? null,
        rights: parsed.rights ?? null,
        mimeType,
        fileName,
        byteSize: file.size,
        storageKey,
        publicUrl: null,
        locale: parsed.locale,
        status: parsed.status
      }
    });

    const updatedAsset = await this.prismaService.mediaAsset.update({
      where: { id: asset.id },
      data: {
        publicUrl: `/api/content/media/${asset.id}/file`
      }
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'content.media_asset_uploaded',
      targetType: 'media_asset',
      targetId: asset.id,
      metadata: {
        slug: asset.slug,
        locale: asset.locale
      }
    });

    const serialized = this.serializeMediaAsset(updatedAsset);
    await this.recordContentRevision(
      'media_asset',
      updatedAsset.id,
      serialized,
      currentUser.id,
      'Uploaded binary'
    );

    return serialized;
  }

  async updateMediaAsset(
    currentUser: SessionUser,
    mediaId: string,
    payload: UpdateMediaAssetPayload
  ): Promise<MediaAsset> {
    this.assertEditorialAccess(currentUser);
    const asset = await this.prismaService.mediaAsset.update({
      where: { id: mediaId },
      data: {
        title: payload.title,
        altText: payload.altText,
        caption: payload.caption ?? null,
        attribution: payload.attribution ?? null,
        rights: payload.rights ?? null,
        locale: payload.locale,
        status: payload.status,
        focalPointX: payload.focalPointX ?? null,
        focalPointY: payload.focalPointY ?? null
      }
    });
    const serialized = this.serializeMediaAsset(asset);
    await this.recordContentRevision(
      'media_asset',
      asset.id,
      serialized,
      currentUser.id,
      'Updated metadata'
    );

    return serialized;
  }

  async getMediaAssetFile(mediaId: string) {
    const asset = await this.prismaService.mediaAsset.findFirst({
      where: {
        id: mediaId,
        status: 'published'
      }
    });

    if (!asset) {
      throw new NotFoundException('Media asset not found.');
    }

    if (asset.publicUrl && !asset.storageKey) {
      return {
        type: 'redirect' as const,
        location: asset.publicUrl
      };
    }

    if (!asset.storageKey) {
      throw new BadRequestException('This media asset does not have a file.');
    }

    return {
      type: 'binary' as const,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      content: await this.evaluationStorageService.readObject(asset.storageKey)
    };
  }

  async updatePartnerLead(
    currentUser: SessionUser,
    leadId: string,
    payload: UpdatePartnerLeadPayload
  ): Promise<PartnerLeadSummary> {
    this.assertEditorialAccess(currentUser);
    const lead = await this.prismaService.partnerInterestLead.update({
      where: { id: leadId },
      data: {
        status: payload.status,
        assigneeName: payload.assigneeName ?? null,
        assigneeEmail: payload.assigneeEmail ?? null,
        notes: payload.notes ?? null,
        resolvedAt:
          payload.status === 'qualified' || payload.status === 'archived' ? new Date() : null
      }
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'partner.lead_updated',
      targetType: 'partner_interest_lead',
      targetId: lead.id,
      metadata: {
        status: lead.status
      }
    });

    return this.serializePartnerLead(lead);
  }

  async exportPartnerLeadsCsv(currentUser: SessionUser) {
    this.assertEditorialAccess(currentUser);

    const leads = await this.prismaService.partnerInterestLead.findMany({
      orderBy: [{ createdAt: 'desc' }]
    });

    const dataRows: string[][] = leads.map((lead: (typeof leads)[number]) => [
      lead.createdAt.toISOString(),
      lead.updatedAt.toISOString(),
      lead.resolvedAt?.toISOString() ?? '',
      lead.status,
      lead.organizationName,
      lead.name,
      lead.email,
      lead.websiteUrl ?? '',
      lead.sourcePage,
      lead.assigneeName ?? '',
      lead.assigneeEmail ?? '',
      lead.message,
      lead.notes ?? ''
    ]);

    const rows: string[][] = [
      [
        'createdAt',
        'updatedAt',
        'resolvedAt',
        'status',
        'organizationName',
        'name',
        'email',
        'websiteUrl',
        'sourcePage',
        'assigneeName',
        'assigneeEmail',
        'message',
        'notes'
      ],
      ...dataRows
    ];

    return rows
      .map((row: string[]) => row.map((value: string) => this.toCsvCell(value)).join(','))
      .join('\n');
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
    const serialized = {
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
    } satisfies KnowledgeArticle;

    await this.recordContentRevision(
      'knowledge_article',
      article.id,
      serialized,
      currentUser.id,
      'Created'
    );

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

    return serialized;
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
    const serialized = {
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
    } satisfies KnowledgeArticle;

    await this.recordContentRevision(
      'knowledge_article',
      article.id,
      serialized,
      currentUser.id,
      'Updated'
    );

    return serialized;
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
    const serialized = {
      id: entry.id,
      question: entry.question,
      answer: entry.answer,
      category: entry.category,
      status: entry.status as ContentStatus,
      locale: entry.locale,
      sortOrder: entry.sortOrder
    } satisfies FaqEntry;

    await this.recordContentRevision('faq_entry', entry.id, serialized, currentUser.id, 'Created');

    return serialized;
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
    const serialized = {
      id: entry.id,
      question: entry.question,
      answer: entry.answer,
      category: entry.category,
      status: entry.status as ContentStatus,
      locale: entry.locale,
      sortOrder: entry.sortOrder
    } satisfies FaqEntry;

    await this.recordContentRevision('faq_entry', entry.id, serialized, currentUser.id, 'Updated');

    return serialized;
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
    const serialized = {
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
    } satisfies PublicSiteContent['caseStudies'][number];

    await this.recordContentRevision('case_study', study.id, serialized, currentUser.id, 'Created');

    return serialized;
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
    const serialized = {
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
    } satisfies PublicSiteContent['caseStudies'][number];

    await this.recordContentRevision('case_study', study.id, serialized, currentUser.id, 'Updated');

    return serialized;
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
    const serialized = this.serializeResource(resource);
    await this.recordContentRevision(
      'resource_asset',
      resource.id,
      serialized,
      currentUser.id,
      'Created'
    );

    return serialized;
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
    const serialized = this.serializeResource(resource);
    await this.recordContentRevision(
      'resource_asset',
      resource.id,
      serialized,
      currentUser.id,
      'Updated'
    );

    return serialized;
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
    const serialized = this.serializeResource(resource);
    await this.recordContentRevision(
      'resource_asset',
      resource.id,
      serialized,
      currentUser.id,
      'Uploaded binary'
    );

    return serialized;
  }

  async downloadResource(resourceId: string) {
    const resource = await this.prismaService.resourceAsset.findFirst({
      where: {
        id: resourceId,
        status: 'published'
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

    const fallbackAsset = await this.readSeededReferenceResource(resource);

    if (!resource.storageKey || !resource.fileName || !resource.mimeType) {
      if (!fallbackAsset) {
        throw new BadRequestException('This resource does not have a binary asset.');
      }

      return {
        type: 'binary' as const,
        ...fallbackAsset
      };
    }

    try {
      return {
        type: 'binary' as const,
        fileName: resource.fileName,
        mimeType: resource.mimeType,
        content: await this.evaluationStorageService.readObject(resource.storageKey)
      };
    } catch (error) {
      if (!fallbackAsset) {
        throw error;
      }

      return {
        type: 'binary' as const,
        ...fallbackAsset
      };
    }
  }

  async submitPartnerInterest(payload: SubmitPartnerInterestPayload) {
    const lead = await this.prismaService.partnerInterestLead.create({
      data: {
        name: payload.name,
        organizationName: payload.organizationName,
        email: payload.email,
        websiteUrl: payload.websiteUrl ?? null,
        message: payload.message,
        status: 'new'
      }
    });

    await this.auditService.log({
      actorId: null,
      action: 'partner.lead_created',
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
                status: true,
                country: true,
                businessCategoryMain: true,
                businessCategorySubcategory: true,
                extendedNaceCode: true,
                extendedNaceLabel: true,
                naceDivision: true,
                currentStage: true,
                financialTotal: true,
                riskOverall: true,
                opportunityOverall: true,
                confidenceBand: true
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
        country: true,
        businessCategoryMain: true,
        businessCategorySubcategory: true,
        extendedNaceCode: true,
        extendedNaceLabel: true,
        naceDivision: true,
        currentStage: true,
        financialTotal: true,
        riskOverall: true,
        opportunityOverall: true,
        confidenceBand: true,
        currentRevisionId: true,
        currentRevisionNumber: true,
        updatedAt: true
      },
      orderBy: [{ updatedAt: 'desc' }]
    });

    const revisionIds = Array.from(
      new Set(
        [
          ...program.submissions.map(
            (submission: (typeof program.submissions)[number]) => submission.revisionId
          ),
          ...availableEvaluations
            .map(
              (evaluation: (typeof availableEvaluations)[number]) => evaluation.currentRevisionId
            )
            .filter((value: string | null): value is string => Boolean(value))
        ].filter((value: string | null | undefined): value is string => Boolean(value))
      )
    );

    const revisionSnapshots = revisionIds.length
      ? await this.prismaService.evaluationRevision.findMany({
          where: {
            id: {
              in: revisionIds
            }
          },
          select: {
            id: true,
            reportSnapshot: true
          }
        })
      : [];

    const reportsByRevisionId = new Map<string, ReportResponse | null>(
      revisionSnapshots.map((revision: (typeof revisionSnapshots)[number]) => [
        revision.id,
        this.parseReportSnapshot(revision.reportSnapshot)
      ])
    );

    const reviewAssignments = program.submissions.flatMap(
      (submission: (typeof program.submissions)[number]) =>
        submission.reviewAssignments.map(
          (assignment: (typeof submission.reviewAssignments)[number]) =>
            this.serializeReviewAssignment(submission.id, assignment)
        )
    );
    const reviewComments = program.submissions.flatMap(
      (submission: (typeof program.submissions)[number]) =>
        submission.reviewComments.map((comment: (typeof submission.reviewComments)[number]) => ({
          id: comment.id,
          submissionId: submission.id,
          authorUserId: comment.author.id,
          authorName: comment.author.name,
          body: comment.body,
          createdAt: comment.createdAt.toISOString()
        }))
    );
    const submissionSummaries = program.submissions.map(
      (submission: (typeof program.submissions)[number]) => {
        const submissionReport = reportsByRevisionId.get(submission.revisionId) ?? null;
        const openAssignmentCount = submission.reviewAssignments.filter(
          (assignment: (typeof submission.reviewAssignments)[number]) =>
            assignment.status !== 'approved'
        ).length;
        const overdueAssignmentCount = submission.reviewAssignments.filter(
          (assignment: (typeof submission.reviewAssignments)[number]) =>
            this.isAssignmentOverdue(assignment.dueAt, assignment.status)
        ).length;

        return {
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
          context: this.buildProgramEvaluationContext(
            submissionReport?.evaluation ?? submission.evaluation
          ),
          deterministicSummary: this.buildProgramDeterministicSummary(
            submissionReport,
            submission.evaluation
          ),
          scoreInterpretation: submissionReport?.dashboard.scoreInterpretation ?? null,
          topMaterialTopics: this.buildProgramMaterialTopicPreview(submissionReport),
          recommendationsPreview: this.buildProgramRecommendationPreview(submissionReport),
          reviewChecklist: this.buildProgramReviewChecklist(submissionReport, submission),
          openAssignmentCount,
          overdueAssignmentCount,
          latestDecisionRationale: this.getLatestDecisionRationale(submission.reviewComments),
          reportSnapshotHref: `/app/evaluate/${submission.evaluation.id}/revisions/${submission.revisionNumber}`,
          submittedAt: submission.submittedAt ? submission.submittedAt.toISOString() : null,
          lastReviewedAt: submission.lastReviewedAt ? submission.lastReviewedAt.toISOString() : null
        };
      }
    );
    const reviewerWorkloads = this.buildReviewerWorkloads(reviewAssignments);
    const cohortSummary = this.buildProgramCohortSummary(submissionSummaries);

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
      submissions: submissionSummaries,
      reviewAssignments,
      reviewComments,
      availableEvaluations: availableEvaluations.map(
        (evaluation: (typeof availableEvaluations)[number]) => {
          const evaluationReport =
            reportsByRevisionId.get(evaluation.currentRevisionId ?? '') ?? null;

          return {
            evaluationId: evaluation.id,
            name: evaluation.name,
            status: evaluation.status,
            context: this.buildProgramEvaluationContext(evaluationReport?.evaluation ?? evaluation),
            deterministicSummary: this.buildProgramDeterministicSummary(
              evaluationReport,
              evaluation
            ),
            currentRevisionNumber: evaluation.currentRevisionNumber,
            updatedAt: evaluation.updatedAt.toISOString()
          };
        }
      ),
      cohortSummary,
      reviewerWorkloads
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

    await this.prismaService.$transaction(async (transaction) => {
      await transaction.programSubmission.update({
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

      if (payload.rationale?.trim()) {
        await transaction.reviewComment.create({
          data: {
            submissionId,
            authorUserId: currentUser.id,
            body: `Decision rationale: ${payload.rationale.trim()}`
          }
        });
      }
    });

    await this.auditService.log({
      actorId: currentUser.id,
      action: 'evaluation.context_updated',
      targetType: 'program_submission',
      targetId: submissionId,
      metadata: {
        programId,
        submissionStatus: payload.status,
        hasRationale: Boolean(payload.rationale?.trim())
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

  private resolveLocale(locale?: string) {
    const value = locale?.trim().toLowerCase();
    return value && value.length >= 2 ? value : 'en';
  }

  private getPreferredLocales(locale: string) {
    return locale === 'en' ? ['en'] : [locale, 'en'];
  }

  private pickPreferredLocale<T extends { id: string; locale: string }, K extends string | number>(
    items: T[],
    getKey: (item: T) => K,
    locale: string
  ): T[] {
    const preferred = new Map<K, string>();
    const fallback = new Map<K, string>();

    for (const item of items) {
      const key = getKey(item);
      if (item.locale === locale) {
        preferred.set(key, item.id);
        continue;
      }

      if (!fallback.has(key)) {
        fallback.set(key, item.id);
      }
    }

    return items.filter((item) => {
      const key = getKey(item);
      if (item.locale === locale) {
        return preferred.get(key) === item.id;
      }

      return !preferred.has(key) && fallback.get(key) === item.id;
    });
  }

  private buildSitePageData(payload: UpsertSitePagePayload): Prisma.SitePageUncheckedCreateInput {
    return {
      slug: payload.slug,
      locale: payload.locale,
      title: payload.title,
      summary: payload.summary,
      pageType: payload.pageType,
      status: payload.status,
      heroEyebrow: payload.heroEyebrow ?? null,
      heroTitle: payload.heroTitle ?? null,
      heroBody: payload.heroBody ?? null,
      heroPrimaryCtaLabel: payload.heroPrimaryCtaLabel ?? null,
      heroPrimaryCtaHref: payload.heroPrimaryCtaHref ?? null,
      heroSecondaryCtaLabel: payload.heroSecondaryCtaLabel ?? null,
      heroSecondaryCtaHref: payload.heroSecondaryCtaHref ?? null,
      heroMediaAssetId: payload.heroMediaAssetId ?? null,
      navigationLabel: payload.navigationLabel ?? null,
      navigationGroup: payload.navigationGroup ?? null,
      showInPrimaryNav: payload.showInPrimaryNav,
      showInFooter: payload.showInFooter,
      canonicalUrl: payload.canonicalUrl ?? null,
      seoTitle: payload.seoTitle ?? null,
      seoDescription: payload.seoDescription ?? null,
      sections: payload.sections as Prisma.InputJsonValue,
      sortOrder: payload.sortOrder
    };
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

  private buildReferenceMetadata() {
    return getReferenceMetadata();
  }

  private serializeReviewAssignment(
    submissionId: string,
    assignment: {
      id: string;
      reviewer: { id: string; name: string };
      status: string;
      dueAt: Date | null;
      decidedAt: Date | null;
    }
  ): ProgramDetail['reviewAssignments'][number] {
    return {
      id: assignment.id,
      submissionId,
      reviewerUserId: assignment.reviewer.id,
      reviewerName: assignment.reviewer.name,
      status: assignment.status as 'pending' | 'in_review' | 'changes_requested' | 'approved',
      dueAt: assignment.dueAt ? assignment.dueAt.toISOString() : null,
      decidedAt: assignment.decidedAt ? assignment.decidedAt.toISOString() : null,
      isOverdue: this.isAssignmentOverdue(assignment.dueAt, assignment.status)
    };
  }

  private isAssignmentOverdue(dueAt: Date | null, status: string) {
    if (!dueAt) {
      return false;
    }

    return status !== 'approved' && dueAt.getTime() < Date.now();
  }

  private buildProgramReviewChecklist(
    report: ReportResponse | null,
    submission: {
      reviewAssignments: Array<{ status: string; dueAt: Date | null }>;
      reviewComments: Array<{ body: string }>;
    }
  ): ProgramDetail['submissions'][number]['reviewChecklist'] {
    const readyArtifacts =
      report?.evaluation.artifacts.filter((artifact) => artifact.status === 'ready').length ?? 0;
    const commentCount = submission.reviewComments.length;
    const assignmentCount = submission.reviewAssignments.length;
    const overdueCount = submission.reviewAssignments.filter((assignment) =>
      this.isAssignmentOverdue(assignment.dueAt, assignment.status)
    ).length;
    const materialTopics = report?.dashboard.materialAlerts.length ?? 0;
    const recommendations = report?.dashboard.recommendations.length ?? 0;

    return [
      {
        key: 'report_snapshot',
        label: 'Immutable report snapshot available',
        completed: Boolean(report),
        detail: report
          ? 'Reviewer and founder views are reading the same saved revision payload.'
          : 'The revision snapshot could not be resolved yet.'
      },
      {
        key: 'score_interpretation',
        label: 'Workbook score bands available',
        completed: Boolean(report?.dashboard.scoreInterpretation?.bands.length),
        detail: report?.dashboard.scoreInterpretation?.subtitle ?? null
      },
      {
        key: 'material_topics',
        label: 'Material topics highlighted',
        completed: materialTopics > 0,
        detail:
          materialTopics > 0
            ? `${materialTopics} material topics surfaced in the saved dashboard.`
            : 'No material topics surfaced for this revision yet.'
      },
      {
        key: 'recommendations',
        label: 'Recommendations ready for action',
        completed: recommendations > 0,
        detail:
          recommendations > 0
            ? `${recommendations} recommendation items are available to review.`
            : 'No recommendations were generated for this revision.'
      },
      {
        key: 'review_thread',
        label: 'Review workflow active',
        completed: assignmentCount > 0 || commentCount > 0,
        detail:
          assignmentCount > 0 || commentCount > 0
            ? `${assignmentCount} assignments and ${commentCount} review comments recorded.`
            : 'No reviewer assignment or comment has been recorded yet.'
      },
      {
        key: 'evidence_exports',
        label: 'Evidence or export artifacts available',
        completed: readyArtifacts > 0,
        detail:
          readyArtifacts > 0
            ? `${readyArtifacts} ready artifact(s) are attached to the saved evaluation state.`
            : overdueCount > 0
              ? `${overdueCount} assignment(s) are overdue and no ready export artifact is attached.`
              : 'No ready artifact is attached to this revision yet.'
      }
    ];
  }

  private getLatestDecisionRationale(
    comments: Array<{ body: string; createdAt: Date }>
  ): string | null {
    const rationaleComment = [...comments]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .find((comment) => comment.body.startsWith('Decision rationale:'));

    if (!rationaleComment) {
      return null;
    }

    return rationaleComment.body.replace(/^Decision rationale:\s*/i, '').trim() || null;
  }

  private buildReviewerWorkloads(
    assignments: ProgramDetail['reviewAssignments']
  ): ProgramDetail['reviewerWorkloads'] {
    const workloads = new Map<string, ProgramDetail['reviewerWorkloads'][number]>();

    for (const assignment of assignments) {
      const existing = workloads.get(assignment.reviewerUserId) ?? {
        reviewerUserId: assignment.reviewerUserId,
        reviewerName: assignment.reviewerName,
        pendingCount: 0,
        inReviewCount: 0,
        changesRequestedCount: 0,
        approvedCount: 0,
        overdueCount: 0
      };

      if (assignment.status === 'pending') {
        existing.pendingCount += 1;
      } else if (assignment.status === 'in_review') {
        existing.inReviewCount += 1;
      } else if (assignment.status === 'changes_requested') {
        existing.changesRequestedCount += 1;
      } else if (assignment.status === 'approved') {
        existing.approvedCount += 1;
      }

      if (assignment.isOverdue) {
        existing.overdueCount += 1;
      }

      workloads.set(assignment.reviewerUserId, existing);
    }

    return [...workloads.values()].sort((left, right) => {
      const leftActive = left.pendingCount + left.inReviewCount + left.changesRequestedCount;
      const rightActive = right.pendingCount + right.inReviewCount + right.changesRequestedCount;

      if (rightActive !== leftActive) {
        return rightActive - leftActive;
      }

      return left.reviewerName.localeCompare(right.reviewerName);
    });
  }

  private buildProgramCohortSummary(
    submissions: ProgramDetail['submissions']
  ): ProgramDetail['cohortSummary'] {
    const statusOrder: ProgramDetail['cohortSummary']['submissionFunnel'][number]['status'][] = [
      'draft',
      'submitted',
      'in_review',
      'changes_requested',
      'approved',
      'archived'
    ];
    const confidenceOrder: NonNullable<
      ProgramDetail['submissions'][number]['deterministicSummary']['confidenceBand']
    >[] = ['high', 'moderate', 'low'];
    const metricSubmissions = submissions.filter(
      (submission) =>
        submission.deterministicSummary.financialTotal !== null &&
        submission.deterministicSummary.riskOverall !== null &&
        submission.deterministicSummary.opportunityOverall !== null
    );
    const topicAggregate = new Map<
      TopicCode,
      {
        topicCode: TopicCode;
        title: string;
        appearances: number;
        highPriorityCount: number;
        relevantCount: number;
        totalScore: number;
      }
    >();
    const recommendationAggregate = new Map<
      string,
      { title: string; source: string; severityBand: string; appearances: number }
    >();

    for (const submission of submissions) {
      for (const topic of submission.topMaterialTopics) {
        const current = topicAggregate.get(topic.topicCode) ?? {
          topicCode: topic.topicCode,
          title: topic.title,
          appearances: 0,
          highPriorityCount: 0,
          relevantCount: 0,
          totalScore: 0
        };
        current.appearances += 1;
        current.totalScore += topic.score;
        if (topic.priorityBand === 'high_priority') {
          current.highPriorityCount += 1;
        }
        if (topic.priorityBand === 'relevant') {
          current.relevantCount += 1;
        }
        topicAggregate.set(topic.topicCode, current);
      }

      for (const recommendation of submission.recommendationsPreview) {
        const key = `${recommendation.title}|${recommendation.source}|${recommendation.severityBand}`;
        const current = recommendationAggregate.get(key) ?? {
          title: recommendation.title,
          source: recommendation.source,
          severityBand: recommendation.severityBand,
          appearances: 0
        };
        current.appearances += 1;
        recommendationAggregate.set(key, current);
      }
    }

    return {
      submissionFunnel: statusOrder.map((status) => ({
        status,
        count: submissions.filter((submission) => submission.submissionStatus === status).length
      })),
      confidenceDistribution: confidenceOrder.map((band) => ({
        band,
        count: submissions.filter(
          (submission) => submission.deterministicSummary.confidenceBand === band
        ).length
      })),
      averageFinancialTotal: metricSubmissions.length
        ? Number(
            (
              metricSubmissions.reduce(
                (sum, submission) => sum + (submission.deterministicSummary.financialTotal ?? 0),
                0
              ) / metricSubmissions.length
            ).toFixed(2)
          )
        : null,
      averageRiskOverall: metricSubmissions.length
        ? Number(
            (
              metricSubmissions.reduce(
                (sum, submission) => sum + (submission.deterministicSummary.riskOverall ?? 0),
                0
              ) / metricSubmissions.length
            ).toFixed(2)
          )
        : null,
      averageOpportunityOverall: metricSubmissions.length
        ? Number(
            (
              metricSubmissions.reduce(
                (sum, submission) =>
                  sum + (submission.deterministicSummary.opportunityOverall ?? 0),
                0
              ) / metricSubmissions.length
            ).toFixed(2)
          )
        : null,
      recurringTopics: [...topicAggregate.values()]
        .sort(
          (left, right) =>
            right.appearances - left.appearances || right.totalScore - left.totalScore
        )
        .slice(0, 6)
        .map((topic) => ({
          topicCode: topic.topicCode,
          title: topic.title,
          appearances: topic.appearances,
          highPriorityCount: topic.highPriorityCount,
          relevantCount: topic.relevantCount,
          averageScore: Number((topic.totalScore / topic.appearances).toFixed(2))
        })),
      recommendationPatterns: [...recommendationAggregate.values()]
        .sort(
          (left, right) =>
            right.appearances - left.appearances || left.title.localeCompare(right.title)
        )
        .slice(0, 6)
        .map((pattern) => ({
          title: pattern.title,
          source: pattern.source,
          severityBand: pattern.severityBand,
          appearances: pattern.appearances
        }))
    };
  }

  private serializeSitePage(page: {
    id: string;
    slug: string;
    locale: string;
    title: string;
    summary: string;
    pageType: string;
    status: string;
    heroEyebrow: string | null;
    heroTitle: string | null;
    heroBody: string | null;
    heroPrimaryCtaLabel: string | null;
    heroPrimaryCtaHref: string | null;
    heroSecondaryCtaLabel: string | null;
    heroSecondaryCtaHref: string | null;
    heroMediaAssetId: string | null;
    heroMediaAsset?: {
      id: string;
      slug: string;
      title: string;
      altText: string;
      caption: string | null;
      attribution: string | null;
      rights: string | null;
      mimeType: string;
      fileName: string;
      byteSize: number;
      width: number | null;
      height: number | null;
      focalPointX: number | null;
      focalPointY: number | null;
      storageKey: string | null;
      publicUrl: string | null;
      locale: string;
      status: string;
      updatedAt: Date;
    } | null;
    navigationLabel: string | null;
    navigationGroup: string | null;
    showInPrimaryNav: boolean;
    showInFooter: boolean;
    canonicalUrl: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    sections: Prisma.JsonValue | null;
    sortOrder: number;
    updatedAt: Date;
  }): SitePage {
    return {
      id: page.id,
      slug: page.slug,
      locale: page.locale,
      title: page.title,
      summary: page.summary,
      pageType: page.pageType as SitePage['pageType'],
      status: page.status as ContentStatus,
      heroEyebrow: page.heroEyebrow,
      heroTitle: page.heroTitle,
      heroBody: page.heroBody,
      heroPrimaryCtaLabel: page.heroPrimaryCtaLabel,
      heroPrimaryCtaHref: page.heroPrimaryCtaHref,
      heroSecondaryCtaLabel: page.heroSecondaryCtaLabel,
      heroSecondaryCtaHref: page.heroSecondaryCtaHref,
      heroMediaAssetId: page.heroMediaAssetId,
      heroMediaAsset: page.heroMediaAsset ? this.serializeMediaAsset(page.heroMediaAsset) : null,
      navigationLabel: page.navigationLabel,
      navigationGroup: page.navigationGroup,
      showInPrimaryNav: page.showInPrimaryNav,
      showInFooter: page.showInFooter,
      canonicalUrl: page.canonicalUrl,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      sections: Array.isArray(page.sections) ? (page.sections as SitePage['sections']) : [],
      sortOrder: page.sortOrder,
      updatedAt: page.updatedAt.toISOString()
    };
  }

  private serializeSiteSetting(setting: {
    id: string;
    key: string;
    locale: string;
    title: string | null;
    description: string | null;
    value: Prisma.JsonValue;
    updatedAt: Date;
  }): SiteSetting {
    return {
      id: setting.id,
      key: setting.key,
      locale: setting.locale,
      title: setting.title,
      description: setting.description,
      value: setting.value,
      updatedAt: setting.updatedAt.toISOString()
    };
  }

  private serializeContentRevision(revision: {
    id: string;
    entityType: string;
    entityId: string;
    locale: string | null;
    changeSummary: string | null;
    snapshot: Prisma.JsonValue;
    createdByUserId: string | null;
    createdAt: Date;
  }): ContentRevisionSummary {
    return {
      id: revision.id,
      entityType: ContentEntityTypeSchema.parse(revision.entityType),
      entityId: revision.entityId,
      locale: revision.locale,
      changeSummary: revision.changeSummary,
      snapshot: revision.snapshot,
      createdByUserId: revision.createdByUserId,
      createdAt: revision.createdAt.toISOString()
    };
  }

  private async recordContentRevision(
    entityType: ContentEntityType,
    entityId: string,
    snapshot: unknown,
    createdByUserId: string | null,
    changeSummary: string | null
  ) {
    const locale =
      snapshot && typeof snapshot === 'object' && 'locale' in snapshot
        ? ((snapshot.locale as string | null | undefined) ?? null)
        : null;

    await this.prismaService.contentRevision.create({
      data: {
        entityType,
        entityId,
        locale,
        changeSummary,
        snapshot: snapshot as Prisma.InputJsonValue,
        createdByUserId
      }
    });
  }

  private serializeSiteSettings(
    settings: Array<{ key: string; value: Prisma.JsonValue }>
  ): SiteSettings {
    const map = new Map(settings.map((setting) => [setting.key, setting.value]));

    return {
      announcement:
        typeof map.get('site_announcement') === 'string'
          ? (map.get('site_announcement') as string)
          : null,
      primaryNavigation: Array.isArray(map.get('site_primary_navigation'))
        ? (map.get('site_primary_navigation') as SiteSettings['primaryNavigation'])
        : [],
      footerColumns: Array.isArray(map.get('site_footer_columns'))
        ? (map.get('site_footer_columns') as SiteSettings['footerColumns'])
        : [],
      footerNote:
        typeof map.get('site_footer_note') === 'string'
          ? (map.get('site_footer_note') as string)
          : null,
      fundingNote:
        typeof map.get('site_funding_note') === 'string'
          ? (map.get('site_funding_note') as string)
          : null,
      contactEmail:
        typeof map.get('site_contact_email') === 'string'
          ? (map.get('site_contact_email') as string)
          : null,
      contactLinks: Array.isArray(map.get('site_contact_links'))
        ? (map.get('site_contact_links') as SiteSettings['contactLinks'])
        : []
    };
  }

  private serializeMediaAsset(asset: {
    id: string;
    slug: string;
    title: string;
    altText: string;
    caption: string | null;
    attribution: string | null;
    rights: string | null;
    mimeType: string;
    fileName: string;
    byteSize: number;
    width: number | null;
    height: number | null;
    focalPointX: number | null;
    focalPointY: number | null;
    storageKey: string | null;
    publicUrl: string | null;
    locale: string;
    status: string;
    updatedAt: Date;
  }): MediaAsset {
    return {
      id: asset.id,
      slug: asset.slug,
      title: asset.title,
      altText: asset.altText,
      caption: asset.caption,
      attribution: asset.attribution,
      rights: asset.rights,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
      byteSize: asset.byteSize,
      width: asset.width,
      height: asset.height,
      focalPointX: asset.focalPointX,
      focalPointY: asset.focalPointY,
      storageKey: asset.storageKey,
      publicUrl: asset.publicUrl,
      locale: asset.locale,
      status: asset.status as ContentStatus,
      updatedAt: asset.updatedAt.toISOString()
    };
  }

  private parseReportSnapshot(snapshot: Prisma.JsonValue): ReportResponse | null {
    const parsed = ReportResponseSchema.safeParse(snapshot);
    return parsed.success ? parsed.data : null;
  }

  private buildProgramEvaluationContext(source: {
    country: string | null;
    currentStage: string;
    businessCategoryMain: string | null;
    businessCategorySubcategory: string | null;
    extendedNaceCode: string | null;
    extendedNaceLabel: string | null;
    naceDivision: string;
  }) {
    return {
      country: source.country,
      currentStage:
        source.currentStage as ProgramDetail['submissions'][number]['context']['currentStage'],
      businessCategoryMain: source.businessCategoryMain,
      businessCategorySubcategory: source.businessCategorySubcategory,
      extendedNaceCode: source.extendedNaceCode,
      extendedNaceLabel: source.extendedNaceLabel,
      naceDivision: source.naceDivision
    };
  }

  private buildProgramDeterministicSummary(
    report: ReportResponse | null,
    fallback: {
      financialTotal: number;
      riskOverall: number;
      opportunityOverall: number;
      confidenceBand: string;
    }
  ) {
    return {
      financialTotal: report?.dashboard.financialTotal ?? fallback.financialTotal,
      riskOverall: report?.dashboard.riskOverall ?? fallback.riskOverall,
      opportunityOverall: report?.dashboard.opportunityOverall ?? fallback.opportunityOverall,
      confidenceBand:
        report?.dashboard.confidenceBand ??
        (fallback.confidenceBand as ProgramDetail['submissions'][number]['deterministicSummary']['confidenceBand'])
    };
  }

  private buildProgramMaterialTopicPreview(report: ReportResponse | null) {
    return (report?.dashboard.materialAlerts ?? []).slice(0, 3).map((topic) => ({
      topicCode: topic.topicCode,
      title: topic.title,
      score: topic.score,
      priorityBand: topic.priorityBand,
      recommendation: topic.recommendation
    }));
  }

  private buildProgramRecommendationPreview(report: ReportResponse | null) {
    return (report?.dashboard.recommendations ?? []).slice(0, 3).map((recommendation) => ({
      id: recommendation.id,
      title: recommendation.title,
      text: recommendation.text,
      source: recommendation.source,
      severityBand: recommendation.severityBand,
      rationale: recommendation.rationale
    }));
  }

  private serializePartnerLead(lead: {
    id: string;
    organizationId: string | null;
    programId: string | null;
    name: string;
    organizationName: string;
    email: string;
    websiteUrl: string | null;
    message: string;
    status: string;
    assigneeName: string | null;
    assigneeEmail: string | null;
    notes: string | null;
    sourcePage: string;
    resolvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): PartnerLeadSummary {
    return {
      id: lead.id,
      organizationId: lead.organizationId,
      programId: lead.programId,
      name: lead.name,
      organizationName: lead.organizationName,
      email: lead.email,
      websiteUrl: lead.websiteUrl,
      message: lead.message,
      status: lead.status as PartnerLeadSummary['status'],
      assigneeName: lead.assigneeName,
      assigneeEmail: lead.assigneeEmail,
      notes: lead.notes,
      sourcePage: lead.sourcePage,
      resolvedAt: lead.resolvedAt?.toISOString() ?? null,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString()
    };
  }

  private toCsvCell(value: string) {
    return `"${value.replaceAll('"', '""')}"`;
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

  private async readSeededReferenceResource(resource: {
    slug: string;
    fileName: string | null;
    mimeType: string | null;
  }) {
    const relativePath = referenceResourceFallbacks[resource.slug];

    if (!relativePath) {
      return null;
    }

    const absolutePath = path.resolve(process.cwd(), relativePath);

    try {
      return {
        fileName: resource.fileName ?? path.basename(absolutePath),
        mimeType: resource.mimeType ?? 'application/octet-stream',
        content: await readFile(absolutePath)
      };
    } catch {
      return null;
    }
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
