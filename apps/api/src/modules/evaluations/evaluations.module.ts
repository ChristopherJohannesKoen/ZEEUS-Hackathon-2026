import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { IdempotencyModule } from '../idempotency/idempotency.module';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';

@Module({
  imports: [AuditModule, IdempotencyModule],
  controllers: [EvaluationsController],
  providers: [EvaluationsService]
})
export class EvaluationsModule {}
