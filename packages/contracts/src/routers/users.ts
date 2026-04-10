import { initContract } from '@ts-rest/core';
import { UpdateProfilePayloadSchema, UserSummarySchema } from '@packages/shared';
import { csrfHeaderSchema } from '../shared';

const c = initContract();

export const usersContract = c.router(
  {
    me: {
      method: 'GET',
      path: '/me',
      responses: {
        200: UserSummarySchema
      }
    },
    updateMe: {
      method: 'PATCH',
      path: '/me',
      body: UpdateProfilePayloadSchema,
      headers: csrfHeaderSchema,
      responses: {
        200: UserSummarySchema
      }
    }
  },
  {
    pathPrefix: '/users',
    strictStatusCodes: true
  }
);
