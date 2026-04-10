import { initContract } from '@ts-rest/core';
import {
  AuthPayloadSchema,
  AuthResponseSchema,
  BreakGlassLoginPayloadSchema,
  CsrfResponseSchema,
  ForgotPasswordPayloadSchema,
  ForgotPasswordResponseSchema,
  OkResponseSchema,
  ResetPasswordPayloadSchema,
  RevokeSessionResponseSchema,
  SessionIdParamsSchema,
  SessionListResponseSchema,
  SignupPayloadSchema,
  SsoProvidersResponseSchema,
  StepUpPayloadSchema,
  StepUpResponseSchema
} from '@packages/shared';
import { csrfHeaderSchema, idempotencyHeaderSchema } from '../shared';

const c = initContract();

export const authContract = c.router(
  {
    signup: {
      method: 'POST',
      path: '/signup',
      body: SignupPayloadSchema,
      headers: idempotencyHeaderSchema,
      responses: {
        201: AuthResponseSchema
      }
    },
    login: {
      method: 'POST',
      path: '/login',
      body: AuthPayloadSchema,
      responses: {
        200: AuthResponseSchema
      }
    },
    logout: {
      method: 'POST',
      path: '/logout',
      body: c.noBody(),
      headers: csrfHeaderSchema,
      responses: {
        200: OkResponseSchema
      }
    },
    csrf: {
      method: 'GET',
      path: '/csrf',
      responses: {
        200: CsrfResponseSchema
      }
    },
    me: {
      method: 'GET',
      path: '/me',
      responses: {
        200: AuthResponseSchema
      }
    },
    ssoProviders: {
      method: 'GET',
      path: '/sso/providers',
      responses: {
        200: SsoProvidersResponseSchema
      }
    },
    listSessions: {
      method: 'GET',
      path: '/sessions',
      responses: {
        200: SessionListResponseSchema
      }
    },
    revokeSession: {
      method: 'DELETE',
      path: '/sessions/:sessionId',
      pathParams: SessionIdParamsSchema,
      headers: csrfHeaderSchema,
      responses: {
        200: RevokeSessionResponseSchema
      }
    },
    forgotPassword: {
      method: 'POST',
      path: '/password/forgot',
      body: ForgotPasswordPayloadSchema,
      responses: {
        200: ForgotPasswordResponseSchema
      }
    },
    resetPassword: {
      method: 'POST',
      path: '/password/reset',
      body: ResetPasswordPayloadSchema,
      headers: idempotencyHeaderSchema,
      responses: {
        200: AuthResponseSchema
      }
    },
    breakGlassLogin: {
      method: 'POST',
      path: '/break-glass/login',
      body: BreakGlassLoginPayloadSchema,
      responses: {
        200: AuthResponseSchema
      }
    },
    stepUp: {
      method: 'POST',
      path: '/step-up',
      body: StepUpPayloadSchema,
      headers: csrfHeaderSchema,
      responses: {
        200: StepUpResponseSchema
      }
    },
    logoutAll: {
      method: 'POST',
      path: '/logout-all',
      body: c.noBody(),
      headers: csrfHeaderSchema,
      responses: {
        200: OkResponseSchema
      }
    }
  },
  {
    pathPrefix: '/auth',
    strictStatusCodes: true
  }
);
