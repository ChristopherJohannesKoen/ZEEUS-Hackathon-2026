import { initContract } from '@ts-rest/core';
import {
  UpdateRolePayloadSchema,
  UserIdParamsSchema,
  UserListQuerySchema,
  UserListResponseSchema,
  UserSummarySchema
} from '@packages/shared';
import { csrfHeaderSchema } from '../shared';

const c = initContract();

export const adminContract = c.router(
  {
    listUsers: {
      method: 'GET',
      path: '/users',
      query: UserListQuerySchema,
      responses: {
        200: UserListResponseSchema
      }
    },
    updateUserRole: {
      method: 'PATCH',
      path: '/users/:id/role',
      pathParams: UserIdParamsSchema,
      body: UpdateRolePayloadSchema,
      headers: csrfHeaderSchema,
      responses: {
        200: UserSummarySchema
      }
    }
  },
  {
    pathPrefix: '/admin',
    strictStatusCodes: true
  }
);
