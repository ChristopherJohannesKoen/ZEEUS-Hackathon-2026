import { ApiErrorSchema } from '@packages/shared';
import { z } from 'zod';

export const csrfHeaderSchema = z.object({
  'x-csrf-token': z.string().min(1)
});

export const idempotencyHeaderSchema = z.object({
  'idempotency-key': z.string().min(1)
});

export const commonResponses = {
  400: ApiErrorSchema,
  401: ApiErrorSchema,
  403: ApiErrorSchema,
  404: ApiErrorSchema,
  409: ApiErrorSchema,
  429: ApiErrorSchema,
  500: ApiErrorSchema,
  503: ApiErrorSchema
};
