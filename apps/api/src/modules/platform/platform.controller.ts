import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
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
  CreateEvidenceAssetPayloadSchema,
  CreateProgramSubmissionPayloadSchema,
  CreateReviewAssignmentPayloadSchema,
  CreateReviewCommentPayloadSchema,
  CreateScenarioRunPayloadSchema,
  EvidenceAssetParamsSchema,
  EvaluationIdParamsSchema,
  OrganizationParamsSchema,
  SdgGoalParamsSchema,
  ProgramParamsSchema,
  ProgramSubmissionParamsSchema,
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
  getSiteContent() {
    return this.platformService.getSiteContent();
  }

  @Get('content/sdgs/:goalNumber')
  @ApiOperation({ summary: 'Get a goal-level SDG explainer with official targets' })
  getSdgGoal(@Param() params: unknown) {
    return this.platformService.getSdgGoal(parseZodSchema(SdgGoalParamsSchema, params).goalNumber);
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
