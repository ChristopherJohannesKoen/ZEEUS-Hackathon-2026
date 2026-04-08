import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { ApiCookieAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateEvidenceAssetPayloadSchema,
  CreateScenarioRunPayloadSchema,
  EvaluationIdParamsSchema,
  OrganizationParamsSchema,
  SdgGoalParamsSchema,
  ProgramParamsSchema
} from '@packages/shared';
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
}
