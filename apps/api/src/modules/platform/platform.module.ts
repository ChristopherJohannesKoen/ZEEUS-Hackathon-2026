import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { IdempotencyModule } from '../idempotency/idempotency.module';
import { EvaluationStorageService } from '../evaluations/evaluation-storage.service';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({
  imports: [AuditModule, IdempotencyModule],
  controllers: [PlatformController],
  providers: [PlatformService, EvaluationStorageService],
  exports: [PlatformService]
})
export class PlatformModule {}
