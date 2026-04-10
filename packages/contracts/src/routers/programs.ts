import { initContract } from '@ts-rest/core';
import {
  CreateProgramSubmissionPayloadSchema,
  CreateReviewAssignmentPayloadSchema,
  CreateReviewCommentPayloadSchema,
  ProgramDetailSchema,
  ProgramListResponseSchema,
  ProgramParamsSchema,
  ProgramSubmissionParamsSchema,
  UpdateProgramSubmissionStatusPayloadSchema
} from '@packages/shared';
import { csrfHeaderSchema, idempotencyHeaderSchema } from '../shared';

const c = initContract();

export const programsContract = c.router(
  {
    list: {
      method: 'GET',
      path: '/',
      responses: {
        200: ProgramListResponseSchema
      }
    },
    get: {
      method: 'GET',
      path: '/:programId',
      pathParams: ProgramParamsSchema,
      responses: {
        200: ProgramDetailSchema
      }
    },
    createSubmission: {
      method: 'POST',
      path: '/:programId/submissions',
      pathParams: ProgramParamsSchema,
      body: CreateProgramSubmissionPayloadSchema,
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        201: ProgramDetailSchema
      }
    },
    updateSubmissionStatus: {
      method: 'PUT',
      path: '/:programId/submissions/:submissionId',
      pathParams: ProgramSubmissionParamsSchema,
      body: UpdateProgramSubmissionStatusPayloadSchema,
      headers: csrfHeaderSchema,
      responses: {
        200: ProgramDetailSchema
      }
    },
    createReviewAssignment: {
      method: 'POST',
      path: '/:programId/submissions/:submissionId/assignments',
      pathParams: ProgramSubmissionParamsSchema,
      body: CreateReviewAssignmentPayloadSchema,
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        201: ProgramDetailSchema
      }
    },
    createReviewComment: {
      method: 'POST',
      path: '/:programId/submissions/:submissionId/comments',
      pathParams: ProgramSubmissionParamsSchema,
      body: CreateReviewCommentPayloadSchema,
      headers: csrfHeaderSchema.merge(idempotencyHeaderSchema),
      responses: {
        201: ProgramDetailSchema
      }
    }
  },
  {
    pathPrefix: '/programs',
    strictStatusCodes: true
  }
);
