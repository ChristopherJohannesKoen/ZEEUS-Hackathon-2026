import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Res,
  UseGuards
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  CreateEvaluationPayloadSchema,
  EvaluationIdParamsSchema,
  SaveStage1TopicsPayloadSchema,
  SaveStage2OpportunitiesPayloadSchema,
  SaveStage2RisksPayloadSchema,
  Stage1FinancialAnswersPayloadSchema,
  UpdateEvaluationContextPayloadSchema
} from '@packages/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SessionGuard } from '../../common/guards/session.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { parseZodSchema } from '../../common/validation/zod-validation';
import { EvaluationsService } from './evaluations.service';

@ApiTags('evaluations')
@ApiCookieAuth()
@UseGuards(SessionGuard)
@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Get()
  @ApiOperation({ summary: 'List the current user evaluation drafts and completed reports' })
  listEvaluations(@CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>) {
    return this.evaluationsService.listEvaluations(currentUser);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new evaluation draft with default answer rows' })
  createEvaluation(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Body() body: unknown
  ) {
    return this.evaluationsService.createEvaluation(
      currentUser,
      parseZodSchema(CreateEvaluationPayloadSchema, body)
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single evaluation with all raw answers and derived summaries' })
  getEvaluation(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown
  ) {
    return this.evaluationsService.getEvaluation(
      currentUser,
      parseZodSchema(EvaluationIdParamsSchema, params).id
    );
  }

  @Patch(':id/context')
  @ApiOperation({ summary: 'Update the startup context for an evaluation' })
  updateContext(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    return this.evaluationsService.updateContext(
      currentUser,
      parseZodSchema(EvaluationIdParamsSchema, params).id,
      parseZodSchema(UpdateEvaluationContextPayloadSchema, body)
    );
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get the initial SDG summary generated from stage and NACE context' })
  getSummary(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown
  ) {
    return this.evaluationsService.getSummary(
      currentUser,
      parseZodSchema(EvaluationIdParamsSchema, params).id
    );
  }

  @Put(':id/stage-1/financial')
  @ApiOperation({ summary: 'Save deterministic Stage I financial answers and recompute totals' })
  saveStage1Financial(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    return this.evaluationsService.saveStage1Financial(
      currentUser,
      parseZodSchema(EvaluationIdParamsSchema, params).id,
      parseZodSchema(Stage1FinancialAnswersPayloadSchema, body)
    );
  }

  @Put(':id/stage-1/topics')
  @ApiOperation({ summary: 'Save Stage I environmental, social, and governance topic answers' })
  saveStage1Topics(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    return this.evaluationsService.saveStage1Topics(
      currentUser,
      parseZodSchema(EvaluationIdParamsSchema, params).id,
      parseZodSchema(SaveStage1TopicsPayloadSchema, body)
    );
  }

  @Put(':id/stage-2/risks')
  @ApiOperation({ summary: 'Save Stage II outside-in risk answers' })
  saveStage2Risks(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    return this.evaluationsService.saveStage2Risks(
      currentUser,
      parseZodSchema(EvaluationIdParamsSchema, params).id,
      parseZodSchema(SaveStage2RisksPayloadSchema, body)
    );
  }

  @Put(':id/stage-2/opportunities')
  @ApiOperation({ summary: 'Save Stage II opportunity answers' })
  saveStage2Opportunities(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    return this.evaluationsService.saveStage2Opportunities(
      currentUser,
      parseZodSchema(EvaluationIdParamsSchema, params).id,
      parseZodSchema(SaveStage2OpportunitiesPayloadSchema, body)
    );
  }

  @Get(':id/impact-summary')
  @ApiOperation({ summary: 'Get the impact summary view for an evaluation' })
  getImpactSummary(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown
  ) {
    return this.evaluationsService.getImpactSummary(
      currentUser,
      parseZodSchema(EvaluationIdParamsSchema, params).id
    );
  }

  @Get(':id/sdg-alignment')
  @ApiOperation({ summary: 'Get the merged SDG alignment output for an evaluation' })
  getSdgAlignment(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown
  ) {
    return this.evaluationsService.getSdgAlignment(
      currentUser,
      parseZodSchema(EvaluationIdParamsSchema, params).id
    );
  }

  @Get(':id/dashboard')
  @ApiOperation({ summary: 'Get the dashboard aggregates and recommendations for an evaluation' })
  getDashboard(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown
  ) {
    return this.evaluationsService.getDashboard(
      currentUser,
      parseZodSchema(EvaluationIdParamsSchema, params).id
    );
  }

  @Get(':id/report')
  @ApiOperation({ summary: 'Get the full report payload used by the print-friendly report route' })
  getReport(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown
  ) {
    return this.evaluationsService.getReport(
      currentUser,
      parseZodSchema(EvaluationIdParamsSchema, params).id
    );
  }

  @Get(':id/export.csv')
  @ApiProduces('text/csv')
  @ApiOperation({ summary: 'Export raw answers and computed scores for a single evaluation as CSV' })
  async exportCsv(
    @CurrentUser() currentUser: NonNullable<AuthenticatedRequest['currentUser']>,
    @Param() params: unknown,
    @Res() response: Response
  ) {
    const evaluationId = parseZodSchema(EvaluationIdParamsSchema, params).id;
    response.setHeader('Content-Type', 'text/csv');
    response.setHeader('Content-Disposition', `attachment; filename="evaluation-${evaluationId}.csv"`);
    await this.evaluationsService.exportCsv(currentUser, evaluationId, response);
  }
}
