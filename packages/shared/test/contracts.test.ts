import { describe, expect, it } from 'vitest';
import {
  ApiErrorSchema,
  AuthPayloadSchema,
  EvaluationArtifactStatusSchema,
  EvaluationStatusSchema,
  SessionUserSchema,
  SsoProvidersResponseSchema,
  SignupPayloadSchema
} from '../src/index';

describe('shared contracts', () => {
  it('accepts valid signup payloads', () => {
    const payload = SignupPayloadSchema.parse({
      name: 'Avery Parker',
      email: 'avery@example.com',
      password: 'password123'
    });

    expect(payload.email).toBe('avery@example.com');
  });

  it('rejects invalid auth payloads', () => {
    expect(() =>
      AuthPayloadSchema.parse({
        email: 'invalid',
        password: 'short'
      })
    ).toThrow();
  });

  it('accepts the supported evaluation lifecycle states', () => {
    expect(EvaluationStatusSchema.parse('draft')).toBe('draft');
    expect(EvaluationStatusSchema.parse('archived')).toBe('archived');
  });

  it('accepts the supported artifact lifecycle states', () => {
    expect(EvaluationArtifactStatusSchema.parse('pending')).toBe('pending');
    expect(EvaluationArtifactStatusSchema.parse('failed')).toBe('failed');
  });

  it('requires a valid session user payload', () => {
    expect(() =>
      SessionUserSchema.parse({
        id: 'user_1',
        email: 'owner@example.com',
        name: '',
        role: 'owner'
      })
    ).not.toThrow();
  });

  it('accepts API errors with machine-readable codes', () => {
    expect(() =>
      ApiErrorSchema.parse({
        statusCode: 403,
        message: 'Forbidden',
        code: 'forbidden',
        errors: [],
        requestId: 'request_1'
      })
    ).not.toThrow();
  });

  it('accepts explicit login-policy metadata for enterprise providers', () => {
    expect(() =>
      SsoProvidersResponseSchema.parse({
        providers: [
          {
            slug: 'enterprise-oidc',
            displayName: 'Acme SSO',
            type: 'oidc',
            status: 'active'
          }
        ],
        defaultProviderSlug: 'enterprise-oidc',
        localAuthEnabled: false,
        breakGlassEnabled: false
      })
    ).not.toThrow();
  });
});
