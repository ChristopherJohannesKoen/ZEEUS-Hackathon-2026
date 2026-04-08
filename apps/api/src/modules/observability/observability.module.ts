import { Module } from '@nestjs/common';
import { CoreMetricsModule } from './core-metrics.module';
import { MetricsController } from './metrics.controller';

@Module({
  imports: [CoreMetricsModule],
  controllers: [MetricsController],
  exports: [CoreMetricsModule]
})
export class ObservabilityModule {}
