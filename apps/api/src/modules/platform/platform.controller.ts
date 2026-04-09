import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiCookieAuth,
  ApiHeader,
  ApiOperation,
  ApiProduces,
  ApiTags
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ContentItemParamsSchema,
  ContentRevisionItemParamsSchema,
  ContentRevisionParamsSchema,
  CreateEvidenceAssetPayloadSchema,
  CreateProgramSubmissionPayloadSchema,
  LocaleQuerySchema,
  MediaAssetParamsSchema,
  PartnerLeadParamsSchema,
  SubmitPartnerInterestPayloadSchema,
  CreateReviewAssignmentPayloadSchema,
  CreateReviewCommentPayloadSchema,
  CreateScenarioRunPayloadSchema,
  EvidenceAssetParamsSchema,
  EvaluationIdParamsSchema,
  OrganizationParamsSchema,
  ProgramParamsSchema,
  ProgramSubmissionParamsSchema,
  ResourceAssetParamsSchema,
  SdgGoalParamsSchema,
  SitePageParamsSchema,
  SitePagePreviewTokenParamsSchema,
  SiteSettingParamsSchema,
  UpdateMediaAssetPayloadSchema,
  UpdatePartnerLeadPayloadSchema,
  UpsertCaseStudyPayloadSchema,
  UpsertFaqEntryPayloadSchema,
  UpsertKnowledgeArticlePayloadSchema,
  UpsertResourceAssetPayloadSchema,
  UpsertSitePagePayloadSchema,
  UpsertSiteSettingPayloadSchema,
  UpdateProgramSubmissionStatusPayloadSchema
} from '@packages/shared';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SessionGuard } from '../../common/guards/session.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { parseZodSchema } from '../../common/validation/zod-validation';
import { IdempotencyInterceptor } from '../idempotency/idempotency.interceptor';
import { PlatformService } from './platform.service';

