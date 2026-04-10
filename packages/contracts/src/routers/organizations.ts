import { initContract } from '@ts-rest/core';
import {
  OrganizationDetailSchema,
  OrganizationListResponseSchema,
  OrganizationParamsSchema
} from '@packages/shared';
const c = initContract();

export const organizationsContract = c.router(
  {
    list: {
      method: 'GET',
      path: '/',
      responses: {
        200: OrganizationListResponseSchema
      }
    },
    get: {
      method: 'GET',
      path: '/:organizationId',
      pathParams: OrganizationParamsSchema,
      responses: {
        200: OrganizationDetailSchema
      }
    }
  },
  {
    pathPrefix: '/organizations',
    strictStatusCodes: true
  }
);
