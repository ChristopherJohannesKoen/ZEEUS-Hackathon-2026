import { Module } from '@nestjs/common';
import { InternalServiceGuard } from '../../common/guards/internal-service.guard';
import { AuditModule } from '../audit/audit.module';
import { IdempotencyModule } from '../idempotency/idempotency.module';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsInternalController } from './evaluations.internal.controller';
import { EvaluationJobsService } from './evaluation-jobs.service';
import { EvaluationStorageService } from './evaluation-storage.service';
import { EvaluationsService } from './evaluations.service';

@Module({
  imports: [AuditModule, IdempotencyModule],
  controllers: [EvaluationsController, EvaluationsInternalController],
  providers: [
    EvaluationsService,
    EvaluationJobsService,
    EvaluationStorageService,
    InternalServiceGuard
  ]
})
export class EvaluationsModule {}