@ApiTags('platform')
@Controller()
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('content/site')
  @ApiOperation({ summary: 'Get structured public content for the marketing and explainer site' })
  getSiteContent(@Query() query: unknown) {
    return this.platformService.getSiteContent(parseZodSchema(LocaleQuerySchema, query).locale);
  }

  @Get('content/sdgs/:goalNumber')
  @ApiOperation({ summary: 'Get a goal-level SDG explainer with official targets' })
  getSdgGoal(@Param() params: unknown, @Query() query: unknown) {
    return this.platformService.getSdgGoal(
      parseZodSchema(SdgGoalParamsSchema, params).goalNumber,
      parseZodSchema(LocaleQuerySchema, query).locale
    );
  }

  @Get('content/resources/:resourceId/download')
  @ApiProduces('application/octet-stream')
  @ApiOperation({ summary: 'Download a published resource asset' })
  async downloadResource(@Param() params: unknown, @Res() response: Response) {
    const parsed = parseZodSchema(ResourceAssetParamsSchema, params);
    const result = await this.platformService.downloadResource(parsed.resourceId);

    if (result.type === 'redirect') {
      response.redirect(result.location);
      return;
    }

    response.setHeader('Content-Type', result.mimeType);
    response.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    response.write(result.content);
    response.end();
  }

  @Post('content/partner-interest')
  @HttpCode(200)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Submit a public partner interest request' })
  submitPartnerInterest(@Body() body: unknown) {
    return this.platformService.submitPartnerInterest(
      parseZodSchema(SubmitPartnerInterestPayloadSchema, body)
    );
  }

  @Get('content/admin/overview')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Get the editorial workflow overview for owners and admins' })
  getEditorialOverview(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>
  ) {
    return this.platformService.getEditorialOverview(currentUser);
  }

  @Post('content/admin/site-pages')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Create a site page' })
  createSitePage(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Body() body: unknown
  ) {
    return this.platformService.createSitePage(
      currentUser,
      parseZodSchema(UpsertSitePagePayloadSchema, body)
    );
  }

  @Put('content/admin/site-pages/:contentId')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Update a site page' })
  updateSitePage(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    return this.platformService.updateSitePage(
      currentUser,
      parseZodSchema(SitePageParamsSchema, params).contentId,
      parseZodSchema(UpsertSitePagePayloadSchema, body)
    );
  }

  @Get('content/admin/revisions/:entityType/:entityId')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'List stored revision snapshots for a content entity' })
  listContentRevisions(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown
  ) {
    const parsed = parseZodSchema(ContentRevisionParamsSchema, params);
    return this.platformService.listContentRevisions(
      currentUser,
      parsed.entityType,
      parsed.entityId
    );
  }

  @Post('content/admin/site-pages/:contentId/revisions/:revisionId/restore')
  @HttpCode(200)
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Restore a site page from a stored revision snapshot' })
  restoreSitePageRevision(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown
  ) {
    const parsed = parseZodSchema(ContentRevisionItemParamsSchema, params);
    return this.platformService.restoreSitePageRevision(
      currentUser,
      parsed.contentId,
      parsed.revisionId
    );
  }

  @Post('content/admin/site-pages/:contentId/preview-token')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Create a time-limited preview token for a site page' })
  createSitePagePreviewToken(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown
  ) {
    return this.platformService.createSitePagePreviewToken(
      currentUser,
      parseZodSchema(SitePageParamsSchema, params).contentId
    );
  }

  @Get('content/preview/:token')
  @ApiOperation({ summary: 'Resolve a site-page preview token without publishing the page' })
  getPreviewSitePage(@Param() params: unknown) {
    return this.platformService.getPreviewSitePage(
      parseZodSchema(SitePagePreviewTokenParamsSchema, params).token
    );
  }

  @Post('content/admin/site-settings')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Create a site setting record' })
  createSiteSetting(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Body() body: unknown
  ) {
    return this.platformService.createSiteSetting(
      currentUser,
      parseZodSchema(UpsertSiteSettingPayloadSchema, body)
    );
  }

  @Put('content/admin/site-settings/:contentId')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Update a site setting record' })
  updateSiteSetting(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    return this.platformService.updateSiteSetting(
      currentUser,
      parseZodSchema(SiteSettingParamsSchema, params).contentId,
      parseZodSchema(UpsertSiteSettingPayloadSchema, body)
    );
  }

  @Post('content/admin/media')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @UseInterceptors(IdempotencyInterceptor, FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Upload a site media asset' })
  uploadMediaAsset(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Body() body: Record<string, string | undefined>,
    @UploadedFile()
    file:
      | {
          buffer: Buffer;
          originalname: string;
          mimetype: string;
          size: number;
        }
      | undefined
  ) {
    if (!file) {
      throw new BadRequestException('A file is required.');
    }

    return this.platformService.uploadMediaAsset(currentUser, body, file);
  }

  @Put('content/admin/media/:mediaId')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Update media asset metadata' })
  updateMediaAsset(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    return this.platformService.updateMediaAsset(
      currentUser,
      parseZodSchema(MediaAssetParamsSchema, params).mediaId,
      parseZodSchema(UpdateMediaAssetPayloadSchema, body)
    );
  }

  @Get('content/media/:mediaId/file')
  @ApiProduces('application/octet-stream')
  @ApiOperation({ summary: 'Download or stream a media asset file' })
  async getMediaAssetFile(@Param() params: unknown, @Res() response: Response) {
    const parsed = parseZodSchema(MediaAssetParamsSchema, params);
    const result = await this.platformService.getMediaAssetFile(parsed.mediaId);

    if (result.type === 'redirect') {
      response.redirect(result.location);
      return;
    }

    response.setHeader('Content-Type', result.mimeType);
    response.setHeader('Content-Disposition', `inline; filename="${result.fileName}"`);
    response.write(result.content);
    response.end();
  }

  @Put('content/admin/partner-leads/:leadId')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Update partner lead workflow status' })
  updatePartnerLead(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    return this.platformService.updatePartnerLead(
      currentUser,
      parseZodSchema(PartnerLeadParamsSchema, params).leadId,
      parseZodSchema(UpdatePartnerLeadPayloadSchema, body)
    );
  }

  @Get('content/admin/partner-leads/export')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiProduces('text/csv')
  @ApiOperation({ summary: 'Export the current partner lead inbox as CSV' })
  async exportPartnerLeadsCsv(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Res() response: Response
  ) {
    const csv = await this.platformService.exportPartnerLeadsCsv(currentUser);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="zeeus-partner-leads.csv"'
    );
    response.send(csv);
  }

  @Post('content/admin/articles')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Create a knowledge article' })
  createKnowledgeArticle(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Body() body: unknown
  ) {
    return this.platformService.createKnowledgeArticle(
      currentUser,
      parseZodSchema(UpsertKnowledgeArticlePayloadSchema, body)
    );
  }

  @Put('content/admin/articles/:contentId')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Update a knowledge article' })
  updateKnowledgeArticle(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    return this.platformService.updateKnowledgeArticle(
      currentUser,
      parseZodSchema(ContentItemParamsSchema, params).contentId,
      parseZodSchema(UpsertKnowledgeArticlePayloadSchema, body)
    );
  }

  @Post('content/admin/faqs')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Create an FAQ entry' })
  createFaqEntry(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Body() body: unknown
  ) {
    return this.platformService.createFaqEntry(
      currentUser,
      parseZodSchema(UpsertFaqEntryPayloadSchema, body)
    );
  }

  @Put('content/admin/faqs/:contentId')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Update an FAQ entry' })
  updateFaqEntry(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    return this.platformService.updateFaqEntry(
      currentUser,
      parseZodSchema(ContentItemParamsSchema, params).contentId,
      parseZodSchema(UpsertFaqEntryPayloadSchema, body)
    );
  }

  @Post('content/admin/case-studies')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Create a case study' })
  createCaseStudy(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Body() body: unknown
  ) {
    return this.platformService.createCaseStudy(
      currentUser,
      parseZodSchema(UpsertCaseStudyPayloadSchema, body)
    );
  }

  @Put('content/admin/case-studies/:contentId')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Update a case study' })
  updateCaseStudy(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    return this.platformService.updateCaseStudy(
      currentUser,
      parseZodSchema(ContentItemParamsSchema, params).contentId,
      parseZodSchema(UpsertCaseStudyPayloadSchema, body)
    );
  }

  @Post('content/admin/resources')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Create a resource asset record' })
  createResourceAsset(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Body() body: unknown
  ) {
    return this.platformService.createResourceAsset(
      currentUser,
      parseZodSchema(UpsertResourceAssetPayloadSchema, body)
    );
  }

  @Put('content/admin/resources/:resourceId')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Update a resource asset record' })
  updateResourceAsset(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    return this.platformService.updateResourceAsset(
      currentUser,
      parseZodSchema(ResourceAssetParamsSchema, params).resourceId,
      parseZodSchema(UpsertResourceAssetPayloadSchema, body)
    );
  }

  @Post('content/admin/resources/:resourceId/upload')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @UseInterceptors(IdempotencyInterceptor, FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Upload a binary asset for a resource item' })
  uploadResourceAsset(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @UploadedFile()
    file:
      | {
          buffer: Buffer;
          originalname: string;
          mimetype: string;
          size: number;
        }
      | undefined
  ) {
    if (!file) {
      throw new BadRequestException('A file is required.');
    }

    return this.platformService.uploadResourceBinary(
      currentUser,
      parseZodSchema(ResourceAssetParamsSchema, params).resourceId,
      file
    );
  }

  @Get('organizations')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'List organizations visible to the current user' })
  listOrganizations(@CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>) {
    return this.platformService.listOrganizations(currentUser);
  }

  @Get('organizations/:organizationId')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Get an organization workspace summary for the current user' })
  getOrganization(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown
  ) {
    return this.platformService.getOrganization(
      currentUser,
      parseZodSchema(OrganizationParamsSchema, params).organizationId
    );
  }

  @Get('programs')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'List partner programs visible to the current user' })
  listPrograms(@CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>) {
    return this.platformService.listPrograms(currentUser);
  }

  @Get('programs/:programId')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Get a partner program view with submissions and review activity' })
  getProgram(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown
  ) {
    return this.platformService.getProgram(
      currentUser,
      parseZodSchema(ProgramParamsSchema, params).programId
    );
  }

  @Get('evaluations/:id/evidence')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'List evidence vault items for an evaluation' })
  listEvidence(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown
  ) {
    return this.platformService.listEvidence(
      currentUser,
      parseZodSchema(EvaluationIdParamsSchema, params).id
    );
  }

  @Post('evaluations/:id/evidence')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Create a new evidence-vault item for an evaluation' })
  createEvidence(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    return this.platformService.createEvidence(
      currentUser,
      parseZodSchema(EvaluationIdParamsSchema, params).id,
      parseZodSchema(CreateEvidenceAssetPayloadSchema, body)
    );
  }

  @Post('evaluations/:id/evidence/upload')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @UseInterceptors(IdempotencyInterceptor, FileInterceptor('file'))
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a binary evidence file to the evidence vault' })
  uploadEvidence(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @UploadedFile()
    file:
      | {
          buffer: Buffer;
          originalname: string;
          mimetype: string;
          size: number;
        }
      | undefined,
    @Body() body: Record<string, string | undefined>
  ) {
    if (!file) {
      throw new BadRequestException('A file is required.');
    }

    return this.platformService.uploadEvidenceFile(
      currentUser,
      parseZodSchema(EvaluationIdParamsSchema, params).id,
      file,
      parseZodSchema(CreateEvidenceAssetPayloadSchema.omit({ kind: true, sourceUrl: true }), {
        title: body.title,
        description: body.description || null,
        ownerName: body.ownerName || null,
        sourceDate: body.sourceDate || null,
        evidenceBasis: body.evidenceBasis,
        confidenceWeight: body.confidenceWeight ? Number(body.confidenceWeight) : null,
        linkedTopicCode: body.linkedTopicCode || null,
        linkedRecommendationId: body.linkedRecommendationId || null
      })
    );
  }

  @Get('evaluations/:id/evidence/:evidenceId/download')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiProduces('application/octet-stream')
  @ApiOperation({ summary: 'Download a binary evidence file' })
  downloadEvidence(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Res() response: Response
  ) {
    const parsed = parseZodSchema(EvidenceAssetParamsSchema, params);
    return this.platformService.downloadEvidence(
      currentUser,
      parsed.id,
      parsed.evidenceId,
      response
    );
  }

  @Get('evaluations/:id/scenarios')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'List advisory scenario runs for an evaluation' })
  listScenarios(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown
  ) {
    return this.platformService.listScenarios(
      currentUser,
      parseZodSchema(EvaluationIdParamsSchema, params).id
    );
  }

  @Post('evaluations/:id/scenarios')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Create an advisory scenario run from the current evaluation state' })
  createScenario(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    return this.platformService.createScenario(
      currentUser,
      parseZodSchema(EvaluationIdParamsSchema, params).id,
      parseZodSchema(CreateScenarioRunPayloadSchema, body)
    );
  }

  @Post('programs/:programId/submissions')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Submit an evaluation revision into a partner program' })
  createProgramSubmission(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    return this.platformService.createProgramSubmission(
      currentUser,
      parseZodSchema(ProgramParamsSchema, params).programId,
      parseZodSchema(CreateProgramSubmissionPayloadSchema, body)
    );
  }

  @Put('programs/:programId/submissions/:submissionId')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Update the review status of a program submission' })
  updateProgramSubmissionStatus(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    const parsedParams = parseZodSchema(ProgramSubmissionParamsSchema, params);
    return this.platformService.updateProgramSubmissionStatus(
      currentUser,
      parsedParams.programId,
      parsedParams.submissionId,
      parseZodSchema(UpdateProgramSubmissionStatusPayloadSchema, body)
    );
  }

  @Post('programs/:programId/submissions/:submissionId/assignments')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Assign a reviewer to a program submission' })
  createReviewAssignment(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    const parsedParams = parseZodSchema(ProgramSubmissionParamsSchema, params);
    return this.platformService.createReviewAssignment(
      currentUser,
      parsedParams.programId,
      parsedParams.submissionId,
      parseZodSchema(CreateReviewAssignmentPayloadSchema, body)
    );
  }

  @Post('programs/:programId/submissions/:submissionId/comments')
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Add a threaded review comment to a submission' })
  createReviewComment(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    const parsedParams = parseZodSchema(ProgramSubmissionParamsSchema, params);
    return this.platformService.createReviewComment(
      currentUser,
      parsedParams.programId,
      parsedParams.submissionId,
      parseZodSchema(CreateReviewCommentPayloadSchema, body)
    );
  }
}
