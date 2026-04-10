import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CommonInfrastructureModule } from '../common/infrastructure/common-infrastructure.module';
import { validateEnvironment } from '../common/config/environment.validation';
import { readBooleanConfig } from '../common/config/boolean-config';
import { CsrfMiddleware } from '../common/middleware/csrf.middleware';
import { OriginGuardMiddleware } from '../common/middleware/origin-guard.middleware';
import { RequestContextMiddleware } from '../common/middleware/request-context.middleware';
import { SessionMiddleware } from '../common/middleware/session.middleware';
import { AdminModule } from './admin/admin.module';
import { AdminController } from './admin/admin.controller';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { AuthController } from './auth/auth.controller';
import { GovernanceModule } from './governance/governance.module';
import { HealthModule } from './health/health.module';
import { HealthController } from './health/health.controller';
import { CoreMetricsModule } from './observability/core-metrics.module';
import { ObservabilityModule } from './observability/observability.module';
import { PrismaModule } from './prisma/prisma.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { EvaluationsController } from './evaluations/evaluations.controller';
import { IdentityModule } from './identity/identity.module';
import { IdentityController, ScimController } from './identity/identity.controller';
import { PlatformModule } from './platform/platform.module';
import { PlatformController } from './platform/platform.controller';
import { UsersModule } from './users/users.module';
import { UsersController } from './users/users.controller';

const internalSurfacesEnabled = readBooleanConfig(process.env.ENABLE_INTERNAL_SURFACES, false);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment
    }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_LIMIT_WINDOW_MS ?? '60000'),
        limit: Number(process.env.RATE_LIMIT_MAX ?? '120')
      }
    ]),
    ScheduleModule.forRoot(),
    CommonInfrastructureModule,
    CoreMetricsModule,
    PrismaModule,
    ...(internalSurfacesEnabled ? [ObservabilityModule] : []),
    AuditModule,
    ...(internalSurfacesEnabled ? [GovernanceModule] : []),
    AuthModule,
    ...(internalSurfacesEnabled ? [IdentityModule] : []),
    UsersModule,
    ...(internalSurfacesEnabled ? [AdminModule] : []),
    EvaluationsModule,
    PlatformModule,
    HealthModule
  ],
  providers: [
    RequestContextMiddleware,
    SessionMiddleware,
    OriginGuardMiddleware,
    CsrfMiddleware,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestContextMiddleware, SessionMiddleware, OriginGuardMiddleware, CsrfMiddleware)
      .forRoutes(
        ...[
          AuthController,
          UsersController,
          EvaluationsController,
          PlatformController,
          HealthController,
          ...(internalSurfacesEnabled ? [IdentityController, AdminController, ScimController] : [])
        ]
      );
  }
}
