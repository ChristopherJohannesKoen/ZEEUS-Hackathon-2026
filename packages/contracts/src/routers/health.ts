import { initContract } from '@ts-rest/core';
import { HealthResponseSchema } from '@packages/shared';
const c = initContract();

export const healthContract = c.router(
  {
    status: {
      method: 'GET',
      path: '/health',
      responses: {
        200: HealthResponseSchema
      },
      summary: 'API and database health status'
    }
  },
  {
    strictStatusCodes: true
  }
);
