import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export function parseZodSchema<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  payload: unknown
): z.infer<TSchema> {
  const result = schema.safeParse(payload);

  if (result.success) {
    return result.data;
  }

  throw new BadRequestException({
    message: 'Validation failed',
    errors: result.error.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join('.') : 'request',
      code: issue.code,
      message: issue.message
    }))
  });
}
