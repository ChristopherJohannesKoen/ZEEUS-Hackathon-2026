import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class InternalServiceGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const configuredToken = process.env.INTERNAL_SERVICE_TOKEN;

    if (!configuredToken) {
      throw new ServiceUnavailableException('Internal service token is not configured.');
    }

    const providedToken = request.header('x-internal-service-token');

    if (!providedToken || providedToken !== configuredToken) {
      throw new ForbiddenException('Internal service token is invalid.');
    }

    return true;
  }
}
