import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EvaluationNarrativeSourceReferenceSchema } from '@packages/shared';
import { z } from 'zod';
import { InternalServiceGuard } from '../../common/guards/internal-service.guard';
import { parseZodSchema } from '../../common/validation/zod-validation';
import { EvaluationsService } from './evaluations.service';

const evaluationIdParamsSchema = z.object({
  id: z.string()
});

const artifactParamsSchema = z.object({
  artifactId: z.string()
});

const narrativeParamsSchema = z.object({
  narrativeId: z.string()
});

const renderReportQuerySchema = z.object({
  revisionNumber: z.coerce.number().int().min(1).optional()
});

const markArtifactReadyBodySchema = z.object({
  storageKey: z.string().min(1),
  checksumSha256: z.string().min(1),
  byteSize: z.number().int().nonnegative()
});

const markFailureBodySchema = z.object({
  errorMessage: z.string().min(1)
});

const markNarrativeReadyBodySchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  promptVersion: z.string().min(1),
  inputTokens: z.number().int().nonnegative().optional().nullable(),
  outputTokens: z.number().int().nonnegative().optional().nullable(),
  estimatedCostUsd: z.number().nonnegative().optional().nullable(),
  content: z.string().min(1),
  sourceReferences: z.array(EvaluationNarrativeSourceReferenceSchema).default([])
});

@ApiTags('internal-evaluations')
@ApiHeader({ name: 'x-internal-service-token', required: true })
@UseGuards(InternalServiceGuard)
@Controller('internal/evaluations')
export class EvaluationsInternalController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Get(':id/report')
  @ApiOperation({ summary: 'Get an immutable report snapshot for internal rendering jobs' })
  getReportForRender(@Param() params: unknown, @Query() query: unknown) {
    const parsedParams = parseZodSchema(evaluationIdParamsSchema, params);
    const parsedQuery = parseZodSchema(renderReportQuerySchema, query);
    return this.evaluationsService.getInternalRenderReport(
      parsedParams.id,
      parsedQuery.revisionNumber
    );
  }

  @Get('artifacts/:artifactId/job-data')
  @ApiOperation({ summary: 'Get queued artifact job data' })
  getArtifactJobData(@Param() params: unknown) {
    return this.evaluationsService.getInternalArtifactJobData(
      parseZodSchema(artifactParamsSchema, params).artifactId
    );
  }

  @Post('artifacts/:artifactId/processing')
  @ApiOperation({ summary: 'Mark an artifact job as processing' })
  markArtifactProcessing(@Param() params: unknown) {
    return this.evaluationsService.markArtifactProcessing(
      parseZodSchema(artifactParamsSchema, params).artifactId
    );
  }

  @Post('artifacts/:artifactId/ready')
  @ApiOperation({ summary: 'Mark an artifact job as ready' })
  markArtifactReady(@Param() params: unknown, @Body() body: unknown) {
    return this.evaluationsService.markArtifactReady(
      parseZodSchema(artifactParamsSchema, params).artifactId,
      parseZodSchema(markArtifactReadyBodySchema, body)
    );
  }

  @Post('artifacts/:artifactId/failed')
  @ApiOperation({ summary: 'Mark an artifact job as failed' })
  markArtifactFailed(@Param() params: unknown, @Body() body: unknown) {
    const parsedBody = parseZodSchema(markFailureBodySchema, body);
    return this.evaluationsService.markArtifactFailed(
      parseZodSchema(artifactParamsSchema, params).artifactId,
      parsedBody.errorMessage
    );
  }

  @Get('narratives/:narrativeId/job-data')
  @ApiOperation({ summary: 'Get queued narrative job data' })
  getNarrativeJobData(@Param() params: unknown) {
    return this.evaluationsService.getInternalNarrativeJobData(
      parseZodSchema(narrativeParamsSchema, params).narrativeId
    );
  }

  @Post('narratives/:narrativeId/processing')
  @ApiOperation({ summary: 'Mark a narrative job as processing' })
  markNarrativeProcessing(@Param() params: unknown) {
    return this.evaluationsService.markNarrativeProcessing(
      parseZodSchema(narrativeParamsSchema, params).narrativeId
    );
  }

  @Post('narratives/:narrativeId/ready')
  @ApiOperation({ summary: 'Mark a narrative job as ready' })
  markNarrativeReady(@Param() params: unknown, @Body() body: unknown) {
    return this.evaluationsService.markNarrativeReady(
      parseZodSchema(narrativeParamsSchema, params).narrativeId,
      parseZodSchema(markNarrativeReadyBodySchema, body)
    );
  }

  @Post('narratives/:narrativeId/failed')
  @ApiOperation({ summary: 'Mark a narrative job as failed' })
  markNarrativeFailed(@Param() params: unknown, @Body() body: unknown) {
    const parsedBody = parseZodSchema(markFailureBodySchema, body);
    return this.evaluationsService.markNarrativeFailed(
      parseZodSchema(narrativeParamsSchema, params).narrativeId,
      parsedBody.errorMessage
    );
  }
}
